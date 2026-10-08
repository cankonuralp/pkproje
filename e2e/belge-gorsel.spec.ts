/* NEREDEN GELDİ: 418 — KOD-GECIS §11 "Görsel referans: dondurulmuş ekran (Planlar + plan içi) ve Bakanlık formatlı PDF için ekran görüntüsü
   karşılaştırması" (ekranlarınki 411). Rapor belgesi üç şablonda (ZPKR01, ZPKR02, kompresör): PDF'e basılan HTML'in AYNISI (src/belge/pdf.ts
   belgeHtml — aynı çizici, aynı CSS, gömülü Carlito), baskı görünümünde A4 genişliğinde çekilir ve kayıtlı görüntüyle karşılaştırılır
   (e2e/goruntu/masaustu/belge-*.png). Veri uydurma (src/belge/ornek.ts). Sunucuya gitmez (her istek kesilir, pdf.ts gibi); belge A4 olduğundan
   ekran genişliğinden bağımsız → yalnız masaüstü projesinde. Kasıtlı bir belge değişikliğinde görüntüler yeniden kaydedilir (gözden geçirilerek). */
import { expect, test } from "@playwright/test";
import { ornekBelge } from "../src/belge/ornek";
import { belgeHtml } from "../src/belge/pdf";

/** A4 (210 × 297 mm) 96 dpi'da */
const A4 = { width: 794, height: 1123 };

for (const sablon of ["ZPKR01", "ZPKR02", "KOMPRESOR"] as const) {
  test(`görsel: rapor belgesi ${sablon} (PDF'in HTML'i, baskı görünümü, A4)`, async ({ page }, bilgi) => {
    test.skip(bilgi.project.name !== "masaustu", "belge A4 genişliğinde — ekran genişliğinden bağımsız, bir kez yeter");
    await page.setViewportSize(A4);
    await page.emulateMedia({ media: "print", colorScheme: "light" });
    await page.route("**/*", (r) => r.abort());
    await page.setContent(belgeHtml(ornekBelge(sablon)), { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready.then(() => undefined));
    expect(await page.evaluate(() => [...document.fonts].some((f) => f.family.includes("Carlito") && f.status === "loaded")), "Carlito yüklenmedi").toBe(true);
    await expect(page).toHaveScreenshot(`belge-${sablon.toLowerCase()}.png`, { fullPage: true });
  });
}
