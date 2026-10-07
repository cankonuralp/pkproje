/* NEREDEN GELDİ: K2 Sözleşmeler (2026-10-04) — maket sozlesmeler.html (M5 + M13 2. tur). Gerçek tarayıcıda, üç genişlikte: müşteri + tesis →
   yeni iş sözleşmesi (tesis seçmeden reddedilir; numara IS-AAYY-SIRA) → sözleşme sayfası "İmza bekliyor" → İSG-KATİP ID ekle (denetçi) → tabloda
   görünür · denetçi kendi ID'li sözleşmeyi görür, ID ekleyemez. Her proje kendi uydurma müşterisini açar. */
import { expect, test } from "@playwright/test";
import { girisli, hazir } from "./yardimci";

test("sözleşme: hazırla, İSG-KATİP ID ekle; denetçi yalnız görür", async ({ page, context }, bilgi) => {
  test.setTimeout(90_000);   // ilk koşuda üç sayfa (müşteri, tesis, sözleşme) soğuk derlenir
  const ek = `${bilgi.project.name} ${bilgi.retry}`;
  await girisli(page, "yonetici");
  await page.goto("/musteriler");
  await hazir(page);
  await page.getByRole("button", { name: "Müşteri ekle" }).click();
  const p = page.getByRole("dialog", { name: "Müşteri ekle" });
  await p.getByLabel("Ünvan").fill(`Sözleşme Deneme ${ek} A.Ş.`);
  await p.getByLabel("Kısa ad").fill(`Söz ${ek}`);
  await p.getByRole("button", { name: "Kaydet" }).click();
  await expect(page).toHaveURL(/\/musteriler\/[0-9a-f-]{36}$/, { timeout: 30_000 });
  await hazir(page);
  await page.getByRole("button", { name: "Tesis ekle" }).click();
  const t = page.getByRole("dialog", { name: "Tesis ekle" });
  await t.getByLabel("Tesis adı").fill("Merkez Fabrika");
  await t.getByRole("button", { name: "Kaydet" }).click();
  await expect(page).toHaveURL(/\/musteriler\/tesis\/[0-9a-f-]{36}$/, { timeout: 30_000 });

  await page.goto("/sozlesmeler/yeni");
  await hazir(page);
  await page.getByRole("combobox", { name: "Müşteri" }).click();
  const ara = page.getByRole("searchbox", { name: "Müşteri içinde ara" });
  if (await ara.count()) await ara.fill(`Söz ${ek}`);
  await page.getByRole("option", { name: `Söz ${ek}` }).click();
  await page.getByLabel("Başlangıç").fill("01.10.2026");
  await page.getByLabel("Süre (ay)").fill("12");
  await page.getByLabel("Ödeme vadesi (gün)").fill("30");
  await page.getByRole("button", { name: "Sözleşmeyi hazırla" }).click();
  await expect(page.getByText("En az bir tesis seçilmeli.")).toBeVisible();
  await page.getByRole("checkbox", { name: /Merkez Fabrika/ }).check();
  await page.getByRole("button", { name: "Sözleşmeyi hazırla" }).click();
  await expect(page).toHaveURL(/\/sozlesmeler\/[0-9a-f-]{36}$/, { timeout: 30_000 });
  await expect(page.getByRole("heading", { level: 1, name: /^IS-1026-\d{3}$/ })).toBeVisible();
  await expect(page.getByText("Müşteri imzası bekleniyor.", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sil", exact: true })).toBeVisible();   // 369: imza bekleyen, kullanılmamış

  await hazir(page);
  await page.getByRole("button", { name: "ID ekle" }).click();
  const w = page.getByRole("dialog", { name: "İSG-KATİP SÖZLEŞME ID ekle" });
  await w.getByRole("combobox", { name: "Denetçi" }).click();
  await w.getByRole("option", { name: "Deneme Denetçi" }).click();
  await w.locator("#iw-no").fill(`ISG-${ek}`);
  await w.getByRole("button", { name: "Kaydet" }).click();
  await expect(page.getByText(`ISG-${ek}`, { exact: true })).toBeVisible({ timeout: 30_000 });
  const adres = page.url();

  /* 369: yanlış hazırlanmış ikinci sözleşme (imza beklerken) silinir → listeye dönülür */
  await page.goto("/sozlesmeler/yeni");
  await hazir(page);
  await page.getByRole("combobox", { name: "Müşteri" }).click();
  const ara2 = page.getByRole("searchbox", { name: "Müşteri içinde ara" });
  if (await ara2.count()) await ara2.fill(`Söz ${ek}`);
  await page.getByRole("option", { name: `Söz ${ek}` }).click();
  await page.getByLabel("Başlangıç").fill("01.11.2026");
  await page.getByLabel("Süre (ay)").fill("12");
  await page.getByLabel("Ödeme vadesi (gün)").fill("30");
  await page.getByRole("checkbox", { name: /Merkez Fabrika/ }).check();
  await page.getByRole("button", { name: "Sözleşmeyi hazırla" }).click();
  await expect(page).toHaveURL(/\/sozlesmeler\/[0-9a-f-]{36}$/, { timeout: 30_000 });
  const no2 = (await page.getByRole("heading", { level: 1 }).textContent())!.trim();
  await hazir(page);
  await page.getByRole("button", { name: "Sil", exact: true }).click();
  const onay = page.locator("dialog[open]");
  await expect(onay).toContainText(`${no2} kalıcı olarak silinir; imza beklerken silinir, kapsam tesisleri de çıkar. Geri alınamaz.`);
  await onay.getByRole("button", { name: "Sil" }).click();
  await expect(page).toHaveURL(/\/sozlesmeler$/, { timeout: 30_000 });
  await expect(page.getByText(`${no2} silindi.`).first()).toBeVisible();

  /* denetçi: kendi ID'li sözleşmeyi görür, ID ekleyemez */
  await context.clearCookies();
  await girisli(page, "denetci");
  await page.goto(adres);
  await hazir(page);
  await expect(page.getByText(`ISG-${ek}`, { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "ID ekle" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "İmzalı sözleşmeyi yükle" })).toHaveCount(0);
});
