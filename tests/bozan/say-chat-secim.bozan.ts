/* OLUMSUZ KANIT — tests/say-chat-secim.test.ts (549, S.A.Y Chat "Plandan seç") neyi koruyor (kaynak diskte değiştirilmez; secim.ts bellekte bozulur,
   göreli içe aktarmalar mutlak yola çevrilir):
   1. Başka branşın durumu "kapali" olursa ekipman yine listede görünür ama seçilemez (reisim'in şikâyeti geri gelir).
   2. Rapor denetimi kalkarsa onaya gitmiş raporu olan ekipmana yeni kayıt yazılır.
   3. Kendi Yeni raporu ayrımı kalkarsa başkasının raporu olan ekipman da "rapor" sayılır. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";

const klasor = mkdtempSync(join(tmpdir(), "say-chat-secim-bozan-"));
after(() => rmSync(klasor, { recursive: true, force: true }));
const yol = "src/modules/say-chat/secim.ts";
const KAYNAK = readFileSync(resolve(yol), "utf8")
  .replace(/from "(\.\.?\/[^"]+)"/g, (_, y: string) => `from "${pathToFileURL(resolve(resolve(yol, ".."), y)).href}"`);
let sira = 0;
async function bozuk(eski: string, yeni: string): Promise<typeof import("../../src/modules/say-chat/secim.ts")> {
  assert.ok(KAYNAK.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const y = join(klasor, `m-${sira++}.ts`);
  writeFileSync(y, KAYNAK.replace(eski, () => yeni));
  return import(pathToFileURL(y).href);
}
const E = { id: "e1", brans: "e" as const, pasif: false };

test("başka branş kapalı sayılırsa seçilemez", async () => {
  const m = await bozuk(`return { durum: "brans", neden: bransUyarisi(e.brans, brans) };`, `return { durum: "kapali", neden: bransUyarisi(e.brans, brans) };`);
  assert.equal(m.planEkipmanDurumu(E, "m", [], true).durum, "kapali", "bozuk: başka branş seçilemiyor");
});

test("rapor denetimi kalkınca onaydaki raporun ekipmanı seçilir", async () => {
  const m = await bozuk("  if (r) {\n", "  if (false) {\n");
  assert.equal(m.planEkipmanDurumu(E, "e", [{ ekipmanId: "e1", durum: "onayda", benimTaslak: false }], true).durum, "uygun", "bozuk: onaydaki rapora yeni kayıt");
});

test("kendi raporu ayrımı kalkınca başkasının raporu da rapor sayılır", async () => {
  const m = await bozuk("if (r?.benimTaslak) return", "if (r) return");
  assert.equal(m.planEkipmanDurumu(E, "e", [{ ekipmanId: "e1", durum: "taslak", benimTaslak: false }], true).durum, "rapor", "bozuk: başkasının raporu");
});
