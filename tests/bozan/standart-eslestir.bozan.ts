/* OLUMSUZ KANIT — tests/standart-eslestir.test.ts neyi koruyor (kaynak diskte değiştirilmez; eslestir.ts bellekte bozulur):
   1. Numaranın ardındaki karakter denetimi kalkınca "TS 622" atfı "TS 6225"i tutar — denetçi yanlış standardı okur.
   2. Kriter belgesi atfı bölünürse belgenin adı ayrı bir standart sanılır — pencerede "kütüphanede yok" diye ikinci bir bölüm çıkar. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";

type Modul = typeof import("../../src/modules/dokumanlar/eslestir.ts");
const KAYNAK = readFileSync(resolve("src/modules/dokumanlar/eslestir.ts"), "utf8");
const klasor = mkdtempSync(join(tmpdir(), "standart-eslestir-bozan-"));
after(() => rmSync(klasor, { recursive: true, force: true }));
let sira = 0;
async function bozuk(eski: string, yeni: string): Promise<Modul> {
  assert.ok(KAYNAK.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const yol = join(klasor, `eslestir-${sira++}.ts`);
  writeFileSync(yol, KAYNAK.replace(eski, () => yeni));
  return import(pathToFileURL(yol).href);
}

test("ardından gelen karakter denetimi kalkınca TS 622, TS 6225'i tutar", async () => {
  const m = await bozuk("if (sonraki && /[0-9A-ZÇĞİÖŞÜ]/.test(sonraki)) continue;", "");
  assert.equal(m.standartBul("TS 6225 Bölüm 2", [{ no: "TS 622" }])?.no, "TS 622", "bozuk: yanlış standart");
});

test("kriter belgesi atfı bölünürse belgenin adı ayrı atıf olur", async () => {
  const m = await bozuk("if (KRITER.test(s)) return [s];", "");
  assert.equal(m.atiflar("ZPKK02 · Elektrik İç Tesisatı Periyodik Kontrol Kriterleri").length, 2, "bozuk: iki atıf");
});
