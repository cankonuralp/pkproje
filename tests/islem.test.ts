/* NEREDEN GELDİ: 392 — 09-D2 ("çevrimdışı işlem tek seferlik: işlem kimliği sunucuda benzersiz; aynı kimlik ikinci kez işlenmez … çakışmada sunucu
   kazanır, cihaz kullanıcıya gösterir"), 09-D1 (sessiz ezme yok), ARKA-UC §4.3 / §4.4, KOD-GECIS K3 "çevrimdışı kuyruk ölçüldü (bağlantı kes /
   gönder / çakışma)", maket Z4 (kuyruğa girenler rapor Kaydet ve Onaya gönder). GERÇEK PostgreSQL, iki firma (göç 0076; src/server/islem/islem.ts,
   raporlar/server/islem-baglanti.ts):
   · aynı kimlik ikinci kez gelince iş tekrar yapılmaz (sürüm bir kez artar, denetim izinde tek kayıt), saklanan sonuç döner;
   · cihazın gördüğü sürüm eskiyse "çakışma": rapor değişmez, sonuç saklanır (aynı kimlik yine çakışma) — yeniden göndermek yeni kimlik ister;
   · Onaya gönder kuyruktan: eksikte "eksik" (kaydedildi, gönderilmedi), tamsa onayda; tekrarı yeniden göndermez;
   · aynı kimlik aynı anda iki istekte: iş bir kez (ikincisi saklanan sonucu alır);
   · kimlik başka kişinin işleminde ya da aynı kimlikle başka iş / başka kayıt: iş YAPILMAZ;
   · yetki ve kiracı modülde: başka denetçinin raporu "yetkisiz", B firmasının işleminde A'nın raporu "yok" (rapor değişmez);
   · GÜVENLİK: işlem kaydı değişmez / silinmez; kişi yalnız kendi işlemlerini görür (aynı firmada da); hesap ve alınma anı veritabanından;
     kimlik sorgusu yalnız evet / hayır, tanımlayıcı-yetkili, PUBLIC'e kapalı.
   Olumsuz kanıt: tests/bozan/islem.bozan.ts. */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import type { GomuluKume } from "../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz, type Sorgulayici } from "../src/server/db/kiraci.ts";
import { klasorDepo } from "../src/server/dosya/depo.ts";
import { tekSeferlik } from "../src/server/islem/islem.ts";
import { YAZAN_BICIMI, yazanEtiketi } from "../src/server/islem/yazan.ts";
import { planIci, planKabul } from "../src/modules/planlar/server/plan-ici.ts";
import { bugunTr, planAc } from "../src/modules/planlar/server/planlar.ts";
import { taslakBaslat, yayinla } from "../src/modules/rapor-format/server/formatlar.ts";
import { raporIslemi, type RaporIslemTuru } from "../src/modules/raporlar/server/islem-baglanti.ts";
import { raporOlustur, sahaRaporu, type Kisi, type RaporYazma } from "../src/modules/raporlar/server/raporlar.ts";
import { SABLONLAR } from "../src/format/sablonlar.ts";
import { testKumesi } from "./yardimci/kume.ts";

let kume: GomuluKume, havuz: Havuz;
let A = "", B = "";
const klasor = mkdtempSync(join(tmpdir(), "islem-depo-"));
const depo = klasorDepo(klasor);
const tamam = <R extends { durum: string }>(r: R) => { assert.equal(r.durum, "tamam", JSON.stringify(r)); return r as Extract<R, { durum: "tamam" }>; };
let YON: Kisi, PLAN: Kisi, DEN: Kisi, DEN2: Kisi, DEN_B: Kisi;
let denP = "", t1 = "", ht = "", ekp: Record<string, string> = {}, plan = "";
const a = <T,>(k: Kisi, is: (db: Sorgulayici) => Promise<T>) => kiraciIcinde(havuz, A, is, { hesapId: k.id });
const sql = <T extends object>(firma: string, metin: string, p: unknown[] = [], hesapId?: string) =>
  kiraciIcinde(havuz, firma, (db) => db.sorgu<T & Record<string, unknown>>(metin, p), hesapId ? { hesapId } : {});
