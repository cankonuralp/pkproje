/* NEREDEN GELDİ: 2026-10-04 deneme yayını (reisim: "supabase açtım, extension olarak claude a bağladım"; pkproje.md §8.8 Supabase + Vercel, AB).
   Supabase projesinde ölçüldü: public şemasındaki her yeni tablo / işlev, herkese açık "anon" anahtarıyla çalışan hazır API'ye varsayılan olarak
   açılıyor; yönetilen veritabanına uygulama ağ üzerinden bağlanıyor. Aynı gün bağımsız güvenlik denetimi üç açık daha buldu (sessizce etkisiz
   kalabilen 0008, 0008'den önceki açık pencere, kopan bağlantının süreci düşürmesi). Bu dosya şu kapıları kilitler:
   1) 0000 + 0008: Supabase'in API rolleri şemamıza giremez — Supabase düzenini TAKLİT EDEN gerçek PostgreSQL'de, göçler süper kullanıcı OLMAYAN
      sahip rolüyle koşarak, rolün YERİNE geçilerek denenir; 0008 kendi sonucunu doğrular;
   2) 0009: uygulama rolünde sorgu ve boşta işlem süre sınırı;
   3) veritabanı bağlantısı: ağ üzerinden şifresiz bağlantı kurulmaz, TLS'de sunucu yalnız kilitli Supabase kökü ile doğrulanır; kopan bağlantı
      yakalanmamış istisnaya dönüşmez;
   4) yayın ayarı (vercel.json): uygulama AB'de (Frankfurt) koşar, derleme projenin kendi yolundan (telemetri kapalı, webpack) geçer.
   Olumsuz kanıt: tests/bozan/yayin.bozan.ts. */
import assert from "node:assert/strict";
import { X509Certificate } from "node:crypto";
import { readFileSync } from "node:fs";
import { after, before, test } from "node:test";
import { setTimeout as bekle } from "node:timers/promises";
import type pg from "pg";
import { ortamdanBaglanti } from "../src/server/db/havuz.ts";
import type { GomuluKume } from "../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde } from "../src/server/db/kiraci.ts";
import { SUPABASE_KOK_2021 } from "../src/server/db/kok-sertifika.ts";
import { testKumesi } from "./yardimci/kume.ts";
import { API_ROLLERI, supabaseBenzeri, type SupabaseBenzeri } from "./yardimci/supabase.ts";

let kume: GomuluKume;
let supa: SupabaseBenzeri;
let sahip: pg.Client;

before(async () => {
  kume = await testKumesi();
  supa = await supabaseBenzeri(kume, "supa");
  sahip = supa.sahip;
});
after(async () => {
  await supa?.kapat();
  await kume?.durdur();
});

/** rolün yerine geçip sorguyu dener; izin hatası → "red", başka sonuç → "acik" */
async function rolOlarak(rol: string, sorgu: string): Promise<"red" | "acik"> {
  await sahip.query("BEGIN");
  try {
    await sahip.query(`SET LOCAL ROLE ${rol}`);
    await sahip.query(sorgu);
    return "acik";
  } catch (e) {
    if ((e as { code?: string }).code === "42501") return "red";   // insufficient_privilege
    throw e;
  } finally {
    await sahip.query("ROLLBACK");
  }
}

test("0000 + 0008: Supabase API rolleri ve PUBLIC public şemasını kullanamaz (şema hakkı yok)", async () => {
  for (const r of [...API_ROLLERI, "public"]) {
    const s = await sahip.query<{ v: boolean }>("SELECT has_schema_privilege($1, 'public', 'USAGE') AS v", [r]);
    assert.equal(s.rows[0].v, false, `${r} public şemasını kullanabiliyor`);
  }
});

