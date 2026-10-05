/* OLUMSUZ KANIT — tests/musteri-paneli.test.ts neyi koruyor (319; göç 0030). Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): göçler / modül dosyası
   geçici klasöre kopyalanır, bellekte bozulur, kopyadan koşulur.
   1. 0030'daki tesis kısıtı olmasaydı müşteri rolü kiracı politikasından geçen BÜTÜN tesisleri görürdü (başka müşterinin tesisleri).
   2. Uygulama rolü müşteri rolünü DEVRALSAYDI (INHERIT FALSE olmasaydı) kısıtlayıcı politikalar personel işlemine de uygulanır, firma ekranları
      boş kalırdı.
   3. (321, 0032) Plan sütun sınırı olmasaydı müşteri planın künyesini (firma adı, adres, SGK), açanı ve açıklamasını okurdu.
   4. (321, 0032) Açık plan süzgeci olmasaydı müşteri reddedilen planı "planlanan kontrol" diye görürdü. */
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

const TESIS = `  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tesis' AND policyname = 'tesis_musteri') THEN
    CREATE POLICY tesis_musteri ON tesis AS RESTRICTIVE FOR SELECT TO probata_musteri USING (musteri_id = gecerli_musteri() AND musteri_tesis_gorur(id));
  END IF;
`;
const DEVRALMA = "GRANT probata_musteri TO probata_uygulama WITH INHERIT FALSE, SET TRUE;";

let kume: GomuluKume;
const gecici = mkdtempSync(join(tmpdir(), "musteri-paneli-bozan-"));
const acilan: { supa: SupabaseBenzeri; havuz: Havuz }[] = [];

/** göçleri bozarak (varsayılan 0030) Supabase taklidi veritabanı açar */
async function bozuk(ad: string, eski: string, yeni: string, goc = "0030_") {
  const klasor = join(gecici, ad);
  mkdirSync(klasor);
  for (const g of readdirSync(GOC_KLASORU)) {
    if (!g.endsWith(".sql")) continue;
    if (g.startsWith(goc)) {
      const k = readFileSync(join(GOC_KLASORU, g), "utf8");
      assert.ok(k.includes(eski), "bozulacak satır kaynakta yok");
      writeFileSync(join(klasor, g), k.replace(eski, yeni));
    } else copyFileSync(join(GOC_KLASORU, g), join(klasor, g));
  }
  const supa = await supabaseBenzeri(kume, ad, klasor);
  const havuz = havuzKur({ ...kume.uygulama, database: ad });
  acilan.push({ supa, havuz });
  const A = (await supa.sahip.query<{ id: string }>("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-a', 'Deneme A', 'DA') RETURNING id")).rows[0].id;
  /* kurulum süper kullanıcıyla (firma açıkça): devralma bozulunca uygulama rolünün kendi yazması (RETURNING) da müşteri kısıtına takılır —
     ölçülen şey kurulum değil, sonraki okuma */
  const q = async (sql: string, p: unknown[]) => (await supa.sahip.query<{ id: string }>(sql, p)).rows[0].id;
  const m1 = await q("INSERT INTO musteri (firma_id, unvan, kisa) VALUES ($1, 'Deneme Bir A.Ş.', 'Deneme Bir') RETURNING id::text", [A]);
  const m2 = await q("INSERT INTO musteri (firma_id, unvan, kisa) VALUES ($1, 'Deneme İki A.Ş.', 'Deneme İki') RETURNING id::text", [A]);
  await q("INSERT INTO tesis (firma_id, musteri_id, ad) VALUES ($1, $2, 'Merkez') RETURNING id::text", [A, m1]);
  await q("INSERT INTO tesis (firma_id, musteri_id, ad) VALUES ($1, $2, 'Fabrika') RETURNING id::text", [A, m2]);
  return { havuz, A, m1, m2 };
}