async function hesap(firma: string, eposta: string, roller: string[], ad: string, personel: string | null = null): Promise<Kisi> {
  const id = (await kiraciIcinde(havuz, firma, (db) => db.sorgu<{ id: string }>(
    "INSERT INTO hesap (eposta, ad, roller, durum, personel_id) VALUES ($1, $2, $3, 'etkin', $4) RETURNING id::text", [eposta, ad, roller, personel]))).rows[0].id;
  return { id, ad, roller: roller as Kisi["roller"] };
}
const KOMP = SABLONLAR.KOMPRESOR.tanim;
const MADDELER = KOMP.bolumler.flatMap((b) => (b.blok === "liste" ? b.gruplar.flatMap((g) => g.maddeler) : []));
/** formun tam hâli (KOMPRESOR); bas: raporun açılıştaki başlangıcı */
const tamGirdi = (bas: string, marka = "Deneme Marka") => ({
  ekipman: { marka, model: "K-100", seri: "S-0001", imal: "2015", konum: "Kazan dairesi", amac: "Basınçlı hava", bolum: "Üretim" },
  tarih: { bas, bit: null, sonraki: null, takip: null, rapor: null },
  cevaplar: {
    alan: { marka: "Deneme Marka K-100", imal: "2015", calisma: "10" },
    madde: Object.fromEntries(MADDELER.map((m) => [m.id, { c: "Uygun" }])),
    deger: { hidro: "17", ventil: "10" }, sonuc: "uygun", yorum: "",
  },
});
const bosGirdi = (bas: string) => ({
  ekipman: { marka: null, model: null, seri: null, imal: null, konum: null, amac: null, bolum: null },
  tarih: { bas, bit: null, sonraki: null, takip: null, rapor: null }, cevaplar: {},
});

before(async () => {
  kume = await testKumesi();
  havuz = havuzKur(kume.uygulama);
  const s = kume.sahipIstemci(); await s.connect();
  try {
    [A, B] = (await s.query<{ id: string }>(
      "INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('islem-a', 'İşlem A', 'IA'), ('islem-b', 'İşlem B', 'IB') RETURNING id::text")).rows.map((r) => r.id);
  } finally { await s.end(); }
  const q = async (firma: string, metin: string, p: unknown[] = []) => (await sql<{ id: string }>(firma, metin, p)).rows[0].id;
  denP = await q(A, "INSERT INTO personel (ad, basla, meslek, ekipnet) VALUES ('Deneme Denetçi', '2024-01-01', 'mak-muh', '123') RETURNING id::text");
  const den2P = await q(A, "INSERT INTO personel (ad, basla, meslek, ekipnet) VALUES ('Deneme Denetçi İki', '2024-01-01', 'mak-muh', '124') RETURNING id::text");
  YON = await hesap(A, "yon@islem-a.example", ["firma_yoneticisi"], "Deneme Yönetici");
  PLAN = await hesap(A, "plan@islem-a.example", ["planlama"], "Deneme Planlama");
  DEN = await hesap(A, "den@islem-a.example", ["denetci"], "Deneme Denetçi", denP);
  DEN2 = await hesap(A, "den2@islem-a.example", ["denetci"], "Deneme Denetçi İki", den2P);
  DEN_B = await hesap(B, "den@islem-b.example", ["denetci"], "Deneme Denetçi B");
  const m1 = await q(A, "INSERT INTO musteri (unvan, kisa) VALUES ('Deneme Bir Sanayi A.Ş.', 'Deneme Bir') RETURNING id::text");
  t1 = await q(A, "INSERT INTO tesis (musteri_id, ad) VALUES ($1, 'Merkez') RETURNING id::text", [m1]);
  ht = await q(A, "INSERT INTO ekipman_turu (kod, ad, grup, brans, periyot) VALUES ('HT', 'Hava tankı', 'basincli', 'm', 12) RETURNING id::text");
  for (const kod of ["HT-1", "HT-2", "HT-3", "HT-4", "HT-5"]) await q(A, "INSERT INTO ekipman (tesis_id, tur_id, kod, ekleyen) VALUES ($1, $2, $3, 'x') RETURNING id::text", [t1, ht, kod]);
  ekp = Object.fromEntries((await sql<{ kod: string; id: string }>(A, "SELECT kod, id::text FROM ekipman")).rows.map((x) => [x.kod, x.id]));
  await a(YON, async (db) => {
    const t = tamam(await taslakBaslat(db, YON, ht, "sablon:KOMPRESOR", null));
    tamam(await yayinla(db, YON, t.id, t.surum, ""));
  });
  plan = tamam(await a(PLAN, (db) => planAc(db, depo, PLAN, A, { tesis: t1, baslangic: bugunTr(), bitis: bugunTr(),
    ekip: [{ personel: denP, isgNo: "ISG-1", kaydet: false }, { personel: den2P, isgNo: "ISG-2", kaydet: false }] }))).id;
  /* plan ekibinden biri kabul eder (plan "kabul edildi" olur; ekipteki öteki denetçi de o plana rapor açar) */
  tamam(await a(DEN, async (db) => planKabul(db, DEN, plan, (await planIci(db, DEN, plan))!.surum, true)));
});
after(async () => { await havuz?.end(); await kume?.durdur(); rmSync(klasor, { recursive: true, force: true }); });

