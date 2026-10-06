/* OLUMSUZ KANIT — tests/araclar.test.ts "342" testleri neyi koruyor. Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): araclar.ts bellekte bozulup
   geçici klasörden içe aktarılır (göreli içe aktarmalar mutlak yola çevrilir).
   1. Tutanak belgesinin taraf denetimi kalkınca araçla ilgisi olmayan sürücü başkasının teslim tutanağını (kilometre, hasar, kişiler) alır.
   2. İmzaya gönderme kalkınca araç kişiye teslim edilir ama tutanak teslim alanın imzasına gitmez (imzasız teslim kalır). */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, before, test } from "node:test";
import type { GomuluKume } from "../../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz } from "../../src/server/db/kiraci.ts";
import { klasorDepo } from "../../src/server/dosya/depo.ts";
import { testKumesi } from "../yardimci/kume.ts";

type Modul = typeof import("../../src/modules/araclar/server/araclar.ts");
const KOK = resolve("src/modules/araclar/server");
const KAYNAK = readFileSync(join(KOK, "araclar.ts"), "utf8").replace(/from "(\.\.?\/[^"]+)"/g, (_, y) => `from "${pathToFileURL(resolve(KOK, y)).href}"`);
const klasor = mkdtempSync(join(tmpdir(), "arac-tutanak-bozan-"));
let sira = 0;
async function bozuk(eski: string, yeni: string): Promise<Modul> {
  assert.ok(KAYNAK.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const yol = join(klasor, `t${++sira}.ts`);
  writeFileSync(yol, KAYNAK.replace(eski, () => yeni));
  return import(pathToFileURL(yol).href);
}
const PDF = new TextEncoder().encode("%PDF-1.4\n1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n"
  + "3 0 obj << /Type /Page /Parent 2 0 R /Contents 4 0 R /Resources << >> >> endobj\n4 0 obj << /Length 19 >> stream\nBT (Tutanak) Tj ET\nendstream\nendobj\n"
  + "trailer << /Root 1 0 R >>\n%%EOF\n");

let kume: GomuluKume, havuz: Havuz, A: string, yon: string, ikinci: string, arac: string, pDen: string, pIki: string, hareket: string;
before(async () => {
  kume = await testKumesi(); havuz = havuzKur(kume.uygulama);
  const s = kume.sahipIstemci(); await s.connect();
  try {
    await s.query("SET session_replication_role = replica");
    A = (await s.query<{ id: string }>("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-a', 'Deneme A', 'DA') RETURNING id::text")).rows[0].id;
    pDen = (await s.query<{ id: string }>("INSERT INTO personel (firma_id, ad, basla, meslek) VALUES ($1, 'Deneme Denetçi', '2024-01-01', 'mak-muh') RETURNING id::text", [A])).rows[0].id;
    pIki = (await s.query<{ id: string }>("INSERT INTO personel (firma_id, ad, basla, meslek) VALUES ($1, 'Deneme İkinci', '2024-01-01', 'mak-muh') RETURNING id::text", [A])).rows[0].id;
    yon = (await s.query<{ id: string }>("INSERT INTO hesap (firma_id, eposta, ad, roller, durum) VALUES ($1, 'yon@deneme-a.example', 'Deneme', '{firma_yoneticisi}', 'etkin') RETURNING id::text", [A])).rows[0].id;
    ikinci = (await s.query<{ id: string }>("INSERT INTO hesap (firma_id, eposta, ad, roller, durum, personel_id) VALUES ($1, 'iki@deneme-a.example', 'Deneme', '{denetci}', 'etkin', $2) RETURNING id::text", [A, pIki])).rows[0].id;
    arac = (await s.query<{ id: string }>("INSERT INTO arac (firma_id, plaka, tur, marka, model, yil, yakit) VALUES ($1, '00 DNM 001', 'Kamyon', 'D', 'M', 2020, 'dizel') RETURNING id::text", [A])).rows[0].id;
    hareket = (await s.query<{ id: string }>("INSERT INTO zimmet_hareket (firma_id, arac_id, alan_personel, zaman, km) VALUES ($1, $2, $3, now() - interval '3 days', 1000) RETURNING id::text", [A, arac, pDen])).rows[0].id;
    await s.query("INSERT INTO arac_tutanagi (firma_id, hareket_id, no, yakit) VALUES ($1, $2, 'AT-0101-900', 'dolu')", [A, hareket]);
  } finally { await s.end(); }
});
after(async () => { await havuz?.end(); await kume?.durdur(); rmSync(klasor, { recursive: true, force: true }); });

test("1. taraf denetimi kalkınca taraf olmayan sürücü başkasının teslim tutanağını alır (kilidin koruduğu açık)", async () => {
  const m = await bozuk("  if (!x || !x.no || (k !== null && x.eden !== k && x.alan !== k)) return null;\n", "  if (!x || !x.no) return null;\n");
  const IKINCI = { id: ikinci, ad: "Deneme", roller: ["denetci" as const] };
  const v = await kiraciIcinde(havuz, A, (db) => m.tutanakBelgesiVerisi(db, IKINCI, hareket), { hesapId: ikinci });
  assert.equal(v?.no, "AT-0101-900", "bozuk: taraf olmayan sürücü tutanağı aldı");
});

test("2. imzaya gönderme kalkınca kişiye teslim edilen aracın tutanağı teslim alanın imzasına gitmez (kilidin koruduğu açık)", async () => {
  const m = await bozuk("  if (v.alan !== \"depo\") {\n    if (!uret)", "  if (v.alan === \"__hic__\") {\n    if (!uret)");
  const YON = { id: yon, ad: "Deneme", roller: ["firma_yoneticisi" as const] };
  const dun = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  const r = await kiraciIcinde(havuz, A, (db) => m.tutanakKaydet(db, klasorDepo(klasor), YON, A,
    { arac, alan: pIki, zaman: `${dun}T12:00`, km: "1.200", yakit: "yarim", kontrol: [], hasar: "" }, [], async () => PDF), { hesapId: yon });
  assert.equal(r.durum, "tamam", JSON.stringify(r));
  const n = (await kiraciIcinde(havuz, A, (db) => db.sorgu<{ n: number }>("SELECT count(*)::int AS n FROM belge_onay WHERE personel_id = $1", [pIki]))).rows[0].n;
  assert.equal(n, 0, "bozuk: tutanak imzaya gitmedi");
});
