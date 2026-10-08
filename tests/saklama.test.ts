/* NEREDEN GELDİ: 387 — KOD-GECIS ENGEL 11 ("bizim kod imzalı rapor PDF'lerini saklama süresi (en az 5 yıl; firma 6–20 yıla uzatabilir) dolmadan
   silmez; süre dolunca depodan siler (30 gün önce firma yöneticisine liste)"; reisim 2026-10-03 "depoda 5 sene sonra silcek şekilde kodla"),
   ARKA-UC §7, CLAUDE.md §7 "Süre dolmadan hiçbir şey silinmez". GERÇEK PostgreSQL, iki firma (göç 0073; src/modules/raporlar/server/saklama.ts):
   · süre veritabanında: yoksa / bozuksa 5, her durumda 5–20; firma süreyi değiştirince en erken değişiklikten 30 gün sonra (listeye girmeden
     silinmez); ayarın değişme zamanını uygulama geçmişe yazamaz;
   · imzalı sürümün PDF'i çöpe alınamaz; süresi dolmadan hiçbir yoldan (süper kullanıcı dahil, tetik açıkken) silinemez;
   · liste: 30 gün içinde dolacaklar (dolmuşlar "geçti"), başka firmanınki yok, silinmiş yok; Uyarılar'da güne göre — yalnız firma yöneticisine;
     liste sayfası yalnız firma yöneticisine;
   · gece işi: süresi dolanın imzalı + imzasız PDF'i (satır + depodaki nesne) gider, sürümün kaydı kalır, silme kaydı yazılır; rapor ekranı ve
     müşteri tarafı "silindi" der, imzasız kopya basılmaz; ikinci koşu bir şey silmez; her firma kendi işleminde;
   · GÜVENLİK: saklama_sil firmasız çağrılamaz, başka firmanın / süresi dolmamış sürümünü silmez; silme kaydına uygulama yazamaz; işlev
     tanımlayıcı-yetkili, arama yolu sabit, PUBLIC'e kapalı.
   Olumsuz kanıt: tests/bozan/saklama.bozan.ts. */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";
import type pg from "pg";
import type { GomuluKume } from "../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz, type Sorgulayici } from "../src/server/db/kiraci.ts";
import { vtDepo } from "../src/server/dosya/depo.ts";
import { DOSYA_ERISIMI } from "../src/server/dosya/erisim.ts";
import { dosyaCope, dosyaIndirilebilir } from "../src/server/dosya/dosya.ts";
import { ayarOku, ayarYaz } from "../src/server/ayar/ayar.ts";
import { onayla } from "../src/modules/onaylar/server/onaylar.ts";
import { planIci, planKabul } from "../src/modules/planlar/server/plan-ici.ts";
import { bugunTr, planAc } from "../src/modules/planlar/server/planlar.ts";
import { taslakBaslat, yayinla } from "../src/modules/rapor-format/server/formatlar.ts";
import { imzaHazirla, imzaliYukle, raporBelgesiVerisi, raporOlustur, sahaRaporu, type Kisi } from "../src/modules/raporlar/server/raporlar.ts";
import { musteriRaporlari } from "../src/modules/raporlar/server/musteri-baglanti.ts";
import { saklamaGunleri, saklamaIsi, saklamaListesi, saklamaTemizle } from "../src/modules/raporlar/server/saklama.ts";
import { saklamaSayfasi } from "../src/modules/firma-ayarlari/server/saklama.ts";
import { uyariListesi } from "../src/modules/uyarilar/server/uyarilar.ts";
import { testKumesi } from "./yardimci/kume.ts";

let kume: GomuluKume, havuz: Havuz, sahip: pg.Client;
let A: string, B: string;
const depo = vtDepo(() => havuz);
const tamam = <R extends { durum: string }>(r: R) => { assert.equal(r.durum, "tamam", JSON.stringify(r)); return r as Extract<R, { durum: "tamam" }>; };
let YON: Kisi, PLAN: Kisi, MEK: Kisi, DEN: Kisi;
let denP: string, t1: string, ht: string, ekp: Record<string, string>;
const a = <T,>(k: Kisi, is: (db: Sorgulayici) => Promise<T>) => kiraciIcinde(havuz, A, is, { hesapId: k.id });
const sql = <T extends object>(firma: string, metin: string, p: unknown[] = [], hesapId?: string) =>
  kiraciIcinde(havuz, firma, (db) => db.sorgu<T & Record<string, unknown>>(metin, p), hesapId ? { hesapId } : {});
