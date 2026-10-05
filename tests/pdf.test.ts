/* NEREDEN GELDİ: pkproje §4.2 ("PDF sunucuda üretilir"), KOD-GECIS (HTML'den PDF'e başsız Chromium), araştırma C ("önce Chromium ölçümü"), reisim
   2026-09-28 ("ön izle halinde PDF halini indirebilmeliyim"). Kesin PDF motoru (src/belge/pdf.ts) gerçek Chromium'la: A4 PDF, Carlito gömülü,
   belge HTML'inde betik yok, sayfa dışarıya gitmez (yazı tipi ve görsel veri adresi). CI'da Chromium testten önce kurulur (.github/workflows/ci.yml).
   Süre ölçülüp yazılır (Vercel ölçümü: src/app/api/olcum/pdf, yalnız önizleme dağıtımı). */
import assert from "node:assert/strict";
import { test } from "node:test";
import { ornekBelge, ornekTeklif } from "../src/belge/ornek.ts";
import { belgeCss, belgeHtml, belgePdf, teklifPdf } from "../src/belge/pdf.ts";

test("belge HTML'i: betik yok, yazı tipi gömülü (dış adres yok)", () => {
  const html = belgeHtml(ornekBelge("ZPKR02"));
  assert.equal(/<script/i.test(html), false);
  assert.ok(belgeCss().includes("data:font/woff2;base64,"));
  assert.equal(/url\("\.\//.test(belgeCss()), false, "göreli yazı tipi adresi kalmadı");
  assert.equal(/(src|href)="https?:/i.test(html), false);
});

test("kesin PDF: üç şablonda A4 PDF basılır, Carlito gömülü, süre makul", async () => {
  for (const k of ["ZPKR01", "ZPKR02", "KOMPRESOR"] as const) {
    const bas = Date.now();
    const pdf = await belgePdf(ornekBelge(k));
    const sure = Date.now() - bas, metin = Buffer.from(pdf).toString("latin1");
    console.log(`PDF ${k}: ${pdf.length} bayt, ${sure} ms`);
    assert.equal(metin.slice(0, 5), "%PDF-", k);
    assert.ok(pdf.length > 5_000, `${k}: ${pdf.length} bayt`);
    assert.ok(/\/Type\s*\/Page\b/.test(metin), `${k}: sayfa yok`);
    assert.ok(/Carlito/.test(metin), `${k}: Carlito gömülü değil`);
    assert.ok(/\/MediaBox\s*\[\s*0\s+0\s+59[45](\.\d+)?\s+841(\.\d+)?\s*\]/.test(metin), `${k}: A4 değil`);
    assert.ok(sure < 30_000, `${k}: ${sure} ms`);
  }
});

test("teklif PDF'i (325): aynı motorla A4, Carlito gömülü, tek sayfa", async () => {
  const pdf = await teklifPdf(ornekTeklif()), metin = Buffer.from(pdf).toString("latin1");
  assert.equal(metin.slice(0, 5), "%PDF-");
  assert.ok(/Carlito/.test(metin), "Carlito gömülü değil");
  assert.ok(/\/MediaBox\s*\[\s*0\s+0\s+59[45](\.\d+)?\s+841(\.\d+)?\s*\]/.test(metin), "A4 değil");
  assert.equal((metin.match(/\/Type\s*\/Page\b/g) ?? []).length, 1, "tek sayfa");
});
