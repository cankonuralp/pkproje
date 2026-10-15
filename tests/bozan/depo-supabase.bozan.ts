/* OLUMSUZ KANIT — tests/depo-supabase.test.ts (568, Supabase Storage deposu) neyi koruyor. Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): supabase.ts
   bellekte bozulup geçici klasörden içe aktarılır; Storage yerine yerel taklit (tests/yardimci/sahte-depo.ts), veritabanı yerine sorguyu kaydeden
   sahte bağlantı. O zaman:
   1. "x-upsert" açılırsa aynı anahtara ikinci yazma içeriği DEĞİŞTİRİR (yazılan değişmez kuralı — imzalı raporun PDF'i sessizce değişebilirdi);
   2. yedekten okuma kalkarsa henüz taşınmamış eski dosyalar (veritabanı deposunda) açılmaz;
   3. taşımada özet geri okunan içerikten değil gönderilenden hesaplanırsa BOZUK yükleme de "tutar" — veritabanındaki tek sağlam kopya silinirdi. */
import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, before, test } from "node:test";
import type { Depo } from "../../src/server/dosya/depo.ts";
import { sahteDepoKur, type SahteDepo } from "../yardimci/sahte-depo.ts";

const klasor = mkdtempSync(join(tmpdir(), "depo-supabase-bozan-"));
let s: SahteDepo;
before(async () => { s = await sahteDepoKur(); });
after(async () => { rmSync(klasor, { recursive: true, force: true }); await s?.kapat(); });

const kaynak = (yol: string) => readFileSync(resolve(yol), "utf8")
  .replace(/from "(\.\.?\/[^"]+)"/g, (_, y: string) => `from "${pathToFileURL(resolve(resolve(yol, ".."), y)).href}"`);
let sira = 0;
type Supabase = typeof import("../../src/server/dosya/supabase.ts");
async function bozuk(eski: string, yeni: string): Promise<Supabase> {
  const k = kaynak("src/server/dosya/supabase.ts");
  assert.ok(k.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const y = join(klasor, `m-${sira++}.ts`);
  writeFileSync(y, k.replace(eski, () => yeni));
  return import(pathToFileURL(y).href) as Promise<Supabase>;
}
const A = "00000000-0000-4000-8000-00000000000a";
const anahtar = () => `firma/${A}/deneme/${randomUUID()}/${randomUUID()}`;
const ayar = () => ({ url: s.url, gizli: s.gizli, kova: "probata" });
const bayt = (x: string) => new TextEncoder().encode(x);

test("1. x-upsert açılınca ikinci yazma içeriği değiştirir (kilidin koruduğu açık)", async () => {
  const m = await bozuk('"x-upsert": "false"', '"x-upsert": "true"');
  const d = m.supabaseDepo(ayar(), null), k = anahtar();
  await d.yaz(k, bayt("ilk"), undefined, "text/plain");
  await d.yaz(k, bayt("ikinci"), undefined, "text/plain");
  assert.equal(new TextDecoder().decode(await d.oku(k)), "ikinci", "bozuk: yazılan değişti");
});

test("2. yedekten okuma kalkınca taşınmamış eski dosya açılmaz (kilidin koruduğu açık)", async () => {
  const m = await bozuk("      if (yedek) return yedek.oku(anahtar, db);\n", "");
  const k = anahtar();
  const yedek: Depo = { yaz: async () => {}, oku: async () => bayt("eski"), copSil: async () => {}, oksuzSay: async () => null };
  await assert.rejects(m.supabaseDepo(ayar(), yedek).oku(k), /Depoda böyle bir nesne yok/, "bozuk: yedek okunmadı");
});

test("3. özet gönderilenden hesaplanırsa bozuk yükleme 'tutar' — sağlam kopya silinirdi (kilidin koruduğu açık)", async () => {
  const m = await bozuk('const ozet = geri ? createHash("sha256").update(geri).digest("hex") : "";',
    'const ozet = createHash("sha256").update(n.bayt).digest("hex"); void geri;');
  const k = anahtar(), icerik = Buffer.from("sağlam");
  const gonderilen: string[] = [];
  const db = { sorgu: async (sql: string, p: unknown[] = []) => {
    if (sql.includes("octet_length")) return { rows: [{ anahtar: k, boyut: icerik.length }] };
    if (sql.includes("SELECT n.bayt")) return { rows: [{ bayt: icerik, tur: "text/plain" }] };
    if (sql.includes("depo_nesne_tasindi")) { gonderilen.push(String(p[1])); return { rows: [{ t: p[1] === createHash("sha256").update(icerik).digest("hex") }] }; }
    return { rows: [] };
  } };
  s.bozukYukle = true;
  const r = await m.supabaseDepo(ayar(), null).tasi(db as never, { adet: 10, bayt: 1_000_000 });
  assert.deepEqual([r.tasinan, r.hatali], [1, 0], "bozuk: bozuk yükleme taşındı sayıldı (veritabanındaki kopya silinirdi)");
  assert.equal(gonderilen[0], createHash("sha256").update(icerik).digest("hex"));
});
