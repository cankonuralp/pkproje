/* NEREDEN GELDİ: 2026-11-12 — reisim: "çevrimdışı kullanımı kusursuz çalışmalı ve sahada veri fotoğraf yazı vs kaybolmamalı kesinlikle özellikle burada
   say chat çok önemli ne gerekiyorsa yap uygulama dahil". Kod okuması şu kayıp yollarını buldu (hepsi kapandı, burada kilitli):
   · cihaz deposuna yazma "istek oldu" deyince bitmiş sayılıyordu — yer dolunca veritabanı işlemi SONRADAN geri alınır, iş yazılmamış olur;
   · yazılamayan iş (yer doldu) hata fırlatıyordu; S.A.Y Chat "Gönder" bunu beklemiyordu → mesaj ve fotoğraf sessizce kayboluyordu;
   · sunucu yerine ağ geçidinin "200" sayfası gelirse iş "yapılamadı"ya düşüp bir daha denenmiyordu;
   · gönderilmemiş yazı / seçilmiş fotoğraf yalnız ekranın belleğindeydi (telefon kamerayı açarken sayfayı atınca gidiyordu).
   Saf: cihaz deposu taklit (kuyrukDeposu), ağ taklit. Kaynak kilitleri dosyanın sonunda. Olumsuz kanıt: tests/bozan/kuyruk-kayipsiz.bozan.ts. */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { before, beforeEach, test } from "node:test";
import { iosMu } from "../src/components/cevrimdisi/kur.ts";
import { DAR_BAYT, boyutYaz, yerDurumu } from "../src/components/cevrimdisi/yer.ts";

type Istek = { id: string; tur: string; kayit: string; girdi: unknown };
let istekler: Istek[] = [];
let cevap: (g: Istek) => Response = () => { throw new TypeError("Failed to fetch"); };
const json = (o: object, status = 200) => new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json" } });

/* cihaz deposu taklidi: "dolu" iken yazma reddedilir (yer doldu) */
const depo = new Map<string, Record<string, unknown>>();
let dolu = false;
const kod = new TextEncoder(), coz = new TextDecoder();
const taklit = {
  ac: async () => ({}) as IDBDatabase,
  oku: async () => [...depo.values()] as never,
  yaz: async (_db: IDBDatabase, i: { id: string }) => { if (dolu) throw new DOMException("yer yok", "QuotaExceededError"); depo.set(i.id, { ...i }); },
  sil: async (_db: IDBDatabase, id: string) => { depo.delete(id); },
  sifrele: async (_db: IDBDatabase, v: unknown) => ({ iv: new Uint8Array(12), sifreli: kod.encode(JSON.stringify(v)).buffer as ArrayBuffer }),
  coz: async (_db: IDBDatabase, i: { sifreli: ArrayBuffer }) => JSON.parse(coz.decode(i.sifreli)) as unknown,
};

let K: typeof import("../src/components/cevrimdisi/kuyruk.ts");
before(async () => {
  Object.assign(globalThis, { window: new EventTarget() });
  globalThis.fetch = (async (_u: string, init: RequestInit) => { const g = JSON.parse(String(init.body)) as Istek; istekler.push(g); return cevap(g); }) as typeof fetch;
  K = await import("../src/components/cevrimdisi/kuyruk.ts");
  K.kuyrukDeposu(taklit);
  K.kuyrukYazani("etiketDeneme00000000000");
});
async function sakin() { for (let i = 0; i < 50 && K.kuyrukAnlik().gonderiliyor; i++) await new Promise((c) => setTimeout(c, 5)); await new Promise((c) => setTimeout(c, 5)); }
const agYok = () => { cevap = () => { throw new TypeError("Failed to fetch"); }; };
beforeEach(async () => {
  agYok(); dolu = false; await sakin();
  for (const x of K.kuyrukAnlik().isler) await K.kuyruktanCikar(x.id);
  depo.clear(); istekler = [];
});
const tamam = () => json({ tekrar: false, sonuc: { durum: "tamam" } });

