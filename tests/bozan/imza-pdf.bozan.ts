/* OLUMSUZ KANIT — tests/imza-pdf.test.ts neyi koruyor (315–317 ve 318 çapraz incelemeleri). Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): denetim
   bellekte bozulur, geçici klasörden içe aktarılır.
   1. Özgün nesnenin yeniden tanımlanması denetlenmeseydi onaylı raporun sayfa içeriği imza ekiyle değiştirilir, rapor yine "imzalı" sayılırdı.
   2. Ekin trailer kökü denetlenmeseydi ek yeni bir katalog ve sayfa ağacıyla bambaşka bir belge gösterirdi.
   3. (2026-10-17) Sayfa ağacı düğümünün AYNEN kalması denetlenmeseydi imza eki ağaca sayfa ekler, onaylı rapora sayfa katılırdı.
   4. (2026-10-17) Belge bilgisinin düz değerli kalması denetlenmeseydi bilgi sözlüğü başka nesnelere başvuru taşırdı. */
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

/* 333 incelemesi: trailer sözlüğü sınırsız ayrıştırılırsa "trailer(" yığını karesel süre çıkarır — tests/imza-pdf.test.ts süre kilidi bunu yakalar */
test("trailer penceresi ve sınırı kalkınca 'trailer(' yığınlı ek karesel sürede taranır", async () => {
  const m = await bozuk("const TRAILER_PENCERE = 8192, TRAILER_SINIR = 32;", "const TRAILER_PENCERE = Infinity, TRAILER_SINIR = Infinity;");
  const t = performance.now();
  assert.equal(m.imzaliPdfGecerli(b(OZGUN), b(OZGUN + "3 0 obj<</Type/Sig>>endobj\n" + "trailer(".repeat(25 * 1024))), false);
  assert.ok(performance.now() - t > 1000, `karesel süre görünmedi: ${Math.round(performance.now() - t)} ms`);
});

/* 2026-10-17 (gerçek imza aracı yapısı): sayfa ağacı düğümü yalnız AYNEN, belge bilgisi yalnız düz değerlerle yeniden yazılabilir */
const BILGILI = OZGUN.replace("trailer << /Root 1 0 R >>", "5 0 obj << /Producer (probata) >> endobj\ntrailer << /Root 1 0 R /Info 5 0 R >>");
const sonu = "trailer << /Root 1 0 R /Info 5 0 R /Prev 0 >>\n%%EOF\n";
test("sayfa ağacı karşılaştırması kalkınca ek ağaca sayfa ekler ve kabul edilir", async () => {
  const m = await bozuk("          if (kanonik(x.deger) !== kanonik(eski.deger)) return false;", "");
  const ek = "2 0 obj << /Type /Pages /Kids [3 0 R 30 0 R] /Count 2 >> endobj\n" + IMZA + sonu;
  assert.equal(m.imzaliPdfGecerli(b(BILGILI), b(BILGILI + ek)), true, "ağaca sayfa ekleyen ek kabul edildi");
});
test("belge bilgisinin düz değer denetimi kalkınca bilgiye başvuru girer ve kabul edilir", async () => {
  const m = await bozuk("          if (!duzBilgi(x.deger)) return false;", "");
  const ek = "5 0 obj << /Producer (x) /Gizli 4 0 R >> endobj\n" + IMZA + sonu;
  assert.equal(m.imzaliPdfGecerli(b(BILGILI), b(BILGILI + ek)), true, "başvurulu bilgi kabul edildi");
});
