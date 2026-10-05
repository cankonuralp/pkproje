/* NEREDEN GELDİ: maket teklifler.html (M12 2. tur; teklif → kabul → sözleşme → plan) · pkproje §3.1 modül 11, §3.2 madde 5 ("her rapor teklif
   kalemine bağlanır") · §9 yirmi birinci tur 119–124 (fiyat listesi, KDV teklifte, PDF elle iletilir, birden çok tesis, süresi dolan) · 2026-09-27
   kayıtlı olmayan müşteri · KOD-GECIS §4 (Teklifler: planlama ve firma yöneticisi yazar, yöneticiler ve muhasebe görür, denetçi görmez) ·
   reisim 2026-10-04: "rol değiştirme, sızma, veri çalma; yetki her zaman sunucuda". GERÇEK PostgreSQL, iki firma (göç 0037). 325: Excel'e aktarılan
   ekipman listesi ve teklif belgesinin verisi (yetki, pasif ekipman, firma sızıntısı). 324 incelemesi: "kendi" / "branş" düzeyi teklif görmez;
   kalem / tesis başka teklife taşınmaz; tesissiz teklif gönderilmez; müşteri değişirken başka müşterinin tesisi kalmaz; kopya kaynağı aynı
   firmadan; fiyat üst sınırı; "Müşteri olarak kaydet" uyarıyı gösterir; var olan müşteriye bağlama; her rapor tek teklife.
   Olumsuz kanıt: tests/bozan/teklifler.bozan.ts. */
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import type { GomuluKume } from "../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz, type Sorgulayici } from "../src/server/db/kiraci.ts";
import { klasorDepo } from "../src/server/dosya/depo.ts";
import { onayla } from "../src/modules/onaylar/server/onaylar.ts";
import { planIci, planKabul } from "../src/modules/planlar/server/plan-ici.ts";
import { bugunTr, planAc } from "../src/modules/planlar/server/planlar.ts";
import { taslakBaslat, yayinla } from "../src/modules/rapor-format/server/formatlar.ts";
import { imzaHazirla, imzaliYukle, raporOlustur } from "../src/modules/raporlar/server/raporlar.ts";
import { bitisGunu, kdvli } from "../src/modules/teklifler/sema.ts";
import {
  etkinDurum, teklifBelgesiVerisi, teklifEkipmanListesi, teklifExcelVerisi, teklifGonder, teklifKabul, teklifKarti, teklifKaydet, teklifListesi, teklifMusteriBagla,
  teklifMusteriKaydet, teklifReddet, teklifSecenekleri, type Kisi,
} from "../src/modules/teklifler/server/teklifler.ts";
import { testKumesi } from "./yardimci/kume.ts";

let kume: GomuluKume;
let havuz: Havuz;
let A: string, B: string;
const klasor = mkdtempSync(join(tmpdir(), "teklif-depo-"));
const depo = klasorDepo(klasor);
const tamam = <R extends { durum: string }>(r: R) => { assert.equal(r.durum, "tamam", JSON.stringify(r)); return r as Extract<R, { durum: "tamam" }>; };
let YON: Kisi, PLAN: Kisi, MEK: Kisi, MUH: Kisi, DEN: Kisi, YON_B: Kisi;
let denP: string, m1: string, m2: string, t1: string, t2: string, t3: string, ht: string, ep: string, ekp: Record<string, string>;
let mB: string, tB: string;

/** kişi işlemi: hazırlayan veritabanında oturumdaki hesaptan (app.hesap_id) */
const a = <T,>(k: Kisi, is: (db: Sorgulayici) => Promise<T>) => kiraciIcinde(havuz, A, is, { hesapId: k.id });
const sql = <T extends object>(firma: string, metin: string, p: unknown[] = [], hesapId?: string) =>
  kiraciIcinde(havuz, firma, (db) => db.sorgu<T & Record<string, unknown>>(metin, p), hesapId ? { hesapId } : {});
/** süper kullanıcıyla, tetiksiz (yalnız tarih kurmak için: süresi dolmuş teklif) */
async function sahip(metin: string, p: unknown[] = []) {
  const s = kume.sahipIstemci(); await s.connect();
  try {
    await s.query("SET session_replication_role = replica");
    await s.query(metin, p);
  } finally { await s.end(); }
}

/** formdaki gibi (metin alanlar) teklif girdisi */
const K = (ek: object = {}) => ({ tip: "kayitli", musteri: m1, tesis: t1, ekTesisler: [], gecerlilik: "30", kdv: "20", notlar: "",
  kalemler: [{ tur: ht, adet: "2", fiyat: "1.250,00" }, { tur: ep, adet: "1", fiyat: "900" }], ...ek });
const ADAY = { unvan: "Deneme Yeni Müşteri Sanayi A.Ş.", vd: "Merkez", vno: "1234567890", adres: "Deneme Mah. Örnek Sk. No 1", il: "Kocaeli", ilce: "Gebze",
  eposta: "satin@deneme-yeni.example", tel: "", yetkili: "Deneme Yetkili" };
const surum = async (id: string) => (await sql<{ surum: number }>(A, "SELECT surum FROM teklif WHERE id = $1", [id])).rows[0].surum;

async function hesap(firma: string, eposta: string, roller: string[], ad: string, personel: string | null = null): Promise<Kisi> {
  const id = (await kiraciIcinde(havuz, firma, (db) => db.sorgu<{ id: string }>(
    "INSERT INTO hesap (eposta, ad, roller, durum, personel_id) VALUES ($1, $2, $3, 'etkin', $4) RETURNING id::text", [eposta, ad, roller, personel]))).rows[0].id;
  return { id, ad, roller: roller as Kisi["roller"] };
}

