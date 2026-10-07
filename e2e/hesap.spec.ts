/* NEREDEN GELDİ: maket personel.html "Giriş hesabı ve roller" (karar 33, 34, 32) · K2 Personel 3 (2026-10-04). Gerçek sunucuda: yönetici yeni kişiye
   hesap açar, geçici parola bir kez görünür; kişi o parolayla girer ve "Parolayı değiştir"e gelir; roller değişir; hesap kapatılınca giremez;
   yeniden açılınca girer; firma yöneticisi kendi yönetici rolünü (son yönetici) bırakamaz. */
import { expect, test, type Page } from "@playwright/test";
import { girisli, hazir } from "./yardimci";

async function kisiEkle(page: Page, ad: string) {
  await page.goto("/personel/yeni");
  await hazir(page);
  await page.getByLabel("Ad soyad").fill(ad);
  await page.getByLabel("İşe başlama").fill("01.03.2024");
  await page.getByRole("combobox", { name: "Meslek" }).click();
  await page.getByRole("option", { name: /^Elektrik mühendisi/ }).click();
  await page.getByRole("button", { name: "Kaydet" }).click();
  /* 355: kayıt sonrası kart sayfasına geçiş telefon sunucusunda 15 sn'yi aştı (14b1bf8) — öteki kayıt beklemeleri gibi 30 sn */
  await expect(page.locator("h1")).toHaveText(ad, { timeout: 30_000 });
  await hazir(page);
}

test("hesap aç → geçici parola bir kez → kişi girer; roller; kapat / yeniden aç", async ({ page, browser }, bilgi) => {
  const ek = `${bilgi.project.name}-${bilgi.repeatEachIndex}`, ad = `Hesap Deneme ${ek}`, eposta = `hesap-${ek}@deneme.example`;
  await girisli(page, "yonetici");
  await kisiEkle(page, ad);
  await expect(page.getByText("Giriş hesabı yok.")).toBeVisible();
  await page.getByRole("button", { name: "Giriş hesabı aç" }).click();
  const pencere = page.locator("dialog[open]");
  await pencere.getByLabel("Giriş e-postası").fill(eposta);
  await expect(pencere.getByRole("button", { name: "Hesabı aç ve parola oluştur" })).toBeDisabled();
  await pencere.getByRole("checkbox", { name: /Denetçi/ }).check();
  await pencere.getByRole("button", { name: "Hesabı aç ve parola oluştur" }).click();
  await expect(page.locator("dialog[open] h2")).toHaveText("Giriş hesabı açıldı");
  const parola = (await page.locator("#h-parola").innerText()).trim();
  expect(parola).toMatch(/^[A-Za-z2-9]{5}-[A-Za-z2-9]{5}-[A-Za-z2-9]{5}$/);
  await page.locator("dialog[open]").getByRole("button", { name: "Tamam" }).click();
  await expect(page.locator("#h-parola")).toHaveCount(0);
  await expect(page.getByText("İlk giriş bekleniyor")).toBeVisible();

  /* kişi geçici parolayla girer → parola değiştir ekranı */
  const kisi = await (await browser.newContext()).newPage();
  await kisi.goto("/giris");
  await hazir(kisi);
  await kisi.getByLabel("E-posta").fill(eposta);
  await kisi.getByLabel("Parola", { exact: true }).fill(parola);
  await kisi.getByRole("button", { name: "Giriş yap" }).click();
  await expect(kisi).toHaveURL(/\/giris\/parola$/);

  /* roller: Planlama ekle → kaydedilmemiş değişiklik → kaydet */
  await page.getByRole("checkbox", { name: /Planlama ekibi/ }).check();
  await expect(page.getByText("Kaydedilmemiş değişiklik var.")).toBeVisible();
  await page.getByRole("button", { name: "Rolleri kaydet" }).click();
  await expect(page.getByText("Roller kaydedildi; yeni yetkiler hemen geçerli.")).toBeVisible();
  /* rol değişti → kişinin açık oturumu düştü */
  await kisi.goto("/planlar");
  await expect(kisi).toHaveURL(/\/giris\?neden=oturum/);

  /* kapat (onay penceresi) → giremez; yeniden aç → girer */
  await page.getByRole("button", { name: "Hesabı kapat" }).click();
  await page.locator("dialog[open]").getByRole("button", { name: "Hesabı kapat" }).click();
  await expect(page.getByText("Hesap kapalı: giriş yapamaz.")).toBeVisible();
  await kisi.goto("/giris");
  await expect(kisi.getByRole("button", { name: "Giriş yap" })).toBeEnabled();
  await kisi.getByLabel("E-posta").fill(eposta);
  await kisi.getByLabel("Parola", { exact: true }).fill(parola);
  await kisi.getByRole("button", { name: "Giriş yap" }).click();
  await expect(kisi.locator("form").getByRole("alert")).toContainText("E-posta ya da parola yanlış.");
  await page.getByRole("button", { name: "Hesabı yeniden aç" }).click();
  await expect(page.getByText("Hesap kapalı: giriş yapamaz.")).toHaveCount(0);
  await kisi.context().close();
});

test("son firma yöneticisi kendi yönetici rolünü bırakamaz", async ({ page }) => {
  await girisli(page, "yonetici");
  await page.goto("/personel");
  await page.getByRole("link", { name: "Deneme Yönetici" }).first().click();
  await expect(page.locator("h1")).toHaveText("Deneme Yönetici");
  await hazir(page);
  await page.getByRole("checkbox", { name: /Firma yöneticisi/ }).uncheck();
  await page.getByRole("checkbox", { name: /Planlama ekibi/ }).check();
  await page.getByRole("button", { name: "Rolleri kaydet" }).click();
  await expect(page.getByText("Firmada en az bir firma yöneticisi kalmalı; önce başka birine bu rolü verin.")).toBeVisible();
});