test("yer dolu: iş KAYBOLMAZ — bellekte kalır, sayılır, içeriğiyle gider; cihaz deposuna yarım kayıt yazılmaz", async () => {
  dolu = true;
  await K.kuyrugaEkle({ tur: "chat.mesaj", kayit: "M1", surum: 0, girdi: { tur: "yazi", metin: "kazan dairesi" }, ad: "S.A.Y Chat · mesaj" });
  await sakin();
  const d = K.kuyrukAnlik();
  assert.deepEqual(d.isler.map((x) => [x.kayit, x.durum]), [["M1", "bekliyor"]], "iş listede");
  assert.equal(d.yazilamayan, 1, "cihaza yazılamadığı söylenir");
  assert.equal(d.depoYok, false, "depo var; yalnız bu iş yazılamadı");
  assert.equal(depo.size, 0);
  /* ekran içeriği görür (S.A.Y Chat bekleyen mesajı gösterir) */
  assert.deepEqual((await K.bekleyenIsler(["chat.mesaj"]))[0]!.girdi, { tur: "yazi", metin: "kazan dairesi" });
  /* bağlantı gelince içeriğiyle gider */
  cevap = tamam; istekler = [];
  assert.equal(await K.kuyrukGonder(), 1);
  assert.deepEqual(istekler.map((g) => [g.kayit, g.girdi]), [["M1", { tur: "yazi", metin: "kazan dairesi" }]]);
  assert.equal(K.kuyrukAnlik().isler.length, 0);
  assert.equal(K.kuyrukAnlik().yazilamayan, 0);
});

test("yer açılınca bellekteki iş kendiliğinden cihaza yazılır (içerik şifreli; bellek alanları depoya girmez)", async () => {
  dolu = true;
  await K.kuyrugaEkle({ tur: "chat.mesaj", kayit: "M2", surum: 0, girdi: { tur: "yazi", metin: "pano" }, ad: "S.A.Y Chat · mesaj" });
  await sakin();
  assert.equal(K.kuyrukAnlik().yazilamayan, 1);
  dolu = false;
  await K.kuyrukGonder();   // ağ yok: gönderemez ama cihaza yazar
  assert.equal(K.kuyrukAnlik().yazilamayan, 0);
  const k = [...depo.values()][0]!;
  assert.equal(k.kayit, "M2");
  assert.ok(!("girdi" in k) && !("bellekte" in k), "açık içerik depoya yazılmaz");
  assert.deepEqual(await taklit.coz({} as IDBDatabase, k as never), { tur: "yazi", metin: "pano" });
  assert.equal(K.kuyrukAnlik().isler[0]!.durum, "bekliyor");
});

test("form işi: yenisi cihaza yazılamadıysa eskisi depodan SİLİNMEZ (sayfa kapanırsa en azından önceki kayıt durur); yazıldıysa silinir", async () => {
  await K.kuyrugaEkle({ tur: "rapor.kaydet", kayit: "R1", surum: 3, girdi: { v: 1 }, ad: "Rapor kaydı" });
  await sakin();
  const eski = K.kuyrukAnlik().isler[0]!.id;
  assert.ok(depo.has(eski));
  dolu = true;
  await K.kuyrugaEkle({ tur: "rapor.kaydet", kayit: "R1", surum: 3, girdi: { v: 2 }, ad: "Rapor kaydı" });
  await sakin();
  assert.equal(K.kuyrukAnlik().isler.length, 1, "kuyrukta tek iş (yenisi)");
  assert.notEqual(K.kuyrukAnlik().isler[0]!.id, eski);
  assert.ok(depo.has(eski), "eski kayıt cihazda duruyor");
  assert.deepEqual((await K.bekleyenIcerik("R1"))!.girdi, { v: 2 }, "ekran yeniyi gösterir");
  dolu = false;
  await K.kuyrugaEkle({ tur: "rapor.kaydet", kayit: "R1", surum: 3, girdi: { v: 3 }, ad: "Rapor kaydı" });
  await sakin();
  const son = K.kuyrukAnlik().isler[0]!.id;
  assert.ok(depo.has(son) && K.kuyrukAnlik().yazilamayan === 0);
});

test("sunucunun anlaşılmayan 'oldu' yanıtı (JSON değil), süre aşımı ve hız sınırı işi düşürmez: bekler, sonra gider", async () => {
  await K.kuyrugaEkle({ tur: "chat.mesaj", kayit: "M3", surum: 0, girdi: { tur: "yazi", metin: "x" }, ad: "S.A.Y Chat · mesaj" });
  await sakin();
  for (const y of [() => new Response("<html>ağ geçidi</html>", { status: 200, headers: { "content-type": "text/html" } }), () => json({}, 200), () => json({}, 429), () => json({}, 408)]) {
    cevap = y;
    assert.equal(await K.kuyrukGonder(), 0);
    assert.deepEqual(K.kuyrukAnlik().isler.map((x) => x.durum), ["bekliyor"], "iş bekliyor (yapılamadı değil)");
  }
  cevap = tamam;
  assert.equal(await K.kuyrukGonder(), 1);
  assert.equal(depo.size, 0);
});

