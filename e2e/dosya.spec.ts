/* NEREDEN GELDİ: 09-A1, A2 (K1 2026-10-04) — tek indirme ucu gerçek sunucuda: oturumsuz istek 403; oturumlu ama bulunmayan / başka kaydın
   dosyası 404 (varlığı söylenmez); yanıtlar önbelleğe "no-store", sayfa CSP'si dosya ucunu ezmez. */
import { expect, test } from "@playwright/test";
import { girisli } from "./yardimci";

const KIMLIK = "00000000-0000-4000-8000-000000000000";

/* istekler tarayıcıdan (Node tarafı *.localhost çözemez; tarayıcı kendisi çözer) */
test("dosya ucu: oturumsuz 403, oturumlu bilinmeyen 404, bozuk kimlik 404", async ({ page }) => {
  const anonim = await page.goto(`/api/dosya/${KIMLIK}`);
  expect(anonim!.status()).toBe(403);
  expect(anonim!.headers()["cache-control"]).toBe("no-store");
  await girisli(page, "yonetici");
  for (const yol of [`/api/dosya/${KIMLIK}`, "/api/dosya/..%2F..%2Fetc%2Fpasswd", "/api/dosya/x"]) {
    const y = await page.goto(yol);
    expect(y!.status(), yol).toBe(404);
    expect(y!.headers()["x-content-type-options"]).toBe("nosniff");
  }
});
