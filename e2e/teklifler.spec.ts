/* NEREDEN GELDİ: K4 Teklifler (324) — maket teklifler.html (M12 2. tur). Gerçek tarayıcıda, üç genişlikte: yeni teklif (eksikte reddedilir;
   müşteri, tesis, kalem — tutar ve KDV'li toplam canlı) → teklif sayfası (numara T-AAYY-SIRA sunucuda, Taslak) → Teklifi gönder (2026-11-09: e-postayla) →
   Kabul edildi (onay penceresi) → Plan aç · muhasebe teklifi görür, eylem tuşu yok · denetçi Teklifler'i göremez. Her proje kendi teklifini açar.
   325: "Excel'den yükle" (CSV: geçerli satır kaleme eklenir, bilinmeyen tür gerekçesiyle atlanır), teklif sayfasında PDF ve "Excel'e aktar" iner.
   326: kabul edilen tekliften "İş sözleşmesi" — form dolu açılır, sözleşmede Dayanak teklif. */
import { expect, test } from "@playwright/test";
import { E2E_PLAN, E2E_SAHA } from "./hesaplar";
import { girisli, hazir } from "./yardimci";

test("teklif: hazırla, gönderildi, kabul edildi; muhasebe yalnız görür, denetçi göremez", async ({ page, context }) => {
  test.setTimeout(180_000);   // ilk koşuda form, teklif ve sözleşme sayfaları soğuk derlenir; PDF Chromium açar
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
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), "sayfa yana taşmaz (nesne başlığının tuşları sarar)").toBe(true);
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
  await aktar.getByRole("button", { name: "Kapat" }).last().click();   // başlıktaki X tuşunun adı da "Kapat"

  await hazir(page);
  /* 2026-11-09 (reisim: "teklif gönder diyince ön izleme ile müşterinin mailine gönderilecek mail düzenlenebilsin"): pencere hazır metinle açılır, ileti düzenlenir,
     önizleme yazılanı gösterir, belge kaba sığar; gönderilince teklif "gönderildi", giden e-posta sayfada */
  await page.getByRole("button", { name: "Teklifi gönder" }).click();
  const gonder = page.getByRole("dialog", { name: /^Teklifi gönder/ });
  await expect(gonder.getByLabel("Konu")).toHaveValue(new RegExp(no), { timeout: 30_000 });
  await gonder.getByLabel("Alıcı").fill("musteri@deneme.example");
  await gonder.getByLabel("İleti").fill("Deneme iletisi\nİkinci satır");
  await expect(gonder.getByRole("region", { name: "E-postanın önizlemesi" })).toContainText("Deneme iletisi");
  await expect(gonder.getByRole("region", { name: "E-postanın önizlemesi" })).toContainText("musteri@deneme.example");
  await gonder.getByRole("radio", { name: "Teklif belgesi" }).click();
  await expect(gonder.getByRole("article", { name: `${no} teklif belgesi` })).toBeVisible();
  await expect(gonder).not.toContainText("Taslak — müşteriye gönderilmedi.");
  await expect.poll(() => page.evaluate(() => { const k = document.querySelector<HTMLElement>("dialog[open] .rb-onizleme")!; return k.scrollWidth <= k.clientWidth + 1; })).toBe(true);
  await gonder.getByRole("button", { name: "Gönder", exact: true }).click();
  await expect(page.getByRole("button", { name: "Kabul edildi" })).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText("musteri@deneme.example").first()).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("button", { name: "Yeniden gönder" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sil", exact: true })).toHaveCount(0);   // 368: gönderilmiş teklif silinmez
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
  /* 2026-11-09: "Yaklaşan muayeneler" tuşu teklif hazırlamanın yanında, sayfası açılır, yana taşmaz */
  await page.getByRole("link", { name: /Yaklaşan muayeneler/ }).click();
  await expect(page).toHaveURL(/\/teklifler\/yaklasan$/, { timeout: 30_000 });
  await expect(page.getByRole("heading", { level: 1, name: "Yaklaşan muayeneler" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  /* 326: "İş sözleşmesi" — form müşteri, Dayanak teklif ve teklifin tesisiyle dolu açılır; sözleşmede Dayanak teklif */
  await page.goto(adres);
  await hazir(page);
  await page.getByRole("link", { name: "İş sözleşmesi" }).click();
  await expect(page).toHaveURL(/\/sozlesmeler\/yeni\?teklif=/, { timeout: 30_000 });
  await hazir(page);
  await expect(page.getByRole("combobox", { name: "Dayanak teklif" })).toContainText(no);
  await expect(page.getByRole("checkbox", { name: new RegExp(E2E_PLAN.tesis) })).toBeChecked();
  await page.getByLabel("Başlangıç").fill("01.11.2026");
  await page.getByLabel("Süre (ay)").fill("12");
  await page.getByLabel("Ödeme vadesi (gün)").fill("30");
  await page.getByRole("button", { name: "Sözleşmeyi hazırla" }).click();
  await expect(page).toHaveURL(/\/sozlesmeler\/[0-9a-f-]{36}$/, { timeout: 30_000 });
  await expect(page.getByRole("link", { name: no })).toBeVisible();

  /* muhasebe: görür, eylem yok */
  await context.clearCookies();
  await girisli(page, "muhasebe");
  await page.goto(adres);
  await hazir(page);
  await expect(page.getByRole("heading", { level: 1, name: no })).toBeVisible();
  for (const t of ["Reddedildi", "Kabul edildi", "Müşteri olarak kaydet", "Teklifi gönder", "Yeniden gönder"]) await expect(page.getByRole("button", { name: t })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Plan aç" })).toHaveCount(0);

  /* denetçi: Teklifler'i göremez */
  await context.clearCookies();
  await girisli(page, "denetci");
  await page.goto("/teklifler");
  await expect(page.getByText("Bu sayfayı görme yetkiniz yok")).toBeVisible();
  await page.goto(adres);
  await expect(page.getByText("Bu sayfayı görme yetkiniz yok")).toBeVisible();
});

/* 2026-11-09 (reisim: "yaklaşan muayeneler tuşu olsun ve orada sadece gelecek muayenesine son 2 ay kalan müşteriler - tesisler gözüksün uyarı balonu olsun"): tuşta balon, satırda tesis ve
   kalan gün, sayfa yana taşmaz; "Teklif hazırla" tesisin ekipmanı ve fiyat listesiyle dolu açılır (kaydedilmez: öteki genişlikler de aynı satırı görür) */
test("yaklaşan muayeneler: balon, satır, dolu teklif formu", async ({ page }) => {
  test.setTimeout(120_000);
  await girisli(page, "yonetici");
  await page.goto("/teklifler");
  await hazir(page);
  const tus = page.getByRole("link", { name: /Yaklaşan muayeneler/ });
  await expect(tus).toContainText("tesisin muayenesi 2 ay içinde");
  await tus.click();
  await expect(page).toHaveURL(/\/teklifler\/yaklasan$/, { timeout: 30_000 });
  await hazir(page);
  await expect(page.getByText(new RegExp(E2E_PLAN.tesisYaklasan)).first()).toBeVisible();
  await expect(page.getByText(/\d+ gün kaldı/).first()).toBeVisible();
  await expect(page.getByText("Teklif yok").first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), "sayfa yana taşmaz").toBe(true);
  await page.getByRole("link", { name: "Teklif hazırla" }).first().click();
  await expect(page).toHaveURL(/\/teklifler\/yeni\?tesis=.*doldur=1/, { timeout: 30_000 });
  await hazir(page);
  await expect(page.getByRole("combobox", { name: "Tesis" })).toContainText(E2E_PLAN.tesisYaklasan);
  await expect(page.getByLabel("Geçerlilik (gün)")).toHaveValue("30");
  await expect(page.getByLabel("Adet")).toHaveValue("1");
  await expect(page.getByLabel("Birim fiyat (TL)")).toHaveValue("900,00");
});

/* 368 (§9 elli üçüncü tur): hiç gönderilmemiş taslağı yönetici siler → Teklifler listesine dönülür */
test("teklif: taslak silinir", async ({ page }) => {
  test.setTimeout(120_000);
  await girisli(page, "yonetici");
  await page.goto("/teklifler/yeni");
  await hazir(page);
  await page.getByRole("combobox", { name: "Müşteri" }).click();
  const ara = page.getByRole("searchbox", { name: "Müşteri içinde ara" });
  if (await ara.count()) await ara.fill("Plan Deneme");
  await page.getByRole("option", { name: "Plan Deneme" }).click();
  await page.getByRole("combobox", { name: "Tesis" }).click();
  await page.getByRole("option", { name: E2E_PLAN.tesis }).click();
  await page.getByLabel("Geçerlilik (gün)").fill("30");
  await page.getByRole("combobox", { name: "Ekipman türü 1" }).click();
  await page.getByRole("option", { name: E2E_SAHA.tur }).first().click();
  await page.getByLabel("Adet").fill("1");
  await page.getByLabel("Birim fiyat (TL)").fill("100,00");
  await page.getByRole("button", { name: "Kaydet" }).click();
  await expect(page).toHaveURL(/\/teklifler\/[0-9a-f-]{36}$/, { timeout: 30_000 });
  const no = (await page.getByRole("heading", { level: 1 }).textContent())!.trim();
  await hazir(page);
  await page.getByRole("button", { name: "Sil", exact: true }).click();
  const onay = page.locator("dialog[open]");
  await expect(onay).toContainText(`${no} kalıcı olarak silinir; kalemleri ve tesisleri de silinir. Geri alınamaz.`);
  await onay.getByRole("button", { name: "Sil" }).click();
  await expect(page).toHaveURL(/\/teklifler$/, { timeout: 30_000 });
  await expect(page.getByText(`${no} silindi.`).first()).toBeVisible();
  await expect(page.getByRole("link", { name: no })).toHaveCount(0);
});