before(async () => {
  kume = await testKumesi();
  havuz = havuzKur(kume.uygulama);
  const s = kume.sahipIstemci(); await s.connect();
  try {
    [A, B] = (await s.query<{ id: string }>(
      "INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-a', 'Deneme A', 'DA'), ('deneme-b', 'Deneme B', 'DB') RETURNING id")).rows.map((r) => r.id);
  } finally { await s.end(); }
  const q = async (firma: string, metin: string, p: unknown[] = []) => (await sql<{ id: string }>(firma, metin, p)).rows[0].id;
  denP = await q(A, "INSERT INTO personel (ad, basla, meslek, ekipnet) VALUES ('Deneme Denetçi', '2024-01-01', 'mak-muh', '123') RETURNING id::text");
  YON = await hesap(A, "yon@deneme-a.example", ["firma_yoneticisi"], "Deneme Yönetici");
  PLAN = await hesap(A, "plan@deneme-a.example", ["planlama"], "Deneme Planlama");
  MEK = await hesap(A, "mek@deneme-a.example", ["mekanik_yonetici"], "Deneme Mekanik");
  MUH = await hesap(A, "muh@deneme-a.example", ["muhasebe"], "Deneme Muhasebe");
  DEN = await hesap(A, "den@deneme-a.example", ["denetci"], "Deneme Denetçi", denP);
  YON_B = await hesap(B, "yon@deneme-b.example", ["firma_yoneticisi"], "Deneme Yönetici B");
  m1 = await q(A, "INSERT INTO musteri (unvan, kisa) VALUES ('Deneme Bir Sanayi A.Ş.', 'Deneme Bir') RETURNING id::text");
  m2 = await q(A, "INSERT INTO musteri (unvan, kisa) VALUES ('Deneme İki Sanayi A.Ş.', 'Deneme İki') RETURNING id::text");
  t1 = await q(A, "INSERT INTO tesis (musteri_id, ad) VALUES ($1, 'Merkez') RETURNING id::text", [m1]);
  t2 = await q(A, "INSERT INTO tesis (musteri_id, ad) VALUES ($1, 'Depo') RETURNING id::text", [m1]);
  t3 = await q(A, "INSERT INTO tesis (musteri_id, ad) VALUES ($1, 'Fabrika') RETURNING id::text", [m2]);
  ht = await q(A, "INSERT INTO ekipman_turu (kod, ad, grup, brans, periyot) VALUES ('HT', 'Hava tankı', 'basincli', 'm', 12) RETURNING id::text");
  ep = await q(A, "INSERT INTO ekipman_turu (kod, ad, grup, brans, periyot) VALUES ('EP', 'Elektrik panosu', 'elektrik', 'e', 12) RETURNING id::text");
  for (const [t, kod, tur] of [[t1, "HT-1", ht], [t1, "HT-2", ht], [t1, "EP-1", ep], [t2, "HT-3", ht]]) {
    await q(A, "INSERT INTO ekipman (tesis_id, tur_id, kod, ekleyen) VALUES ($1, $2, $3, 'x') RETURNING id::text", [t, tur, kod]);
  }
  await sql(A, "UPDATE ekipman SET pasif = now(), surum = surum + 1 WHERE kod = 'HT-3'");
  ekp = Object.fromEntries((await sql<{ kod: string; id: string }>(A, "SELECT kod, id::text FROM ekipman")).rows.map((x) => [x.kod, x.id]));
  await q(A, "INSERT INTO fiyat_listesi (tur_id, fiyat) VALUES ($1, 125000) RETURNING id::text", [ht]);
  await a(YON, async (db) => {
    const t = tamam(await taslakBaslat(db, YON, ht, "sablon:KOMPRESOR", null));
    tamam(await yayinla(db, YON, t.id, t.surum, ""));
  });
  mB = await q(B, "INSERT INTO musteri (unvan, kisa) VALUES ('Deneme B Müşteri A.Ş.', 'Deneme B') RETURNING id::text");
  tB = await q(B, "INSERT INTO tesis (musteri_id, ad) VALUES ($1, 'Merkez') RETURNING id::text", [mB]);
});
after(async () => { await havuz?.end(); await kume?.durdur(); rmSync(klasor, { recursive: true, force: true }); });

test("yetki (modül 11): hazırlamak / işaretlemek yalnız planlama ve firma yöneticisi; mekanik yönetici ve muhasebe görür, denetçi hiç görmez; form seçenekleri yalnız yazana", async () => {
  for (const k of [DEN, MUH, MEK]) assert.equal((await a(k, (db) => teklifKaydet(db, k, null, 0, K()))).durum, "yetkisiz", k.roller[0]);
  assert.equal(await a(DEN, (db) => teklifListesi(db, DEN)), null, "denetçi listeyi görmez");
  for (const k of [MUH, MEK, PLAN, YON]) assert.ok(Array.isArray(await a(k, (db) => teklifListesi(db, k))), k.roller[0]);
  for (const k of [DEN, MUH, MEK]) assert.equal(await a(k, (db) => teklifSecenekleri(db, k)), null, k.roller[0]);
  const s = (await a(PLAN, (db) => teklifSecenekleri(db, PLAN)))!;
  const merkez = s.musteriler.find((x) => x.id === m1)!.tesisler.find((t) => t.id === t1)!;
  assert.deepEqual(merkez.ekipman, { [ht]: 2, [ep]: 1 }, "tesisteki ETKİN ekipman sayısı (tesisten doldur)");
  assert.deepEqual(s.musteriler.find((x) => x.id === m1)!.tesisler.find((t) => t.id === t2)!.ekipman, {}, "pasif ekipman sayılmaz");
  assert.deepEqual(s.turler.filter((t) => t.id === ht || t.id === ep).map((t) => [t.id, t.fiyat]).sort(), [[ht, 125000], [ep, null]].sort(), "fiyat listesi");
});

