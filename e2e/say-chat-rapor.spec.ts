/* NEREDEN GELDİ: 2026-11-09 S.A.Y Chat Rapor modu (sunum claude.ai HBwuL3s9G693uopxSzTbjH K1–K6 — "Evet, önerilerle"). Gerçek sunucuda, üç genişlikte, YZ firmasının denetçisiyle; her genişlik kendi
   raporsuz ekipmanında (E2E_YZ.bosEkipman): Rapor moduna geçilir → Yeni kayıt: fotoğraf + ekipman + satır satır mesaj → Gönder → kart → Bekleyenler için rapor yaz → "Rapor açıldı" → raporda
   mesajın marka değeri. Etiket fotoğrafı yok: yapay zekâ çağrısı yok. Mod panel yeniden açılınca korunur (K6). */
import { expect, test, type Page } from "@playwright/test";
import { E2E_KAPI, E2E_PAROLA, E2E_YZ } from "./hesaplar";
import { hazir } from "./yardimci";

const Y = `http://${E2E_YZ.firma.kisaAd}.localhost:${E2E_KAPI}`;
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");
async function giris(page: Page) {
  await page.goto(`${Y}/giris`);
  await hazir(page);
  await page.getByLabel("E-posta").fill(E2E_YZ.denetci.eposta);
  await page.getByLabel("Parola", { exact: true }).fill(E2E_PAROLA);
  await page.getByRole("button", { name: "Giriş yap" }).click();
  await expect(page.locator("header")).toContainText(E2E_YZ.denetci.ad);
}

test("Rapor modu: fotoğraf, ekipman, mesaj → kayıt → rapor taslağı; marka rapora geçer; mod korunur", async ({ page }, bilgi) => {
  test.setTimeout(150_000);
  const kod = E2E_YZ.bosEkipman[bilgi.project.name]!, marka = `Marka${bilgi.project.name}`;
  await giris(page);
  await page.getByRole("button", { name: "S.A.Y Chat — kişisel sohbet" }).click({ timeout: 30_000 });
  const panel = page.getByRole("dialog", { name: "S.A.Y Chat" });
  await panel.getByRole("group", { name: "Mod" }).getByRole("button", { name: "Rapor" }).click();
  await panel.getByRole("button", { name: "Yeni kayıt" }).click({ timeout: 30_000 });
  await panel.getByRole("button", { name: "Fotoğraf çek" }).click();
  await panel.getByLabel("Galeriden / bilgisayardan seç").setInputFiles([{ name: "a.png", mimeType: "image/png", buffer: PNG }]);
  await expect(panel.getByRole("list", { name: "Kaydın fotoğrafları" }).getByRole("listitem")).toHaveCount(1, { timeout: 30_000 });
  await panel.getByRole("button", { name: "Ekipman seç" }).click();
  const secim = page.getByRole("dialog", { name: "Ekipman seçin" });
  await secim.getByLabel("Ara").fill(kod);
  await secim.getByRole("button", { name: new RegExp(kod) }).click();
  await panel.getByLabel("Mesaj").fill(marka);
  await panel.getByRole("button", { name: "Gönder" }).click();

  const yaz = panel.getByRole("button", { name: /Bekleyenler için rapor yaz \(\d+\)/ });
  await expect(yaz).toBeVisible({ timeout: 30_000 });
  await yaz.click();
  const baglanti = panel.getByRole("link", { name: /Rapor açıldı:/ }).last();
  await expect(baglanti).toBeVisible({ timeout: 60_000 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), "yana taşma").toBe(true);

  await baglanti.click();
  await expect(page).toHaveURL(/\/raporlar\/[0-9a-f-]{36}$/, { timeout: 30_000 });
  await expect(panel).toHaveCount(0);
  await hazir(page);
  await expect(page.locator("main")).toContainText(kod);

  await page.getByRole("button", { name: "S.A.Y Chat — kişisel sohbet" }).click();
  await expect(panel.getByRole("group", { name: "Mod" }).getByRole("button", { name: "Rapor" })).toHaveAttribute("aria-pressed", "true");
});
