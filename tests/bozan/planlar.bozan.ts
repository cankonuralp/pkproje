/* OLUMSUZ KANIT — tests/planlar.test.ts neyi koruyor (309). Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): göçler geçici klasöre kopyalanır, 0023'teki
   iki tetik bellekte çıkarılır. (1) Kod geçmişi tetiği olmasaydı ekipmanın değiştirilen eski kodu başka bir ekipmana verilirdi (etiketteki eski kodla
   arayan yanlış ekipmanı bulur). (2) Proje no tetiği olmasaydı planın numarası sonradan değişirdi (raporlar ve muhasebe ona bağlanır). */
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

const KOD = "CREATE OR REPLACE TRIGGER ekipman_kodu_kaydet AFTER INSERT OR UPDATE OF kod ON ekipman FOR EACH ROW EXECUTE FUNCTION ekipman_kodu_kaydet();";
const NO = "CREATE OR REPLACE TRIGGER plan_no_degismez BEFORE UPDATE ON plan FOR EACH ROW EXECUTE FUNCTION plan_no_degismez();";
let kume: GomuluKume;
let supa: SupabaseBenzeri;
let havuz: Havuz;
let A: string, tesis: string, tur: string;
const gecici = mkdtempSync(join(tmpdir(), "plan-bozan-"));

before(async () => {
  kume = await testKumesi();
  const klasor = join(gecici, "gocler");
  mkdirSync(klasor);
  for (const ad of readdirSync(GOC_KLASORU)) {
    if (!ad.endsWith(".sql")) continue;
    if (ad.startsWith("0023_")) {
      const k = readFileSync(join(GOC_KLASORU, ad), "utf8");
      assert.ok(k.includes(KOD) && k.includes(NO), "bozulacak satırlar kaynakta yok");
      writeFileSync(join(klasor, ad), k.replace(KOD, "").replace(NO, ""));
    } else copyFileSync(join(GOC_KLASORU, ad), join(klasor, ad));
  }
  supa = await supabaseBenzeri(kume, "plan_bozuk", klasor);
  [A] = (await supa.sahip.query<{ id: string }>("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-a', 'Deneme A', 'DA') RETURNING id")).rows.map((r) => r.id);
  havuz = havuzKur({ ...kume.uygulama, database: "plan_bozuk" });
  [tesis, tur] = await kiraciIcinde(havuz, A, async (db) => {
    const m = (await db.sorgu<{ id: string }>("INSERT INTO musteri (unvan, kisa) VALUES ('Deneme Sanayi A.Ş.', 'Deneme') RETURNING id::text")).rows[0].id;
    const t = (await db.sorgu<{ id: string }>("INSERT INTO tesis (musteri_id, ad) VALUES ($1, 'Merkez') RETURNING id::text", [m])).rows[0].id;
    const u = (await db.sorgu<{ id: string }>("INSERT INTO ekipman_turu (kod, ad, grup, brans, periyot) VALUES ('HT', 'Hava tankı', 'basincli', 'm', 12) RETURNING id::text")).rows[0].id;
    return [t, u];
  });
});
after(async () => { await havuz?.end(); await supa?.kapat(); await kume?.durdur(); rmSync(gecici, { recursive: true, force: true }); });

test("kod geçmişi tetiği olmayınca değiştirilen eski kod başka ekipmana verilir (kilidin koruduğu açık)", async () => {
  await kiraciIcinde(havuz, A, async (db) => {
    const x = (await db.sorgu<{ id: string }>("INSERT INTO ekipman (tesis_id, tur_id, kod, ekleyen) VALUES ($1, $2, 'HT-1001', 'x') RETURNING id::text", [tesis, tur])).rows[0].id;
    await db.sorgu("UPDATE ekipman SET kod = 'HT-2001' WHERE id = $1", [x]);
    await db.sorgu("INSERT INTO ekipman (tesis_id, tur_id, kod, ekleyen) VALUES ($1, $2, 'HT-1001', 'x')", [tesis, tur]);
  });
  const n = (await supa.sahip.query<{ n: string }>("SELECT count(*) AS n FROM ekipman WHERE kod IN ('HT-1001', 'HT-2001')")).rows[0].n;
  assert.equal(Number(n), 2, "eski kod yeni ekipmana verildi");
});

test("proje no tetiği olmayınca planın numarası sonradan değişir", async () => {
  await kiraciIcinde(havuz, A, async (db) => {
    const p = (await db.sorgu<{ id: string }>("INSERT INTO plan (no, tesis_id, baslangic, bitis, firma_adi, acan) VALUES ('P-0126-001', $1, current_date, current_date, 'x', 'x') RETURNING id::text", [tesis])).rows[0].id;
    await db.sorgu("UPDATE plan SET no = 'P-0126-999' WHERE id = $1", [p]);
  });
  assert.equal((await supa.sahip.query("SELECT 1 FROM plan WHERE no = 'P-0126-999'")).rowCount, 1, "numara değişti");
});
