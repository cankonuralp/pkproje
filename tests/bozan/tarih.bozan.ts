/* OLUMSUZ KANIT — tarih kilidi (tests/tarih.test.ts) gerçekten yakalıyor mu. Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): tarih.ts bellekte
   bozulur, geçici klasörden içe aktarılır; bozuk sürüm kilidin denetlediği davranışı kaybetmeli. K0 (2026-10-03). */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";

const KAYNAK = readFileSync("src/components/secim/tarih.ts", "utf8");
const klasor = mkdtempSync(join(tmpdir(), "tarih-bozan-"));
after(() => rmSync(klasor, { recursive: true, force: true }));

type Modul = typeof import("../../src/components/secim/tarih.ts");
let sira = 0;
async function bozuk(eski: string, yeni: string): Promise<Modul> {
  assert.ok(KAYNAK.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const yol = join(klasor, `tarih-${sira++}.ts`);
  writeFileSync(yol, KAYNAK.replace(eski, yeni));
  return import(pathToFileURL(yol).href);
}

test("takvimde olmayan gün: gün denetimi kalkınca 31.02 kabul edilir", async () => {
  const m = await bozuk("if (d.getUTCFullYear() !== y || d.getUTCMonth() !== a - 1 || d.getUTCDate() !== g) return null;", "");
  assert.notEqual(m.tarihOku("31.02.2026"), null);
});

test("pazartesi başlangıcı: kaydırma kalkınca takvim pazar başlar", async () => {
  const m = await bozuk("const bosluk = (new Date(Date.UTC(y, m, 1)).getUTCDay() + 6) % 7;", "const bosluk = new Date(Date.UTC(y, m, 1)).getUTCDay();");
  assert.notEqual(m.ayGunleri("2026-10").bosluk, 3);
});