test("içeriği çözülemeyen (bozuk) iş kuyruğu kilitlemez: görünür kalır, sıradaki gider", async () => {
  await K.kuyrugaEkle({ tur: "chat.mesaj", kayit: "M4", surum: 0, girdi: { a: 1 }, ad: "S.A.Y Chat · mesaj" });
  await K.kuyrugaEkle({ tur: "chat.mesaj", kayit: "M5", surum: 0, girdi: { a: 2 }, ad: "S.A.Y Chat · mesaj" });
  await sakin();
  const bozukId = K.kuyrukAnlik().isler.find((x) => x.kayit === "M4")!.id;
  const asil = taklit.coz;
  K.kuyrukDeposu({ coz: async (db, i) => { if ((i as unknown as { id: string }).id === bozukId) throw new Error("bozuk"); return asil(db, i as never); } });
  try {
    cevap = tamam;
    assert.equal(await K.kuyrukGonder(), 1);
    assert.deepEqual(K.kuyrukAnlik().isler.map((x) => [x.kayit, x.durum]), [["M4", "hata"]]);
    assert.equal((await K.bekleyenIsler(["chat.mesaj"]))[0]!.girdi, null, "içeriksiz görünür, listeden düşmez");
  } finally { K.kuyrukDeposu({ coz: asil }); }
});

test("cihazda yer: dar eşiği (kalan < 100 MB ya da kullanım ≥ %80); boyut yazımı; bilinmeyen değer null", () => {
  const MB = 1024 * 1024;
  assert.deepEqual(yerDurumu(38 * MB, 1000 * MB), { yuzde: 4, kalan: 962 * MB, dar: false });
  assert.equal(yerDurumu(950 * MB, 1000 * MB)!.dar, true, "kalan 50 MB");
  assert.equal(yerDurumu(8000 * MB, 10_000 * MB)!.dar, true, "%80");
  assert.equal(yerDurumu(7900 * MB, 10_000 * MB)!.dar, false);
  assert.equal(yerDurumu(0, DAR_BAYT - 1)!.dar, true, "ayrılan yer zaten eşikten küçük");
  for (const [k, q] of [[1, 0], [NaN, 5], [-1, 5], [1, Infinity]] as const) assert.equal(yerDurumu(k, q), null);
  assert.deepEqual([boyutYaz(100), boyutYaz(38.4 * MB), boyutYaz(1229 * MB)], ["1 MB'tan az", "38 MB", "1,2 GB"]);
  assert.equal(iosMu("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)", 5), true);
  assert.equal(iosMu("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", 5), true, "iPad masaüstü kimliğiyle");
  assert.equal(iosMu("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", 0), false);
  assert.equal(iosMu("Mozilla/5.0 (Linux; Android 14)", 5), false);
});

