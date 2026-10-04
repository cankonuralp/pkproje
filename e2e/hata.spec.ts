/* NEREDEN GELDİ: K1 "hata sayfası" (2026-10-04). Beklenmeyen hata: tek cümle + "Yeniden dene" + "Ana sayfaya dön"; hatanın iç ayrıntısı (sorgu, yol)
   sayfada görünmez. (Geliştirmede Next'in hata katmanı ayrıca açılır; denetim sayfanın kendi içeriğinde — main.) */
import { expect, test } from "@playwright/test";

test("beklenmeyen hata: yol gösteren ekran, iç ayrıntı sızmaz", async ({ page }) => {
  await page.goto("/vitrin/hata");
  const ana = page.locator("main");
  await expect(ana.getByText("Bu sayfa açılamadı")).toBeVisible();
  await expect(ana.getByRole("button", { name: "Yeniden dene" })).toBeVisible();
  await expect(ana.getByRole("link", { name: "Ana sayfaya dön" })).toHaveAttribute("href", "/");
  await expect(ana).not.toContainText("ic-ayrinti-sizmamali");
  await expect(ana).not.toContainText("SELECT");
});
