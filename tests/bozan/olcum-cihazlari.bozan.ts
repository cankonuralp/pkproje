/* OLUMSUZ KANIT — tests/olcum-cihazlari.test.ts neyi koruyor. Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): göçler geçici klasöre kopyalanır,
   0014'te kalibrasyon → cihaz bağı yalnız cihaz kimliğine gevşetilir. O zaman B firması kendi bağlamında A'nın cihazına kalibrasyon kaydı yazardı
   (yabancı anahtar denetimi satır güvenliğine bakmaz): A'nın cihazının "geçerli bitişi" B'nin yazdığı kayıtla uzardı. */
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

const BAG = "  FOREIGN KEY (firma_id, cihaz_id) REFERENCES olcum_cihazi (firma_id, id),";
let kume: GomuluKume;
let supa: SupabaseBenzeri;
const gecici = mkdtempSync(join(tmpdir(), "cihaz-bozan-"));

before(async () => {
  kume = await testKumesi();
  const klasor = join(gecici, "gocler");
  mkdirSync(klasor);
  for (const ad of readdirSync(GOC_KLASORU)) {
    if (!ad.endsWith(".sql")) continue;
    if (ad.startsWith("0014_")) {
      const k = readFileSync(join(GOC_KLASORU, ad), "utf8");
      assert.ok(k.includes(BAG), "bozulacak satır kaynakta yok");
      writeFileSync(join(klasor, ad), k.replace(BAG, "  FOREIGN KEY (cihaz_id) REFERENCES olcum_cihazi (id),"));
    } else copyFileSync(join(GOC_KLASORU, ad), join(klasor, ad));
  }
  supa = await supabaseBenzeri(kume, "cihaz_bozuk", klasor);
});
after(async () => { await supa?.kapat(); await kume?.durdur(); rmSync(gecici, { recursive: true, force: true }); });

test("bağ yalnız cihaz kimliğiyle olunca B firması A'nın cihazına kalibrasyon yazar (kilidin koruduğu açık)", async () => {
  const [A, B] = (await supa.sahip.query<{ id: string }>(
    "INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-a', 'Deneme A', 'DA'), ('deneme-b', 'Deneme B', 'DB') RETURNING id")).rows.map((r) => r.id);
  const havuz = havuzKur({ ...kume.uygulama, database: "cihaz_bozuk" });
  try {
    const c = await kiraciIcinde(havuz, A, async (db) => {
      const t = (await db.sorgu<{ id: string }>("INSERT INTO cihaz_turu (ad) VALUES ('Deneme ölçer') RETURNING id::text")).rows[0].id;
      return (await db.sorgu<{ id: string }>("INSERT INTO olcum_cihazi (kod, tur_id) VALUES ('OC-1', $1) RETURNING id::text", [t])).rows[0].id;
    });
    await kiraciIcinde(havuz, B, (db) => db.sorgu("INSERT INTO kalibrasyon (cihaz_id, tarih, bitis, lab, sertifika, sonuc) VALUES ($1, '2026-01-01', '2099-01-01', 'Sahte', 'X', 'uygun')", [c]));
    const n = await supa.sahip.query("SELECT 1 FROM kalibrasyon k JOIN olcum_cihazi c ON c.id = k.cihaz_id WHERE k.firma_id <> c.firma_id");
    assert.equal(n.rowCount, 1, "B'nin kaydı A'nın cihazına bağlandı");
  } finally { await havuz.end(); }
});
