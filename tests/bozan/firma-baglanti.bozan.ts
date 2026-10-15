/* OLUMSUZ KANIT — tests/firma-baglanti.test.ts, tests/merkez-kaydi.test.ts ve tests/yayin.test.ts'in arama yolu kilidi (FIRMA-VT FV2, göç 0096) neyi
   koruyor. Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): baglanti.ts bellekte bozulup geçici klasörden içe aktarılır (göreli içe aktarmalar mutlak yola
   çevrilir); göçler geçici klasöre kopyalanıp 0096 bellekte bozulur, her bozma AYRI veritabanında. Her test önce sağlam kodda neyin geçtiğini gösterir.
   1. Bağlantı sırrının ek verisinden ref çıkarılınca bir projenin şifreli parolası başka projenin kaydında çözülür (satır başka projeye kopyalanırsa
      geçer) — testin "ref değişti" beklentisi yakalar.
   2. Sunucu izin listesi kalkınca kayıt firmayı yabancı bir sunucuya yöneltir ve uygulama parolası çözülüp oraya verilir — "izin listesi" testi
      yakalar.
   3. firma_coz'dan kurulum koşulu kalkınca kurulumu bitmemiş (durumu etkin yazılmış) firma çözülür — yarım kurulmuş veritabanına istek gider;
      merkez-kaydi "kurulumu bitmemiş firma çözülmez" beklentisi yakalar.
   2026-10-15 (FV2 incelemesi) eklenenler:
   4. TLS zorunluluğu kalkınca uzak firma veritabanına sertifikasız bağlantı ayarı çıkar — "TLS zorunlu" testi yakalar.
   5. Storage adres denetimi kalkınca gerçek gizli anahtar başka projenin adresine çözülür — "Storage adresi kendi projesinin" testi yakalar.
   6. Arama yolunda geçici şema sona konmazsa (0096'nın ilk yazımı) uygulama rolünün geçici "firma" tablosu firma_coz'u saptırır; yayin.test'in katalog
      denetimi (GECICI_SEMA_ONDE) işlevleri listeler — merkez-kaydi "arama yolu" testi ve yayin.test yakalar.
   7. Kira süresi denetimi kalkınca süresi dolmuş kira kimseye geçmez (kapanan sayfanın kurulumu sonsuza dek kilitli) — "süresi dolunca alınır" yakalar.
   8. Kiracı işlemindeki kaza önlemi kalkınca bir firmanın işleminden başka firmanın kaydı sessizce okunur — "başka firmanınki RED" beklentisi yakalar
      (güvenlik sınırı değil, kaza önlemi — yine de kilitli).
   9. Bakım (göç dışı) koşulu kalkınca bakımdaki firma çözülür — geride kalmış veritabanına istek gider; "bakımdaki çözülmez" yakalar.
   10. Merkez doğrulaması kalkınca firma veritabanında firma_coz sessizce boş döner (yanlış havuz "firma yok" sanılır) — "firma veritabanında RED" yakalar.
   11. Hata maskesi kalkınca sır taşıyan hata metni ilerletmeyi düşürür (kurulum hatasını yazamaz; red ayrıntısının satırı sırrı taşır) — "maskelenir"
      beklentisi yakalar.
   2026-10-15 (FV3 incelemesi) eklenen:
   12. firma_coz_id'den dondurma koşulu kalkınca dondurulmuş firma alt alan adından yine çözülür — FV3'ten beri ÜRETİM yolu firma_coz (firma_bul değil);
      merkez-kaydi "dondurulmuş … çözülmez" ve yonetim "dondur" (firmaCoz) beklentileri yakalar. */
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { copyFileSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, before, test } from "node:test";
import pg from "pg";
import { baglantiCoz, baglantiDenetle, baglantiSifrele, depoBaglantisi, type FirmaVtKaydi } from "../../src/server/db/baglanti.ts";
import { GOC_KLASORU, gocleriUygula } from "../../src/server/db/goc.ts";
import type { GomuluKume } from "../../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, yonetimIcinde, type Havuz } from "../../src/server/db/kiraci.ts";
import { GECICI_SEMA_ONDE } from "../yardimci/arama-yolu.ts";
import { testKumesi } from "../yardimci/kume.ts";

