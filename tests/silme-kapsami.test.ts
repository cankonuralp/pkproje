/* NEREDEN GELDİ: 357 — kesin silme tek mekanizma (src/server/db/silici.ts, göç 0054 …; reisim 2026-10-07 "eklenebilen şeyler silinemiyor"). ANAYASA
   13.9 aynası, GERÇEK PostgreSQL'de (göçleri uygulanmış veritabanının kataloğu):
   · SILINEBILIR'deki her tabloya başvuran HER yabancı anahtar ya "kullanım" (silmeyi engeller) ya "birlikte" (kayıtla silinir) listesinde — yeni bir bağ
     eklenip silme işlevi güncellenmezse düşer (sessizce yetim satır ya da yanlış "kullanılmadı" kalmaz);
   · silme ve kullanım işlevi tanımlayıcı-yetkili, arama yolu sabit, PUBLIC çalıştıramaz, uygulama rolü çalıştırır;
   · uygulama rolünün bu tablolarda DELETE hakkı YOK (silme yalnız işlevle);
   · public şemasındaki her "<ad>_sil(uuid, text)" tanımlayıcı-yetkili işlev SILINEBILIR'de (kayıtsız silme işlevi yok).
   Olumsuz kanıt: tests/bozan/kesin-silme.bozan.ts. */
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { GomuluKume } from "../src/server/db/gomulu.ts";
import { SILINEBILIR } from "../src/server/db/silici.ts";
import { testKumesi } from "./yardimci/kume.ts";

type Istemci = ReturnType<GomuluKume["sahipIstemci"]>;
let kume: GomuluKume, s: Istemci;
before(async () => { kume = await testKumesi(); s = kume.sahipIstemci(); await s.connect(); });
after(async () => { await s?.end(); await kume?.durdur(); });

/** tabloya başvuran yabancı anahtarlar "tablo.sütun" (firma_id hariç — her bileşik anahtarda var) */
async function basvurular(c: Istemci, tablo: string): Promise<string[]> {
  return (await c.query<{ b: string }>(
    `SELECT DISTINCT cl.relname || '.' || a.attname AS b FROM pg_constraint k JOIN pg_class cl ON cl.oid = k.conrelid
       JOIN pg_attribute a ON a.attrelid = k.conrelid AND a.attnum = ANY (k.conkey)
     WHERE k.contype = 'f' AND k.confrelid = $1::regclass AND a.attname <> 'firma_id'`, [`public.${tablo}`])).rows.map((r) => r.b).sort();
}

test("her yabancı anahtar kullanım ya da birlikte listesinde; işlevler tanımlayıcı-yetkili, PUBLIC'e kapalı; uygulama rolünün DELETE'i yok", async () => {
  for (const [tablo, t] of Object.entries(SILINEBILIR)) {
    assert.deepEqual(await basvurular(s, tablo), [...t.fk.kullanim, ...t.fk.birlikte].sort(), `${tablo}: yabancı anahtarlar silici.ts'teki listeyle aynı`);
    for (const islev of [t.kullanim, t.sil]) {
      const r = (await s.query<{ guvenli: boolean; yol: boolean; herkes: boolean; uygulama: boolean }>(
        `SELECT p.prosecdef AS guvenli, coalesce(array_to_string(p.proconfig, ',') LIKE '%search_path=%', false) AS yol,
           EXISTS (SELECT 1 FROM aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) x WHERE x.grantee = 0 AND x.privilege_type = 'EXECUTE') AS herkes,
           has_function_privilege('probata_uygulama', p.oid, 'EXECUTE') AS uygulama
         FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public' AND p.proname = $1`, [islev])).rows;
      assert.equal(r.length, 1, `${islev} tek tanım`);
      assert.deepEqual(r[0], { guvenli: true, yol: true, herkes: false, uygulama: true }, islev);
    }
    assert.equal((await s.query<{ d: boolean }>("SELECT has_table_privilege('probata_uygulama', $1, 'DELETE') AS d", [`public.${tablo}`])).rows[0].d, false, `${tablo}: DELETE yok`);
  }
});

test("kayıtsız kesin silme işlevi yok: her <ad>_sil(uuid, text) SILINEBILIR'de", async () => {
  const islevler = (await s.query<{ ad: string }>(
    `SELECT p.proname AS ad FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public' AND p.proname LIKE '%\\_sil' AND p.prosecdef AND pg_get_function_identity_arguments(p.oid) = 'p_id uuid, p_kim text'`)).rows.map((r) => r.ad).sort();
  assert.deepEqual(islevler, Object.values(SILINEBILIR).map((t) => t.sil).sort());
});