test("akış: hazırla (numara sunucuda, hazırlayan veritabanında) → taslak düzenlenir (kalem / tesis eşitlenir) → gönder (geçerlilik gönderilişten) → kabul; gönderilen değişmez; kabulden sonra imzalanan rapor kaleme türüyle bağlanır", async () => {
  const r = tamam(await a(PLAN, (db) => teklifKaydet(db, PLAN, null, 0, K({ ekTesisler: [t2] }))));
  assert.match(r.no!, /^T-\d{4}-\d{3,}$/);
  let k = (await a(MUH, (db) => teklifKarti(db, MUH, r.id)))!;
  assert.deepEqual([k.durum, k.hazirlayan, k.tarih, k.musteri, k.tesisler.map((t) => t.ad), k.kalemSayisi, k.ekipmanSayisi, k.tutar],
    ["taslak", "Deneme Planlama", bugunTr(), "Deneme Bir", ["Merkez", "Depo"], 2, 3, 2 * 125000 + 90000]);
  assert.equal(kdvli(k.tutar, k.kdv), 408000, "KDV %20 dahil");
  assert.deepEqual(k.izin, { duzenle: false, gonder: false, sonuc: false, musteriKaydet: false, bagla: false, kopyala: false, sozlesme: false, planAc: false },
    "muhasebe yalnız görür");
  assert.equal((await a(MEK, (db) => teklifKarti(db, MEK, r.id)))!.no, r.no, "mekanik yönetici görür");
  assert.equal(await a(DEN, (db) => teklifKarti(db, DEN, r.id)), null, "denetçi görmez");
  /* taslak düzenlenir: kalem ve tesis eşitlenir; eski sürümle yazan çakışır */
  const s0 = await surum(r.id);
  tamam(await a(YON, (db) => teklifKaydet(db, YON, r.id, s0, K({ kalemler: [{ tur: ht, adet: "3", fiyat: "1.000" }] }))));
  assert.equal((await a(YON, (db) => teklifKaydet(db, YON, r.id, s0, K()))).durum, "cakisma");
  k = (await a(PLAN, (db) => teklifKarti(db, PLAN, r.id)))!;
  assert.deepEqual([k.kalemler.map((x) => [x.turAd, x.adet, x.fiyat]), k.tesisler.map((t) => t.ad), k.hazirlayan], [[["Hava tankı", 3, 100000]], ["Merkez"], "Deneme Planlama"],
    "hazırlayan düzenleyenle değişmez");
  assert.deepEqual(k.izin, { duzenle: true, gonder: true, sonuc: false, musteriKaydet: false, bagla: false, kopyala: true, sozlesme: false, planAc: false });
  /* kabul / red yalnız gönderilmişe */
  assert.equal((await a(PLAN, async (db) => teklifKabul(db, PLAN, r.id, await surum(r.id)))).durum, "red");
  const g = tamam(await a(PLAN, async (db) => teklifGonder(db, PLAN, r.id, await surum(r.id))));
  assert.match(g.bildirim!, /geçerlilik \d{2}\.\d{2}\.\d{4} tarihine kadar/);
  k = (await a(PLAN, (db) => teklifKarti(db, PLAN, r.id)))!;
  assert.deepEqual([k.durum, k.gonderildi, k.bitis], ["gonderildi", bugunTr(), bitisGunu(bugunTr(), 30)]);
  /* gönderilen teklif değişmez: sunucu ve veritabanı */
  assert.equal((await a(PLAN, async (db) => teklifKaydet(db, PLAN, r.id, await surum(r.id), K()))).durum, "red");
  await assert.rejects(sql(A, "UPDATE teklif SET kdv = 10, surum = surum + 1 WHERE id = $1", [r.id]), /yalnız taslak teklif düzenlenir/);
  await assert.rejects(sql(A, "UPDATE teklif_kalem SET adet = 9 WHERE teklif_id = $1", [r.id]), /yalnız taslak teklifin kalemleri/);
  await assert.rejects(sql(A, "DELETE FROM teklif_kalem WHERE teklif_id = $1", [r.id]), /yalnız taslak teklifin kalemleri/);
  await assert.rejects(sql(A, "INSERT INTO teklif_tesis (teklif_id, tesis_id) VALUES ($1, $2)", [r.id, t2]), /yalnız taslak teklifin/);
  assert.equal((await a(PLAN, async (db) => teklifGonder(db, PLAN, r.id, await surum(r.id)))).durum, "red", "ikinci kez gönderilmez");
  tamam(await a(PLAN, async (db) => teklifKabul(db, PLAN, r.id, await surum(r.id))));
  k = (await a(PLAN, (db) => teklifKarti(db, PLAN, r.id)))!;
  assert.deepEqual([k.durum, k.sonuc, k.kalemler.map((x) => x.raporlanan), k.raporlananTutar], ["kabul", bugunTr(), [0], 0]);
  /* kabulden sonra imzalanan rapor: türüyle kaleme bağlanır (3 adetten 1'i raporlandı) */
  await imzaliRapor(t1, "HT-1");
  k = (await a(PLAN, (db) => teklifKarti(db, PLAN, r.id)))!;
  assert.deepEqual([k.kalemler.map((x) => x.raporlanan), k.raporlananTutar], [[1], 100000]);
  assert.equal((await a(PLAN, async (db) => teklifReddet(db, PLAN, r.id, await surum(r.id), { gerekce: "Fiyat yüksek bulundu" }))).durum, "red", "kabul edilen reddedilmez");
  await assert.rejects(sql(A, "UPDATE teklif SET durum = 'taslak', surum = surum + 1 WHERE id = $1", [r.id]), /geçemez/);
});

