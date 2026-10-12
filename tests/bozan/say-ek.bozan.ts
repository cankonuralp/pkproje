/* OLUMSUZ KANIT — tests/say-ek.test.ts (522, S.A.Y'a fotoğraf ve belge eki) neyi koruyor. Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): ek.ts bellekte
   bozulup geçici klasörden içe aktarılır (göreli içe aktarmalar kök adrese çevrilir). O zaman:
   1) fotoğraf temizlenmeseydi konum bilgisi (EXIF) yapay zekâya giderdi;
   2) toplam boy denetimi kalkınca 4 MB'ı aşan ekler istek gövdesi sınırına takılır (soru sessizce düşer) ya da kotadan habersiz harcar;
   3) adet denetimi kalkınca bir soruya sınırsız ek konur. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";

const gecici = mkdtempSync(join(tmpdir(), "say-ek-bozan-"));
after(() => rmSync(gecici, { recursive: true, force: true }));
const kok = resolve("src/modules/say/server");
const KAYNAK = readFileSync(join(kok, "ek.ts"), "utf8").replace(/from "(\.\.?\/[^"]+)"/g, (_, y: string) => `from "${pathToFileURL(resolve(kok, y)).href}"`);
let sira = 0;
type Ek = typeof import("../../src/modules/say/server/ek.ts");
async function bozuk(eski: string, yeni: string): Promise<Ek> {
  assert.ok(KAYNAK.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const yol = join(gecici, `ek-${sira++}.ts`);
  writeFileSync(yol, KAYNAK.replace(eski, () => yeni));
  return import(pathToFileURL(yol).href) as Promise<Ek>;
}
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe1, 0x00, 0x08, 0x45, 0x78, 0x69, 0x66, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x03, 0x01, 0xff, 0xda, 0x00, 0x02, 0x01, 0x02, 0x03, 0xff, 0xd9]);
const PDF = new Uint8Array(Buffer.from("%PDF-1.4\n%%EOF"));

test("1. fotoğraf temizlenmeyince EXIF yapay zekâya gider (kilidin koruduğu açık)", async () => {
  const m = await bozuk('const bayt = tur === "jpeg" ? jpegTemizle(b) : pngTemizle(b);', "const bayt = b;");
  const e = m.sayEkiOku(JPEG, "etiket.jpg");
  assert.ok(!("durum" in e) && e.icerik.tur === "jpeg" && Buffer.from(e.icerik.bayt).includes(Buffer.from("Exif")), "bozuk: EXIF duruyor");
});

test("2. toplam boy denetimi kalkınca 4 MB'ı aşan ekler kabul edilir (kilidin koruduğu açık)", async () => {
  const m = await bozuk("  if (l.reduce((t, x) => t + x.bayt.length, 0) > EK_EN_COK_BAYT) return { durum: \"red\", neden: EK_BOY_HATASI };\n", "");
  const yari = new Uint8Array((4 << 20) / 2 + 1); yari.set(PDF);
  const l = m.sayEkleriOku([{ bayt: yari, ad: "1.pdf" }, { bayt: yari, ad: "2.pdf" }]);
  assert.ok(Array.isArray(l) && l.length === 2, "bozuk: toplam 4 MB üstü geçti");
});

test("3. adet denetimi kalkınca bir soruya sınırsız ek konur (kilidin koruduğu açık)", async () => {
  const m = await bozuk("  if (l.length > EK_EN_COK_ADET) return", "  if (false) return");
  const l = m.sayEkleriOku(Array.from({ length: 9 }, () => ({ bayt: PDF, ad: "p.pdf" })));
  assert.ok(Array.isArray(l) && l.length === 9, "bozuk: 9 ek geçti");
});
