/* OLUMSUZ KANIT — tests/say-gorsel.test.ts neyi koruyor (2026-10-31, kalem 3). Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): gorsel.ts bellekte bozulup
   geçici klasörden içe aktarılır. 1. Pafta sınırı kalkarsa yüzlerce fotoğraf tek görüntüde küçülür, hiçbiri okunmaz. 2. Bölge kesilmezse yakınlaştırma
   bütün fotoğrafı gösterir; küçük yazı yine okunmaz. 3. Gri + karşıtlık uygulanmazsa parlama / kirdeki etiket okunmaz. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";
import sharp from "sharp";
import { foto } from "../say-gorsel.test.ts";

const klasor = mkdtempSync(join(tmpdir(), "bozan-say-gorsel-"));
after(() => rmSync(klasor, { recursive: true, force: true }));
type Gorsel = typeof import("../../src/modules/say/server/gorsel.ts");
let sira = 0;
async function bozuk(eski: string, yeni: string): Promise<Gorsel> {
  const kaynak = readFileSync(resolve("src/modules/say/server/gorsel.ts"), "utf8");
  assert.ok(kaynak.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const yol = join(klasor, `${sira++}-gorsel.ts`);
  writeFileSync(yol, kaynak.replace(eski, () => yeni).replace(/from "sharp"/, `from "${import.meta.resolve("sharp")}"`)
    .replace(/from "(\.\.\/\.\.\/\.\.\/server\/[^"]+)"/g, (_, p: string) => `from "${pathToFileURL(resolve("src/modules/say/server", p)).href}"`));
  return import(pathToFileURL(yol).href) as Promise<Gorsel>;
}
const boyut = async (b: Uint8Array) => { const m = await sharp(b).metadata(); return [m.width!, m.height!, m.channels!]; };

test("1. pafta sınırı kalkınca kilit düşer", async () => {
  const m = await bozuk("const n = Math.min(fotolar.length, PAFTA_EN_COK)", "const n = fotolar.length");
  const p = await m.paftaGoruntusu(await Promise.all(Array.from({ length: 16 }, async (_, i) => ({ etiket: `F${i + 1}`, bayt: await foto(200, 200) }))), 4);
  assert.equal((await boyut(p))[1], 1600, "bozuk: 16 karo (4 × 4) — kilit en çok 12 ister");
});
test("2. bölge kesilmeyince kilit düşer", async () => {
  const m = await bozuk("if (o.bolge && W && H) {", "if (false) {");
  const [w, h] = await boyut(await m.gosterGoruntusu(await foto(2000, 1000), { bolge: [0.5, 0.5, 0.6, 0.55] }));
  assert.deepEqual([w, h], [1568, 784], "bozuk: bütün fotoğraf");
});
test("3. gri + karşıtlık uygulanmayınca kilit düşer", async () => {
  const m = await bozuk('if (o.gelistir === "gri_kontrast") g = g.grayscale().normalise({ lower: 1, upper: 99 }).toColourspace("b-w");', "");
  assert.equal((await boyut(await m.gosterGoruntusu(await foto(400, 300), { gelistir: "gri_kontrast" })))[2], 3);
});
