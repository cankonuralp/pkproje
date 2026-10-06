/* NEREDEN GELDİ: K4 Firma ayarları › Toplu içe aktarma (ilk kurulum) (337) — maket firma-ayarlari iceCiz. Gerçek tarayıcıda, üç genişlikte: yönetici
   türü seçer, Excel (CSV) seçer → satır denetimi tablosu ("Eklenecek" + uyarı notu, atlanma nedeni) ve "İçe aktar (N)" · Vazgeç · yana taşma yok.
   Yalnız masaüstünde (son içe aktarma geri alındığı için projeler yarışmasın): içe aktarır → son içe aktarımlarda → Geri al (önce sorulur) →
   "geri alındı". Denetçi bölümü göremez (sayfa yetkisiz). */
import { expect, test } from "@playwright/test";
import { girisli, hazir } from "./yardimci";

test("toplu içe aktarma: CSV denetimi, içe aktar ve geri al", async ({ page }, bilgi) => {
  test.setTimeout(150_000);
  const n = ["masaustu", "tablet", "telefon"].indexOf(bilgi.project.name) + 1;
  const csv = ["Plaka*;Araç türü*;Marka*;Model*;Model yılı*;Yakıt*;Kilometre;Muayene bitişi;Trafik sigortası bitişi;Kasko bitişi",
    `34 IA 10${n};Hafif ticari araç;Örnek;Van;2021;Dizel;68000;10.05.2027;31.02.2027;`,
    `34 IA 10${n};Kamyon;Örnek;Van;2021;Dizel;;;;`,
    "ABC;Kamyon;Örnek;Van;2021;Dizel;;;;"].join("\n");
  await girisli(page, "yonetici");
  await page.goto("/firma-ayarlari");
  await hazir(page);
  const b = page.getByRole("region", { name: "Toplu içe aktarma (ilk kurulum)" });
  await b.getByRole("combobox", { name: "Ne yüklenecek" }).click();
  await page.getByRole("option", { name: "Araçlar" }).click();
  await expect(b.getByText(/^Sütunlar: Plaka\* · Araç türü\*/)).toBeVisible();
  const [fc] = await Promise.all([page.waitForEvent("filechooser"), b.getByRole("button", { name: "Excel seç" }).click()]);
  await fc.setFiles({ name: "araclar.csv", mimeType: "text/csv", buffer: Buffer.from(csv, "utf8") });
  await expect(b.getByText("satır içe aktarılacak")).toBeVisible({ timeout: 30_000 });
  const tablo = b.getByRole("table", { name: "Satır denetimi" });
  await expect(tablo.getByRole("row")).toHaveCount(4);
  await expect(tablo.getByText("okunmayan belge tarihi boş girer")).toBeVisible();
  await expect(tablo.getByText("Dosyada aynı plaka iki kez")).toBeVisible();
  await expect(tablo.getByText("Plaka 34 ABC 123 biçiminde")).toBeVisible();
  await expect(b.getByRole("button", { name: "İçe aktar (1)" })).toBeEnabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), "yana taşma yok").toBe(true);

  if (bilgi.project.name !== "masaustu") {
    await b.getByRole("button", { name: "Vazgeç" }).click();
    await expect(tablo).toHaveCount(0);
    await expect(b.getByRole("button", { name: "Excel seç" })).toBeFocused();
    return;
  }
  await b.getByRole("button", { name: "İçe aktar (1)" }).click();
  await expect(page.getByText(/^Araçlar: 1 kayıt içe aktarıldı; 2 satır atlandı/).first()).toBeVisible({ timeout: 30_000 });
  const geri = b.getByRole("button", { name: "Geri al" });
  await expect(geri).toBeVisible({ timeout: 30_000 });
  await geri.click();
  await page.getByRole("dialog", { name: "İçe aktarmayı geri al" }).getByRole("button", { name: "Geri al" }).click();
  await expect(page.getByText(/^Araçlar: içe aktarma geri alındı/).first()).toBeVisible({ timeout: 30_000 });
  await expect(b.getByText("geri alındı").first()).toBeVisible({ timeout: 30_000 });
  await expect(b.getByRole("button", { name: "Geri al" })).toHaveCount(0);
});