before(async () => { kume = await testKumesi(); });
after(async () => {
  for (const x of acilan) { await x.havuz.end(); await x.supa.kapat(); }
  await kume?.durdur();
  rmSync(gecici, { recursive: true, force: true });
});

test("0030'daki tesis kısıtı kalkınca müşteri başka müşterinin tesisini görür (kilidin koruduğu açık)", async () => {
  const { havuz, A, m1 } = await bozuk("musteri_bozuk1", TESIS, "");
  const n = (await kiraciIcinde(havuz, A, (db) => db.sorgu<{ n: number }>("SELECT count(*)::int AS n FROM tesis"), { musteri: { id: m1, tesisler: null } })).rows[0].n;
  assert.equal(n, 2, "müşteri iki müşterinin tesislerini gördü");
});

test("uygulama rolü müşteri rolünü devralınca personel işlemi de müşteri kısıtına takılır (firma ekranı boş)", async () => {
  const { havuz, A } = await bozuk("musteri_bozuk2", DEVRALMA, "GRANT probata_musteri TO probata_uygulama WITH INHERIT TRUE, SET TRUE;");
  const n = (await kiraciIcinde(havuz, A, (db) => db.sorgu<{ n: number }>("SELECT count(*)::int AS n FROM tesis"))).rows[0].n;
  assert.equal(n, 0, "personel işlemi müşteri kısıtına takıldı");
});

const PLAN_SUTUN = "GRANT SELECT (id, firma_id, tesis_id, baslangic, bitis, durum) ON plan TO probata_musteri;";
const ACIK_PLAN = "USING (durum IN ('bekliyor', 'kabul', 'denetimde') AND musteri_tesis_gorur(tesis_id)";

test("0032'deki sütun sınırı kalkınca müşteri planın künyesini ve açanını okur (kilidin koruduğu açık)", async () => {
  const { havuz, A, m1 } = await bozuk("musteri_bozuk3", PLAN_SUTUN, "GRANT SELECT ON plan TO probata_musteri;", "0032_");
  const r = await kiraciIcinde(havuz, A, (db) => db.sorgu("SELECT firma_adi, adres, sgk, acan, aciklama FROM plan"), { musteri: { id: m1, tesisler: null } });
  assert.ok(Array.isArray(r.rows), "künye sütunları okundu");
});

test("0032'deki açık plan süzgeci kalkınca müşteri reddedilen planı görür", async () => {
  const supaAd = "musteri_bozuk4";
  const { havuz, A, m1 } = await bozuk(supaAd, ACIK_PLAN, "USING (musteri_tesis_gorur(tesis_id)", "0032_");
  const supa = acilan.at(-1)!.supa;
  const tesis = (await supa.sahip.query<{ id: string }>("SELECT id::text FROM tesis WHERE firma_id = $1 AND musteri_id = $2 LIMIT 1", [A, m1])).rows[0].id;
  /* kurulum süper kullanıcıyla, tetiksiz (akış kuralları bu kanıtın konusu değil): reddedilmiş plan */
  await supa.sahip.query("SET session_replication_role = replica");
  try {
    await supa.sahip.query(`INSERT INTO plan (firma_id, no, tesis_id, baslangic, bitis, durum, firma_adi, acan, red, red_eden, red_gerekce)
      VALUES ($1, 'P-0126-001', $2, '2026-11-20', '2026-11-20', 'reddedildi', 'Deneme', 'Deneme', now(), 'Deneme', 'Başka tesisteyim')`, [A, tesis]);
  } finally { await supa.sahip.query("SET session_replication_role = origin"); }
  const n = (await kiraciIcinde(havuz, A, (db) => db.sorgu<{ n: number }>("SELECT count(*)::int AS n FROM plan WHERE durum = 'reddedildi'"),
    { musteri: { id: m1, tesisler: null } })).rows[0].n;
  assert.equal(n, 1, "reddedilen plan müşteriye göründü");
});
