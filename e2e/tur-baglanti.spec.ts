/* NEREDEN GELDİ: K2 Ekipman türü bağlantıları (2026-10-04) — maket ekipman-turleri.html yirmi dördüncü tur. Gerçek tarayıcıda, üç genişlikte:
   cihaz ekle (yeni cihaz türüyle) → tür ekle → tür sayfasında "Metot ve cihazlar" → cihaz türünü işaretle → "Kullanılacak ölçüm cihazları"nda
   görünür · denetçi tür sayfasını görür, düzenleyemez. Her proje kendi uydurma türünü açar. */
import { expect, test } from "@playwright/test";
import { girisli, hazir } from "./yardimci";

test("tür bağlantısı: ölçüm cihazı türü seç; denetçi yalnız görür", async ({ page, context }, bilgi) => {
  test.setTimeout(90_000);   // ilk koşuda sayfalar soğuk derlenir
  const on = { masaustu: "BM", tablet: "BT", telefon: "BF" }[bilgi.project.name] ?? "BX";
  const kod = `${on}${"ABCDEFGH"[bilgi.retry]}`, cihazTuru = `Bağlantı ölçer ${kod}`;
  await girisli(page, "yonetici");
  await page.goto("/olcum-cihazlari");
  await hazir(page);
  await page.getByRole("button", { name: "Cihaz ekle" }).click();
  const c = page.getByRole("dialog", { name: "Cihaz ekle" });
  await c.getByLabel("Cihaz kodu").fill(`OC-${kod}`);
  const tur = c.getByRole("combobox", { name: "Cihaz türü" });
  if (await tur.count()) { await tur.click(); await c.getByRole("option", { name: "Yeni tür…" }).click(); }
  await c.getByLabel("Yeni tür adı").fill(cihazTuru);
  await c.getByRole("button", { name: "Kaydet" }).click();
  await expect(page).toHaveURL(/\/olcum-cihazlari\/[0-9a-f-]{36}$/, { timeout: 30_000 });

  await page.goto("/ekipman-turleri");
  await hazir(page);
  await page.getByRole("button", { name: "Tür ekle" }).click();
  const p = page.getByRole("dialog", { name: "Tür ekle" });
  await p.getByLabel("Tür adı").fill(`Deneme Kaldıraç ${kod}`);
  await p.getByLabel("Kod").fill(kod);
  await p.getByRole("combobox", { name: "Ek-III grubu" }).click();
  await p.getByRole("option", { name: /Kaldırma ve iletme/ }).click();
  await p.getByLabel("Periyot (ay)").fill("12");
  await p.getByRole("button", { name: "Kaydet" }).click();
  await expect(page).toHaveURL(/\/ekipman-turleri\/[0-9a-f-]{36}$/, { timeout: 30_000 });
  await expect(page.getByText("Ölçüm cihazı seçilmemiş; raporda cihaz şartı aranmaz.")).toBeVisible();

  await hazir(page);
  await page.getByRole("button", { name: "Metot ve cihazlar" }).click();
  const w = page.getByRole("dialog", { name: "Kontrol metodu ve ölçüm cihazları" });
  await w.getByRole("checkbox", { name: cihazTuru }).check();
  await w.getByRole("button", { name: "Kaydet" }).click();
  await expect(page.getByText("Kontrol metodu ve ölçüm cihazları kaydedildi.")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("listitem").filter({ hasText: cihazTuru })).toBeVisible();
  const adres = page.url();

  await context.clearCookies();
  await girisli(page, "denetci");
  await page.goto(adres);
  await hazir(page);
  await expect(page.getByRole("listitem").filter({ hasText: cihazTuru })).toBeVisible();
  await expect(page.getByRole("button", { name: "Metot ve cihazlar" })).toHaveCount(0);
});
