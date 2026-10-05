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

/* 2026-10-05 (318 çapraz incelemesi): metin taraması atlatılıyordu — yeni kök, akışsız yeniden tanımlanan sayfa ağacı, aynı /Contents'la yeni
   /Resources, imza dışı açıklama, "04 0 obj" / yoruma saklanmış başlık, yinelenen anahtar, sıkıştırılmış nesne akışı; ve ek karesel sürede
   taranıyordu (ReDoS). Artık beyaz liste + gerçek sözlük ayrıştırma + doğrusal tarama. */
test("imzalı PDF: yeni kök, sayfa ağacı ya da kaynak değişikliği, imza dışı açıklama reddedilir", () => {
  const yeniKok = OZGUN + "50 0 obj << /Type /Catalog /Pages 51 0 R >> endobj\n51 0 obj << /Type /Pages /Kids [52 0 R] /Count 1 >> endobj\n"
    + "52 0 obj << /Type /Page /Parent 51 0 R /Contents 53 0 R >> endobj\n53 0 obj << /Length 9 >> stream\nBT ET\nendstream\nendobj\n" + IMZA + "trailer << /Root 50 0 R /Prev 0 >>\n%%EOF\n";
  assert.equal(imzaliPdfGecerli(b(OZGUN), b(yeniKok)), false, "yeni kök");
  assert.equal(imzaliPdfGecerli(b(OZGUN), imzali("2 0 obj << /Type /Pages /Kids [30 0 R] /Count 1 >> endobj\n" + IMZA)), false, "sayfa ağacı akışsız yeniden tanımlandı");
  assert.equal(imzaliPdfGecerli(b(OZGUN), imzali("3 0 obj << /Type /Page /Parent 2 0 R /Contents 4 0 R /Resources << /XObject << /X 20 0 R >> >> >> endobj\n" + IMZA)), false, "kaynak değişti");
  assert.equal(imzaliPdfGecerli(b(OZGUN), imzali("3 0 obj << /Type /Page /Parent 2 0 R /Contents 4 0 R /Resources << >> /Annots [21 0 R] >> endobj\n"
    + "21 0 obj << /Type /Annot /Subtype /FreeText /Contents (Uygun) /Rect [0 0 100 20] >> endobj\n" + IMZA)), false, "imza dışı açıklama");
  assert.equal(imzaliPdfGecerli(b(OZGUN), imzali("1 0 obj << /Type /Catalog /Pages 2 0 R /OpenAction 22 0 R >> endobj\n" + IMZA)), false, "katalogda izin dışı anahtar");
  assert.equal(imzaliPdfGecerli(b(OZGUN), b(OZGUN + IMZA + "%%EOF\n")), false, "trailer yok");
  /* imza aracının yaptığı gibi: sayfa sözlüğü yeniden yazılırken anahtar sırası ve boşluk değişebilir — anlamca aynıysa kabul */
  assert.equal(imzaliPdfGecerli(b(OZGUN), imzali("3 0 obj<</Annots[10 0 R]/Contents 4 0 R/Parent 2 0 R/Resources<<>>/Type/Page>>endobj\n"
    + "10 0 obj << /Type /Annot /Subtype /Widget /FT /Sig /V 9 0 R /Rect [0 0 0 0] >> endobj\n" + IMZA)), true);
});

test("imzalı PDF: nesne numarası ve sözdizimi oyunları reddedilir ('04 0 obj', yoruma saklanmış başlık, yinelenen anahtar, nesne akışı)", () => {
  const akis = "<< /Length 25 >> stream\nBT (Uygun degil) Tj ET\nendstream\nendobj\n";
  assert.equal(imzaliPdfGecerli(b(OZGUN), imzali(`04 0 obj ${akis}` + IMZA)), false, "04 = 4");
  assert.equal(imzaliPdfGecerli(b(OZGUN), imzali(`%4 0 obj ${akis}` + IMZA)), false, "yoruma saklanmış başlık");
  assert.equal(imzaliPdfGecerli(b(OZGUN), imzali(`x4 0 obj ${akis}` + IMZA)), false, "boşluk dışı önek");
  assert.equal(imzaliPdfGecerli(b(OZGUN), imzali("3 0 obj << /Type /Page /Parent 2 0 R /Contents 4 0 R /Resources << >> /Contents 12 0 R >> endobj\n" + IMZA)), false, "yinelenen anahtar");
  assert.equal(imzaliPdfGecerli(b(OZGUN), imzali("40 0 obj << /Type /ObjStm /N 1 /First 4 /Length 10 >> stream\n4 0 << >>\nendstream\nendobj\n" + IMZA)), false, "nesne akışı");
});

test("imzalı PDF: ek doğrusal sürede taranır (karesel arama yok); büyük ek ve çok nesne reddedilir", () => {
  const bas = Date.now();
  assert.equal(imzaliPdfGecerli(b(OZGUN), b(OZGUN + IMZA + " 1 0 obj".repeat(100_000))), false);
  assert.equal(imzaliPdfGecerli(b(OZGUN), b(OZGUN + "1".repeat(500_000) + " 0 obj")), false);
  assert.ok(Date.now() - bas < 3000, `tarama ${Date.now() - bas} ms sürdü`);
  assert.equal(imzaliPdfGecerli(b(OZGUN), b(OZGUN + "x".repeat(4 * 1024 * 1024 + 1))), false, "4 MB'tan büyük ek");
  assert.equal(imzaliPdfGecerli(b(OZGUN), imzali(Array.from({ length: 501 }, (_, i) => `${100 + i} 0 obj << >> endobj\n`).join("") + IMZA)), false, "500'den çok nesne");
});
