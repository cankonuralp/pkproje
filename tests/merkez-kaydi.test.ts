/* NEREDEN GELDİ: FIRMA-VT.md FV2 (sunum 579; reisim 2026-10-15: "supabase ve resend bağlantılarını firma açarken biz buradan panelden yapalım daha
   sonra müşteri uğraşmasın … resend ve supabase ayarları firma ayarları kısmından değiştirilemesin") — merkez (ortak proje) her kendi projeli firmanın
   bağlantısını şifreli tutar (firma_vt), kurulumu adım adım izler (firma_kurulum); uygulama yalnız firma_coz ile, yalnız etkin ve kurulumu tamam
   firmanın kaydını alır (göç 0096). GERÇEK PostgreSQL, iki veritabanı: merkez (ortak) + bir firmanın kendi veritabanı (aynı kümede; göçler aynen,
   kimlik kurulumdaki gibi yazılır — tests/vt-kimligi.test.ts deseni). Kilitlenenler:
   · kurulum adım 0 (yonetim_firma_kayit_ac): firma kendi + kurulum; kurulumdaki firma bulunmaz, çözülmez, girilmez; denetimler 0050 ile aynı;
   · kira: ikinci istek alamaz (eşzamanlı da), süresi dolunca alınır, eski kirayla ilerletilemez; adım atlanmaz, geri gitmez; hata metnindeki anahtar
     MASKELENİR (reddedilmez — red ayrıntısı sırrı günlüğe yazardı), uzun metin kısaltılır, kalıcı hatanın izine yalnız adım + kod gider; bağlantı
     kaydı eksikken / parola onaylanmadan kurulum tamamlanmaz; Storage adresi kaydın projesinin, üçü birlikte; tamamda firma etkin, geçici girdi boşalır;
   · firma_coz: ortak / kendi; dondurulmuş, bakımdaki (goc_disi), kurulumu bitmemiş firma çözülmez; kiracı işleminden başka firmanın kaydı istenmez
     (kaza önlemi — güvenlik sınırı DEĞİL, koruma ana anahtar + ek veri); firma veritabanında çağrı reddedilir; merkezdeki kayıttan kurulan bağlantı
     firmanın KENDİ veritabanına gider (vt_firma_dogrula geçer);
   · arama yolu: uygulama rolünün geçici tablosu tanımlayıcı-yetkili işlevin tablosunu gölgeleyemez (merkezde firma_coz, firma veritabanında
     vt_firma_dogrula — 2026-10-15, FV2 incelemesi);
   · uygulama rolü firma_vt / firma_kurulum'u ve yönetim işlevlerini doğrudan kullanamaz; yönetim rolü bağlantı alanlarını yazamaz;
   · yonetim_firmalar yeni sütunlarla (modülün firmalar() listesi aynen); goc_hedefleri; kendi projeli firmada dondurma merkezde yalnız durum + iz,
     geçici parola HİÇBİR ŞEY yazmaz (firma tarafı ve izi FV9);
   · SCRAM özetiyle rol girişi: ALTER ROLE … PASSWORD '<özet>' → düz parolayla girilir (PostgreSQL özeti yeniden özetlemez).
   ⛔ Testler SIRAYLA koşar ve durumu paylaşır (KA test 1'de, K test 3'te kurulur; sonrakiler onlara dayanır) — tek test (--test-name-pattern) koşulmaz.
   Olumsuz kanıt: tests/bozan/firma-baglanti.bozan.ts (kurulum koşulu, bakım koşulu, kiracı kaza önlemi, merkez doğrulaması, kira süresi, hata maskesi,
   arama yolu kalkınca). */
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { after, before, test } from "node:test";
import pg from "pg";
import { firmalar, yoneticiyeGeciciParola } from "../src/modules/yonetim/server/yonetim.ts";
import { baglantiSifrele, depoBaglantisi, kayittanBaglanti, kurulumCoz, kurulumSifrele } from "../src/server/db/baglanti.ts";
import { duyuruListesi } from "../src/server/db/duyuru.ts";
import { gocleriUygula } from "../src/server/db/goc.ts";
import type { GomuluKume } from "../src/server/db/gomulu.ts";
import { firmaKimligi, havuzKur, kiraciIcinde, yonetimIcinde, type Havuz, type Sorgulayici } from "../src/server/db/kiraci.ts";
import { firmaCoz, firmaCozId, merkezOku } from "../src/server/db/merkez.ts";
import { scramOzeti, scramOzetiMi } from "../src/server/db/scram.ts";
import { parolaOzeti } from "../src/server/kimlik/parola.ts";
import { testKumesi } from "./yardimci/kume.ts";

const FIRMA_VT = "probata_firma_m";
const ANAHTAR = randomBytes(32);
let kume: GomuluKume;
let havuz: Havuz;          // merkez, uygulama rolü
let firmaHavuz: Havuz;     // firmanın kendi veritabanı, uygulama rolü (doğrudan — kayıttan kurulanla karşılaştırma için)
let sahip: pg.Client;      // merkez sahibi
let sahipFirma: pg.Client;
let Y: string;             // yönetici
let A: string;             // ortak firma
let K: string;             // kendi projeli firma (kurulumu tamamlanacak)
let KA: string;            // kurulumda kalan firma
const yetkisiz = (e: unknown) => (e as { code?: string }).code === "42501";
const izinYok = /permission denied|izin/i;

type Js = Record<string, unknown> | null;
/** yönetim işlemi (yönetici bağlamda) */
const y = <T,>(is: (db: Sorgulayici) => Promise<T>) => yonetimIcinde(havuz, is, { yoneticiId: Y });
/** yöneticisiz yönetim işlemi (derleme adımındaki göç dağıtıcı gibi) */
const yoneticisiz = <T,>(is: (db: Sorgulayici) => Promise<T>) => yonetimIcinde(havuz, is);
/** yönetim işleviyle tek jsonb */
const j = async (sql: string, d: readonly unknown[] = []): Promise<Js> => (await y((db) => db.sorgu<{ s: Js }>(sql, d))).rows[0].s;
const kayitAc = (ad: string, kisa: string, kod: string, yon = "Deneme Kişi", eposta = `kisi@${kisa}.example`) =>
  j("SELECT yonetim_firma_kayit_ac($1, $2, $3, $4, $5) AS s", [ad, kisa, kod, yon, eposta]);
