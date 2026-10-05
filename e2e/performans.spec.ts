/* NEREDEN GELDİ: K4 Performans (329) — maket performans.html (M15). Gerçek tarayıcıda, üç genişlikte: yönetici panoyu açar (yüzler, tamamlanma
   süresi, grafikler, personel tablosu) → "Bu yıl" (adres değişir) → Mekanik branşı → denetçinin sayfası (Günlük iş, süreç grafikleri; yana taşma
   yok) · denetçi Performans'ta yalnız kendi sayfasını görür, kazanç yok · muhasebe göremez. Tohum: muhasebe tohumunun imzalı raporları (bu ay). */
import { expect, test } from "@playwright/test";
import { E2E_HESAPLAR } from "./hesaplar";
import { girisli, hazir } from "./yardimci";

const TASMA = () => document.documentElement.scrollWidth <= window.innerWidth;

test("performans: pano, dönem ve branş anahtarı, kişi sayfası; denetçi yalnız kendisi (kazançsız); muhasebe göremez", async ({ page, context }) => {
  test.setTimeout(150_000);
  const den = E2E_HESAPLAR.denetci.ad;
  await girisli(page, "yonetici");
  await page.goto("/performans");
  await hazir(page);
  await expect(page.getByRole("heading", { level: 1, name: "Performans" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Tamamlanma süresi" })).toBeVisible();
  await expect(page.getByText("Kazanç", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: den }).first()).toBeVisible();
  expect(await page.evaluate(TASMA), "pano yana taşmaz").toBe(true);

  await page.getByRole("group", { name: "Dönem" }).getByRole("button", { name: "Bu yıl" }).click();
  await expect(page).toHaveURL(/\/performans\?donem=yil$/, { timeout: 30_000 });
  await expect(page.getByText("Aylık rapor").first()).toBeVisible();
  await hazir(page);
  await page.getByRole("group", { name: "Branş" }).getByRole("button", { name: "Mekanik" }).click();
  await expect(page).toHaveURL(/donem=yil&brans=m$/, { timeout: 30_000 });
  await expect(page.getByRole("group", { name: "Branş" }).getByRole("button", { name: "Mekanik" })).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("link", { name: den }).first().click();
  await expect(page).toHaveURL(/\/performans\/[0-9a-f-]{36}/, { timeout: 30_000 });
  await expect(page.getByRole("heading", { level: 1, name: den })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Günlük iş" })).toBeVisible();
  await expect(page.getByText("Rapor süreci · ortalama süre (saat)").first()).toBeVisible();
  expect(await page.evaluate(TASMA), "kişi sayfası yana taşmaz").toBe(true);

  await context.clearCookies();
  await girisli(page, "denetci");
  await page.goto("/performans");
  await expect(page.getByRole("heading", { level: 1, name: den })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("navigation", { name: "Konum" })).toHaveCount(0);
  await expect(page.getByText("Kazanç", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Personel", exact: true })).toHaveCount(0);

  await context.clearCookies();
  await girisli(page, "muhasebe");
  await page.goto("/performans");
  await expect(page.getByText("Bu sayfayı görme yetkiniz yok")).toBeVisible();
});
