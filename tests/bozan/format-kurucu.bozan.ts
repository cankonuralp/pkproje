/* OLUMSUZ KANIT — tests/format-kurucu.test.ts neyi koruyor (K4 Format kurucu). Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): kurucu.ts bellekte
   bozulup geçici klasörden içe aktarılır (göreli içe aktarmalar mutlak yola çevrilir).
   1. Yeni kimlik var olanlara bakmadan verilince iki bölüm aynı kimliği alır — cevaplar karışır, tanım şemadan geçmez.
   2. Kilit denetimi kalkınca Bakanlık bölümü kurucudan silinir. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";
import { FormatTanimi } from "../../src/format/tanim.ts";
import { SABLONLAR } from "../../src/format/sablonlar.ts";

type Modul = typeof import("../../src/modules/rapor-format/kurucu.ts");
const KOK = resolve("src/modules/rapor-format");
const KAYNAK = readFileSync(join(KOK, "kurucu.ts"), "utf8").replace(/from "(\.\.?\/[^"]+)"/g, (_, y) => `from "${pathToFileURL(resolve(KOK, y)).href}"`);
const klasor = mkdtempSync(join(tmpdir(), "format-kurucu-bozan-"));
let sira = 0;
async function bozuk(eski: string, yeni: string): Promise<Modul> {
  assert.ok(KAYNAK.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const yol = join(klasor, `k-${sira++}.ts`);
  writeFileSync(yol, KAYNAK.replace(eski, () => yeni));
  return import(pathToFileURL(yol).href);
}
after(() => rmSync(klasor, { recursive: true, force: true }));

test("yeni kimlik var olanlara bakmadan verilince iki bölüm aynı kimliği alır (kilidin koruduğu açık)", async () => {
  const m = await bozuk("  while (var_.has(`k_${onek}${n}`) || ek.has(`k_${onek}${n}`)) n++;\n", "");
  let t = structuredClone(SABLONLAR.ZPKR02.tanim);
  t = { ...t, bolumler: [...t.bolumler, m.yeniBolum(t, "not", "Bir")] };
  t = { ...t, bolumler: [...t.bolumler, m.yeniBolum(t, "not", "İki")] };
  assert.equal(FormatTanimi.safeParse(t).success, false, "bozuk: aynı kimlik iki bölümde");
});

test("kilit denetimi kalkınca Bakanlık bölümü kurucudan silinir", async () => {
  const m = await bozuk("(t.bolumler[i]?.kilit ? t : { ...t, bolumler: t.bolumler.filter((_, j) => j !== i) })", "({ ...t, bolumler: t.bolumler.filter((_, j) => j !== i) })");
  const t = structuredClone(SABLONLAR.ZPKR02.tanim), k = t.bolumler.findIndex((b) => b.kilit);
  assert.equal(m.bolumSil(t, k).bolumler.length, t.bolumler.length - 1, "bozuk: kilitli bölüm silindi");
});
