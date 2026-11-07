/* OLUMSUZ KANIT — tests/sign-saf.test.ts neyi koruyor (2026-11-05, göç 0122). Kaynak diskte DEĞİŞTİRİLMEZ: dis/sign.ts bellekte bozulur —
   (1) zaman denetimi kalkarsa eski bir webhook yeniden oynatılır; (2) imza karşılaştırması kalkarsa sırsız biri raporu imzalatır. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";

const klasor = mkdtempSync(join(tmpdir(), "bozan-sign-"));
after(() => rmSync(klasor, { recursive: true, force: true }));
/* 2026-11-07: sign.ts adresleri sign-adres.ts'ten alır — kopyada tam yola çevrilir */
const kaynak = readFileSync(resolve("src/server/dis/sign.ts"), "utf8")
  .replace('from "./sign-adres.ts"', `from ${JSON.stringify(pathToFileURL(resolve("src/server/dis/sign-adres.ts")).href)}`);
async function bozuk(eski: string, yeni: string, ad: string): Promise<typeof import("../../src/server/dis/sign.ts")> {
  assert.ok(kaynak.includes(eski), "bozulacak yer bulunmalı");
  const yol = join(klasor, `${ad}.ts`);
  writeFileSync(yol, kaynak.replace(eski, yeni));
  return import(pathToFileURL(yol).href);
}
const SIR = "whsec-deneme-0123456789abcdef", g = '{"id":"abc12345"}';

test("zaman denetimi kalkınca eski webhook geçer — kilit düşer", async () => {
  const m = await bozuk("if (Math.abs(Math.floor(simdi.getTime() / 1000) - Number(t)) > WEBHOOK_TOLERANS_SN) return false;", "", "zaman");
  const t = Math.floor(Date.now() / 1000) - 3600;
  assert.equal(m.webhookDogrula(`t=${t},v1=${m.webhookImzasi(SIR, t, g)}`, g, SIR), true, "bozuk: bir saatlik bildirim kabul");
});

test("imza karşılaştırması kalkınca yanlış sır geçer — kilit düşer", async () => {
  const m = await bozuk("&& timingSafeEqual(Buffer.from(v, \"hex\"), beklenen)", "", "imza");
  const t = Math.floor(Date.now() / 1000);
  assert.equal(m.webhookDogrula(`t=${t},v1=${"0".repeat(64)}`, g, SIR), true, "bozuk: rastgele imza kabul");
});