/** tetiksiz (yalnız test kurulumu): imza anını geçmişe çekmek, ayarın değişme zamanını kurmak */
async function tetiksiz(metin: string, p: unknown[] = []) {
  await sahip.query("SET session_replication_role = replica");
  try { await sahip.query(metin, p); } finally { await sahip.query("SET session_replication_role = DEFAULT"); }
}
async function hesap(firma: string, eposta: string, roller: string[], ad: string, personel: string | null = null): Promise<Kisi> {
  const id = (await kiraciIcinde(havuz, firma, (db) => db.sorgu<{ id: string }>(
    "INSERT INTO hesap (eposta, ad, roller, durum, personel_id) VALUES ($1, $2, $3, 'etkin', $4) RETURNING id::text", [eposta, ad, roller, personel]))).rows[0].id;
  return { id, ad, roller: roller as Kisi["roller"] };
}

before(async () => {
  kume = await testKumesi();
  havuz = havuzKur(kume.uygulama);
  sahip = kume.sahipIstemci();
  await sahip.connect();
  [A, B] = (await sahip.query<{ id: string }>(
    "INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('saklama-a', 'Saklama A', 'SA'), ('saklama-b', 'Saklama B', 'SB') RETURNING id::text")).rows.map((r) => r.id);
  const q = async (firma: string, metin: string, p: unknown[] = []) => (await sql<{ id: string }>(firma, metin, p)).rows[0].id;
  denP = await q(A, "INSERT INTO personel (ad, basla, meslek, ekipnet) VALUES ('Deneme Denetçi', '2024-01-01', 'mak-muh', '123') RETURNING id::text");
  YON = await hesap(A, "yon@saklama-a.example", ["firma_yoneticisi"], "Deneme Yönetici");
  PLAN = await hesap(A, "plan@saklama-a.example", ["planlama"], "Deneme Planlama");
  MEK = await hesap(A, "mek@saklama-a.example", ["mekanik_yonetici"], "Deneme Mekanik");
  DEN = await hesap(A, "den@saklama-a.example", ["denetci"], "Deneme Denetçi", denP);
  const m1 = await q(A, "INSERT INTO musteri (unvan, kisa) VALUES ('Deneme Bir Sanayi A.Ş.', 'Deneme Bir') RETURNING id::text");
  t1 = await q(A, "INSERT INTO tesis (musteri_id, ad) VALUES ($1, 'Merkez') RETURNING id::text", [m1]);
  ht = await q(A, "INSERT INTO ekipman_turu (kod, ad, grup, brans, periyot) VALUES ('HT', 'Hava tankı', 'basincli', 'm', 12) RETURNING id::text");
  for (const kod of ["HT-1", "HT-2", "HT-3", "HT-4"]) await q(A, "INSERT INTO ekipman (tesis_id, tur_id, kod, ekleyen) VALUES ($1, $2, $3, 'x') RETURNING id::text", [t1, ht, kod]);
  ekp = Object.fromEntries((await sql<{ kod: string; id: string }>(A, "SELECT kod, id::text FROM ekipman")).rows.map((x) => [x.kod, x.id]));
  await a(YON, async (db) => {
    const t = tamam(await taslakBaslat(db, YON, ht, "sablon:KOMPRESOR", null));
    tamam(await yayinla(db, YON, t.id, t.surum, ""));
  });
});
after(async () => { await sahip?.end(); await havuz?.end(); await kume?.durdur(); });

