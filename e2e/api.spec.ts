/* NEREDEN GELDİ: K1 "tanım JSON'ları · API sürümü" (2026-10-04), ARKA-UC §2.1, 09-B6. Gerçek sunucuda: API sürüm başlığı, eski istemci 426, tanım dizini
   oturumsuz 403, karma adlı dosya sonsuz önbellekte, bilinmeyen karma 404. */
import { expect, test } from "@playwright/test";
import { E2E_KAPI, E2E_KENDI, E2E_KURULUM_EN_COK, E2E_SAGLIK_SIR, E2E_ZAMANLI_SIR, KENDI_VT_FIRMA_SAYISI } from "./hesaplar";
import { girisli } from "./yardimci";

test("API sürümü ve sabit tanımlar", async ({ page }) => {
  const s = await page.goto("/api/surum");
  expect(s!.status()).toBe(200);
  expect(await s!.json()).toEqual({ api: 1, enAzIstemci: 1 });
  expect(s!.headers()["x-probata-api"]).toBe("1");
  expect((await page.goto("/api/tanim/dizin"))!.status()).toBe(403);
  await page.setExtraHTTPHeaders({ "X-Probata-Istemci": "0" });
  expect((await page.goto("/api/tanim/dizin"))!.status()).toBe(426);
  await page.setExtraHTTPHeaders({});
  await girisli(page, "denetci");
  const d = await page.goto("/api/tanim/dizin");
  const dizin = await d!.json() as Record<string, string>;
  expect(Object.keys(dizin).sort()).toEqual(["durumlar", "egri_carpanlari", "ek3_gruplari", "mesai_sinirlari", "meslekler", "resmi_tatiller"]);
  const t = await page.goto(dizin.durumlar!);
  expect(t!.headers()["cache-control"]).toBe("private, max-age=31536000, immutable");
  expect((await t!.json()).plan.bekliyor.ad).toBe("Kabul bekliyor");
  expect((await page.goto("/api/tanim/durumlar.000000000000.json"))!.status()).toBe(404);
});

/* 350 (09-G5): sağlık ucu oturumsuz açılır, yalnız evet / hayır denetimleri ve sürüm taşır; göçleri uygulanmış veritabanında hepsi doğru
   2026-10-15 (FIRMA-VT FV7, kasıtlı beklenti değişikliği): denetimlere "firma_vt" eklendi — firma adresinde o firmanın veritabanı (veritabanı kimliği
   + göç güncel …); önceki beklenti altı anahtardı. Yanıtın BİÇİMİ adrese göre değişmez: ortak firma (deneme), kendi veritabanlı firma (kendivt), kök
   adres (127.0.0.1) ve bilinmeyen firma adresi aynı yedi anahtarı taşır — firma listesi / sayısı bu uçtan okunmaz (2026-10-15 FV7 incelemesi: iddia
   daraltıldı — sağlıklı durumda adresler ayırt edilmez; firma veritabanı sorunluyken firma_vt=false o adresi ele verir). */
const SAGLIK_TAMAM = {
  durum: "tamam", surum: "yerel",
  denetimler: { veritabani: true, goc_guncel: true, rls: true, api_kapali: true, uygulama_kisitli: true, isler: true, firma_vt: true },
};
test("sağlık ucu: bütün denetimler doğru, firma / kişi bilgisi yok", async ({ page }) => {
  const r = await page.goto("/api/saglik");
  expect(r!.status()).toBe(200);
  expect(r!.headers()["cache-control"]).toBe("no-store");
  const j = await r!.json();
  expect(j).toEqual(SAGLIK_TAMAM);
});

/* FV7: kendi veritabanlı firmanın adresinde o firmanın veritabanı denetlenir (uçtan uca sunucusunda aynı kümede ayrı veritabanı — göçleri güncel); kökte
   ve bilinmeyen adreste yalnız merkez — yanıt üçünde de aynı (biçim sızdırmaz) */
test("sağlık ucu her adreste aynı biçim: kendi veritabanlı firma, kök, bilinmeyen firma", async ({ page }) => {
  for (const adres of [`http://${E2E_KENDI.firma.kisaAd}.localhost:${E2E_KAPI}`, `http://127.0.0.1:${E2E_KAPI}`, `http://yok-boyle-firma.localhost:${E2E_KAPI}`]) {
    const r = await page.goto(`${adres}/api/saglik`);
    expect(r!.status(), adres).toBe(200);
    expect(r!.headers()["cache-control"]).toBe("no-store");
    expect(await r!.json(), adres).toEqual(SAGLIK_TAMAM);
  }
});

/* FV7: proje sağlığı ucu yalnız iki sırdan biriyle — kendi sırrı (PROBATA_SAGLIK_SIR; duman testi) ya da zamanlayıcının (CRON_SECRET); yanıt YALNIZ
   sayılar — kendi veritabanlı her firma yoklanır, hepsi sağlam (uçtan uca sunucusunun tohumladığı sayı: e2e/hesaplar.ts E2E_KENDI_FIRMALAR).
   2026-10-15 (FV7 incelemesi, en az yetki): sağlık sırrı gece işi ucunu AÇMAZ (duman makinesindeki sır gece işlerini tetikleyemez).
   2026-10-16 (FV10, kasıtlı): yönetim testi panelden kendi projeli firma kurar (genişlik başına bir; e2e/yonetim.spec.ts) — kurulumu bitmişse o da
   yoklanır: toplam tohumlananla tohumlanan + kurulabilecek arasında (sıra testlerin koşu sırasına bağlı), HEPSİ sağlam (tamam = toplam, sorunlu 0). */
