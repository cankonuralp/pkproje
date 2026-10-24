/* OLUMSUZ KANIT — tests/pdf-sayfa.test.ts neyi koruyor (kaynak diskte değiştirilmez; bellekte bozulur, göreli içe aktarmalar mutlak yola çevrilir):
   1. Dönüşüm (transform / CTM) atlanırsa Word gibi dönüşümle taşınan ince çizgi sayfanın köşesine düşer.
   2. viewport dönüşümü atlanırsa y aşağıdan ölçülür: zemin yanlış yerde.
   3. Dolgu rengi okunmazsa renkli zemin kaybolur (hepsi siyah).
   4. Delik çıkarılmazsa çerçevenin dış kutusu dolu zemin sanılır.
   5. Çizgi kalınlığı dönüşüm ölçeğiyle çarpılmazsa ölçekli çizgi ince görünür.
   6. Kalın, yazı tipinden (adı / nesnenin bayrağı) çıkarılmazsa başlık kalın sayılmaz.
   7. Kırpma uygulanmazsa kırpılan dolgu tam boyuyla gelir.
   8. Yumuşak maske grubunun içi atlanmazsa maske dolgu sanılır.
   9. (2026-10-24) Görünen sayfa (CropBox) ilk kırpma olmazsa sayfa dışındaki çizgi okunur — ızgarada sahte bölüm. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";
import { PDFDocument, PDFOperator, PDFOperatorNames, StandardFonts, rgb } from "pdf-lib";
import {
  clip, concatTransformationMatrix, endPath, fill, lineTo, moveTo, popGraphicsState, pushGraphicsState, rectangle, setFillingRgbColor, setLineWidth, stroke,
} from "pdf-lib";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import type { PdfjsModulu } from "../../src/modules/rapor-format/pdf-sayfa.ts";
import type { PdfDolgu, PdfSayfasi } from "../../src/modules/rapor-format/pdf-tipler.ts";

const klasor = mkdtempSync(join(tmpdir(), "pdf-sayfa-bozan-"));
after(() => rmSync(klasor, { recursive: true, force: true }));
let sira = 0;
type Modul = typeof import("../../src/modules/rapor-format/pdf-sayfa.ts");
async function bozuk(eski: string, yeni: string): Promise<Modul> {
  const dosya = "src/modules/rapor-format/pdf-sayfa.ts";
  const kok = resolve(dosya, "..");
  const kaynak = readFileSync(dosya, "utf8").replace(/from "(\.\.?\/[^"]+)"/g, (_, y: string) => `from "${pathToFileURL(resolve(kok, y)).href}"`);
  assert.ok(kaynak.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const yol = join(klasor, `b-${sira++}.ts`);
  writeFileSync(yol, kaynak.replace(eski, () => yeni));
  return import(pathToFileURL(yol).href) as Promise<Modul>;
}

const PJ: PdfjsModulu = pdfjs;
const YUKSEK = 842;
const yakin = (a: number, b: number, pay = 1) => Math.abs(a - b) <= pay;
const kutuMu = (d: PdfDolgu, x: number, y: number, g: number, h: number) => yakin(d.x, x) && yakin(d.y, y) && yakin(d.g, g) && yakin(d.h, h);

/** uydurma belge (tests/pdf-sayfa.test.ts'teki örneğin bozulan kısımları) */
let bayt: Uint8Array | undefined;
async function ornek(): Promise<Uint8Array> {
  if (bayt) return bayt;
  const d = await PDFDocument.create();
  const p = d.addPage([595, YUKSEK]);
  p.drawRectangle({ x: 50, y: 700, width: 200, height: 0.5, color: rgb(0, 0, 0) });
  p.drawRectangle({ x: 300, y: 600, width: 120, height: 40, color: rgb(1, 0.8, 0.6) });
  p.pushOperators(pushGraphicsState(), concatTransformationMatrix(2, 0, 0, 2, 0, 0), setLineWidth(0.5), moveTo(10, 10), lineTo(60, 10), stroke(), popGraphicsState());
  p.pushOperators(pushGraphicsState(), setFillingRgbColor(0, 0.4, 0.2), rectangle(100, 300, 200, 100), rectangle(110, 310, 180, 80),
    PDFOperator.of(PDFOperatorNames.FillEvenOdd), popGraphicsState());
  p.pushOperators(pushGraphicsState(), rectangle(450, 100, 50, 50), clip(), endPath(), setFillingRgbColor(0.6, 0.2, 0), rectangle(400, 100, 200, 20), fill(),
    popGraphicsState());
  p.drawText("Bold title", { x: 60, y: 650, size: 12, font: await d.embedFont(StandardFonts.HelveticaBold) });
  bayt = await d.save();
  return bayt;
}
async function oku(m: Modul): Promise<PdfSayfasi> {
  const belge = await pdfjs.getDocument({ data: (await ornek()).slice(), isEvalSupported: false, useSystemFonts: false, verbosity: 0 }).promise;
  try { return (await m.pdfSayfalari(belge, PJ))[0]; } finally { await belge.destroy(); }
}

