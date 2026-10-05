/* OLUMSUZ KANIT — tests/imza-pdf.test.ts neyi koruyor (315–317 çapraz incelemesi). Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): denetim bellekte
   bozulur, geçici klasörden içe aktarılır.
   1. Ek, özgün nesneyi akışla yeniden tanımlayabilseydi onaylı raporun sayfa içeriği imza ekiyle değiştirilir, rapor yine "imzalı" kabul edilirdi. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";

const KAYNAK = "src/modules/raporlar/imza-pdf.ts";
const klasor = mkdtempSync(join(tmpdir(), "imza-pdf-bozan-"));
after(() => rmSync(klasor, { recursive: true, force: true }));
type Modul = typeof import("../../src/modules/raporlar/imza-pdf.ts");

test("akış kuralı kalkınca ek sayfa içerik akışını değiştirir ve kabul edilir (kilidin koruduğu açık)", async () => {
  const eski = String.raw`    if (/\bstream\b/.test(govde)) return false;`;
  const metin = readFileSync(KAYNAK, "utf8");
  assert.ok(metin.includes(eski), "bozulacak satır kaynakta yok");
  const hedef = join(klasor, "imza-pdf.ts");
  writeFileSync(hedef, metin.replace(eski, ""));
  const m = (await import(pathToFileURL(hedef).href)) as Modul;
  const OZGUN = "%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\n4 0 obj << /Length 18 >> stream\nBT (Uygun) Tj ET\nendstream\nendobj\n%%EOF\n";
  const ek = "4 0 obj << /Length 25 >> stream\nBT (Uygun degil) Tj ET\nendstream\nendobj\n9 0 obj << /Type /Sig /ByteRange [0 1 2 3] /Contents <00> >> endobj\n";
  const b = (s: string) => new Uint8Array(Buffer.from(s, "latin1"));
  assert.equal(m.imzaliPdfGecerli(b(OZGUN), b(OZGUN + ek)), true, "içeriği değiştiren ek kabul edildi");
});
