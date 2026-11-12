/* OLUMSUZ KANIT — tests/foto-kanit.test.ts neyi koruyor (2026-11-12; pkproje.md §11 K5). Kaynak diskte DEĞİŞTİRİLMEZ: foto-kanit.ts bellekte bozulup
   geçici klasörden içe aktarılır. O zaman:
   1) "yalnız ölçümlü raporda" kalkınca TÜRKAK'sız firmanın denetçisinin konumu da saklanır (karar: konum yalnız TÜRKAK'lıda);
   2) "dosyadaki saat önce" kalkınca cihazın gönderdiği saat dosyanın kendi saatini ezer (çekim anı istenen saate çekilebilirdi). */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";

const KAYNAK = "src/modules/raporlar/foto-kanit.ts";
const klasor = mkdtempSync(join(tmpdir(), "bozan-foto-kanit-"));
after(() => rmSync(klasor, { recursive: true, force: true }));
let sira = 0;
async function bozuk(eski: string, yeni: string): Promise<typeof import("../../src/modules/raporlar/foto-kanit.ts")> {
  const metin = readFileSync(KAYNAK, "utf8");
  assert.ok(metin.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const cevrilmis = metin.replace(eski, () => yeni).replace(/from "(\.{1,2}\/[^"]+)"/g, (_t, yol: string) => `from "${pathToFileURL(resolve(dirname(KAYNAK), yol)).href}"`);
  const hedef = join(klasor, `kopya-${sira++}.ts`);
  writeFileSync(hedef, cevrilmis);
  return import(pathToFileURL(hedef).href);
}
const SIMDI = new Date("2026-11-12T10:41:07.000Z");

test("1) 'yalnız ölçümlü raporda' kalkınca ölçümsüz raporda da konum saklanır", async () => {
  const m = await bozuk("  if (!olcumlu) return kanit;\n", "");
  assert.deepEqual(m.fotoKaniti(null, { konum: { e: 39.9, b: 32.8 } }, false, SIMDI).konum, { e: 39.9, b: 32.8, d: null }, "bozuk: TÜRKAK'sız raporda konum saklandı");
});

test("2) 'dosyadaki saat önce' kalkınca cihazın gönderdiği saat dosyanın saatini ezer", async () => {
  const m = await bozuk("const cekim = exif && CEKIM.test(exif) ? exif : parca(z.string().regex(CEKIM), g.cekim);", "const cekim = parca(z.string().regex(CEKIM), g.cekim) ?? exif;");
  assert.equal(m.fotoKaniti("2026-11-12 13:33", { cekim: "2026-11-12 09:00" }, false, SIMDI).cekim, "2026-11-12 09:00", "bozuk: dosyadaki 13:33 yerine gönderilen 09:00");
});
