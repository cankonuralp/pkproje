/* NEREDEN GELDİ: 395 — çevrimdışı servis çalışanı (public/sw.js; ARKA-UC §4.1, K4). Saf: cihaz deposunun şeması uygulamayla (depo.ts) aynı; yalnız saha
   sayfaları (Ana sayfa, Planlar, plan içi, rapor) saklanır — API, giriş, müşteri paneli, yönetim, PDF ASLA; yalnız aynı kökenden GET; sayfa CSP'si
   çalışana izin verir; saklama yanıtı bekletmez, sayfanın uygulama dosyaları önce saklanır, dosya önbelleği yolla anahtarlanır (399).
   401: cihazdaki sayfa sayısı sınırlı — 300'ü aşınca en eski açılanlar 250'ye inene kadar silinir (çalışanın kendi işlevi, sahte depoyla koşar).
   Uçtan uca (bağlantı kesilip sayfa yeniden yüklenerek): e2e/cevrimdisi.spec.ts. Olumsuz kanıt: tests/bozan/kilitler.bozan.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import { oku, swEksikleri } from "./yardimci/denetimler.ts";

test("servis çalışanı: depo şeması ortak, yalnız saha sayfaları, yalnız aynı kökenden GET, CSP izinli, saklama düzeni", () => {
  assert.deepEqual(swEksikleri(oku("public/sw.js"), oku("src/components/cevrimdisi/depo.ts"), oku("src/proxy.ts")), []);
});

/** IndexedDB bölmesinin en küçük taklidi: istekler sonraki turda biter; bekleyen istek kalmayınca işlem tamamlanır */
function sahteDepo(kayitlar: Map<string, { zaman: number }>) {
  let bekleyen = 0;
  const islem: { oncomplete: (() => void) | null; onerror: (() => void) | null; objectStore: () => unknown } = { oncomplete: null, onerror: null, objectStore: () => bolme };
  const bitir = () => { if (--bekleyen === 0) setImmediate(() => { if (bekleyen === 0) islem.oncomplete?.(); }); };
  const istek = <T,>(is: () => T) => {
    const r: { result?: T; onsuccess?: () => void; onerror?: () => void } = {};
    bekleyen++;
    setImmediate(() => { r.result = is(); r.onsuccess?.(); bitir(); });
    return r;
  };
  const bolme = {
    count: () => istek(() => kayitlar.size),
    delete: (k: string) => istek(() => { kayitlar.delete(k); }),
    openCursor: () => {
      const anahtarlar = [...kayitlar.keys()];
      let i = 0;
      const r: { result?: unknown; onsuccess?: () => void; onerror?: () => void } = {};
      bekleyen++;
      const ilerle = () => setImmediate(() => {
        const son = i >= anahtarlar.length;
        r.result = son ? null : { key: anahtarlar[i], value: kayitlar.get(anahtarlar[i]), continue: () => { i++; ilerle(); } };
        r.onsuccess?.();
        if (son) bitir();
      });
      ilerle();
      return r;
    },
  };
  return { transaction: () => islem };
}

test("401 cihazdaki sayfalar sınırlı: 300'e kadar dokunulmaz; aşınca en eski açılanlar 250'ye inene kadar silinir", async () => {
  const baglam: Record<string, unknown> = { self: { addEventListener: () => undefined, location: { origin: "https://deneme.example" } } };
  runInNewContext(`${oku("public/sw.js")}\n;globalThis.__kirp = sayfalariKirp;`, baglam);
  const kirp = baglam.__kirp as (db: unknown) => Promise<void>;
  const kayitlar = new Map<string, { zaman: number }>();
  for (let i = 0; i < 300; i++) kayitlar.set(`/raporlar/${i}`, { zaman: 1_000 + ((i * 7919) % 300) });
  await kirp(sahteDepo(kayitlar));
  assert.equal(kayitlar.size, 300, "sınırda silinmez");
  kayitlar.set("/planlar", { zaman: 5_000 });
  await kirp(sahteDepo(kayitlar));
  assert.equal(kayitlar.size, 250);
  const kalan = [...kayitlar.values()].map((x) => x.zaman);
  assert.ok(Math.min(...kalan) >= 1_000 + 51, "en eskiler silindi");
  assert.ok(kayitlar.has("/planlar"), "en yeni kaldı");
});