test("0000 + 0008: API rolü olarak hesap, oturum, göç kaydı okunamaz; firma_bul çağrılamaz; yazılamaz", async () => {
  for (const r of API_ROLLERI) {
    for (const sorgu of [
      // ad şemayla yazılır: şema hakkı yoksa yalın ad hiç çözülmez ("yok" der) — burada izin reddinin kendisi aranır
      "SELECT * FROM public.hesap", "SELECT * FROM public.oturum", "SELECT * FROM public.goc", "SELECT * FROM public.personel",
      "SELECT * FROM public.firma_sir", "SELECT public.firma_bul('deneme')", "SELECT public.gecerli_firma()",
      "INSERT INTO public.denetim_izi (firma_id, kim, ne) VALUES (gen_random_uuid(), 'x', 'y')",
      "DELETE FROM public.goc",
    ]) {
      assert.equal(await rolOlarak(r, sorgu), "red", `${r}: ${sorgu} açık`);
    }
  }
});

test("0000 + 0008: göçlerden SONRA göçü koşan rolün açtığı tablo ve işlev de API rollerine / PUBLIC'e verilmez", async () => {
  await supa.gocu.query("CREATE TABLE IF NOT EXISTS sonradan_tablo (x int)");
  await supa.gocu.query("CREATE OR REPLACE FUNCTION sonradan_islev() RETURNS int LANGUAGE sql AS 'SELECT 1'");
  for (const r of [...API_ROLLERI, "public"]) {
    const t = await sahip.query<{ t: boolean; f: boolean }>(
      "SELECT has_table_privilege($1, 'public.sonradan_tablo', 'SELECT') AS t, has_function_privilege($1, 'public.sonradan_islev()', 'EXECUTE') AS f", [r]);
    assert.deepEqual(t.rows[0], { t: false, f: false }, `${r} sonradan açılan nesneye erişebiliyor`);
  }
  await supa.gocu.query("DROP FUNCTION sonradan_islev(); DROP TABLE sonradan_tablo");
});

test("0008 sonucunu doğrular: hak geri gelmişse (ör. alınamamışsa) göç HATA verir, sessizce 'uygulandı' yazılmaz", async () => {
  const metin = readFileSync(new URL("../src/server/db/gocler/0008_dis_erisim_kapali.sql", import.meta.url), "utf8");
  const dogrulama = metin.slice(metin.indexOf("-- ── doğrulama"));
  assert.ok(dogrulama.length > 100, "0008'de doğrulama bölümü yok");
  await sahip.query("BEGIN");
  try {
    await sahip.query("GRANT USAGE ON SCHEMA public TO anon");
    await assert.rejects(sahip.query(dogrulama), /anon hâlâ public şemasını kullanabiliyor/);
  } finally {
    await sahip.query("ROLLBACK");
  }
  await sahip.query("BEGIN");
  try {
    await sahip.query("GRANT SELECT ON public.hesap TO authenticated");
    await assert.rejects(sahip.query(dogrulama), /authenticated hâlâ public şemasında 1 tablo/);
  } finally {
    await sahip.query("ROLLBACK");
  }
  await sahip.query("BEGIN");
  try {
    await sahip.query("GRANT EXECUTE ON FUNCTION public.firma_bul(text) TO PUBLIC");
    await assert.rejects(sahip.query(dogrulama), /public hâlâ public şemasında 1 işlevi/);
  } finally {
    await sahip.query("ROLLBACK");
  }
  await sahip.query(dogrulama);   // temiz durumda geçer
});

test("0008: göç kaydı RLS'li; uygulama rolü hâlâ çalışır (kiracı içinde okur, yazar; tetikler işler)", async () => {
  const goc = await sahip.query<{ r: boolean }>("SELECT relrowsecurity AS r FROM pg_class WHERE oid = 'public.goc'::regclass");
  assert.equal(goc.rows[0].r, true);
  const f = await sahip.query<{ id: string }>("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-s', 'Deneme S Muayene', 'DS') RETURNING id");
  const havuz = havuzKur({ ...kume.uygulama, database: "supa" });
  try {
    assert.equal((await havuz.query<{ f: string }>("SELECT firma_bul('deneme-s') AS f")).rows[0].f, f.rows[0].id);
    await kiraciIcinde(havuz, f.rows[0].id, (db) => db.sorgu("INSERT INTO denetim_izi (kim, ne) VALUES ('Deneme', 'Yayın denemesi')"));
    const n = await kiraciIcinde(havuz, f.rows[0].id, (db) => db.sorgu<{ n: number; h: string | null }>("SELECT count(*)::int AS n FROM denetim_izi"));
    assert.equal(n.rows[0].n, 1);
    // tetik işlevleri çalıştırma hakkı istemez: değiştirilemezlik tetiği uygulama rolünde de işler
    await assert.rejects(kiraciIcinde(havuz, f.rows[0].id, (db) => db.sorgu("UPDATE denetim_izi SET ne = 'x'")), /permission denied|değiştirilemez/);
    await assert.rejects(havuz.query("SELECT * FROM goc"), /permission denied/);
  } finally {
    await havuz.end();
  }
});