test("red gerekçesi zorunlu ve kayıtta kalır; süresi dolan teklif kabul / red edilmez (sunucu ve veritabanı), listede 'Süresi doldu'; kopya yeni taslak", async () => {
  const r = tamam(await a(YON, (db) => teklifKaydet(db, YON, null, 0, K({ tesis: t3, musteri: m2 }))));
  tamam(await a(YON, async (db) => teklifGonder(db, YON, r.id, await surum(r.id))));
  const red = await a(YON, async (db) => teklifReddet(db, YON, r.id, await surum(r.id), { gerekce: "  " }));
  assert.equal(red.durum, "gecersiz");
  tamam(await a(YON, async (db) => teklifReddet(db, YON, r.id, await surum(r.id), { gerekce: "Bütçe bu yıl ayrılmadı" })));
  const k = (await a(YON, (db) => teklifKarti(db, YON, r.id)))!;
  assert.deepEqual([k.durum, k.gerekce, k.sonuc], ["red", "Bütçe bu yıl ayrılmadı", bugunTr()]);
  await assert.rejects(sql(A, "UPDATE teklif SET gerekce = 'Başka gerekçe', surum = surum + 1 WHERE id = $1", [r.id]), /yalnız taslak|gerekçesi/);
  /* süresi dolan: gönderilişi 40 gün önce, geçerlilik 30 */
  const s = tamam(await a(YON, (db) => teklifKaydet(db, YON, null, 0, K())));
  tamam(await a(YON, async (db) => teklifGonder(db, YON, s.id, await surum(s.id))));
  await sahip("UPDATE teklif SET gonderildi = gonderildi - 40 WHERE id = $1", [s.id]);
  assert.equal((await a(YON, (db) => teklifListesi(db, YON)))!.find((x) => x.id === s.id)!.durum, "suresi");
  assert.equal(etkinDurum({ durum: "gonderildi", gonderildi: "2026-01-01", gecerlilik: 30 }, "2026-01-31"), "gonderildi", "son gün hâlâ geçerli");
  assert.equal(etkinDurum({ durum: "gonderildi", gonderildi: "2026-01-01", gecerlilik: 30 }, "2026-02-01"), "suresi");
  for (const is of [(db: Sorgulayici, v: number) => teklifKabul(db, YON, s.id, v), (db: Sorgulayici, v: number) => teklifReddet(db, YON, s.id, v, { gerekce: "Süre doldu" })]) {
    const x = await a(YON, async (db) => is(db, await surum(s.id)));
    assert.deepEqual(x, { durum: "red", neden: "Teklifin geçerliliği doldu; yenisi kopyalanır." });
  }
  await assert.rejects(sql(A, "UPDATE teklif SET durum = 'kabul', surum = surum + 1 WHERE id = $1", [s.id]), /süresi dolan teklif/);
  /* kopya: yeni numara, taslak, kaynağı gösterilir; başka firmanın teklifi kaynak olamaz */
  const c = tamam(await a(PLAN, (db) => teklifKaydet(db, PLAN, null, 0, K(), s.id)));
  assert.notEqual(c.no, s.no);
  const ck = (await a(PLAN, (db) => teklifKarti(db, PLAN, c.id)))!;
  assert.deepEqual([ck.durum, ck.kopyaKaynak], ["taslak", s.no]);
});

test("kayıtlı olmayan müşteri: aday bilgileri doğrulanır (il / ilçe listeden); kabulden sonra 'Müşteri olarak kaydet' müşteri + Merkez tesisini açar, teklif bir kez bağlanır", async () => {
  const kotu = await a(PLAN, (db) => teklifKaydet(db, PLAN, null, 0, { ...K(), tip: "aday", aday: { ...ADAY, il: "Yok İl", vno: "12" } }));
  assert.equal(kotu.durum, "gecersiz");
  assert.ok(kotu.durum === "gecersiz" && kotu.hatalar["aday.il"] && kotu.hatalar["aday.vno"], JSON.stringify(kotu));
  const r = tamam(await a(PLAN, (db) => teklifKaydet(db, PLAN, null, 0, { ...K(), tip: "aday", aday: ADAY })));
  let k = (await a(PLAN, (db) => teklifKarti(db, PLAN, r.id)))!;
  assert.deepEqual([k.musteri, k.kayitli, k.tesis, k.aday?.unvan, k.izin.musteriKaydet], [ADAY.unvan, false, "Kayıtlı olmayan müşteri", ADAY.unvan, false]);
  assert.equal((await a(PLAN, async (db) => teklifMusteriKaydet(db, PLAN, r.id, await surum(r.id)))).durum, "red", "kabulden önce kaydedilmez");
  tamam(await a(PLAN, async (db) => teklifGonder(db, PLAN, r.id, await surum(r.id))));
  tamam(await a(PLAN, async (db) => teklifKabul(db, PLAN, r.id, await surum(r.id))));
  assert.ok((await a(PLAN, (db) => teklifKarti(db, PLAN, r.id)))!.izin.musteriKaydet);
  assert.equal((await a(MUH, async (db) => teklifMusteriKaydet(db, MUH, r.id, await surum(r.id)))).durum, "yetkisiz");
  const m = tamam(await a(PLAN, async (db) => teklifMusteriKaydet(db, PLAN, r.id, await surum(r.id))));
  assert.match(m.bildirim!, /müşteri olarak kaydedildi/);
  k = (await a(PLAN, (db) => teklifKarti(db, PLAN, r.id)))!;
  assert.deepEqual([k.kayitli, k.musteriKart?.unvan, k.tesisler.map((t) => [t.ad, t.il, t.ilce]), k.aday?.unvan, k.izin.musteriKaydet],
    [true, ADAY.unvan, [["Merkez", "Kocaeli", "Gebze"]], ADAY.unvan, false], "aday bilgisi teklifin verildiği hâl olarak kalır");
  assert.equal((await a(PLAN, async (db) => teklifMusteriKaydet(db, PLAN, r.id, await surum(r.id)))).durum, "red", "ikinci kez kaydedilmez");
  await assert.rejects(sql(A, "UPDATE teklif SET musteri_id = $2, surum = surum + 1 WHERE id = $1", [r.id, m2]), /yalnız taslak teklif düzenlenir/, "bağ bir kez");
  await assert.rejects(sql(A, "INSERT INTO teklif_tesis (teklif_id, tesis_id) VALUES ($1, (SELECT tesis_id FROM teklif_tesis WHERE teklif_id = $1))", [r.id]),
    /yalnız taslak teklifin|duplicate|teklif_tesis/, "ikinci tesis eklenmez");
});

