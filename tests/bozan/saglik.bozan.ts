/* OLUMSUZ KANIT — tests/saglik.test.ts (350, 354) neyi koruyor. Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): göçler geçici klasöre kopyalanır, işlevin
   GEÇERLİ tanımında (0053; 0051'i ezer) bellekte bozulur:
   1. "zorlanmış mı" denetimi kalkınca RLS'si açık ama ZORLANMAMIŞ bir kiracı tablosu (tablo sahibi politikayı aşar) sağlam görünür.
   2. bağlanan rol yerine adı sabit rol ölçülünce uygulama ayrıcalıklı rolle (sahip) bağlansa da "kısıtlı" görünür. */
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
const ROL = "FROM pg_roles r WHERE r.rolname = session_user)";
let kume: GomuluKume, supa: SupabaseBenzeri;
const gecici = mkdtempSync(join(tmpdir(), "saglik-bozan-"));

before(async () => {
  kume = await testKumesi();
  const klasor = join(gecici, "gocler");
  mkdirSync(klasor);
  for (const ad of readdirSync(GOC_KLASORU)) {
    if (!ad.endsWith(".sql")) continue;
    if (ad.startsWith("0053_")) {
      const k = readFileSync(join(GOC_KLASORU, ad), "utf8");
      assert.ok(k.includes(ESKI) && k.includes(ROL), "bozulacak satır göçte yok");
      writeFileSync(join(klasor, ad), k.replace(ESKI, () => "WHERE NOT relrowsecurity)").replace(ROL, () => "FROM pg_roles r WHERE r.rolname = 'probata_uygulama')"));
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

test("bağlanan rol yerine adı sabit rol ölçülünce sahip bağlantısı 'kısıtlı' görünür (kilidin koruduğu açık)", async () => {
  const v = (await supa.sahip.query<{ s: { uygulama_ayricalikli: boolean } }>("SELECT saglik_denetimi() AS s")).rows[0].s;
  assert.equal(v.uygulama_ayricalikli, false, "bozuk: RLS'yi aşan sahip rolü yakalanmadı");
});