/** yeni rapor (kişinin), açılış sürümü ve başlangıcı */
async function rapor(kim: Kisi, kod: string) {
  const id = tamam(await a(kim, (db) => raporOlustur(db, kim, plan, ekp[kod]))).id;
  const v = (await a(kim, (db) => sahaRaporu(db, kim, id)))!;
  return { id, surum: v.surum, bas: v.tarih.bas! };
}
/** kuyruktan gelen işi /api/islem'in yaptığı gibi uygular */
const isle = (kim: Kisi, id: string, tur: RaporIslemTuru, kayit: string, surum: number, girdi: unknown, firma = A) =>
  kiraciIcinde(havuz, firma, (db) => tekSeferlik<RaporYazma>(db, { id, tur, kayit, zaman: new Date().toISOString() },
    () => raporIslemi(db, kim, tur, kayit, surum, girdi)), { hesapId: kim.id });
const raporSatiri = async (id: string) => (await sql<{ surum: number; durum: string; ekipman_bilgi: { marka?: string } }>(A,
  "SELECT surum, durum, ekipman_bilgi FROM rapor WHERE id = $1", [id])).rows[0];
const izSayisi = async (id: string, ne: string) => (await sql<{ n: number }>(A,
  "SELECT count(*)::int AS n FROM denetim_izi WHERE nesne_id = $1 AND ne = $2", [id, ne])).rows[0].n;

test("aynı kimlik ikinci kez gelince iş tekrar yapılmaz: sürüm bir kez artar, denetim izinde tek kayıt, saklanan sonuç döner", async () => {
  const r = await rapor(DEN, "HT-1");
  const id = randomUUID();
  const s1 = await isle(DEN, id, "rapor.kaydet", r.id, r.surum, tamGirdi(r.bas));
  assert.equal(s1.durum, "yeni");
  assert.equal(s1.durum === "yeni" && s1.sonuc.durum, "tamam");
  const sonra = await raporSatiri(r.id);
  assert.equal(sonra.surum, r.surum + 1);
  assert.equal(sonra.ekipman_bilgi.marka, "Deneme Marka");
  /* yanıt yolda kayboldu, cihaz aynı kimlikle yeniden gönderdi */
  const s2 = await isle(DEN, id, "rapor.kaydet", r.id, r.surum, tamGirdi(r.bas, "Başka Marka"));
  assert.deepEqual(s2, { durum: "tekrar", sonuc: s1.durum === "yeni" ? s1.sonuc : null });
  assert.equal((await raporSatiri(r.id)).surum, r.surum + 1, "iş tekrar yapılmadı");
  assert.equal((await raporSatiri(r.id)).ekipman_bilgi.marka, "Deneme Marka");
  assert.equal(await izSayisi(r.id, "rapor.kaydet"), 1);
  /* işlem kaydı: hesap ve alınma anı veritabanından, cihaz zamanı saklı */
  const k = (await sql<{ hesap_id: string; tur: string; kayit_id: string; cihaz_zamani: Date | null; alindi: Date }>(A,
    "SELECT hesap_id::text, tur, kayit_id::text, cihaz_zamani, alindi FROM islem WHERE id = $1", [id], DEN.id)).rows[0];
  assert.deepEqual([k.hesap_id, k.tur, k.kayit_id], [DEN.id, "rapor.kaydet", r.id]);
  assert.ok(k.cihaz_zamani && Date.now() - k.alindi.getTime() < 60_000);
});