const kira = (id: string) => j("SELECT firma_kurulum_kira($1) AS s", [id]);
const ilerlet = (id: string, k: unknown, d: Record<string, unknown>) => j("SELECT firma_kurulum_ilerlet($1, $2, $3::jsonb) AS s", [id, k, JSON.stringify(d)]);
const tek = async <T extends pg.QueryResultRow>(c: pg.Client, sql: string, d: unknown[] = []) => (await c.query<T>(sql, d)).rows[0];

before(async () => {
  kume = await testKumesi();
  havuz = havuzKur(kume.uygulama);
  sahip = kume.sahipIstemci();
  await sahip.connect();
  // örnek veri UYDURMADIR (CLAUDE.md §7)
  A = (await tek<{ id: string }>(sahip, "INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('ortak-a', 'Ortak A Muayene', 'OA') RETURNING id::text"))!.id;
  Y = (await tek<{ id: string }>(sahip, "INSERT INTO yonetici (eposta, ad, parola_ozeti) VALUES ('y@probata.example', 'Deneme Yönetici', $1) RETURNING id::text",
    [await parolaOzeti("yonetim-parola-2026")]))!.id;
});

after(async () => {
  await havuz?.end();
  await firmaHavuz?.end();
  await sahip?.end();
  await sahipFirma?.end();
  await kume?.durdur();
});

test("kurulum adım 0: firma kendi + kurulum, boş bağlantı kaydı, kurulum satırı, niyet izi; kurulumdaki firma bulunmaz, çözülmez, girilmez; denetimler 0050 ile aynı", async () => {
  const r = await kayitAc("Kurulum Deneme A.Ş.", "kurulum-a", "KA");
  assert.ok(r && typeof r.id === "string");
  KA = r.id as string;
  assert.deepEqual(await tek(sahip, "SELECT vt, durum, ilk_hesap FROM firma WHERE id = $1", [KA]), { vt: "kendi", durum: "kurulum", ilk_hesap: null });
  assert.deepEqual(await tek(sahip, "SELECT ref, sunucu, parola_sifreli, surum, goc_disi FROM firma_vt WHERE firma_id = $1", [KA]),
    { ref: null, sunucu: null, parola_sifreli: null, surum: 0, goc_disi: false });
  assert.deepEqual(await tek(sahip, "SELECT adim, durum, kira, deneme, yon_ad, yon_eposta FROM firma_kurulum WHERE firma_id = $1", [KA]),
    { adim: "proje", durum: "bekliyor", kira: null, deneme: 0, yon_ad: "Deneme Kişi", yon_eposta: "kisi@kurulum-a.example" });
  assert.deepEqual(await tek(sahip, "SELECT yonetici_id::text, kim, ayrinti FROM yonetim_izi WHERE ne = 'firma.kurulum_basladi' AND hedef_firma = $1", [KA]),
    { yonetici_id: Y, kim: "y@probata.example", ayrinti: { kisa_ad: "kurulum-a", rapor_kodu: "KA", yonetici: "kisi@kurulum-a.example", vt: "kendi" } });
  /* denetimler 0050 ile aynı */
  assert.deepEqual(await kayitAc("Başka A.Ş.", "kurulum-a", "KB"), { hata: "kisa_ad" });
  assert.deepEqual(await kayitAc("Başka A.Ş.", "kurulum-b", "OA"), { hata: "rapor_kodu" });
  assert.deepEqual(await kayitAc("Başka A.Ş.", "api", "AP"), { hata: "ayrilmis" });
  assert.deepEqual(await kayitAc("Başka A.Ş.", "kurulum-b", "KB", "Tekad"), { hata: "gecersiz" });
  assert.deepEqual(await kayitAc("Başka A.Ş.", "kurulum-b", "KB", "Deneme Kişi", "Buyuk@Harf.Example"), { hata: "gecersiz" });
  /* kurulumdaki firma: alt alan adından bulunmaz, çözülmez, kiracı işlemi reddedilir (FV1: ortakta kendi projeli firma) */
  assert.equal(await firmaKimligi(havuz, "kurulum-a"), null);
  assert.equal(await firmaCoz(havuz, "kurulum-a"), null);
  await assert.rejects(kiraciIcinde(havuz, KA, (db) => db.sorgu("SELECT 1")), yetkisiz);
  /* yönetim: kurulumdaki firma dondurulmaz / etkinleştirilmez, geçici parola verilmez (etkinlik yalnız kurulumun sonunda) */
  assert.deepEqual(await j("SELECT yonetim_firma_durum($1, 'etkin') AS s", [KA]), { hata: "kurulum" });
  assert.deepEqual(await j("SELECT yonetim_firma_durum($1, 'dondu') AS s", [KA]), { hata: "kurulum" });
  assert.deepEqual(await j("SELECT yonetim_gecici_parola($1, 'scrypt$x') AS s", [KA]), { hata: "kurulum" });
  /* "kurulum" durumu yalnız kendi projeli firmada; yöneticisiz işlem açamaz */
  await assert.rejects(sahip.query("UPDATE firma SET durum = 'kurulum' WHERE id = $1", [A]), /firma_kurulum_kendi/);
  await assert.rejects(yoneticisiz((db) => db.sorgu("SELECT yonetim_firma_kayit_ac('X A.Ş.', 'yoneticisiz', 'YZ', 'Deneme Kişi', 'a@b.example')")), /yönetim işlemi değil/);
});

