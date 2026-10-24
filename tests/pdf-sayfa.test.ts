/* NEREDEN GELDİ: 2026-10-24 — reisim: "ben şablon yükledim bu şablondan başlat dedim neden yapay zeka çalışıyor ?", "en baştan beri bunu istedim".
   Basılı formdan şablon yapay zekâsız kurulur: önce PDF'in kendi içeriği okunur (src/modules/rapor-format/pdf-sayfa.ts pdfSayfalari — pdf.js işlem
   listesi + metin → PdfSayfasi). Bu kilit, pdf-lib 1.17.1 ile üretilen UYDURMA bir belgeyi pdfjs-dist 5.4.149 (legacy, node) ile açıp okumanın
   koordinatlarını (sol üst kökenli punto, ±1), renklerini (RGB, gri, CMYK), çizgi kalınlığını (dönüşüm ölçeğiyle), yazı tipinden kalın / eğik / aile
   tespitini, Word gibi ince dolgu çizgilerini, çerçeve deliğini, kırpmayı, resmi, döndürülmüş ikinci sayfayı ve sayfa sınırını doğrular; maske grubu,
   saydam dolgu ve açıklama dönüşümü elle kurulan işlem listesiyle. Gerçek form depoya girmez. Olumsuz kanıt: tests/bozan/pdf-sayfa.bozan.ts.
   2026-10-24 (denetim): görünen sayfanın (CropBox) dışındaki çizgi / dolgu / resim okunmaz — ızgarada sahte bölüm kurmasın. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { PDFDocument, PDFOperator, PDFOperatorNames, StandardFonts, cmyk, degrees, grayscale, rgb } from "pdf-lib";
import {
  clip, concatTransformationMatrix, endPath, fill, lineTo, moveTo, popGraphicsState, pushGraphicsState, rectangle, setFillingRgbColor, setLineWidth, stroke,
} from "pdf-lib";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import { pdfSayfalari, yaziTipiCoz, type PdfBelgesi, type PdfjsModulu } from "../src/modules/rapor-format/pdf-sayfa.ts";
import { PDF_SINIR, type PdfDolgu, type PdfSayfasi } from "../src/modules/rapor-format/pdf-tipler.ts";

const PJ: PdfjsModulu = pdfjs;
/** 1 × 1 PNG */
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");
const YUKSEK = 842;

const yakin = (a: number, b: number, pay = 1) => Math.abs(a - b) <= pay;
const kutuMu = (d: { x: number; y: number; g: number; h: number }, x: number, y: number, g: number, h: number, pay = 1) =>
  yakin(d.x, x, pay) && yakin(d.y, y, pay) && yakin(d.g, g, pay) && yakin(d.h, h, pay);
const bul = (l: PdfDolgu[], x: number, y: number, g: number, h: number) => l.filter((d) => kutuMu(d, x, y, g, h));

async function oku(bayt: Uint8Array): Promise<PdfSayfasi[]> {
  const belge = await pdfjs.getDocument({ data: bayt, isEvalSupported: false, useSystemFonts: false, verbosity: 0 }).promise;
  try { return await pdfSayfalari(belge, PJ); } finally { await belge.destroy(); }
}

