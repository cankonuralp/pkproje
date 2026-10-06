/* OLUMSUZ KANIT — tests/anasayfa.test.ts "yan menü balonları" neyi koruyor (339). Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): takip.ts bellekte
   bozulup geçici klasörden içe aktarılır (göreli içe aktarmalar mutlak yola çevrilir).
   1. "Kişinin kendi işi" süzgeci kalkınca (337–339 incelemesi, U4: planı atanan kabul eder) planlamacı ekibinde olmadığı, kabul edemeyeceği planı
      balonda sayar. (339'daki ilk hâli: Planlar düzeyi süzgeci — artık balon her düzeyde ekiple sınırlı.) */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, before, test } from "node:test";
import type { GomuluKume } from "../../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz } from "../../src/server/db/kiraci.ts";
import { testKumesi } from "../yardimci/kume.ts";

type Modul = typeof import("../../src/modules/anasayfa/server/takip.ts");
const KOK = resolve("src/modules/anasayfa/server");
const KAYNAK = readFileSync(join(KOK, "takip.ts"), "utf8").replace(/from "(\.\.?\/[^"]+)"/g, (_, y) => `from "${pathToFileURL(resolve(KOK, y)).href}"`);
const klasor = mkdtempSync(join(tmpdir(), "menu-takip-bozan-"));
async function bozuk(eski: string, yeni: string): Promise<Modul> {
  assert.ok(KAYNAK.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const yol = join(klasor, "t.ts");
  writeFileSync(yol, KAYNAK.replace(eski, () => yeni));
  return import(pathToFileURL(yol).href);
}

let kume: GomuluKume, havuz: Havuz;
before(async () => { kume = await testKumesi(); havuz = havuzKur(kume.uygulama); });
after(async () => { await havuz?.end(); await kume?.durdur(); rmSync(klasor, { recursive: true, force: true }); });

test("kendi işi süzgeci kalkınca planlamacı ekibinde olmadığı planı sayar (kilidin koruduğu açık)", async () => {
  const m = await bozuk("const bek = planlar.filter((p) => p.durum === \"bekliyor\" && !!ben && p.ekip.includes(ben))", "const bek = planlar.filter((p) => p.durum === \"bekliyor\")");
  const s = kume.sahipIstemci(); await s.connect();
  let A: string, plan: string;
  try {
    await s.query("SET session_replication_role = replica");
    A = (await s.query<{ id: string }>("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-a', 'Deneme A', 'DA') RETURNING id::text")).rows[0].id;
    plan = (await s.query<{ id: string }>("INSERT INTO hesap (firma_id, eposta, ad, roller, durum) VALUES ($1, 'plan@deneme-a.example', 'Deneme', '{planlama}', 'etkin') RETURNING id::text", [A])).rows[0].id;
    const mu = (await s.query<{ id: string }>("INSERT INTO musteri (firma_id, unvan, kisa) VALUES ($1, 'Deneme Bir A.Ş.', 'Deneme Bir') RETURNING id::text", [A])).rows[0].id;
    const t = (await s.query<{ id: string }>("INSERT INTO tesis (firma_id, musteri_id, ad) VALUES ($1, $2, 'Merkez') RETURNING id::text", [A, mu])).rows[0].id;
    await s.query("INSERT INTO plan (firma_id, no, tesis_id, baslangic, bitis, durum, firma_adi, acan) VALUES ($1, 'P-1026-001', $2, '2099-01-01', '2099-01-01', 'bekliyor', 'Deneme', 'Deneme')", [A, t]);
  } finally { await s.end(); }
  const K = { id: plan, ad: "Deneme", roller: ["planlama" as const] };
  const r = await kiraciIcinde(havuz, A, (db) => m.menuTakip(db, K as never), { hesapId: plan });
  assert.equal(r[13]?.sari, 1, "bozuk: ekipte olmayan planlamacı firmanın planını saydı");
});