test("kurulum kirası: ikinci istek alamaz (eşzamanlı da); süresi dolunca alınır, eski kirayla ilerletilemez; adım atlanmaz, geri gitmez; hata metnindeki anahtar maskelenir", async () => {
  const k1 = await kira(KA);
  assert.ok(k1 && typeof k1.kira === "string", JSON.stringify(k1));
  assert.deepEqual({ adim: k1.adim, durum: k1.durum, kisa_ad: k1.kisa_ad, yon_eposta: k1.yon_eposta },
    { adim: "proje", durum: "bekliyor", kisa_ad: "kurulum-a", yon_eposta: "kisi@kurulum-a.example" });
  assert.equal((await kira(KA))?.hata, "kirada", "ikinci istek kirayı alamaz");
  assert.deepEqual(await ilerlet(KA, randomUUID(), { adim: "hazir" }), { hata: "kira" }, "kirasız ilerletilmez");
  assert.deepEqual(await ilerlet(KA, k1.kira, { adim: "ssl" }), { hata: "adim" }, "adım atlanmaz");
  assert.deepEqual(await ilerlet(KA, k1.kira, { adim: "kayit" }), { hata: "adim" }, "adım geri gitmez");
  assert.deepEqual(await ilerlet(KA, k1.kira, { adim: "tamam", durum: "tamam" }), { hata: "adim" });
  assert.deepEqual(await ilerlet(KA, k1.kira, { bilinmeyen: 1 }), { hata: "gecersiz" });
  assert.deepEqual(await ilerlet(KA, k1.kira, { durum: "tamam" }), { hata: "gecersiz" }, "tamam yalnız son adımda");
  assert.deepEqual(await ilerlet(KA, k1.kira, { vt: { parola_onayla: true } }), { hata: "bekleyen_yok" });
  /* yeniden denenebilir hata: deneme artar; metin ve kısa kod yazılır */
  assert.deepEqual(await ilerlet(KA, k1.kira, { durum: "hata", hata: "Supabase 503: geçici olarak ulaşılamıyor", kod: "s503" }), { adim: "proje", durum: "hata", deneme: 1, surum: 0 });
  assert.deepEqual(await tek(sahip, "SELECT hata, hata_kodu FROM firma_kurulum WHERE firma_id = $1", [KA]), { hata: "Supabase 503: geçici olarak ulaşılamıyor", hata_kodu: "s503" });
  /* 2026-10-15 (FV2 incelemesi): anahtar / parolalı bağlantı dizesi taşıyan metin REDDEDİLMEZ, MASKELENİR — red ayrıntısı ("Failing row contains …")
     sırrı istemciye ve sunucu günlüğüne yazıyordu; uzun metin de ilerletmeyi düşürmez, kısaltılır */
  for (const [h, beklenen] of [
    [`anahtar sbp_${"0123456789abcdef".repeat(3)}`, "anahtar sbp_***"],
    ["postgres://postgres.abcdefghijklmnopqrst:gizli-parola@aws-0-eu-central-1.pooler.supabase.com:6543/postgres", "postgres://***@aws-0-eu-central-1.pooler.supabase.com:6543/postgres"],
    ["gizli sb_secret_AbCdEf123456789", "gizli sb_secret_***"],
    ["anahtar re_AbC12345_AbCdEfGhIjKlMnOpQrSt sonra", "anahtar re_*** sonra"],
    ["jwt eyJ0ZXN0MTIzNDU2.eyJ0ZXN0.imza", "jwt eyJ***"],
    [`  ${"x".repeat(600)}`, "x".repeat(498)],
  ] as const) {
    assert.equal((await ilerlet(KA, k1.kira, { durum: "hata", hata: h }))?.durum, "hata", h);
    assert.equal((await tek<{ hata: string }>(sahip, "SELECT hata FROM firma_kurulum WHERE firma_id = $1", [KA]))!.hata, beklenen, h);
  }
  /* kod yalnız kısa ad; tablo maskelenmemiş metni kabul etmez (sahip doğrudan yazsa da — maske tek yerde) */
  assert.deepEqual(await ilerlet(KA, k1.kira, { durum: "hata", hata: "x", kod: "Büyük Kod" }), { hata: "gecersiz" });
  await assert.rejects(sahip.query("UPDATE firma_kurulum SET hata = $2 WHERE firma_id = $1", [KA, `sb_secret_${"Ab".repeat(8)}`]), /firma_kurulum_hata_check/);
  assert.equal((await ilerlet(KA, k1.kira, { durum: "hata", hata: "Supabase 503: geçici olarak ulaşılamıyor" }))?.durum, "hata");
  /* kira süresi dolunca başkası alır; eski kira geçmez */
  await sahip.query("UPDATE firma_kurulum SET kira_bitis = now() - interval '1 second' WHERE firma_id = $1", [KA]);
  const k2 = await kira(KA);
  assert.ok(k2 && typeof k2.kira === "string" && k2.kira !== k1.kira);
  assert.deepEqual(await ilerlet(KA, k1.kira, { adim: "hazir" }), { hata: "kira" }, "süresi dolmuş eski kira");
  assert.deepEqual(await ilerlet(KA, k2.kira, { adim: "hazir", durum: "calisiyor", birak: true }), { adim: "hazir", durum: "calisiyor", deneme: 0, surum: 0 });
  /* bırakılan kira hemen alınır; eşzamanlı iki istekten yalnız biri alır */
  const [a, b] = await Promise.all([kira(KA), kira(KA)]);
  assert.deepEqual([a, b].map((x) => (typeof x?.kira === "string" ? "aldi" : x?.hata)).sort(), ["aldi", "kirada"]);
  /* kalıcı hata: iz yazılır — yalnız adım + kısa kod, hata METNİ değil (iz silinemez; 2026-10-15, FV2 incelemesi); Sürdür denemeyi ve hatayı sıfırlar */
  const k3 = (typeof a?.kira === "string" ? a : b)!;
  assert.equal((await ilerlet(KA, k3.kira, { durum: "hata", hata: "Supabase 429: çok istek" }))?.deneme, 1);
  assert.deepEqual(await ilerlet(KA, k3.kira, { durum: "durdu", hata: "Supabase 402: ödeme planı yetersiz", kod: "s402" }), { adim: "hazir", durum: "durdu", deneme: 1, surum: 0 });
  assert.deepEqual(await tek(sahip, "SELECT ayrinti FROM yonetim_izi WHERE ne = 'firma.kurulum_durdu' AND hedef_firma = $1", [KA]),
    { ayrinti: { adim: "hazir", kod: "s402" } });
  assert.deepEqual(await tek(sahip, "SELECT hata, hata_kodu FROM firma_kurulum WHERE firma_id = $1", [KA]), { hata: "Supabase 402: ödeme planı yetersiz", hata_kodu: "s402" });
  assert.equal((await ilerlet(KA, k3.kira, { durum: "calisiyor", birak: true }))?.deneme, 0);
  assert.deepEqual(await tek(sahip, "SELECT hata, hata_kodu FROM firma_kurulum WHERE firma_id = $1", [KA]), { hata: null, hata_kodu: null });
  /* yönetim rolü kurulum satırını doğrudan yazamaz; uygulama rolü hiç göremez */
  await assert.rejects(y((db) => db.sorgu("UPDATE firma_kurulum SET adim = 'tamam'")), izinYok);
  await assert.rejects(y((db) => db.sorgu("INSERT INTO firma_kurulum (firma_id) VALUES ($1)", [A])), izinYok);
  await assert.rejects(havuz.query("SELECT * FROM firma_kurulum"), izinYok);
});

