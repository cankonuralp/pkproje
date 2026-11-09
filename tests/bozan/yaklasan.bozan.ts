/* OLUMSUZ KANIT — tests/yaklasan.test.ts neyi koruyor (2026-11-09). Kaynak diskte DEĞİŞTİRİLMEZ: teklifler/yaklasan.ts bellekte bozulur —
   (1) üst sınır kalkarsa uzak tarihli tesis listeye girer ("sadece son 2 ay"); (2) alt sınır kalkarsa yıllar önceki tarih listeyi doldurur;
   (3) açık plan elenmezse işi açılmış tesis aranır; (4) gönderilmiş teklif de "bekliyor" sayılırsa balon hiç inmez;
   (5) ekranlardan biri önizlemeyi elle yazarsa kâğıt telefonda taşar. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { after, test } from "node:test";
import { pathToFileURL } from "node:url";
import { onizlemeKacaklari } from "../yardimci/belge-onizleme.ts";

const klasor = mkdtempSync(join(tmpdir(), "bozan-yaklasan-"));
after(() => rmSync(klasor, { recursive: true, force: true }));
const kaynak = readFileSync(resolve("src/modules/teklifler/yaklasan.ts"), "utf8");
async function bozuk(eski: string, yeni: string, ad: string): Promise<typeof import("../../src/modules/teklifler/yaklasan.ts")> {
  assert.ok(kaynak.includes(eski), "bozulacak yer bulunmalı");
  const yol = join(klasor, `${ad}.ts`);
  writeFileSync(yol, kaynak.replace(eski, yeni));
  return import(pathToFileURL(yol).href);
}
const BUGUN = "2026-11-09";
const e = (tesisId: string, sonraki: string) => ({ tesisId, turId: "t", sonraki });

test("üst sınır kalkınca uzak tarih listeye girer — kilit düşer", async () => {
  const m = await bozuk(" || e.sonraki > son", "", "ust");
  assert.deepEqual(m.yaklasanTesisler([e("uzak", "2027-08-01")], BUGUN).map((x) => x.tesisId), ["uzak"]);
});
test("alt sınır kalkınca eski tarih listeye girer — kilit düşer", async () => {
  const m = await bozuk(" || e.sonraki < bas", "", "alt");
  assert.deepEqual(m.yaklasanTesisler([e("eski", "2020-01-01")], BUGUN).map((x) => x.tesisId), ["eski"]);
});
test("açık plan elenmezse tesis listede kalır — kilit düşer", async () => {
  const m = await bozuk(".filter(([id]) => !planli.has(id))", "", "plan");
  assert.deepEqual(m.yaklasanTesisler([e("a", "2026-12-01")], BUGUN, new Set(["a"])).map((x) => x.tesisId), ["a"]);
});
test("gönderilmiş teklif de bekliyor sayılırsa balon inmez — kilit düşer", async () => {
  const m = await bozuk('d === null || d === "taslak" || d === "suresi"', "true", "bekliyor");
  assert.equal(m.teklifBekliyor("gonderildi"), true);
});
test("önizlemeyi elle yazan ekran yakalanır", () => {
  assert.deepEqual(onizlemeKacaklari([{ ad: "src/ornek.tsx", metin: '<div className="rb-onizleme">x</div>' }]), ["src/ornek.tsx"]);
});
