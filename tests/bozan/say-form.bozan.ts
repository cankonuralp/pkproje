/* OLUMSUZ KANIT — tests/say-form.test.ts neyi koruyor (2026-10-31, kalem 4 — K6). Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): form-goruntusu.ts bellekte
   bozulup geçici klasörden içe aktarılır (göreli içe aktarmalar özgün klasöre). 1. Ekipman bilgisi işaretlenmezse S.A.Y tankın markasının yerini görmez
   (26 Ekim'deki yanlış yer). 2. İşaretli belge kesin kalırsa e-imza alanı ve kesin şerit görüntüye girer, belge gibi görünür. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";
import { ornekBelge } from "../../src/belge/ornek.ts";

const klasor = mkdtempSync(join(tmpdir(), "bozan-say-form-"));
after(() => rmSync(klasor, { recursive: true, force: true }));
type Form = typeof import("../../src/modules/raporlar/server/form-goruntusu.ts");
const KAYNAK = "src/modules/raporlar/server/form-goruntusu.ts";
let sira = 0;
async function bozuk(eski: string, yeni: string): Promise<Form> {
  const kaynak = readFileSync(resolve(KAYNAK), "utf8");
  assert.ok(kaynak.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const yol = join(klasor, `${sira++}-form.ts`);
  const kok = dirname(resolve(KAYNAK));
  writeFileSync(yol, kaynak.replace(eski, () => yeni).replace(/from "(\.{1,2}\/[^"]+)"/g, (_, p: string) => `from "${pathToFileURL(resolve(kok, p)).href}"`));
  return import(pathToFileURL(yol).href) as Promise<Form>;
}

test("1. ekipman bilgisi işaretlenmeyince kilit düşer", async () => {
  const m = await bozuk("for (const k of EKIPMAN) ekipman[k] = `[e:${k}]`;", "void EKIPMAN;");
  assert.notEqual(m.isaretliVeri(ornekBelge("KOMPRESOR")).ekipman.seri, "[e:seri]");
});
test("2. işaretli belge kesin kalınca kilit düşer", async () => {
  const m = await bozuk("return { ...v, ekipman, cevaplar: c, kesin: false };", "return { ...v, ekipman, cevaplar: c };");
  assert.equal(m.isaretliVeri({ ...ornekBelge("KOMPRESOR"), kesin: true }).kesin, true);
});
