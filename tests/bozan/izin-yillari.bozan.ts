/* OLUMSUZ KANIT — tests/talep-sema.test.ts "izin yılları" neyi koruyor (2026-11-12; reisim: "patron geçmişteki aldığı izinleri … görsün. onun hesabını o
   yapsın"). Kaynak diskte DEĞİŞTİRİLMEZ: sema.ts bellekte bozulup geçici klasörden içe aktarılır. O zaman:
   1) "yalnız onaylanan sayılır" kalkınca reddedilen ve onay bekleyen izin de kullanılmış görünür — patron yanlış hesap yapar;
   2) "izin başlangıç yılına sayılır" bozulunca bütün yıllar tek satıra toplanır. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";

const KAYNAK = "src/modules/talepler/sema.ts";
const klasor = mkdtempSync(join(tmpdir(), "bozan-izin-yillari-"));
after(() => rmSync(klasor, { recursive: true, force: true }));
let sira = 0;
async function bozuk(eski: string, yeni: string): Promise<typeof import("../../src/modules/talepler/sema.ts")> {
  const metin = readFileSync(KAYNAK, "utf8");
  assert.ok(metin.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const cevrilmis = metin.replace(eski, () => yeni).replace(/from "(\.{1,2}\/[^"]+)"/g, (_t, yol: string) => `from "${pathToFileURL(resolve(dirname(KAYNAK), yol)).href}"`);
  const hedef = join(klasor, `kopya-${sira++}.ts`);
  writeFileSync(hedef, cevrilmis);
  return import(pathToFileURL(hedef).href);
}
const L = [
  { tur: "yillik", bas: "2026-03-02", gun: 5, durum: "onaylandi" }, { tur: "yillik", bas: "2026-10-01", gun: 3, durum: "red" },
  { tur: "yillik", bas: "2026-09-01", gun: 7, durum: "bekliyor" }, { tur: "yillik", bas: "2025-06-02", gun: 4, durum: "onaylandi" },
] as const;

test("1) 'yalnız onaylanan' kalkınca reddedilen ve bekleyen izin de kullanılmış sayılır", async () => {
  const m = await bozuk('    if (x.durum !== "onaylandi") continue;\n', "");
  assert.equal(m.izinYillari(L).find((y) => y.yil === "2026")!.yillik, 15, "bozuk: 5 yerine 15 gün");
});

test("2) 'başlangıç yılına sayılır' bozulunca yıllar tek satıra toplanır", async () => {
  const m = await bozuk("const yil = x.bas.slice(0, 4);", 'const yil = "hep";');
  assert.deepEqual(m.izinYillari(L).map((y) => [y.yil, y.yillik]), [["hep", 9]], "bozuk: tek satır");
});
