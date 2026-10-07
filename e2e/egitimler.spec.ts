/* NEREDEN GELDİ: K2 Eğitimler (2026-10-04) — maket egitimler.html (M16; Dökümanlar sekmesi). Gerçek tarayıcıda, üç genişlikte: eğitim türü ekle
   (tekrar süresi) → eğitim kaydı ekle (kişi, eğitim, tarih, veren) → listede, tekrarı geçmiş şeridi · denetçi yalnız kendi kaydını görür,
   ekleyemez. Her proje kendi uydurma eğitim türünü açar. 345: kaydın katılım formu denetçinin imzasına gönderilir, Onaylar › Diğer'ine düşer. */
import { expect, test } from "@playwright/test";
import { girisli, hazir } from "./yardimci";

test("eğitimler: tür ekle, kayıt ekle; denetçi yalnız kendi kaydını görür", async ({ page, context }, bilgi) => {
  test.setTimeout(150_000);   // ilk koşuda sayfalar soğuk derlenir; katılım formunun PDF'i sunucuda basılır
  const ad = `Deneme eğitimi ${bilgi.project.name} ${bilgi.retry}`;
  await girisli(page, "yonetici");
  await page.goto("/dokumanlar/egitimler/turler");
  await hazir(page);
  await page.getByRole("button", { name: "Eğitim türü ekle" }).click();
  const t = page.getByRole("dialog", { name: "Eğitim türü ekle" });
  await t.getByLabel("Eğitim").fill(ad);
  await t.getByLabel("Tekrar süresi (ay)").fill("12");
  await t.getByRole("button", { name: "Kaydet" }).click();
  await expect(page.getByText(`${ad} eklendi.`)).toBeVisible({ timeout: 30_000 });

  await page.goto("/dokumanlar/egitimler");
  await hazir(page);
  await page.getByRole("button", { name: "Eğitim kaydı ekle" }).click();
  const k = page.getByRole("dialog", { name: "Eğitim kaydı ekle" });
  await k.getByRole("combobox", { name: "Personel" }).click();
  await k.getByRole("option", { name: "Deneme Denetçi" }).click();
  await k.getByRole("combobox", { name: "Eğitim" }).click();
  const ara = k.getByRole("searchbox", { name: "Eğitim içinde ara" });
  if (await ara.count()) await ara.fill(ad);
  await k.getByRole("option", { name: new RegExp(ad) }).click();
  await k.getByLabel("Eğitim tarihi").fill("10.03.2025");
  await k.getByRole("combobox", { name: "Veren" }).click();
  await k.getByRole("option", { name: "Firma içi" }).click();
  await k.getByRole("button", { name: "Kaydet" }).click();
  await expect(page.getByText("Eğitim kaydı eklendi.")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(/eğitimin tekrarı geçti/)).toBeVisible();
  /* 345: katılım formu denetçinin imzasına (önce sorulur) */
  /* liste bu testin eğitimine süzülür (aynı kişi ve tarihte başka genişliğin kaydı olabilir — 340–345 incelemesi) */
  await page.getByRole("searchbox", { name: "Eğitimlerde ara" }).fill(ad);
  await expect(page.getByRole("button", { name: "Deneme Denetçi" })).toHaveCount(1);
  await page.getByRole("button", { name: "Deneme Denetçi" }).click();
  const g = page.getByRole("dialog", { name: ad });
  await g.getByRole("button", { name: "Katılım formunu imzaya gönder" }).click();
  await page.getByRole("dialog", { name: "Katılım formunu imzaya gönder" }).getByRole("button", { name: "İmzaya gönder" }).click();
  await expect(page.getByText(`${ad} katılım formu Deneme Denetçi imzasına gönderildi.`)).toBeVisible({ timeout: 90_000 });

  /* denetçi: kendi kaydını görür, ekleyemez */
  await context.clearCookies();
  await girisli(page, "denetci");
  await page.goto("/dokumanlar/egitimler");
  await hazir(page);
  await expect(page.getByText(ad).first()).toBeAttached();
  await expect(page.getByRole("button", { name: "Eğitim kaydı ekle" })).toHaveCount(0);
  await page.goto("/onaylar/diger");
  await hazir(page);
  await expect(page.getByText(`${ad} katılım formu`, { exact: false }).first()).toBeVisible();
});

/* 371 (§9 elli üçüncü tur): yanlış girilen (sertifikasız, formsuz) eğitim kaydı silinir; kaydı kalmayan tür de silinir */
test("eğitimler: kullanılmamış kayıt ve tür silinir", async ({ page }, bilgi) => {
  test.setTimeout(120_000);
  const ad = `Silinecek eğitim ${bilgi.project.name} ${bilgi.retry}`;
  await girisli(page, "yonetici");
  await page.goto("/dokumanlar/egitimler/turler");
  await hazir(page);
  await page.getByRole("button", { name: "Eğitim türü ekle" }).click();
  const t = page.getByRole("dialog", { name: "Eğitim türü ekle" });
  await t.getByLabel("Eğitim").fill(ad);
  await t.getByLabel("Tekrar süresi (ay)").fill("12");
  await t.getByRole("button", { name: "Kaydet" }).click();
  await expect(page.getByText(`${ad} eklendi.`)).toBeVisible({ timeout: 30_000 });

  await page.goto("/dokumanlar/egitimler");
  await hazir(page);
  await page.getByRole("button", { name: "Eğitim kaydı ekle" }).click();
  const k = page.getByRole("dialog", { name: "Eğitim kaydı ekle" });
  await k.getByRole("combobox", { name: "Personel" }).click();
  await k.getByRole("option", { name: "Deneme Denetçi" }).click();
  await k.getByRole("combobox", { name: "Eğitim" }).click();
  const ara = k.getByRole("searchbox", { name: "Eğitim içinde ara" });
  if (await ara.count()) await ara.fill(ad);
  await k.getByRole("option", { name: new RegExp(ad) }).click();
  await k.getByLabel("Eğitim tarihi").fill("10.03.2025");
  await k.getByRole("combobox", { name: "Veren" }).click();
  await k.getByRole("option", { name: "Firma içi" }).click();
  await k.getByRole("button", { name: "Kaydet" }).click();
  await expect(page.getByText("Eğitim kaydı eklendi.")).toBeVisible({ timeout: 30_000 });
  await page.getByRole("searchbox", { name: "Eğitimlerde ara" }).fill(ad);
  await page.getByRole("button", { name: "Deneme Denetçi" }).click();
  const g = page.getByRole("dialog", { name: ad });
  await g.getByRole("button", { name: "Sil", exact: true }).click();
  const onay = page.locator("dialog[open]").filter({ hasText: "Geri alınamaz" });
  await expect(onay).toContainText(`Deneme Denetçi · ${ad} kalıcı olarak silinir; varsa bir önceki kaydı güncel olur. Geri alınamaz.`);
  await onay.getByRole("button", { name: "Sil" }).click();
  await expect(page.getByText(`Deneme Denetçi · ${ad} silindi.`).first()).toBeVisible({ timeout: 30_000 });

  await page.goto("/dokumanlar/egitimler/turler");
  await hazir(page);
  await page.getByRole("button", { name: `${ad} türünü sil` }).click();
  const onay2 = page.locator("dialog[open]");
  await expect(onay2).toContainText(`${ad} kalıcı olarak silinir. Geri alınamaz.`);
  await onay2.getByRole("button", { name: "Sil" }).click();
  await expect(page.getByText(`${ad} silindi.`).first()).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("button", { name: `${ad} türünü sil` })).toHaveCount(0);
});
