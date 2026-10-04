/* OLUMSUZ KANIT — tests/ayar.test.ts neyi koruyor. Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): sir.ts / ayar.ts bellekte bozulup geçici klasörden
   içe aktarılır. (1) Ek doğrulama verisi (firma + ad) kalkınca bir firmanın şifreli sırrı öteki firmada çözülür. (2) Şema denetimi kalkınca saklama
   süresi 5 yılın altına yazılır (ENGEL 11). K1 (2026-10-04). */
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";

const klasor = mkdtempSync(join(tmpdir(), "ayar-bozan-"));
after(() => rmSync(klasor, { recursive: true, force: true }));
const mutlak = (y: string) => pathToFileURL(resolve(y)).href;
let sira = 0;
async function bozuk<T>(dosya: string, ...degisim: [string, string][]): Promise<T> {
  let k = readFileSync(dosya, "utf8");
  for (const [eski, yeni] of degisim) { assert.ok(k.includes(eski), `bozulacak satır kaynakta yok: ${eski}`); k = k.split(eski).join(yeni); }
  k = k.replace(/from "\.\.\/db\/([\w.]+)"/g, (_, a) => `from "${mutlak(`src/server/db/${a}`)}"`).replace(/from "\.\.\/\.\.\/sema\/([\w.]+)"/g, (_, a) => `from "${mutlak(`src/sema/${a}`)}"`);
  const yol = join(klasor, `${sira++}-${dosya.split("/").pop()}`);
  writeFileSync(yol, k);
  return import(pathToFileURL(yol).href);
}

test("ek doğrulama verisi kalkınca firma A'nın şifreli sırrı firma B'nin kimliğiyle çözülür", async () => {
  const m = await bozuk<typeof import("../../src/server/ayar/sir.ts")>("src/server/ayar/sir.ts", ["c.setAAD(ek(firmaId, ad));", ""], ["d.setAAD(ek(firmaId, ad));", ""]);
  const anahtar = randomBytes(32);
  const s = m.sifrele("gizli-deger", "00000000-0000-4000-8000-00000000000a", "yapay_zeka_anahtari", anahtar);
  assert.equal(m.coz(s, "00000000-0000-4000-8000-00000000000b", "bulut_erisimi", anahtar), "gizli-deger", "bozuk: başka firmada çözüldü");
});

test("şema denetimi kalkınca saklama süresi 2 yıl yazılır", async () => {
  const m = await bozuk<typeof import("../../src/server/ayar/ayar.ts")>("src/server/ayar/ayar.ts",
    ["const s = AYAR_BOLUMLERI[b].safeParse(yeni);", "const s = { success: true as const, data: yeni as never, error: undefined as never };"]);
  const yazilan: unknown[] = [];
  const db = { sorgu: async (metin: string, d?: readonly unknown[]) => {
    if (metin.startsWith("SELECT id::text, deger")) return { rows: [] };
    if (metin.startsWith("INSERT INTO firma_ayar")) { yazilan.push(d); return { rows: [{ id: "00000000-0000-4000-8000-000000000001", surum: 0 }] }; }
    return { rows: [] };
  } } as never;
  const r = await m.ayarYaz(db, "saklama", -1, { yil: 2 }, { kim: "x", ne: "x" });
  assert.equal(r.durum, "tamam", "bozuk: 2 yıl kabul edildi");
  assert.ok(JSON.stringify(yazilan).includes('"yil":2'));
});