/* ── imzalı rapor (tests/muhasebe.test.ts ile aynı yapı) ── */
let sayac = 0;
const uret = async () => new TextEncoder().encode(`%PDF-1.4\n% deneme ${++sayac}\n1 0 obj << /Type /Catalog >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n`);
const imzala = (b: Uint8Array) => Buffer.concat([Buffer.from(b), Buffer.from("\n9 0 obj << /Type /Sig /ByteRange [0 1 2 3] /Contents <00ff> >> endobj\ntrailer << /Root 1 0 R /Prev 0 >>\n%%EOF\n", "latin1")]);
const rsurum = async (id: string) => (await sql<{ surum: number }>(A, "SELECT surum FROM rapor WHERE id = $1", [id])).rows[0].surum;
let plan = "";
async function imzaliRapor(kod: string): Promise<{ rapor: string; surum: string; imzali: string; imzasiz: string; anahtarlar: string[] }> {
  if (!plan) {
    plan = tamam(await a(PLAN, (db) => planAc(db, depo, PLAN, A, { tesis: t1, baslangic: bugunTr(), bitis: bugunTr(), ekip: [{ personel: denP, isgNo: "ISG-1", kaydet: false }] }))).id;
    tamam(await a(DEN, async (db) => planKabul(db, DEN, plan, (await planIci(db, DEN, plan))!.surum, true)));
  }
  const h = tamam(await a(DEN, (db) => raporOlustur(db, DEN, plan, ekp[kod]))).id;
  await sql(A, "UPDATE rapor SET durum = 'onayda', surum = surum + 1 WHERE id = $1", [h], DEN.id);
  tamam(await a(MEK, async (db) => onayla(db, MEK, h, await rsurum(h))));
  tamam(await a(DEN, (db) => imzaHazirla(db, depo, DEN, A, h, uret)));
  const ham = (await sql<{ anahtar: string }>(A, "SELECT d.anahtar FROM imza_istegi i JOIN dosya d ON d.id = i.pdf_dosya WHERE i.rapor_id = $1 AND i.durum = 'bekliyor'", [h])).rows[0];
  const s2 = await rsurum(h);
  tamam(await a(DEN, async (db) => imzaliYukle(db, depo, DEN, A, h, s2, { ad: "imzali.pdf", bayt: imzala(await depo.oku(ham.anahtar, db)) })));
  const s = (await sahip.query<{ id: string; imzali: string; imzasiz: string }>(
    "SELECT id::text, imzali_dosya::text AS imzali, imzasiz_dosya::text AS imzasiz FROM rapor_surumu WHERE rapor_id = $1", [h])).rows[0];
  const anahtarlar = (await sahip.query<{ anahtar: string }>("SELECT anahtar FROM dosya WHERE id IN ($1, $2) ORDER BY anahtar", [s.imzali, s.imzasiz])).rows.map((x) => x.anahtar);
  return { rapor: h, surum: s.id, imzali: s.imzali, imzasiz: s.imzasiz, anahtarlar };
}
/** imza anını geçmişe çeker (sure: PostgreSQL aralığı, ör. "5 years 3 days") */
const imzaAni = (surum: string, sure: string) => tetiksiz(`UPDATE rapor_surumu SET imzalandi = now() - $2::interval WHERE id = $1`, [surum, sure]);
const satirVar = async (id: string) => (await sahip.query("SELECT 1 FROM dosya WHERE id = $1", [id])).rowCount === 1;
const nesneVar = async (anahtar: string) => (await sahip.query("SELECT 1 FROM depo_nesne WHERE anahtar = $1", [anahtar])).rowCount === 1;

