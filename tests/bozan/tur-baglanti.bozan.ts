/* OLUMSUZ KANIT — tests/tur-baglanti.test.ts neyi koruyor. Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): göçler geçici klasöre kopyalanır, 0020'de
   bağlantı sayısı sınırı (en çok 20 standart / 20 cihaz türü) bellekte kaldırılır. O zaman hatalı ya da kötü niyetli bir istek türe sınırsız
   bağlantı yazar — tür sayfası ve rapor cihaz denetimi şişer. */
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

const DIZIN = "ALTER TABLE ekipman_turu ADD CONSTRAINT ekipman_turu_baglanti_sinir CHECK (cardinality(kontrol_std) <= 20 AND cardinality(cihaz_turleri) <= 20);";
let kume: GomuluKume;
let supa: SupabaseBenzeri;
const gecici = mkdtempSync(join(tmpdir(), "tb-bozan-"));

before(async () => {
  kume = await testKumesi();
  const klasor = join(gecici, "gocler");
  mkdirSync(klasor);
  for (const ad of readdirSync(GOC_KLASORU)) {
    if (!ad.endsWith(".sql")) continue;
    if (ad.startsWith("0020_")) {
      const k = readFileSync(join(GOC_KLASORU, ad), "utf8");
      assert.ok(k.includes(DIZIN), "bozulacak satır kaynakta yok");
      writeFileSync(join(klasor, ad), k.replace(DIZIN, "NULL;"));
    } else copyFileSync(join(GOC_KLASORU, ad), join(klasor, ad));
  }
  supa = await supabaseBenzeri(kume, "tb_bozuk", klasor);
});
after(async () => { await supa?.kapat(); await kume?.durdur(); rmSync(gecici, { recursive: true, force: true }); });

test("sınır kalkınca türe 21 standart yazılır (kilidin koruduğu açık)", async () => {
  const [A] = (await supa.sahip.query<{ id: string }>("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-a', 'Deneme A', 'DA') RETURNING id")).rows.map((r) => r.id);
  const havuz = havuzKur({ ...kume.uygulama, database: "tb_bozuk" });
  try {
    const n = await kiraciIcinde(havuz, A, async (db) => {
      await db.sorgu("INSERT INTO ekipman_turu (kod, ad, grup, brans, periyot, kontrol_std) VALUES ('DV', 'Deneme Vinç', 'kaldirma', 'm', 12, array_fill('X'::text, ARRAY[21]))");
      return (await db.sorgu<{ n: number }>("SELECT cardinality(kontrol_std) AS n FROM ekipman_turu")).rows[0].n;
    });
    assert.equal(n, 21);
  } finally { await havuz.end(); }
});
