/* OLUMSUZ KANIT — tests/talepler.test.ts neyi koruyor (330; göç 0042, 0043). Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): göçler geçici klasöre
   kopyalanır, bozulacak göç bellekte bozulur, kopyadan koşulur.
   1. "Kendi adına" denetimi olmasaydı bir hesap başkası adına izin talebi yazardı.
   2. Karar verilmiş talebin değişmezliği olmasaydı reddedilen izin sonradan onaylanırdı.
   3. Masraf formunda "kendi adına" denetimi olmasaydı başkası adına masraf yazılırdı.
   4. (329–332 incelemesi) Belge denetimi karar anına bakmasaydı talebin belgesi onayla aynı anda değiştirilirdi.
   5. (329–332 incelemesi) Masraf formunun kişi kilidi olmasaydı form başkasının üstüne geçerdi. */
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
const gecici = mkdtempSync(join(tmpdir(), "talepler-bozan-"));
const acilan: { supa: SupabaseBenzeri; havuz: Havuz }[] = [];
const BUGUN = "(now() AT TIME ZONE 'Europe/Istanbul')::date";

/** göçü bozarak Supabase taklidi veritabanı açar; A firması, iki personel, birinin hesabı */
async function bozuk(ad: string, goc: string, eski: string, yeni: string) {
  const klasor = join(gecici, ad);
  mkdirSync(klasor);
  for (const g of readdirSync(GOC_KLASORU)) {
    if (!g.endsWith(".sql")) continue;
    if (g.startsWith(goc)) {
      const k = readFileSync(join(GOC_KLASORU, g), "utf8");
      assert.ok(k.includes(eski), "bozulacak satır kaynakta yok");
      writeFileSync(join(klasor, g), k.replace(eski, () => yeni));
    } else copyFileSync(join(GOC_KLASORU, g), join(klasor, g));
  }
  const supa = await supabaseBenzeri(kume, ad, klasor);
  const havuz = havuzKur({ ...kume.uygulama, database: ad });
  acilan.push({ supa, havuz });
  const q = async (sql: string, p: unknown[] = []) => (await supa.sahip.query<{ id: string }>(sql, p)).rows[0].id;
  const A = await q("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-a', 'Deneme A', 'DA') RETURNING id::text");
  const ben = await q("INSERT INTO personel (firma_id, ad, basla, meslek) VALUES ($1, 'Deneme Ben', '2024-01-01', 'mak-muh') RETURNING id::text", [A]);
  const baska = await q("INSERT INTO personel (firma_id, ad, basla, meslek) VALUES ($1, 'Deneme Başka', '2024-01-01', 'mak-muh') RETURNING id::text", [A]);
  const hesap = await q("INSERT INTO hesap (firma_id, eposta, ad, roller, durum, personel_id) VALUES ($1, 'ben@deneme-a.example', 'Deneme Ben', '{denetci}', 'etkin', $2) RETURNING id::text", [A, ben]);
  return { havuz, A, ben, baska, hesap };
}

before(async () => { kume = await testKumesi(); });
after(async () => {
  for (const x of acilan) { await x.havuz.end(); await x.supa.kapat(); }
  await kume?.durdur();
  rmSync(gecici, { recursive: true, force: true });
});

test("0042'de 'kendi adına' denetimi kalkınca başkası adına izin talebi yazılır (kilidin koruduğu açık)", async () => {
  const { havuz, A, baska, hesap } = await bozuk("talep_bozuk1", "0042_",
    "    IF NEW.personel_id IS DISTINCT FROM (SELECT h.personel_id FROM hesap h WHERE h.firma_id = NEW.firma_id AND h.id = ben) THEN\n      RAISE EXCEPTION 'izin talebi yalnız kendi adına gönderilir' USING ERRCODE = '23514';\n    END IF;\n", "");
  const r = await kiraciIcinde(havuz, A, (db) => db.sorgu(`INSERT INTO izin_talebi (no, personel_id, tur, bas, bit, gun) VALUES ('I-1026-001', $1, 'mazeret', ${BUGUN}, ${BUGUN}, 1)`, [baska]),
    { hesapId: hesap });
  assert.equal(r.rowCount, 1, "başkası adına izin yazıldı");
});