test("kurulum sonu: bağlantı kaydı eksikken / parola onaylanmadan tamamlanmaz; bekleyen → onay → sürüm artar; tamamda firma etkin, girdi boşalır, iz", async () => {
  const r = await kayitAc("Kendi K Muayene", "kendi-k", "KK");
  K = r!.id as string;
  /* firmanın kendi veritabanı (aynı kümede): göçler aynen, kimlik kurulumdaki gibi (adım 5 vt_kimlik, adım 10 firma) */
  const yon = kume.sahipIstemci("postgres");
  await yon.connect();
  try { await yon.query(`CREATE DATABASE ${FIRMA_VT} ENCODING 'UTF8' LOCALE 'C' TEMPLATE template0`); } finally { await yon.end(); }
  sahipFirma = kume.sahipIstemci(FIRMA_VT);
  await sahipFirma.connect();
  await gocleriUygula(sahipFirma);
  await sahipFirma.query("UPDATE vt_kimlik SET tur = 'firma', firma_id = $1 WHERE tur = 'ortak'", [K]);
  await sahipFirma.query("INSERT INTO firma (id, kisa_ad, ad, rapor_kodu, vt) VALUES ($1, 'kendi-k', 'Kendi K Muayene', 'KK', 'kendi')", [K]);
  firmaHavuz = havuzKur({ ...kume.uygulama, database: FIRMA_VT });

  const kr = (await kira(K))!.kira;
  const adim = async (a: string, ek: Record<string, unknown> = {}) => {
    const s = await ilerlet(K, kr, { adim: a, durum: "calisiyor", ...ek });
    assert.equal(s?.adim, a, JSON.stringify(s));
    return s;
  };
  /* sahip parolası proje açılmadan (ref yokken) yazılır — eki ref'siz (2026-10-15, FV2 incelemesi) */
  const sahipParola = kurulumSifrele("sahip-parolasi-uydurma", K, "kurulum_sahip", ANAHTAR);
  await adim("proje", { girdi: { kurulum_sahip: sahipParola } });
  assert.deepEqual((await tek(sahip, "SELECT girdi FROM firma_kurulum WHERE firma_id = $1", [K])), { girdi: { kurulum_sahip: sahipParola } });
  assert.equal(kurulumCoz(sahipParola, K, "kurulum_sahip", ANAHTAR), "sahip-parolasi-uydurma");
  for (const a of ["hazir", "ssl", "goc", "vt_kimlik"]) await adim(a);
  /* rol: bekleyen parola yazılır (ALTER ROLE'den önce); bağlantı alanları değişti → sürüm 1 */
  const parola = baglantiSifrele(kume.uygulama.password, K, null, "uygulama_parolasi", ANAHTAR);
  assert.equal((await adim("rol", { vt: { sunucu: "127.0.0.1", kapi: kume.uygulama.port, vt_ad: FIRMA_VT, kullanici: "probata_uygulama", parola_bekleyen: parola } }))?.surum, 1);
  /* kayıt ayrıcalıklı role ya da izin dışı sunucuya yöneltilemez (veritabanı da reddeder) */
  await assert.rejects(ilerlet(K, kr, { vt: { kullanici: "postgres" } }), /check constraint/);
  await assert.rejects(ilerlet(K, kr, { vt: { sunucu: "db.saldirgan.example" } }), /check constraint/);
  await adim("havuzcu");
  /* Storage: adres kaydın KENDİ projesinin (ref yokken yalnız yerel), adres + gizli anahtar + kova birlikte — veritabanı da reddeder, işlem geri alınır
     (2026-10-15, FV2 incelemesi) */
  const gizli = baglantiSifrele("depo-gizli-uydurma", K, null, "depo_gizli", ANAHTAR);
  for (const [vt, kural] of [
    [{ depo_url: "https://abcdefghijklmnopqrst.supabase.co", depo_gizli: gizli, kova: "probata-dosya" }, /firma_vt_depo_ref/],
    [{ ref: "abcdefghijklmnopqrst", kullanici: "probata_uygulama.abcdefghijklmnopqrst", depo_url: "https://tsrqponmlkjihgfedcba.supabase.co", depo_gizli: gizli,
      kova: "probata-dosya" }, /firma_vt_depo_ref/],
    [{ depo_url: "http://127.0.0.1:54321", kova: "probata-dosya" }, /firma_vt_depo_tam/],
  ] as const) {
    await assert.rejects(ilerlet(K, kr, { vt }), kural, JSON.stringify(vt));
  }
  assert.deepEqual(await tek(sahip, "SELECT ref, depo_url, surum FROM firma_vt WHERE firma_id = $1", [K]), { ref: null, depo_url: null, surum: 1 });
  assert.equal((await adim("depo", { vt: { depo_url: "http://127.0.0.1:54321", depo_gizli: gizli, kova: "probata-dosya" } }))?.surum, 2);
  for (const a of ["dene", "firma", "eposta", "yz"]) await adim(a);
  /* parola onaylanmadı: tamamlanmaz, hiçbir şey yazılmaz */
  await assert.rejects(ilerlet(K, kr, { adim: "tamam", durum: "tamam" }), /bağlantı kaydı eksik/);
  assert.deepEqual(await tek(sahip, "SELECT k.adim, f.durum FROM firma_kurulum k JOIN firma f ON f.id = k.firma_id WHERE k.firma_id = $1", [K]), { adim: "yz", durum: "kurulum" });
  assert.equal(await firmaCoz(havuz, "kendi-k"), null);
  /* onay: bekleyen geçerli olur, sürüm artar */
  assert.equal((await ilerlet(K, kr, { vt: { parola_onayla: true } }))?.surum, 3);
  assert.deepEqual(await tek(sahip, "SELECT parola_sifreli = $2 AS gecerli, parola_bekleyen_sifreli FROM firma_vt WHERE firma_id = $1", [K, parola]),
    { gecerli: true, parola_bekleyen_sifreli: null });
  assert.deepEqual(await ilerlet(K, kr, { adim: "tamam", durum: "tamam" }), { adim: "tamam", durum: "tamam", deneme: 0, surum: 3 });
  assert.deepEqual(await tek(sahip, "SELECT f.durum, k.girdi, k.kira, k.bitti IS NOT NULL AS bitti FROM firma f JOIN firma_kurulum k ON k.firma_id = f.id WHERE f.id = $1", [K]),
    { durum: "etkin", girdi: null, kira: null, bitti: true });
  assert.equal((await tek<{ n: number }>(sahip, "SELECT count(*)::int AS n FROM yonetim_izi WHERE ne = 'firma.kuruldu' AND hedef_firma = $1", [K]))!.n, 1);
  assert.deepEqual(await kira(K), { hata: "tamam" });
  assert.deepEqual(await ilerlet(K, kr, { durum: "hata" }), { hata: "tamam" });
});

