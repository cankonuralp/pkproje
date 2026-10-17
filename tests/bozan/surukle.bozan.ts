/* OLUMSUZ KANIT — tests/surukle.test.ts neyi koruyor (İ6, 2026-10-17: sürükle-bırak). Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): dosya bellekte
   bozulup geçici klasörden içe aktarılır.
   1. Varılan yerin grubu denetlenmeseydi bir sonraki grubun başına bırakılan madde önceki grubun sonunda kalırdı.
   2. Her adım o anki sıradaki öğeyi değil ilk sıradakini taşısaydı satırlar karışırdı (her adımda başka bir satır kayardı). */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";
import { firmaSatirlari } from "../../src/format/duzen.ts";
import { SABLONLAR } from "../../src/format/sablonlar.ts";
import { FormatTanimi, type BolumOf } from "../../src/format/tanim.ts";

const klasor = mkdtempSync(join(tmpdir(), "surukle-bozan-"));
let sira = 0;
async function bozuk<M>(kaynak: string, eski: string, yeni: string): Promise<M> {
  const k = resolve(kaynak), metin = readFileSync(k, "utf8");
  assert.ok(metin.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const yol = join(klasor, `b-${sira++}.ts`);
  writeFileSync(yol, metin.replace(eski, () => yeni).replace(/from "(\.\.?\/[^"]+)"/g, (_, y: string) => `from "${pathToFileURL(resolve(dirname(k), y)).href}"`)
    .replace(/from "((?!node:|file:)[a-z@][^"]*)"/g, (_, y: string) => `from "${import.meta.resolve(y)}"`));
  return import(pathToFileURL(yol).href) as Promise<M>;
}
after(() => rmSync(klasor, { recursive: true, force: true }));
type Kurucu = typeof import("../../src/modules/rapor-format/kurucu.ts");
const KURUCU = "src/modules/rapor-format/kurucu.ts";

test("1: varılan yerin grubu denetlenmeyince sonraki grubun başına bırakılan madde önceki grubun sonunda kalır", async () => {
  const m = await bozuk<Kurucu>(KURUCU, "    if (l[a].g === l[x].g && a === (once ? x - 1 : x + 1)) return y;", "    if (a === (once ? x - 1 : x + 1)) return y;");
  const t = FormatTanimi.parse(SABLONLAR.ZPKR02.tanim), i = t.bolumler.findIndex((b) => b.blok === "liste" && b.gruplar.length > 2);
  const g = (y: FormatTanimi) => (y.bolumler[i] as BolumOf<"liste">).gruplar.map((x) => x.maddeler.map((z) => z.id));
  const g0 = g(t);
  const y = g(m.ogeyeTasi(t, i, g0[0][0], g0[1][0], true));
  assert.equal(y[0].includes(g0[0][0]), true, "bozuk: madde sonraki gruba geçti");
});

test("2: adımlar ilk sıradaki öğeyi taşıyınca firma satırları karışır", async () => {
  const m = await bozuk<Kurucu>(KURUCU, "  for (let p = a; p !== b; p += yon) { const o = y; y = adim(y, p, yon); if (y === o) break; }",
    "  for (let p = a; p !== b; p += yon) { const o = y; y = adim(y, a, yon); if (y === o) break; }");
  const t = FormatTanimi.parse(SABLONLAR.KOMPRESOR.tanim), kaynak = firmaSatirlari(t).map((s) => s.kaynak);
  const y = m.siraya(t, 4, 0, (x, p, yon) => m.firmaSatiriTasi(x, firmaSatirlari(x)[p].id, yon));
  assert.notDeepEqual(firmaSatirlari(y).map((s) => s.kaynak), [kaynak[4], ...kaynak.slice(0, 4), ...kaynak.slice(5)], "bozuk: doğru sıraya vardı");
});