test("0000 / 0008 / 0009 idempotent: iki kez koşmak hata vermez", async () => {
  for (const ad of ["0000_dis_erisim_once.sql", "0008_dis_erisim_kapali.sql", "0009_rol_sinirlari.sql"]) {
    const metin = readFileSync(new URL(`../src/server/db/gocler/${ad}`, import.meta.url), "utf8");
    await supa.gocu.query(metin);
    await supa.gocu.query(metin);
  }
});

test("0009: uygulama rolünde sorgu 15 sn, işlem içinde boşta bekleme 30 sn sınırı", async () => {
  const r = await sahip.query<{ c: string[] }>("SELECT rolconfig AS c FROM pg_roles WHERE rolname = 'probata_uygulama'");
  assert.ok(r.rows[0].c.includes("statement_timeout=15s"), r.rows[0].c.join(","));
  assert.ok(r.rows[0].c.includes("idle_in_transaction_session_timeout=30s"), r.rows[0].c.join(","));
});

test("0010: public'teki her işlevin arama yolu sabit (Supabase denetimi: function_search_path_mutable)", async () => {
  const r = await sahip.query<{ ad: string }>(
    "SELECT p.proname AS ad FROM pg_proc p JOIN pg_namespace s ON s.oid = p.pronamespace WHERE s.nspname = 'public' AND NOT EXISTS (SELECT 1 FROM unnest(coalesce(p.proconfig, '{}')) c WHERE c LIKE 'search_path=%')");
  assert.deepEqual(r.rows.map((x) => x.ad), []);
});

test("bağlantı koparsa (veritabanı yeniden başladı) yakalanmamış istisna olmaz; asıl hata yukarı gider, havuz toparlanır", async () => {
  const yakalanmamis: unknown[] = [];
  const dinle = (e: unknown) => { yakalanmamis.push(e); };
  process.on("uncaughtException", dinle);
  const havuz = havuzKur({ ...kume.uygulama, database: "supa" });
  const f = (await sahip.query<{ id: string }>("SELECT id FROM firma WHERE kisa_ad = 'deneme-s'")).rows[0]?.id
    ?? (await sahip.query<{ id: string }>("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-s', 'Deneme S Muayene', 'DS') RETURNING id")).rows[0].id;
  const kes = () => sahip.query("SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE usename = 'probata_uygulama' AND datname = 'supa'");
  try {
    // A) havuzda BOŞTA bekleyen bağlantı kesilir
    await havuz.query("SELECT 1");
    await kes();
    await bekle(300);
    // B) bağlantı işlemin ORTASINDA kesilir: iş hatası kiraciIcinde'den yukarı fırlar (yutulmaz)
    await assert.rejects(kiraciIcinde(havuz, f, async (db) => { await kes(); await bekle(100); return db.sorgu("SELECT 1"); }));
    await bekle(300);
    assert.deepEqual(yakalanmamis, [], "kopan bağlantı yakalanmamış istisnaya dönüştü");
    // havuz kendini toparlar
    assert.equal((await havuz.query<{ n: number }>("SELECT 1 AS n")).rows[0].n, 1);
  } finally {
    process.off("uncaughtException", dinle);
    await havuz.end();
  }
});