test("dönüşüm atlanırsa ince çizgi köşeye düşer", async () => {
  const m = await bozuk("case O.transform: if (a.length === 6 && a.every(sayi)) d.ctm = carp(d.ctm, a as number[]); break;", "case O.transform: break;");
  const s = await oku(m);
  assert.ok(!s.dolgular.some((d) => kutuMu(d, 50, YUKSEK - 700.5, 200, 0.5)), "bozuk: çizgi yerinde olmamalı");
  assert.ok(s.dolgular.some((d) => kutuMu(d, 0, YUKSEK - 0.5, 200, 0.5)), "bozuk: çizgi köşede");
});

test("viewport dönüşümü atlanırsa zemin aşağıdan ölçülür", async () => {
  const s = await oku(await bozuk("const M = carp(vt, d.ctm);", "const M = d.ctm;"));
  assert.ok(!s.dolgular.some((d) => kutuMu(d, 300, YUKSEK - 640, 120, 40)), "bozuk: zemin yerinde olmamalı");
  assert.ok(s.dolgular.some((d) => kutuMu(d, 300, 600, 120, 40)), "bozuk: y PDF'in alt kökeninden");
});

test("dolgu rengi okunmazsa renkli zemin kaybolur", async () => {
  const s = await oku(await bozuk("case O.setFillColorN: d.dolgu = renk(a); break;", "case O.setFillColorN: break;"));
  assert.ok(!s.dolgular.some((d) => d.renk === "#FFCC99"), "bozuk: zemin rengi yok");
  assert.ok(s.dolgular.some((d) => kutuMu(d, 300, YUKSEK - 640, 120, 40) && d.renk === "#000000"), "bozuk: zemin siyah");
});

test("delik çıkarılmazsa çerçevenin dış kutusu zemin sanılır", async () => {
  const s = await oku(await bozuk("if (d.length > DELIK_EN_COK)", "if (d.length >= 0)"));
  const cerceve = s.dolgular.filter((d) => d.renk === "#006633");
  assert.equal(cerceve.length, 2, "bozuk: dış + iç kutu");
  assert.ok(cerceve.some((d) => kutuMu(d, 100, YUKSEK - 400, 200, 100)), "bozuk: dış kutu dolu");
});

test("kalınlık ölçekle çarpılmazsa ölçekli çizgi ince görünür", async () => {
  const s = await oku(await bozuk("const kalinlik = mu > 1e-9 ? (d.kalinlik * det) / mu : 0;", "const kalinlik = d.kalinlik;"));
  assert.equal(s.cizgiler.length, 1);
  assert.equal(s.cizgiler[0].kalinlik, 0.5, "bozuk: 1 olmalıydı");
});

test("kalın yazı tipinden çıkarılmazsa başlık kalın sayılmaz", async () => {
  const s = await oku(await bozuk("kalin: c.kalin || n?.bold === true || n?.black === true", "kalin: false"));
  const y = s.yazilar.find((x) => x.s === "Bold title");
  assert.ok(y && y.aile === "Helvetica-Bold" && !y.kalin, "bozuk: kalın değil");
});

test("kırpma uygulanmazsa kırpılan dolgu tam boyuyla gelir", async () => {
  const s = await oku(await bozuk("const x = kesisim(k, d.kirp);", "const x = k;"));
  assert.deepEqual(s.dolgular.filter((d) => d.renk === "#993300").map((d) => kutuMu(d, 400, YUKSEK - 120, 200, 20)), [true], "bozuk: 400–600");
});

test("maske grubunun içi atlanmazsa maske dolgu sanılır", async () => {
  const m = await bozuk("if (maske) gizli++;", "");
  const O = PJ.OPS;
  const kare = [O.fill, [new Float32Array([0, 0, 0, 1, 50, 0, 1, 50, 50, 1, 0, 50, 3])], null];
  const sayfa = {
    getViewport: () => ({ width: 100, height: 100, transform: [1, 0, 0, -1, 0, 100] }),
    getOperatorList: async () => ({ fnArray: [O.beginGroup, O.constructPath, O.endGroup], argsArray: [[{ smask: {} }], kare, [{ smask: {} }]] }),
    getTextContent: async () => ({ items: [], styles: {} }),
  };
  const [s] = await m.pdfSayfalari({ numPages: 1, getPage: async () => sayfa }, PJ);
  assert.equal(s.dolgular.length, 1, "bozuk: maske dolgu oldu");
});

test("görünen sayfa ilk kırpma olmazsa sayfa dışındaki çizgi okunur", async () => {
  const d = await PDFDocument.create();
  const p = d.addPage([595, YUKSEK]);
  p.setCropBox(50, 50, 495, 742);
  p.drawLine({ start: { x: 5, y: 400 }, end: { x: 40, y: 400 }, thickness: 0.5, color: rgb(0, 0, 0) });
  const say = async (m: Modul) => {
    const belge = await pdfjs.getDocument({ data: await d.save(), isEvalSupported: false, useSystemFonts: false, verbosity: 0 }).promise;
    try { return (await m.pdfSayfalari(belge, PJ))[0].cizgiler.length; } finally { await belge.destroy(); }
  };
  assert.equal(await say(await import("../../src/modules/rapor-format/pdf-sayfa.ts")), 0, "sağlam: sayfa dışı okunmaz");
  assert.equal(await say(await bozuk("cizgiAlfa: 1, kalinlik: 1, kirp: sayfaKutusu };", "cizgiAlfa: 1, kalinlik: 1, kirp: null };")), 1, "bozuk: sayfa dışı çizgi");
});
