/* OLUMSUZ KANIT — tests/numara.test.ts neyi koruyor. Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): numara.ts bellekte bozulup geçici klasörden
   içe aktarılır; veritabanı bozması geçici kümede sahip bağlantısıyla. (1) Sayaç "oku sonra yaz" olunca aynı anda alınan numaralar çakışır.
   (2) İleri tetiği kalkınca sayaç geri alınır → verilmiş numara yeniden verilir. (3) Saat dilimi kalkınca ay sınırında yanlış ay. K1 (2026-10-04). */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { after, before, test } from "node:test";
import type { GomuluKume } from "../../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz } from "../../src/server/db/kiraci.ts";
import { testKumesi } from "../yardimci/kume.ts";

type Modul = typeof import("../../src/server/numara/numara.ts");
const KAYNAK = readFileSync("src/server/numara/numara.ts", "utf8");
const klasor = mkdtempSync(join(tmpdir(), "numara-bozan-"));
let say = 0;
async function bozuk(eski: string, yeni: string): Promise<Modul> {
  assert.ok(KAYNAK.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const yol = join(klasor, `numara-${say++}.ts`);
  writeFileSync(yol, KAYNAK.replace(eski, yeni));
  return import(pathToFileURL(yol).href);
}

let kume: GomuluKume;
let havuz: Havuz;
let A: string;
before(async () => {
  kume = await testKumesi();
  havuz = havuzKur(kume.uygulama);
  const s = kume.sahipIstemci(); await s.connect();
  try { A = (await s.query<{ id: string }>("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-a', 'Deneme A', 'DA') RETURNING id")).rows[0].id; }
  finally { await s.end(); }
});
after(async () => { await havuz?.end(); await kume?.durdur(); rmSync(klasor, { recursive: true, force: true }); });

test("sayaç 'oku sonra yaz' olunca aynı anda alınan numaralar çakışır", async () => {
  const m = await bozuk(
    `const r = await db.sorgu<{ son: number }>(
    \`INSERT INTO numara_sayaci (tur, donem, son) VALUES ($1, $2, 1)
     ON CONFLICT (firma_id, tur, donem) DO UPDATE SET son = numara_sayaci.son + 1 RETURNING son\`, [tur, donem]);
  return r.rows[0].son;`,
    `const n = ((await db.sorgu<{ son: number }>("SELECT son FROM numara_sayaci WHERE tur = $1 AND donem = $2", [tur, donem])).rows[0]?.son ?? 0) + 1;
  await new Promise((c) => setTimeout(c, 20));
  await db.sorgu("INSERT INTO numara_sayaci (tur, donem, son) VALUES ($1, $2, $3) ON CONFLICT (firma_id, tur, donem) DO UPDATE SET son = GREATEST(numara_sayaci.son + 1, EXCLUDED.son)", [tur, donem, n]);
  return n;`);
  const nolar = await Promise.all(Array.from({ length: 10 }, () => kiraciIcinde(havuz, A, (db) => m.numaraAl(db, "gider"))));
  assert.ok(new Set(nolar).size < nolar.length, "bozuk: çakışan numara verildi");
});

test("ileri tetiği kalkınca sayaç geri alınır, verilmiş numara yeniden verilir", async () => {
  const m = await import("../../src/server/numara/numara.ts");
  await kiraciIcinde(havuz, A, (db) => m.numaraAl(db, "izin"));
  const ikinci = await kiraciIcinde(havuz, A, (db) => m.numaraAl(db, "izin"));
  const s = kume.sahipIstemci(); await s.connect();
  try { await s.query("DROP TRIGGER numara_sayaci_ileri ON numara_sayaci"); } finally { await s.end(); }
  await kiraciIcinde(havuz, A, (db) => db.sorgu("UPDATE numara_sayaci SET son = 1 WHERE tur = 'izin'"));
  const tekrar = await kiraciIcinde(havuz, A, (db) => m.numaraAl(db, "izin"));
  assert.equal(tekrar, ikinci, "bozuk: aynı numara ikinci kez verildi");
});

test("saat dilimi kalkınca Türkiye'de 1 Ekim gece yarısından sonra açılan iş Eylül numarası alır", async () => {
  const m = await bozuk('timeZone: "Europe/Istanbul"', 'timeZone: "UTC"');
  assert.equal(m.aayy(new Date("2026-09-30T21:30:00Z")), "0926", "bozuk: yanlış ay");
});
