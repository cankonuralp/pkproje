/* NEREDEN GELDİ: K2 Eğitimler (2026-10-04) — maket egitimler.html (M16; Dökümanlar sekmesi). Gerçek tarayıcıda, üç genişlikte: eğitim türü ekle
   (tekrar süresi) → eğitim kaydı ekle (kişi, eğitim, tarih, veren) → listede, tekrarı geçmiş şeridi · denetçi yalnız kendi kaydını görür,
   ekleyemez. Her proje kendi uydurma eğitim türünü açar. */
import { expect, test } from "@playwright/test";
import { girisli, hazir } from "./yardimci";

test("eğitimler: tür ekle, kayıt ekle; denetçi yalnız kendi kaydını görür", async ({ page, context }, bilgi) => {
  test.setTimeout(90_000);   // ilk koşuda sayfalar soğuk derlenir
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

  /* denetçi: kendi kaydını görür, ekleyemez */
  await context.clearCookies();
  await girisli(page, "denetci");
  await page.goto("/dokumanlar/egitimler");
  await hazir(page);
  await expect(page.getByText(ad).first()).toBeAttached();
  await expect(page.getByRole("button", { name: "Eğitim kaydı ekle" })).toHaveCount(0);
});
