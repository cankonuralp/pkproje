/* NEREDEN GELDİ: K4 Firma ayarları (334) — maket firma-ayarlari.html (R1 ayrı modül, Z1 bölüm başına Kaydet). Gerçek tarayıcıda, üç genişlikte:
   yönetici adresi değiştirir → bölümde "Kaydedilmedi" + Kaydet → kaydedildi, yenilemede kalır · geçersiz firma kodu kaydedilmez (alanın altında) ·
   mesai takibini açar, toplam 660 dk'yı aşınca kanun şeridi, Vazgeç geri alır · logo yükler, kaldırır (önce sorulur) · yana taşma yok · denetçi
   göremez. Firma kodu ve sabit giderler değiştirilmez (öteki testlerin rapor numaraları ve gelir-gider tutarları). */
import { expect, test } from "@playwright/test";
import { girisli, hazir } from "./yardimci";

const parca = (ad: string, govde: string) => Buffer.concat([Buffer.from([0, 0, govde.length >> 8, govde.length & 0xff]), Buffer.from(ad + govde, "latin1"), Buffer.from([0, 0, 0, 0])]);
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), parca("IHDR", "\0\0\0\x01\0\0\0\x01\x08\x02\0\0\0"), parca("IDAT", "veri"), parca("IEND", "")]);

test("firma ayarları: bölüm kaydet, geçersiz değer kaydedilmez, mesai şeridi, logo; denetçi göremez", async ({ page, context }, bilgi) => {
  test.setTimeout(150_000);
  const adres = `Deneme Cad. No ${["masaustu", "tablet", "telefon"].indexOf(bilgi.project.name) + 1}`;
  await girisli(page, "yonetici");
  await page.goto("/firma-ayarlari");
  await hazir(page);
  await expect(page.getByRole("heading", { level: 1, name: "Firma ayarları" })).toBeVisible();
  const firma = page.getByRole("region", { name: "Firma bilgileri" });
  await firma.getByLabel("Adres").fill(adres);
  await expect(firma.getByText("Kaydedilmedi")).toBeVisible();
  await firma.getByRole("button", { name: "Kaydet" }).click();
  await expect(page.getByText(/^Firma bilgileri kaydedildi/).first()).toBeVisible({ timeout: 30_000 });
  await expect(firma.getByText("Kaydedilmedi")).toHaveCount(0);
  await page.reload();
  await hazir(page);
  await expect(page.getByRole("region", { name: "Firma bilgileri" }).getByLabel("Adres")).toHaveValue(adres);

  /* geçersiz firma kodu: kaydedilmez, nedeni alanın altında */
  const kod = page.getByRole("region", { name: "Rapor numarası" });
  await kod.getByLabel("Firma kodu").fill("K1");
  await kod.getByRole("button", { name: "Kaydet" }).click();
  await expect(kod.getByText("2 harf olmalı (A–Z; ör. KM). Kaydedilmedi.")).toBeVisible({ timeout: 30_000 });
  await kod.getByRole("button", { name: "Vazgeç" }).click();
  await expect(kod.getByLabel("Firma kodu")).toHaveValue("DM");

  /* mesai: aç, toplam 660'ı aşınca şerit; Vazgeç geri alır */
  const mesai = page.getByRole("region", { name: "Mesai takibi" });
  await mesai.getByRole("checkbox").check();
  await mesai.getByLabel("Günlük mesai (dk)").fill("300");
  await expect(mesai.getByText(/Günlük toplam 780 dk/)).toBeVisible();
  await mesai.getByRole("button", { name: "Vazgeç" }).click();
  await expect(mesai.getByRole("checkbox")).not.toBeChecked();

  /* logo: yükle (PNG), görünür; kaldır önce sorulur */
  const [fc] = await Promise.all([page.waitForEvent("filechooser"), firma.getByRole("button", { name: "Logo yükle" }).click()]);
  await fc.setFiles({ name: "logo.png", mimeType: "image/png", buffer: PNG });
  await expect(page.getByText("Firma logosu kaydedildi.").first()).toBeVisible({ timeout: 30_000 });
  await expect(firma.getByRole("link", { name: /Firma logosu: logo\.png/ })).toBeVisible();
  await firma.getByRole("button", { name: "Firma logosu kaldır" }).click();
  await page.getByRole("dialog", { name: "Firma logosu kaldırılsın mı?" }).getByRole("button", { name: "Kaldır" }).click();
  await expect(page.getByText("Firma logosu kaldırıldı.").first()).toBeVisible({ timeout: 30_000 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), "yana taşma yok").toBe(true);

  await context.clearCookies();
  await girisli(page, "denetci");
  await page.goto("/firma-ayarlari");
  await expect(page.getByText("Bu sayfayı görme yetkiniz yok")).toBeVisible({ timeout: 30_000 });
});