test("firma_coz: ortak ve kendi; merkezdeki kayıttan kurulan bağlantı firmanın KENDİ veritabanına gider; şifreli alanlar olduğu gibi", async () => {
  assert.deepEqual(await firmaCoz(havuz, "ortak-a"), { id: A, kisaAd: "ortak-a", vt: "ortak" });
  assert.deepEqual(await firmaCozId(havuz, A), { id: A, kisaAd: "ortak-a", vt: "ortak" });
  const c = await firmaCoz(havuz, "kendi-k");
  assert.ok(c && c.vt === "kendi");
  if (c?.vt !== "kendi") return;
  assert.deepEqual({ ...c.kayit, parolaSifreli: "…", depo: { ...c.kayit.depo!, gizliSifreli: "…" } }, {
    firmaId: K, ref: null, sunucu: "127.0.0.1", kapi: kume.uygulama.port, vtAd: FIRMA_VT, kullanici: "probata_uygulama", parolaSifreli: "…",
    depo: { url: "http://127.0.0.1:54321", gizliSifreli: "…", kova: "probata-dosya" }, surum: 3,
  });
  assert.match(c.kayit.parolaSifreli, /^v1\./, "çözme uygulamada; veritabanı şifreli metni verir");
  assert.deepEqual(await firmaCozId(havuz, K), c);
  /* kayıttan bağlantı → firmanın veritabanı: kendi firması çalışır, başka firmanın işi reddedilir (FV1) */
  const h = havuzKur(kayittanBaglanti(c.kayit, ANAHTAR, { merkezYerel: true }));
  try {
    await kiraciIcinde(h, K, (db) => db.sorgu("INSERT INTO denetim_izi (kim, ne) VALUES ('Deneme Kişi', 'Kayıttan bağlantı')"));
    assert.equal((await tek<{ n: number }>(sahipFirma, "SELECT count(*)::int AS n FROM denetim_izi WHERE ne = 'Kayıttan bağlantı' AND firma_id = $1", [K]))!.n, 1);
    assert.equal((await tek<{ n: number }>(sahip, "SELECT count(*)::int AS n FROM denetim_izi WHERE firma_id = $1", [K]))!.n, 0, "merkeze yazılmadı");
    await assert.rejects(kiraciIcinde(h, A, (db) => db.sorgu("SELECT 1")), yetkisiz);
  } finally { await h.end(); }
  assert.throws(() => kayittanBaglanti(c.kayit, randomBytes(32), { merkezYerel: true }), "başka ana anahtar çözemez");
  assert.throws(() => kayittanBaglanti(c.kayit, ANAHTAR, { merkezYerel: false }), /yerel adreste olamaz/);
  /* Storage: kayıttan, adres denetiminden sonra çözülür (FV5 kullanacak) */
  assert.deepEqual(depoBaglantisi(c.kayit, ANAHTAR, { merkezYerel: true }), { url: "http://127.0.0.1:54321", gizli: "depo-gizli-uydurma", kova: "probata-dosya" });
  assert.throws(() => depoBaglantisi(c.kayit, ANAHTAR, { merkezYerel: false }), /yerel adreste olamaz/);
  /* biçim dışı ad / kimlik veritabanına sorulmaz */
  assert.equal(await firmaCoz(havuz, "Bozuk Ad!"), null);
  assert.equal(await firmaCozId(havuz, "x"), null);
  assert.equal(await firmaCoz(havuz, "olmayan"), null);
});

