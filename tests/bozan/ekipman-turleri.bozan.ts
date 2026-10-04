/* OLUMSUZ KANIT — tests/ekipman-turleri.test.ts neyi koruyor. Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): göçler geçici klasöre kopyalanır,
   0013'teki "kod değişmez" tetiği bellekte çıkarılır. Tetik olmasaydı uygulamayı atlayan bir yazma (ya da ileride yazılacak hatalı bir modül) türün
   kodunu değiştirirdi; ekipman kodlarının öneki ile tür ayrışırdı. */
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

const TETIK = "CREATE OR REPLACE TRIGGER ekipman_turu_kod_degismez BEFORE UPDATE ON ekipman_turu FOR EACH ROW EXECUTE FUNCTION ekipman_turu_kod_degismez();";
let kume: GomuluKume;
let supa: SupabaseBenzeri;
const gecici = mkdtempSync(join(tmpdir(), "tur-bozan-"));

before(async () => {
  kume = await testKumesi();
  const klasor = join(gecici, "gocler");
  mkdirSync(klasor);
  for (const ad of readdirSync(GOC_KLASORU)) {
    if (!ad.endsWith(".sql")) continue;
    if (ad.startsWith("0013_")) {
      const k = readFileSync(join(GOC_KLASORU, ad), "utf8");
      assert.ok(k.includes(TETIK), "bozulacak satır kaynakta yok");
      writeFileSync(join(klasor, ad), k.replace(TETIK, ""));
    } else copyFileSync(join(GOC_KLASORU, ad), join(klasor, ad));
  }
  supa = await supabaseBenzeri(kume, "tur_bozuk", klasor);
});
after(async () => { await supa?.kapat(); await kume?.durdur(); rmSync(gecici, { recursive: true, force: true }); });

test("kod tetiği olmayınca türün kodu sonradan değişir (kilidin koruduğu açık)", async () => {
  const [A] = (await supa.sahip.query<{ id: string }>("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-a', 'Deneme A', 'DA') RETURNING id")).rows.map((r) => r.id);
  const havuz = havuzKur({ ...kume.uygulama, database: "tur_bozuk" });
  try {
    const id = (await kiraciIcinde(havuz, A, (db) => db.sorgu<{ id: string }>(
      "INSERT INTO ekipman_turu (kod, ad, grup, brans, periyot) VALUES ('DV', 'Deneme Vinç', 'kaldirma', 'm', 12) RETURNING id::text"))).rows[0].id;
    await kiraciIcinde(havuz, A, (db) => db.sorgu("UPDATE ekipman_turu SET kod = 'ZZ' WHERE id = $1", [id]));
    const k = await supa.sahip.query<{ kod: string }>("SELECT kod FROM ekipman_turu WHERE id = $1", [id]);
    assert.equal(k.rows[0].kod, "ZZ", "kod değişti");
  } finally { await havuz.end(); }
});