/** B'de ham imzalı sürüm (tetiksiz kurulum): iki PDF'i depoda; imza anı `sure` önce */
async function bSurumu(sure: string): Promise<{ surum: string; dosyalar: string[]; anahtarlar: string[] }> {
  const rapor = randomUUID(), surum = randomUUID(), dosyalar = [randomUUID(), randomUUID()];
  const anahtarlar = dosyalar.map((d, i) => `firma/${B}/${i ? "rapor_pdf" : "rapor_imzali"}/${rapor}/${d}`);
  await sahip.query("SET session_replication_role = replica");
  try {
    for (const [i, d] of dosyalar.entries()) {
      await sahip.query(`INSERT INTO dosya (id, firma_id, modul, kayit_id, anahtar, ad, tur, boyut, sha256) VALUES ($1, $2, $3, $4, $5, 'b.pdf', 'application/pdf', 4, repeat('0', 64))`,
        [d, B, i ? "rapor_pdf" : "rapor_imzali", rapor, anahtarlar[i]]);
      await sahip.query("INSERT INTO depo_nesne (firma_id, anahtar, bayt) VALUES ($1, $2, '\\x25504446')", [B, anahtarlar[i]]);
    }
    await sahip.query(`INSERT INTO rapor_surumu (id, firma_id, rapor_id, revizyon, no, plan_id, ekipman_id, tur_id, format_id, tesis_id, musteri_id, imzasiz_dosya,
      imzali_dosya, imzali_sha256, imza_yontem, imzalandi, kunye, personel, icerik) VALUES ($1, $2, $3, 0, $4, gen_random_uuid(), gen_random_uuid(), gen_random_uuid(),
      gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), $5, $6, repeat('0', 64), 'dosya', now() - $7::interval, '{}', '{}', '{}')`,
      [surum, B, rapor, `SB-0121-${String(++sayac).padStart(3, "0")}-00001`, dosyalar[1], dosyalar[0], sure]);
  } finally { await sahip.query("SET session_replication_role = DEFAULT"); }
  return { surum, dosyalar, anahtarlar };
}

test("süre veritabanında: yoksa 5, 5–20 arası, bozuk değer 5; ayar değişince en erken 30 gün sonra; değişme zamanı uygulamadan yazılamaz", async () => {
  const yil = async () => (await sql<{ y: number }>(A, "SELECT saklama_yili(gecerli_firma()) AS y")).rows[0].y;
  assert.equal(await yil(), 5, "ayar yokken 5");
  const bitis = async (imza: string) => (await sql<{ b: Date }>(A, "SELECT saklama_bitisi(gecerli_firma(), $1::timestamptz) AS b", [imza])).rows[0].b.toISOString();
  assert.equal(await bitis("2020-03-01T10:00:00Z"), "2025-03-01T10:00:00.000Z", "imza + 5 yıl");
  /* bozuk / sınır dışı değer (uygulamanın şemasını atlayan ham yazma) — veritabanı 5–20'ye çeker */
  for (const [deger, beklenen] of [[{ yil: 2 }, 5], [{ yil: 40 }, 20], [{ yil: "x" }, 5], [{ yil: 7 }, 7]] as const) {
    await tetiksiz("DELETE FROM firma_ayar WHERE firma_id = $1 AND bolum = 'saklama'", [A]);
    await tetiksiz("INSERT INTO firma_ayar (firma_id, bolum, deger, degisti) VALUES ($1, 'saklama', $2, now() - interval '1 year')", [A, JSON.stringify(deger)]);
    assert.equal(await yil(), beklenen, JSON.stringify(deger));
  }
  assert.equal(await bitis("2020-03-01T10:00:00Z"), "2027-03-01T10:00:00.000Z", "imza + 7 yıl");
  /* ayar yeni değiştiyse süre dolmuş olsa bile en erken değişiklik + 30 gün */
  await tetiksiz("UPDATE firma_ayar SET deger = '{\"yil\":5}', degisti = now() WHERE firma_id = $1 AND bolum = 'saklama'", [A]);
  const b = Date.parse(await bitis("2015-01-01T00:00:00Z"));
  assert.ok(Math.abs(b - (Date.now() + 30 * 864e5)) < 60_000, "kısaltılan süre 30 gün sonra işler");
  /* uygulama değişme zamanını geçmişe yazamaz: veritabanı damgalar */
  await sql(A, "UPDATE firma_ayar SET degisti = now() - interval '10 years', olustu = now() - interval '10 years' WHERE bolum = 'saklama'");
  const d = (await sahip.query<{ degisti: Date; olustu: Date }>("SELECT degisti, olustu FROM firma_ayar WHERE firma_id = $1 AND bolum = 'saklama'", [A])).rows[0];
  assert.ok(Date.now() - d.degisti.getTime() < 60_000, "değişme zamanı şimdi");
  assert.ok(Date.now() - d.olustu.getTime() < 365 * 864e5, "oluşma zamanı değişmez");
  /* uygulamanın kendi yolu (ayarYaz) da aynı damgayı alır; sonraki testler için ayar kaldırılır (5 yıl, erteleme yok) */
  const g = await a(YON, async (db) => ayarYaz(db, "saklama", (await ayarOku(db, "saklama")).surum, { yil: 6 }, { kim: YON.ad, ne: "firma_ayar.saklama" }));
  assert.equal(g.durum, "tamam");
  await tetiksiz("DELETE FROM firma_ayar WHERE firma_id = $1 AND bolum = 'saklama'", [A]);
  assert.equal(await yil(), 5);
});