test("veritabanı: yeni teklif taslak açılır; numara / tarih / hazırlayan değişmez; kalemsiz gönderilmez; tesis teklifin müşterisinin olmalı", async () => {
  await assert.rejects(sql(A, "INSERT INTO teklif (no, musteri_id, durum, gonderildi, gecerlilik) VALUES ('T-0126-999', $1, 'gonderildi', '2026-01-01', 30)", [m1]),
    /taslak açılır/);
  const id = (await sql<{ id: string; hazirlayan: string | null }>(A, "INSERT INTO teklif (no, musteri_id, gecerlilik) VALUES ('T-0126-998', $1, 30) RETURNING id::text, hazirlayan::text",
    [m1], PLAN.id)).rows[0];
  const h = (await sql<{ hazirlayan: string }>(A, "SELECT hazirlayan::text FROM teklif WHERE id = $1", [id.id])).rows[0].hazirlayan;
  assert.equal(h, PLAN.id, "hazırlayan istemciden değil oturumdan");
  for (const set of ["no = 'T-0126-997'", "tarih = '2020-01-01'", `hazirlayan = '${YON.id}'`]) {
    await assert.rejects(sql(A, `UPDATE teklif SET ${set}, surum = surum + 1 WHERE id = $1`, [id.id]), /değişmez/, set);
  }
  await assert.rejects(sql(A, "UPDATE teklif SET durum = 'gonderildi', surum = surum + 1 WHERE id = $1", [id.id]), /kalemsiz teklif gönderilmez/);
  await assert.rejects(sql(A, "INSERT INTO teklif_tesis (teklif_id, tesis_id) VALUES ($1, $2)", [id.id, t3]), /tesis teklifin müşterisinin olmalı/);
  assert.equal((await a(PLAN, async (db) => teklifGonder(db, PLAN, id.id, await surum(id.id)))).durum, "red", "sunucu da kalemsiz göndermez");
});

test("firma sızıntısı: B'nin yöneticisi A'nın tekliflerini görmez / değiştiremez; A'nın müşterisi ya da tesisi B'nin teklifine giremez; numara firmada ayrı", async () => {
  const r = tamam(await a(PLAN, (db) => teklifKaydet(db, PLAN, null, 0, K())));
  const b = <T,>(is: (db: Sorgulayici) => Promise<T>) => kiraciIcinde(havuz, B, is, { hesapId: YON_B.id });
  const turB = (await sql<{ id: string }>(B, "INSERT INTO ekipman_turu (kod, ad, grup, brans, periyot) VALUES ('HT', 'Hava tankı', 'basincli', 'm', 12) RETURNING id::text")).rows[0].id;
  const KB = (ek: object = {}) => K({ musteri: mB, tesis: tB, kalemler: [{ tur: turB, adet: "1", fiyat: "1" }], ...ek });
  assert.equal(await b((db) => teklifKarti(db, YON_B, r.id)), null);
  assert.ok(!(await b((db) => teklifListesi(db, YON_B)))!.some((x) => x.id === r.id));
  assert.equal((await b((db) => teklifKaydet(db, YON_B, r.id, 0, KB()))).durum, "yok", "başka firmanın teklifi düzenlenemez");
  for (const is of [teklifGonder, teklifKabul, teklifMusteriKaydet]) assert.equal((await b((db) => is(db, YON_B, r.id, 0))).durum, "yok", is.name);
  assert.equal((await b((db) => teklifReddet(db, YON_B, r.id, 0, { gerekce: "Deneme gerekçe" }))).durum, "yok");
  assert.equal((await b((db) => teklifKaydet(db, YON_B, null, 0, KB({ musteri: m1, tesis: t1 })))).durum, "gecersiz", "A'nın müşterisi B'de seçilemez");
  assert.equal((await b((db) => teklifKaydet(db, YON_B, null, 0, KB({ kalemler: [{ tur: ht, adet: "1", fiyat: "1" }] })))).durum, "gecersiz", "A'nın türü B'de yok");
  assert.equal((await b((db) => teklifKaydet(db, YON_B, null, 0, KB(), r.id))).durum, "yok", "A'nın teklifi B'de kopya kaynağı olamaz");
  const rb = tamam(await b((db) => teklifKaydet(db, YON_B, null, 0, KB())));
  assert.match(rb.no!, /^T-\d{4}-001$/, "B'nin ilk teklifi kendi sırasıyla");
  await assert.rejects(sql(B, "INSERT INTO teklif_tesis (teklif_id, tesis_id) VALUES ($1, $2)", [rb.id, t1]), /foreign key|violates|teklifin müşterisinin/);
  await assert.rejects(sql(B, "INSERT INTO teklif_kalem (teklif_id, tur_id, adet, fiyat) VALUES ($1, $2, 1, 1)", [r.id, turB]), /teklif yok|foreign key|violates/);
  assert.equal((await sql<{ n: number }>(B, "SELECT count(*)::int AS n FROM teklif WHERE id = $1", [r.id])).rows[0].n, 0, "ham SQL de görmez");
});