/** uydurma form: 1. sayfa A4 (çizgiler, zeminler, yazılar, resim), 2. sayfa 400 × 300 ve 90° döndürülmüş */
async function ornekBelge() {
  const d = await PDFDocument.create();
  const p = d.addPage([595, YUKSEK]);
  const h = await d.embedFont(StandardFonts.Helvetica);
  const hb = await d.embedFont(StandardFonts.HelveticaBold);
  const tr = await d.embedFont(StandardFonts.TimesRoman);
  const tbi = await d.embedFont(StandardFonts.TimesRomanBoldItalic);
  const siyah = rgb(0, 0, 0);
  /* Word gibi: tablo çizgileri 0,5 pt kalınlıkta dolgulu dikdörtgen */
  p.drawRectangle({ x: 50, y: 700, width: 200, height: 0.5, color: siyah });
  p.drawRectangle({ x: 50, y: 600, width: 0.5, height: 100.5, color: siyah });
  /* zeminler */
  p.drawRectangle({ x: 300, y: 600, width: 120, height: 40, color: rgb(1, 0.8, 0.6) });
  p.drawRectangle({ x: 300, y: 540, width: 60, height: 20, color: grayscale(0.5) });
  p.drawRectangle({ x: 400, y: 540, width: 60, height: 20, color: cmyk(1, 0, 0, 0) });
  /* çizilen çizgiler: düz, ve 2 kat ölçekli dönüşümde 0,5 kalınlık (sayfada 1) */
  p.drawLine({ start: { x: 50, y: 500 }, end: { x: 250, y: 500 }, thickness: 1.5, color: siyah });
  p.pushOperators(pushGraphicsState(), concatTransformationMatrix(2, 0, 0, 2, 0, 0), setLineWidth(0.5), moveTo(10, 10), lineTo(60, 10), stroke(), popGraphicsState());
  /* çerçeve: dış + iç dikdörtgen, çift-tek dolgu (dış kutu zemin değil) */
  p.pushOperators(pushGraphicsState(), setFillingRgbColor(0, 0.4, 0.2), rectangle(100, 300, 200, 100), rectangle(110, 310, 180, 80),
    PDFOperator.of(PDFOperatorNames.FillEvenOdd), popGraphicsState());
  /* bir yolda üç ayrı ince dikdörtgen (iç içe değil): üç dolgu */
  p.pushOperators(pushGraphicsState(), rectangle(50, 200, 100, 0.5), rectangle(50, 180, 100, 0.5), rectangle(50, 160, 0.5, 40), fill(), popGraphicsState());
  /* kırpma: 450–500 arası görünür */
  p.pushOperators(pushGraphicsState(), rectangle(450, 100, 50, 50), clip(), endPath(), setFillingRgbColor(0.6, 0.2, 0), rectangle(400, 100, 200, 20), fill(),
    popGraphicsState());
  /* yazılar (standart yazı tipleri yalnız ASCII kodlar) */
  p.drawText("Bold title", { x: 60, y: 650, size: 12, font: hb });
  p.drawText("Plain text", { x: 60, y: 630, size: 10, font: h });
  p.drawText("Times line", { x: 60, y: 610, size: 14, font: tr });
  p.drawText("Both", { x: 60, y: 590, size: 9, font: tbi });
  p.drawImage(await d.embedPng(PNG), { x: 400, y: 700, width: 80, height: 40 });
  const p2 = d.addPage([400, 300]);
  p2.setRotation(degrees(90));
  p2.drawRectangle({ x: 10, y: 20, width: 50, height: 10, color: rgb(0, 0, 1) });
  p2.drawText("Page two", { x: 100, y: 100, size: 10, font: h });
  return { bayt: await d.save(), olcu: { hb: hb.widthOfTextAtSize("Bold title", 12), h: h.widthOfTextAtSize("Plain text", 10), h2: h.widthOfTextAtSize("Page two", 10) } };
}

test("ince dolgu çizgileri, zeminler (RGB / gri / CMYK) sol üst kökenli punto ve renkle", async () => {
  const [s] = await oku((await ornekBelge()).bayt);
  assert.equal(s.en, 595);
  assert.equal(s.boy, YUKSEK);
  /* drawRectangle dönüşümle (cm) taşır: konum ancak CTM uygulanınca doğru */
  assert.equal(bul(s.dolgular, 50, YUKSEK - 700.5, 200, 0.5).filter((d) => d.renk === "#000000").length, 1, "yatay ince çizgi");
  assert.equal(bul(s.dolgular, 50, YUKSEK - 700.5, 0.5, 100.5).filter((d) => d.renk === "#000000").length, 1, "dikey ince çizgi");
  assert.deepEqual(bul(s.dolgular, 300, YUKSEK - 640, 120, 40).map((d) => d.renk), ["#FFCC99"], "renkli zemin");
  const gri = bul(s.dolgular, 300, YUKSEK - 560, 60, 20);
  assert.equal(gri.length, 1);
  assert.match(gri[0].renk, /^#[0-9A-F]{6}$/);
  for (const i of [1, 3, 5]) assert.ok(yakin(parseInt(gri[0].renk.slice(i, i + 2), 16), 128), `gri ${gri[0].renk}`);
  const camgobegi = bul(s.dolgular, 400, YUKSEK - 560, 60, 20);
  assert.equal(camgobegi.length, 1);
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(camgobegi[0].renk.slice(i, i + 2), 16));
  assert.ok(r < 80 && g > 120 && b > 180, `CMYK (1,0,0,0) RGB'de camgöbeği olmalı: ${camgobegi[0].renk}`);
});

