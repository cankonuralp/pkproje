/* OLUMSUZ KANIT — tests/teklifler.test.ts neyi koruyor (324; göç 0037). Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): göçler geçici klasöre
   kopyalanır, 0037 bellekte bozulur, kopyadan koşulur.
   1. Gönderilmiş teklifin içerik koruması olmasaydı müşteriye giden teklifin KDV'si / kalemi sonradan değişirdi (verilen teklif ≠ kayıt).
   2. Süre denetimi olmasaydı geçerliliği dolmuş teklif kabul edilirdi (124: yenisi kopyalanır).
   3. Tesis denetimi olmasaydı teklife başka müşterinin tesisi girerdi (kabulden sonra o tesisin raporları bu teklife bağlanırdı).
   4. Hazırlayan veritabanında damgalanmasaydı istemciden gelen kimlik "hazırlayan" diye yazılırdı (istemciden gelen kimlik yetki vermez).
   5. (324 incelemesi) Taşıma yasağı olmasaydı gönderilmiş teklifin kalemi taslak teklife taşınır, müşteriye giden teklifin tutarı değişirdi.
   6. (326, 0038) Dayanak teklif denetimi olmasaydı başka müşterinin teklifi sözleşmeye dayanak olurdu (fiyatlar yanlış müşteriden). */