test("0042'de karar değişmezliği kalkınca reddedilen izin sonradan onaylanır", async () => {
  const { havuz, A, ben, hesap } = await bozuk("talep_bozuk2", "0042_", "  IF OLD.durum <> 'bekliyor' THEN RAISE EXCEPTION 'karar verilmiş izin talebi değişmez' USING ERRCODE = '23514'; END IF;\n", "");
  const r = await kiraciIcinde(havuz, A, async (db) => {
    const id = (await db.sorgu<{ id: string }>(`INSERT INTO izin_talebi (no, personel_id, tur, bas, bit, gun) VALUES ('I-1026-001', $1, 'mazeret', ${BUGUN}, ${BUGUN}, 1) RETURNING id::text`, [ben])).rows[0].id;
    await db.sorgu("UPDATE izin_talebi SET durum = 'red', red = 'Yoğun dönem' WHERE id = $1", [id]);
    return db.sorgu("UPDATE izin_talebi SET durum = 'onaylandi', red = NULL WHERE id = $1", [id]);
  }, { hesapId: hesap });
  assert.equal(r.rowCount, 1, "reddedilen izin onaylandı");
});

test("0043'te masraf formunun 'kendi adına' denetimi kalkınca başkası adına masraf yazılır", async () => {
  const { havuz, A, baska, hesap } = await bozuk("talep_bozuk3", "0043_",
    "      IF NEW.personel_id IS DISTINCT FROM (SELECT h.personel_id FROM hesap h WHERE h.firma_id = NEW.firma_id AND h.id = ben) THEN\n        RAISE EXCEPTION 'masraf formu yalnız kendi adına gönderilir' USING ERRCODE = '23514';\n      END IF;\n", "");
  const r = await kiraciIcinde(havuz, A, (db) => db.sorgu(
    `INSERT INTO gider (no, tarih, tur, tutar, oran, kaynak, durum, personel_id) VALUES ('G-1026-001', ${BUGUN}, 'yol', 100, 20, 'form', 'bekliyor', $1)`, [baska]), { hesapId: hesap });
  assert.equal(r.rowCount, 1, "başkası adına masraf yazıldı");
});

/* 2026-10-06 (329–332 incelemesi) */
test("0042'de belge denetimi karar anına bakmazsa talebin belgesi onayla aynı anda değiştirilir", async () => {
  const { havuz, A, ben, hesap } = await bozuk("talep_bozuk4", "0042_", " OR NEW.durum IS DISTINCT FROM OLD.durum) THEN\n    RAISE EXCEPTION 'talebin belgesini", ") THEN\n    RAISE EXCEPTION 'talebin belgesini");
  const r = await kiraciIcinde(havuz, A, async (db) => {
    const id = (await db.sorgu<{ id: string }>(`INSERT INTO izin_talebi (no, personel_id, tur, bas, bit, gun) VALUES ('I-1026-001', $1, 'rapor', ${BUGUN}, ${BUGUN}, 1) RETURNING id::text`, [ben])).rows[0].id;
    const d = (await db.sorgu<{ id: string }>("SELECT gen_random_uuid()::text AS id")).rows[0].id;
    await db.sorgu("INSERT INTO dosya (id, modul, kayit_id, anahtar, ad, tur, boyut, sha256) VALUES ($1, 'izin', $2, $3, 'rapor.pdf', 'application/pdf', 10, $4)",
      [d, id, `firma/${A}/izin/${id}/${d}`, "0".repeat(64)]);
    return db.sorgu("UPDATE izin_talebi SET durum = 'onaylandi', belge = $2 WHERE id = $1", [id, d]);
  }, { hesapId: hesap });
  assert.equal(r.rowCount, 1, "karar anında belge değişti");
});

test("0043'te masraf formunun kişi kilidi kalkınca form başkasının üstüne geçer", async () => {
  const { havuz, A, ben, baska, hesap } = await bozuk("talep_bozuk5", "0043_", "    RAISE EXCEPTION 'masraf formunun personeli değişmez' USING ERRCODE = '23514';\n", "");
  const r = await kiraciIcinde(havuz, A, async (db) => {
    const id = (await db.sorgu<{ id: string }>(`INSERT INTO gider (no, tarih, tur, tutar, oran, kaynak, durum, personel_id) VALUES ('G-1026-001', ${BUGUN}, 'yol', 100, 20, 'form', 'bekliyor', $1)
      RETURNING id::text`, [ben])).rows[0].id;
    return db.sorgu("UPDATE gider SET personel_id = $2 WHERE id = $1", [id, baska]);
  }, { hesapId: hesap });
  assert.equal(r.rowCount, 1, "formun kişisi değişti");
});
