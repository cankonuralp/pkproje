/* NEREDEN GELDİ: K0 (2026-10-03) — uçtan uca düzenin ilk denetimleri. Kabuk (yan menü + üst çubuk) maketle eşit:
   · her genişlikte çizilir, sayfa yatay kaymaz, başlık modül adını taşır;
   · menünün üstünde gruptan bağımsız "Ana sayfa" (maket M1), kök adres; Planlar /planlar;
   · geniş bantta menüyü daraltan ☰ SOL BARIN İÇİNDE (reisim 2026-10-03: "şu 3 çizgiyi sol barın içine taşı"), menü 64 px şeride iner;
   · orta / dar bantta çekmeceyi açan ☰ üst çubukta (maketteki olc-bulut denetimleriyle aynı ölçüt). */
import { expect, test } from "@playwright/test";
import { girisli } from "./yardimci";

/* 2026-10-04 (K1): uygulama oturum ister — her test firma yöneticisi olarak girer (bütün modülleri görür) */
test.beforeEach(async ({ page }) => { await girisli(page, "yonetici"); });

test("ana sayfa: kabuk çizilir, başlık doğru, yatay kayma yok", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Ana sayfa · probata");
  await expect(page.locator('aside a[href="/"]')).toHaveAttribute("aria-current", "page");   // dar bantta çekmece kapalı (gizli) — rol sorgusu görmez
  const genislik = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  expect(genislik[0]).toBeLessThanOrEqual(genislik[1]);
});

test("Planlar /planlar adresinde, menüde seçili", async ({ page }) => {
  await page.goto("/planlar");
  await expect(page).toHaveTitle("Planlar · probata");
  await expect(page.locator('a[href="/planlar"]')).toHaveAttribute("aria-current", "page");
});

test("☰ yeri: geniş bantta sol barda (daraltır, 64 px), dar bantta üst çubukta (çekmece)", async ({ page }, bilgi) => {
  await page.goto("/");
  const daralt = page.locator('aside button[aria-label="Menüyü daralt"]');
  const cekmece = page.locator('header button[aria-label="Menüyü aç"]');
  if (bilgi.project.name === "masaustu") {
    await expect(daralt).toBeVisible();
    await expect(cekmece).toBeHidden();
    await expect(page.locator('header button[aria-label="Menüyü daralt"]')).toHaveCount(0);
    await daralt.click();
    await expect.poll(async () => Math.round((await page.locator("aside").boundingBox())!.width)).toBe(64);
  } else {
    await expect(cekmece).toBeVisible();
    await expect(daralt).toBeHidden();
  }
});

/* 339: yan menü takip balonları (maket T6) — tohumdaki UY-01'in kalibrasyonu 10 gün sonra bitiyor: Ölçüm cihazları ve Uyarılar'da sarı balon,
   adı ekran okuyucuya söylenir; sayfa çizildikten sonra sunucudan gelir */
test("yan menü takip balonları: yaklaşan kalibrasyon Ölçüm cihazları ve Uyarılar'da", async ({ page }, bilgi) => {
  await page.goto("/");
  if (bilgi.project.name !== "masaustu") await page.locator('header button[aria-label="Menüyü aç"]').click();
  const menu = page.getByRole("navigation", { name: "Modüller" });
  await expect(menu.getByRole("link", { name: /^Ölçüm cihazları: \d+ süresi yaklaşan cihaz/ })).toBeVisible({ timeout: 30_000 });
  await expect(menu.getByRole("link", { name: /^Uyarılar: .*yaklaşan uyarı/ })).toBeVisible();
  await expect(menu.getByRole("link", { name: /^Ana sayfa$/ })).toBeVisible();
});

