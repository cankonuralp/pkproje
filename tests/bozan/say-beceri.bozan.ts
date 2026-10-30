/* OLUMSUZ KANIT — tests/say-beceri.test.ts neyi koruyor (2026-10-31, kalem 5). Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): beceriler.ts bellekte bozulup
   geçici klasörden içe aktarılır. 1. Ad tekilliği denetlenmezse iki beceri aynı adla çakışır, beceri_oku yanlış metni verir. 2. Bilinmeyen adda dizin
   dönmezse S.A.Y doğru adı öğrenemez. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";

const klasor = mkdtempSync(join(tmpdir(), "bozan-say-beceri-"));
after(() => rmSync(klasor, { recursive: true, force: true }));
type Beceri = typeof import("../../src/modules/say/beceriler.ts");
let sira = 0;
async function bozuk(eski: string, yeni: string): Promise<Beceri> {
  const kaynak = readFileSync(resolve("src/modules/say/beceriler.ts"), "utf8");
  assert.ok(kaynak.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const yol = join(klasor, `${sira++}-beceriler.ts`);
  writeFileSync(yol, kaynak.replace(eski, () => yeni));
  return import(pathToFileURL(yol).href) as Promise<Beceri>;
}
const ikiz = () => { const k = mkdtempSync(join(klasor, "k-")); for (const d of ["B01-a.md", "B02-b.md"]) writeFileSync(join(k, d), "---\nad: ayni-ad\ntarif: t\nne_zaman: n\n---\nmetin"); return k; };

test("1. ad tekilliği denetlenmeyince kilit düşer", async () => {
  const m = await bozuk('for (const k of ["kod", "ad"] as const)', 'for (const k of ["kod"] as const)');
  assert.equal(m.becerileriOku(ikiz()).length, 2, "bozuk: aynı adlı iki beceri kabul edildi");
});
test("2. bilinmeyen adda dizin dönmeyince kilit düşer", async () => {
  const m = await bozuk("Beceriler:\\n${beceriDizini(l)}", "");
  assert.doesNotMatch(m.beceriMetni([], "yok"), /Beceriler:/);
});
