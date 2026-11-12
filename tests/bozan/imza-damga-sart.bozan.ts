/* OLUMSUZ KANIT — tests/imza-damga-sart.test.ts neyi koruyor (2026-11-12; pkproje.md §11 K9). Kaynak diskte DEĞİŞTİRİLMEZ: yukleme.ts bellekte bozulup
   geçici klasörden içe aktarılır. O zaman:
   1) zaman damgası şartı kalkınca TÜRKAK'lı firmanın raporuna zaman damgasız imza kabul edilir — sertifikanın süresi dolunca imza doğrulanamaz olur. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";
import { dk, imzaliDss, iptalK } from "../yardimci/iptal-zamani.ts";

const KAYNAK = "src/server/imza/yukleme.ts";
const klasor = mkdtempSync(join(tmpdir(), "bozan-imza-damga-"));
after(() => rmSync(klasor, { recursive: true, force: true }));
let sira = 0;
async function bozuk(eski: string, yeni: string): Promise<typeof import("../../src/server/imza/yukleme.ts")> {
  const metin = readFileSync(KAYNAK, "utf8");
  assert.ok(metin.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const cevrilmis = metin.replace(eski, () => yeni).replace(/from "(\.{1,2}\/[^"]+)"/g, (_t, yol: string) => `from "${pathToFileURL(resolve(dirname(KAYNAK), yol)).href}"`);
  const hedef = join(klasor, `kopya-${sira++}.ts`);
  writeFileSync(hedef, cevrilmis);
  return import(pathToFileURL(hedef).href);
}

test("1) zaman damgası şartı kalkınca TÜRKAK'lı raporda zaman damgasız imza kabul edilir", async () => {
  const m = await bozuk("    if (kural.damgaSart && !i.damga && !belgeDamgali) return DAMGA_YOK;\n", "");
  const damgasiz = imzaliDss({ ocsp: [iptalK.ocsp({ zaman: dk(5) })] }, { damga: false });
  assert.equal(m.ekImzaNedeni(iptalK.taban, damgasiz, dk(10), { damgaSart: true }), null, "bozuk: zaman damgasız imza kabul edildi");
});
