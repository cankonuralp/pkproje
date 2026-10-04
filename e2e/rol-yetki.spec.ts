/* NEREDEN GELDİ: K2 Personel 4 (2026-10-04) — maket personel.html #/roller; reisim 32. Gerçek tarayıcıda: tablo önerilen düzenle açılır; yönetici
   bir hücreyi değiştirip kaydeder → o roldeki kişinin menüsü bir sonraki sayfada değişir; denetçi düzenle tuşunu görmez; sabit hücre seçilemez.
   Test sonunda önerilen düzene dönülür (öteki testler etkilenmesin). */
import { expect, test } from "@playwright/test";
import { girisli, hazir } from "./yardimci";

test("rol yetkileri: yönetici değiştirir, denetçinin menüsü değişir; önerilen düzene dönülür", async ({ page, context }, bilgi) => {
  await girisli(page, "yonetici");
  await page.goto("/personel/roller");
  await hazir(page);
  /* 2026-10-04: matris FİRMA GENELİ tek ayar; üç genişlik aynı anda koşar → değiştiren adım yalnız masaüstünde (öteki projeler aynı anda
     değiştirip birbirinin beklediği düzeni bozuyordu). Tablet ve telefonda sayfa, sekme ve tablo açılır. */
  if (bilgi.project.name !== "masaustu") {
    await expect(page.getByRole("navigation", { name: "Personel bölümleri" }).getByRole("link", { name: "Rol yetkileri" })).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("button", { name: "Rol yetkilerini düzenle" })).toBeVisible();
    return;
  }
  await expect(page.getByRole("navigation", { name: "Personel bölümleri" }).getByRole("link", { name: "Rol yetkileri" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByText("Önerilen başlangıç düzeni")).toBeVisible();
  await page.getByRole("button", { name: "Rol yetkilerini düzenle" }).click();
  /* firma yöneticisinin Personel hücresi sabit: seçici yok */
  await expect(page.getByRole("combobox", { name: "Personel · Firma yöneticisi" })).toHaveCount(0);
  await page.getByRole("combobox", { name: "Araçlar · Denetçi" }).click();
  await page.getByRole("option", { name: "Görmez" }).click();
  /* 2026-10-04: telefonda alt tuş çubuğunun notu tasarım gereği gizli (Form.module.css) → not DOM'da, Kaydet açık */
  await expect(page.getByText("1 değişiklik kaydedilmedi.")).toBeAttached();
  await expect(page.getByRole("button", { name: "Kaydet" })).toBeEnabled();
  await page.getByRole("button", { name: "Kaydet" }).click();
  await expect(page.getByText(/Rol yetkileri kaydedildi \(1 değişiklik\)/)).toBeVisible();
  await expect(page.getByText("Firmanın kendi düzeni")).toBeVisible();

  await context.clearCookies();
  await girisli(page, "denetci");
  await expect(page.getByRole("navigation").getByRole("link", { name: "Araçlar" })).toHaveCount(0);
  await page.goto("/personel/roller");
  await expect(page.getByRole("button", { name: "Rol yetkilerini düzenle" })).toHaveCount(0);

  await context.clearCookies();
  await girisli(page, "yonetici");
  await page.goto("/personel/roller");
  await hazir(page);
  await page.getByRole("button", { name: "Rol yetkilerini düzenle" }).click();
  await page.getByRole("button", { name: "Önerilen düzene dön" }).click();
  await page.getByRole("button", { name: "Kaydet" }).click();
  await expect(page.getByText("Önerilen başlangıç düzeni")).toBeVisible();
});