import assert from "node:assert/strict";
import { copyFileSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import { GOC_KLASORU } from "../../src/server/db/goc.ts";
import type { GomuluKume } from "../../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz } from "../../src/server/db/kiraci.ts";
import { testKumesi } from "../yardimci/kume.ts";
import { supabaseBenzeri, type SupabaseBenzeri } from "../yardimci/supabase.ts";

let kume: GomuluKume;
const gecici = mkdtempSync(join(tmpdir(), "teklif-bozan-"));
const acilan: { supa: SupabaseBenzeri; havuz: Havuz }[] = [];

/** göçü (varsayılan 0037) bozarak Supabase taklidi veritabanı açar; A firması, iki müşteri (birer tesis), bir tür */
async function bozuk(ad: string, eski: string, yeni: string, goc = "0037_") {
  const klasor = join(gecici, ad);
  mkdirSync(klasor);
  for (const g of readdirSync(GOC_KLASORU)) {
    if (!g.endsWith(".sql")) continue;
    if (g.startsWith(goc)) {
      const k = readFileSync(join(GOC_KLASORU, g), "utf8");
      assert.ok(k.includes(eski), "bozulacak satır kaynakta yok");
      writeFileSync(join(klasor, g), k.replace(eski, yeni));
    } else copyFileSync(join(GOC_KLASORU, g), join(klasor, g));
  }
  const supa = await supabaseBenzeri(kume, ad, klasor);
  const havuz = havuzKur({ ...kume.uygulama, database: ad });
  acilan.push({ supa, havuz });
  const A = (await supa.sahip.query<{ id: string }>("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-a', 'Deneme A', 'DA') RETURNING id")).rows[0].id;
  const v = await kiraciIcinde(havuz, A, async (db) => {
    const q = async (sql: string, p: unknown[] = []) => (await db.sorgu<{ id: string }>(sql, p)).rows[0].id;
    const m1 = await q("INSERT INTO musteri (unvan, kisa) VALUES ('Deneme Bir A.Ş.', 'Deneme Bir') RETURNING id::text");
    const m2 = await q("INSERT INTO musteri (unvan, kisa) VALUES ('Deneme İki A.Ş.', 'Deneme İki') RETURNING id::text");
    const t1 = await q("INSERT INTO tesis (musteri_id, ad) VALUES ($1, 'Merkez') RETURNING id::text", [m1]);
    const t2 = await q("INSERT INTO tesis (musteri_id, ad) VALUES ($1, 'Fabrika') RETURNING id::text", [m2]);
    const tur = await q("INSERT INTO ekipman_turu (kod, ad, grup, brans, periyot) VALUES ('HT', 'Hava tankı', 'basincli', 'm', 12) RETURNING id::text");
    const hesap = await q("INSERT INTO hesap (eposta, ad, roller, durum) VALUES ('plan@deneme-a.example', 'Deneme', '{planlama}', 'etkin') RETURNING id::text");
    return { m1, m2, t1, t2, tur, hesap };
  });
  return { havuz, A, ...v };
}
/** gönderilmiş teklif (kalemli, tesisli) */
async function gonderilmis(havuz: Havuz, A: string, m1: string, t1: string, tur: string, no: string) {
  return kiraciIcinde(havuz, A, async (db) => {
    const id = (await db.sorgu<{ id: string }>("INSERT INTO teklif (no, musteri_id, gecerlilik) VALUES ($1, $2, 30) RETURNING id::text", [no, m1])).rows[0].id;
    await db.sorgu("INSERT INTO teklif_kalem (teklif_id, tur_id, adet, fiyat) VALUES ($1, $2, 1, 100000)", [id, tur]);
    await db.sorgu("INSERT INTO teklif_tesis (teklif_id, tesis_id) VALUES ($1, $2)", [id, t1]);
    await db.sorgu("UPDATE teklif SET durum = 'gonderildi' WHERE id = $1", [id]);
    return id;
  });
}

before(async () => { kume = await testKumesi(); });
after(async () => {
  for (const x of acilan) { await x.havuz.end(); await x.supa.kapat(); }
  await kume?.durdur();
  rmSync(gecici, { recursive: true, force: true });
});

test("0037'de gönderilmiş teklifin içerik koruması kalkınca KDV sonradan değişir (kilidin koruduğu açık)", async () => {
  const { havuz, A, m1, t1, tur } = await bozuk("teklif_bozuk1", "  IF OLD.durum <> 'taslak' THEN\n", "  IF false THEN\n");
  const id = await gonderilmis(havuz, A, m1, t1, tur, "T-1026-001");
  const r = await kiraciIcinde(havuz, A, (db) => db.sorgu("UPDATE teklif SET kdv = 1 WHERE id = $1", [id]));
  assert.equal(r.rowCount, 1, "gönderilmiş teklifin KDV'si değişti");
});

test("0037'de süre denetimi kalkınca geçerliliği dolmuş teklif kabul edilir", async () => {
  const { havuz, A, m1, t1, tur } = await bozuk("teklif_bozuk2", "      IF OLD.gonderildi + OLD.gecerlilik < bugun THEN\n", "      IF false THEN\n");
  const id = await gonderilmis(havuz, A, m1, t1, tur, "T-1026-002");
  const sahip = acilan.at(-1)!.supa.sahip;
  await sahip.query("SET session_replication_role = replica");
  try { await sahip.query("UPDATE teklif SET gonderildi = gonderildi - 40 WHERE id = $1", [id]); } finally { await sahip.query("SET session_replication_role = origin"); }
  const r = await kiraciIcinde(havuz, A, (db) => db.sorgu("UPDATE teklif SET durum = 'kabul' WHERE id = $1", [id]));
  assert.equal(r.rowCount, 1, "süresi dolan teklif kabul edildi");
});

test("0037'de tesis denetimi kalkınca teklife başka müşterinin tesisi girer", async () => {
  const { havuz, A, m1, t2 } = await bozuk("teklif_bozuk3", " AND s.musteri_id = t.musteri_id) THEN", ") THEN");
  const r = await kiraciIcinde(havuz, A, async (db) => {
    const id = (await db.sorgu<{ id: string }>("INSERT INTO teklif (no, musteri_id, gecerlilik) VALUES ('T-1026-003', $1, 30) RETURNING id::text", [m1])).rows[0].id;
    return db.sorgu("INSERT INTO teklif_tesis (teklif_id, tesis_id) VALUES ($1, $2)", [id, t2]);
  });
  assert.equal(r.rowCount, 1, "m2'nin tesisi m1'in teklifine girdi");
});

test("0037'de hazırlayan damgası kalkınca istemcinin yazdığı kimlik hazırlayan olur", async () => {
  const { havuz, A, m1, hesap } = await bozuk("teklif_bozuk4", "    NEW.hazirlayan := NULLIF(current_setting('app.hesap_id', true), '')::uuid;\n", "");
  const sahte = "00000000-0000-4000-8000-000000000001";
  const h = await kiraciIcinde(havuz, A, (db) => db.sorgu<{ h: string }>(
    "INSERT INTO teklif (no, musteri_id, gecerlilik, hazirlayan) VALUES ('T-1026-004', $1, 30, $2) RETURNING hazirlayan::text AS h", [m1, sahte]), { hesapId: hesap });
  assert.equal(h.rows[0].h, sahte, "istemcinin kimliği yazıldı");
});

test("0037'de taşıma yasağı kalkınca gönderilmiş teklifin kalemi taslak teklife taşınır (müşteriye giden teklifin tutarı değişir)", async () => {
  const { havuz, A, m1, t1, tur } = await bozuk("teklif_bozuk5",
    "  IF TG_OP = 'UPDATE' AND (NEW.teklif_id IS DISTINCT FROM OLD.teklif_id OR NEW.firma_id IS DISTINCT FROM OLD.firma_id) THEN", "  IF false THEN");
  const gonderilen = await gonderilmis(havuz, A, m1, t1, tur, "T-1026-005");
  const r = await kiraciIcinde(havuz, A, async (db) => {
    const taslak = (await db.sorgu<{ id: string }>("INSERT INTO teklif (no, musteri_id, gecerlilik) VALUES ('T-1026-006', $1, 30) RETURNING id::text", [m1])).rows[0].id;
    return db.sorgu("UPDATE teklif_kalem SET teklif_id = $1 WHERE teklif_id = $2", [taslak, gonderilen]);
  });
  assert.equal(r.rowCount, 1, "gönderilmiş teklifin kalemi taşındı");
});

test("0038'de dayanak teklif denetimi kalkınca başka müşterinin kabul edilmiş teklifi sözleşmeye dayanak olur", async () => {
  const { havuz, A, m1, m2, t2, tur } = await bozuk("teklif_bozuk6", " AND t.musteri_id = NEW.musteri_id) THEN", ") THEN", "0038_");
  const r = await kiraciIcinde(havuz, A, async (db) => {
    const id = await gonderilmis(havuz, A, m2, t2, tur, "T-1026-007");
    await db.sorgu("UPDATE teklif SET durum = 'kabul' WHERE id = $1", [id]);
    return db.sorgu(`INSERT INTO is_sozlesmesi (no, musteri_id, baslangic, bitis, vade, yenileme, teklif_id)
      VALUES ('IS-1026-001', $1, '2026-10-01', '2027-09-30', 30, 'yok', $2)`, [m1, id]);
  });
  assert.equal(r.rowCount, 1, "m2'nin teklifi m1'in sözleşmesine dayanak oldu");
});