let eski: Awaited<ReturnType<typeof imzaliRapor>>, yakin: Awaited<ReturnType<typeof imzaliRapor>>, yeni: Awaited<ReturnType<typeof imzaliRapor>>;

test("KORUMA: imzalı sürümün PDF'i çöpe alınamaz; süresi dolmadan hiçbir yoldan silinemez", async () => {
  eski = await imzaliRapor("HT-1"); yakin = await imzaliRapor("HT-2"); yeni = await imzaliRapor("HT-3");
  for (const id of [yeni.imzali, yeni.imzasiz]) {
    await assert.rejects(a(DEN, (db) => dosyaCope(db, id, { kim: DEN.ad, ne: "dosya.cop" })), /çöpe alınamaz/);
    await assert.rejects(sahip.query("UPDATE dosya SET cop = now() WHERE id = $1", [id]), /çöpe alınamaz/, "süper kullanıcı da");
    await assert.rejects(sahip.query("DELETE FROM dosya WHERE id = $1", [id]), /saklama süresi dolmadan silinemez/, "süper kullanıcı da");
    assert.equal(await satirVar(id), true);
  }
  /* uygulamanın DELETE hakkı yok; çöp işlevi çöpte olmayanı silmez */
  await assert.rejects(sql(A, "DELETE FROM dosya WHERE id = $1", [yeni.imzali]), /permission denied|izin/i);
  assert.equal((await sql<{ s: string }>(A, "SELECT dosya_cop_sil($1) AS s", [yeni.imzali])).rows[0].s, "yok");
  /* koruma yalnız çöpe alma ve silmede: adı değişebilir */
  await sahip.query("UPDATE dosya SET ad = 'yeni-ad.pdf' WHERE id = $1", [yeni.imzali]);
});

test("liste: 30 gün içinde dolacaklar; dolmuş 'geçti'; yeni, başka firmanınki ve silinmiş yok; Uyarılar'da güne göre yalnız firma yöneticisine", async () => {
  await imzaAni(eski.surum, "5 years 3 days");
  await imzaAni(yakin.surum, "5 years -10 days");
  const bEski = await bSurumu("6 years");
  const l = await a(YON, (db) => saklamaListesi(db));
  assert.equal(l.yil, 5);
  assert.deepEqual(l.liste.map((x) => [x.surumId, x.gecti]), [[eski.surum, true], [yakin.surum, false]], "en erken dolan önce; B'ninki yok; yeni yok");
  const y = l.liste[1];
  assert.equal(y.raporId, yakin.rapor);
  assert.equal(y.dosya, yakin.imzali);
  assert.deepEqual([y.musteri, y.tesis], ["Deneme Bir", "Merkez"]);
  assert.match(y.bitisGunu, /^\d{4}-\d{2}-\d{2}$/);
  /* Uyarılar: güne göre */
  const g = await a(YON, (db) => saklamaGunleri(db));
  assert.deepEqual(g.map((x) => [x.adet, x.gecti]), [[1, true], [1, false]]);
  const u = (await a(YON, (db) => uyariListesi(db, YON)))!.filter((x) => x.tur === "sak");
  assert.deepEqual(u.map((x) => [x.konu, x.durum, x.href]), [["1 raporun PDF'i", "gecti", "/firma-ayarlari/saklama"], ["1 raporun PDF'i", "yakin", "/firma-ayarlari/saklama"]]);
  for (const k of [PLAN, MEK, DEN]) {
    assert.equal(((await a(k, (db) => uyariListesi(db, k))) ?? []).filter((x) => x.tur === "sak").length, 0, `${k.roller[0]}: saklama uyarısı yok`);
    assert.equal(await a(k, (db) => saklamaSayfasi(db, k)), null, `${k.roller[0]}: liste sayfası yok`);
  }
  /* liste sayfası firma yöneticisine */
  assert.equal((await a(YON, (db) => saklamaSayfasi(db, YON)))!.liste.length, 2);
  /* B'nin listesinde yalnız kendisininki */
  assert.deepEqual((await kiraciIcinde(havuz, B, (db) => saklamaListesi(db))).liste.map((x) => x.surumId), [bEski.surum]);
});