test("Excel ve teklif belgesi (325): tesislerin ETKİN ekipmanı (pasif yok), denetçi göremez, başka firmanın tesisi boş döner; sayfanın Excel'i yüklenen listeyi, yoksa tesis ekipmanını, fiyatı kalemden alır; belge verisi kayıtlı / kayıtlı olmayan müşteriyle; ilgili kişi müşteri kartından", async () => {
  assert.deepEqual((await a(PLAN, (db) => teklifEkipmanListesi(db, PLAN, [t1, t2])))!.map((e) => e.kod).sort(), ["EP-1", "HT-1", "HT-2"], "HT-3 pasif");
  /* 2026-10-06 (324–327 incelemesi): formun "Excel'e aktar"ı yalnız teklif yazabilene ve yalnız etkin müşterilerin etkin tesislerine — "gör"
     düzeyindeki muhasebe, matrisin kapattığı ekipman envanterini tesis kimliğiyle okuyabiliyordu (önceden burada MUH ile listeleniyordu) */
  assert.equal(await a(MUH, (db) => teklifEkipmanListesi(db, MUH, [t1, t2])), null, "gör düzeyi");
  assert.equal(await a(DEN, (db) => teklifEkipmanListesi(db, DEN, [t1])), null, "denetçi");
  for (const kotu of ["x", [t1, "x"], null]) assert.equal(await a(PLAN, (db) => teklifEkipmanListesi(db, PLAN, kotu)), null);
  assert.deepEqual(await kiraciIcinde(havuz, B, (db) => teklifEkipmanListesi(db, YON_B, [t1]), { hesapId: YON_B.id }), [], "başka firmanın tesisi");
  await sql(A, "UPDATE musteri SET ilgili = 'Deneme İlgili', eposta = 'bir@deneme-musteri.example', surum = surum + 1 WHERE id = $1", [m1]);
  const yuklu = tamam(await a(PLAN, (db) => teklifKaydet(db, PLAN, null, 0, K({ ekipmanlar: [{ kod: "X-1", tur: ht, konum: "Kazan", seri: "" }] }))));
  const bos = tamam(await a(PLAN, (db) => teklifKaydet(db, PLAN, null, 0, K({ kalemler: [{ tur: ep, adet: "1", fiyat: "500" }] }))));
  const ex = async (id: string) => a(MUH, async (db) => teklifExcelVerisi(db, MUH, (await teklifKarti(db, MUH, id))!));
  const e1 = (await ex(yuklu.id))!;
  assert.deepEqual([e1.liste, e1.ne, e1.fiyat[ht], e1.fiyat[ep]], [[{ kod: "X-1", tur: ht, konum: "Kazan", seri: "" }], "Excel'den yüklenen liste", 125000, 90000]);
  const e2 = (await ex(bos.id))!;
  assert.deepEqual([e2.liste.map((e) => e.kod).sort(), e2.ne, e2.fiyat[ep], e2.fiyat[ht]], [["EP-1", "HT-1", "HT-2"], "tesisteki kayıtlı ekipman", 50000, 125000],
    "kalemde olmayan tür fiyat listesinden");
  assert.ok(e2.turler.some((t) => t.id === ht && t.kod === "HT" && t.brans === "m"));
  /* belge verisi */
  const k = (await a(MUH, (db) => teklifKarti(db, MUH, yuklu.id)))!;
  assert.equal(k.ilgili, "Deneme İlgili", "kayıtlı müşteride ilgili kişi müşteri kartından");
  const b1 = (await a(MUH, (db) => teklifBelgesiVerisi(db, MUH, yuklu.id)))!;
  assert.deepEqual([b1.firma, b1.no, b1.durum, b1.musteri.unvan, b1.musteri.ilgili, b1.musteri.eposta, b1.musteri.yerler.map((y) => y.ad), b1.kalemler.length, b1.hazirlayan],
    [{ ad: "Deneme A", kod: "DA" }, yuklu.no, "taslak", "Deneme Bir Sanayi A.Ş.", "Deneme İlgili", "bir@deneme-musteri.example", ["Merkez"], 2, "Deneme Planlama"]);
  assert.equal(await a(DEN, (db) => teklifBelgesiVerisi(db, DEN, yuklu.id)), null, "denetçi");
  assert.equal(await kiraciIcinde(havuz, B, (db) => teklifBelgesiVerisi(db, YON_B, yuklu.id), { hesapId: YON_B.id }), null, "başka firma");
  const aday = tamam(await a(PLAN, (db) => teklifKaydet(db, PLAN, null, 0, { ...K(), tip: "aday", aday: ADAY })));
  const b2 = (await a(PLAN, (db) => teklifBelgesiVerisi(db, PLAN, aday.id)))!;
  assert.deepEqual([b2.musteri.unvan, b2.musteri.vergi, b2.musteri.ilgili, b2.musteri.yerler], [ADAY.unvan, "Merkez · 1234567890", "Deneme Yetkili",
    [{ ad: null, adres: "Deneme Mah. Örnek Sk. No 1, Gebze / Kocaeli" }]]);
  assert.deepEqual((await a(PLAN, async (db) => teklifExcelVerisi(db, PLAN, (await teklifKarti(db, PLAN, aday.id))!)))!.liste, [], "kayıtlı olmayan müşteride tesis yok");
});

test("324 incelemesi — yetki: firma matrisinde Teklifler 'kendi' ya da 'branş' olan kişi teklif görmez (kayıt kayıt süzgeç yok); sonraki adımların tuşları hedef modülün yetkisiyle", async () => {
  const MATRIS = { 11: ["yaz", "kendi", "brans", "gor", "yaz", "gor"] } as never;
  for (const k of [{ ...DEN, matris: MATRIS }, { ...MEK, matris: MATRIS }]) {
    assert.equal(await a(k, (db) => teklifListesi(db, k)), null, k.roller[0]);
    assert.equal(await a(k, (db) => teklifEkipmanListesi(db, k, [t1])), null, k.roller[0]);
  }
  const r = tamam(await a(PLAN, (db) => teklifKaydet(db, PLAN, null, 0, K())));
  assert.equal(await a({ ...DEN, matris: MATRIS }, (db) => teklifKarti(db, { ...DEN, matris: MATRIS }, r.id)), null);
  tamam(await a(PLAN, async (db) => teklifGonder(db, PLAN, r.id, await surum(r.id))));
  tamam(await a(PLAN, async (db) => teklifKabul(db, PLAN, r.id, await surum(r.id))));
  const izin = async (k: Kisi) => (await a(k, (db) => teklifKarti(db, k, r.id)))!.izin;
  assert.deepEqual([(await izin(PLAN)).sozlesme, (await izin(PLAN)).planAc], [true, true], "planlama: sözleşme ve plan açar");
  const yalnizTeklif = { ...MUH, matris: { 11: ["yaz", "yok", "gor", "gor", "yaz", "yaz"], 12: ["yaz", "kendi", "gor", "gor", "yaz", "gor"] } as never };
  assert.deepEqual([(await izin(yalnizTeklif)).kopyala, (await izin(yalnizTeklif)).sozlesme, (await izin(yalnizTeklif)).planAc], [true, false, false],
    "teklif yazan ama sözleşme / plan yetkisi olmayana o tuşlar yok");
});

