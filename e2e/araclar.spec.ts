/* NEREDEN GELDİ: K2 Araçlar (2026-10-04) — maket araclar.html (AA4 + haftalık kilometre). Gerçek tarayıcıda, üç genişlikte: araç ekle (depoda)
   → teslim tutanağı (kişiye; kilometre, yakıt) → araç sayfası "Zimmette", tutanak listede · sürücü (denetçi, kendi) yalnız kendi aracını görür,
   bu haftanın kilometresini yazar, araç ekleyemez. Her proje kendi uydurma plakasını açar. 342: tutanağın PDF'i iner; tutanak teslim alanın
   (denetçi) Onaylar › Diğer belgeler'ine imzaya düşer. */
import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { girisli, hazir } from "./yardimci";

test("araç: ekle, teslim tutanağı, sürücü haftalık kilometre", async ({ page, context }, bilgi) => {
  const plaka = `00 ${bilgi.project.name.slice(0, 3).toLocaleUpperCase("tr")} ${10 + bilgi.retry}`;
  await girisli(page, "yonetici");
  await page.goto("/araclar");
  await hazir(page);
  await page.getByRole("button", { name: "Araç ekle" }).click();
  const d = page.getByRole("dialog", { name: "Araç ekle" });
  await d.getByLabel("Plaka").fill(plaka);
  await d.getByRole("combobox", { name: "Araç türü" }).click();
  await d.getByRole("option", { name: "Kamyonet" }).click();
  await d.getByLabel("Marka").fill("Deneme");
  await d.locator("#aw-model").fill("Model");
  await d.getByLabel("Model yılı").fill("2022");
  await d.getByRole("combobox", { name: "Yakıt" }).click();
  await d.getByRole("option", { name: "Dizel" }).click();
  await d.getByLabel("Kilometre (kayıt anında)").fill("1000");
  await d.getByRole("button", { name: "Aracı ekle" }).click();
  await expect(page).toHaveURL(/\/araclar\/[0-9a-f-]{36}$/, { timeout: 30_000 });
  await expect(page.getByRole("heading", { level: 1, name: `${plaka} · Kamyonet` })).toBeVisible();

  await page.getByRole("button", { name: "Teslim tutanağı" }).click();
  const t = page.getByRole("dialog", { name: "Araç teslim tutanağı" });
  await t.getByRole("combobox", { name: "Teslim alan" }).click();
  await t.getByRole("option", { name: "Deneme Denetçi" }).click();
  await t.locator("#tw-km").fill("900");
  await t.getByRole("combobox", { name: "Yakıt seviyesi" }).click();
  await t.getByRole("option", { name: "1/2" }).click();
  await t.getByRole("button", { name: "Tutanağı kaydet" }).click();
  await expect(t.getByText("Son bilinen kilometreden (1.000) küçük olamaz.")).toBeVisible();
  await t.locator("#tw-km").fill("1.200");
  await t.getByRole("button", { name: "Tutanağı kaydet" }).click();
  await expect(page.getByText(/Tutanak AT-\d{4}-\d{3} kaydedildi/)).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("Zimmette").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Tutanak" }).first()).toBeAttached();
  /* 363: kullanılmış araçta Sil yok; zimmetteyken Pasife al reddedilir */
  await hazir(page);
  await expect(page.getByRole("button", { name: "Sil", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Pasife al" }).click();
  const pp = page.locator("dialog[open]");
  await expect(pp).toContainText("1 zimmet hareketinde kullanıldı; silinemez.");
  await expect(pp).toContainText(`${plaka} bir kişinin zimmetinde; önce teslim tutanağıyla depoya alın.`);
  await expect(pp.getByRole("button", { name: "Pasife al" })).toBeDisabled();
  await pp.getByRole("button", { name: "Vazgeç" }).click();
  /* 342: tutanağın PDF'i iner (temel format) */
  const [indirilen] = await Promise.all([page.waitForEvent("download", { timeout: 90_000 }), page.getByRole("link", { name: /^AT-\d{4}-\d{3} PDF$/ }).first().click()]);
  expect(indirilen.suggestedFilename()).toMatch(/^AT-\d{4}-\d{3}\.pdf$/);
  expect(readFileSync((await indirilen.path())!).subarray(0, 5).toString("latin1")).toBe("%PDF-");
  await page.goto("/araclar/tutanaklar");
  await hazir(page);
  await expect(page.getByRole("link", { name: plaka }).first()).toBeAttached();
  await page.goto("/araclar/sablon");
  await hazir(page);
  await expect(page.getByRole("heading", { name: "Araçta olanlar" })).toBeVisible();

  /* sürücü: kendi aracını görür, kilometre yazar, araç ekleyemez */
  await context.clearCookies();
  await girisli(page, "denetci");
  await page.goto("/araclar");
  await hazir(page);
  await expect(page.getByRole("heading", { level: 1, name: "Aracım" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Araç ekle" })).toHaveCount(0);
  await page.getByLabel(`${plaka} · bu hafta kilometre`).fill("1.500");
  await page.getByLabel(`${plaka} · bu hafta kilometre`).press("Enter");
  await expect(page.getByText(`${plaka}: bu haftanın kilometresi kaydedildi.`)).toBeVisible({ timeout: 30_000 });
  /* 342: teslim tutanağı sürücünün imzasını bekliyor (Onaylar › Diğer belgeler) */
  await page.goto("/onaylar/diger");
  await hazir(page);
  await expect(page.getByText(new RegExp(`^Araç teslim tutanağı · AT-\\d{4}-\\d{3} · ${plaka}$`)).first()).toBeVisible();
});

/* 363 (§9 elli üçüncü tur): hiç kullanılmamış aracı yönetici siler; plaka yeniden kullanılabilir */
test("araç: kullanılmamış araç silinir, plaka serbest kalır", async ({ page }, bilgi) => {
  const plaka = `00 ${bilgi.project.name.slice(0, 3).toLocaleUpperCase("tr")} ${30 + bilgi.retry}`;
  const ekle = async () => {
    await page.goto("/araclar");
    await hazir(page);
    await page.getByRole("button", { name: "Araç ekle" }).click();
    const d = page.getByRole("dialog", { name: "Araç ekle" });
    await d.getByLabel("Plaka").fill(plaka);
    await d.getByRole("combobox", { name: "Araç türü" }).click();
    await d.getByRole("option", { name: "Binek araç" }).click();
    await d.getByLabel("Marka").fill("Deneme");
    await d.locator("#aw-model").fill("Model");
    await d.getByLabel("Model yılı").fill("2021");
    await d.getByRole("combobox", { name: "Yakıt" }).click();
    await d.getByRole("option", { name: "Benzin" }).click();
    await d.getByRole("button", { name: "Aracı ekle" }).click();
    await expect(page).toHaveURL(/\/araclar\/[0-9a-f-]{36}$/, { timeout: 30_000 });
    await expect(page.getByRole("heading", { level: 1, name: `${plaka} · Binek araç` })).toBeVisible();
    await hazir(page);
  };
  await girisli(page, "yonetici");
  await ekle();
  await expect(page.getByRole("button", { name: "Pasife al" })).toHaveCount(0);
  await page.getByRole("button", { name: "Sil", exact: true }).click();
  const onay = page.locator("dialog[open]");
  await expect(onay).toContainText(`${plaka} kalıcı olarak silinir; plakası yeniden kullanılabilir. Geri alınamaz.`);
  await onay.getByRole("button", { name: "Sil" }).click();
  await expect(page).toHaveURL(/\/araclar$/, { timeout: 30_000 });
  await expect(page.getByText(`${plaka} silindi.`).first()).toBeVisible();
  await expect(page.getByRole("link", { name: plaka })).toHaveCount(0);
  await ekle();
});