/* ── KAYNAK KİLİTLERİ: tarayıcı deposu burada koşmaz; kuralların kodda durduğu satır satır denetlenir ── */
const oku = (d: string) => readFileSync(d, "utf8");
test("kaynak kilidi: depo yazması işlem TAMAMLANINCA biter ve diske indirilir; şema değişmedi; depo yeniden açılır", () => {
  const d = oku("src/components/cevrimdisi/depo.ts");
  assert.match(d, /db\.transaction\(bolme, "readwrite", \{ durability: "strict" \}\)/);
  assert.match(d, /t\.oncomplete = \(\) => coz\(\);[\s\S]{0,200}t\.onabort = \(\) => red\(/, "geri alınan işlem HATA");
  for (const ad of ["isYaz", "isSil"]) assert.match(d, new RegExp(`export async function ${ad}\\([^)]*\\): Promise<void> \\{\\s+const t = yazmaIslemi\\(db, ISLER\\), bitti = tamamlandi\\(t\\);[^}]+await bitti;`), ad);
  assert.match(d, /const SURUM = 2;/, "şema sürümü yükselmedi (eski servis çalışanı yükseltmeyi kilitlerdi)");
  assert.match(d, /function yenidenDenenir\(\) \{ setTimeout\(\(\) => \{ acik = null; \}, YENIDEN_AC_MS\); \}/);
  assert.match(d, /if \(!k \|\| k\.yazan !== yazan\) return null;/, "taslak kişiye bağlı");
});

test("kaynak kilidi: S.A.Y Chat ve Rapor modu kuyruğa yazılmasını BEKLER; taslak okunmadan yazılmaz; fotoğraf seçildiği an cihaza", () => {
  const s = oku("src/modules/say-chat/ui/Sohbet.tsx"), r = oku("src/modules/say-chat/ui/RaporModu.tsx"), f = oku("src/modules/raporlar/ui/SahaRaporu.tsx");
  assert.match(s, /await kuyrugaEkle\(\{ tur: "chat\.mesaj"/);
  assert.doesNotMatch(s, /is: kuyrugaEkle\(/, "beklenmeyen kuyruk yazımı yok");
  assert.match(s, /catch \{[\s\S]{0,200}setSecilen\(\(x\) => \[\.\.\.kalan, \.\.\.x\]\);\s+setYazi\(\(x\) => x \|\| metin\);/, "yazılamayan mesaj yazı alanına geri konur");
  for (const [ad, k] of [["Sohbet", s], ["RaporModu", r]] as const) {
    assert.match(k, /if \(!taslakOkundu\.current\) return;/, `${ad}: taslak okunmadan yazılmaz / silinmez`);
    assert.match(k, /void base64\(k\)\.then\(\(veri\) => taslakKaydet\(/, `${ad}: fotoğraf seçildiği an taslağa`);
  }
  assert.match(r, /await taslakTemizle\(\);\s+kapat\(\);/, "kayıt kuyruğa yazılınca taslak silinir");
  assert.match(f, /void taslakKaydet\(taslakAdi, \{ ekipman, tarih, cevaplar \}\), 1200\)/, "rapor formu yazarken taslağa");
  assert.match(f, /window\.addEventListener\("pagehide", kapaniyor\)/);
  assert.match(f, /const kaydedildi = \(\) => \{ setKirli\(false\); kirliRef\.current = false; setTaslaktan\(false\); void taslakSil\(taslakAdi\);/, "Kaydet taslağı siler");
  assert.match(f, /const taslagiBirak = async \(\) => \{ kirliRef\.current = false; await taslakSil\(taslakAdi\); window\.location\.reload\(\); \};/, "geri yüklenen taslak bırakılabilir");
});

test("kaynak kilidi: kurulabilir uygulama — bildirim dosyası geçerli, simgeler yerinde, yalnız firma uygulamasında; kuyruk kalıcı saklama ister", () => {
  const m = JSON.parse(oku("public/manifest.webmanifest")) as { name: string; display: string; start_url: string; scope: string; icons: { src: string; sizes: string; purpose: string }[] };
  assert.deepEqual([m.name, m.display, m.start_url, m.scope], ["probata", "standalone", "/", "/"]);
  assert.deepEqual(m.icons.map((i) => `${i.sizes} ${i.purpose}`), ["192x192 any", "512x512 any", "512x512 maskable"]);
  for (const i of [...m.icons.map((x) => x.src), "/ikon/apple-touch-icon.png"]) assert.ok(existsSync(`public${i}`), i);
  const d = oku("src/app/(uygulama)/layout.tsx");
  assert.match(d, /manifest: "\/manifest\.webmanifest"/);
  assert.match(d, /appleWebApp: \{ capable: true/);
  for (const baska of ["src/app/layout.tsx", "src/app/(musteri)/portal/layout.tsx", "src/app/(yonetim)/yonetim/(panel)/layout.tsx"]) {
    if (existsSync(baska)) assert.doesNotMatch(oku(baska), /manifest\.webmanifest/, baska);
  }
  const k = oku("src/components/cevrimdisi/kuyruk.ts");
  assert.match(k, /void kaliciIste\(\);/);
  assert.match(k, /document\.addEventListener\("visibilitychange", gorundu\)/, "sayfa öne gelince gönderir");
  assert.match(k, /window\.addEventListener\("beforeunload", kapaniyor\)/, "bellekteki işle sayfa kapanırken sorar");
});
