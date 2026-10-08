/* NEREDEN GELDİ: 411 — CLAUDE.md §6 "Sonra: … görsel regresyon (referans ekran)", EKSIKLER-VE-ONERILER §6 ("kritik ekranlar için görsel anlık
   görüntü testi; elle ölçüm iyi ama tekrarlanabilir değil"). Donmuş referans ekran (Planlar + plan içi; src/styles/kalip.ts) üç genişlikte, açık ve
   koyu temada, sabit verili ayrı firmada (scripts/e2e-sunucu.ts E2E_GORSEL — numara, tarih, içerik bugünden bağımsız) çekilir ve kayıtlı görüntüyle
   karşılaştırılır (e2e/goruntu/<genişlik>/). Kasıtlı bir görsel değişiklikte görüntüler yeniden kaydedilir ve commit'e girer (gözden geçirilerek). */
import { expect, test, type Page } from "@playwright/test";
import { E2E_GORSEL, E2E_KAPI, E2E_PAROLA } from "./hesaplar";
import { hazir } from "./yardimci";

const Y = `http://${E2E_GORSEL.firma.kisaAd}.localhost:${E2E_KAPI}`;

/** sayfa durulsun: React bağlandı, yazı tipleri yüklendi, yan menünün balonları ve öteki istekler bitti */
async function dur(page: Page) {
  await hazir(page);
  await page.evaluate(async () => { await document.fonts.ready; });
  await page.waitForLoadState("networkidle");
}

for (const tema of ["light", "dark"] as const) {
  test(`görsel: referans ekran — Planlar ve plan içi (${tema === "light" ? "açık" : "koyu"} tema)`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.emulateMedia({ colorScheme: tema, reducedMotion: "reduce" });
    await page.goto(`${Y}/giris`);
    await hazir(page);
    await page.getByLabel("E-posta").fill(E2E_GORSEL.yonetici.eposta);
    await page.getByLabel("Parola", { exact: true }).fill(E2E_PAROLA);
    await page.getByRole("button", { name: "Giriş yap" }).click();
    await expect(page.locator("header")).toContainText(E2E_GORSEL.yonetici.ad);
    const ad = tema === "light" ? "acik" : "koyu";
    await page.goto(`${Y}/planlar`);
    await dur(page);
    await expect(page.getByRole("link", { name: E2E_GORSEL.plan, exact: true })).toBeVisible();
    await expect(page).toHaveScreenshot(`planlar-${ad}.png`, { fullPage: true });
    await page.getByRole("link", { name: E2E_GORSEL.plan, exact: true }).click();
    await expect(page).toHaveURL(/\/planlar\/[0-9a-f-]{36}$/, { timeout: 30_000 });
    await dur(page);
    await expect(page.getByRole("heading", { level: 2, name: "Kabul" })).toBeVisible();
    await expect(page).toHaveScreenshot(`plan-ici-${ad}.png`, { fullPage: true });
  });
}
