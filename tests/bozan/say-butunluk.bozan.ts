/* OLUMSUZ KANIT — tests/say-butunluk.test.ts neyi koruyor (2026-10-31, K1). Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): konusma-denetim.ts bellekte
   bozulup geçici klasörden içe aktarılır. 1. Aynı çağrının ikinci sonucu da tutulursa konuşma bozuk kalır (hizmet her isteği reddeder). 2. Sonuçsuz
   çağrı kapanmazsa istek geçersiz. 3. Kapanmış çağrıya da sonuç yazılırsa yarış yeniden iki sonuç üretir. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";
import { BOZUK } from "../say-butunluk.test.ts";

const klasor = mkdtempSync(join(tmpdir(), "bozan-say-butunluk-"));
after(() => rmSync(klasor, { recursive: true, force: true }));
type Denetim = typeof import("../../src/server/yz/konusma-denetim.ts");
let sira = 0;
async function bozuk(eski: string, yeni: string): Promise<Denetim> {
  const kaynak = readFileSync(resolve("src/server/yz/konusma-denetim.ts"), "utf8");
  assert.ok(kaynak.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const yol = join(klasor, `${sira++}-denetim.ts`);
  writeFileSync(yol, kaynak.replace(eski, () => yeni));
  return import(pathToFileURL(yol).href) as Promise<Denetim>;
}
const sonucSayisi = (m: { content: unknown }[]) => m.flatMap((x) => (Array.isArray(x.content) ? x.content : [])).filter((b) => (b as { type?: string }).type === "tool_result").length;

test("1. ikinci sonuç da tutulunca kilit düşer", async () => {
  const m = await bozuk("if (kalan.has(id)) { kalan.delete(id);", "if (idler.includes(id)) { kalan.delete(id);");
  assert.equal(sonucSayisi(m.konusmaDuzelt(BOZUK, "Y").mesajlar), 2);
});
test("2. sonuçsuz çağrı kapanmayınca kilit düşer", async () => {
  const m = await bozuk("if (kalan.size) {", "if (false) {");
  const d = m.konusmaDuzelt([{ role: "assistant", content: [{ type: "tool_use", id: "c1", name: "islem", input: {} }] }, { role: "user", content: [{ type: "text", text: "dur" }] }], "Y");
  assert.equal(sonucSayisi(d.mesajlar), 0);
});
test("3. kapanmış çağrıya sonuç yazılınca kilit düşer", async () => {
  const m = await bozuk(".filter(([id]) => acik.has(id))", "");
  assert.equal(m.acikSonuclar([{ type: "text", text: "bitti" }], { f1: "a" }).length, 1);
});
