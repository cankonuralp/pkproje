/* NEREDEN GELDİ: K4 Teklifler (324) — maket teklifler.html (M12 2. tur). Gerçek tarayıcıda, üç genişlikte: yeni teklif (eksikte reddedilir;
   müşteri, tesis, kalem — tutar ve KDV'li toplam canlı) → teklif sayfası (numara T-AAYY-SIRA sunucuda, Taslak) → Gönderildi olarak işaretle →
   Kabul edildi (onay penceresi) → Plan aç · muhasebe teklifi görür, eylem tuşu yok · denetçi Teklifler'i göremez. Her proje kendi teklifini açar.
   325: "Excel'den yükle" (CSV: geçerli satır kaleme eklenir, bilinmeyen tür gerekçesiyle atlanır), teklif sayfasında PDF ve "Excel'e aktar" iner. */
import { expect, test } from "@playwright/test";
import { E2E_PLAN, E2E_SAHA } from "./hesaplar";
import { girisli, hazir } from "./yardimci";

test("teklif: hazırla, gönderildi, kabul edildi; muhasebe yalnız görür, denetçi göremez", async ({ page, context }) => {
  test.setTimeout(150_000);   // ilk koşuda form ve teklif sayfası soğuk derlenir; PDF Chromium açar
  await girisli(page, "yonetici");
  await page.goto("/teklifler/yeni");
  await hazir(page);
  await page.getByRole("button", { name: "Kaydet" }).click();
  await expect(page.getByText(/^Kaydedilmedi: \d+ eksik düzeltilmeli\.$/)).toBeVisible();

  await page.getByRole("combobox", { name: "Müşteri" }).click();
  const ara = page.getByRole("searchbox", { name: "Müşteri içinde ara" });
  if (await ara.count()) await ara.fill("Plan Deneme");
  await page.getByRole("option", { name: "Plan Deneme" }).click();
  await page.getByRole("combobox", { name: "Tesis" }).click();
  await page.getByRole("option", { name: E2E_PLAN.tesis }).click();
  await page.getByLabel("Geçerlilik (gün)").fill("30");
  await page.getByRole("combobox", { name: "Ekipman türü 1" }).click();
  await page.getByRole("option", { name: E2E_SAHA.tur }).first().click();
  await page.getByLabel("Adet").fill("2");
  await page.getByLabel("Birim fiyat (TL)").fill("1.250,00");
  await expect(page.getByText("3.000,00 TL", { exact: true })).toBeVisible();   // 2 × 1.250 + %20 KDV
  /* Excel'den yükle (CSV): Hava tankı satırı kaleme eklenir (adet 3), bilinmeyen tür atlanır */
  await page.getByRole("button", { name: "Excel'den yükle" }).click();
  const yukle = page.getByRole("dialog", { name: "Excel'den yükle" });
  await yukle.locator('input[type="file"]').setInputFiles({ name: "liste.csv", mimeType: "text/csv",
    buffer: Buffer.from(`Kod;Ekipman türü;Konum;Seri no\nE2E-1;${E2E_SAHA.tur};Kazan dairesi;S-1\nE2E-2;Olmayan tür;;\n`, "utf8") });
  await expect(yukle.getByText("Tür bulunamadı, atlanır")).toBeVisible();
  await yukle.getByRole("button", { name: "Kalemlere ekle (1)" }).click();
  await expect(page.getByText("1 ekipman 1 türle kalemlere eklendi; 1 satır atlandı.")).toBeVisible();
  await expect(page.getByText("4.500,00 TL", { exact: true })).toBeVisible();   // 3 × 1.250 + %20 KDV
  await page.getByRole("button", { name: "Kaydet" }).click();
  await expect(page).toHaveURL(/\/teklifler\/[0-9a-f-]{36}$/, { timeout: 30_000 });
  await expect(page.getByRole("heading", { level: 1, name: /^T-\d{4}-\d{3,}$/ })).toBeVisible();
  const no = (await page.getByRole("heading", { level: 1 }).textContent())!.trim();
  await expect(page.getByText("4.500,00 TL", { exact: true })).toBeVisible();
  /* teklif belgesi (PDF) ve ekipman listesi (Excel) iner */
  await hazir(page);
  const [pdf] = await Promise.all([page.waitForEvent("download", { timeout: 60_000 }), page.getByRole("link", { name: "PDF" }).click()]);
  expect(pdf.suggestedFilename()).toBe(`${no}.pdf`);
  await page.getByRole("button", { name: "Excel'e aktar" }).click();
  const aktar = page.getByRole("dialog", { name: "Excel'e aktar" });
  await expect(aktar.getByText("1 ekipman", { exact: true })).toBeVisible();
  const [xlsx] = await Promise.all([page.waitForEvent("download"), aktar.getByRole("button", { name: "İndir" }).click()]);
  expect(xlsx.suggestedFilename()).toBe(`${no}-ekipmanlar.xlsx`);
  await aktar.getByRole("button", { name: "Kapat" }).click();

  await hazir(page);
  await page.getByRole("button", { name: "Gönderildi olarak işaretle" }).click();
  await expect(page.getByRole("button", { name: "Kabul edildi" })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("link", { name: "Düzenle" })).toHaveCount(0);
  await page.getByRole("button", { name: "Kabul edildi" }).click();
  const onay = page.getByRole("dialog", { name: "Teklif kabul edildi mi?" });
  await onay.getByRole("button", { name: "Kabul edildi" }).click();
  await expect(page.getByRole("link", { name: "Plan aç" })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(/^Kabul edildi \d{2}\.\d{2}\.\d{4}\./)).toBeVisible();
  const adres = page.url();

  /* listede: kabul edildi */
  await page.goto("/teklifler");
  await hazir(page);
  await expect(page.getByRole("link", { name: no })).toBeVisible();

  /* muhasebe: görür, eylem yok */
  await context.clearCookies();
  await girisli(page, "muhasebe");
  await page.goto(adres);
  await hazir(page);
  await expect(page.getByRole("heading", { level: 1, name: no })).toBeVisible();
  for (const t of ["Reddedildi", "Kabul edildi", "Müşteri olarak kaydet"]) await expect(page.getByRole("button", { name: t })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Plan aç" })).toHaveCount(0);

  /* denetçi: Teklifler'i göremez */
  await context.clearCookies();
  await girisli(page, "denetci");
  await page.goto("/teklifler");
  await expect(page.getByText("Bu sayfayı görme yetkiniz yok")).toBeVisible();
  await page.goto(adres);
  await expect(page.getByText("Bu sayfayı görme yetkiniz yok")).toBeVisible();
});
