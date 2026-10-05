/* NEREDEN GELDİ: K4 Muhasebe (327) — maket muhasebe.html (M14). Gerçek tarayıcıda, üç genişlikte: her projenin tamamlanmış planı ve imzalı raporu
   (scripts/e2e-sunucu.ts tohumu; fiyat listesinden 900,00 TL) → İşler listesi → iş sayfası "1 rapor faturaya hazır" → Fatura kaydet (no yazılmadan
   reddedilir; KDV'li toplam) → fatura sayfası → Tahsilat ekle (kalan kadar) → "Ödendi" · Faturalar listesinde · denetçi Muhasebe'yi göremez.
   328: iş sayfasında Kârlılık · Giderler sekmesi → Gider ekle (tür seçilmeden reddedilir; türün KDV oranı, canlı KDV) → listede · Gelir-gider. */
import { expect, test } from "@playwright/test";
import { E2E_MUHASEBE } from "./hesaplar";
import { girisli, hazir } from "./yardimci";

test("muhasebe: imzalı rapor faturalanır, tahsil edilir; denetçi göremez", async ({ page, context }, bilgi) => {
  test.setTimeout(150_000);   // ilk koşuda iş ve fatura sayfaları soğuk derlenir
  const proje = bilgi.project.name as keyof typeof E2E_MUHASEBE.plan;
  const planNo = E2E_MUHASEBE.plan[proje], faturaNo = E2E_MUHASEBE.fatura[proje];
  await girisli(page, "muhasebe");
  await page.goto("/muhasebe");
  await hazir(page);
  await expect(page.getByRole("navigation", { name: "Muhasebe bölümleri" })).toBeVisible();
  await page.getByRole("link", { name: planNo }).first().click();
  await expect(page).toHaveURL(/\/muhasebe\/is\/[0-9a-f-]{36}$/, { timeout: 30_000 });
  await expect(page.getByRole("heading", { level: 1, name: planNo })).toBeVisible();
  await expect(page.getByText("1 rapor faturaya hazır")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Kârlılık" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), "sayfa yana taşmaz (nesne başlığının tuşları sarar)").toBe(true);

  await hazir(page);
  await page.getByRole("button", { name: "Fatura kaydet" }).click();
  const w = page.getByRole("dialog", { name: `Fatura kaydet · ${planNo}` });
  await expect(w.getByText("1.080,00 TL", { exact: true })).toBeVisible();   // 900 + %20 KDV
  await w.getByRole("button", { name: "Faturayı kaydet" }).click();
  await expect(w.getByText("Fatura no yazılmalı.")).toBeVisible();
  await w.getByLabel("Fatura no").fill(faturaNo);
  await w.getByRole("button", { name: "Faturayı kaydet" }).click();
  await expect(page).toHaveURL(/\/muhasebe\/f\/[0-9a-f-]{36}$/, { timeout: 30_000 });
  await expect(page.getByRole("heading", { level: 1, name: faturaNo })).toBeVisible();

  await hazir(page);
  await page.getByRole("button", { name: "Tahsilat ekle" }).click();
  const t = page.getByRole("dialog", { name: `Tahsilat ekle · ${faturaNo}` });
  await t.getByRole("button", { name: "Tahsilatı kaydet" }).click();
  await expect(page.getByText(/^Ödendi \d{2}\.\d{2}\.\d{4}\.$/)).toBeVisible({ timeout: 30_000 });

  await page.goto("/muhasebe/faturalar");
  await hazir(page);
  await expect(page.getByRole("link", { name: faturaNo })).toBeVisible();

  await context.clearCookies();
  await girisli(page, "denetci");
  await page.goto("/muhasebe/faturalar");
  await expect(page.getByText("Bu sayfayı görme yetkiniz yok")).toBeVisible();
});

test("muhasebe › giderler: gider ekle (türün KDV oranı, canlı KDV), listede; gelir-gider", async ({ page }, bilgi) => {
  test.setTimeout(120_000);
  const aciklama = `Deneme gider ${bilgi.project.name}`;
  await girisli(page, "muhasebe");
  await page.goto("/muhasebe/giderler");
  await hazir(page);
  await page.getByRole("button", { name: "Gider ekle" }).click();
  const d = page.getByRole("dialog", { name: "Gider ekle" });
  await d.getByRole("button", { name: "Gideri kaydet" }).click();
  await expect(d.getByText("Tür seçilmeli.")).toBeVisible();
  await d.getByRole("combobox", { name: "Tür" }).click();
  await d.getByRole("option", { name: "Konaklama" }).click();
  await d.getByLabel("Tutar (KDV dahil)").fill("1.100,00");
  await expect(d.getByText("KDV 100,00 TL · KDV hariç 1.000,00 TL")).toBeVisible();
  await d.getByLabel("Açıklama").fill(aciklama);
  await d.getByRole("button", { name: "Gideri kaydet" }).click();
  await expect(page.getByText(/^G-\d{4}-\d{3} kaydedildi: 1\.100,00 TL \(KDV dahil\), genel gider; belge eklenmedi\.$/)).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(aciklama)).toBeVisible();

  await page.goto("/muhasebe/gelir-gider");
  await hazir(page);
  await expect(page.getByRole("heading", { name: "Gelir ve giderler · toplam" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Aylara göre" })).toBeVisible();
});
