/* OLUMSUZ KANIT — tests/gecmis.test.ts (493) neyi koruyor. Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): dosya bellekte bozulup geçici klasörden içe
   aktarılır.
   · Yeni değişiklikte ileri yığını boşalmasaydı geri aldıktan sonra yapılan değişikliğin üstüne eski adım "yinelenir" — yeni iş sessizce kaybolur.
   · Kısayol yazı alanında da çalışsaydı yazarken Ctrl+Z bütün taslağı geri alır, alanın kendi geri alması çalışmazdı. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";

const gecici = mkdtempSync(join(tmpdir(), "gecmis-bozan-"));
after(() => rmSync(gecici, { recursive: true, force: true }));
type Gecmis = typeof import("../../src/modules/rapor-format/gecmis.ts");

async function bozuk(ad: string, eski: string, yeni: string): Promise<Gecmis> {
  let s = readFileSync(resolve("src/modules/rapor-format/gecmis.ts"), "utf8");
  assert.ok(s.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  s = s.replace(eski, () => yeni);
  const yol = join(gecici, `${ad}.ts`);
  writeFileSync(yol, s);
  return import(pathToFileURL(yol).href) as Promise<Gecmis>;
}

test("1. yeni değişiklikte ileri yığını boşalmayınca eski adım yeni işin üstüne yinelenir (kilidin koruduğu açık)", async () => {
  const m = await bozuk("ileri", "return { geri: [...g.geri, simdi].slice(-GECMIS_EN_COK), ileri: [] };", "return { geri: [...g.geri, simdi].slice(-GECMIS_EN_COK), ileri: g.ileri };");
  let g = m.adimEkle(m.adimEkle(m.bosGecmis<string>(), "a"), "b");
  const x = m.geriAl(g, "c")!;
  g = m.adimEkle(x.gecmis, x.deger);
  assert.equal(m.yinele(g, "d")?.deger, "c", "bozuk: yeni işin (d) yerine eski adım (c) geldi");
});

test("2. kısayol yazı alanında da çalışınca yazarken Ctrl+Z taslağı geri alır (kilidin koruduğu açık)", async () => {
  const m = await bozuk("yazi", "if (e.hedefYazi || e.altKey || !(e.ctrlKey || e.metaKey)) return null;", "if (e.altKey || !(e.ctrlKey || e.metaKey)) return null;");
  assert.equal(m.kisayol({ key: "z", ctrlKey: true, metaKey: false, shiftKey: false, altKey: false, hedefYazi: true }), "geri");
});
