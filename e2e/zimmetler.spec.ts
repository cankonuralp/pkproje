/* NEREDEN GELDİ: K2 Zimmetler (2026-10-04) — maket zimmetler.html (M4 2. tur). Gerçek tarayıcıda, üç genişlikte: demirbaş ekle (depoda) → teslim
   et (kişiye, fotoğrafsız uyarısı) → varlık sayfası "Zimmette", geçmişte "Depo → kişi" · Hareketler sekmesinde kayıt · denetçi (kendi) yalnız
   kendi zimmetini görür, teslim edemez. Her proje kendi uydurma demirbaşını açar. */
import { expect, test } from "@playwright/test";
import { girisli, hazir } from "./yardimci";

test("zimmet: demirbaş ekle, kişiye teslim, hareketler; denetçi yalnız kendi zimmetini görür", async ({ page, context }, bilgi) => {
  const kod = `DM-${bilgi.project.name.slice(0, 3).toUpperCase()}${bilgi.retry}`;
  await girisli(page, "yonetici");
  await page.goto("/zimmetler");
  await hazir(page);
  await page.getByRole("button", { name: "Demirbaş ekle" }).click();
  const d = page.getByRole("dialog", { name: "Demirbaş ekle" });
  await d.getByLabel("Kod").fill(kod);
  await d.getByLabel("Ad").fill("Deneme merdiven");
  await d.getByRole("button", { name: "Kaydet" }).click();
  await expect(page.getByText(`${kod} eklendi; depoda.`)).toBeVisible();

  await page.getByRole("button", { name: "Teslim et" }).click();
  const t = page.getByRole("dialog", { name: "Teslim et" });
  await t.getByRole("combobox", { name: "Varlık" }).click();
  const ara = t.getByRole("searchbox", { name: "Varlık içinde ara" });
  if (await ara.count()) await ara.fill(kod);
  await t.getByRole("option", { name: new RegExp(kod) }).click();
  await t.getByRole("combobox", { name: "Teslim alan" }).click();
  await t.getByRole("option", { name: "Deneme Denetçi" }).click();
  await expect(t.getByText("Fotoğraf yok.")).toBeVisible();
  await t.getByRole("button", { name: "Teslimi kaydet" }).click();
  await expect(page).toHaveURL(/\/zimmetler\/varlik\/d\/[0-9a-f-]{36}$/, { timeout: 30_000 });
  await expect(page.getByRole("heading", { level: 1, name: `${kod} · Deneme merdiven` })).toBeVisible();
  await expect(page.getByText("Depo → Deneme Denetçi").first()).toBeVisible();

  await page.goto("/zimmetler/hareketler");
  await hazir(page);
  await expect(page.getByRole("link", { name: kod }).first()).toBeAttached();

  /* denetçi: kendi zimmetini görür, teslim edemez */
  await context.clearCookies();
  await girisli(page, "denetci");
  await page.goto("/zimmetler");
  await hazir(page);
  await expect(page.getByRole("link", { name: kod })).toBeAttached();
  await expect(page.getByRole("button", { name: "Teslim et" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Demirbaş ekle" })).toHaveCount(0);
});
