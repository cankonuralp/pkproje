/* OLUMSUZ KANIT — tests/egitimler.test.ts neyi koruyor. Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): göçler geçici klasöre kopyalanır, 0019'da
   "kişi × eğitim başına tek güncel kayıt" kısmi eşsiz dizini bellekte kaldırılır. O zaman aynı kişinin aynı eğitimi için iki güncel kayıt
   olur — hangi tekrar tarihinin geçerli olduğu belirsizleşir, süresi geçmiş eğitim yenisinin arkasına saklanabilir. */
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

const DIZIN = "CREATE UNIQUE INDEX IF NOT EXISTS egitim_kaydi_guncel ON egitim_kaydi (firma_id, personel_id, tur_id) WHERE NOT onceki;";
let kume: GomuluKume;
let supa: SupabaseBenzeri;
const gecici = mkdtempSync(join(tmpdir(), "egt-bozan-"));

before(async () => {
  kume = await testKumesi();
  const klasor = join(gecici, "gocler");
  mkdirSync(klasor);
  for (const ad of readdirSync(GOC_KLASORU)) {
    if (!ad.endsWith(".sql")) continue;
    if (ad.startsWith("0019_")) {
      const k = readFileSync(join(GOC_KLASORU, ad), "utf8");
      assert.ok(k.includes(DIZIN), "bozulacak satır kaynakta yok");
      writeFileSync(join(klasor, ad), k.replace(DIZIN, ""));
    } else copyFileSync(join(GOC_KLASORU, ad), join(klasor, ad));
  }
  supa = await supabaseBenzeri(kume, "egt_bozuk", klasor);
});
after(async () => { await supa?.kapat(); await kume?.durdur(); rmSync(gecici, { recursive: true, force: true }); });

test("tek güncel kayıt dizini kalkınca aynı kişi × eğitimde iki güncel kayıt olur (kilidin koruduğu açık)", async () => {
  const [A] = (await supa.sahip.query<{ id: string }>("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-a', 'Deneme A', 'DA') RETURNING id")).rows.map((r) => r.id);
  const havuz = havuzKur({ ...kume.uygulama, database: "egt_bozuk" });
  try {
    const n = await kiraciIcinde(havuz, A, async (db) => {
      const p = (await db.sorgu<{ id: string }>("INSERT INTO personel (ad, basla, meslek) VALUES ('Deneme Kişi', '2024-01-01', 'mak-muh') RETURNING id::text")).rows[0].id;
      const t = (await db.sorgu<{ id: string }>("INSERT INTO egitim_turu (ad, tekrar_ay) VALUES ('Deneme eğitimi', 12) RETURNING id::text")).rows[0].id;
      for (const [g, s] of [["2024-01-01", "2025-01-01"], ["2025-02-01", "2026-02-01"]])
        await db.sorgu("INSERT INTO egitim_kaydi (personel_id, tur_id, tarih, tekrar, kurum) VALUES ($1, $2, $3, $4, 'Firma içi')", [p, t, g, s]);
      return (await db.sorgu<{ n: number }>("SELECT count(*)::int AS n FROM egitim_kaydi WHERE NOT onceki")).rows[0].n;
    });
    assert.equal(n, 2, "iki güncel kayıt");
  } finally { await havuz.end(); }
});
