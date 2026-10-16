/* NEREDEN GELDİ: sunum 596 (reisim 2026-10-16: "imzalam sürecinde toplu imzalama için belge seçme vs olmalı"; kararlar: yalnız raporlar, tek ZIP,
   imzalı PDF içeriğinden eşleşir, toplu onay seçilen hepsi, en çok 50, araç e-İmzaTR). Gerçek sunucuda, üç genişlikte, YZ firmasında genişlik
   başına ayrı denetçi (tohum scripts/e2e-sunucu.ts — iki raporu onaylanmış):
   1. TOPLU İMZA: Onaylar › İmzamı bekleyen raporlar → Tümünü seç → çubukta "2 rapor seçili" → İmzaya hazırla → pencerede imzasız PDF'ler sunucuda
      hazırlanır (2 / 2) → ZIP indir (adlar rapor no) → PDF'ler imzalanır (imzasız baytlar + artımlı imza sözlüğü — e-imza aracının yaptığı gibi),
      ADLARI DEĞİŞTİRİLİP ters sırayla tek ZIP'e konur → yüklenir → "2 rapor imzalandı", her biri numarasıyla → Tamam → liste boş.
   2. TOPLU ONAY (yalnız masaüstü — kuyruk firmanın bütün elektrik raporlarını taşır, iki rapor koduyla aranıp seçilir): teknik yönetici iki raporu
      seçer → Seçilenleri onayla → soru → "2 rapor onaylandı." → kuyrukta kalmaz. */
import { expect, test, type Page } from "@playwright/test";
import { zipAc } from "../src/components/disa/oku";
import { zipBayt } from "../src/components/disa/zip";
import { readFileSync } from "node:fs";
import { E2E_KAPI, E2E_PAROLA, E2E_TOPLU, E2E_YZ } from "./hesaplar";
import { hazir } from "./yardimci";

const Y = `http://${E2E_YZ.firma.kisaAd}.localhost:${E2E_KAPI}`;
async function giris(page: Page, h: { eposta: string; ad: string }) {
  await page.goto(`${Y}/giris`);
  await hazir(page);
  await page.getByLabel("E-posta").fill(h.eposta);
  await page.getByLabel("Parola", { exact: true }).fill(E2E_PAROLA);
  await page.getByRole("button", { name: "Giriş yap" }).click();
  await expect(page.locator("header")).toContainText(h.ad);
}
/** imzasız PDF + artımlı imza bölümü (yeni nesnede imza sözlüğü, trailer özgün kökü gösterir — e2e/saha-raporu.spec.ts ile aynı) */
function imzala(ham: Uint8Array): Uint8Array {
  const kok = [...Buffer.from(ham).toString("latin1").matchAll(/\/Root\s+(\d+\s+\d+\s+R)/g)].at(-1)?.[1] ?? "1 0 R";
  return new Uint8Array(Buffer.concat([Buffer.from(ham),
    Buffer.from(`\n9999 0 obj << /Type /Sig /Filter /Adobe.PPKLite /ByteRange [0 10 20 30] /Contents <00ff> >> endobj\ntrailer << /Root ${kok} /Prev 0 >>\n%%EOF\n`, "latin1")]));
}

