/* NEREDEN GELDİ: FIRMA-VT.md FV3 (sunum 579; reisim 2026-10-15: "supabase ve resend bağlantılarını firma açarken biz buradan panelden yapalım") —
   yeni firmaların verisi KENDİ veritabanında. Uçtan uca sunucusunda (scripts/e2e-sunucu.ts) "kendivt" firması aynı kümede AYRI veritabanında; merkezde
   yalnız kaydı, şifreli bağlantısı ve kurulumu var — bir de aynı firma kimliğiyle TUZAK müşteri. Gerçek tarayıcıda, yayın derlemesinde, üç genişlikte:
   · adres → merkezdeki kayıt → firmanın veritabanı: giriş sayfası firmayı bulur, firmanın KENDİ veritabanındaki hesapla girilir (merkezde hesabı yok);
   · okuma kendi veritabanından: tohum müşteri görünür, merkezdeki tuzak görünmez;
   · yazma kendi veritabanına: yeni müşteri kaydedilir, sayfası ve listede görünür (merkeze gitseydi veritabanı reddederdi — vt_firma_dogrula);
   · ortak veritabanındaki firma (deneme) bu kaydı ne listede görür ne adresiyle açar.
   Her proje kendi uydurma kaydını açar (çakışmasın). Veritabanına doğrudan sorgu yok — yalnız ekrandan. */
import { expect, test } from "@playwright/test";
import { E2E_KAPI, E2E_KENDI, E2E_PAROLA } from "./hesaplar";
import { girisli, hazir } from "./yardimci";

test("kendi veritabanlı firma: giriş, kayıt yazma; veri kendi veritabanından (merkezdeki tuzak görünmez); ortak firma görmez", async ({ page }, bilgi) => {
  const ek = `${bilgi.project.name} ${bilgi.retry}`;
  const adres = `http://${E2E_KENDI.firma.kisaAd}.localhost:${E2E_KAPI}`;
  const unvan = `Kendi VT Kayıt ${ek} A.Ş.`;

  /* giriş: adres firmayı bulur; hesap firmanın kendi veritabanında */
  await page.goto(`${adres}/giris`);
  await hazir(page);
  await expect(page.getByText(`${E2E_KENDI.firma.kisaAd}.localhost`)).toBeVisible();
  await expect(page.getByText("Bu adreste kayıtlı bir firma yok.", { exact: false })).toHaveCount(0);
  await page.getByLabel("E-posta").fill(E2E_KENDI.yonetici.eposta);
  await page.getByLabel("Parola", { exact: true }).fill(E2E_PAROLA);
  await page.getByRole("button", { name: "Giriş yap" }).click();
  await expect(page.locator("header")).toContainText(E2E_KENDI.yonetici.ad, { timeout: 30_000 });

  /* okuma kendi veritabanından: tohum müşteri var, merkezdeki tuzak (aynı firma kimliğiyle) yok */
  await page.goto(`${adres}/musteriler`);
  await hazir(page);
  await expect(page.getByRole("link", { name: E2E_KENDI.musteri }).first()).toBeVisible();
  await expect(page.getByText(E2E_KENDI.tuzak)).toHaveCount(0);

  /* yazma kendi veritabanına */
  await page.getByRole("button", { name: "Müşteri ekle" }).click();
  const p = page.getByRole("dialog", { name: "Müşteri ekle" });
  await p.getByLabel("Ünvan").fill(unvan);
  await p.getByRole("button", { name: "Kaydet" }).click();
  await expect(page).toHaveURL(/\/musteriler\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("heading", { level: 1, name: unvan })).toBeVisible();
  const kayitYolu = new URL(page.url()).pathname;
  await page.goto(`${adres}/musteriler`);
  await hazir(page);
  await page.getByRole("searchbox", { name: "Müşterilerde ara" }).fill(unvan);
  await expect(page.getByRole("link", { name: unvan }).first()).toBeVisible();
  await expect(page.getByText(E2E_KENDI.tuzak)).toHaveCount(0);

  /* ortak veritabanındaki firma bu kaydı görmez, adresiyle de açamaz */
  await girisli(page, "yonetici");
  await page.goto(kayitYolu);
  await expect(page.getByText("Sayfa bulunamadı")).toBeVisible();
  await page.goto("/musteriler");
  await hazir(page);
  await page.getByRole("searchbox", { name: "Müşterilerde ara" }).fill("Kendi VT");
  await expect(page.getByRole("link", { name: unvan })).toHaveCount(0);
  await expect(page.getByRole("link", { name: E2E_KENDI.musteri })).toHaveCount(0);
});
