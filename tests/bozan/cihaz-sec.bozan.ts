/* OLUMSUZ KANIT — tests/cihaz-sec.test.ts neyi koruyor (2026-11-06). Kaynak diskte DEĞİŞTİRİLMEZ: raporlar/cihaz-sec.ts bellekte bozulur —
   (1) zimmet koşulu kalkarsa depodaki ya da başkasının cihazı kendiliğinden rapora girer; (2) kalibrasyon koşulu kalkarsa geçmiş cihaz seçilir. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";

const klasor = mkdtempSync(join(tmpdir(), "bozan-cihaz-sec-"));
after(() => rmSync(klasor, { recursive: true, force: true }));
const kaynak = readFileSync(resolve("src/modules/raporlar/cihaz-sec.ts"), "utf8").replace('from "./sema.ts"', `from ${JSON.stringify(pathToFileURL(resolve("src/modules/raporlar/sema.ts")).href)}`);
async function bozuk(eski: string, ad: string): Promise<typeof import("../../src/modules/raporlar/cihaz-sec.ts")> {
  assert.ok(kaynak.includes(eski), "bozulacak yer bulunmalı");
  const yol = join(klasor, `${ad}.ts`);
  writeFileSync(yol, kaynak.replace(eski, ""));
  return import(pathToFileURL(yol).href);
}
const MAN = "11111111-1111-4111-8111-111111111111";

test("zimmet koşulu kalkınca depodaki cihaz seçilir — kilit düşer", async () => {
  const m = await bozuk(" && c.zimmette", "zimmet");
  assert.deepEqual(m.otomatikCihazlar([MAN], [{ id: "mn1", turId: MAN, pasif: false, lab: false, gecti: false, zimmette: false }], new Map()), [{ tur: MAN, cihaz: "mn1" }]);
});

test("kalibrasyon koşulu kalkınca geçmiş cihaz seçilir — kilit düşer", async () => {
  const m = await bozuk(" && !c.gecti", "kalibrasyon");
  assert.deepEqual(m.otomatikCihazlar([MAN], [{ id: "mn1", turId: MAN, pasif: false, lab: false, gecti: true, zimmette: true }], new Map()), [{ tur: MAN, cihaz: "mn1" }]);
});
