/* OLUMSUZ KANIT — tests/format-motor.test.ts "427" neyi koruyor (kaynak diskte değiştirilmez; duzen.ts bellekte bozulur, göreli içe aktarmalar
   mutlak yola çevrilir):
   1. Üst başlık yok sayılınca ZPKR04'ün 5.1 / 5.2'si 5 ve 6 olur, sonraki bütün resmî numaralar kayar.
   2. Numarasız bölüm numara alınca ZPKR04 "Fotoğraflar" 7 olur, Notlar 8'e kayar.
   3. Ekipman bölümü yalnız adından tanınınca ZPKR04 "Tesis bilgileri" 2. bölüme katılmaz, ayrı bölüm olur. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";
import { SABLONLAR } from "../../src/format/sablonlar.ts";

type Modul = typeof import("../../src/format/duzen.ts");
const KOK = resolve("src/format");
const KAYNAK = readFileSync(join(KOK, "duzen.ts"), "utf8").replace(/from "(\.\.?\/[^"]+)"/g, (_, y: string) => `from "${pathToFileURL(resolve(KOK, y)).href}"`);
const klasor = mkdtempSync(join(tmpdir(), "format-duzen-bozan-"));
after(() => rmSync(klasor, { recursive: true, force: true }));
let sira = 0;
async function bozuk(eski: string, yeni: string): Promise<Modul> {
  assert.ok(KAYNAK.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const yol = join(klasor, `duzen-${sira++}.ts`);
  writeFileSync(yol, KAYNAK.replace(eski, () => yeni));
  return import(pathToFileURL(yol).href);
}
const no = (m: Modul, ad: string) => m.raporDuzeni(SABLONLAR.ZPKR04.tanim, false).bolumler.find((x) => x.b.ad.startsWith(ad))?.no;

test("üst başlık yok sayılınca 5.1 / 5.2 düz numara olur", async () => {
  const m = await bozuk("const ust = b.ust?.trim() || null;", "const ust = null as string | null;");
  assert.equal(no(m, "Gözle muayeneler"), "5", "bozuk: alt numara yok");
  assert.equal(no(m, "Kusur"), "7", "bozuk: sonraki numaralar kaydı");
});

test("numarasız bölüm numara alınca Fotoğraflar numaralanır, Notlar kayar", async () => {
  const m = await bozuk("if (b.numarasiz) { sonUst = null; return { b, no: null, ust: null }; }", "");
  assert.equal(no(m, "Fotoğraflar"), "7", "bozuk: fotoğraf numaralı");
  assert.equal(no(m, "Notlar"), "8");
});

test("ekipman bölümü yalnız adından tanınınca 'Tesis bilgileri' ayrı bölüm olur", async () => {
  const m = await bozuk(`(b.id === "ekipman" || kucuk(b.ad).includes("ekipman"))`, `kucuk(b.ad).includes("ekipman")`);
  const d = m.raporDuzeni(SABLONLAR.ZPKR04.tanim, false);
  assert.equal(d.ekipmanBaslik, "Ekipman bilgileri", "bozuk: 2. bölüm başlığı formattan gelmedi");
  assert.equal(d.bolumler[0].b.ad, "Tesis bilgileri");
});
