/* OLUMSUZ KANIT — tests/araclar.test.ts neyi koruyor. Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): göçler geçici klasöre kopyalanır, 0016'da
   araç teslim tutanağı tablosuna güncelleme / silme hakkı bellekte verilir. O zaman uygulama rolü (ya da onu kullanan hatalı bir kod) imzalanacak
   tutanağın kilometresini, hasar notunu sonradan değiştirir ve siler — teslim anının kanıtı güvenilmez olur. */
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

const HAK = "GRANT SELECT, INSERT ON arac_tutanagi TO probata_uygulama;";
let kume: GomuluKume;
let supa: SupabaseBenzeri;
const gecici = mkdtempSync(join(tmpdir(), "arac-bozan-"));

before(async () => {
  kume = await testKumesi();
  const klasor = join(gecici, "gocler");
  mkdirSync(klasor);
  for (const ad of readdirSync(GOC_KLASORU)) {
    if (!ad.endsWith(".sql")) continue;
    if (ad.startsWith("0016_")) {
      const k = readFileSync(join(GOC_KLASORU, ad), "utf8");
      assert.ok(k.includes(HAK), "bozulacak satır kaynakta yok");
      writeFileSync(join(klasor, ad), k.replace(HAK, "GRANT SELECT, INSERT, UPDATE, DELETE ON arac_tutanagi TO probata_uygulama;"));
    } else copyFileSync(join(GOC_KLASORU, ad), join(klasor, ad));
  }
  supa = await supabaseBenzeri(kume, "arac_bozuk", klasor);
});
after(async () => { await supa?.kapat(); await kume?.durdur(); rmSync(gecici, { recursive: true, force: true }); });

test("güncelleme / silme hakkı verilince teslim tutanağı değiştirilir ve silinir (kilidin koruduğu açık)", async () => {
  const [A] = (await supa.sahip.query<{ id: string }>("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-a', 'Deneme A', 'DA') RETURNING id")).rows.map((r) => r.id);
  const havuz = havuzKur({ ...kume.uygulama, database: "arac_bozuk" });
  try {
    await kiraciIcinde(havuz, A, async (db) => {
      const a = (await db.sorgu<{ id: string }>("INSERT INTO arac (plaka, tur, marka, model, yil, yakit) VALUES ('00 DNM 001', 'Kamyon', 'D', 'M', 2020, 'dizel') RETURNING id::text")).rows[0].id;
      const p = (await db.sorgu<{ id: string }>("INSERT INTO personel (ad, basla, meslek) VALUES ('Deneme Kişi', '2024-01-01', 'mak-muh') RETURNING id::text")).rows[0].id;
      const h = (await db.sorgu<{ id: string }>("INSERT INTO zimmet_hareket (arac_id, alan_personel, zaman, km) VALUES ($1, $2, now(), 1000) RETURNING id::text", [a, p])).rows[0].id;
      await db.sorgu("INSERT INTO arac_tutanagi (hareket_id, no, yakit) VALUES ($1, 'AT-1026-001', 'dolu')", [h]);
    });
    await kiraciIcinde(havuz, A, (db) => db.sorgu("UPDATE arac_tutanagi SET hasar = 'sonradan eklendi', yakit = 'bos'"));
    const sil = await kiraciIcinde(havuz, A, (db) => db.sorgu("DELETE FROM arac_tutanagi"));
    assert.equal(sil.rowCount, 1, "tutanak silindi");
  } finally { await havuz.end(); }
});
