/* uçtan uca ortak adımlar: girişi gerçek formdan yapar (çerez sunucunun yazdığı) */
import { expect, type Page } from "@playwright/test";
import { E2E_HESAPLAR, E2E_PAROLA } from "./hesaplar";

export async function girisYap(page: Page, kim: keyof typeof E2E_HESAPLAR = "yonetici", parola = E2E_PAROLA) {
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