test("firma_coz: dondurulmuş, bakımdaki (goc_disi), kurulumu bitmemiş firma çözülmez; kiracı işleminden başka firmanın kaydı okunmaz; firma veritabanında RED", async () => {
  /* bakımda */
  await sahip.query("UPDATE firma_vt SET goc_disi = true, goc_disi_gerekce = 'Deneme: proje erişimi koptu' WHERE firma_id = $1", [K]);
  assert.equal(await firmaCoz(havuz, "kendi-k"), null);
  await sahip.query("UPDATE firma_vt SET goc_disi = false, goc_disi_gerekce = NULL WHERE firma_id = $1", [K]);
  await assert.rejects(sahip.query("UPDATE firma_vt SET goc_disi = true WHERE firma_id = $1", [K]), /firma_vt_goc_disi/, "gerekçesiz bakım yok");
  /* ikinci kilit: durumu etkin yazılmış ama kurulumu bitmemiş firma çözülmez */
  await sahip.query("UPDATE firma_kurulum SET adim = 'dene', durum = 'calisiyor', bitti = NULL WHERE firma_id = $1", [K]);
  assert.equal((await tek<{ durum: string }>(sahip, "SELECT durum FROM firma WHERE id = $1", [K]))!.durum, "etkin");
  assert.equal(await firmaCoz(havuz, "kendi-k"), null);
  await sahip.query("UPDATE firma_kurulum SET adim = 'tamam', durum = 'tamam', bitti = now() WHERE firma_id = $1", [K]);
  assert.ok(await firmaCoz(havuz, "kendi-k"));
  /* dondurulmuş (ortak ve kendi) */
  await sahip.query("UPDATE firma SET durum = 'dondu' WHERE id = ANY ($1::uuid[])", [[A, K]]);
  assert.deepEqual([await firmaCoz(havuz, "ortak-a"), await firmaCoz(havuz, "kendi-k"), await firmaCozId(havuz, K)], [null, null, null]);
  await sahip.query("UPDATE firma SET durum = 'etkin' WHERE id = ANY ($1::uuid[])", [[A, K]]);
  /* kiracı işleminin içinden: kendi kaydı okunur, başka firmanınki RED — KAZA ÖNLEMİ (yanlış kimlikle çağrı erken düşer); güvenlik sınırı değil:
     uygulama rolü app.firma_id'yi boşaltıp çağırabilir, dönen yalnız şifreli metin (koruma ana anahtar + ek veri) */
  assert.deepEqual((await kiraciIcinde(havuz, A, (db) => db.sorgu<{ s: unknown }>("SELECT firma_coz_id($1::uuid) AS s", [A]))).rows[0].s,
    { id: A, kisa_ad: "ortak-a", vt: "ortak" });
  await assert.rejects(kiraciIcinde(havuz, A, (db) => db.sorgu("SELECT firma_coz('kendi-k')")), yetkisiz);
  await assert.rejects(kiraciIcinde(havuz, A, (db) => db.sorgu("SELECT firma_coz_id($1::uuid)", [K])), yetkisiz);
  /* firma veritabanında merkez işlevleri reddedilir (yanlış havuz) */
  await assert.rejects(firmaHavuz.query("SELECT firma_coz('kendi-k')"), yetkisiz);
  await assert.rejects(firmaCozId(firmaHavuz, K), yetkisiz);
  await assert.rejects(merkezOku(firmaHavuz, (db) => duyuruListesi(db, 3)), yetkisiz);
});

test("arama yolu: uygulama rolünün geçici tablosu tanımlayıcı-yetkili işlevin tablosunu gölgeleyemez (merkezde firma_coz, firma veritabanında vt_firma_dogrula)", async () => {
  /* 2026-10-15 (FV2 incelemesi): arama yolunda pg_temp yazılmazsa tablo adlarında geçici şemaya EN ÖNCE bakılır; işlem kipindeki havuzcuda geçici tablo
     sunucu bağlantısında kalır, sonraki isteklere de görünür. Her istemci yeni bağlantı: işlev bu oturumda ilk kez derlenir. */
  const istemci = (database: string) => new pg.Client({ host: kume.uygulama.host, port: kume.uygulama.port, user: kume.uygulama.user, password: kume.uygulama.password, database });
  /* merkez: geçici "firma" olmayan bir adı ortak firma, kendi projeli firmayı ortak firma gibi göstermeye çalışır */
  const m = istemci(kume.uygulama.database);
  await m.connect();
  try {
    await m.query("CREATE TEMP TABLE firma (id uuid, kisa_ad text, durum text, vt text)");
    await m.query("INSERT INTO pg_temp.firma VALUES ($1, 'sahte-g', 'etkin', 'ortak'), ($2, 'kendi-k', 'etkin', 'ortak')", [randomUUID(), K]);
    assert.equal((await m.query<{ s: unknown }>("SELECT firma_coz('sahte-g') AS s")).rows[0]!.s, null, "geçici tablodaki ad çözülmedi");
    assert.equal((await m.query<{ s: { vt?: string } | null }>("SELECT firma_coz('kendi-k') AS s")).rows[0]!.s?.vt, "kendi", "gerçek kayıt okundu");
  } finally { await m.end(); }
  /* firma veritabanı: geçici "vt_kimlik" ortak gibi görünse de başka firmanın işi reddedilir (FV1 kilidi aşılmaz) */
  const f = istemci(FIRMA_VT);
  await f.connect();
  try {
    await f.query("CREATE TEMP TABLE vt_kimlik (tek boolean, tur text, firma_id uuid)");
    await f.query("INSERT INTO pg_temp.vt_kimlik VALUES (true, 'ortak', NULL)");
    await assert.rejects(f.query("SELECT vt_firma_dogrula($1::uuid)", [A]), yetkisiz);
    assert.equal((await f.query<{ d: boolean }>("SELECT vt_firma_dogrula($1::uuid) AS d", [K])).rows[0]!.d, true);
  } finally { await f.end(); }
});

test("uygulama rolü firma_vt / firma_kurulum'u ve yönetim işlevlerini doğrudan kullanamaz; yönetim rolü bağlantı alanlarını yazamaz, son durumu yazar", async () => {
  for (const sql of ["SELECT * FROM firma_vt", "SELECT * FROM firma_kurulum", "UPDATE firma_vt SET surum = 9", `SELECT yonetim_firma_baglanti('${K}')`,
    "SELECT * FROM goc_hedefleri()", `SELECT firma_kurulum_kira('${KA}')`, `SELECT firma_kurulum_ilerlet('${KA}', '${randomUUID()}', '{}'::jsonb)`,
    "SELECT yonetim_firma_kayit_ac('X A.Ş.', 'sizma', 'SZ', 'Deneme Kişi', 'a@b.example')", "SELECT * FROM yonetim_firmalar()"]) {
    await assert.rejects(havuz.query(sql), izinYok, sql);
    await assert.rejects(kiraciIcinde(havuz, A, (db) => db.sorgu(sql)), izinYok, sql);
  }
  /* yönetim rolü: okur; bağlantı alanlarını yazamaz; göç / sağlık son durumunu yazar (FV4 / FV7) */
  assert.equal((await y((db) => db.sorgu("SELECT 1 FROM firma_vt WHERE firma_id = $1", [K]))).rowCount, 1);
  for (const sql of ["UPDATE firma_vt SET parola_sifreli = NULL", "UPDATE firma_vt SET sunucu = '127.0.0.1'", "UPDATE firma_vt SET goc_disi = false",
    "INSERT INTO firma_vt (firma_id) VALUES (gen_random_uuid())", "DELETE FROM firma_vt"]) {
    await assert.rejects(y((db) => db.sorgu(sql)), izinYok, sql);
  }
  const s = await y((db) => db.sorgu("UPDATE firma_vt SET son_goc = '0096_merkez_kaydi.sql', goc_sayisi = 97, son_saglik = '{\"durum\": \"tamam\"}', son_saglik_zaman = now() WHERE firma_id = $1", [K]));
  assert.equal(s.rowCount, 1);
});

