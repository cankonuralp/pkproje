/* NEREDEN GELDİ: K1 "tanım JSON'ları · API sürümü" (2026-10-04), ARKA-UC §2.1, 09-B6. Gerçek sunucuda: API sürüm başlığı, eski istemci 426, tanım dizini
   oturumsuz 403, karma adlı dosya sonsuz önbellekte, bilinmeyen karma 404. */
import { expect, test } from "@playwright/test";
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
  expect(Object.keys(dizin).sort()).toEqual(["durumlar", "egri_carpanlari", "mesai_sinirlari"]);
  const t = await page.goto(dizin.durumlar!);
  expect(t!.headers()["cache-control"]).toBe("private, max-age=31536000, immutable");
  expect((await t!.json()).plan.bekliyor.ad).toBe("Kabul bekliyor");
  expect((await page.goto("/api/tanim/durumlar.000000000000.json"))!.status()).toBe(404);
});
