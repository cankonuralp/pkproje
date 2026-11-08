/* NEREDEN GELDİ: 2026-11-08 SAHA LİSTESİ (sunum claude.ai 4ApGDVAfUgvm8C5nTSRVbh sürüm 2 — reisim: "yap"). Gerçek sunucuda, üç genişlikte, YZ firmasının denetçisiyle; her genişlik kendi
   raporsuz ekipmanında (E2E_YZ.bosEkipman): sohbet panelindeki bant planı gösterir → Saha listesi (panel kapanır) → yana taşma yok → "Değil": madde + not → "1 rapor oluştur" →
   özet "1 rapor hazır · Uygun değil" → satır listeden kalkar → plana dönülür, rapor orada. Yapay zekâ çağrısı yok (taklide istek gitmez). */
import { expect, test, type Page } from "@playwright/test";
import { E2E_KAPI, E2E_PAROLA, E2E_YZ } from "./hesaplar";
import { hazir } from "./yardimci";

const Y = `http://${E2E_YZ.firma.kisaAd}.localhost:${E2E_KAPI}`;
async function giris(page: Page) {
  await page.goto(`${Y}/giris`);
  await hazir(page);
  await page.getByLabel("E-posta").fill(E2E_YZ.denetci.eposta);
  await page.getByLabel("Parola", { exact: true }).fill(E2E_PAROLA);
  await page.getByRole("button", { name: "Giriş yap" }).click();
  await expect(page.locator("header")).toContainText(E2E_YZ.denetci.ad);
}

test("sohbetteki banttan Saha listesi: Değil + madde + not, rapor kuyruktan açılır, özet ve plan", async ({ page }, bilgi) => {
  test.setTimeout(120_000);
  const kod = E2E_YZ.bosEkipman[bilgi.project.name]!;
  await giris(page);
  await page.getByRole("button", { name: "S.A.Y Chat — kişisel sohbet" }).click({ timeout: 30_000 });
  const panel = page.getByRole("dialog", { name: "S.A.Y Chat" });
  const bant = panel.getByRole("link", { name: "Saha listesi" });
  await expect(bant).toBeVisible({ timeout: 30_000 });
  await bant.click();
  await expect(page).toHaveURL(/\/raporlar\/saha\/[0-9a-f-]{36}$/, { timeout: 30_000 });
  await expect(panel).toHaveCount(0);
  await hazir(page);
  await expect(page.getByRole("heading", { name: "Saha listesi" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), "yana taşma").toBe(true);

  const satir = page.locator(`tr[data-ekipman="${kod}"]`);
  await expect(satir).toBeVisible();
  await satir.getByRole("button", { name: `${kod} uygun değil` }).click();
  const pencere = page.getByRole("dialog", { name: `${kod} · Uygun değil` });
  await expect(pencere).toBeVisible();
  /* madde seçilmeden kapanmaz */
  await pencere.getByRole("button", { name: "Tamam" }).click();
  await expect(pencere).toBeVisible();
  await pencere.getByRole("checkbox").first().check();
  await pencere.getByLabel("Not").fill("Uçtan uca deneme notu");
  await pencere.getByRole("button", { name: "Tamam" }).click();
  await expect(pencere).toHaveCount(0);
  await expect(satir.getByRole("button", { name: `${kod} uygun değil` })).toHaveAttribute("aria-pressed", "true");
  await expect(satir).toContainText("Uçtan uca deneme notu");

  await page.getByRole("button", { name: "1 rapor oluştur" }).click();
  const ozet = page.getByRole("region", { name: "Saha listesi sonucu" });
  await expect(ozet).toContainText("1 rapor hazır", { timeout: 30_000 });
  await expect(ozet).toContainText("Uygun değil");
  await expect(satir).toHaveCount(0);

  await ozet.getByRole("link", { name: "Raporları aç" }).click();
  await expect(page).toHaveURL(/\/planlar\/[0-9a-f-]{36}$/, { timeout: 30_000 });
  await hazir(page);
  await expect(page.locator("main")).toContainText(kod);
  await expect(page.getByRole("button", { name: `${kod} için rapor oluştur` })).toHaveCount(0);
});