test("596 toplu imza: iki raporu seç → imzaya hazırla → tek ZIP → adları değişmiş imzalı PDF'ler tek ZIP'le yüklenir → ikisi tamamlanır", async ({ page }, bilgi) => {
  test.setTimeout(300_000);
  const h = E2E_TOPLU.denetci[bilgi.project.name];
  await giris(page, h);
  await page.goto(`${Y}/onaylar/imza`);
  await hazir(page);
  await expect(page.getByText("2 rapor imzanızı bekliyor").first()).toBeVisible({ timeout: 30_000 });
  await page.getByRole("button", { name: "Tümünü seç" }).click();
  const cubuk = page.getByRole("region", { name: "Seçilen raporlar" });
  await expect(cubuk).toContainText("2 rapor seçili");
  await cubuk.getByRole("button", { name: "İmzaya hazırla" }).click();
  const pen = page.getByRole("dialog", { name: "2 raporu imzala" });
  await expect(pen).toBeVisible();
  await expect(pen.getByText("2 / 2 işlendi · 2 hazır")).toBeVisible({ timeout: 180_000 });
  const [indirme] = await Promise.all([page.waitForEvent("download", { timeout: 60_000 }), pen.getByRole("button", { name: "ZIP indir (2 PDF)" }).click()]);
  expect(indirme.suggestedFilename()).toMatch(/^imzalanacak-raporlar-\d{4}-\d{2}-\d{2}\.zip$/);
  const pdfler = await zipAc(new Uint8Array(readFileSync((await indirme.path())!)), 100 << 20, 10);
  expect(pdfler.map((x) => x.ad)).toHaveLength(2);
  for (const x of pdfler) {
    expect(x.ad).toMatch(new RegExp(`^${E2E_YZ.firma.raporKodu}-\\d{4}-\\d{3,}-[0-9a-f]{5}\\.pdf$`));
    expect(Buffer.from(x.bayt.subarray(0, 5)).toString("latin1")).toBe("%PDF-");
  }
  await expect(pen.getByText("İndirildi.")).toBeVisible();
  /* adları değişmiş, ters sırada, tek ZIP: eşleşme içerikten */
  const zip = zipBayt([...pdfler].reverse().map((x, i) => [`imzali/belge (${i + 1}).pdf`, imzala(x.bayt)] as const));
  await pen.getByLabel("İmzalı PDF'leri ya da ZIP'i yükle").setInputFiles({ name: "imzalilar.zip", mimeType: "application/zip", buffer: Buffer.from(zip) });
  const sonuc = page.getByRole("dialog", { name: "2 rapor imzalandı" });
  await expect(sonuc).toBeVisible({ timeout: 120_000 });
  const liste = sonuc.getByRole("list", { name: "Yükleme sonuçları" });
  await expect(liste.getByRole("listitem")).toHaveCount(2);
  for (const x of pdfler) await expect(liste.getByText(x.ad.replace(/\.pdf$/, ""), { exact: true })).toBeVisible();
  await expect(liste.getByText("İmzalandı · müşteriye açıldı")).toHaveCount(2);
  await sonuc.getByRole("button", { name: "Tamam" }).click();
  await expect(page.getByText("İmzanızı bekleyen rapor yok")).toBeVisible({ timeout: 30_000 });
});

test("596 toplu onay: teknik yönetici iki raporu seçer → Seçilenleri onayla → soru → ikisi onaylanır, kuyruktan düşer", async ({ page }, bilgi) => {
  test.skip(bilgi.project.name !== "masaustu", "kuyruk firmanın bütün elektrik raporlarını taşır — tek genişlikte (tohumdaki iki rapor bir kez onaylanır)");
  test.setTimeout(180_000);
  await giris(page, E2E_TOPLU.teknik);
  await page.goto(`${Y}/onaylar`);
  await hazir(page);
  const ara = page.getByRole("searchbox", { name: "Kuyrukta ara" });
  const nolar: string[] = [];
  for (const kod of E2E_TOPLU.onay.ekipman) {
    await ara.fill(kod);
    const kutu = page.getByRole("checkbox", { name: / seç$/ });
    await expect(kutu).toHaveCount(1, { timeout: 30_000 });
    nolar.push(((await kutu.getAttribute("aria-label")) ?? "").replace(/ seç$/, ""));
    await kutu.check();
  }
  await ara.fill("");
  const cubuk = page.getByRole("region", { name: "Seçilen raporlar" });
  await expect(cubuk).toContainText("2 rapor seçili");
  await cubuk.getByRole("button", { name: "Seçilenleri onayla" }).click();
  const soru = page.getByRole("dialog", { name: "2 raporu onayla" });
  await expect(soru).toContainText("Seçilen 2 rapor onaylanacak");
  await soru.getByRole("button", { name: "Onayla" }).click();
  await expect(page.getByText("2 rapor onaylandı.").first()).toBeVisible({ timeout: 60_000 });
  for (const no of nolar) {
    await ara.fill(no);
    await expect(page.getByText("Filtreye uyan rapor yok").or(page.getByText("Onay bekleyen rapor yok"))).toBeVisible({ timeout: 30_000 });
  }
});
