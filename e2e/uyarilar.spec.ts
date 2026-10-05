/* NEREDEN GELDİ: K4 Uyarılar (331) — maket uyarilar.html M10. Gerçek tarayıcıda, üç genişlikte: yönetici Uyarılar'ı açar (liste ya da "Uyarı yok")
   → ?tur=kalibrasyon "Kalibrasyon" çipini basılı açar · yana taşma yok · denetçi kendi uyarılarını açar · muhasebe göremez. */
import { expect, test } from "@playwright/test";
import { girisli, hazir } from "./yardimci";

test("uyarılar: liste, adresten çip, denetçi kendi; muhasebe göremez", async ({ page, context }) => {
  test.setTimeout(90_000);
  await girisli(page, "yonetici");
  await page.goto("/uyarilar?tur=kalibrasyon");
  await hazir(page);
  await expect(page.getByRole("heading", { level: 1, name: "Uyarılar" })).toBeVisible();
  const cip = page.locator('[data-cip="kal"]');
  if (await cip.count()) await expect(cip.first()).toHaveAttribute("aria-pressed", "true");
  else await expect(page.getByText("Uyarı yok")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), "yana taşma yok").toBe(true);

  await context.clearCookies();
  await girisli(page, "denetci");
  await page.goto("/uyarilar");
  await expect(page.getByRole("heading", { level: 1, name: "Uyarılar" })).toBeVisible({ timeout: 30_000 });

  await context.clearCookies();
  await girisli(page, "muhasebe");
  await page.goto("/uyarilar");
  await expect(page.getByText("Bu sayfayı görme yetkiniz yok")).toBeVisible();
});
