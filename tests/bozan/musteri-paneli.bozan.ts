/* OLUMSUZ KANIT — tests/musteri-paneli.test.ts neyi koruyor (319; göç 0030). Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): göçler / modül dosyası
   geçici klasöre kopyalanır, bellekte bozulur, kopyadan koşulur.
   1. 0030'daki tesis kısıtı olmasaydı müşteri rolü kiracı politikasından geçen BÜTÜN tesisleri görürdü (başka müşterinin tesisleri).
   2. Uygulama rolü müşteri rolünü DEVRALSAYDI (INHERIT FALSE olmasaydı) kısıtlayıcı politikalar personel işlemine de uygulanır, firma ekranları
      boş kalırdı.
   3. (321, 0032) Plan sütun sınırı olmasaydı müşteri planın künyesini (firma adı, adres, SGK), açanı ve açıklamasını okurdu.
   4. (321, 0032) Açık plan süzgeci olmasaydı müşteri reddedilen planı "planlanan kontrol" diye görürdü.
   5. (319 incelemesi, 0033) Uygunsuzluk kendi sürümünün açıklığına bağlanmasaydı revizyonla geçersiz kalmış sürümün kusuru müşteriye görünürdü.
   6. (0033) Pasif müşterinin oturumları düşürülmeseydi yeniden etkinleşince okunmamış eski belirteç geçerli olurdu.
   7. (0033) Müşterinin kayıtlı e-postası kullanıcı adı sayılmasaydı personel hesabı o adresi alır, müşterinin ana girişi açılamazdı.
   8. (0033) Parola değişince kilit sıfırlanmasaydı yeni geçici parolanın sahibi kilitli kalırdı. */
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

const SON_SURUM = `
           AND EXISTS (SELECT 1 FROM rapor_surumu s WHERE s.firma_id = uygunsuzluk.firma_id AND s.id = uygunsuzluk.surum_id)`;
const PASIF_OTURUM = `    DELETE FROM musteri_oturum o USING musteri_hesap h
      WHERE o.firma_id = NEW.firma_id AND h.firma_id = NEW.firma_id AND h.id = o.musteri_hesap_id AND h.musteri_id = NEW.id;
`;
const MUSTERI_EPOSTA = `
         OR EXISTS (SELECT 1 FROM musteri c WHERE c.firma_id = NEW.firma_id AND c.eposta = NEW.eposta);`;
const KILIT_SIFIR = "    IF NEW.parola_ozeti IS DISTINCT FROM OLD.parola_ozeti THEN NEW.hatali_deneme := 0; NEW.kilit_bitis := NULL; END IF;\n";
const HEX = (n: number) => n.toString(16).padStart(64, "0");

test("0033'teki son sürüm şartı kalkınca revizyonla geçersiz kalmış sürümün kusuru müşteriye görünür (kilidin koruduğu açık)", async () => {
  const { havuz, A, m1 } = await bozuk("musteri_bozuk5", SON_SURUM, "", "0033_");
  const supa = acilan.at(-1)!.supa;
  const t = (await supa.sahip.query<{ id: string }>("SELECT id::text FROM tesis WHERE firma_id = $1 AND musteri_id = $2 LIMIT 1", [A, m1])).rows[0].id;
  /* kurulum süper kullanıcıyla, tetiksiz: raporun R0 ve R1 imzalı sürümleri; R0'ın kusuru başka muayeneyle "giderildi" kapanmış */
  await supa.sahip.query("SET session_replication_role = replica");
  try {
    const q = (sql: string, p: unknown[]) => supa.sahip.query<{ id: string }>(sql, p);
    const rapor = "11111111-1111-4111-8111-111111111111", k = "22222222-2222-4222-8222-222222222222";
    const surum = async (rev: number) => (await q(`INSERT INTO rapor_surumu (firma_id, rapor_id, revizyon, no, plan_id, ekipman_id, tur_id, format_id, tesis_id, musteri_id,
      imzasiz_dosya, imzali_dosya, imzali_sha256, imza_yontem, kunye, personel, icerik)
      VALUES ($1, $2, $3, 'DA-0126-0001', $4, $4, $4, $4, $5, $6, $4, $4, $7, 'dosya', '{}', '{}', '{}') RETURNING id::text`, [A, rapor, rev, k, t, m1, HEX(rev)])).rows[0].id;
    const r0 = await surum(0), r1 = await surum(1);
    await q(`INSERT INTO uygunsuzluk (firma_id, surum_id, rapor_id, ekipman_id, tesis_id, musteri_id, kaynak, ref, metin, kapanis, kapatan_surum, kapandi)
      VALUES ($1, $2, $3, $4, $5, $6, 'madde', 'k1', 'Eski sürümün kusuru', 'giderildi', $7, now())`, [A, r0, rapor, k, t, m1, r1]);
  } finally { await supa.sahip.query("SET session_replication_role = origin"); }
  const n = (await kiraciIcinde(havuz, A, (db) => db.sorgu<{ n: number }>("SELECT count(*)::int AS n FROM uygunsuzluk"), { musteri: { id: m1, tesisler: null } })).rows[0].n;
  assert.equal(n, 1, "eski sürümün kusuru müşteriye göründü");
});

