/* OLUMSUZ KANIT — tests/say-kosul.test.ts neyi koruyor (2026-10-31, kalem 7). Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): kosul.ts bellekte bozulup geçici
   klasörden içe aktarılır. 1. Firma kabulü rol denetimsiz olursa herhangi bir kullanıcı firmayı yurt dışı aktarıma bağlar. 2. Kullanıcı firma kabulünden
   önce kabul edebilirse firma yöneticisinin kararı atlanır. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";
import { kosulDb } from "../say-kosul.test.ts";

const klasor = mkdtempSync(join(tmpdir(), "bozan-say-kosul-"));
after(() => rmSync(klasor, { recursive: true, force: true }));
type Kosul = typeof import("../../src/server/yz/kosul.ts");
const KAYNAK = "src/server/yz/kosul.ts";
let sira = 0;
async function bozuk(eski: string, yeni: string): Promise<Kosul> {
  const kaynak = readFileSync(resolve(KAYNAK), "utf8");
  assert.ok(kaynak.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const yol = join(klasor, `${sira++}-kosul.ts`), kok = dirname(resolve(KAYNAK));
  writeFileSync(yol, kaynak.replace(eski, () => yeni).replace(/from "(\.{1,2}\/[^"]+)"/g, (_, p: string) => `from "${pathToFileURL(resolve(kok, p)).href}"`));
  return import(pathToFileURL(yol).href) as Promise<Kosul>;
}

test("1. firma kabulünde rol denetimi kalkınca kilit düşer", async () => {
  const m = await bozuk('if (!kim.roller.includes("firma_yoneticisi")) return "Koşulları firma adına yalnız firma yöneticisi kabul eder.";', "");
  const a = kosulDb([]);
  assert.equal(await m.kosulKabulEt(a.db, { roller: ["denetci"] }, "firma"), null);
  assert.ok(a.eklenen.includes("firma"), "bozuk: denetçi firma adına kabul etti");
});
test("2. kullanıcı firma kabulünden önce kabul edince kilit düşer", async () => {
  const m = await bozuk('  if (!d.firma) return "S.A.Y, firma yöneticiniz kullanım koşullarını kabul edince açılır.";\n', "");
  const a = kosulDb([]);
  assert.equal(await m.kosulKabulEt(a.db, { roller: ["denetci"] }, "kullanici"), null);
});
