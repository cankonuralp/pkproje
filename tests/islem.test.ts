/* NEREDEN GELDİ: 392 — 09-D2 ("çevrimdışı işlem tek seferlik: işlem kimliği sunucuda benzersiz; aynı kimlik ikinci kez işlenmez … çakışmada sunucu
   kazanır, cihaz kullanıcıya gösterir"), 09-D1 (sessiz ezme yok), ARKA-UC §4.3 / §4.4, KOD-GECIS K3 "çevrimdışı kuyruk ölçüldü (bağlantı kes /
   gönder / çakışma)", maket Z4 (kuyruğa girenler rapor Kaydet ve Onaya gönder). GERÇEK PostgreSQL, iki firma (göç 0076; src/server/islem/islem.ts,
   raporlar/server/islem-baglanti.ts):
   · aynı kimlik ikinci kez gelince iş tekrar yapılmaz (sürüm bir kez artar, denetim izinde tek kayıt), saklanan sonuç döner;
   · cihazın gördüğü sürüm eskiyse "çakışma": rapor değişmez, sonuç saklanır (aynı kimlik yine çakışma) — yeniden göndermek yeni kimlik ister;
   · Onaya gönder kuyruktan: eksikte "eksik" (kaydedildi, gönderilmedi); tekrarı yeniden kaydetmez, aynı sonucu döner;
   · aynı kimlik aynı anda iki istekte: iş bir kez (ikincisi saklanan sonucu alır);
   · kimlik başka kişinin işleminde ya da aynı kimlikle başka iş / başka kayıt: iş YAPILMAZ;
   · yetki ve kiracı modülde: başka denetçinin raporu ona görünmez ("yok"), B firmasının işleminde A'nın raporu "yok" (rapor değişmez);
   · 398 fotoğraf (rapor.foto): raporun o anki sürümüne eklenir, kaydı ezmez, önceki / sonraki sürüm döner; tekrarı ikinci fotoğraf eklemez;
     fotoğraf olmayan içerik, bozuk metin, olmayan yer, başka denetçi, başka firma eklenmez;
   · 400 plan kabul / red (plan.kabul, plan.red): beyan onayı ("evet" — uydurma değer değil) ve okunan metnin özeti şart; tekrarı yeniden yapmaz;
     eski sürüm çakışma; red gerekçesiz olmaz; ekip dışı denetçi ve başka firma yapamaz;
   · 405 bağlantısız yeni rapor: paket yalnız raporu olmayan etkin ekipmanlar + formatları (kabul edilmemiş planda neden; ekip dışı / başka
     firma null); rapor.olustur raporu sunucuda açar (kimlik ve numara sunucunun), tekrarı ikinci rapor açmaz, kurallar ve yetki aynen;
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
import { planIslemi, type PlanIslemTuru } from "../src/modules/planlar/server/islem-baglanti.ts";
import { planIci, planKabul, type PlanYazma } from "../src/modules/planlar/server/plan-ici.ts";
import { bugunTr, planAc } from "../src/modules/planlar/server/planlar.ts";
import { taslakBaslat, yayinla } from "../src/modules/rapor-format/server/formatlar.ts";
import { raporIslemi, type RaporIslemSonucu, type RaporIslemTuru } from "../src/modules/raporlar/server/islem-baglanti.ts";
import { raporOlustur, sahaRaporu, yeniRaporPaketi, type Kisi } from "../src/modules/raporlar/server/raporlar.ts";
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
  for (const kod of ["HT-1", "HT-2", "HT-3", "HT-4", "HT-5", "HT-6"]) await q(A, "INSERT INTO ekipman (tesis_id, tur_id, kod, ekleyen) VALUES ($1, $2, $3, 'x') RETURNING id::text", [t1, ht, kod]);
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
  kiraciIcinde(havuz, firma, (db) => tekSeferlik<RaporIslemSonucu>(db, { id, tur, kayit, zaman: new Date().toISOString() },
    () => raporIslemi(db, { depo, firmaId: firma }, kim, tur, kayit, surum, girdi)), { hesapId: kim.id });
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

/* 2026-10-08: KOMPRESÖR formatı ölçüm cihazı ve fotoğraf ister (ENGEL 2 / 5) — bu testte ikisi yok, bu yüzden form tam olsa da "eksik": rapor
   KAYDEDİLİR, gönderilmez. Tam gönderimin durum geçişi raporlar / onaylar testlerinde; burada kuyruk işinin sonucu ve tekrarı sınanır. */