test("çizilen çizgiler: uçlar ve kalınlık (dönüşüm ölçeğiyle)", async () => {
  const [s] = await oku((await ornekBelge()).bayt);
  assert.equal(s.cizgiler.length, 2);
  const duz = s.cizgiler.find((c) => yakin(c.y1, YUKSEK - 500))!;
  assert.ok(duz, "düz çizgi");
  assert.ok(yakin(Math.min(duz.x1, duz.x2), 50) && yakin(Math.max(duz.x1, duz.x2), 250) && yakin(duz.y2, YUKSEK - 500));
  assert.ok(yakin(duz.kalinlik, 1.5, 0.01), `kalınlık ${duz.kalinlik}`);
  const olcekli = s.cizgiler.find((c) => yakin(c.y1, YUKSEK - 20))!;
  assert.ok(olcekli, "ölçekli çizgi sayfada y = 822");
  assert.ok(yakin(Math.min(olcekli.x1, olcekli.x2), 20) && yakin(Math.max(olcekli.x1, olcekli.x2), 120));
  assert.ok(yakin(olcekli.kalinlik, 1, 0.01), `0,5 × 2 = 1 olmalı: ${olcekli.kalinlik}`);
});

test("çerçeve deliği: dış kutu zemin olmaz, dört şerit; bir yoldaki ayrı dikdörtgenler ayrı dolgu; kırpma keser", async () => {
  const [s] = await oku((await ornekBelge()).bayt);
  const cerceve = s.dolgular.filter((d) => d.renk === "#006633");
  assert.equal(cerceve.length, 4, JSON.stringify(cerceve));
  /* çerçevenin ortası (200, 492) hiçbir dolgunun içinde değil */
  assert.ok(!cerceve.some((d) => d.x < 200 && d.x + d.g > 200 && d.y < YUKSEK - 350 && d.y + d.h > YUKSEK - 350), "iç boş");
  assert.equal(bul(cerceve, 100, YUKSEK - 400, 200, 10).length, 1, "üst şerit");
  assert.equal(bul(cerceve, 100, YUKSEK - 310, 200, 10).length, 1, "alt şerit");
  assert.equal(bul(cerceve, 100, YUKSEK - 390, 10, 80).length, 1, "sol şerit");
  assert.equal(bul(cerceve, 290, YUKSEK - 390, 10, 80).length, 1, "sağ şerit");
  assert.equal(bul(s.dolgular, 50, YUKSEK - 200.5, 100, 0.5).length, 1);
  assert.equal(bul(s.dolgular, 50, YUKSEK - 180.5, 100, 0.5).length, 1);
  assert.equal(bul(s.dolgular, 50, YUKSEK - 200, 0.5, 40).length, 1);
  assert.deepEqual(s.dolgular.filter((d) => d.renk === "#993300").map((d) => kutuMu(d, 450, YUKSEK - 120, 50, 20)), [true], "kırpılan dolgu 450–500");
});

test("yazılar: konum, taban çizgisi, boy, genişlik; kalın / eğik ve aile yazı tipinden", async () => {
  const { bayt, olcu } = await ornekBelge();
  const [s] = await oku(bayt);
  const y = (m: string) => s.yazilar.find((x) => x.s === m)!;
  for (const [m, x, taban, boy, aile, kalin, egik] of [
    ["Bold title", 60, YUKSEK - 650, 12, "Helvetica-Bold", true, false],
    ["Plain text", 60, YUKSEK - 630, 10, "Helvetica", false, false],
    ["Times line", 60, YUKSEK - 610, 14, "Times-Roman", false, false],
    ["Both", 60, YUKSEK - 590, 9, "Times-BoldItalic", true, true],
  ] as const) {
    const o = y(m);
    assert.ok(o, m);
    assert.ok(yakin(o.x, x) && yakin(o.y + o.h, taban) && yakin(o.boy, boy) && yakin(o.h, boy), `${m}: ${JSON.stringify(o)}`);
    assert.equal(o.aile, aile, m);
    assert.equal(o.kalin, kalin, m);
    assert.equal(o.egik, egik, m);
  }
  assert.ok(yakin(y("Bold title").g, olcu.hb) && yakin(y("Plain text").g, olcu.h));
  assert.ok(!s.yazilar.some((x) => !x.s.trim()), "boş yazı öğesi atlanır");
  assert.ok(!s.yazilar.some((x) => x.s === "Page two"), "ikinci sayfanın yazısı birinci sayfada yok");
});

