/* NEREDEN GELDİ: 392 — çevrimdışı işlem ucu (/api/islem; 09-D2, ARKA-UC §4.3). Gerçek sunucuda, üç genişlikte kapılar: başka kökenden ya da
   kökensiz istek işten önce 403; JSON değilse 415; biçimsiz gövde 400; oturumsuz 401; işi yazan hesap oturumdaki hesap değilse 409 (iş yapılmaz,
   cihaz işi saklar); yalnız POST; önbellek yok. Tek seferlik işleme ve çakışma gerçek PostgreSQL kilidinde (tests/islem.test.ts); "bağlantı kes /
   gönder" uçtan ucu cihaz kuyruğuyla (sonraki kalem). */
import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { E2E_FIRMA, E2E_KAPI } from "./hesaplar";
import { girisli } from "./yardimci";

const KOK = `http://${E2E_FIRMA.kisaAd}.localhost:${E2E_KAPI}`;
const JSON_BASLIK = { "Content-Type": "application/json" };
/** yazan: başka birinin etiketi (biçimi doğru, oturumdakinin değil) */
const govde = () => ({ id: randomUUID(), tur: "rapor.kaydet", kayit: randomUUID(), yazan: "baskasininEtiketi00000", surum: 0, girdi: {}, zaman: new Date().toISOString() });

test("işlem ucu: köken, tür, biçim, oturum ve hesap kapıları; yalnız POST", async ({ page }) => {
  const r = page.request;
  /* kökensiz ve başka kökenden: işten önce 403 */
  expect((await r.post("/api/islem", { headers: JSON_BASLIK, data: govde() })).status()).toBe(403);
  expect((await r.post("/api/islem", { headers: { ...JSON_BASLIK, Origin: `http://baska.localhost:${E2E_KAPI}` }, data: govde() })).status()).toBe(403);
  /* JSON değil */
  expect((await r.post("/api/islem", { headers: { Origin: KOK, "Content-Type": "text/plain" }, data: JSON.stringify(govde()) })).status()).toBe(415);
  /* biçimsiz gövde (bilinmeyen iş türü) */
  expect((await r.post("/api/islem", { headers: { ...JSON_BASLIK, Origin: KOK }, data: { ...govde(), tur: "plan.sil" } })).status()).toBe(400);
  /* oturumsuz */
  const o = await r.post("/api/islem", { headers: { ...JSON_BASLIK, Origin: KOK }, data: govde() });
  expect(o.status()).toBe(401);
  expect(o.headers()["cache-control"]).toBe("no-store");
  /* oturumlu ama işi yazan hesap başka: iş yapılmaz */
  await girisli(page, "denetci");
  const h = await r.post("/api/islem", { headers: { ...JSON_BASLIK, Origin: KOK }, data: govde() });
  expect(h.status()).toBe(409);
  expect(await h.json()).toEqual({ hata: "baska_hesap" });
  /* yalnız POST */
  expect((await r.get("/api/islem")).status()).toBe(405);
});
