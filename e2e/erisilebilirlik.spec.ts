/* NEREDEN GELDİ: 410 — EKSIKLER-VE-ONERILER §7 ("otomatik erişilebilirlik taraması en azından açılış ekranı ve bir form için"), CLAUDE.md §6 "Sonra:
   Playwright + erişilebilirlik (ilk ekranlar)". Gerçek tarayıcıda, üç genişlikte, axe (WCAG 2.1 A + AA kuralları): giriş, Ana sayfa, Planlar,
   plan içi, personel formu, saha raporu. Ciddi ve kritik ihlal 0 olmalı (renk karşıtlığı dahil — renk çiftleri ayrıca tests/kontrast.test.ts'te).
   Düşerse ileti hangi kuralın hangi öğede bozulduğunu söyler. Geliştirme sunucusunun kendi katmanı (nextjs-portal) taranmaz. */
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { E2E_KAPI, E2E_PAROLA, E2E_YZ } from "./hesaplar";
import { girisli, hazir } from "./yardimci";

async function tara(page: Page, ekran: string) {
  await hazir(page);
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).exclude("nextjs-portal").analyze();
  const ciddi = r.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  const ileti = ciddi.map((v) => `${v.id} (${v.impact}): ${v.help} — ${v.nodes.slice(0, 4).map((n) => n.target.join(" ")).join(" | ")}`).join("\n");
  expect(ciddi, `${ekran}: erişilebilirlik ihlali\n${ileti}`).toEqual([]);
}

test("erişilebilirlik: giriş ekranı", async ({ page }) => {
  await page.goto("/giris");
  await tara(page, "giriş");
});

test("erişilebilirlik: Ana sayfa, Planlar, plan içi, personel formu (firma yöneticisi)", async ({ page }) => {
  test.setTimeout(180_000);
  await girisli(page, "yonetici");
  await page.goto("/");
  await tara(page, "Ana sayfa");
  await page.goto("/planlar");
  await tara(page, "Planlar");
  await page.getByRole("link", { name: /^P-/ }).first().click();
  await expect(page).toHaveURL(/\/planlar\/[0-9a-f-]{36}$/, { timeout: 30_000 });
  await tara(page, "plan içi");
  await page.goto("/personel/yeni");
  await tara(page, "personel formu");
});

test("erişilebilirlik: saha raporu (denetçi)", async ({ page }, bilgi) => {
  test.setTimeout(180_000);
  const Y = `http://${E2E_YZ.firma.kisaAd}.localhost:${E2E_KAPI}`;
  await page.goto(`${Y}/giris`);
  await hazir(page);
  await page.getByLabel("E-posta").fill(E2E_YZ.denetci.eposta);
  await page.getByLabel("Parola", { exact: true }).fill(E2E_PAROLA);
  await page.getByRole("button", { name: "Giriş yap" }).click();
  await expect(page.locator("header")).toContainText(E2E_YZ.denetci.ad);
  await page.goto(`${Y}/raporlar`);
  await hazir(page);
  await page.getByRole("searchbox", { name: "Ekipman kodu" }).fill(E2E_YZ.ekipman[bilgi.project.name]);
  await page.getByRole("link", { name: /^YZ-/ }).first().click();
  await expect(page).toHaveURL(/\/raporlar\/[0-9a-f-]{36}$/, { timeout: 30_000 });
  await tara(page, "saha raporu");
});