test("Onaya gönder kuyruktan: eksikte 'eksik' (kaydedildi, gönderilmedi); tekrarı yeniden kaydetmez, aynı sonucu döner", async () => {
  const r = await rapor(DEN, "HT-3");
  const e = await isle(DEN, randomUUID(), "rapor.gonder", r.id, r.surum, bosGirdi(r.bas));
  assert.equal(e.durum === "yeni" && e.sonuc.durum, "eksik");
  assert.equal((await raporSatiri(r.id)).durum, "taslak");
  const g = await raporSatiri(r.id);
  const id = randomUUID();
  const s = await isle(DEN, id, "rapor.gonder", r.id, g.surum, tamGirdi(r.bas));
  assert.ok(s.durum === "yeni" && s.sonuc.durum === "eksik", JSON.stringify(s));
  assert.deepEqual(s.durum === "yeni" && s.sonuc.durum === "eksik" && s.sonuc.eksikler.map((x) => x.bolum).sort(), ["cihaz", "foto"], "yalnız cihaz ve fotoğraf eksik");
  const once = await raporSatiri(r.id);
  assert.deepEqual([once.durum, once.surum, once.ekipman_bilgi.marka], ["taslak", g.surum + 1, "Deneme Marka"], "kaydedildi, gönderilmedi");
  assert.deepEqual(await isle(DEN, id, "rapor.gonder", r.id, g.surum, tamGirdi(r.bas)), { durum: "tekrar", sonuc: s.sonuc });
  assert.equal((await raporSatiri(r.id)).surum, once.surum, "tekrar yeniden kaydetmedi");
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
  /* başka denetçinin raporu ona görünmez: modül "yok" der (saklanır), rapor değişmez (2026-10-08: "yetkisiz" beklentisi yanlıştı — denetçi
     yalnız kendi raporlarını görür) */
  const y = await isle(DEN2, randomUUID(), "rapor.kaydet", r.id, s.surum, tamGirdi(r.bas, "Başkası"));
  assert.deepEqual(y, { durum: "yeni", sonuc: { durum: "yok" } });
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

/* 398: bağlantısız çekilen fotoğraf (rapor.foto). Uydurma JPEG (tests/raporlar.test.ts ile aynı yapı). Bu test GÜVENLİK sayımından SONRA koşar
   (öteki denetçinin işlem sayısını değiştirir). */
const bayt = (...p: (number[] | string)[]) => new Uint8Array(p.flatMap((x) => (typeof x === "string" ? [...Buffer.from(x, "latin1")] : x)));
const seg = (isaret: number, govde: string) => bayt([0xff, isaret, (govde.length + 2) >> 8, (govde.length + 2) & 0xff], govde);
const JPEG = bayt([0xff, 0xd8], [...seg(0xe0, "JFIF\0\x01\x01")], [...seg(0xdb, "\0" + "\x01".repeat(64))], [0xff, 0xda, 0, 2], "goruntu-verisi", [0xff, 0xd9]);
const fotoGirdi = (ad = "on.jpg", icerik: Uint8Array = JPEG, yer: { bolum: string; madde: string | null } = { bolum: "foto", madde: null }) =>
  ({ ...yer, ad, veri: Buffer.from(icerik).toString("base64") });
const fotolari = async (id: string) =>
  (await sql<{ fotolar: { ad: string; bolum: string; madde: string | null }[] }>(A, "SELECT fotolar FROM rapor WHERE id = $1", [id])).rows[0].fotolar;

test("fotoğraf kuyruktan: raporun O ANKİ sürümüne eklenir (kaydı ezmez), önceki / sonraki sürüm döner; tekrarı ikinci fotoğraf eklemez; tür / yer / yetki / kiracı aynen", async () => {
  const r = await rapor(DEN, "HT-6");
  /* fotoğraf cihazda beklerken rapor başka yerde kaydedildi (sürüm ilerledi): fotoğraf yine eklenir, kayıt ezilmez */
  const k = await isle(DEN, randomUUID(), "rapor.kaydet", r.id, r.surum, tamGirdi(r.bas, "Sunucudaki"));
  assert.equal(k.durum === "yeni" && k.sonuc.durum, "tamam");
  const id = randomUUID();
  const s = await isle(DEN, id, "rapor.foto", r.id, r.surum, fotoGirdi());
  assert.ok(s.durum === "yeni" && s.sonuc.durum === "tamam", JSON.stringify(s));
  assert.deepEqual(s.durum === "yeni" && "surum" in s.sonuc && s.sonuc.surum, { once: r.surum + 1, sonra: r.surum + 2 });
  const satir = await raporSatiri(r.id);
  assert.deepEqual([satir.surum, satir.ekipman_bilgi.marka], [r.surum + 2, "Sunucudaki"], "kayıt ezilmedi");
  assert.deepEqual((await fotolari(r.id)).map((f) => [f.ad, f.bolum, f.madde]), [["on.jpg", "foto", null]]);
  /* yanıt yolda kayboldu, cihaz aynı kimlikle yeniden gönderdi: ikinci fotoğraf yok, saklanan sonuç (sürümlerle) */
  assert.deepEqual(await isle(DEN, id, "rapor.foto", r.id, r.surum, fotoGirdi()), { durum: "tekrar", sonuc: s.durum === "yeni" ? s.sonuc : null });
  assert.equal((await fotolari(r.id)).length, 1);
  assert.equal(await izSayisi(r.id, "rapor.foto_ekle"), 1);
  /* reddedilenler: fotoğraf olmayan içerik, bozuk metin, olmayan yer, başka denetçi, başka firma — hiçbiri eklenmez */
  const dene = async (girdi: unknown, kim = DEN, firma = A) => { const x = await isle(kim, randomUUID(), "rapor.foto", r.id, 0, girdi, firma); return x.durum === "yeni" ? x.sonuc : x; };
  assert.deepEqual(await dene(fotoGirdi("x.pdf", bayt("%PDF-1.4 deneme"))), { durum: "gecersiz", hatalar: { foto: "Yalnız JPEG ya da PNG fotoğraf." } });
  assert.deepEqual(await dene({ ...fotoGirdi(), veri: "<script>" }), { durum: "gecersiz", hatalar: { foto: "Fotoğraf okunamadı." } });
  assert.deepEqual(await dene(fotoGirdi("on.jpg", JPEG, { bolum: "yok-boyle", madde: null })), { durum: "gecersiz", hatalar: { foto: "Fotoğrafın yeri bulunamadı." } });
  assert.deepEqual(await dene(fotoGirdi(), DEN2), { durum: "yok" });
  assert.deepEqual(await dene(fotoGirdi(), DEN_B, B), { durum: "yok" });
  assert.equal((await fotolari(r.id)).length, 1, "reddedilenler eklenmedi");
  assert.equal((await raporSatiri(r.id)).surum, r.surum + 2);
});

/* 400: plan kabul / red kuyruktan. GÜVENLİK sayımından SONRA koşar. */
const isleP = (kim: Kisi, id: string, tur: PlanIslemTuru, kayit: string, surum: number, girdi: unknown, firma = A) =>
  kiraciIcinde(havuz, firma, (db) => tekSeferlik<PlanYazma>(db, { id, tur, kayit, zaman: new Date().toISOString() },
    () => planIslemi(db, kim, tur, kayit, surum, girdi)), { hesapId: kim.id });
const yeniPlan = async () => tamam(await a(PLAN, (db) => planAc(db, depo, PLAN, A, { tesis: t1, baslangic: bugunTr(), bitis: bugunTr(),
  ekip: [{ personel: denP, isgNo: "ISG-1", kaydet: false }] }))).id;
const planSatiri = async (id: string) =>
  (await sql<{ surum: number; durum: string; red_gerekce: string | null }>(A, "SELECT surum, durum, red_gerekce FROM plan WHERE id = $1", [id])).rows[0];

test("plan kabul kuyruktan: beyan onayı ve okunan metnin özeti şart; tekrarı yeniden yapmaz; eski sürüm çakışma; ekip dışı / başka firma yapamaz", async () => {
  const p1 = await yeniPlan();
  const v = (await a(DEN, (db) => planIci(db, DEN, p1)))!;
  const sonucu = async (girdi: unknown, kim = DEN, firma = A, surum = v.surum) => {
    const x = await isleP(kim, randomUUID(), "plan.kabul", p1, surum, girdi, firma);
    return x.durum === "yeni" ? x.sonuc : x;
  };
  const BEYANSIZ = { durum: "gecersiz", hatalar: { beyan: "Tarafsızlık beyanı okunup onaylanmadan plan kabul edilemez." } };
  /* beyan onaylanmadan ya da onay uydurma değerle: kabul yok; okunan metin değiştiyse red */
  assert.deepEqual(await sonucu({ beyanOnay: false, beyanOzet: v.beyanOzet }), BEYANSIZ);
  assert.deepEqual(await sonucu({ beyanOnay: "true", beyanOzet: v.beyanOzet }), BEYANSIZ);
  assert.deepEqual(await sonucu({ beyanOzet: v.beyanOzet }), BEYANSIZ);
  assert.deepEqual(await sonucu({ beyanOnay: true, beyanOzet: "0000000000000000" }),
    { durum: "red", neden: "Tarafsızlık beyanının metni değişti; sayfayı yenileyip yeni metni okuyun." });
  /* ekip dışı denetçi, başka firma: yok */
  assert.deepEqual(await sonucu({ beyanOnay: true, beyanOzet: v.beyanOzet }, DEN2), { durum: "yok" });
  assert.deepEqual(await sonucu({ beyanOnay: true, beyanOzet: v.beyanOzet }, DEN_B, B), { durum: "yok" });
  assert.deepEqual([(await planSatiri(p1)).durum, (await planSatiri(p1)).surum], ["bekliyor", v.surum], "hiçbiri planı değiştirmedi");
  /* kabul: bir kez; aynı kimlik yeniden gelince saklanan sonuç */
  const id = randomUUID();
  const k = await isleP(DEN, id, "plan.kabul", p1, v.surum, { beyanOnay: true, beyanOzet: v.beyanOzet });
  assert.deepEqual(k, { durum: "yeni", sonuc: { durum: "tamam", bildirim: "Plan kabul edildi." } });
  assert.deepEqual(await isleP(DEN, id, "plan.kabul", p1, v.surum, { beyanOnay: true, beyanOzet: v.beyanOzet }), { durum: "tekrar", sonuc: k.durum === "yeni" ? k.sonuc : null });
  assert.deepEqual([(await planSatiri(p1)).durum, (await planSatiri(p1)).surum], ["kabul", v.surum + 1]);
  assert.equal((await sql<{ n: number }>(A, "SELECT count(*)::int AS n FROM denetim_izi WHERE nesne_id = $1 AND ne = 'plan.kabul'", [p1])).rows[0].n, 1);
});

test("plan reddi kuyruktan: gerekçe şart; eski sürüm çakışma (sessiz ezme yok); güncel sürümle reddedilir, gerekçe yazılır", async () => {
  const p2 = await yeniPlan();
  const v = (await a(DEN, (db) => planIci(db, DEN, p2)))!;
  const g = await isleP(DEN, randomUUID(), "plan.red", p2, v.surum, { gerekce: "" });
  assert.ok(g.durum === "yeni" && g.sonuc.durum === "gecersiz", JSON.stringify(g));
  /* bu arada planlamacı künyeyi değiştirdi (sürüm ilerledi): cihazın reddi çakışır, plan değişmez */
  await sql(A, "UPDATE plan SET aciklama = 'Deneme değişiklik', surum = surum + 1 WHERE id = $1", [p2], PLAN.id);
  const c = await isleP(DEN, randomUUID(), "plan.red", p2, v.surum, { gerekce: "Tesis bu hafta kapalı." });
  assert.deepEqual(c, { durum: "yeni", sonuc: { durum: "cakisma" } });
  assert.equal((await planSatiri(p2)).durum, "bekliyor");
  /* kullanıcı "benimkini yaz" der: güncel sürümle yeni kimlik */
  const y = await isleP(DEN, randomUUID(), "plan.red", p2, v.surum + 1, { gerekce: "Tesis bu hafta kapalı." });
  assert.deepEqual(y, { durum: "yeni", sonuc: { durum: "tamam", bildirim: "Plan reddedildi." } });
  assert.deepEqual([(await planSatiri(p2)).durum, (await planSatiri(p2)).red_gerekce], ["reddedildi", "Tesis bu hafta kapalı."]);
});

/* 405: bağlantısız yeni rapor — paket (yeniRaporPaketi) ve kuyruktan açılış (rapor.olustur). GÜVENLİK sayımından SONRA koşar. */
test("yeni rapor paketi: planın raporu olmayan etkin ekipmanları, türün yayındaki formatı ve ilk cevaplar; kabul edilmemiş planda neden; ekip dışı / başka firma yok", async () => {
  const p = await yeniPlan();
  const bekleyen = await a(DEN, (db) => yeniRaporPaketi(db, DEN, p));
  assert.equal(bekleyen?.neden, "Rapor yalnız kabul edilmiş planda oluşturulur.");
  tamam(await a(DEN, async (db) => planKabul(db, DEN, p, (await planIci(db, DEN, p))!.surum, true)));
  tamam(await a(DEN, (db) => raporOlustur(db, DEN, p, ekp["HT-1"])));
  const k = (await a(DEN, (db) => yeniRaporPaketi(db, DEN, p)))!;
  assert.equal(k.neden, null);
  assert.deepEqual(k.ekipmanlar.map((x) => x.kod).sort(), ["HT-2", "HT-3", "HT-4", "HT-5", "HT-6"], "raporu olan ekipman yok");
  assert.deepEqual(Object.keys(k.turler), [ht]);
  assert.equal(k.turler[ht].tanim.bolumler.length, KOMP.bolumler.length);
  assert.ok(Object.keys(k.turler[ht].ilk.madde).length > 0, "ilk cevaplar dolu");
  assert.equal(await a(DEN2, (db) => yeniRaporPaketi(db, DEN2, p)), null, "ekip dışı denetçi");
  assert.equal(await kiraciIcinde(havuz, B, (db) => yeniRaporPaketi(db, DEN_B, p), { hesapId: DEN_B.id }), null, "başka firma");
});

test("yeni rapor kuyruktan: geçici kimlikle gelen açılış raporu SUNUCUDA açar (kimlik ve numara sunucunun), sürüm döner; tekrarı ikinci rapor açmaz; kurallar ve yetki aynen", async () => {
  const p = await yeniPlan();
  const ac = (kim: Kisi, girdi: unknown, kayit = randomUUID(), id = randomUUID(), firma = A) => isle(kim, id, "rapor.olustur", kayit, 0, girdi, firma);
  const sonucu = async (x: Promise<Awaited<ReturnType<typeof isle>>>) => { const y = await x; return y.durum === "yeni" ? y.sonuc : y; };
  /* kabul edilmemiş planda açılmaz */
  assert.deepEqual(await sonucu(ac(DEN, { plan: p, ekipman: ekp["HT-2"] })), { durum: "red", neden: "Rapor yalnız kabul edilmiş planda oluşturulur." });
  tamam(await a(DEN, async (db) => planKabul(db, DEN, p, (await planIci(db, DEN, p))!.surum, true)));
  const GECICI = randomUUID(), id = randomUUID();
  const s = await ac(DEN, { plan: p, ekipman: ekp["HT-2"] }, GECICI, id);
  assert.ok(s.durum === "yeni" && s.sonuc.durum === "tamam" && "surum" in s.sonuc, JSON.stringify(s));
  const yeniId = s.durum === "yeni" && s.sonuc.durum === "tamam" ? s.sonuc.id : "";
  assert.notEqual(yeniId, GECICI, "kimliği sunucu verir");
  const satir = (await sql<{ no: string; plan_id: string; ekipman_id: string; durum: string; surum: number }>(A,
    "SELECT no, plan_id::text, ekipman_id::text, durum, surum FROM rapor WHERE id = $1", [yeniId])).rows[0];
  assert.deepEqual([satir.plan_id, satir.ekipman_id, satir.durum], [p, ekp["HT-2"], "taslak"]);
  assert.match(satir.no, /^IA-/);
  assert.deepEqual(s.durum === "yeni" && "surum" in s.sonuc && s.sonuc.surum, { once: 0, sonra: satir.surum });
  /* yanıt yolda kayboldu, aynı kimlik yeniden: ikinci rapor açılmaz, aynı sonuç */
  assert.deepEqual(await ac(DEN, { plan: p, ekipman: ekp["HT-2"] }, GECICI, id), { durum: "tekrar", sonuc: s.durum === "yeni" ? s.sonuc : null });
  const sayi = async () => (await sql<{ n: number }>(A, "SELECT count(*)::int AS n FROM rapor WHERE plan_id = $1 AND ekipman_id = $2", [p, ekp["HT-2"]])).rows[0].n;
  assert.equal(await sayi(), 1);
  /* başka cihazdan aynı ekipmana ikinci açılış: red (rapor zaten var) */
  assert.deepEqual(await sonucu(ac(DEN, { plan: p, ekipman: ekp["HT-2"] })), { durum: "red", neden: "Bu ekipmanın bu planda raporu var." });
  /* bozuk girdi, ekip dışı denetçi, başka firma: açılmaz */
  assert.equal((await sonucu(ac(DEN, { plan: "x", ekipman: ekp["HT-3"] }))).durum, "gecersiz");
  assert.deepEqual(await sonucu(ac(DEN2, { plan: p, ekipman: ekp["HT-3"] })), { durum: "yok" });
  assert.deepEqual(await sonucu(ac(DEN_B, { plan: p, ekipman: ekp["HT-3"] }, randomUUID(), randomUUID(), B)), { durum: "yok" });
  assert.equal((await sql<{ n: number }>(A, "SELECT count(*)::int AS n FROM rapor WHERE plan_id = $1 AND ekipman_id = $2", [p, ekp["HT-3"]])).rows[0].n, 0);
  /* açılan raporun kaydı kuyruktan, sunucunun verdiği kimlik ve sürümle */
  const bas = (await a(DEN, (db) => sahaRaporu(db, DEN, yeniId)))!.tarih.bas!;
  const k = await isle(DEN, randomUUID(), "rapor.kaydet", yeniId, satir.surum, tamGirdi(bas));
  assert.equal(k.durum === "yeni" && k.sonuc.durum, "tamam");
});
