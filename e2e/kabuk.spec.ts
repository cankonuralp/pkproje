/* NEREDEN GELDİ: K0 (2026-10-03) — uçtan uca düzenin ilk denetimi. Kabuk (yan menü + üst çubuk) her genişlikte çizilir,
   sayfa yatay kaymaz, başlık modül adını taşır. Maketin ölçüm denetimleri kodlandıkça bu klasöre taşınır (KOD-GECIS §11). */
import { expect, test } from "@playwright/test";

test("ana sayfa: kabuk çizilir, başlık doğru, yatay kayma yok", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/probata/);
  await expect(page.locator("nav").first()).toBeAttached();
  const genislik = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  expect(genislik[0]).toBeLessThanOrEqual(genislik[1]);
});
