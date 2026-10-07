/* OLUMSUZ KANIT — tests/personel-dosya.test.ts neyi koruyor. Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): göçler geçici klasöre kopyalanır, 0021'de
   "kişi × dönem başına tek geçerli bordro" kısmi eşsiz dizini bellekte kaldırılır. O zaman aynı kişinin aynı ayı için iki geçerli bordro olur —
   maaş ve günlük maliyet (iş kârlılığı) hangisinden okunacağı belirsizleşir. 373: 0068'deki "yalnız yüklenen tarama kaldırılır" denetimi de bellekte
   kalkar — o zaman Onaylar'da kişinin imzaladığı zimmet formu (taraması olmayan) kaldırılabilir. */
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

const DIZIN = "CREATE UNIQUE INDEX IF NOT EXISTS bordro_donem ON bordro (firma_id, personel_id, ay) WHERE kaldirildi IS NULL;";
const KALDIR = "    ALTER TABLE zimmet_formu ADD CONSTRAINT zimmet_formu_kaldir_yuklenen CHECK (kaldirildi IS NULL OR dosya_id IS NOT NULL);\n";
let kume: GomuluKume;
let supa: SupabaseBenzeri;
const gecici = mkdtempSync(join(tmpdir(), "pd-bozan-"));

before(async () => {
  kume = await testKumesi();
  const klasor = join(gecici, "gocler");
  mkdirSync(klasor);
  for (const ad of readdirSync(GOC_KLASORU)) {
    if (!ad.endsWith(".sql")) continue;
    if (ad.startsWith("0021_")) {
      const k = readFileSync(join(GOC_KLASORU, ad), "utf8");
      assert.ok(k.includes(DIZIN), "bozulacak satır kaynakta yok");
      writeFileSync(join(klasor, ad), k.replace(DIZIN, ""));
    } else if (ad.startsWith("0068_")) {
      const k = readFileSync(join(GOC_KLASORU, ad), "utf8");
      assert.ok(k.includes(KALDIR), "bozulacak satır kaynakta yok (0068)");
      writeFileSync(join(klasor, ad), k.replace(KALDIR, "    NULL;\n"));
    } else copyFileSync(join(GOC_KLASORU, ad), join(klasor, ad));
  }
  supa = await supabaseBenzeri(kume, "pd_bozuk", klasor);
});
after(async () => { await supa?.kapat(); await kume?.durdur(); rmSync(gecici, { recursive: true, force: true }); });

test("tek geçerli bordro dizini kalkınca aynı kişi × dönemde iki geçerli bordro olur (kilidin koruduğu açık)", async () => {
  const [A] = (await supa.sahip.query<{ id: string }>("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-a', 'Deneme A', 'DA') RETURNING id")).rows.map((r) => r.id);
  const havuz = havuzKur({ ...kume.uygulama, database: "pd_bozuk" });
  try {
    const n = await kiraciIcinde(havuz, A, async (db) => {
      const p = (await db.sorgu<{ id: string }>("INSERT INTO personel (ad, basla, meslek) VALUES ('Deneme Kişi', '2024-01-01', 'mak-muh') RETURNING id::text")).rows[0].id;
      for (const brut of [100, 200]) await db.sorgu("INSERT INTO bordro (personel_id, ay, brut, net, maliyet) VALUES ($1, '2026-09', $2, $2, $2)", [p, brut]);
      return (await db.sorgu<{ n: number }>("SELECT count(*)::int AS n FROM bordro WHERE kaldirildi IS NULL")).rows[0].n;
    });
    assert.equal(n, 2, "iki geçerli bordro");
  } finally { await havuz.end(); }
});

test("373: yüklenen tarama denetimi kalkınca Onaylar'da imzalanan (taramasız) zimmet formu kaldırılır (kilidin koruduğu açık)", async () => {
  const A = (await supa.sahip.query<{ id: string }>("SELECT id::text FROM firma WHERE kisa_ad = 'deneme-a'")).rows[0].id;
  const havuz = havuzKur({ ...kume.uygulama, database: "pd_bozuk" });
  try {
    const n = await kiraciIcinde(havuz, A, async (db) => {
      const p = (await db.sorgu<{ id: string }>("INSERT INTO personel (ad, basla, meslek) VALUES ('Deneme İki', '2024-01-01', 'mak-muh') RETURNING id::text")).rows[0].id;
      const f = (await db.sorgu<{ id: string }>("INSERT INTO zimmet_formu (personel_id, kapsam) VALUES ($1, '{}') RETURNING id::text", [p])).rows[0].id;
      return (await db.sorgu("UPDATE zimmet_formu SET kaldirildi = now() WHERE id = $1", [f])).rowCount;
    });
    assert.equal(n, 1, "bozuk: taramasız (imzalanmış) form kaldırıldı");
  } finally { await havuz.end(); }
});
