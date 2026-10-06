/* NEREDEN GELDİ: K4 Uyarılar (331) — maket uyarilar.html M10. Gerçek tarayıcıda, üç genişlikte: yönetici Uyarılar'ı açar
   → ?tur=kalibrasyon "Kalibrasyon" çipini basılı açar, depodaki cihazın "Yaklaşıyor" satırı görünür · yana taşma yok · denetçi kendi uyarılarını açar · muhasebe göremez. */
import { expect, test } from "@playwright/test";
import { girisli, hazir } from "./yardimci";

test("uyarılar: liste, adresten çip, denetçi kendi; muhasebe göremez", async ({ page, context }) => {
  test.setTimeout(90_000);
  await girisli(page, "yonetici");
  await page.goto("/uyarilar?tur=kalibrasyon");
  await hazir(page);
  await expect(page.getByRole("heading", { level: 1, name: "Uyarılar" })).toBeVisible();
  /* 329–332 incelemesi: çip boş listede de çizilir — satırın kendisi sınanır (tohum: depodaki UY-01, kalibrasyonu 10 gün sonra biter) */
  await expect(page.locator('[data-cip="kal"]').first()).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("link", { name: "UY-01 · Deneme Ölçer" }).first()).toBeVisible();
  await expect(page.getByText("Yaklaşıyor", { exact: true }).filter({ visible: true }).first()).toBeVisible();
  await expect(page.getByText("Depoda").filter({ visible: true }).first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), "yana taşma yok").toBe(true);

  await context.clearCookies();
  await girisli(page, "denetci");
  await page.goto("/uyarilar");
  await expect(page.getByRole("heading", { level: 1, name: "Uyarılar" })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("link", { name: "UY-01 · Deneme Ölçer" })).toHaveCount(0);   // kendi: depodaki cihaz onun değil

  await context.clearCookies();
  await girisli(page, "muhasebe");
  await page.goto("/uyarilar");
  await expect(page.getByText("Bu sayfayı görme yetkiniz yok")).toBeVisible();
});
