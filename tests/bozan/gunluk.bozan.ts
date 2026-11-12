/* OLUMSUZ KANIT — tests/gunluk.test.ts neyi koruyor (2026-11-12; pkproje.md §11 T7). Kaynak diskte DEĞİŞTİRİLMEZ: gunluk.ts bellekte bozulup geçici
   klasörden içe aktarılır. O zaman:
   1) "elle yazılan saat işaretlidir" kalkınca gerekçeyle yazılmış saat günlük çizelgede ölçülmüş gibi görünür;
   2) sıralama kalkınca kişinin günü saate göre dizilmez (13:30'daki kontrol 09:10'dakinden önce). */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";

const KAYNAK = "src/modules/raporlar/gunluk.ts";
const klasor = mkdtempSync(join(tmpdir(), "bozan-gunluk-"));
after(() => rmSync(klasor, { recursive: true, force: true }));
let sira = 0;
async function bozuk(eski: string, yeni: string): Promise<typeof import("../../src/modules/raporlar/gunluk.ts")> {
  const metin = readFileSync(KAYNAK, "utf8");
  assert.ok(metin.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const cevrilmis = metin.replace(eski, () => yeni).replace(/from "(\.{1,2}\/[^"]+)"/g, (_t, yol: string) => `from "${pathToFileURL(resolve(dirname(KAYNAK), yol)).href}"`);
  const hedef = join(klasor, `kopya-${sira++}.ts`);
  writeFileSync(hedef, cevrilmis);
  return import(pathToFileURL(hedef).href);
}
const GUN = "2026-11-12";
const k = (raporId: string, bas: string, bit: string, elle = false) => ({ kisiId: "p1", kisi: "Deniz Arı", raporId, raporNo: raporId, ekipman: raporId, tur: "Forklift",
  musteri: "Örnek Sanayi", bas: `${GUN}T${bas}`, bit: `${GUN}T${bit}`, elle, sapmalar: [] });

test("1) 'elle yazılan saat işaretlidir' kalkınca gerekçeyle yazılmış saat ölçülmüş gibi görünür", async () => {
  const m = await bozuk("dikkat: k.elle || k.sapmalar.length > 0", "dikkat: k.sapmalar.length > 0");
  assert.equal(m.gunlukCizelge([k("001", "09:10", "09:42", true)], GUN).kisiler[0]!.satirlar[0]!.dikkat, false, "bozuk: elle yazılan saat işaretsiz");
});

test("2) sıralama kalkınca kişinin günü saate göre dizilmez", async () => {
  const m = await bozuk("[...l].sort((a, b) => a.kisi.localeCompare(b.kisi, \"tr\") || a.bas.localeCompare(b.bas))", "l");
  assert.deepEqual(m.gunlukCizelge([k("007", "13:30", "14:02"), k("001", "09:10", "09:42")], GUN).kisiler[0]!.satirlar.map((s) => s.raporId), ["007", "001"], "bozuk: öğleden sonraki kontrol önce");
});
