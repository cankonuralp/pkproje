/* OLUMSUZ KANIT — tests/hesap-yonetimi.test.ts neyi koruyor (kaynak diskte değiştirilmez; bellekte bozulur). (1) "son yönetici" denetimi kalkınca
   firma yöneticisi kendi rolünü bırakır, firma yönetimsiz kalır. (2) Ayrılan denetimi kalkınca ayrılana hesap açılır (ENGEL 8). K2 (2026-10-04). */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, before, test } from "node:test";
import type { GomuluKume } from "../../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz } from "../../src/server/db/kiraci.ts";
import { testKumesi } from "../yardimci/kume.ts";

type Modul = typeof import("../../src/server/kimlik/hesapYonetimi.ts");
const KOK = resolve("src/server/kimlik");
const KAYNAK = readFileSync(join(KOK, "hesapYonetimi.ts"), "utf8").replace(/from "(\.\.?\/[^"]+)"/g, (_, y) => `from "${pathToFileURL(resolve(KOK, y)).href}"`);
const klasor = mkdtempSync(join(tmpdir(), "hesap-bozan-"));
let sira = 0;
async function bozuk(eski: string, yeni: string): Promise<Modul> {
  assert.ok(KAYNAK.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const yol = join(klasor, `h-${sira++}.ts`);
  writeFileSync(yol, KAYNAK.split(eski).join(yeni));
  return import(pathToFileURL(yol).href);
}
let kume: GomuluKume, havuz: Havuz, A: string, yp: string, yid: string;
before(async () => {
  kume = await testKumesi();
  havuz = havuzKur(kume.uygulama);
  const s = kume.sahipIstemci(); await s.connect();
  try { A = (await s.query<{ id: string }>("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-a', 'Deneme A', 'DA') RETURNING id")).rows[0].id; } finally { await s.end(); }
  yp = (await kiraciIcinde(havuz, A, (db) => db.sorgu<{ id: string }>("INSERT INTO personel (ad, basla, meslek) VALUES ('Deneme Yönetici', '2024-01-01', 'mak-muh') RETURNING id::text"))).rows[0].id;
  yid = (await kiraciIcinde(havuz, A, (db) => db.sorgu<{ id: string }>("INSERT INTO hesap (eposta, ad, roller, durum, personel_id) VALUES ('y@deneme.example', 'Y', '{firma_yoneticisi}', 'etkin', $1) RETURNING id::text", [yp]))).rows[0].id;
});
after(async () => { await havuz?.end(); await kume?.durdur(); rmSync(klasor, { recursive: true, force: true }); });
const YON = () => ({ id: yid, ad: "Deneme Yönetici", roller: ["firma_yoneticisi" as const] });

test("son yönetici denetimi kalkınca firma yönetimsiz kalır", async () => {
  const m = await bozuk('!roller.includes("firma_yoneticisi") && !(await yoneticiKalir(db, p.hid))', "false");
  assert.equal((await kiraciIcinde(havuz, A, (db) => m.rolleriKaydet(db, YON(), yp, ["planlama"]))).durum, "tamam", "bozuk: son yönetici rolünü bıraktı");
});

test("ayrılan denetimi kalkınca ayrılana hesap açılır", async () => {
  const m = await bozuk('if (p.durum !== "etkin") return { durum: "red", neden: "Ayrılan personele hesap açılmaz." };', "");
  const a = (await kiraciIcinde(havuz, A, (db) => db.sorgu<{ id: string }>("INSERT INTO personel (ad, basla, meslek, durum, ayrildi) VALUES ('Deneme Ayrılan', '2024-01-01', 'mak-muh', 'ayrildi', '2025-01-01') RETURNING id::text"))).rows[0].id;
  const r = await kiraciIcinde(havuz, A, (db) => m.hesapAc(db, { id: yid, ad: "Y", roller: ["firma_yoneticisi"] }, a, { eposta: "a@deneme.example", roller: ["denetci"] }));
  assert.equal(r.durum, "tamam", "bozuk: ayrılana hesap açıldı");
});
