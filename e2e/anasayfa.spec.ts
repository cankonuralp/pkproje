/* NEREDEN GELDİ: K4 Ana sayfa (332) — maket anasayfa.html M1 2. tur ("role göre ama herkes için bir anasayfa"). Gerçek tarayıcıda, üç genişlikte:
   yönetici (açık plan, uyarı, bugün başlayan planlar, Plan aç, duyuru kaynakları) · denetçi (kabul bekleyen plan, açık planların; Plan aç yok) ·
   muhasebe (faturaya hazır iş) · yana taşma yok. */
import { expect, test } from "@playwright/test";
import { girisli, hazir } from "./yardimci";

const TASMA = () => document.documentElement.scrollWidth <= window.innerWidth;

test("ana sayfa: rol başına bölümler; Plan aç yalnız plan açabilene; duyuru kaynakları", async ({ page, context }) => {
  test.setTimeout(90_000);
  await girisli(page, "yonetici");
  await page.goto("/");
  await hazir(page);
  await expect(page.getByRole("heading", { level: 1, name: "Ana sayfa" })).toBeVisible();
  await expect(page.getByText("Açık plan", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Bugün başlayan planlar" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Plan aç" }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "İSGGM" })).toHaveAttribute("href", /csgb\.gov\.tr/);
  expect(await page.evaluate(TASMA), "yana taşma yok").toBe(true);

  await context.clearCookies();
  await girisli(page, "denetci");
  await page.goto("/");
  await expect(page.getByText("Kabul bekleyen plan", { exact: true })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("heading", { name: "Açık planların" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Plan aç" })).toHaveCount(0);

  await context.clearCookies();
  await girisli(page, "muhasebe");
  await page.goto("/");
  await expect(page.getByText("Faturaya hazır iş", { exact: true })).toBeVisible({ timeout: 30_000 });
  expect(await page.evaluate(TASMA), "yana taşma yok").toBe(true);
});