test("324 incelemesi — veritabanı: kalem / tesis başka teklife taşınmaz; tesissiz teklif gönderilmez; taslağın müşterisi değişirken başka müşterinin tesisi kalamaz (form ise eşitler); kopya kaynağı aynı firmanın teklifi", async () => {
  const gonderilen = tamam(await a(PLAN, (db) => teklifKaydet(db, PLAN, null, 0, K())));
  tamam(await a(PLAN, async (db) => teklifGonder(db, PLAN, gonderilen.id, await surum(gonderilen.id))));
  const taslak = tamam(await a(PLAN, (db) => teklifKaydet(db, PLAN, null, 0, K())));
  await assert.rejects(sql(A, "UPDATE teklif_kalem SET teklif_id = $1 WHERE teklif_id = $2", [taslak.id, gonderilen.id]), /başka teklife taşınmaz/);
  await assert.rejects(sql(A, "UPDATE teklif_tesis SET teklif_id = $1 WHERE teklif_id = $2", [taslak.id, gonderilen.id]), /başka teklife taşınmaz/);
  /* tesissiz gönderilmez */
  const ham = (await sql<{ id: string }>(A, "INSERT INTO teklif (no, musteri_id, gecerlilik) VALUES ('T-0126-990', $1, 30) RETURNING id::text", [m1], PLAN.id)).rows[0].id;
  await sql(A, "INSERT INTO teklif_kalem (teklif_id, tur_id, adet, fiyat) VALUES ($1, $2, 1, 100)", [ham, ht]);
  await assert.rejects(sql(A, "UPDATE teklif SET durum = 'gonderildi', surum = surum + 1 WHERE id = $1", [ham]), /tesissiz teklif gönderilmez/);
  /* müşteri değişimi: ham SQL'de eski tesis kalırsa reddedilir; form tesisleri önce eşitler */
  await assert.rejects(sql(A, "UPDATE teklif SET musteri_id = $2, surum = surum + 1 WHERE id = $1", [taslak.id, m2]), /tesis teklifin müşterisinin olmalı/);
  tamam(await a(PLAN, async (db) => teklifKaydet(db, PLAN, taslak.id, await surum(taslak.id), K({ musteri: m2, tesis: t3 }))));
  const k = (await a(PLAN, (db) => teklifKarti(db, PLAN, taslak.id)))!;
  assert.deepEqual([k.musteriKart?.id, k.tesisler.map((t) => t.ad)], [m2, ["Fabrika"]]);
  /* kopya kaynağı: var olmayan ya da başka firmanın teklifi yazılamaz */
  await assert.rejects(sql(A, "INSERT INTO teklif (no, musteri_id, gecerlilik, kopya_kaynak) VALUES ('T-0126-991', $1, 30, gen_random_uuid())", [m1]), /foreign key|violates/);
  /* fiyat üst sınırı şemada (alan iletisi, işlem hatası değil) */
  const buyuk = await a(PLAN, (db) => teklifKaydet(db, PLAN, null, 0, K({ kalemler: [{ tur: ht, adet: "1", fiyat: "1.000.000.001" }] })));
  assert.deepEqual(buyuk.durum === "gecersiz" ? buyuk.hatalar["kalemler.0.fiyat"] : buyuk, "Tutar çok büyük.");
  /* kayıtlı olmayan müşterinin telefonu Müşteriler kuralıyla (kabulden sonra müşteri olarak kaydedilebilsin) */
  const tel = await a(PLAN, (db) => teklifKaydet(db, PLAN, null, 0, { ...K(), tip: "aday", aday: { ...ADAY, tel: "0262.555.12.34" } }));
  assert.ok(tel.durum === "gecersiz" && tel.hatalar["aday.tel"], JSON.stringify(tel));
});

test("324 incelemesi — 'Müşteri olarak kaydet' Müşteriler'in uyarısını gösterir (onaylanınca kaydeder, iz ancak o zaman 'uyarı görüldü'); e-posta başka müşterideyse kayıt yerine 'Var olan müşteriye bağla'; bağlama bir kez", async () => {
  await sql(A, "UPDATE musteri SET vno = '9876543210', eposta = 'iki@deneme-musteri.example', surum = surum + 1 WHERE id = $1", [m2]);
  const kabulEt = async (aday: typeof ADAY) => {
    const r = tamam(await a(PLAN, (db) => teklifKaydet(db, PLAN, null, 0, { ...K(), tip: "aday", aday })));
    tamam(await a(PLAN, async (db) => teklifGonder(db, PLAN, r.id, await surum(r.id))));
    tamam(await a(PLAN, async (db) => teklifKabul(db, PLAN, r.id, await surum(r.id))));
    return r.id;
  };
  const vergi = await kabulEt({ ...ADAY, unvan: "Deneme Vergi A.Ş.", vno: "9876543210", eposta: "vergi@deneme-yeni.example" });
  const u = await a(PLAN, async (db) => teklifMusteriKaydet(db, PLAN, vergi, await surum(vergi)));
  assert.equal(u.durum, "uyari");
  assert.match(u.durum === "uyari" ? u.uyarilar.vno : "", /Deneme İki müşterisinde de kayıtlı/);
  const iz = async () => (await sql<{ n: number }>(A, "SELECT count(*)::int AS n FROM denetim_izi WHERE ne = 'musteri.ekle' AND gerekce = 'uyarı görüldü, yine de kaydedildi'")).rows[0].n;
  const once = await iz();
  tamam(await a(PLAN, async (db) => teklifMusteriKaydet(db, PLAN, vergi, await surum(vergi), true)));
  assert.equal(await iz(), once + 1, "uyarı gösterilip onaylandıktan sonra iz");
  /* e-posta başka müşteride: kayıt yok, bağlama önerilir */
  const eposta = await kabulEt({ ...ADAY, unvan: "Deneme Eposta A.Ş.", vno: "", eposta: "iki@deneme-musteri.example" });
  const e = await a(PLAN, async (db) => teklifMusteriKaydet(db, PLAN, eposta, await surum(eposta), true));
  assert.ok(e.durum === "red" && /başka bir müşteride kayıtlı.*Var olan müşteriye bağla/.test(e.neden), JSON.stringify(e));
  assert.ok((await a(PLAN, (db) => teklifKarti(db, PLAN, eposta)))!.izin.bagla);
  /* bağla: müşteri ve onun etkin tesisi; yanlış tesis reddedilir; bir kez */
  const g = await a(PLAN, async (db) => teklifMusteriBagla(db, PLAN, eposta, await surum(eposta), { musteri: m2, tesis: t1 }));
  assert.ok(g.durum === "gecersiz" && g.hatalar.tesis, "başka müşterinin tesisi");
  assert.equal((await a(MUH, async (db) => teklifMusteriBagla(db, MUH, eposta, await surum(eposta), { musteri: m2, tesis: t3 }))).durum, "yetkisiz");
  tamam(await a(PLAN, async (db) => teklifMusteriBagla(db, PLAN, eposta, await surum(eposta), { musteri: m2, tesis: t3 })));
  const k = (await a(PLAN, (db) => teklifKarti(db, PLAN, eposta)))!;
  assert.deepEqual([k.musteriKart?.id, k.tesisler.map((t) => t.ad), k.izin.bagla, k.izin.musteriKaydet, k.aday?.unvan], [m2, ["Fabrika"], false, false, "Deneme Eposta A.Ş."]);
  assert.equal((await a(PLAN, async (db) => teklifMusteriBagla(db, PLAN, eposta, await surum(eposta), { musteri: m1, tesis: t1 }))).durum, "red", "ikinci kez bağlanmaz");
});

