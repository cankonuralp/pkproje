/* uçtan uca ortak adımlar: girişi gerçek formdan yapar (çerez sunucunun yazdığı) */
import { expect, type Page } from "@playwright/test";
import { E2E_HESAPLAR, E2E_PAROLA } from "./hesaplar";

/* 2026-10-08 (402): önceden indirme (396) yalnız e2e/cevrimdisi.spec.ts'te sınanır; öteki testlerde cihaz "az önce indirildi" sayılır — her
   denetçi testinde arka planda onlarca plan / rapor sayfası çizilip geliştirme sunucusu bellek sınırına dayanıyordu (son testler düşüyordu).
   Uygulamanın davranışı değişmez (30 dakika kuralı, src/components/cevrimdisi/Cevrimdisi.tsx). */
const ONINDIRME_YAPILDI = () => {
  try { localStorage.setItem("probata-cevrimdisi-hazir", JSON.stringify({ plan: 0, zaman: new Date().toISOString() })); } catch { /* depo yok */ }
};

export async function girisYap(page: Page, kim: keyof typeof E2E_HESAPLAR = "yonetici", parola = E2E_PAROLA) {
  await page.addInitScript(ONINDIRME_YAPILDI);
  await page.goto("/giris");
  await expect(page.getByRole("button", { name: "Giriş yap" })).toBeEnabled();
  await page.getByLabel("E-posta").fill(E2E_HESAPLAR[kim].eposta);
  await page.getByLabel("Parola", { exact: true }).fill(parola);
  await page.getByRole("button", { name: "Giriş yap" }).click();
}

export async function girisli(page: Page, kim: keyof typeof E2E_HESAPLAR = "yonetici") {
  await girisYap(page, kim);
  await expect(page.locator("header")).toContainText(E2E_HESAPLAR[kim].ad);
}

/** tam sayfa yüklemesinden sonra React bağlanana kadar bekle (bağlanmadan önceki tıklama kaybolur — src/components/hazir/Hazir.tsx) */
export async function hazir(page: Page) {
  await expect(page.locator("html[data-hazir]")).toHaveCount(1);
}