test("resim: birim karenin kapladığı kutu", async () => {
  const [s] = await oku((await ornekBelge()).bayt);
  assert.equal(s.resimler.length, 1);
  assert.ok(kutuMu(s.resimler[0], 400, YUKSEK - 740, 80, 40), JSON.stringify(s.resimler[0]));
});

test("ikinci sayfa ayrı: 90° döndürülmüş, viewport dönüşümüyle (x, y) → (y, x)", async () => {
  const { bayt, olcu } = await ornekBelge();
  const l = await oku(bayt);
  assert.equal(l.length, 2);
  const s = l[1];
  assert.equal(s.en, 300);
  assert.equal(s.boy, 400);
  assert.equal(s.dolgular.length, 1);
  assert.ok(kutuMu(s.dolgular[0], 20, 10, 10, 50) && s.dolgular[0].renk === "#0000FF", JSON.stringify(s.dolgular[0]));
  assert.equal(s.yazilar.length, 1);
  const y = s.yazilar[0];
  assert.equal(y.s, "Page two");
  /* yazı aşağı doğru akar, harflerin üstü sağa bakar: kutu 10 geniş, yazının genişliği kadar uzun */
  assert.ok(kutuMu(y, 100, 100, 10, olcu.h2), JSON.stringify(y));
  assert.equal(s.cizgiler.length + s.resimler.length, 0);
});

test("görünen sayfa (CropBox) dışındaki çizgi, dolgu ve resim okunmaz; görünen kısım sayfaya kırpılır (2026-10-24)", async () => {
  const d = await PDFDocument.create();
  const p = d.addPage([595, YUKSEK]);
  p.setCropBox(50, 50, 495, 742);
  const siyah = rgb(0, 0, 0);
  /* kırpma kutusunun solunda (görünmez): çizgi, dolgu, resim */
  p.drawLine({ start: { x: 5, y: 400 }, end: { x: 40, y: 400 }, thickness: 0.5, color: siyah });
  p.drawRectangle({ x: 2, y: 300, width: 30, height: 30, color: rgb(0.2, 0.4, 0.8) });
  p.drawImage(await d.embedPng(PNG), { x: 5, y: 200, width: 30, height: 30 });
  /* görünen: içeride bir çizgi; kenardan taşan dolgu sayfaya kırpılır */
  p.drawLine({ start: { x: 100, y: 400 }, end: { x: 300, y: 400 }, thickness: 0.5, color: siyah });
  p.drawRectangle({ x: 20, y: 500, width: 100, height: 20, color: rgb(0.6, 0.2, 0) });
  const [s] = await oku(await d.save());
  assert.deepEqual([s.en, s.boy], [495, 742]);
  const icinde = (x0: number, y0: number, x1: number, y1: number) => x0 >= -0.01 && y0 >= -0.01 && x1 <= s.en + 0.01 && y1 <= s.boy + 0.01;
  assert.ok(s.cizgiler.every((c) => icinde(Math.min(c.x1, c.x2), Math.min(c.y1, c.y2), Math.max(c.x1, c.x2), Math.max(c.y1, c.y2))), JSON.stringify(s.cizgiler));
  assert.ok(s.dolgular.every((x) => icinde(x.x, x.y, x.x + x.g, x.y + x.h)), JSON.stringify(s.dolgular));
  assert.deepEqual([s.cizgiler.length, s.resimler.length], [1, 0]);
  assert.deepEqual(s.dolgular.filter((x) => x.renk === "#993300").map((x) => kutuMu(x, 0, 742 - (520 - 50), 70, 20)), [true], "taşan dolgu kırpılır");
});

test("sayfa sınırı: PDF_SINIR.sayfa'dan çok sayfalı belgede ilk PDF_SINIR.sayfa sayfa, hata yok", async () => {
  const d = await PDFDocument.create();
  for (let i = 0; i < PDF_SINIR.sayfa + 2; i++) d.addPage([200, 200]);
  assert.equal((await oku(await d.save())).length, PDF_SINIR.sayfa);
});

