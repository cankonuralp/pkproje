/* OLUMSUZ KANIT — tests/secim-gorunen.test.ts neyi koruyor (425; kaynak diskte değiştirilmez, bellekte bozulur): seçim listesinin 50 sınırı kalkınca
   binlerce seçenek çizilir (reisim: "donmalara sebep olur"); seçili seçeneği listeye alma kalkınca sona düşen seçili görünmez. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";

type Modul = typeof import("../../src/components/secim/gorunen.ts");
const klasor = mkdtempSync(join(tmpdir(), "secim-bozan-"));
after(() => rmSync(klasor, { recursive: true, force: true }));
let sira = 0;
async function bozuk(eski: string, yeni: string): Promise<Modul> {
  const kok = resolve("src/components/secim");
  let k = readFileSync(join(kok, "gorunen.ts"), "utf8");
  assert.ok(k.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  k = k.replace(eski, yeni).replace(/from "(\.\.?\/[^"]+)"/g, (_, y: string) => `from "${pathToFileURL(resolve(kok, y)).href}"`);
  const yol = join(klasor, `${sira++}.ts`);
  writeFileSync(yol, k);
  return import(pathToFileURL(yol).href);
}
const BIN = Array.from({ length: 1000 }, (_, i) => [`m${i}`, `Müşteri ${i}`] as const);

test("50 sınırı kalkınca binlerce seçenek çizilir", async () => {
  const m = await bozuk("const liste = sirali.slice(0, EN_COK_GORUNEN);", "const liste = sirali.slice();");
  assert.equal(m.gorunenSecenekler(BIN, "", "").liste.length, 1000, "bozuk: 1000 seçenek çizildi");
});

test("seçili seçeneği listeye alma kalkınca sona düşen seçili görünmez", async () => {
  const m = await bozuk("if (secili && !liste.includes(secili)) liste[liste.length - 1] = secili;", "");
  assert.equal(m.gorunenSecenekler(BIN, "m999", "").liste.some((o) => o[0] === "m999"), false, "bozuk: seçili görünmüyor");
});
