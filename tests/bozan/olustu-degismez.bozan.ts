/* OLUMSUZ KANIT — tests/ice-aktarma.test.ts "oluşturulma zamanı değişmez" neyi koruyor (0048; 337–339 incelemesi). Kaynak diskte DEĞİŞTİRİLMEZ
   (anayasa 13.11): göçler geçici klasöre kopyalanır, 0048'in olustu korumasını kuran döngü bellekte boşaltılır. O zaman uygulama rolü eski bir
   personeli önce "yeni" gösterir (olustu = now()), sahte içe aktarma listesine yazar ve geri alma işleviyle (SECURITY DEFINER) SİLDİRİR — silme hakkı
   olmayan rol fiilen silme hakkı kazanır. */
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

const KORUMA = "    EXECUTE format('CREATE OR REPLACE TRIGGER %I BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION olustu_degismez()', t || '_olustu_degismez', t);\n";
let kume: GomuluKume;
let supa: SupabaseBenzeri;
const gecici = mkdtempSync(join(tmpdir(), "olustu-bozan-"));

before(async () => {
  kume = await testKumesi();
  const klasor = join(gecici, "gocler");
  mkdirSync(klasor);
  for (const ad of readdirSync(GOC_KLASORU)) {
    if (!ad.endsWith(".sql")) continue;
    if (ad.startsWith("0048_")) {
      const k = readFileSync(join(GOC_KLASORU, ad), "utf8");
      assert.ok(k.includes(KORUMA), "bozulacak satır kaynakta yok");
      writeFileSync(join(klasor, ad), k.replace(KORUMA, "    NULL;\n"));
    } else copyFileSync(join(GOC_KLASORU, ad), join(klasor, ad));
  }
  supa = await supabaseBenzeri(kume, "olustu_bozuk", klasor);
});
after(async () => { await supa?.kapat(); await kume?.durdur(); rmSync(gecici, { recursive: true, force: true }); });

test("olustu korunmazsa eski personel sahte içe aktarma listesiyle geri alma işlevine sildirilir (kilidin koruduğu açık)", async () => {
  const [A] = (await supa.sahip.query<{ id: string }>("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-a', 'Deneme A', 'DA') RETURNING id")).rows.map((r) => r.id);
  const havuz = havuzKur({ ...kume.uygulama, database: "olustu_bozuk" });
  try {
    const hesap = (await kiraciIcinde(havuz, A, (db) => db.sorgu<{ id: string }>(
      "INSERT INTO hesap (eposta, ad, roller, durum) VALUES ('yon@deneme-a.example', 'Deneme', '{firma_yoneticisi}', 'etkin') RETURNING id::text"))).rows[0].id;
    const eski = (await kiraciIcinde(havuz, A, (db) => db.sorgu<{ id: string }>(
      "INSERT INTO personel (ad, basla, meslek) VALUES ('Deneme Eski', '2024-01-01', 'mak-muh') RETURNING id::text"))).rows[0].id;
    await kiraciIcinde(havuz, A, async (db) => {
      await db.sorgu("UPDATE personel SET olustu = now() WHERE id = $1", [eski]);
      const ia = (await db.sorgu<{ id: string }>("INSERT INTO ice_aktarim (tur, dosya, adet, kayitlar, kim) VALUES ('personel', 'x.xlsx', 1, $1, 'Deneme') RETURNING id::text",
        [JSON.stringify([{ t: "personel", id: eski }])])).rows[0].id;
      await db.sorgu("SELECT ice_aktarim_geri_al($1, 'Deneme', false)", [ia]);
    }, { hesapId: hesap });
    const n = (await kiraciIcinde(havuz, A, (db) => db.sorgu<{ n: number }>("SELECT count(*)::int AS n FROM personel WHERE id = $1", [eski]))).rows[0].n;
    assert.equal(n, 0, "bozuk: eski personel silindi");
  } finally { await havuz.end(); }
});