test("bağlantı: ağ üzerinden şifresiz bağlantı reddedilir; 'dogrula' kilitli kökü verir; yerelde şifresiz olur", () => {
  const temel = { PROBATA_VT_AD: "postgres", PROBATA_VT_KULLANICI: "probata_uygulama.ornek", PROBATA_VT_PAROLA: "x" };
  assert.throws(() => ortamdanBaglanti({ ...temel, PROBATA_VT_SUNUCU: "aws-0-eu-central-1.pooler.supabase.com" }), /şifresiz/);
  assert.throws(() => ortamdanBaglanti({ ...temel, PROBATA_VT_SUNUCU: "db.ornek.co", PROBATA_VT_SSL: "require" }), /yalnız 'dogrula'/);
  assert.throws(() => ortamdanBaglanti({ ...temel, PROBATA_VT_SUNUCU: "db.ornek.co", PROBATA_VT_SSL: "dogrula", PROBATA_VT_HAVUZ: "0" }), /1–50/);
  assert.throws(() => ortamdanBaglanti({ ...temel, PROBATA_VT_SUNUCU: "db.ornek.co", PROBATA_VT_SSL: "dogrula", PROBATA_VT_KAPI: "abc" }), /KAPI/);
  assert.throws(() => ortamdanBaglanti({ PROBATA_VT_SUNUCU: "127.0.0.1" }), /bağlantı ayarı yok/);
  const uzak = ortamdanBaglanti({ ...temel, PROBATA_VT_SUNUCU: "db.ornek.co", PROBATA_VT_SSL: "dogrula", PROBATA_VT_KAPI: "6543", PROBATA_VT_HAVUZ: "3" });
  assert.equal(uzak.kokSertifika, SUPABASE_KOK_2021);
  assert.equal(uzak.port, 6543);
  assert.equal(uzak.enCok, 3);
  const yerel = ortamdanBaglanti({ ...temel, PROBATA_VT_SUNUCU: "127.0.0.1" });
  assert.equal(yerel.kokSertifika, undefined);
});

test("bağlantı: TLS havuzu sunucuyu doğrular (rejectUnauthorized), kökü değiştirmez; bağlanma ve boşta bekleme süreli", () => {
  const h = havuzKur({ host: "db.ornek.co", port: 6543, database: "postgres", user: "u", password: "p", kokSertifika: SUPABASE_KOK_2021, enCok: 2 });
  const ayar = (h as unknown as { options: { ssl: { ca: string; rejectUnauthorized: boolean }; max: number; connectionTimeoutMillis: number; idleTimeoutMillis: number } }).options;
  assert.equal(ayar.ssl.rejectUnauthorized, true);
  assert.equal(ayar.ssl.ca, SUPABASE_KOK_2021);
  assert.equal(ayar.max, 2);
  assert.equal(ayar.connectionTimeoutMillis, 5000);
  assert.equal(ayar.idleTimeoutMillis, 5000);
  assert.ok(h.listenerCount("error") >= 1, "havuzda 'error' dinleyicisi yok");
  void h.end();
});

test("Supabase kök sertifikası kilitli (parmak izi) ve süresi geçmemiş", () => {
  const s = new X509Certificate(SUPABASE_KOK_2021);
  assert.equal(s.fingerprint256, "80:70:25:AD:50:D4:ED:21:9D:2C:9C:7D:29:9C:00:4F:82:4E:B0:0C:F7:F6:5A:FE:F6:07:D0:7B:72:E6:CA:FA");
  assert.equal(s.ca, true);
  assert.match(s.subject, /CN=Supabase Root 2021 CA/);
  assert.ok(new Date(s.validTo).getTime() > Date.now(), `kök sertifikanın süresi doldu (${s.validTo}) — yenisini ekleyin`);
});

test("yayın ayarı: Vercel'de AB (Frankfurt), derleme projenin kendi yolundan", () => {
  const v = JSON.parse(readFileSync(new URL("../vercel.json", import.meta.url), "utf8")) as Record<string, unknown>;
  assert.deepEqual(v.regions, ["fra1"]);
  assert.equal(v.buildCommand, "node scripts/next.ts build");
  assert.equal(v.installCommand, "npm ci");
  assert.equal(v.framework, "nextjs");
  /* 378: gece işi günde bir (Vercel Cron); uç yalnız CRON_SECRET'le açılır (src/server/is/yetki.ts) */
  assert.deepEqual(v.crons, [{ path: "/api/is/gece", schedule: "15 1 * * *" }]);
});
