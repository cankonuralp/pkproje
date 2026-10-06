/* OLUMSUZ KANIT — tests/saglik.test.ts (350) neyi koruyor. Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): göçler geçici klasöre kopyalanır, 0051'de
   "zorlanmış mı" denetimi bellekte kaldırılır. O zaman RLS'si açık ama ZORLANMAMIŞ bir kiracı tablosu (tablo sahibi politikayı aşar) sağlam görünür. */
import assert from "node:assert/strict";
import { copyFileSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import { GOC_KLASORU } from "../../src/server/db/goc.ts";
import type { GomuluKume } from "../../src/server/db/gomulu.ts";
import { havuzKur } from "../../src/server/db/kiraci.ts";
import { saglikOku } from "../../src/server/db/saglik.ts";
import { testKumesi } from "../yardimci/kume.ts";
import { supabaseBenzeri, type SupabaseBenzeri } from "../yardimci/supabase.ts";

const ESKI = "WHERE NOT relrowsecurity OR NOT relforcerowsecurity)";
let kume: GomuluKume, supa: SupabaseBenzeri;
const gecici = mkdtempSync(join(tmpdir(), "saglik-bozan-"));

before(async () => {
  kume = await testKumesi();
  const klasor = join(gecici, "gocler");
  mkdirSync(klasor);
  for (const ad of readdirSync(GOC_KLASORU)) {
    if (!ad.endsWith(".sql")) continue;
    if (ad.startsWith("0051_")) {
      const k = readFileSync(join(GOC_KLASORU, ad), "utf8");
      assert.ok(k.includes(ESKI), "bozulacak satır göçte yok");
      writeFileSync(join(klasor, ad), k.replace(ESKI, () => "WHERE NOT relrowsecurity)"));
    } else copyFileSync(join(GOC_KLASORU, ad), join(klasor, ad));
  }
  supa = await supabaseBenzeri(kume, "saglik_bozuk", klasor);
});
after(async () => { await supa?.kapat(); await kume?.durdur(); rmSync(gecici, { recursive: true, force: true }); });

test("zorlanmış mı denetimi kalkınca RLS'si açık ama zorlanmamış kiracı tablosu sağlam görünür (kilidin koruduğu açık)", async () => {
  await supa.sahip.query("CREATE TABLE sizinti_deneme (id int, firma_id uuid)");
  await supa.sahip.query("ALTER TABLE sizinti_deneme ENABLE ROW LEVEL SECURITY");
  await supa.sahip.query("CREATE POLICY sizinti_deneme_p ON sizinti_deneme USING (true)");
  const h = havuzKur({ ...kume.uygulama, database: "saglik_bozuk" });
  try {
    assert.equal((await saglikOku(h)).rls_eksik, 0, "bozuk: zorlanmamış tablo yakalanmadı");
  } finally { await h.end(); }
});
