/* OLUMSUZ KANIT — tests/imza-pdf.test.ts neyi koruyor (315–317 ve 318 çapraz incelemeleri). Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): denetim
   bellekte bozulur, geçici klasörden içe aktarılır.
   1. Özgün nesnenin yeniden tanımlanması denetlenmeseydi onaylı raporun sayfa içeriği imza ekiyle değiştirilir, rapor yine "imzalı" sayılırdı.
   2. Ekin trailer kökü denetlenmeseydi ek yeni bir katalog ve sayfa ağacıyla bambaşka bir belge gösterirdi. */
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
let sira = 0;
async function bozuk(eski: string, yeni: string): Promise<Modul> {
  const metin = readFileSync(KAYNAK, "utf8");
  assert.ok(metin.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const hedef = join(klasor, `imza-pdf-${sira++}.ts`);
  writeFileSync(hedef, metin.replace(eski, yeni));
  return (await import(pathToFileURL(hedef).href)) as Modul;
}
const b = (s: string) => new Uint8Array(Buffer.from(s, "latin1"));
const OZGUN = "%PDF-1.4\n1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n"
  + "3 0 obj << /Type /Page /Parent 2 0 R /Contents 4 0 R >> endobj\n4 0 obj << /Length 18 >> stream\nBT (Uygun) Tj ET\nendstream\nendobj\ntrailer << /Root 1 0 R >>\n%%EOF\n";
const IMZA = "9 0 obj << /Type /Sig /ByteRange [0 1 2 3] /Contents <00> >> endobj\n";

test("özgün nesne denetimi kalkınca ek sayfa içerik akışını değiştirir ve kabul edilir (kilidin koruduğu açık)", async () => {
  const m = await bozuk("      if (eski) {", "      if (eski && false) {");
  const ek = "4 0 obj << /Length 25 >> stream\nBT (Uygun degil) Tj ET\nendstream\nendobj\n" + IMZA + "trailer << /Root 1 0 R /Prev 0 >>\n%%EOF\n";
  assert.equal(m.imzaliPdfGecerli(b(OZGUN), b(OZGUN + ek)), true, "içeriği değiştiren ek kabul edildi");
});

test("kök denetimi kalkınca ek yeni bir belge gösterir ve kabul edilir", async () => {
  const m = await bozuk("    if (!ekKokler.length || ekKokler.some((k) => k !== ozgunKok)) return false;", "");
  const ek = "50 0 obj << /Type /Catalog /Pages 51 0 R >> endobj\n51 0 obj << /Type /Pages /Kids [52 0 R] /Count 1 >> endobj\n"
    + "52 0 obj << /Type /Page /Parent 51 0 R /Contents 53 0 R >> endobj\n53 0 obj << /Length 9 >> stream\nBT ET\nendstream\nendobj\n" + IMZA
    + "trailer << /Root 50 0 R /Prev 0 >>\n%%EOF\n";
  assert.equal(m.imzaliPdfGecerli(b(OZGUN), b(OZGUN + ek)), true, "yeni köklü ek kabul edildi");
});