type Baglanti = typeof import("../../src/server/db/baglanti.ts");
const KOK = resolve("src/server/db");
const KAYNAK = readFileSync(join(KOK, "baglanti.ts"), "utf8").replace(/from "(\.\.?\/[^"]+)"/g, (_, y) => `from "${pathToFileURL(resolve(KOK, y)).href}"`);
const gecici = mkdtempSync(join(tmpdir(), "firma-baglanti-bozan-"));
let sira = 0;
async function bozukBaglanti(eski: string, yeni: string): Promise<Baglanti> {
  assert.ok(KAYNAK.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const yol = join(gecici, `b${++sira}.ts`);
  writeFileSync(yol, KAYNAK.replace(eski, () => yeni));
  return import(pathToFileURL(yol).href);
}
/** göçlerin kopyası; 0096'da her `eski` (HER geçtiği yerde) → `yeni` */
function bozukGocler(degisimler: readonly (readonly [string, string])[]): string {
  const klasor = join(gecici, `gocler-${randomUUID()}`);
  mkdirSync(klasor);
  for (const d of readdirSync(GOC_KLASORU)) {
    if (!d.endsWith(".sql")) continue;
    if (d.startsWith("0096_")) {
      let k = readFileSync(join(GOC_KLASORU, d), "utf8");
      for (const [eski, yeni] of degisimler) {
        assert.ok(k.includes(eski), `bozulacak satır göçte yok: ${eski}`);
        k = k.split(eski).join(yeni);
      }
      writeFileSync(join(klasor, d), k);
    } else copyFileSync(join(GOC_KLASORU, d), join(klasor, d));
  }
  return klasor;
}

const ANAHTAR = randomBytes(32);
const F = "00000000-0000-4000-8000-00000000000a";
const REF1 = "abcdefghijklmnopqrst";
const REF2 = "tsrqponmlkjihgfedcba";
const HAVUZCU = "aws-0-eu-central-1.pooler.supabase.com";
const yetkisiz = (e: unknown) => (e as { code?: string }).code === "42501";
let kume: GomuluKume | undefined;
const sahipler: pg.Client[] = [];
const havuzlar: Havuz[] = [];
interface Vt { ad: string; sahip: pg.Client; havuz: Havuz }
/** sağlam göçler: kümenin kendi veritabanı */
let saglam: Vt;

/** kümede ayrı veritabanı (0096 bozulmuş göçlerle; değişim yoksa sağlam kopya): sahip + uygulama havuzu */
async function ayriVt(ad: string, degisimler: readonly (readonly [string, string])[]): Promise<Vt> {
  const klasor = bozukGocler(degisimler);
  const y = kume!.sahipIstemci("postgres");
  await y.connect();
  try { await y.query(`CREATE DATABASE ${ad} ENCODING 'UTF8' LOCALE 'C' TEMPLATE template0`); } finally { await y.end(); }
  const sahip = kume!.sahipIstemci(ad);
  await sahip.connect();
  sahipler.push(sahip);
  await gocleriUygula(sahip, klasor);
  const havuz = havuzKur({ ...kume!.uygulama, database: ad });
  havuzlar.push(havuz);
  return { ad, sahip, havuz };
}
/** yönetim işlemiyle tek jsonb (yönetici o veritabanında açılır — iki adım kapalı: "ilk" yönetici geçer, 0075) */
async function yonetimJ(v: Vt): Promise<(sql: string, d: readonly unknown[]) => Promise<Record<string, unknown>>> {
  const Y = (await v.sahip.query<{ id: string }>("INSERT INTO yonetici (eposta, ad, parola_ozeti) VALUES ($1, 'Deneme Yönetici', 'scrypt$uydurma') RETURNING id::text",
    [`y-${randomUUID().slice(0, 8)}@probata.example`])).rows[0]!.id;
  return async (sql, d) => (await yonetimIcinde(v.havuz, (db) => db.sorgu<{ s: Record<string, unknown> }>(sql, d), { yoneticiId: Y })).rows[0]!.s;
}
const kayitAc = (j: Awaited<ReturnType<typeof yonetimJ>>, kisa: string, kod: string) =>
  j("SELECT yonetim_firma_kayit_ac($1, $2, $3, 'Deneme Kişi', $4) AS s", ["Deneme Kurulum A.Ş.", kisa, kod, `kisi@${kisa}.example`]).then((r) => r.id as string);

before(async () => {
  kume = await testKumesi();
  const sahip = kume.sahipIstemci();
  await sahip.connect();
  sahipler.push(sahip);
  const havuz = havuzKur(kume.uygulama);
  havuzlar.push(havuz);
  saglam = { ad: kume.uygulama.database, sahip, havuz };
});
after(async () => {
  for (const h of havuzlar) await h.end();
  for (const s of sahipler) await s.end();
  await kume?.durdur();
  rmSync(gecici, { recursive: true, force: true });
});

test("1. ek veriden ref çıkarılınca bir projenin şifreli parolası başka projenin kaydında çözülür (kilidin koruduğu açık)", async () => {
  /* sağlam kod: başka ref çözemez */
  const s = baglantiSifrele("uygulama-parolasi", F, REF1, "uygulama_parolasi", ANAHTAR);
  assert.throws(() => baglantiCoz(s, F, REF2, "uygulama_parolasi", ANAHTAR));
  const b = await bozukBaglanti("return `probata:baglanti:v1:${firmaId}:${ref ?? \"\"}:${ad}`;", "return `probata:baglanti:v1:${firmaId}:${ad}`;");
  const bs = b.baglantiSifrele("uygulama-parolasi", F, REF1, "uygulama_parolasi", ANAHTAR);
  assert.equal(b.baglantiCoz(bs, F, REF2, "uygulama_parolasi", ANAHTAR), "uygulama-parolasi", "bozuk: başka projenin kaydında çözüldü");
});

test("2. izin listesi kalkınca kayıt firmayı yabancı sunucuya yöneltir, parola çözülüp oraya verilir (kilidin koruduğu açık)", async () => {
  const ayar = { sunucu: "db.saldirgan.example", kapi: 5432, vtAd: "postgres", kullanici: `probata_uygulama.${REF1}`, parola: "p" };
  assert.throws(() => baglantiDenetle(ayar, { merkezYerel: false }), /izin listesinde değil/);
  const b = await bozukBaglanti("  } else if (!SUPABASE_HAVUZCU.test(sunucu)) {", "  } else if (SUPABASE_HAVUZCU.source === \"\") {");
  assert.equal(b.baglantiDenetle(ayar, { merkezYerel: false }).host, "db.saldirgan.example", "bozuk: yabancı sunucu kabul edildi");
  const kayit = { firmaId: F, ref: REF1, sunucu: "db.saldirgan.example", kapi: 5432, vtAd: "postgres", kullanici: `probata_uygulama.${REF1}`,
    parolaSifreli: baglantiSifrele("gercek-parola", F, REF1, "uygulama_parolasi", ANAHTAR), depo: null, surum: 1 };
  const sonuc = b.kayittanBaglanti(kayit, ANAHTAR, { merkezYerel: false });
  assert.deepEqual([sonuc.host, sonuc.password], ["db.saldirgan.example", "gercek-parola"], "bozuk: çözülen parola yabancı sunucuya gidiyor");
});

test("3. firma_coz'dan kurulum koşulu kalkınca kurulumu bitmemiş firma çözülür (kilidin koruduğu açık)", async () => {
  /** etkin yazılmış, bağlantısı tam ama kurulumu bitmemiş kendi projeli firma */
  const kur = async (sahip: pg.Client) => {
    const id = (await sahip.query<{ id: string }>("INSERT INTO firma (kisa_ad, ad, rapor_kodu, vt) VALUES ('yarim', 'Yarım Kurulum A.Ş.', 'YK', 'kendi') RETURNING id::text")).rows[0]!.id;
    await sahip.query("INSERT INTO firma_vt (firma_id, sunucu, kapi, vt_ad, kullanici, parola_sifreli) VALUES ($1, '127.0.0.1', 5432, 'probata_firma', 'probata_uygulama', 'v1.a.b.c')", [id]);
    await sahip.query("INSERT INTO firma_kurulum (firma_id, adim, durum) VALUES ($1, 'dene', 'calisiyor')", [id]);
    return id;
  };
  /* sağlam göçler (kümenin kendi veritabanı): çözülmez */
  await kur(saglam.sahip);
  assert.equal((await saglam.havuz.query<{ s: unknown }>("SELECT firma_coz('yarim') AS s")).rows[0]!.s, null);
  /* bozuk göçler: ayrı veritabanında */
  const bozuk = await ayriVt("probata_bozan_fb", [["     OR v_kurulum IS DISTINCT FROM 'tamam'\n", ""]]);
  const id = await kur(bozuk.sahip);
  const s = (await bozuk.havuz.query<{ s: { id?: string; vt?: string } | null }>("SELECT firma_coz('yarim') AS s")).rows[0]!.s;
  assert.deepEqual([s?.id, s?.vt], [id, "kendi"], "bozuk: kurulumu bitmemiş firma çözüldü");
});

test("4. TLS zorunluluğu kalkınca uzak firma veritabanına sertifikasız bağlantı ayarı çıkar (kilidin koruduğu açık)", async () => {
  const ayar = { sunucu: HAVUZCU, kapi: 6543, vtAd: "postgres", kullanici: `probata_uygulama.${REF1}`, parola: "p", tls: false };
  assert.throws(() => baglantiDenetle(ayar, { merkezYerel: false }), /şifresiz/);
  const b = await bozukBaglanti("  sifresizAgDenetle(a.sunucu, tls, \"firma veritabanında TLS zorunlu.\");\n", "");
  const s = b.baglantiDenetle(ayar, { merkezYerel: false });
  assert.deepEqual([s.host, s.kokSertifika], [HAVUZCU, undefined], "bozuk: uzak sunucuya TLS'siz, kök sertifikasız bağlantı");
});

test("5. Storage adres denetimi kalkınca gerçek gizli anahtar başka projenin adresine çözülür (kilidin koruduğu açık)", async () => {
  const kayit: FirmaVtKaydi = {
    firmaId: F, ref: REF1, sunucu: HAVUZCU, kapi: 6543, vtAd: "postgres", kullanici: `probata_uygulama.${REF1}`, parolaSifreli: "v1.a.b.c", surum: 1,
    depo: { url: `https://${REF2}.supabase.co`, gizliSifreli: baglantiSifrele("gercek-gizli", F, REF1, "depo_gizli", ANAHTAR), kova: "probata" },
  };
  assert.throws(() => depoBaglantisi(kayit, ANAHTAR, { merkezYerel: false }), /kendi projesinin değil/);
  const b = await bozukBaglanti("  depoAdresiDenetle(url, kayit.ref, secenek.merkezYerel);\n", "");
  assert.deepEqual(b.depoBaglantisi(kayit, ANAHTAR, { merkezYerel: false }), { url: `https://${REF2}.supabase.co`, gizli: "gercek-gizli", kova: "probata" },
    "bozuk: gerçek gizli anahtar yabancı projenin adresine çözüldü");
});

test("6. arama yolunda geçici şema sona konmazsa uygulama rolünün geçici 'firma' tablosu firma_coz'u saptırır; katalog denetimi işlevleri listeler (kilidin koruduğu açık)", async () => {
  const sahte = randomUUID();
  /** uygulama rolüyle YENİ bağlantı: geçici tablo, sonra çözüm (işlev bu oturumda ilk kez derlenir) */
  const dene = async (database: string) => {
    const c = new pg.Client({ host: kume!.uygulama.host, port: kume!.uygulama.port, user: kume!.uygulama.user, password: kume!.uygulama.password, database });
    await c.connect();
    try {
      await c.query("CREATE TEMP TABLE firma (id uuid, kisa_ad text, durum text, vt text)");
      await c.query("INSERT INTO pg_temp.firma VALUES ($1, 'sahte-ay', 'etkin', 'ortak')", [sahte]);
      return (await c.query<{ s: unknown }>("SELECT firma_coz('sahte-ay') AS s")).rows[0]!.s;
    } finally { await c.end(); }
  };
  /* sağlam: geçici tablo görülmez, katalog temiz */
  assert.equal(await dene(saglam.ad), null);
  assert.deepEqual((await saglam.sahip.query<{ ad: string }>(GECICI_SEMA_ONDE)).rows, []);
  /* bozuk: 0096'nın arama yolları "public" (ilk yazımı; 0095'in dört işlevi de sıkılaştırılmamış) */
  const bozuk = await ayriVt("probata_bozan_fb6", [["SET search_path = pg_catalog, public, pg_temp", "SET search_path = public"]]);
  assert.deepEqual(await dene(bozuk.ad), { id: sahte, kisa_ad: "sahte-ay", vt: "ortak" }, "bozuk: geçici tablodaki sahte firma çözüldü");
  const liste = (await bozuk.sahip.query<{ ad: string }>(GECICI_SEMA_ONDE)).rows.map((r) => r.ad);
  for (const ad of ["firma_coz", "firma_coz_id", "vt_firma_dogrula", "yonetim_firma_durum", "yonetim_gecici_parola", "yonetim_firmalar"]) {
    assert.ok(liste.includes(ad), `bozuk: katalog denetimi ${ad} işlevini listeler (${liste.join(", ")})`);
  }
});

test("7. kira süresi denetimi kalkınca süresi dolmuş kira kimseye geçmez — kapanan sayfanın kurulumu sonsuza dek kilitli kalır (kilidin koruduğu açık)", async () => {
  const dene = async (v: Vt, kisa: string, kod: string) => {
    const j = await yonetimJ(v);
    const id = await kayitAc(j, kisa, kod);
    assert.equal(typeof (await j("SELECT firma_kurulum_kira($1) AS s", [id])).kira, "string");
    await v.sahip.query("UPDATE firma_kurulum SET kira_bitis = now() - interval '1 second' WHERE firma_id = $1", [id]);
    return j("SELECT firma_kurulum_kira($1) AS s", [id]);
  };
  assert.equal(typeof (await dene(saglam, "kira-saglam", "KS")).kira, "string", "sağlam: süresi dolan kira yeniden alınır");
  const bozuk = await ayriVt("probata_bozan_fb7",
    [["      AND (firma_kurulum.kira_bitis IS NULL OR firma_kurulum.kira_bitis < now())\n", "      AND firma_kurulum.kira_bitis IS NULL\n"]]);
  assert.equal((await dene(bozuk, "kira-bozuk", "KB")).hata, "kirada", "bozuk: süresi dolmuş kira alınamadı");
});

test("8. kiracı işlemindeki kaza önlemi kalkınca bir firmanın işleminden başka firmanın kaydı sessizce okunur (kilidin koruduğu açık)", async () => {
  const dene = async (v: Vt, kodA: string, kodB: string) => {
    const ekle = async (kisa: string, kod: string) =>
      (await v.sahip.query<{ id: string }>("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ($1, 'Kaza Deneme A.Ş.', $2) RETURNING id::text", [kisa, kod])).rows[0]!.id;
    const a = await ekle("kaza-a", kodA), b = await ekle("kaza-b", kodB);
    return { b, s: (await kiraciIcinde(v.havuz, a, (db) => db.sorgu<{ s: unknown }>("SELECT firma_coz_id($1::uuid) AS s", [b]))).rows[0]!.s };
  };
  await assert.rejects(dene(saglam, "QA", "QB"), yetkisiz);
  const bozuk = await ayriVt("probata_bozan_fb8", [[
    "  IF v_ben IS NOT NULL AND lower(v_ben) <> p_id::text THEN\n    RAISE EXCEPTION 'Kiracı işleminde başka firmanın kaydı okunmaz' USING ERRCODE = '42501';\n  END IF;\n", ""]]);
  const { b, s } = await dene(bozuk, "RA", "RB");
  assert.deepEqual(s, { id: b, kisa_ad: "kaza-b", vt: "ortak" }, "bozuk: başka firmanın kaydı kiracı işleminden okundu");
});

test("9. bakım koşulu kalkınca bakımdaki (göç dışı) firma çözülür — geride kalmış veritabanına istek gider (kilidin koruduğu açık)", async () => {
  /** kurulumu tamam, bağlantısı tam, "bakımda" kendi projeli firma */
  const kur = async (sahip: pg.Client, kisa: string, kod: string) => {
    const id = (await sahip.query<{ id: string }>("INSERT INTO firma (kisa_ad, ad, rapor_kodu, vt) VALUES ($1, 'Bakım Deneme A.Ş.', $2, 'kendi') RETURNING id::text", [kisa, kod])).rows[0]!.id;
    await sahip.query(`INSERT INTO firma_vt (firma_id, sunucu, kapi, vt_ad, kullanici, parola_sifreli, goc_disi, goc_disi_gerekce)
      VALUES ($1, '127.0.0.1', 5432, 'probata_firma', 'probata_uygulama', 'v1.a.b.c', true, 'Deneme: proje erişimi koptu')`, [id]);
    await sahip.query("INSERT INTO firma_kurulum (firma_id, adim, durum, bitti) VALUES ($1, 'tamam', 'tamam', now())", [id]);
    return id;
  };
  await kur(saglam.sahip, "bakim-s", "BS");
  assert.equal((await saglam.havuz.query<{ s: unknown }>("SELECT firma_coz('bakim-s') AS s")).rows[0]!.s, null);
  const bozuk = await ayriVt("probata_bozan_fb9", [["     OR v.goc_disi\n", ""]]);
  const id = await kur(bozuk.sahip, "bakim-b", "BB");
  const s = (await bozuk.havuz.query<{ s: { id?: string; vt?: string } | null }>("SELECT firma_coz('bakim-b') AS s")).rows[0]!.s;
  assert.deepEqual([s?.id, s?.vt], [id, "kendi"], "bozuk: bakımdaki firma çözüldü");
});

test("10. merkez doğrulaması kalkınca firma veritabanında firma_coz sessizce boş döner — yanlış havuz 'firma yok' sanılır (kilidin koruduğu açık)", async () => {
  /** firma veritabanı: kimlik ve firma satırı kurulumdaki sırayla */
  const firmaVt = async (v: Vt) => {
    const X = randomUUID();
    await v.sahip.query("UPDATE vt_kimlik SET tur = 'firma', firma_id = $1 WHERE tur = 'ortak'", [X]);
    await v.sahip.query("INSERT INTO firma (id, kisa_ad, ad, rapor_kodu, vt) VALUES ($1, 'kendi-x', 'Kendi X Muayene', 'KX', 'kendi')", [X]);
    return v;
  };
  const saglamFirma = await firmaVt(await ayriVt("probata_bozan_fb10s", []));
  await assert.rejects(saglamFirma.havuz.query("SELECT firma_coz('kendi-x')"), yetkisiz);
  const bozuk = await firmaVt(await ayriVt("probata_bozan_fb10", [["  PERFORM vt_merkez_dogrula();\n", ""]]));
  assert.equal((await bozuk.havuz.query<{ s: unknown }>("SELECT firma_coz('kendi-x') AS s")).rows[0]!.s, null, "bozuk: firma veritabanında hata yerine boş döndü");
});

test("11. hata maskesi kalkınca sır taşıyan hata metni ilerletmeyi düşürür — kurulum hatasını yazamaz, red ayrıntısının satırı sırrı taşır (kilidin koruduğu açık)", async () => {
  const sir = `anahtar sbp_${"0123456789abcdef".repeat(3)}`;
  const dene = async (v: Vt, kisa: string, kod: string) => {
    const j = await yonetimJ(v);
    const id = await kayitAc(j, kisa, kod);
    const kira = (await j("SELECT firma_kurulum_kira($1) AS s", [id])).kira;
    return j("SELECT firma_kurulum_ilerlet($1, $2, $3::jsonb) AS s", [id, kira, JSON.stringify({ durum: "hata", hata: sir })]);
  };
  assert.equal((await dene(saglam, "maske-s", "MS")).durum, "hata");
  assert.equal((await saglam.sahip.query<{ hata: string }>("SELECT k.hata FROM firma_kurulum k JOIN firma f ON f.id = k.firma_id WHERE f.kisa_ad = 'maske-s'")).rows[0]!.hata,
    "anahtar sbp_***");
  const bozuk = await ayriVt("probata_bozan_fb11", [["kurulum_hata_maskele(p_degisim->>'hata')", "p_degisim->>'hata'"]]);
  await assert.rejects(dene(bozuk, "maske-b", "MB"), (e: unknown) => (e as { code?: string }).code === "23514", "bozuk: sır taşıyan hata metni ilerletmeyi düşürdü");
});

test("12. firma_coz_id'den dondurma koşulu kalkınca dondurulmuş firma alt alan adından yine çözülür (kilidin koruduğu açık)", async () => {
  /* 2026-10-15 (FV3 incelemesi): uygulama alt alan adını artık firma_coz ile çözer (src/server/kiraci/istek.ts → firma-havuzu.ts firmaKaydi); firma_bul /
     firmaKimligi üretim yolunda değil. Dondurmanın birinci kilidinin ÜRETİMDEKİ yolu burada — merkez-kaydi "dondurulmuş … çözülmez" ve yonetim "dondur:
     firma bulunmaz" (firmaCoz) yakalar. (İkinci kilit — giriş / oturum — tests/bozan/firma-vt.bozan.ts 3 ve 5.) */
  const kur = async (sahip: pg.Client, kisa: string, kod: string) => (await sahip.query<{ id: string }>(
    "INSERT INTO firma (kisa_ad, ad, rapor_kodu, durum) VALUES ($1, 'Dondurma Deneme A.Ş.', $2, 'dondu') RETURNING id::text", [kisa, kod])).rows[0]!.id;
  await kur(saglam.sahip, "dondu-s", "DZ");
  assert.equal((await saglam.havuz.query<{ s: unknown }>("SELECT firma_coz('dondu-s') AS s")).rows[0]!.s, null, "sağlam: dondurulmuş firma çözülmez");
  const bozuk = await ayriVt("probata_bozan_fb12", [["  SELECT * INTO f FROM firma WHERE id = p_id AND durum = 'etkin';\n", "  SELECT * INTO f FROM firma WHERE id = p_id;\n"]]);
  const id = await kur(bozuk.sahip, "dondu-b", "DY");
  const s = (await bozuk.havuz.query<{ s: { id?: string; vt?: string } | null }>("SELECT firma_coz('dondu-b') AS s")).rows[0]!.s;
  assert.deepEqual([s?.id, s?.vt], [id, "ortak"], "bozuk: dondurulmuş firma çözüldü");
});