test("proje sağlığı ucu: yalnız sırla; yalnız sayılar; sağlık sırrı gece işini açmaz", async ({ request }) => {
  expect((await request.get("/api/saglik/projeler")).status()).toBe(401);
  expect((await request.get("/api/saglik/projeler", { headers: { Authorization: "Bearer yanlis-sir-yanlis-sir-yanlis-sir-00" } })).status()).toBe(401);
  expect((await request.get("/api/saglik/projeler", { headers: { Authorization: E2E_SAGLIK_SIR } })).status()).toBe(401);   // "Bearer " olmadan
  for (const sir of [E2E_SAGLIK_SIR, E2E_ZAMANLI_SIR]) {
    const r = await request.get("/api/saglik/projeler", { headers: { Authorization: `Bearer ${sir}` } });
    expect(r.status(), sir === E2E_SAGLIK_SIR ? "sağlık sırrı" : "zamanlayıcı sırrı").toBe(200);
    expect(r.headers()["cache-control"]).toBe("no-store");
    const j = await r.json() as { toplam: number; tamam: number; sorunlu: number };
    expect(Object.keys(j).sort()).toEqual(["sorunlu", "tamam", "toplam"]);
    expect(j.toplam).toBeGreaterThanOrEqual(KENDI_VT_FIRMA_SAYISI);
    expect(j.toplam).toBeLessThanOrEqual(KENDI_VT_FIRMA_SAYISI + E2E_KURULUM_EN_COK);
    expect([j.tamam, j.sorunlu]).toEqual([j.toplam, 0]);
  }
  expect((await request.get("/api/is/gece", { headers: { Authorization: `Bearer ${E2E_SAGLIK_SIR}` } })).status(), "sağlık sırrı gece işini açmaz").toBe(401);
});

/* 378 (K5, 09-A5): gece işi ucu yalnız zamanlayıcının sırrıyla; sırsız / yanlış sırla 401 ve iş koşmaz; doğru sırla çöp temizliği ve saklama
   süresi işi (387) koşar, yanıt yalnız sayılar (firma / kişi bilgisi yok); ikinci koşu da "tamam" (iş bitince kilit kalkar). Uçtan uca: yol, ara
   katman, göç 0069 / 0073, veritabanı deposu
   2026-10-15 (FIRMA-VT FV3, kasıtlı): uçtan uca sunucusunda kendi veritabanlı bir firma var (e2e/hesaplar.ts E2E_KENDI; e2e/firma-vt.spec.ts) — gece
   işi onu merkezde dolaşıyor, vt_firma_dogrula'ya takılıyordu ("hata", 500).
   2026-10-16 (FV6): her firmanın adımı KENDİ havuzunda — iş yeniden "tamam" / 200, hatalı ve ulaşılamayan firma 0; kendi veritabanlı firma da
   dolaşılır (firma sayısı ≥ ortak firmalar + kendi veritabanlılar). Özet "ulasilamayan" sayısını taşır. */
test("gece işi ucu: yalnız sırla; sayılar döner; kendi veritabanlı firma da kendi veritabanında dolaşılır", async ({ request }) => {
  expect((await request.get("/api/is/gece")).status()).toBe(401);
  expect((await request.get("/api/is/gece", { headers: { Authorization: "Bearer yanlis-sir-yanlis-sir-yanlis-sir-00" } })).status()).toBe(401);
  expect((await request.get("/api/is/gece", { headers: { Authorization: E2E_ZAMANLI_SIR } })).status()).toBe(401);   // "Bearer " olmadan
  for (let i = 0; i < 2; i++) {
    const r = await request.get("/api/is/gece", { headers: { Authorization: `Bearer ${E2E_ZAMANLI_SIR}` } });
    expect(r.status()).toBe(200);
    expect(r.headers()["cache-control"]).toBe("no-store");
    const j = await r.json() as Record<string, unknown>;
    /* 2026-10-08 (387): saklama süresi işi aynı uçta, sayıları "saklama"da (süresi yaklaşan tohum raporu silinmez — 30 gün kala listede) */
    /* 2026-10-09 (432): bekleyen e-postaların yeniden denenmesi de aynı uçta, sayıları "eposta"da */
    expect(Object.keys(j).sort()).toEqual(["bagli", "bayt", "durum", "eposta", "firma", "hatali_firma", "kalan", "oksuz", "saklama", "silinen", "ulasilamayan"]);
    expect([j.durum, j.hatali_firma, j.ulasilamayan]).toEqual(["tamam", 0, 0]);
    expect(j.firma).toBeGreaterThanOrEqual(2 + KENDI_VT_FIRMA_SAYISI);
    const s = j.saklama as Record<string, unknown>;
    expect(Object.keys(s).sort()).toEqual(["bayt", "dosya", "durum", "firma", "hatali_firma", "kalan", "silinen", "ulasilamayan"]);
    expect([s.durum, s.hatali_firma, s.ulasilamayan, s.silinen]).toEqual(["tamam", 0, 0, 0]);
    const e = j.eposta as Record<string, unknown>;
    expect(Object.keys(e).sort()).toEqual(["bekleyen", "durum", "firma", "gonderilen", "hatali", "hatali_firma", "kalan", "ulasilamayan"]);
    expect([e.durum, e.hatali_firma, e.ulasilamayan]).toEqual(["tamam", 0, 0]);
  }
});