test("yönetim: firmalar yeni sütunlarla (modülün listesi aynen); firmanın bağlantı kaydı; göç hedefleri açılış sırasıyla, bakımdaki hariç, yöneticisiz de", async () => {
  const l = (await y((db) => db.sorgu<{ id: string; vt: string; durum: string; kurulum_adim: string | null; kurulum_durum: string | null; goc_disi: boolean; kullanici: number }>(
    "SELECT id::text, vt, durum, kurulum_adim, kurulum_durum, goc_disi, kullanici FROM yonetim_firmalar()"))).rows;
  const bul = (id: string) => { const x = l.find((r) => r.id === id); return x && { vt: x.vt, durum: x.durum, adim: x.kurulum_adim, kd: x.kurulum_durum, goc_disi: x.goc_disi }; };
  assert.deepEqual(bul(A), { vt: "ortak", durum: "etkin", adim: null, kd: null, goc_disi: false });
  assert.deepEqual(bul(K), { vt: "kendi", durum: "etkin", adim: "tamam", kd: "tamam", goc_disi: false });
  assert.deepEqual(bul(KA), { vt: "kendi", durum: "kurulum", adim: "hazir", kd: "calisiyor", goc_disi: false });
  /* modülün listesi (src/modules/yonetim/server/yonetim.ts) bugünkü sütunlarla çalışır */
  assert.deepEqual((await y((db) => firmalar(db))).map((f) => f.kisaAd).sort(), ["kendi-k", "kurulum-a", "ortak-a"]);
  await assert.rejects(yoneticisiz((db) => db.sorgu("SELECT * FROM yonetim_firmalar()")), /yönetim işlemi değil/);
  /* bağlantı kaydı: kendi projelide bağlantı + kurulum, ortakta yalnız tür */
  assert.deepEqual(await j("SELECT yonetim_firma_baglanti($1) AS s", [A]), { id: A, kisa_ad: "ortak-a", durum: "etkin", vt: "ortak" });
  const b = await j("SELECT yonetim_firma_baglanti($1) AS s", [K]);
  assert.deepEqual({ ...b, parola: "…", depo_gizli: "…" }, {
    id: K, kisa_ad: "kendi-k", durum: "etkin", vt: "kendi", ref: null, sunucu: "127.0.0.1", kapi: kume.uygulama.port, vt_ad: FIRMA_VT,
    kullanici: "probata_uygulama", parola: "…", depo_url: "http://127.0.0.1:54321", depo_gizli: "…", kova: "probata-dosya", surum: 3, goc_disi: false,
    kurulum: { adim: "tamam", durum: "tamam" },
  });
  assert.equal(await j("SELECT yonetim_firma_baglanti($1) AS s", [randomUUID()]), null);
  await assert.rejects(yoneticisiz((db) => db.sorgu("SELECT yonetim_firma_baglanti($1)", [K])), /yönetim işlemi değil/);
  /* göç hedefleri: yöneticisiz yönetim işlemi de okur (derleme adımı); bağlantısı olmayan kurulum dışarıda; bakımdaki dışarıda. Son göç burada yazılır
     (önceki testin yazdığına dayanmaz — FV2 incelemesi) */
  await y((db) => db.sorgu("UPDATE firma_vt SET son_goc = '0096_merkez_kaydi.sql', goc_sayisi = 97 WHERE firma_id = $1", [K]));
  const hedefler = async () => (await yoneticisiz((db) => db.sorgu<{ firma_id: string; parola_sifreli: string; kurulum_durum: string; son_goc: string }>(
    "SELECT firma_id::text, parola_sifreli, kurulum_durum, son_goc FROM goc_hedefleri()"))).rows;
  const h1 = await hedefler();
  assert.deepEqual(h1.map((x) => [x.firma_id, x.kurulum_durum, x.son_goc]), [[K, "tamam", "0096_merkez_kaydi.sql"]]);
  assert.match(h1[0]!.parola_sifreli, /^v1\./);
  await sahip.query("UPDATE firma_vt SET goc_disi = true, goc_disi_gerekce = 'Deneme: bakımda, göç dışı' WHERE firma_id = $1", [K]);
  assert.deepEqual(await hedefler(), []);
  await sahip.query("UPDATE firma_vt SET goc_disi = false, goc_disi_gerekce = NULL WHERE firma_id = $1", [K]);
});