test("gece işi: süresi dolanın PDF'leri (satır + nesne) gider, kayıt kalır, silme yazılır; ekranlar 'silindi' der; ikinci koşu bir şey silmez", async () => {
  for (const k of eski.anahtarlar) assert.equal(await nesneVar(k), true);
  const bEski = (await sahip.query<{ id: string }>("SELECT id::text FROM rapor_surumu WHERE firma_id = $1", [B])).rows.map((x) => x.id);
  const o = await saklamaIsi(havuz, depo, 30_000);
  assert.equal(o.durum, "tamam");
  assert.equal(o.hatali_firma, 0);
  assert.equal(o.silinen, 1 + bEski.length, "A'nın dolmuşu + B'ninki");
  assert.equal(o.dosya, 2 * (1 + bEski.length));
  for (const id of [eski.imzali, eski.imzasiz]) assert.equal(await satirVar(id), false);
  for (const k of eski.anahtarlar) assert.equal(await nesneVar(k), false, "depodaki nesne de gitti");
  for (const id of [yakin.imzali, yakin.imzasiz, yeni.imzali, yeni.imzasiz]) assert.equal(await satirVar(id), true, "süresi dolmamışlar yerinde");
  /* sürümün kaydı kalır; silme kaydı */
  assert.equal((await sahip.query("SELECT 1 FROM rapor_surumu WHERE id = $1", [eski.surum])).rowCount, 1);
  const k = (await sahip.query<{ firma_id: string; rapor_id: string; dosya: number; bayt: string }>(
    "SELECT firma_id::text, rapor_id::text, dosya, bayt::text FROM saklama_silme WHERE surum_id = $1", [eski.surum])).rows[0];
  assert.deepEqual([k.firma_id, k.rapor_id, k.dosya], [A, eski.rapor, 2]);
  assert.ok(Number(k.bayt) > 0);
  /* iş kaydı */
  const is = (await sahip.query<{ durum: string; ozet: Record<string, number> }>("SELECT durum, ozet FROM is_calisma WHERE ad = 'saklama_silme' ORDER BY basladi DESC LIMIT 1")).rows[0];
  assert.equal(is.durum, "tamam");
  assert.equal(is.ozet.silinen, o.silinen);
  /* rapor ekranı: PDF yok, silinme anı; imzasız kopya basılmaz; dosya inmez */
  const v = (await a(DEN, (db) => sahaRaporu(db, DEN, eski.rapor)))!;
  assert.equal(v.imzali?.dosya, null);
  assert.ok(v.imzali?.silindi);
  const bv = (await a(DEN, (db) => raporBelgesiVerisi(db, depo, DEN, eski.rapor)))!;
  assert.deepEqual([bv.imzaliDosya, !!bv.imzaliSilindi], [null, true]);
  assert.equal(await a(DEN, (db) => dosyaIndirilebilir(db, DEN, eski.imzali, DOSYA_ERISIMI)), null);
  /* müşteri tarafı: PDF yok (ZIP'e ve indirmeye girmez) */
  const mr = await a(YON, (db) => musteriRaporlari(db));
  assert.equal(mr.find((x) => x.id === eski.rapor)?.dosya, null);
  assert.equal(mr.find((x) => x.id === yakin.rapor)?.dosya, yakin.imzali);
  /* listede artık yok; ikinci koşu bir şey silmez */
  assert.deepEqual((await a(YON, (db) => saklamaListesi(db))).liste.map((x) => x.surumId), [yakin.surum]);
  const o2 = await saklamaIsi(havuz, depo, 30_000);
  assert.deepEqual([o2.durum, o2.silinen, o2.dosya], ["tamam", 0, 0]);
  /* süre dolunca yakın olan da gider */
  await imzaAni(yakin.surum, "5 years 1 day");
  assert.equal((await kiraciIcinde(havuz, A, (db) => saklamaTemizle(db, depo))).silinen, 1);
  assert.equal(await satirVar(yakin.imzali), false);
  assert.equal(await satirVar(yeni.imzali), true);
});

