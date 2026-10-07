/* NEREDEN GELDİ: 348 — probata yönetim sayfası (maket yonetim.html; KOD-GECIS Y1: ayrı adres + iki adımlı giriş). Gerçek sunucuda, üç genişlikte:
   firma adresinde /yonetim yok, yönetim adresinde firma ekranı yok; ilk yönetici geçici parolayla girer, doğrulama uygulamasının anahtarını görür,
   kod + yeni parolayla kurulumu bitirir; Firmalar; Firma aç (boş form ve ayrılmış ad reddedilir, ünvandan öneri, başka firmanın kodu sunucuda
   reddedilir) → geçici parola bir kez → yeni firmanın adresine o parolayla girilir; Dondur (firma adresi kapanır) / Etkinleştir / yeni geçici
   parola; Çıkış. Kurulmuş yönetici: yanlış kod reddedilir, doğru kodla girer. */
import { expect, test, type Page } from "@playwright/test";
import { totpKodu, zamanAdimi } from "../src/server/yonetim/totp";
import { E2E_FIRMA, E2E_KAPI, E2E_PAROLA, E2E_YONETIM } from "./hesaplar";
import { hazir } from "./yardimci";

const Y = `http://${E2E_YONETIM.alan}:${E2E_KAPI}`;

async function parolaAdimi(page: Page, eposta: string, parola: string) {
  await page.goto(`${Y}/yonetim/giris`);
  await hazir(page);
  await page.getByLabel("E-posta").fill(eposta);
  await page.getByLabel("Parola", { exact: true }).fill(parola);
  await page.getByRole("button", { name: "Devam" }).click();
}

