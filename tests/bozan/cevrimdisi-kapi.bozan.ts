/* OLUMSUZ KANIT — tests/cevrimdisi-kapi.test.ts neyi koruyor (2026-10-26). Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): planlar/sema.ts bellekte
   bozulup geçici klasörden içe aktarılır.
   1. Cihazda bekleyen kabul hesaba katılmazsa bağlantısız kabulden sonra rapor açılmaz (2026-10-26'da düzeltilen hata geri gelir).
   2. Plan günü denetimi kalkarsa ileri tarihli plana cihazda rapor açılır (ENGEL 1). */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";

type Sema = typeof import("../../src/modules/planlar/sema.ts");
const KAYNAK = "src/modules/planlar/sema.ts";
const gecici = mkdtempSync(join(tmpdir(), "cevrimdisi-kapi-bozan-"));
let sira = 0;
async function bozuk(eski: string, yeni: string): Promise<Sema> {
  const metin = readFileSync(KAYNAK, "utf8");
  assert.ok(metin.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const yol = join(gecici, `sema-${++sira}.ts`);
  writeFileSync(yol, metin.replace(eski, () => yeni).replace(/from "(\.{1,2}\/[^"]+)"/g, (_t, y: string) => `from "${pathToFileURL(resolve(dirname(KAYNAK), y)).href}"`));
  return import(pathToFileURL(yol).href) as Promise<Sema>;
}
after(() => rmSync(gecici, { recursive: true, force: true }));

test("1. bekleyen kabul hesaba katılmazsa bağlantısız kabulden sonra rapor açılmaz (kilidin koruduğu açık)", async () => {
  const m = await bozuk(` || (p.durum === "bekliyor" && kabulBekliyor)`, "");
  assert.equal(m.raporKapisi({ durum: "bekliyor", baslangic: "2026-10-27" }, "2026-10-27", true), m.KABULSUZ_RAPOR,
    "bozuk: cihazda kabul bekliyor ama rapor açılmıyor — testin null beklentisi düşer");
});

test("2. plan günü denetimi kalkarsa ileri tarihli plana rapor açılır (kilidin koruduğu açık)", async () => {
  const m = await bozuk("return p.baslangic > bugun ? erkenRapor(p.baslangic, bugun) : null;", "return null;");
  assert.equal(m.raporKapisi({ durum: "kabul", baslangic: "2026-10-27" }, "2026-10-26"), null, "bozuk: ileri tarihli plana rapor açılıyor");
});