test("GÜVENLİK: saklama_sil firmasız çağrılamaz; başka firmanın ve süresi dolmamış sürümü silmez; silme kaydına yazılamaz; işlev ölçüleri", async () => {
  const bDolmus = await bSurumu("7 years"), bYeni = await bSurumu("1 year");
  await assert.rejects(havuz.query("SELECT saklama_sil($1)", [bDolmus.surum]), /firma işleminde/);
  const sil = (f: string, id: string) => kiraciIcinde(havuz, f, (db) => db.sorgu<{ a: string[] | null }>("SELECT saklama_sil($1) AS a", [id])).then((r) => r.rows[0].a);
  assert.equal(await sil(A, bDolmus.surum), null, "başka firmanın sürümü");
  assert.equal(await sil(B, bYeni.surum), null, "süresi dolmamış");
  assert.equal(await sil(A, yeni.surum), null, "süresi dolmamış (A)");
  for (const id of [...bDolmus.dosyalar, ...bYeni.dosyalar, yeni.imzali]) assert.equal(await satirVar(id), true);
  /* kendi firmasında süresi dolmuşu siler; ikinci çağrı boş dizi */
  assert.deepEqual(await sil(B, bDolmus.surum), [...bDolmus.anahtarlar].sort());
  assert.deepEqual(await sil(B, bDolmus.surum), []);
  /* silme kaydı: uygulama okur (yalnız kendi firması), yazamaz, silemez */
  assert.equal((await sql<{ n: number }>(A, "SELECT count(*)::int AS n FROM saklama_silme WHERE surum_id = $1", [bDolmus.surum])).rows[0].n, 0, "B'nin kaydı A'ya görünmez");
  await assert.rejects(sql(A, "INSERT INTO saklama_silme (surum_id, rapor_id, dosya, bayt) VALUES ($1, $2, 0, 0)", [yeni.surum, yeni.rapor]), /permission denied|izin/i);
  await assert.rejects(sql(A, "DELETE FROM saklama_silme"), /permission denied|izin/i);
  /* işlev ölçüleri (gece-cop.test ile aynı) */
  const r = (await sahip.query<{ guvenli: boolean; yol: boolean; herkes: boolean; uygulama: boolean }>(
    `SELECT p.prosecdef AS guvenli, coalesce(array_to_string(p.proconfig, ',') LIKE '%search_path=%', false) AS yol,
       EXISTS (SELECT 1 FROM aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) x WHERE x.grantee = 0 AND x.privilege_type = 'EXECUTE') AS herkes,
       has_function_privilege('probata_uygulama', p.oid, 'EXECUTE') AS uygulama
     FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public' AND p.proname = 'saklama_sil'`)).rows;
  assert.deepEqual(r, [{ guvenli: true, yol: true, herkes: false, uygulama: true }]);
  /* RLS: silme kaydı tablosu zorlamalı */
  const t = (await sahip.query<{ r: boolean; f: boolean }>("SELECT relrowsecurity AS r, relforcerowsecurity AS f FROM pg_class WHERE relname = 'saklama_silme'")).rows[0];
  assert.deepEqual(t, { r: true, f: true });
});
