/* OLUMSUZ KANIT — tests/say-doldurma.test.ts neyi koruyor (2026-10-31). Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): doldurma.ts bellekte bozulup geçici
   klasörden içe aktarılır. 1. Mevcut değerler korunmazsa S.A.Y'ın tek yeri yazması öteki elle yerleri siler. 2. Tanınmayan yer atlanırsa yanlış adla
   istenen yer sessizce yazılmamış olur. 3. Liste değerleri de taşırsa kişisel veri modele gider. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";
import { TANIM } from "../say-doldurma.test.ts";

const klasor = mkdtempSync(join(tmpdir(), "bozan-say-doldurma-"));
after(() => rmSync(klasor, { recursive: true, force: true }));
type M = typeof import("../../src/server/yz/doldurma.ts");
const KAYNAK = "src/server/yz/doldurma.ts";
let sira = 0;
async function bozuk(eski: string, yeni: string): Promise<M> {
  const kaynak = readFileSync(resolve(KAYNAK), "utf8"), kok = dirname(resolve(KAYNAK));
  assert.ok(kaynak.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const yol = join(klasor, `${sira++}-doldurma.ts`);
  writeFileSync(yol, kaynak.replace(eski, () => yeni).replace(/from "(\.{1,2}\/[^"]+)"/g, (_, p: string) => `from "${pathToFileURL(resolve(kok, p)).href}"`));
  return import(pathToFileURL(yol).href) as Promise<M>;
}
const PANEL = { tanim: TANIM, degerler: { c_yetkili: "Deneme Kişi" }, surum: 3 };

test("1. mevcut değerler korunmayınca kilit düşer", async () => {
  const m = await bozuk("const degerler: Record<string, string> = { ...p.degerler };", "const degerler: Record<string, string> = {};");
  assert.notDeepEqual(m.doldurmaHazirla(PANEL, { c_odeme: "Havale" }), { degerler: { c_yetkili: "Deneme Kişi", c_odeme: "Havale" }, surum: 3 });
});
test("2. tanınmayan yer atlanınca kilit düşer", async () => {
  const m = await bozuk("  if (tanimsiz.length) {", "  if (false) {");
  assert.ok(!("cevap" in m.doldurmaHazirla(PANEL, { "Olmayan yer": "x" })));
});
test("3. listede değer de taşınınca kilit düşer", async () => {
  const m = await bozuk("dolu: !!p.degerler[a.id]?.trim(),", "dolu: !!p.degerler[a.id]?.trim(), deger: p.degerler[a.id],");
  assert.ok(JSON.stringify(m.doldurmaHazirla(PANEL, {})).includes("Deneme Kişi"));
});
