/* OLUMSUZ KANIT — tests/muhasebe.test.ts gider testleri neyi koruyor (328; göç 0040). Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): göçler geçici
   klasöre kopyalanır, 0040 bellekte bozulur, kopyadan koşulur. Giderler uygulama rolüyle (tetikten geçerek) yazılır.
   1. Red değişmezliği olmasaydı reddedilen giderin tutarı sonradan değiştirilirdi.
   2. Masraf formu onay beklemeseydi denetçinin formu "ödendi" doğardı (muhasebe onayı atlanır).
   3. İleri tarih denetimi olmasaydı yarının tarihiyle gider yazılırdı.
   4. Kaydeden veritabanında damgalanmasaydı istemcinin yazdığı kimlik "kaydeden" olurdu. */
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
const gecici = mkdtempSync(join(tmpdir(), "gider-bozan-"));
const acilan: { supa: SupabaseBenzeri; havuz: Havuz }[] = [];
const BUGUN = "(now() AT TIME ZONE 'Europe/Istanbul')::date";

/** 0040'ı bozarak Supabase taklidi veritabanı açar; A firması */
async function bozuk(ad: string, eski: string, yeni: string) {
  const klasor = join(gecici, ad);
  mkdirSync(klasor);
  for (const g of readdirSync(GOC_KLASORU)) {
    if (!g.endsWith(".sql")) continue;
    if (g.startsWith("0040_")) {
      const k = readFileSync(join(GOC_KLASORU, g), "utf8");
      assert.ok(k.includes(eski), "bozulacak satır kaynakta yok");
      writeFileSync(join(klasor, g), k.replace(eski, yeni));
    } else copyFileSync(join(GOC_KLASORU, g), join(klasor, g));
  }
  const supa = await supabaseBenzeri(kume, ad, klasor);
  const havuz = havuzKur({ ...kume.uygulama, database: ad });
  acilan.push({ supa, havuz });
  const A = (await supa.sahip.query<{ id: string }>("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-a', 'Deneme A', 'DA') RETURNING id::text")).rows[0].id;
  return { havuz, A };
}

before(async () => { kume = await testKumesi(); });
after(async () => {
  for (const x of acilan) { await x.havuz.end(); await x.supa.kapat(); }
  await kume?.durdur();
  rmSync(gecici, { recursive: true, force: true });
});

test("0040'ta red değişmezliği kalkınca reddedilen giderin tutarı değiştirilir (kilidin koruduğu açık)", async () => {
  const { havuz, A } = await bozuk("gider_bozuk1", "  IF OLD.durum = 'red' THEN RAISE EXCEPTION 'reddedilen gider değişmez' USING ERRCODE = '23514'; END IF;\n", "");
  const r = await kiraciIcinde(havuz, A, async (db) => {
    const id = (await db.sorgu<{ id: string }>(`INSERT INTO gider (no, tarih, tur, tutar, oran, kaynak, durum) VALUES ('G-1026-001', ${BUGUN}, 'yol', 100, 20, 'form', 'bekliyor')
      RETURNING id::text`)).rows[0].id;
    await db.sorgu("UPDATE gider SET durum = 'red', red = 'Fiş okunmuyor' WHERE id = $1", [id]);
    return db.sorgu("UPDATE gider SET tutar = 999999 WHERE id = $1", [id]);
  });
  assert.equal(r.rowCount, 1, "reddedilen gider değişti");
});

test("0040'ta masraf formunun onay beklemesi kalkınca form 'ödendi' doğar", async () => {
  const { havuz, A } = await bozuk("gider_bozuk2", "      IF NEW.durum <> 'bekliyor' THEN RAISE EXCEPTION 'masraf formu onay bekler'", "      IF false THEN RAISE EXCEPTION 'masraf formu onay bekler'");
  const r = await kiraciIcinde(havuz, A, (db) => db.sorgu(
    `INSERT INTO gider (no, tarih, tur, tutar, oran, kaynak, durum, odeme) VALUES ('G-1026-001', ${BUGUN}, 'yol', 100, 20, 'form', 'odendi', ${BUGUN})`));
  assert.equal(r.rowCount, 1, "onaysız ödenmiş masraf formu yazıldı");
});

test("0040'ta ileri tarih denetimi kalkınca yarının tarihiyle gider yazılır", async () => {
  const { havuz, A } = await bozuk("gider_bozuk3", "  IF NEW.tarih > bugun THEN RAISE EXCEPTION 'ileri tarihli gider kaydedilmez'", "  IF false THEN RAISE EXCEPTION 'ileri tarihli gider kaydedilmez'");
  const r = await kiraciIcinde(havuz, A, (db) => db.sorgu(
    `INSERT INTO gider (no, tarih, tur, tutar, oran, kaynak, durum, odeme) VALUES ('G-1026-001', ${BUGUN} + 1, 'yol', 100, 20, 'muhasebe', 'onaylandi', NULL)`));
  assert.equal(r.rowCount, 1, "ileri tarihli gider yazıldı");
});

test("0040'ta kaydeden damgası kalkınca istemcinin yazdığı kimlik kaydeden olur", async () => {
  const { havuz, A } = await bozuk("gider_bozuk4", "    NEW.kaydeden := ben; NEW.onaylayan := NULL;", "    NEW.onaylayan := NULL;");
  const sahte = "00000000-0000-4000-8000-000000000001";
  const r = await kiraciIcinde(havuz, A, (db) => db.sorgu<{ k: string }>(
    `INSERT INTO gider (no, tarih, tur, tutar, oran, kaynak, durum, kaydeden) VALUES ('G-1026-001', ${BUGUN}, 'yol', 100, 20, 'form', 'bekliyor', $1) RETURNING kaydeden::text AS k`, [sahte]));
  assert.equal(r.rows[0].k, sahte, "istemcinin kimliği yazıldı");
});
