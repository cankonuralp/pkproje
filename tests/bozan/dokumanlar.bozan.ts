/* OLUMSUZ KANIT — tests/dokumanlar.test.ts neyi koruyor. Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): göçler geçici klasöre kopyalanır, 0018'de
   "numara başına tek güncel sürüm" kısmi eşsiz dizini bellekte kaldırılır. O zaman aynı standardın iki sürümü birden güncel kalır — raporun
   kontrol metodu hangi sürümün yazılacağını bilemez (eski sürüm sessizce rapora geçebilir). */
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

const DIZIN = "CREATE UNIQUE INDEX IF NOT EXISTS standart_guncel ON standart (firma_id, no) WHERE bitti IS NULL AND kaldirildi IS NULL;";
let kume: GomuluKume;
let supa: SupabaseBenzeri;
const gecici = mkdtempSync(join(tmpdir(), "dok-bozan-"));

before(async () => {
  kume = await testKumesi();
  const klasor = join(gecici, "gocler");
  mkdirSync(klasor);
  for (const ad of readdirSync(GOC_KLASORU)) {
    if (!ad.endsWith(".sql")) continue;
    if (ad.startsWith("0018_")) {
      const k = readFileSync(join(GOC_KLASORU, ad), "utf8");
      assert.ok(k.includes(DIZIN), "bozulacak satır kaynakta yok");
      writeFileSync(join(klasor, ad), k.replace(DIZIN, ""));
    } else copyFileSync(join(GOC_KLASORU, ad), join(klasor, ad));
  }
  supa = await supabaseBenzeri(kume, "dok_bozuk", klasor);
});
after(async () => { await supa?.kapat(); await kume?.durdur(); rmSync(gecici, { recursive: true, force: true }); });

test("tek güncel sürüm dizini kalkınca aynı standardın iki sürümü birden güncel olur (kilidin koruduğu açık)", async () => {
  const [A] = (await supa.sahip.query<{ id: string }>("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-a', 'Deneme A', 'DA') RETURNING id")).rows.map((r) => r.id);
  const havuz = havuzKur({ ...kume.uygulama, database: "dok_bozuk" });
  try {
    await kiraciIcinde(havuz, A, async (db) => {
      await db.sorgu("INSERT INTO standart (no, surum_adi, konu, yukleyen) VALUES ('TS EN 280', '2016', 'Deneme konu', 'Deneme')");
      await db.sorgu("INSERT INTO standart (no, surum_adi, konu, yukleyen) VALUES ('TS EN 280', '2020', 'Deneme konu', 'Deneme')");
    });
    const n = await kiraciIcinde(havuz, A, (db) => db.sorgu<{ n: number }>("SELECT count(*)::int AS n FROM standart WHERE no = 'TS EN 280' AND bitti IS NULL"));
    assert.equal(n.rows[0].n, 2, "iki güncel sürüm");
  } finally { await havuz.end(); }
});
