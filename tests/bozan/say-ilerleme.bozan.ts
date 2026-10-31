/* OLUMSUZ KANIT — tests/say-ilerleme.test.ts neyi koruyor (2026-10-31). Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): ilerleme.ts bellekte bozulup geçici
   klasörden içe aktarılır. 1. Tavan kalkarsa uzun işte çubuk %100 olur ama iş sürer ("bitti" sanılır). 2. Tahmin ortanca yerine son süre olursa tek
   uzun iş bütün tahmini bozar. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";

const klasor = mkdtempSync(join(tmpdir(), "bozan-say-ilerleme-"));
after(() => rmSync(klasor, { recursive: true, force: true }));
type M = typeof import("../../src/modules/say/ilerleme.ts");
let sira = 0;
async function bozuk(eski: string, yeni: string): Promise<M> {
  const kaynak = readFileSync(resolve("src/modules/say/ilerleme.ts"), "utf8");
  assert.ok(kaynak.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const yol = join(klasor, `${sira++}-ilerleme.ts`);
  writeFileSync(yol, kaynak.replace(eski, () => yeni));
  return import(pathToFileURL(yol).href) as Promise<M>;
}
test("1. tavan kalkınca kilit düşer", async () => {
  const m = await bozuk("Math.min(95, Math.round(95 * (1 - Math.exp(-2.3 * g / t))))", "Math.round(100 * g / t)");
  assert.ok(m.ilerleme(200, 20).yuzde > 95);
});
test("2. ortanca yerine son süre olunca kilit düşer", async () => {
  const m = await bozuk("l[Math.floor(l.length / 2)]!", "(m0 => m0[m0.length - 1]!)(gecmis[tur] ?? [])");
  assert.notEqual(m.tahminSn("oku", { oku: [10, 20, 500] }), 20);
});