test("cihazın gördüğü sürüm eskiyse çakışma: rapor değişmez, sonuç saklanır; yeniden göndermek yeni kimlik ister (sessiz ezme yok)", async () => {
  const r = await rapor(DEN, "HT-2");
  tamam((await isle(DEN, randomUUID(), "rapor.kaydet", r.id, r.surum, tamGirdi(r.bas, "Sunucudaki"))).durum === "yeni"
    ? { durum: "tamam" } : { durum: "x" });
  /* cihaz eski sürümü görmüştü: başka yerde değişen rapor ezilmez */
  const id = randomUUID();
  const s = await isle(DEN, id, "rapor.kaydet", r.id, r.surum, tamGirdi(r.bas, "Cihazdaki"));
  assert.deepEqual(s, { durum: "yeni", sonuc: { durum: "cakisma" } });
  assert.equal((await raporSatiri(r.id)).ekipman_bilgi.marka, "Sunucudaki");
  assert.deepEqual(await isle(DEN, id, "rapor.kaydet", r.id, r.surum, tamGirdi(r.bas, "Cihazdaki")), { durum: "tekrar", sonuc: { durum: "cakisma" } });
  /* kullanıcı "benimkini yaz" derse cihaz güncel sürümle YENİ kimlik gönderir */
  const g = await raporSatiri(r.id);
  const y = await isle(DEN, randomUUID(), "rapor.kaydet", r.id, g.surum, tamGirdi(r.bas, "Cihazdaki"));
  assert.equal(y.durum === "yeni" && y.sonuc.durum, "tamam");
  assert.equal((await raporSatiri(r.id)).ekipman_bilgi.marka, "Cihazdaki");
});

test("Onaya gönder kuyruktan: eksikte 'eksik' (kaydedildi, gönderilmedi); tamsa onayda; tekrarı yeniden göndermez", async () => {
  const r = await rapor(DEN, "HT-3");
  const e = await isle(DEN, randomUUID(), "rapor.gonder", r.id, r.surum, bosGirdi(r.bas));
  assert.equal(e.durum === "yeni" && e.sonuc.durum, "eksik");
  assert.equal((await raporSatiri(r.id)).durum, "taslak");
  const g = await raporSatiri(r.id);
  const id = randomUUID();
  const s = await isle(DEN, id, "rapor.gonder", r.id, g.surum, tamGirdi(r.bas));
  assert.equal(s.durum === "yeni" && s.sonuc.durum, "tamam", JSON.stringify(s));
  const once = await raporSatiri(r.id);
  assert.equal(once.durum, "onayda");
  assert.equal((await isle(DEN, id, "rapor.gonder", r.id, g.surum, tamGirdi(r.bas))).durum, "tekrar");
  assert.equal((await raporSatiri(r.id)).surum, once.surum, "tekrar yeniden göndermedi");
  assert.equal(await izSayisi(r.id, "rapor.onaya_gonder"), 1);
});

test("aynı kimlik aynı anda iki istekte: iş bir kez, ikincisi saklanan sonucu alır", async () => {
  const r = await rapor(DEN, "HT-4");
  const id = randomUUID();
  const [x, y] = await Promise.all([isle(DEN, id, "rapor.kaydet", r.id, r.surum, tamGirdi(r.bas)), isle(DEN, id, "rapor.kaydet", r.id, r.surum, tamGirdi(r.bas))]);
  assert.deepEqual([x.durum, y.durum].sort(), ["tekrar", "yeni"]);
  assert.deepEqual(x.durum !== "kimlik_kullanildi" && x.sonuc, y.durum !== "kimlik_kullanildi" && y.sonuc);
  assert.equal((await raporSatiri(r.id)).surum, r.surum + 1);
  assert.equal(await izSayisi(r.id, "rapor.kaydet"), 1);
});

test("kimlik başka kişinin işleminde ya da aynı kimlikle başka iş / kayıt: iş yapılmaz; yetki ve kiracı modülde", async () => {
  const r = await rapor(DEN, "HT-5");
  const id = randomUUID();
  assert.equal((await isle(DEN, id, "rapor.kaydet", r.id, r.surum, tamGirdi(r.bas))).durum, "yeni");
  const s = await raporSatiri(r.id);
  /* aynı kimlik başka iş / başka kayıt: yapılmaz */
  assert.deepEqual(await isle(DEN, id, "rapor.gonder", r.id, s.surum, tamGirdi(r.bas)), { durum: "kimlik_kullanildi" });
  assert.equal((await raporSatiri(r.id)).durum, "taslak");
  /* aynı firmada başka kişi aynı kimliği kullanırsa: iş yapılmaz, öteki kişinin işlemi görünmez */
  assert.deepEqual(await isle(DEN2, id, "rapor.kaydet", r.id, s.surum, tamGirdi(r.bas, "Başkası")), { durum: "kimlik_kullanildi" });
  assert.equal((await raporSatiri(r.id)).ekipman_bilgi.marka, "Deneme Marka");
  /* başka denetçinin raporu: modül "yetkisiz" der (saklanır), rapor değişmez */
  const y = await isle(DEN2, randomUUID(), "rapor.kaydet", r.id, s.surum, tamGirdi(r.bas, "Başkası"));
  assert.deepEqual(y, { durum: "yeni", sonuc: { durum: "yetkisiz" } });
  /* B firmasının işleminde A'nın raporu yok */
  const b = await isle(DEN_B, randomUUID(), "rapor.kaydet", r.id, s.surum, tamGirdi(r.bas, "B"), B);
  assert.deepEqual(b, { durum: "yeni", sonuc: { durum: "yok" } });
  assert.deepEqual([(await raporSatiri(r.id)).surum, (await raporSatiri(r.id)).ekipman_bilgi.marka], [s.surum, "Deneme Marka"]);
});