test("0033'teki pasif oturum kuralı kalkınca pasif müşterinin oturumu düşmez", async () => {
  const { A, m1 } = await bozuk("musteri_bozuk6", PASIF_OTURUM, "", "0033_");
  const supa = acilan.at(-1)!.supa;
  const h = (await supa.sahip.query<{ id: string }>(`INSERT INTO musteri_hesap (firma_id, musteri_id, ana, eposta, ad, parola_ozeti, durum)
    VALUES ($1, $2, true, 'pasif@deneme-musteri.example', 'Deneme', 'scrypt$x', 'etkin') RETURNING id::text`, [A, m1])).rows[0].id;
  await supa.sahip.query("INSERT INTO musteri_oturum (ozet, firma_id, musteri_hesap_id, bitis) VALUES ($1, $2, $3, now() + interval '1 day')", [HEX(7), A, h]);
  await supa.sahip.query("UPDATE musteri SET pasif = now() WHERE id = $1", [m1]);
  const n = (await supa.sahip.query<{ n: number }>("SELECT count(*)::int AS n FROM musteri_oturum WHERE musteri_hesap_id = $1", [h])).rows[0].n;
  assert.equal(n, 1, "pasif müşterinin oturumu kaldı");
});

test("0033'teki müşteri e-postası kuralı kalkınca personel hesabı müşterinin kayıtlı e-postasını alır", async () => {
  const { havuz, A, m1 } = await bozuk("musteri_bozuk7", MUSTERI_EPOSTA, ";", "0033_");
  const supa = acilan.at(-1)!.supa;
  await supa.sahip.query("UPDATE musteri SET eposta = 'iletisim@deneme-musteri.example' WHERE id = $1", [m1]);
  const r = await kiraciIcinde(havuz, A, (db) => db.sorgu("INSERT INTO hesap (eposta, ad, roller, durum) VALUES ('iletisim@deneme-musteri.example', 'x', '{planlama}', 'etkin') RETURNING id"));
  assert.equal(r.rowCount, 1, "personel hesabı müşterinin e-postasını aldı");
});

test("0033'teki kilit sıfırlama kalkınca yeni parolada giriş kilitli kalır", async () => {
  const { A, m1 } = await bozuk("musteri_bozuk8", KILIT_SIFIR, "", "0033_");
  const supa = acilan.at(-1)!.supa;
  const h = (await supa.sahip.query<{ id: string }>(`INSERT INTO musteri_hesap (firma_id, musteri_id, ana, eposta, ad, parola_ozeti, durum, hatali_deneme, kilit_bitis)
    VALUES ($1, $2, true, 'kilit@deneme-musteri.example', 'Deneme', 'scrypt$x', 'etkin', 0, now() + interval '15 minutes') RETURNING id::text`, [A, m1])).rows[0].id;
  await supa.sahip.query("UPDATE musteri_hesap SET parola_ozeti = 'scrypt$y', durum = 'ilk' WHERE id = $1", [h]);
  const k = (await supa.sahip.query<{ k: Date | null }>("SELECT kilit_bitis AS k FROM musteri_hesap WHERE id = $1", [h])).rows[0].k;
  assert.ok(k, "kilit kaldı");
});
