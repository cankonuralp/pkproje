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

/* 362 (§9 elli üçüncü tur): kullanılmamış demirbaşı yönetici siler (kod serbest); kullanılmış demirbaşta Sil yok — zimmetteyken Pasife al reddedilir,
   depoya alınınca pasife alınır (rozet + şerit, teslim tuşu kalkar, etkin listeden kalkar — Görünüm: Pasif kilidi kesin-silme.test), Etkinleştir geri getirir. */
test("demirbaş: kullanılmamış silinir; kullanılmış pasife alınır, etkinleştirilir", async ({ page }, bilgi) => {
  const ek = `${bilgi.project.name.slice(0, 3).toUpperCase()}${bilgi.retry}`;
  const ekle = async (kod: string) => {
    await page.goto("/zimmetler");
    await hazir(page);
    await page.getByRole("button", { name: "Demirbaş ekle" }).click();
    const d = page.getByRole("dialog", { name: "Demirbaş ekle" });
    await d.getByLabel("Kod").fill(kod);
    await d.getByLabel("Ad").fill("Deneme baret");
    await d.getByRole("button", { name: "Kaydet" }).click();
    await expect(page.getByText(`${kod} eklendi; depoda.`)).toBeVisible();
    await page.getByRole("searchbox", { name: "Varlıklarda ara" }).fill(kod);
    await page.getByRole("link", { name: kod, exact: true }).click();
    await expect(page.getByRole("heading", { level: 1, name: `${kod} · Deneme baret` })).toBeVisible({ timeout: 30_000 });
    await hazir(page);
  };
  const teslim = async (alan: string) => {
    await page.getByRole("button", { name: "Teslim et" }).click();
    const t = page.getByRole("dialog", { name: "Teslim et" });
    await t.getByRole("combobox", { name: "Teslim alan" }).click();
    await t.getByRole("option", { name: alan, exact: true }).click();
    await t.getByRole("button", { name: "Teslimi kaydet" }).click();
    await expect(t).toHaveCount(0, { timeout: 30_000 });
    await hazir(page);
  };
  await girisli(page, "yonetici");

  /* kullanılmamış: Sil → listeye döner, kod serbest */
  const sil = `DS-${ek}`;
  await ekle(sil);
  await expect(page.getByRole("button", { name: "Pasife al" })).toHaveCount(0);
  await page.getByRole("button", { name: "Sil", exact: true }).click();
  const onay = page.locator("dialog[open]");
  await expect(onay).toContainText(`${sil} kalıcı olarak silinir; kodu yeniden kullanılabilir. Geri alınamaz.`);
  await onay.getByRole("button", { name: "Sil" }).click();
  await expect(page).toHaveURL(/\/zimmetler$/, { timeout: 30_000 });
  await expect(page.getByText(`${sil} silindi.`).first()).toBeVisible();
  await ekle(sil);

  /* kullanılmış: zimmetteyken Pasife al reddedilir; depoya alınınca pasif */
  const kod = `DP-${ek}`;
  await ekle(kod);
  await teslim("Deneme Denetçi");
  await expect(page.getByRole("button", { name: "Sil", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Pasife al" }).click();
  const p = page.locator("dialog[open]");
  await expect(p).toContainText("1 zimmet hareketinde kullanıldı; silinemez.");
  await expect(p).toContainText(`${kod} bir kişinin zimmetinde; önce depoya teslim alın.`);
  await expect(p.getByRole("button", { name: "Pasife al" })).toBeDisabled();
  await p.getByRole("button", { name: "Vazgeç" }).click();
  await teslim("Depo");
  await page.getByRole("button", { name: "Pasife al" }).click();
  await page.locator("dialog[open]").getByRole("button", { name: "Pasife al" }).click();
  await expect(page.getByText(`${kod} pasife alındı; geçmişi duruyor.`).first()).toBeVisible();
  await expect(page.getByText(/Pasif: Zimmetler listesinden ve teslimden kalktı/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Teslim et" })).toHaveCount(0);
  const adres = page.url();

  await page.goto("/zimmetler");
  await hazir(page);
  await page.getByRole("searchbox", { name: "Varlıklarda ara" }).fill(kod);
  await expect(page.getByRole("link", { name: kod, exact: true })).toHaveCount(0);

  await page.goto(adres);
  await hazir(page);
  await page.getByRole("button", { name: "Etkinleştir" }).click();
  await page.locator("dialog[open]").getByRole("button", { name: "Etkinleştir" }).click();
  await expect(page.getByText(`${kod} yeniden etkinleştirildi.`).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Teslim et" })).toBeVisible();
});
