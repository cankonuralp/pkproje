/* NEREDEN GELDİ: 317 son imza (indir-imzala-yükle; araştırma §8 — PAdES artımlı imza özgün baytları korur) · 315–317 çapraz incelemesi
   (2026-10-05): eski denetim yalnız öneke ve ekte "/Type /Sig" metnine bakıyordu — ek, sayfa içerik akışını yeniden tanımlayıp onaylı raporun
   görünen içeriğini değiştirebiliyor, imza belirteçleri yorumda bile geçerli sayılıyordu. Veritabanısız. Olumsuz kanıt: tests/bozan/imza-pdf.bozan.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { imzaliPdfGecerli } from "../src/modules/raporlar/imza-pdf.ts";

const b = (s: string) => new Uint8Array(Buffer.from(s, "latin1"));
/** uydurma imzasız PDF: Catalog, Pages, Page (/Contents 4 0 R), içerik akışı */
const OZGUN = "%PDF-1.4\n1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n"
  + "3 0 obj << /Type /Page /Parent 2 0 R /Contents 4 0 R /Resources << >> >> endobj\n4 0 obj << /Length 18 >> stream\nBT (Uygun) Tj ET\nendstream\nendobj\n"
  + "trailer << /Root 1 0 R >>\n%%EOF\n";
const IMZA = "9 0 obj << /Type /Sig /Filter /Adobe.PPKLite /ByteRange [0 10 20 30] /Contents <00ff00ff> >> endobj\n";
const imzali = (ek: string) => b(OZGUN + ek + "trailer << /Root 1 0 R /Prev 0 >>\n%%EOF\n");

test("imzalı PDF: özgünün kendisi + yeni nesnede imza sözlüğü kabul; imza aracının yaptığı gibi sayfaya /Annots, Catalog'a /AcroForm eklenebilir", () => {
  assert.equal(imzaliPdfGecerli(b(OZGUN), imzali(IMZA)), true);
  assert.equal(imzaliPdfGecerli(b(OZGUN), imzali("1 0 obj << /Type /Catalog /Pages 2 0 R /AcroForm << /Fields [10 0 R] /SigFlags 3 >> >> endobj\n"
    + "3 0 obj << /Type /Page /Parent 2 0 R /Contents 4 0 R /Resources << >> /Annots [10 0 R] >> endobj\n"
    + "10 0 obj << /Type /Annot /Subtype /Widget /FT /Sig /V 9 0 R /AP << /N 11 0 R >> >> endobj\n11 0 obj << /Length 2 >> stream\nq Q\nendstream\nendobj\n" + IMZA)), true);
});

test("imzalı PDF: önek tutmaz, ek boş, imza sözlüğü yalnız yorumda ya da eksik — reddedilir", () => {
  assert.equal(imzaliPdfGecerli(b(OZGUN), b(OZGUN)), false, "ek yok");
  assert.equal(imzaliPdfGecerli(b(OZGUN), b(OZGUN.replace("Uygun", "Kotuu") + IMZA)), false, "önek tutmuyor");
  assert.equal(imzaliPdfGecerli(b(OZGUN), imzali("% /Type /Sig /ByteRange [0 1 2 3] /Contents <00>\n")), false, "yorumdaki belirteç");
  assert.equal(imzaliPdfGecerli(b(OZGUN), imzali("9 0 obj << /Type /Sig /ByteRange [0 1 2 3] >> endobj\n")), false, "/Contents yok");
});

test("imzalı PDF: ek özgün içerik akışını yeniden tanımlayamaz, sayfanın içerik başvurusunu değiştiremez", () => {
  assert.equal(imzaliPdfGecerli(b(OZGUN), imzali("4 0 obj << /Length 25 >> stream\nBT (Uygun degil) Tj ET\nendstream\nendobj\n" + IMZA)), false, "akış değişti");
  assert.equal(imzaliPdfGecerli(b(OZGUN), imzali("3 0 obj << /Type /Page /Parent 2 0 R /Contents 12 0 R >> endobj\n"
    + "12 0 obj << /Length 25 >> stream\nBT (Uygun degil) Tj ET\nendstream\nendobj\n" + IMZA)), false, "sayfa başka içeriğe bağlandı");
  assert.equal(imzaliPdfGecerli(b(OZGUN), imzali("3 0 obj << /Type /Page /Parent 2 0 R /Contents [4 0 R 12 0 R] >> endobj\n" + IMZA)), false, "içerik eklendi");
});
