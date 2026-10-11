/* OLUMSUZ KANIT — tests/word-metni.test.ts (498) neyi koruyor. Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): dosya bellekte bozulup geçici klasörden
   içe aktarılır.
   · Açarken üst sınır olmasaydı küçük görünen bir "Word" belgesi (ZIP bombası) sunucunun belleğini doldurabilirdi.
   · Girdi adı denetlenmeseydi her ZIP (ör. Excel) Word sayılır, içindeki ilk XML yapay zekâya giderdi. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";
import { deflateRawSync } from "node:zlib";

const gecici = mkdtempSync(join(tmpdir(), "word-bozan-"));
after(() => rmSync(gecici, { recursive: true, force: true }));
let sira = 0;
type Word = typeof import("../../src/server/yz/word.ts");
async function bozuk(eski: string, yeni: string): Promise<Word> {
  const s = readFileSync(resolve("src/server/yz/word.ts"), "utf8");
  assert.ok(s.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const yol = join(gecici, `kopya-${sira++}.ts`);
  writeFileSync(yol, s.replace(eski, () => yeni));
  return import(pathToFileURL(yol).href) as Promise<Word>;
}
function zip(ad: string, icerik: string, bildirilen: number): Uint8Array {
  const veri = deflateRawSync(Buffer.from(icerik, "utf8")), adB = Buffer.from(ad, "utf8");
  const yerel = Buffer.alloc(30); yerel.writeUInt32LE(0x04034b50, 0); yerel.writeUInt16LE(8, 8); yerel.writeUInt32LE(veri.length, 18); yerel.writeUInt32LE(bildirilen, 22); yerel.writeUInt16LE(adB.length, 26);
  const merkez = Buffer.alloc(46); merkez.writeUInt32LE(0x02014b50, 0); merkez.writeUInt16LE(8, 10); merkez.writeUInt32LE(veri.length, 20); merkez.writeUInt32LE(bildirilen, 24); merkez.writeUInt16LE(adB.length, 28);
  const son = Buffer.alloc(22); son.writeUInt32LE(0x06054b50, 0); son.writeUInt16LE(1, 8); son.writeUInt16LE(1, 10); son.writeUInt32LE(46 + adB.length, 12); son.writeUInt32LE(30 + adB.length + veri.length, 16);
  return new Uint8Array(Buffer.concat([yerel, adB, veri, merkez, adB, son]));
}

test("1. açarken sınır kalkınca bomba açılır (kilidin koruduğu açık)", async () => {
  const m = await bozuk("try { return inflateRawSync(veri, { maxOutputLength: ACIK_SINIR }); }", "try { return inflateRawSync(veri); }");
  const bomba = `<w:document><w:body><w:p><w:r><w:t>${"A".repeat(9 << 20)}</w:t></w:r></w:p></w:body></w:document>`;
  assert.notEqual(m.wordMetni(zip("word/document.xml", bomba, 100)), null, "bozuk: bomba açıldı");
});

test("2. girdi adı denetlenmeyince Excel Word sayılır (kilidin koruduğu açık)", async () => {
  const m = await bozuk("    if (girdi !== ad) continue;\n", "");
  const xlsx = zip("xl/workbook.xml", "<w:document><w:body><w:p><w:r><w:t>Excel</w:t></w:r></w:p></w:body></w:document>", 80);
  assert.equal(m.wordMetni(xlsx), "Excel", "bozuk: Excel okundu");
});
