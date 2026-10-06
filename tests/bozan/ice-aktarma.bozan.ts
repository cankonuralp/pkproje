/* OLUMSUZ KANIT — tests/ice-aktarma.test.ts neyi koruyor (337; göç 0047). Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): sunucu işlevi bellekte
   bozulup geçici klasörden içe aktarılır (göreli içe aktarmalar mutlak yola çevrilir); göçler geçici klasöre kopyalanır, bozulacak göç bellekte
   bozulur, kopyadan koşulur.
   1. Yetki denetimi kalkınca Firma ayarlarını değiştiremeyen denetçi firmanın bütün personelini içe aktarır.
   2. 0047'de "kayıt bu işlemde oluşturulmuş" denetimi kalkınca sahte bir içe aktarma kaydıyla firmanın eski müşterisi "geri al" ile silinir. */
import assert from "node:assert/strict";
import { copyFileSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, before, test } from "node:test";
import { GOC_KLASORU } from "../../src/server/db/goc.ts";
import type { GomuluKume } from "../../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz } from "../../src/server/db/kiraci.ts";
import { IA_TUR } from "../../src/modules/firma-ayarlari/ice-aktar.ts";
import { testKumesi } from "../yardimci/kume.ts";
import { supabaseBenzeri, type SupabaseBenzeri } from "../yardimci/supabase.ts";

type Modul = typeof import("../../src/modules/firma-ayarlari/server/ice-aktar.ts");
const KOK = resolve("src/modules/firma-ayarlari/server");
const KAYNAK = readFileSync(join(KOK, "ice-aktar.ts"), "utf8").replace(/from "(\.\.?\/[^"]+)"/g, (_, y) => `from "${pathToFileURL(resolve(KOK, y)).href}"`);
const gecici = mkdtempSync(join(tmpdir(), "ice-aktarma-bozan-"));
let sira = 0;
async function bozukModul(eski: string, yeni: string): Promise<Modul> {
  assert.ok(KAYNAK.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const yol = join(gecici, `m-${sira++}.ts`);
  writeFileSync(yol, KAYNAK.replace(eski, () => yeni));
  return import(pathToFileURL(yol).href);
}

let kume: GomuluKume, havuz: Havuz;
const acilan: { supa: SupabaseBenzeri; havuz: Havuz }[] = [];
before(async () => { kume = await testKumesi(); havuz = havuzKur(kume.uygulama); });
after(async () => {
  await havuz?.end();
  for (const x of acilan) { await x.havuz.end(); await x.supa.kapat(); }
  await kume?.durdur();
  rmSync(gecici, { recursive: true, force: true });
});

test("yetki denetimi kalkınca denetçi firmanın personelini içe aktarır (kilidin koruduğu açık)", async () => {
  const m = await bozukModul("  if (!ayarlarYazar(kim)) return { hata: { durum: \"yetkisiz\" } };\n", "");
  const s = kume.sahipIstemci(); await s.connect();
  let A: string;
  try { A = (await s.query<{ id: string }>("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-a', 'Deneme A', 'DA') RETURNING id::text")).rows[0].id; } finally { await s.end(); }
  const den = (await kiraciIcinde(havuz, A, (db) => db.sorgu<{ id: string }>("INSERT INTO hesap (eposta, ad, roller, durum) VALUES ('den@deneme-a.example', 'Deneme', '{denetci}', 'etkin') RETURNING id::text"))).rows[0].id;
  const DEN = { id: den, ad: "Deneme", roller: ["denetci" as const] };
  const r = await kiraciIcinde(havuz, A, (db) => m.iceAktar(db, DEN, { tur: "personel", dosya: "p.xlsx", satirlar: [[...IA_TUR.personel.sutun], ...IA_TUR.personel.ornek.map((x) => [...x])] }), { hesapId: den });
  assert.equal(r.durum, "aktarildi", "bozuk: denetçi içe aktardı");
});

test("0047'de 'bu işlemde oluşturulmuş' denetimi kalkınca sahte içe aktarma kaydıyla eski müşteri geri al ile silinir", async () => {
  const ad = "ice_bozuk1", klasor = join(gecici, ad);
  mkdirSync(klasor);
  for (const g of readdirSync(GOC_KLASORU)) {
    if (!g.endsWith(".sql")) continue;
    if (g.startsWith("0047_")) {
      const k = readFileSync(join(GOC_KLASORU, g), "utf8"), eski = "    IF NOT var THEN RAISE EXCEPTION 'içe aktarma kaydı bu işlemde oluşturulmuş bir kayıt değil' USING ERRCODE = '23514'; END IF;\n";
      assert.ok(k.includes(eski), "bozulacak satır kaynakta yok");
      writeFileSync(join(klasor, g), k.replace(eski, () => ""));
    } else copyFileSync(join(GOC_KLASORU, g), join(klasor, g));
  }
  const supa = await supabaseBenzeri(kume, ad, klasor);
  const h = havuzKur({ ...kume.uygulama, database: ad });
  acilan.push({ supa, havuz: h });
  const q = async (sql: string, p: unknown[] = []) => (await supa.sahip.query<{ id: string }>(sql, p)).rows[0].id;
  const A = await q("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-a', 'Deneme A', 'DA') RETURNING id::text");
  const yon = await q("INSERT INTO hesap (firma_id, eposta, ad, roller, durum) VALUES ($1, 'yon@deneme-a.example', 'Deneme', '{firma_yoneticisi}', 'etkin') RETURNING id::text", [A]);
  const eski = await q("INSERT INTO musteri (firma_id, unvan, kisa) VALUES ($1, 'Eski Müşteri A.Ş.', 'Eski') RETURNING id::text", [A]);
  const sahte = (await kiraciIcinde(h, A, (db) => db.sorgu<{ id: string }>("INSERT INTO ice_aktarim (tur, dosya, adet, kayitlar, kim) VALUES ('musteri', 'x.xlsx', 1, $1, 'Deneme') RETURNING id::text",
    [JSON.stringify([{ t: "musteri", id: eski }])]), { hesapId: yon })).rows[0].id;
  const s = (await kiraciIcinde(h, A, (db) => db.sorgu<{ s: string }>("SELECT ice_aktarim_geri_al($1::uuid, 'Deneme', false) AS s", [sahte]), { hesapId: yon })).rows[0].s;
  assert.equal(s, "tamam", "bozuk: sahte kayıtla eski müşteri silindi");
});
