/* NEREDEN GELDİ: maket personel.html (M1, onaylı) · K2 Personel 2 (2026-10-04): liste, kart, ekle / düzenle. Yetki gerçek sunucuda:
   yönetici ekler / düzenler; denetçi yalnız kendi kartını görür, başkasının adresi "bulunamadı", form yetkisiz; muhasebe Personel'i göremez. */
import { expect, test } from "@playwright/test";
import { girisli, hazir } from "./yardimci";

test("yönetici: liste, ekle (doğrulama iletileri), kart, düzenle", async ({ page }, bilgi) => {
  await girisli(page, "yonetici");
  await page.goto("/personel");
  await expect(page.locator("h1")).toHaveText("Personel");
  await expect(page.getByRole("link", { name: "Deneme Denetçi" }).first()).toBeVisible();
  await page.getByRole("link", { name: "Personel ekle" }).click();
  await expect(page.locator("h1")).toHaveText("Yeni personel");
  await hazir(page);
  await page.getByRole("button", { name: "Kaydet" }).click();
  await expect(page.getByText("Kaydedilmedi: 3 alan düzeltilmeli.")).toBeVisible();
  await expect(page.getByText("Ad ve soyad yazılmalı.")).toBeVisible();
  await expect(page.getByText("Meslek seçilmeli.")).toBeVisible();
  const ad = `Yeni Kişi ${bilgi.project.name}`;
  await page.getByLabel("Ad soyad").fill(ad);
  await page.getByLabel("İşe başlama").fill("01.02.2024");
  await page.getByRole("combobox", { name: "Meslek" }).click();
  await page.getByRole("option", { name: /Teknisyen/ }).click();
  await expect(page.getByText("Bu meslek yetkili kişi meslekleri arasında değil.")).toBeVisible();
  await expect(page.getByLabel("Ad soyad")).toHaveValue(ad);   // önceki hatalı gönderimde yazılan silinmedi
  await page.getByRole("button", { name: "Kaydet" }).click();
  await expect(page.locator("h1")).toHaveText(ad);
  await expect(page.getByText("Çalışıyor")).toBeVisible();
  await expect(page.getByText("Giriş hesabı yok.")).toBeVisible();
  await hazir(page);
  await page.getByRole("link", { name: "Düzenle" }).click();
  await expect(page.locator("h1")).toHaveText(`${ad} · düzenle`);
  await hazir(page);
  await page.getByLabel("EKİPNET kayıt no").fill("123456");
  await page.getByRole("button", { name: "Kaydet" }).click();
  await expect(page.locator("h1")).toHaveText(ad);
  await expect(page.getByText("123456")).toBeVisible();
});

test("denetçi yalnız kendi kartı; başkasının kartı bulunamadı; form yetkisiz. Muhasebe Personel'i göremez", async ({ page }) => {
  await girisli(page, "yonetici");
  await page.goto("/personel");
  const baskasi = await page.getByRole("link", { name: "Deneme Muhasebe" }).first().getAttribute("href");
  await page.context().clearCookies();
  await girisli(page, "denetci");
  await page.goto("/personel");
  await expect(page.getByRole("link", { name: "Deneme Denetçi" }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Deneme Muhasebe" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Personel ekle" })).toHaveCount(0);
  await page.goto(baskasi!);
  await expect(page.getByText("Sayfa bulunamadı")).toBeVisible();
  await page.goto("/personel/yeni");
  await expect(page.getByText("Bu sayfayı görme yetkiniz yok")).toBeVisible();
  await page.context().clearCookies();
  await girisli(page, "muhasebe");
  await page.goto("/personel");
  await expect(page.getByText("Bu sayfayı görme yetkiniz yok")).toBeVisible();
});
