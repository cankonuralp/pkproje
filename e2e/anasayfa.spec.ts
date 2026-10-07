/* NEREDEN GELDİ: K4 Ana sayfa (332) — maket anasayfa.html M1 2. tur ("role göre ama herkes için bir anasayfa"). Gerçek tarayıcıda, üç genişlikte:
   yönetici (açık plan, uyarı, bugün başlayan planlar, Plan aç, duyuru kaynakları) · denetçi (kabul bekleyen plan, açık planların; Plan aç yok) ·
   muhasebe (faturaya hazır iş) · yana taşma yok · 379 duyurular: ilk açılış okumayı arka planda başlatır (yerel taklit, UYDURMA sayfalar), sonra
   kaynak başına en yeni 2 — hepsi en yeni üstte, tarih · kaynak, yeni sekmede Bakanlığın adresi; sayaçta güncellenme zamanı. */
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
  await expect(page.getByRole("link", { name: "İSGGM", exact: true })).toHaveAttribute("href", "https://www.csgb.gov.tr/isggm/duyurular/");
  expect(await page.evaluate(TASMA), "yana taşma yok").toBe(true);
  const duyurular = page.getByRole("region", { name: "Duyurular" });
  await expect(async () => {
    await page.reload();
    await expect(duyurular.getByRole("listitem")).toHaveCount(6, { timeout: 3_000 });
  }).toPass({ timeout: 60_000 });
  await expect(duyurular.getByRole("listitem").first()).toContainText("15.09.2026 · İSGGM");
  await expect(duyurular.getByRole("listitem").last()).toContainText("03.07.2026 · İş ekipmanları");
  const ilk = duyurular.getByRole("link", { name: "Deneme İSGGM duyurusu: Örnek sınav takvimi" });
  await expect(ilk).toHaveAttribute("href", "https://www.csgb.gov.tr/isggm/duyurular/15092026/");
  await expect(ilk).toHaveAttribute("target", "_blank");
  await expect(duyurular).toContainText(/6 duyuru · güncellendi \d{2}\.\d{2}\.\d{4}/);
  await expect(duyurular.getByRole("alert")).toHaveCount(0);
  expect(await page.evaluate(TASMA), "duyurularla da yana taşma yok").toBe(true);

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
