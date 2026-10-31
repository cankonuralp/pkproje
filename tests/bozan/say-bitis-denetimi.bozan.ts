/* OLUMSUZ KANIT — tests/say-bitis-denetimi.test.ts neyi koruyor (2026-10-31, L3). Kaynak diskte DEĞİŞTİRİLMEZ: bitis-denetimi.ts bellekte bozulur.
   1. Denetimden sonraki yazma karşılaştırması kalkarsa S.A.Y'ın kendi denetimi yok sayılır. 2. Üst sınır kalkarsa denetim sonsuza dek döner. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";

const klasor = mkdtempSync(join(tmpdir(), "bozan-bitis-"));
after(() => rmSync(klasor, { recursive: true, force: true }));
let sira = 0;
type M = typeof import("../../src/modules/say/bitis-denetimi.ts");
async function bozuk(eski: string, yeni: string): Promise<M> {
  const k = readFileSync(resolve("src/modules/say/bitis-denetimi.ts"), "utf8");
  assert.ok(k.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const yol = join(klasor, `${sira++}.ts`);
  writeFileSync(yol, k.replace(eski, () => yeni));
  return import(pathToFileURL(yol).href) as Promise<M>;
}
const R = "22222222-2222-4222-8222-222222222222";
const soru = { role: "user", content: [{ type: "text", text: "yaz" }] }, cevap = { role: "assistant", content: [{ type: "text", text: "ok" }] };
const yaz = [{ role: "assistant", content: [{ type: "tool_use", id: "a", name: "islem", input: { ad: "rapor_yaz", girdi: { rapor: R } } }] },
  { role: "user", content: [{ type: "tool_result", tool_use_id: "a", content: "{}" }] }];

test("1. denetim sırası yok sayılınca kilit düşer", async () => {
  const m = await bozuk("|| sonDenetim > sonYazma ", "");
  const den = [{ role: "assistant", content: [{ type: "tool_use", id: "d", name: "islem", input: { ad: "plan_denetle", girdi: { rapor: R } } }] }];
  assert.notEqual(m.bitisDenetimi([soru, ...yaz, ...den, cevap]), null);
});
test("2. üst sınır kalkınca kilit düşer", async () => {
  const m = await bozuk("|| denetim >= DENETIM_EN_COK ", "");
  const not = { role: "user", content: [{ type: "text", text: m.denetimNotu("{}") }] };
  assert.notEqual(m.bitisDenetimi([soru, ...yaz, cevap, not, ...yaz, cevap, not, ...yaz, cevap]), null);
});