test("yönetim: ayrı adres; ilk kurulum; firma aç → geçici parolayla yeni firmaya giriş; dondur / etkinleştir / yeni parola; çıkış", async ({ page, browser }, bilgi) => {
  /* proje (genişlik) başına kendi yöneticisi ve firması — üç genişlik tek sunucuda da koşabilir */
  const P = E2E_YONETIM.proje(bilgi.project.name), F = P.firma;
  const firmaAdresi = `http://${F.alt}.localhost:${E2E_KAPI}`;
  /* firma adresinde yönetim yok; yönetim adresinde firma ekranı ve API yok — önceden yükleme başlığıyla da (347–348 incelemesi) */
  expect((await page.goto("/yonetim"))?.status()).toBe(404);
  expect((await page.goto(`${Y}/planlar`))?.status()).toBe(404);
  expect((await page.goto(`${Y}/api/surum`))?.status()).toBe(404);
  await page.setExtraHTTPHeaders({ "next-router-prefetch": "1" });
  expect((await page.goto(`${Y}/api/surum`))?.status()).toBe(404);
  await page.setExtraHTTPHeaders({});
  await page.goto(`${Y}/`);
  await expect(page).toHaveURL(/\/yonetim\/giris$/);

  /* ilk yönetici: geçici parola → kurulum (anahtar + kod + yeni parola) */
  await parolaAdimi(page, P.ilk, "yanlis-parola-2026");
  await expect(page.getByText("E-posta ya da parola yanlış.", { exact: false })).toBeVisible();
  await expect(page.getByLabel("Parola", { exact: true })).toBeFocused();   // 2026-10-08: hata dönünce odak alana (e-posta dolu → parola)
  await expect(page.getByLabel("Parola", { exact: true })).toHaveAttribute("aria-invalid", "true");
  await parolaAdimi(page, P.ilk, E2E_YONETIM.geciciParola);
  await expect(page).toHaveURL(/\/yonetim\/giris\/kurulum$/);
  await hazir(page);
  await expect(page.getByRole("heading", { level: 1, name: "İki adımlı giriş kurulumu" })).toBeVisible();
  const anahtar = (await page.locator("#y-anahtar").innerText()).replace(/\s/g, "");
  expect(anahtar).toMatch(/^[A-Z2-7]{32}$/);
  await page.getByLabel("Doğrulama kodu").fill(totpKodu(anahtar, zamanAdimi(new Date())));
  await page.getByLabel("Yeni parola", { exact: true }).fill(E2E_YONETIM.yeniParola);
  await page.getByLabel("Yeni parola (tekrar)").fill(E2E_YONETIM.yeniParola);
  await page.getByRole("button", { name: "Kurulumu tamamla" }).click();
  await expect(page).toHaveURL(/\/yonetim$/);
  await hazir(page);
  await expect(page.getByRole("heading", { level: 1, name: "Firmalar" })).toBeVisible();
  await expect(page.locator("header")).toContainText("Yönetim");
  await expect(page.getByText("Bu sayfa yalnız probata ekibine açık")).toBeVisible();
  await expect(page.getByRole("link", { name: E2E_FIRMA.ad }).first()).toBeVisible();

  /* firma aç: boş form → alan hataları; ünvandan öneri; ayrılmış ad; başka firmanın kodu sunucuda reddedilir */
  await page.getByRole("link", { name: "Firma aç" }).first().click();
  await expect(page.getByRole("heading", { level: 1, name: "Firma aç" })).toBeVisible();
  await page.getByRole("button", { name: "Firmayı aç" }).click();
  await expect(page.getByText("Ticari ünvan yazılmalı.")).toBeVisible();
  await expect(page.getByLabel("Ticari ünvan")).toBeFocused();
  await page.getByLabel("Ticari ünvan").fill(F.unvan);
  await expect(page.getByLabel("Alt alan adı")).toHaveValue("yeni");
  await expect(page.getByLabel("Kısa kod (rapor no öneki)")).toHaveValue("YM");
  await page.getByLabel("Alt alan adı").fill("www");
  await page.getByLabel("Ad soyad").fill(F.yon);
  await page.getByLabel("E-posta (giriş adı)").fill(F.eposta);
  await page.getByRole("button", { name: "Firmayı aç" }).click();
  await expect(page.getByText("“www” bize ayrılmış; başka bir ad seçin.")).toBeVisible();
  await page.getByLabel("Alt alan adı").fill(F.alt);
  await expect(page.getByText(`Adres: ${F.alt}.localhost`)).toBeVisible();
  await page.getByLabel("Kısa kod (rapor no öneki)").fill(E2E_FIRMA.raporKodu);
  await page.getByRole("button", { name: "Firmayı aç" }).click();
  await page.locator("dialog[open]").getByRole("button", { name: "Firmayı aç" }).click();
  await expect(page.getByText(`${E2E_FIRMA.raporKodu} başka bir firmada.`)).toBeVisible();
  await expect(page.getByLabel("Kısa kod (rapor no öneki)")).toBeFocused();
  await page.getByLabel("Kısa kod (rapor no öneki)").fill(F.kod);
  await page.getByRole("button", { name: "Firmayı aç" }).click();
  await expect(page.locator("dialog[open]")).toContainText(`${F.alt}.localhost hemen çalışır`);
  await page.locator("dialog[open]").getByRole("button", { name: "Firmayı aç" }).click();
  await expect(page.getByRole("heading", { level: 1, name: F.unvan })).toBeVisible();
  await expect(page.getByText("Geçici parola yalnız şimdi görünür", { exact: false })).toBeVisible();
  const parola = (await page.locator("#ya-parola").innerText()).trim();
  expect(parola).toMatch(/^[A-Za-z2-9]{5}-[A-Za-z2-9]{5}-[A-Za-z2-9]{5}$/);

  /* yeni firmanın adresine geçici parolayla girilir → parola değiştir ekranı */
  const kisi = await (await browser.newContext()).newPage();
  await kisi.goto(`${firmaAdresi}/giris`);
  await hazir(kisi);
  await kisi.getByLabel("E-posta").fill(F.eposta);
  await kisi.getByLabel("Parola", { exact: true }).fill(parola);
  await kisi.getByRole("button", { name: "Giriş yap" }).click();
  await expect(kisi).toHaveURL(/\/giris\/parola$/);

  /* firma sayfası: dondur → firma adresi kapanır; etkinleştir; yeni geçici parola */
  await page.getByRole("link", { name: "Firma sayfası" }).click();
  await expect(page.getByRole("heading", { level: 1, name: F.unvan })).toBeVisible();
  await expect(page.getByText("Etkin", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Dondur" }).click();
  await page.locator("dialog[open]").getByRole("button", { name: "Dondur" }).click();
  await expect(page.getByText("Dondurulmuş: firmanın kullanıcıları ve müşterileri giriş yapamaz", { exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: "Yöneticiye yeni geçici parola" })).toBeDisabled();
  await kisi.goto(`${firmaAdresi}/giris`);
  await expect(kisi.getByText("Bu adreste kayıtlı bir firma yok.", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Etkinleştir" }).click();
  await expect(page.getByRole("button", { name: "Dondur" })).toBeVisible();
  await page.getByRole("button", { name: "Yöneticiye yeni geçici parola" }).click();
  await page.locator("dialog[open]").getByRole("button", { name: "Oluştur" }).click();
  await expect(page.locator("#yf-parola")).toBeVisible();
  const yeni = (await page.locator("#yf-parola").innerText()).trim();
  expect(yeni).not.toBe(parola);
  await kisi.goto(`${firmaAdresi}/giris`);
  await hazir(kisi);
  await kisi.getByLabel("E-posta").fill(F.eposta);
  await kisi.getByLabel("Parola", { exact: true }).fill(yeni);
  await kisi.getByRole("button", { name: "Giriş yap" }).click();
  await expect(kisi).toHaveURL(/\/giris\/parola$/);
  await kisi.context().close();

  /* listede yeni firma; çıkış */
  await page.getByRole("link", { name: "Firmalar" }).first().click();
  await expect(page.getByRole("link", { name: F.unvan }).first()).toBeVisible();
  await page.getByRole("button", { name: /· kendi işlemlerim/ }).click();
  await page.getByRole("menuitem", { name: "Çıkış yap" }).click();
  await expect(page).toHaveURL(/\/yonetim\/giris\?neden=cikis$/);
  await expect(page.getByText("Çıkış yaptınız; oturumunuz kapatıldı.")).toBeVisible();
  await page.goto(`${Y}/yonetim`);
  await expect(page).toHaveURL(/\/yonetim\/giris/);
});

test("yönetim: kurulmuş yönetici — parola, yanlış kod reddedilir, doğru kodla girer", async ({ page }, bilgi) => {
  await parolaAdimi(page, E2E_YONETIM.proje(bilgi.project.name).etkin, E2E_PAROLA);
  await expect(page).toHaveURL(/\/yonetim\/giris\/kod$/);
  await hazir(page);
  const dogru = totpKodu(E2E_YONETIM.anahtar, zamanAdimi(new Date()));
  await page.getByLabel("Doğrulama kodu").fill(dogru === "000000" ? "111111" : "000000");
  await page.getByRole("button", { name: "Doğrula" }).click();
  await expect(page.getByText("Kod yanlış ya da süresi geçti.", { exact: false })).toBeVisible();
  await page.getByLabel("Doğrulama kodu").fill(totpKodu(E2E_YONETIM.anahtar, zamanAdimi(new Date())));
  await page.getByRole("button", { name: "Doğrula" }).click();
  await expect(page).toHaveURL(/\/yonetim$/);
  await expect(page.getByRole("heading", { level: 1, name: "Firmalar" })).toBeVisible();
});
