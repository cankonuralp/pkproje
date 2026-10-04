/* OLUMSUZ KANIT — tests/yazici.test.ts neyi koruyor. Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): yazici.ts bellekte bozulup geçici klasörden
   içe aktarılır; veritabanı bozmaları geçici test kümesinde sahip bağlantısıyla yapılır. Her bozma, kilidin kapattığı açığı geri açar. K1 (2026-10-04). */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, before, test } from "node:test";
import type { GomuluKume } from "../../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz } from "../../src/server/db/kiraci.ts";
import { testKumesi } from "../yardimci/kume.ts";

type Modul = typeof import("../../src/server/db/yazici.ts");
const KAYNAK = readFileSync("src/server/db/yazici.ts", "utf8").replace('from "./kiraci.ts"', `from "${pathToFileURL(resolve("src/server/db/kiraci.ts")).href}"`);
const klasor = mkdtempSync(join(tmpdir(), "yazici-bozan-"));
let sira = 0;
async function bozuk(...degisim: [string, string][]): Promise<Modul> {
  let k = KAYNAK;
  for (const [eski, yeni] of degisim) { assert.ok(k.includes(eski), `bozulacak satır kaynakta yok: ${eski}`); k = k.replace(eski, yeni); }
  const yol = join(klasor, `yazici-${sira++}.ts`);
  writeFileSync(yol, k);
  return import(pathToFileURL(yol).href);
}

let kume: GomuluKume;
let havuz: Havuz;
let A: string;
const IZ = { kim: "Deneme", ne: "deneme" };
before(async () => {
  kume = await testKumesi();
  havuz = havuzKur(kume.uygulama);
  const s = kume.sahipIstemci(); await s.connect();
  try { A = (await s.query<{ id: string }>("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-a', 'Deneme A', 'DA') RETURNING id")).rows[0].id; }
  finally { await s.end(); }
});
after(async () => { await havuz?.end(); await kume?.durdur(); rmSync(klasor, { recursive: true, force: true }); });

async function kisi(m: Modul, eposta: string) {
  const T = m.tablo({ ad: "hesap", sutunlar: ["eposta", "ad", "roller", "durum", "parola_ozeti"], gizli: ["parola_ozeti"] });
  const { id } = await kiraciIcinde(havuz, A, (db) => m.ekle(db, T, { eposta, ad: "Deneme", roller: ["denetci"], durum: "etkin" }, IZ));
  return { T, id };
}
async function sahipKos(sql: string) {
  const s = kume.sahipIstemci(); await s.connect();
  try { await s.query(sql); } finally { await s.end(); }
}

test("sürüm denetimleri kalkınca eski sürümle yazma sessizce ezer", async () => {
  const m = await bozuk(["if (satir.surum !== surum) return", "if (false) return"], [" WHERE id = $1 AND surum = $2 RETURNING", " WHERE id = $1 AND $2::int IS NOT NULL RETURNING"]);
  const { T, id } = await kisi(m, "surum@deneme.example");
  await kiraciIcinde(havuz, A, (db) => m.guncelle(db, T, id, 0, { ad: "Birinci" }, IZ));
  const r = await kiraciIcinde(havuz, A, (db) => m.guncelle(db, T, id, 0, { ad: "Ezen" }, IZ));
  assert.equal(r.durum, "tamam", "bozuk: eski sürüm geçti");
});

test("sütun listesi denetimi kalkınca giriş kilidi sayacı formdan sıfırlanır", async () => {
  const m = await bozuk(["|| !(t.sutunlar as readonly string[]).includes(k))", ")"]);
  const { T, id } = await kisi(m, "sutun@deneme.example");
  const r = await kiraciIcinde(havuz, A, (db) => m.guncelle(db, T, id, 0, { hatali_deneme: 0, ad: "x" } as never, IZ));
  assert.equal(r.durum, "tamam", "bozuk: tanım dışı sütun yazıldı");
});

test("gizleme kalkınca parola özeti denetim izine düşer", async () => {
  const m = await bozuk(['(t.gizli as readonly string[]).includes(s) ? "gizli" :', ""]);
  const { T, id } = await kisi(m, "gizli@deneme.example");
  await kiraciIcinde(havuz, A, (db) => m.guncelle(db, T, id, 0, { parola_ozeti: "scrypt$1$1$1$a$b" }, IZ));
  const r = await kiraciIcinde(havuz, A, (db) => db.sorgu<{ yeni: unknown }>("SELECT yeni FROM denetim_izi WHERE nesne_id = $1 ORDER BY id DESC LIMIT 1", [id]));
  assert.match(JSON.stringify(r.rows[0].yeni), /scrypt/, "bozuk: özet ize yazıldı");
});

test("damga tetiği kalkınca kod başka hesabı ve geçmiş tarihi ize yazar", async () => {
  await sahipKos("DROP TRIGGER denetim_izi_damga ON denetim_izi");
  await kiraciIcinde(havuz, A, (db) => db.sorgu(
    "INSERT INTO denetim_izi (kim, ne, nesne_id, hesap_id, zaman) VALUES ('x', 'uydurma', 'u-1', '00000000-0000-4000-8000-000000000000', '2020-01-01')"));
  const r = await kiraciIcinde(havuz, A, (db) => db.sorgu<{ hesap_id: string; zaman: Date }>("SELECT hesap_id::text, zaman FROM denetim_izi WHERE nesne_id = 'u-1'"));
  assert.equal(r.rows[0].hesap_id, "00000000-0000-4000-8000-000000000000", "bozuk: uydurma hesap kaldı");
});

test("değişmez tetiği kalkınca tablo sahibi izi siler", async () => {
  await sahipKos("DROP TRIGGER denetim_izi_degismez ON denetim_izi");
  await sahipKos("DELETE FROM denetim_izi");
  const r = await kiraciIcinde(havuz, A, (db) => db.sorgu("SELECT 1 FROM denetim_izi"));
  assert.equal(r.rowCount, 0, "bozuk: iz silindi");
});
