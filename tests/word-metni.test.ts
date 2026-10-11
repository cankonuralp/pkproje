/* NEREDEN GELDİ: 498 "Belgeden başlat" — hata listesi 29 + 46 maketi onaylı (K7: "Evet — sıranın sonunda"; maket: "firmanın PDF / Word / fotoğraf
   formatından taslak"). Word belgesinin (.docx) metni sunucuda, ek paketsiz (src/server/yz/word.ts):
   · paragraflar satır satır, tablo hücreleri "|" ile, sekme boşluk; XML varlıkları çözülür; yalnız <w:t> metni (alan kodları vb. gelmez);
   · sıkıştırılmış (DEFLATE) ve sıkıştırmasız girdi okunur;
   · Word olmayan ZIP (xlsx), ZIP olmayan, şifreli girdi, açık boyu sınırı aşan girdi (ZIP bombası) → null.
   Olumsuz kanıt: tests/bozan/word-metni.bozan.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { deflateRawSync } from "node:zlib";
import { zipBayt } from "../src/components/disa/zip.ts";
import { wordMetni } from "../src/server/yz/word.ts";

const BELGE = `<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="x"><w:body>
<w:p><w:r><w:t>1. Gözle kontrol</w:t></w:r></w:p>
<w:p><w:r><w:t xml:space="preserve">Fren </w:t></w:r><w:r><w:t>ve el freni etkili &amp; çalışıyor</w:t></w:r></w:p>
<w:p><w:r><w:instrText>PAGE</w:instrText></w:r></w:p>
<w:tbl><w:tr><w:tc><w:p><w:r><w:t>Ölçüm</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>Sınır &lt; 10 Ω</w:t></w:r></w:p></w:tc></w:tr></w:tbl>
<w:p><w:r><w:t>Sol</w:t></w:r><w:r><w:tab/><w:t>Sağ</w:t></w:r></w:p>
</w:body></w:document>`;

/** sıkıştırılmış tek girdili ZIP (DEFLATE, yöntem 8) — merkez dizinli; CRC okuyucu tarafından denetlenmez (0) */
function deflateZip(ad: string, icerik: string, bildirilen?: number): Uint8Array {
  const veri = deflateRawSync(Buffer.from(icerik, "utf8")), adB = Buffer.from(ad, "utf8"), acik = bildirilen ?? Buffer.byteLength(icerik);
  const yerel = Buffer.alloc(30); yerel.writeUInt32LE(0x04034b50, 0); yerel.writeUInt16LE(20, 4); yerel.writeUInt16LE(8, 8);
  yerel.writeUInt32LE(veri.length, 18); yerel.writeUInt32LE(acik, 22); yerel.writeUInt16LE(adB.length, 26);
  const merkez = Buffer.alloc(46); merkez.writeUInt32LE(0x02014b50, 0); merkez.writeUInt16LE(20, 4); merkez.writeUInt16LE(20, 6); merkez.writeUInt16LE(8, 10);
  merkez.writeUInt32LE(veri.length, 20); merkez.writeUInt32LE(acik, 24); merkez.writeUInt16LE(adB.length, 28); merkez.writeUInt32LE(0, 42);
  const yerelBoy = 30 + adB.length + veri.length, merkezBoy = 46 + adB.length;
  const son = Buffer.alloc(22); son.writeUInt32LE(0x06054b50, 0); son.writeUInt16LE(1, 8); son.writeUInt16LE(1, 10);
  son.writeUInt32LE(merkezBoy, 12); son.writeUInt32LE(yerelBoy, 16);
  return new Uint8Array(Buffer.concat([yerel, adB, veri, merkez, adB, son]));
}

test("Word belgesinin metni: paragraflar, tablo hücreleri, sekme, varlıklar; alan kodu gelmez; sıkıştırılmış ve sıkıştırmasız", () => {
  const beklenen = "1. Gözle kontrol\nFren ve el freni etkili & çalışıyor\nÖlçüm | Sınır < 10 Ω\nSol Sağ";
  assert.equal(wordMetni(deflateZip("word/document.xml", BELGE)), beklenen);
  assert.equal(wordMetni(zipBayt([["[Content_Types].xml", "<Types/>"], ["word/document.xml", BELGE]])), beklenen);
});

test("Word olmayan / bozuk / şifreli / sınırı aşan → null", () => {
  assert.equal(wordMetni(zipBayt([["[Content_Types].xml", "<Types/>"], ["xl/workbook.xml", "<workbook/>"]])), null, "xlsx");
  assert.equal(wordMetni(new Uint8Array(Buffer.from("%PDF-1.4"))), null);
  assert.equal(wordMetni(zipBayt([["word/document.xml", "<root>Word değil</root>"]])), null, "w:document yok");
  const sifreli = deflateZip("word/document.xml", BELGE);
  const k = Buffer.from(sifreli).indexOf(Buffer.from([0x50, 0x4b, 0x01, 0x02]));
  sifreli[k + 8] |= 1;
  assert.equal(wordMetni(sifreli), null, "şifreli girdi");
  assert.equal(wordMetni(deflateZip("word/document.xml", BELGE, 9 << 20)), null, "bildirilen açık boy sınırın üstünde");
  /* gerçekten büyük açılan girdi (bildirilen küçük): açarken sınır */
  const bomba = `<w:document><w:body><w:p><w:r><w:t>${"A".repeat(9 << 20)}</w:t></w:r></w:p></w:body></w:document>`;
  assert.equal(wordMetni(deflateZip("word/document.xml", bomba, 100)), null, "açarken sınır");
});
