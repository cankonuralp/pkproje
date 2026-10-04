/* OLUMSUZ KANIT — tests/zimmetler.test.ts neyi koruyor. Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): göçler geçici klasöre kopyalanır, 0015'te
   hareket tablosuna güncelleme / silme hakkı bellekte verilir. O zaman uygulama rolü (ya da onu kullanan hatalı bir kod) teslim geçmişini
   sessizce değiştirir ve siler — "kim hangi aracı kimden teslim aldı" kaydı güvenilmez olur. */
import assert from "node:assert/strict";
import { copyFileSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import { GOC_KLASORU } from "../../src/server/db/goc.ts";
import type { GomuluKume } from "../../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde } from "../../src/server/db/kiraci.ts";
import { testKumesi } from "../yardimci/kume.ts";
import { supabaseBenzeri, type SupabaseBenzeri } from "../yardimci/supabase.ts";

const HAK = "GRANT SELECT, INSERT ON zimmet_hareket TO probata_uygulama;";
let kume: GomuluKume;
let supa: SupabaseBenzeri;
const gecici = mkdtempSync(join(tmpdir(), "zimmet-bozan-"));

before(async () => {
  kume = await testKumesi();
  const klasor = join(gecici, "gocler");
  mkdirSync(klasor);
  for (const ad of readdirSync(GOC_KLASORU)) {
    if (!ad.endsWith(".sql")) continue;
    if (ad.startsWith("0015_")) {
      const k = readFileSync(join(GOC_KLASORU, ad), "utf8");
      assert.ok(k.includes(HAK), "bozulacak satır kaynakta yok");
      writeFileSync(join(klasor, ad), k.replace(HAK, "GRANT SELECT, INSERT, UPDATE, DELETE ON zimmet_hareket TO probata_uygulama;"));
    } else copyFileSync(join(GOC_KLASORU, ad), join(klasor, ad));
  }
  supa = await supabaseBenzeri(kume, "zimmet_bozuk", klasor);
});
after(async () => { await supa?.kapat(); await kume?.durdur(); rmSync(gecici, { recursive: true, force: true }); });

test("güncelleme / silme hakkı verilince teslim geçmişi değiştirilir ve silinir (kilidin koruduğu açık)", async () => {
  const [A] = (await supa.sahip.query<{ id: string }>("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-a', 'Deneme A', 'DA') RETURNING id")).rows.map((r) => r.id);
  const havuz = havuzKur({ ...kume.uygulama, database: "zimmet_bozuk" });
  try {
    await kiraciIcinde(havuz, A, async (db) => {
      const d = (await db.sorgu<{ id: string }>("INSERT INTO demirbas (kod, ad) VALUES ('DM-1', 'Deneme merdiven') RETURNING id::text")).rows[0].id;
      const p = (await db.sorgu<{ id: string }>("INSERT INTO personel (ad, basla, meslek) VALUES ('Deneme Kişi', '2024-01-01', 'mak-muh') RETURNING id::text")).rows[0].id;
      await db.sorgu("INSERT INTO zimmet_hareket (demirbas_id, alan_personel, zaman) VALUES ($1, $2, now())", [d, p]);
    });
    await kiraciIcinde(havuz, A, (db) => db.sorgu("UPDATE zimmet_hareket SET notu = 'sonradan değişti'"));
    const sil = await kiraciIcinde(havuz, A, (db) => db.sorgu("DELETE FROM zimmet_hareket"));
    assert.equal(sil.rowCount, 1, "teslim kaydı silindi");
  } finally { await havuz.end(); }
});
