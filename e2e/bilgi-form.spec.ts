/* NEREDEN GELDİ: K0 (2026-10-03) — kalıp 20 (a) tıklanır bilgi yüzleri, (b) form sayfası, (d) koşul listesi ve bilgi listesi; kalıp 12 uzun tuş
   (reisim 2026-09-12: "PDF indir'e tekrar bastım, 2 kere indirdi"; "dondu gibi algılandı"). Vitrin /vitrin, uydurma veri. */
import { expect, test, type Page } from "@playwright/test";

const bolum = (page: Page) => page.locator('section[aria-labelledby="v-bilgi"]');

test.beforeEach(async ({ page }) => {
  await page.goto("/vitrin");
  await expect(bolum(page)).toBeVisible();
});

test("bilgi yüzleri: bağlantılı yüz listesine gider; uyarı notu uyarı renginde; telefonda iki sütun", async ({ page }, bilgi) => {
  const planlar = bolum(page).getByRole("link", { name: /Planlar/ });
  await expect(planlar).toContainText("12");
  const renk = (metin: string) => bolum(page).getByText(metin).evaluate((e) => getComputedStyle(e).color);
  expect(await renk("5 rapor onay bekliyor")).not.toBe(await renk("3 plan bugün"));
  if (bilgi.project.name === "telefon") {
    /* iki sütun: bir yüz bölümün yarısından dar */
    const [y, b] = [await planlar.boundingBox(), await bolum(page).boundingBox()];
    expect(y!.width).toBeLessThan(b!.width * 0.55);
  }
  await planlar.click();
  await expect(page).toHaveURL(/\/planlar$/);
});

test("bilgi listesi ve koşullar: geniş öge telefonda tam satır; koşul türleri ayrı", async ({ page }, bilgi) => {
  const dl = bolum(page).locator("dl");
  await expect(dl.locator("dt")).toHaveCount(5);
  const adres = dl.locator("div", { has: page.getByText("Adres", { exact: true }) });
  const [d, a] = [await dl.boundingBox(), await adres.boundingBox()];
  if (bilgi.project.name === "telefon") expect(a!.width).toBeGreaterThan(d!.width - 30);
  await expect(bolum(page).locator("[data-kosul]")).toHaveCount(3);
  const renkler = await bolum(page).locator("[data-kosul]").evaluateAll((l) => l.map((e) => getComputedStyle(e).color));
  expect(renkler[1]).not.toBe(renkler[0]);
});

test("form alanı: hata altında, girdi geçersiz ve mesajına bağlı; uyarı kaydı durdurmaz", async ({ page }) => {
  const kod = page.getByLabel("Ekipman kodu");
  await expect(page.locator('label[for="v-kod"]')).toContainText("zorunlu");
  /* ileti ortak şemadan (src/sema/ortak.ts ekipmanKodu) — sunucuyla aynı kural */
  await kod.fill("k");
  await expect(kod).toHaveAttribute("aria-invalid", "true");
  await expect(kod).toHaveAccessibleDescription("Kod: A–Z, 0–9, tire; 3–20 hane");
  await kod.fill("kp-10");
  await expect(kod).not.toHaveAttribute("aria-invalid", "true");
  await expect(page.getByLabel("Seri no")).toHaveAccessibleDescription("Bu seri no başka bir kayıtta da var.");
});

test("uzun tuş: ikinci basış yok sayılır, adım ve geçen süre görünür, bitince eski hâline döner", async ({ page }) => {
  const tus = page.locator('[data-v="uzun"]');
  await tus.dblclick();
  await tus.click();
  await expect(tus).toHaveAttribute("aria-busy", "true");
  await expect(tus).toContainText("PDF hazırlanıyor");
  await expect(tus).toBeFocused();
  await expect(tus).toContainText("sn", { timeout: 5000 });
  await expect(tus).toContainText("Sayfa 2 / 2");
  await expect(tus).not.toHaveAttribute("aria-busy", "true", { timeout: 8000 });
  await expect(tus).toHaveText("PDF oluştur");
  await expect(bolum(page).locator("[data-uzun-kosu]")).toHaveText("1");
  await expect(page.locator("[data-bildirim]")).toContainText("PDF hazır.");
});

test("uzun tuş hata: tuş geri döner, hata söylenir (yutulmaz)", async ({ page }) => {
  const tus = page.locator('[data-v="uzun-hata"]');
  await tus.click();
  await expect(tus).toContainText("Bağlanıyor");
  await expect(page.locator("[data-bildirim]")).toContainText("İşlem tamamlanamadı: depo yanıt vermedi");
  await expect(tus).toHaveText("Yedek al");
  await expect(tus).not.toHaveAttribute("aria-busy", "true");
});

test("form eylem çubuğu: telefonda altta yapışkan, tuşlar eşit; masaüstünde sağa yaslı", async ({ page }, bilgi) => {
  const cubuk = page.locator('[data-v="uzun"]').locator("..");
  const [a, b] = [await page.locator('[data-v="uzun-hata"]').boundingBox(), await page.locator('[data-v="uzun"]').boundingBox()];
  if (bilgi.project.name === "telefon") {
    await expect(cubuk).toHaveCSS("position", "sticky");
    expect(Math.abs(a!.width - b!.width)).toBeLessThan(2);
  } else {
    await expect(cubuk).toHaveCSS("position", "static");
    const c = (await cubuk.boundingBox())!;
    expect(Math.round(c.x + c.width - (b!.x + b!.width))).toBeLessThanOrEqual(1);
  }
});