test("GÜVENLİK: işlem kaydı değişmez / silinmez; kişi yalnız kendisininkileri görür; hesap istemciden yazılamaz; kimlik sorgusu yalnız evet / hayır", async () => {
  const kendi = (k: Kisi) => sql<{ n: number }>(A, "SELECT count(*)::int AS n FROM islem", [], k.id).then((x) => x.rows[0].n);
  assert.ok((await kendi(DEN)) >= 8);
  assert.equal(await kendi(DEN2), 1, "aynı firmada öteki kişinin işlemleri görünmez");
  assert.equal(await kendi(YON), 0, "firma yöneticisi de başkasının işlemini görmez");
  assert.equal((await sql<{ n: number }>(B, "SELECT count(*)::int AS n FROM islem", [], DEN_B.id)).rows[0].n, 1);
  await assert.rejects(sql(A, "UPDATE islem SET sonuc = '{}'", [], DEN.id), /permission denied|izin|değişmez/i);
  await assert.rejects(sql(A, "DELETE FROM islem", [], DEN.id), /permission denied|izin|değişmez/i);
  /* hesap istemciden yazılamaz: başkası adına yazılan satır oturumdaki kişiye düşer */
  const sahte = randomUUID();
  await sql(A, "INSERT INTO islem (id, hesap_id, tur, kayit_id, sonuc) VALUES ($1, $2, 'rapor.kaydet', $3, '{}')", [sahte, DEN2.id, randomUUID()], DEN.id);
  assert.equal((await sql<{ h: string }>(A, "SELECT hesap_id::text AS h FROM islem WHERE id = $1", [sahte], DEN.id)).rows[0].h, DEN.id);
  /* hesapsız bağlam işlem yazamaz */
  await assert.rejects(sql(A, "INSERT INTO islem (id, tur, kayit_id, sonuc) VALUES ($1, 'rapor.kaydet', $2, '{}')", [randomUUID(), randomUUID()]), /oturumdaki kişi/);
  /* kimlik sorgusu: yalnız evet / hayır; firma süzgeçli (B'den A'nın kimliği görünmez) */
  assert.equal((await sql<{ v: boolean }>(A, "SELECT islem_kimlik_baskasinda($1) AS v", [sahte], DEN2.id)).rows[0].v, true);
  assert.equal((await sql<{ v: boolean }>(B, "SELECT islem_kimlik_baskasinda($1) AS v", [sahte], DEN_B.id)).rows[0].v, false);
  const s = kume.sahipIstemci(); await s.connect();
  try {
    const r = (await s.query<{ guvenli: boolean; yol: boolean; herkes: boolean; uygulama: boolean }>(
      `SELECT p.prosecdef AS guvenli, coalesce(array_to_string(p.proconfig, ',') LIKE '%search_path=%', false) AS yol,
         EXISTS (SELECT 1 FROM aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) x WHERE x.grantee = 0 AND x.privilege_type = 'EXECUTE') AS herkes,
         has_function_privilege('probata_uygulama', p.oid, 'EXECUTE') AS uygulama
       FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public' AND p.proname = 'islem_kimlik_baskasinda'`)).rows;
    assert.deepEqual(r, [{ guvenli: true, yol: true, herkes: false, uygulama: true }]);
    const t = (await s.query<{ r: boolean; f: boolean }>("SELECT relrowsecurity AS r, relforcerowsecurity AS f FROM pg_class WHERE relname = 'islem'")).rows[0];
    assert.deepEqual(t, { r: true, f: true });
  } finally { await s.end(); }
});

test("yazan etiketi: kişiye sabit, 22 karakter, kişiler arasında farklı, kimliği taşımaz (tarayıcıya kimlik gitmez)", () => {
  const a1 = yazanEtiketi(DEN.id), a2 = yazanEtiketi(DEN.id), b = yazanEtiketi(DEN2.id);
  assert.equal(a1, a2);
  assert.match(a1, YAZAN_BICIMI);
  assert.notEqual(a1, b);
  assert.ok(!a1.includes(DEN.id.slice(0, 8)));
});