test("324 incelemesi — raporlanan: her rapor TEK teklife (tesis × tür için imza gününde geçerli en son kabul edilmiş teklif; pencere teklif tarihinden)", async () => {
  const kabulEt = async () => {
    const r = tamam(await a(PLAN, (db) => teklifKaydet(db, PLAN, null, 0, K({ tesis: t2 }))));
    tamam(await a(PLAN, async (db) => teklifGonder(db, PLAN, r.id, await surum(r.id))));
    tamam(await a(PLAN, async (db) => teklifKabul(db, PLAN, r.id, await surum(r.id))));
    return r.id;
  };
  const eski = await kabulEt(), yeni = await kabulEt();
  const tid = (await sql<{ id: string }>(A, "SELECT id::text FROM ekipman_turu WHERE kod = 'HT'")).rows[0].id;
  ekp["HT-T2"] = (await sql<{ id: string }>(A, "INSERT INTO ekipman (tesis_id, tur_id, kod, ekleyen) VALUES ($1, $2, 'HT-T2', 'x') RETURNING id::text", [t2, tid])).rows[0].id;
  await imzaliRapor(t2, "HT-T2");
  const say = async (id: string) => (await a(PLAN, (db) => teklifKarti(db, PLAN, id)))!.kalemler.find((k) => k.turId === ht)!.raporlanan;
  assert.deepEqual([await say(eski), await say(yeni)], [0, 1], "aynı gün: numarası sonraki (en son) teklif");
  /* yeni teklifin tarihi rapordan sonraya alınınca rapor eski teklife bağlanır (yeni teklifin penceresi dışında) */
  await sahip("UPDATE teklif SET tarih = tarih + 1 WHERE id = $1", [yeni]);
  assert.deepEqual([await say(eski), await say(yeni)], [1, 0]);
});

/* ── rapor imzalama (tests/musteri-paneli.test.ts ile aynı yapı) ── */
let sayac = 0, planSira = 0;
const uret = async () => new TextEncoder().encode(`%PDF-1.4\n% deneme ${++sayac}\n1 0 obj << /Type /Catalog >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n`);
const imzala = (b: Uint8Array) => Buffer.concat([Buffer.from(b), Buffer.from("\n9 0 obj << /Type /Sig /ByteRange [0 1 2 3] /Contents <00ff> >> endobj\ntrailer << /Root 1 0 R /Prev 0 >>\n%%EOF\n", "latin1")]);
const rsurum = async (id: string) => (await sql<{ surum: number }>(A, "SELECT surum FROM rapor WHERE id = $1", [id])).rows[0].surum;
async function imzaliRapor(tesis: string, kod: string): Promise<string> {
  const bas = bugunTr();
  const p = tamam(await a(PLAN, (db) => planAc(db, depo, PLAN, A, { tesis, baslangic: bas, bitis: bas, ekip: [{ personel: denP, isgNo: `ISG-${planSira++}`, kaydet: false }] }))).id;
  tamam(await a(DEN, async (db) => planKabul(db, DEN, p, (await planIci(db, DEN, p))!.surum, true)));
  const h = tamam(await a(DEN, (db) => raporOlustur(db, DEN, p, ekp[kod]))).id;
  await sql(A, "UPDATE rapor SET durum = 'onayda', surum = surum + 1 WHERE id = $1", [h], DEN.id);
  tamam(await a(MEK, async (db) => onayla(db, MEK, h, await rsurum(h))));
  tamam(await a(DEN, (db) => imzaHazirla(db, depo, DEN, A, h, uret)));
  const ham = (await sql<{ anahtar: string }>(A, "SELECT d.anahtar FROM imza_istegi i JOIN dosya d ON d.id = i.pdf_dosya WHERE i.rapor_id = $1 AND i.durum = 'bekliyor'", [h])).rows[0];
  const s2 = await rsurum(h);
  tamam(await a(DEN, async (db) => imzaliYukle(db, depo, DEN, A, h, s2, { ad: "imzali.pdf", bayt: imzala(await depo.oku(ham.anahtar)) })));
  return h;
}