test("elle kurulan işlem listesi: maske grubu görünmez, saydam / alfa 0 dolgu atılır, form ve açıklama dönüşümü", async () => {
  const O = PJ.OPS;
  const kare = (x: number, y: number, g: number, h: number) => [O.fill, [new Float32Array([0, x, y, 1, x + g, y, 1, x + g, y + h, 1, x, y + h, 3])], null];
  const fn: number[] = [], args: unknown[] = [];
  const ekle = (f: number, a: unknown = null) => { fn.push(f); args.push(a); };
  ekle(O.setFillRGBColor, ["#112233"]);
  ekle(O.beginGroup, [{ smask: { subtype: "Luminosity" }, bbox: [0, 0, 100, 100], matrix: null }]);
  ekle(O.constructPath, kare(0, 0, 50, 50));
  ekle(O.endGroup, [{ smask: {} }]);
  ekle(O.constructPath, kare(10, 10, 20, 20));
  ekle(O.save); ekle(O.setFillTransparent, []); ekle(O.constructPath, kare(0, 0, 5, 5)); ekle(O.restore);
  ekle(O.save); ekle(O.setGState, [[["ca", 0]]]); ekle(O.constructPath, kare(0, 0, 6, 6)); ekle(O.restore);
  /* form nesnesi: kendi matrisi (öteleme) ve kutusuyla kırpılı */
  ekle(O.paintFormXObjectBegin, [new Float32Array([1, 0, 0, 1, 100, 0]), new Float32Array([0, 0, 10, 10])]);
  ekle(O.constructPath, kare(0, 0, 30, 5));
  ekle(O.paintFormXObjectEnd, []);
  /* açıklama: sayfanın temelinden; dönüşüm × matris */
  ekle(O.beginAnnotation, ["a1", [200, 0, 260, 50], [1, 0, 0, 1, 200, 0], [1, 0, 0, 1, 0, 0], false]);
  ekle(O.constructPath, kare(0, 0, 40, 10));
  ekle(O.endAnnotation, []);
  ekle(O.paintSolidColorImageMask, []);
  const sayfa = {
    getViewport: () => ({ width: 300, height: 100, transform: [1, 0, 0, -1, 0, 100] }),
    getOperatorList: async () => ({ fnArray: fn, argsArray: args }),
    getTextContent: async () => ({ items: [{ str: "x", transform: [8, 0, 0, 8, 1, 90], width: 4, fontName: "f1" }], styles: { f1: { fontFamily: "serif" } } }),
  };
  const belge: PdfBelgesi = { numPages: 1, getPage: async () => sayfa };
  const [s] = await pdfSayfalari(belge, PJ);
  assert.deepEqual(s.dolgular.map((d) => [d.x, d.y, d.g, d.h, d.renk]), [
    [10, 70, 20, 20, "#112233"],
    [100, 95, 10, 5, "#112233"],
    [200, 90, 40, 10, "#000000"],
    [0, 99, 1, 1, "#112233"],
  ]);
  /* yazı tipi nesnesi yoksa aile metnin stilinden */
  assert.deepEqual(s.yazilar.map((y) => [y.s, y.aile, y.kalin, y.x, y.y + y.h, y.boy]), [["x", "serif", false, 1, 10, 8]]);
  await assert.rejects(pdfSayfalari({ numPages: 1, getPage: async () => ({}) }, PJ), /PDF sayfası okunamadı/);
});

test("yazı tipi adı: alt küme ön eki atılır, kalın / eğik addan", () => {
  assert.deepEqual(yaziTipiCoz("ABCDEF+TimesNewRomanPS-BoldMT", ""), { ad: "TimesNewRomanPS-BoldMT", kalin: true, egik: false });
  assert.deepEqual(yaziTipiCoz("Arial,BoldItalic", ""), { ad: "Arial,BoldItalic", kalin: true, egik: true });
  assert.deepEqual(yaziTipiCoz("QWERTY+Calibri-Light", ""), { ad: "Calibri-Light", kalin: false, egik: false });
  assert.deepEqual(yaziTipiCoz("Helvetica-Oblique", ""), { ad: "Helvetica-Oblique", kalin: false, egik: true });
  assert.deepEqual(yaziTipiCoz("", "sans-serif"), { ad: "sans-serif", kalin: false, egik: false });
});
