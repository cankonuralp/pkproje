/* NEREDEN GELDİ: 387 — KOD-GECIS ENGEL 11 ("süre dolunca depodan siler (30 gün önce firma yöneticisine liste)"; maket firma-ayarlari "silinecekler
   30 gün önce size listelenir"). Gerçek sunucuda, üç genişlikte, uydurma YZ firmasında süresi 10 gün sonra dolacak tohum raporuyla:
   · firma yöneticisi: Uyarılar'da "Saklama süresi" (Yaklaşıyor) → Firma ayarları › Saklama süresi dolacak raporlar: rapor no, müşteri / tesis, kalan
     gün; rapor bağlantısı rapora gider; Firma ayarları'ndaki saklama kartından da açılır; yana taşma yok;
   · denetçi: liste sayfası "yetkiniz yok", Uyarılar'da saklama yok.
   Silmenin kendisi (gece işi, koruma, firma süzgeci) gerçek PostgreSQL kilidinde: tests/saklama.test.ts. */
import { expect, test, type Page } from "@playwright/test";
import { E2E_KAPI, E2E_PAROLA, E2E_YZ } from "./hesaplar";
import { hazir } from "./yardimci";

const Y = `http://${E2E_YZ.firma.kisaAd}.localhost:${E2E_KAPI}`;
const TASMA = () => document.documentElement.scrollWidth <= window.innerWidth;

async function gir(page: Page, h: { eposta: string; ad: string }) {
  await page.goto(`${Y}/giris`);
  await hazir(page);
  await page.getByLabel("E-posta").fill(h.eposta);
  await page.getByLabel("Parola", { exact: true }).fill(E2E_PAROLA);
  await page.getByRole("button", { name: "Giriş yap" }).click();
  await expect(page.locator("header")).toContainText(h.ad);
}

test("saklama süresi: firma yöneticisi Uyarılar'da görür, listeyi açar; rapora gider", async ({ page }) => {
  test.setTimeout(120_000);
  await gir(page, E2E_YZ.yonetici);
  await page.goto(`${Y}/uyarilar?tur=saklama`);
  await hazir(page);
  const uyari = page.getByRole("link", { name: "1 raporun PDF'i" });
  await expect(uyari).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("Yaklaşıyor").first()).toBeVisible();
  expect(await page.evaluate(TASMA), "Uyarılar: yana taşma yok").toBe(true);
  await uyari.click();
  await expect(page).toHaveURL(/\/firma-ayarlari\/saklama$/, { timeout: 30_000 });
  await hazir(page);
  await expect(page.getByRole("heading", { level: 1, name: "Saklama süresi dolacak raporlar" })).toBeVisible();
  await expect(page.getByText("Saklama süresi 5 yıl.", { exact: false })).toBeVisible();
  /* tam ad: aynı satırdaki "PDF indir" bağlantısının adı da rapor no ile başlar */
  const rapor = page.getByRole("link", { name: E2E_YZ.saklama.rapor, exact: true });
  await expect(rapor).toBeVisible();
  await expect(page.getByText(E2E_YZ.saklama.tesis).first()).toBeVisible();
  await expect(page.getByText(/\d+ gün kaldı/).first()).toBeVisible();
  expect(await page.evaluate(TASMA), "liste: yana taşma yok").toBe(true);
  await rapor.click();
  await expect(page).toHaveURL(/\/raporlar\/[0-9a-f-]{36}$/, { timeout: 30_000 });

  /* Firma ayarları › Rapor saklama süresi kartından da açılır */
  await page.goto(`${Y}/firma-ayarlari`);
  await hazir(page);
  await page.getByRole("link", { name: "Saklama süresi dolacak raporlar" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Saklama süresi dolacak raporlar" })).toBeVisible({ timeout: 30_000 });
});

test("saklama süresi: denetçi listeyi açamaz, Uyarılar'da saklama yok", async ({ page }) => {
  test.setTimeout(120_000);
  await gir(page, E2E_YZ.denetci);
  await page.goto(`${Y}/firma-ayarlari/saklama`);
  await hazir(page);
  await expect(page.getByText("Bu sayfayı görme yetkiniz yok")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(E2E_YZ.saklama.rapor)).toHaveCount(0);
  await page.goto(`${Y}/uyarilar`);
  await hazir(page);
  await expect(page.getByRole("heading", { level: 1, name: "Uyarılar" })).toBeVisible();
  await expect(page.getByText("raporun PDF'i")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Saklama süresi" })).toHaveCount(0);
});
