/* OLUMSUZ KANIT — tests/sapma.test.ts neyi koruyor (2026-11-12, göç 0129; pkproje.md §11 K6). Kaynak diskte DEĞİŞTİRİLMEZ: sapma.ts bellekte bozulup
   geçici klasörden içe aktarılır. O zaman:
   1) gerekçe şartı kalkınca sapmalı rapor gerekçesiz onaya gider (teknik yönetici nedenini göremez);
   2) çakışma denetimi kalkınca aynı kişi aynı saatte iki ekipmanın başında görünür ve fark edilmez;
   3) kısa süre denetimi kalkınca 6 dakikalık kontrol sapma sayılmaz. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";

const KAYNAK = "src/modules/raporlar/sapma.ts";
const klasor = mkdtempSync(join(tmpdir(), "bozan-sapma-"));
after(() => rmSync(klasor, { recursive: true, force: true }));
let sira = 0;
async function bozuk(eski: string, yeni: string): Promise<typeof import("../../src/modules/raporlar/sapma.ts")> {
  const metin = readFileSync(KAYNAK, "utf8");
  assert.ok(metin.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const cevrilmis = metin.replace(eski, () => yeni).replace(/from "(\.{1,2}\/[^"]+)"/g, (_t, yol: string) => `from "${pathToFileURL(resolve(dirname(KAYNAK), yol)).href}"`);
  const hedef = join(klasor, `kopya-${sira++}.ts`);
  writeFileSync(hedef, cevrilmis);
  return import(pathToFileURL(hedef).href);
}
const G = { bas: "2026-11-12T13:30", bit: "2026-11-12T13:36", enKisaDk: 20, tesis: "A", planBas: "2026-11-12", planBit: "2026-11-12",
  digerleri: [{ no: "FL-1126-031", bas: "2026-11-12T13:20", bit: "2026-11-12T13:50", tesis: "A" }], tesisArasiDk: 0, fotolar: [] };

test("1) gerekçe şartı kalkınca sapmalı rapor gerekçesiz gider", async () => {
  const m = await bozuk("(gerekce[s.tur] ?? \"\").length < SAPMA_GEREKCE_EN_AZ", "false");
  const k = m.sapmaKarari(m.sapmalar(G), {});
  assert.ok("kayit" in k && k.kayit.length === 2, "bozuk: iki sapma gerekçesiz kayda geçti");
});

test("2) çakışma denetimi kalkınca aynı saatteki iki kontrol fark edilmez", async () => {
  const m = await bozuk("g.digerleri.filter((o) => an(o.bas) < bit && bas < an(o.bit))", "g.digerleri.filter(() => false)");
  assert.deepEqual(m.sapmalar(G).map((s) => s.tur), ["kisa"], "bozuk: çakışma sapması yok");
});

test("3) kısa süre denetimi kalkınca 6 dakikalık kontrol sapma sayılmaz", async () => {
  const m = await bozuk("if (g.enKisaDk !== null && sure < g.enKisaDk)", "if (false)");
  assert.deepEqual(m.sapmalar(G).map((s) => s.tur), ["cakisma"], "bozuk: kısa süre sapması yok");
});
