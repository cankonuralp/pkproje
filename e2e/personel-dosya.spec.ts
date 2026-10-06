/* NEREDEN GELDİ: K2 Personel dosyası (2026-10-04) — maket personel.html (özlük dosyası, maaş ve bordrolar, zimmetindekiler, ekipman atamaları).
   Gerçek tarayıcıda, üç genişlikte: yönetici yeni kişide özlük belgesi ekler (PDF), bordro yükler (tutar doğrulaması, maaş satırları son bordrodan),
   belgeyi kaldırır (onay penceresi) · denetçi kendi kartında atama ve zimmet bölümlerini görür, özlük ve maaşı görmez. Her proje kendi kişisini açar.
   344: yönetici denetçinin kartında zimmet teslim formunu indirir ve imzaya gönderir; form denetçinin Onaylar › Diğer belgeler'ine düşer. */
import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { girisli, hazir } from "./yardimci";

const PDF = { name: "belge.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n") };

test("personel dosyası: özlük belgesi, bordro, kaldır; denetçi özlük ve maaşı görmez", async ({ page, context }, bilgi) => {
  test.setTimeout(90_000);   // ilk koşuda sayfalar soğuk derlenir
  const ad = `Dosya Kişi ${bilgi.project.name} ${bilgi.retry}`;
  await girisli(page, "yonetici");
  await page.goto("/personel/yeni");
  await hazir(page);
  await page.getByLabel("Ad soyad").fill(ad);
  await page.getByLabel("İşe başlama").fill("01.02.2024");
  await page.getByRole("combobox", { name: "Meslek" }).click();
  await page.getByRole("option", { name: /Teknisyen/ }).click();
  await page.getByRole("button", { name: "Kaydet" }).click();
  await expect(page.locator("h1")).toHaveText(ad, { timeout: 30_000 });
  await hazir(page);
  await expect(page.getByText("Özlük dosyasında belge yok.")).toBeVisible();
  await expect(page.getByText("Bordro yüklenmedi.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Ekipman atamaları" })).toHaveCount(0);   // denetçi değil

  /* özlük belgesi */
  await page.getByRole("button", { name: "Belge ekle" }).click();
  const o = page.getByRole("dialog", { name: "Özlük belgesi ekle" });
  await o.getByRole("button", { name: "Yükle" }).click();
  await expect(o.getByText("Belge (PDF) seçilmeli.")).toBeVisible();
  await o.getByRole("combobox", { name: "Belge türü" }).click();
  await o.getByRole("option", { name: "Diploma" }).click();
  await o.getByLabel("Açıklama").fill("Lisans diploması");
  await o.locator("#pdw-dosya").setInputFiles(PDF);
  await o.getByRole("button", { name: "Yükle" }).click();
  await expect(page.getByText("Belge eklendi.")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("Lisans diploması")).toBeVisible();

  /* bordro: net brütten büyük olamaz */
  await page.getByRole("button", { name: "Bordro yükle" }).click();
  const b = page.getByRole("dialog", { name: "Bordro yükle" });
  await b.getByRole("combobox", { name: "Dönem" }).click();
  await b.getByRole("option").nth(1).click();
  await b.locator("#pdw-brut").fill("50.000,00");
  await b.locator("#pdw-net").fill("60.000");
  await b.locator("#pdw-maliyet").fill("66.000");
  await b.locator("#pdw-dosya").setInputFiles(PDF);
  await b.getByRole("button", { name: "Yükle" }).click();
  await expect(b.getByText("Net, brütten büyük olamaz.")).toBeVisible();
  await b.locator("#pdw-net").fill("39.000");
  await b.locator("#pdw-dosya").setInputFiles(PDF);
  await b.getByRole("button", { name: "Yükle" }).click();
  await expect(page.getByText("Bordro yüklendi.")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("3.000,00 TL")).toBeVisible();   // günlük maliyet = 66.000 / 22
  /* 333: bordro onaya gönderilir (önce sorulur); e-imzaya uygun olmayan PDF (kökü olmayan trailer) gönderilmez — neden bildirimde */
  await expect(page.getByText("Gönderilmedi", { exact: true }).filter({ visible: true }).first()).toBeVisible();
  await page.getByRole("button", { name: /bordrosunu onaya gönder$/ }).click();
  await page.getByRole("dialog", { name: "Bordroyu onaya gönder" }).getByRole("button", { name: "Onaya gönder" }).click();
  await expect(page.getByText("Bu PDF e-imzaya uygun biçimde değil; belgeyi programından yeniden PDF olarak kaydedip yükleyin.").first()).toBeVisible({ timeout: 30_000 });

  /* kaldır: önce sorulur */
  await page.getByRole("button", { name: "Diploma kaldır" }).first().click();
  await page.getByRole("dialog", { name: "Diploma kaldırılsın mı?" }).getByRole("button", { name: "Kaldır" }).click();
  await expect(page.getByText("Özlük dosyasında belge yok.")).toBeVisible({ timeout: 30_000 });

  /* 344: denetçinin kartında zimmet teslim formu — indir (PDF) ve imzaya gönder (önce sorulur) */
  await page.goto("/personel");
  await page.getByRole("link", { name: "Deneme Denetçi" }).first().click();
  await expect(page.locator("h1")).toHaveText("Deneme Denetçi", { timeout: 30_000 });
  await hazir(page);
  const [indirilen] = await Promise.all([page.waitForEvent("download", { timeout: 90_000 }), page.getByRole("link", { name: "Formu indir" }).click()]);
  expect(indirilen.suggestedFilename()).toMatch(/^zimmet-teslim-formu-\d{4}-\d{2}-\d{2}\.pdf$/);
  expect(readFileSync((await indirilen.path())!).subarray(0, 5).toString("latin1")).toBe("%PDF-");
  await page.getByRole("button", { name: "İmzaya gönder" }).click();
  await page.getByRole("dialog", { name: "Zimmet formunu imzaya gönder" }).getByRole("button", { name: "İmzaya gönder" }).click();
  await expect(page.getByText(/ZF-\d{4}-\d{3} zimmet teslim formu imzaya gönderildi/).first()).toBeVisible({ timeout: 90_000 });

  /* denetçi: kendi kartı — atama ve zimmet var, özlük ve maaş yok */
  await context.clearCookies();
  await girisli(page, "denetci");
  await page.goto("/personel");
  await page.getByRole("link", { name: "Deneme Denetçi" }).first().click();
  await expect(page.locator("h1")).toHaveText("Deneme Denetçi", { timeout: 30_000 });
  await expect(page.getByRole("heading", { name: "Ekipman atamaları" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Zimmetindekiler" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Özlük dosyası" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Maaş ve bordrolar" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Atama ekle" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "İmzaya gönder" })).toHaveCount(0);
  /* 344: gönderilen zimmet formu denetçinin imzasını bekliyor */
  await page.goto("/onaylar/diger");
  await hazir(page);
  await expect(page.getByText(/^Zimmet teslim formu · ZF-\d{4}-\d{3}$/).first()).toBeVisible();
});