test("kendi projeli firmada dondurma merkezde YALNIZ durum + iz, geçici parola HİÇBİR ŞEY yazmaz (firma veritabanına dokunulmaz — FV9); ortak firmada 0050 ile aynı", async () => {
  const firmaIzi = async () => (await tek<{ n: number }>(sahipFirma, "SELECT count(*)::int AS n FROM denetim_izi"))!.n;
  const once = await firmaIzi();
  assert.deepEqual(await j("SELECT yonetim_firma_durum($1, 'dondu') AS s", [K]), { durum: "dondu", vt: "kendi" });
  assert.equal((await tek<{ durum: string }>(sahip, "SELECT durum FROM firma WHERE id = $1", [K]))!.durum, "dondu");
  assert.equal(await firmaCoz(havuz, "kendi-k"), null, "dondurulmuş firma çözülmez");
  assert.deepEqual(await tek(sahip, "SELECT kim, ayrinti FROM yonetim_izi WHERE ne = 'firma.donduruldu' AND hedef_firma = $1", [K]),
    { kim: "y@probata.example", ayrinti: { vt: "kendi" } });
  assert.equal((await tek<{ n: number }>(sahip, "SELECT count(*)::int AS n FROM denetim_izi WHERE firma_id = $1", [K]))!.n, 0, "merkezde firmanın izi yok");
  assert.equal(await firmaIzi(), once, "firma veritabanına yazılmadı");
  assert.equal((await tek<{ durum: string }>(sahipFirma, "SELECT durum FROM firma WHERE id = $1", [K]))!.durum, "etkin", "firma tarafı FV9'da");
  assert.deepEqual(await j("SELECT yonetim_firma_durum($1, 'dondu') AS s", [K]), { hata: "ayni" });
  assert.deepEqual(await j("SELECT yonetim_gecici_parola($1, 'scrypt$x') AS s", [K]), { hata: "dondu" });
  assert.deepEqual(await j("SELECT yonetim_firma_durum($1, 'etkin') AS s", [K]), { durum: "etkin", vt: "kendi" });
  assert.ok(await firmaCoz(havuz, "kendi-k"));
  /* 2026-10-15 (FV2 incelemesi): parola firma veritabanında değişir (FV9); merkez değişmemiş parolanın silinemez izini YAZMAZ, reddeder */
  assert.deepEqual(await j("SELECT yonetim_gecici_parola($1, 'scrypt$x') AS s", [K]), { hata: "kendi" });
  assert.deepEqual(await y((db) => yoneticiyeGeciciParola(db, K)), { durum: "red", neden: "İşlem yapılamadı." });
  assert.equal((await tek<{ n: number }>(sahip, "SELECT count(*)::int AS n FROM yonetim_izi WHERE ne = 'hesap.gecici_parola' AND hedef_firma = $1", [K]))!.n, 0,
    "parola değişmedi → iz yok");
  /* ortak firma: oturumlar silinir, firmanın denetim izine yazılır (0050) */
  assert.deepEqual(await j("SELECT yonetim_firma_durum($1, 'dondu') AS s", [A]), { durum: "dondu" });
  assert.equal((await tek<{ n: number }>(sahip, "SELECT count(*)::int AS n FROM denetim_izi WHERE firma_id = $1 AND ne = 'firma.donduruldu'", [A]))!.n, 1);
  assert.deepEqual(await j("SELECT yonetim_firma_durum($1, 'etkin') AS s", [A]), { durum: "etkin" });
  assert.deepEqual(await j("SELECT yonetim_gecici_parola($1, 'scrypt$x') AS s", [A]), { hata: "hesap_yok" });
});

test("merkezOku: kiracısız ve salt okunur (yazma reddedilir); merkezdeki ortak bilgi okunur", async () => {
  assert.deepEqual(await merkezOku(havuz, (db) => duyuruListesi(db, 3)), []);
  assert.equal(await merkezOku(havuz, async (db) => (await db.sorgu<{ f: string }>("SELECT current_setting('app.firma_id', true) AS f")).rows[0].f), "");
  await assert.rejects(merkezOku(havuz, (db) => db.sorgu("INSERT INTO denetim_izi (firma_id, kim, ne) VALUES ($1, 'x', 'y')", [A])),
    (e: unknown) => (e as { code?: string }).code === "25006");
});

test("SCRAM özetiyle rol girişi: ALTER ROLE … PASSWORD '<özet>' → düz parolayla girilir, yanlış parolayla girilmez; PostgreSQL özeti olduğu gibi saklar", async () => {
  const parola = randomBytes(32).toString("base64url");
  const ozet = scramOzeti(parola);
  assert.ok(scramOzetiMi(ozet), "sorgu metnine yalnız denetlenmiş özet konur");
  const s = kume.sahipIstemci("postgres");
  await s.connect();
  try {
    await s.query("DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'probata_scram_deneme') THEN CREATE ROLE probata_scram_deneme NOLOGIN; END IF; END $$");
    await s.query(`ALTER ROLE probata_scram_deneme LOGIN PASSWORD '${ozet}'`);
    assert.equal((await tek<{ p: string }>(s, "SELECT rolpassword AS p FROM pg_authid WHERE rolname = 'probata_scram_deneme'"))!.p, ozet, "yeniden özetlenmedi");
  } finally { await s.end(); }
  const giris = (p: string) => new pg.Client({ host: kume.uygulama.host, port: kume.uygulama.port, user: "probata_scram_deneme", password: p, database: "postgres" });
  const c = giris(parola);
  await c.connect();
  try {
    assert.equal((await tek<{ u: string }>(c, "SELECT current_user AS u"))!.u, "probata_scram_deneme");
  } finally { await c.end(); }
  /* yanlış parola: sunucu bağlantıyı kapatır (istemcide kapatılacak bir şey kalmaz) */
  await assert.rejects(giris(`${parola}x`).connect(), (e: unknown) => (e as { code?: string }).code === "28P01");
});

test("göç 0096 ikinci kez koşunca hata vermez, kayıtlar ve işlevler aynen; göç koşucusu bir şey uygulamaz", async () => {
  const metin = readFileSync(new URL("../src/server/db/gocler/0096_merkez_kaydi.sql", import.meta.url), "utf8");
  const sayim = () => tek(sahip, "SELECT (SELECT count(*)::int FROM firma_vt) AS vt, (SELECT count(*)::int FROM firma_kurulum) AS kurulum, (SELECT count(*)::int FROM firma) AS firma");
  const once = await sayim();
  await sahip.query("BEGIN");
  try { await sahip.query(metin); await sahip.query("COMMIT"); } catch (e) { await sahip.query("ROLLBACK"); throw e; }
  assert.deepEqual(await sayim(), once);
  assert.ok((await y((db) => firmalar(db))).length >= 3);
  assert.ok(await firmaCoz(havuz, "kendi-k"));
  await assert.rejects(havuz.query("SELECT * FROM yonetim_firmalar()"), izinYok, "yeniden kurulan işlev yine yalnız yönetimde");
  assert.deepEqual(await gocleriUygula(sahip), []);
});
