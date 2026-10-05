/* NEREDEN GELDİ: maket muhasebe.html (M14; iş = plan, fatura, tahsilat) · pkproje §3 akış ("… müşteriye açıldı → fatura → tahsilat → iş kapandı"),
   §3.2 madde 5 (her rapor teklif kalemine bağlanır; adedi aşan "teklif dışı", fiyat listesinden) · KOD-GECIS §3 Muhasebe ("fatura no · tahsilat
   kalanı aşmaz · ileri tarih yok · fatura tarihi son imzadan önce olamaz"), §4 (Muhasebe: firma yöneticisi ve muhasebe değiştirir, öteki roller
   yok) · reisim 2026-10-04: "rol değiştirme, sızma, veri çalma; yetki her zaman sunucuda". GERÇEK PostgreSQL, iki firma (göç 0039; 327).
   328 (göç 0040): giderler (KOD-GECIS §5 "onay bekliyor → onaylandı (ödenecek) → ödendi · reddedildi (gerekçe ≥ 5). Elle girilen: ödendi /
   ödenecek"), belge, Excel'den yükle, kârlılık ve gelir-gider (saf hesap tests/karlilik.test.ts). Olumsuz kanıt: tests/bozan/muhasebe.bozan.ts,
   tests/bozan/gider.bozan.ts. */
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
import { giderKdv, gunEkle } from "../src/modules/muhasebe/sema.ts";
import { faturaKarti, faturaKaydet, faturaListesi, gelirGider, isKarti, isListesi, tahsilatKaydet, type Kisi } from "../src/modules/muhasebe/server/muhasebe.ts";
import { giderDosyasiGorulur, giderExceliYukle, giderKaydet, giderListesi, giderReddet, giderSecenekleri, isGiderleri, type GiderBelgesi, type GiderSonra }
  from "../src/modules/muhasebe/server/giderler.ts";
import { ayarOku, ayarYaz } from "../src/server/ayar/ayar.ts";
import { testKumesi } from "./yardimci/kume.ts";

let kume: GomuluKume;
let havuz: Havuz;
let A: string, B: string;
const klasor = mkdtempSync(join(tmpdir(), "muhasebe-depo-"));
const depo = klasorDepo(klasor);
const tamam = <R extends { durum: string }>(r: R) => { assert.equal(r.durum, "tamam", JSON.stringify(r)); return r as Extract<R, { durum: "tamam" }>; };
let YON: Kisi, MUH: Kisi, PLAN: Kisi, MEK: Kisi, DEN: Kisi, YON_B: Kisi;
let denP: string, m1: string, t1: string, t2: string, ht: string, ekp: Record<string, string>, teklif: string;
const a = <T,>(k: Kisi, is: (db: Sorgulayici) => Promise<T>) => kiraciIcinde(havuz, A, is, { hesapId: k.id });
const sql = <T extends object>(firma: string, metin: string, p: unknown[] = [], hesapId?: string) =>
  kiraciIcinde(havuz, firma, (db) => db.sorgu<T & Record<string, unknown>>(metin, p), hesapId ? { hesapId } : {});
async function sahip(metin: string, p: unknown[] = []) {
  const s = kume.sahipIstemci(); await s.connect();
  try { await s.query("SET session_replication_role = replica"); await s.query(metin, p); } finally { await s.end(); }
}
async function hesap(firma: string, eposta: string, roller: string[], ad: string, personel: string | null = null): Promise<Kisi> {
  const id = (await kiraciIcinde(havuz, firma, (db) => db.sorgu<{ id: string }>(
    "INSERT INTO hesap (eposta, ad, roller, durum, personel_id) VALUES ($1, $2, $3, 'etkin', $4) RETURNING id::text", [eposta, ad, roller, personel]))).rows[0].id;
  return { id, ad, roller: roller as Kisi["roller"] };
}
const BUGUN = () => bugunTr();

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
  MUH = await hesap(A, "muh@deneme-a.example", ["muhasebe"], "Deneme Muhasebe");
  PLAN = await hesap(A, "plan@deneme-a.example", ["planlama"], "Deneme Planlama");
  MEK = await hesap(A, "mek@deneme-a.example", ["mekanik_yonetici"], "Deneme Mekanik");
  DEN = await hesap(A, "den@deneme-a.example", ["denetci"], "Deneme Denetçi", denP);
  YON_B = await hesap(B, "yon@deneme-b.example", ["firma_yoneticisi"], "Deneme Yönetici B");
  m1 = await q(A, "INSERT INTO musteri (unvan, kisa, vd, vno) VALUES ('Deneme Bir Sanayi A.Ş.', 'Deneme Bir', 'Merkez', '1234567890') RETURNING id::text");
  t1 = await q(A, "INSERT INTO tesis (musteri_id, ad) VALUES ($1, 'Merkez') RETURNING id::text", [m1]);
  t2 = await q(A, "INSERT INTO tesis (musteri_id, ad) VALUES ($1, 'Depo') RETURNING id::text", [m1]);
  ht = await q(A, "INSERT INTO ekipman_turu (kod, ad, grup, brans, periyot) VALUES ('HT', 'Hava tankı', 'basincli', 'm', 12) RETURNING id::text");
  for (const [t, kod] of [[t1, "HT-1"], [t1, "HT-2"], [t2, "HT-3"]]) await q(A, "INSERT INTO ekipman (tesis_id, tur_id, kod, ekleyen) VALUES ($1, $2, $3, 'x') RETURNING id::text", [t, ht, kod]);
  ekp = Object.fromEntries((await sql<{ kod: string; id: string }>(A, "SELECT kod, id::text FROM ekipman")).rows.map((x) => [x.kod, x.id]));
  await q(A, "INSERT INTO fiyat_listesi (tur_id, fiyat) VALUES ($1, 125000) RETURNING id::text", [ht]);
  /* t1'in kabul edilmiş teklifi: HT × 1, 1.000,00 TL — ikinci HT raporu teklif dışı (fiyat listesinden) */
  teklif = await q(A, "INSERT INTO teklif (no, musteri_id, gecerlilik) VALUES ('T-1026-001', $1, 30) RETURNING id::text", [m1]);
  await q(A, "INSERT INTO teklif_kalem (teklif_id, tur_id, adet, fiyat) VALUES ($1, $2, 1, 100000) RETURNING id::text", [teklif, ht]);
  await q(A, "INSERT INTO teklif_tesis (teklif_id, tesis_id) VALUES ($1, $2) RETURNING id::text", [teklif, t1]);
  await q(A, "UPDATE teklif SET durum = 'gonderildi' WHERE id = $1 RETURNING id::text", [teklif]);
  await q(A, "UPDATE teklif SET durum = 'kabul' WHERE id = $1 RETURNING id::text", [teklif]);
  /* t1'in iş sözleşmesi: vade 45 gün */
  const soz = await q(A, `INSERT INTO is_sozlesmesi (no, musteri_id, baslangic, bitis, vade, yenileme) VALUES ('IS-1026-001', $1, $2::date - 10, $2::date + 300, 45, 'yok')
    RETURNING id::text`, [m1, BUGUN()]);
  await q(A, "INSERT INTO is_sozlesmesi_tesis (sozlesme_id, tesis_id) VALUES ($1, $2) RETURNING id::text", [soz, t1]);
  await a(YON, async (db) => {
    const t = tamam(await taslakBaslat(db, YON, ht, "sablon:KOMPRESOR", null));
    tamam(await yayinla(db, YON, t.id, t.surum, ""));
  });
});
after(async () => { await havuz?.end(); await kume?.durdur(); rmSync(klasor, { recursive: true, force: true }); });

/* ── plan ve imzalı rapor (tests/teklifler.test.ts ile aynı yapı) ── */
let sayac = 0, planSira = 0;
const uret = async () => new TextEncoder().encode(`%PDF-1.4\n% deneme ${++sayac}\n1 0 obj << /Type /Catalog >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n`);
const imzala = (b: Uint8Array) => Buffer.concat([Buffer.from(b), Buffer.from("\n9 0 obj << /Type /Sig /ByteRange [0 1 2 3] /Contents <00ff> >> endobj\ntrailer << /Root 1 0 R /Prev 0 >>\n%%EOF\n", "latin1")]);
const rsurum = async (id: string) => (await sql<{ surum: number }>(A, "SELECT surum FROM rapor WHERE id = $1", [id])).rows[0].surum;
async function planKur(tesis: string): Promise<string> {
  const p = tamam(await a(PLAN, (db) => planAc(db, depo, PLAN, A, { tesis, baslangic: BUGUN(), bitis: BUGUN(), ekip: [{ personel: denP, isgNo: `ISG-${planSira++}`, kaydet: false }] }))).id;
  tamam(await a(DEN, async (db) => planKabul(db, DEN, p, (await planIci(db, DEN, p))!.surum, true)));
  return p;
}
async function rapor(planId: string, kod: string, imzalansin = true): Promise<string> {
  const h = tamam(await a(DEN, (db) => raporOlustur(db, DEN, planId, ekp[kod]))).id;
  if (!imzalansin) return h;
  await sql(A, "UPDATE rapor SET durum = 'onayda', surum = surum + 1 WHERE id = $1", [h], DEN.id);
  tamam(await a(MEK, async (db) => onayla(db, MEK, h, await rsurum(h))));
  tamam(await a(DEN, (db) => imzaHazirla(db, depo, DEN, A, h, uret)));
  const ham = (await sql<{ anahtar: string }>(A, "SELECT d.anahtar FROM imza_istegi i JOIN dosya d ON d.id = i.pdf_dosya WHERE i.rapor_id = $1 AND i.durum = 'bekliyor'", [h])).rows[0];
  const s2 = await rsurum(h);
  tamam(await a(DEN, async (db) => imzaliYukle(db, depo, DEN, A, h, s2, { ad: "imzali.pdf", bayt: imzala(await depo.oku(ham.anahtar)) })));
  return h;
}

let P1: string, r1: string, r2: string, F1: string;

test("yetki (modül 18): muhasebe ve firma yöneticisi görür ve yazar; planlama, denetçi, branş yöneticisi görmez; 'kendi' düzeyi de görmez", async () => {
  P1 = await planKur(t1);
  r1 = await rapor(P1, "HT-1"); r2 = await rapor(P1, "HT-2");
  for (const k of [PLAN, DEN, MEK, { ...MUH, matris: { 18: ["yok", "kendi", "yok", "yok", "yaz", "kendi"] } as never }]) {
    assert.equal(await a(k, (db) => isListesi(db, k)), null, k.roller[0]);
    assert.equal(await a(k, (db) => isKarti(db, k, P1)), null, k.roller[0]);
    assert.equal((await a(k, (db) => faturaKaydet(db, k, P1, { no: "KMF2026000000001", tarih: BUGUN() }))).durum, "yetkisiz");
  }
  for (const k of [MUH, YON]) assert.ok((await a(k, (db) => isListesi(db, k)))!.some((x) => x.id === P1), k.roller[0]);
});

test("iş: rapor birim fiyatı teklif kaleminden, adedi aşan teklif dışı (fiyat listesi); faturaya hazır; vade iş sözleşmesinden", async () => {
  const x = (await a(MUH, (db) => isKarti(db, MUH, P1)))!;
  const f = new Map(x.raporlar.map((r) => [r.id, r]));
  assert.deepEqual([f.get(r1)!.fiyat, f.get(r1)!.kaynak, f.get(r1)!.teklif?.no], [100000, "teklif", "T-1026-001"], "ilk HT teklif kaleminden");
  assert.deepEqual([f.get(r2)!.fiyat, f.get(r2)!.kaynak], [125000, "disi"], "adedi aşan: teklif dışı, fiyat listesinden");
  assert.deepEqual([x.durum, x.imzali, x.toplam, x.hazir, x.raporlanan, x.sozlesme?.vade, x.teklif?.no], ["hazir", 2, 2, 2, 225000, 45, "T-1026-001"]);
  assert.deepEqual([x.onizleme.tek?.raporSayisi, x.onizleme.tek?.ara, x.onizleme.tek?.kdvTutar, x.onizleme.tek?.toplam, x.onizleme.tek?.vadeGun, x.onizleme.toplu],
    [2, 225000, 45000, 270000, 45, null], "tek iş (öteki tesiste hazır iş yok)");
  assert.deepEqual(x.onizleme.tek!.kalemler.map((k) => [k.turAd, k.fiyat, k.adet, k.disi]), [["Hava tankı", 100000, 1, false], ["Hava tankı", 125000, 1, true]]);
  assert.ok(x.izin.fatura && !x.izin.tahsilat);
});

test("fatura: no biçimi ve eşsizliği, ileri tarih yok, son imzadan önce olamaz; kaydedilince raporlar faturalı, iş tahsilat bekler; ikinci kez yok", async () => {
  const k = (girdi: object) => a(MUH, (db) => faturaKaydet(db, MUH, P1, girdi));
  const g1 = await k({ no: "abc", tarih: BUGUN() });
  assert.ok(g1.durum === "gecersiz" && /16 karakter/.test(g1.hatalar.no), JSON.stringify(g1));
  const g2 = await k({ no: "KMF2026000000001", tarih: gunEkle(BUGUN(), 1) });
  assert.deepEqual(g2, { durum: "gecersiz", hatalar: { tarih: "İleri tarihli fatura kaydedilmez." } });
  const g3 = await k({ no: "KMF2026000000001", tarih: gunEkle(BUGUN(), -1) });
  assert.ok(g3.durum === "gecersiz" && /imzalandı; fatura bundan önce olamaz/.test(g3.hatalar.tarih), JSON.stringify(g3));
  const r = tamam(await k({ no: " kmf2026000000001 ", tarih: BUGUN() }));
  F1 = r.id;
  assert.match(r.bildirim!, /KMF2026000000001 kaydedildi: 2 rapor, 2\.700,00 TL/);
  const f = (await a(MUH, (db) => faturaKarti(db, MUH, F1)))!;
  assert.deepEqual([f.no, f.ara, f.kdvTutar, f.toplam, f.vade, f.vadeGun, f.sozlesme?.no, f.durum, f.kaydeden, f.unvan, f.vno, f.isler.map((x) => x.id)],
    ["KMF2026000000001", 225000, 45000, 270000, gunEkle(BUGUN(), 45), 45, "IS-1026-001", "bekliyor", "Deneme Muhasebe", "Deneme Bir Sanayi A.Ş.", "1234567890", [P1]]);
  const x = (await a(MUH, (db) => isKarti(db, MUH, P1)))!;
  assert.deepEqual([x.durum, x.faturali, x.hazir, x.kalan, x.izin.fatura, x.izin.tahsilat], ["tahsilat", 2, 0, 270000, false, true]);
  assert.equal((await k({ no: "KMF2026000000002", tarih: BUGUN() })).durum, "red", "faturaya hazır rapor kalmadı");
  /* başka bir işin faturasında aynı no */
  const P2 = await planKur(t2);
  await rapor(P2, "HT-3");
  const d = await a(MUH, (db) => faturaKaydet(db, MUH, P2, { no: "KMF2026000000001", tarih: BUGUN() }));
  assert.deepEqual(d, { durum: "gecersiz", hatalar: { no: "KMF2026000000001 zaten kayıtlı." } });
  assert.ok((await a(YON, (db) => faturaListesi(db, YON)))!.some((y) => y.id === F1));
});

test("tahsilat: kısmi olabilir, kalanı aşamaz, fatura tarihinden önce ve ileri olamaz; ödenince fatura ödendi; plan tamamlanınca iş kapanır", async () => {
  const k = (girdi: object) => a(MUH, (db) => tahsilatKaydet(db, MUH, F1, girdi));
  const T = (ek: object) => ({ tarih: BUGUN(), tutar: "1.000,00", yontem: "havale", aciklama: "", ...ek });
  assert.deepEqual(await k(T({ tutar: "2.700,01" })), { durum: "gecersiz", hatalar: { tutar: "Kalan 2.700,00 TL; fazlası kaydedilmez." } });
  assert.equal((await k(T({ tarih: gunEkle(BUGUN(), -1) }))).durum, "gecersiz");
  assert.equal((await k(T({ tarih: gunEkle(BUGUN(), 1) }))).durum, "gecersiz");
  assert.equal((await k(T({ yontem: "bitcoin" }))).durum, "gecersiz");
  assert.equal((await a(PLAN, (db) => tahsilatKaydet(db, PLAN, F1, T({})))).durum, "yetkisiz");
  const t = tamam(await k(T({ aciklama: "Dekont 1" })));
  assert.match(t.bildirim!, /kalan 1\.700,00 TL/);
  let f = (await a(MUH, (db) => faturaKarti(db, MUH, F1)))!;
  assert.deepEqual([f.durum, f.tahsil, f.kalan, f.tahsilatlar.map((x) => [x.tutar, x.yontem, x.aciklama, x.kaydeden])], ["kismi", 100000, 170000, [[100000, "Havale / EFT", "Dekont 1", "Deneme Muhasebe"]]]);
  tamam(await k(T({ tutar: "1.700", yontem: "cek" })));
  f = (await a(MUH, (db) => faturaKarti(db, MUH, F1)))!;
  assert.deepEqual([f.durum, f.kalan, f.sonOdeme, f.izin.tahsilat], ["odendi", 0, BUGUN(), false]);
  assert.equal((await k(T({}))).durum, "red", "ödenen faturaya tahsilat eklenmez");
  assert.equal((await a(MUH, (db) => isKarti(db, MUH, P1)))!.durum, "rapor", "plan tamamlanmadı");
  await sahip("UPDATE plan SET durum = 'tamamlandi' WHERE id = $1", [P1]);
  const x = (await a(MUH, (db) => isKarti(db, MUH, P1)))!;
  assert.deepEqual([x.durum, x.kapandi, x.gecmis.some((g) => g[1] === "İş kapandı")], ["kapandi", BUGUN(), true]);
});

test("vadesi geçen fatura: durum 'Vadesi geçti', iş de vadesi geçti", async () => {
  const P3 = await planKur(t1);
  await rapor(P3, "HT-1");
  const r = tamam(await a(YON, (db) => faturaKaydet(db, YON, P3, { no: "KMF2026000000003", tarih: BUGUN() })));
  await sahip("UPDATE fatura SET tarih = tarih - 60, vade = vade - 60 WHERE id = $1", [r.id]);
  assert.equal((await a(MUH, (db) => faturaKarti(db, MUH, r.id)))!.durum, "gecikti");
  assert.equal((await a(MUH, (db) => isKarti(db, MUH, P3)))!.durum, "gecikti");
});

test("toplu fatura: müşterinin faturaya hazır bütün işleri tek faturada", async () => {
  const P4 = await planKur(t1), P5 = await planKur(t2);
  await rapor(P4, "HT-2"); await rapor(P5, "HT-3");
  const x = (await a(MUH, (db) => isKarti(db, MUH, P4)))!;
  assert.ok(x.onizleme.toplu && x.onizleme.toplu.isler.length >= 2, JSON.stringify(x.onizleme.toplu?.isler));
  const n = x.onizleme.toplu!.raporSayisi;
  const r = tamam(await a(MUH, (db) => faturaKaydet(db, MUH, P4, { no: "KMF2026000000004", tarih: BUGUN(), toplu: true })));
  const f = (await a(MUH, (db) => faturaKarti(db, MUH, r.id)))!;
  assert.ok(f.isler.length >= 2 && f.isler.some((y) => y.id === P5) && f.raporSayisi === n);
  assert.equal((await a(MUH, (db) => isKarti(db, MUH, P5)))!.hazir, 0);
});

test("veritabanı: fatura / satır / tahsilat değişmez; satır yalnız faturayla aynı işlemde, imzalı raporla; tutar tutarlı; tahsilat kalanı aşmaz; rapor tek faturada; kaydeden oturumdan", async () => {
  await assert.rejects(sql(A, "UPDATE fatura SET tarih = tarih - 1 WHERE id = $1", [F1]), /permission denied|değişmez/);
  await assert.rejects(sql(A, "DELETE FROM tahsilat WHERE fatura_id = $1", [F1]), /permission denied|değişmez/);
  await assert.rejects(sql(A, "INSERT INTO tahsilat (fatura_id, tarih, tutar, yontem) VALUES ($1, $2, 1, 'nakit')", [F1, BUGUN()]), /kalanını aşamaz/);
  /* önceki işlemde kaydedilmiş faturaya satır eklenmez */
  const P6 = await planKur(t1);
  const r6 = await rapor(P6, "HT-1");
  await assert.rejects(sql(A, "INSERT INTO fatura_rapor (fatura_id, rapor_id, plan_id, tur_id, fiyat, kaynak) VALUES ($1, $2, $3, $4, 1, 'liste')", [F1, r6, P6, ht]),
    /yalnız fatura kaydedilirken/);
  /* aynı işlemde: imzasız rapor girmez; tutar tutarsızsa işlem düşer; ileri tarih yok; rapor ikinci faturaya girmez */
  const imzasiz = await rapor(P6, "HT-2", false);
  const tek = (sorgu: (db: Sorgulayici) => Promise<unknown>) => kiraciIcinde(havuz, A, sorgu, { hesapId: MUH.id });
  const fatura = (db: Sorgulayici, no: string, ara: number, tarih = BUGUN()) => db.sorgu<{ id: string }>(
    `INSERT INTO fatura (no, musteri_id, tarih, vade_gun, vade, kdv, ara, kdv_tutar, toplam) VALUES ($1, $2, $3, 30, $3::date + 30, 20, $4, 0, $4) RETURNING id::text`,
    [no, m1, tarih, ara]).then((x) => x.rows[0].id);
  await assert.rejects(tek(async (db) => {
    const id = await fatura(db, "KMF2026000000010", 1);
    await db.sorgu("INSERT INTO fatura_rapor (fatura_id, rapor_id, plan_id, tur_id, fiyat, kaynak) VALUES ($1, $2, $3, $4, 1, 'liste')", [id, imzasiz, P6, ht]);
  }), /yalnız imzalı rapor/);
  await assert.rejects(tek(async (db) => {
    const id = await fatura(db, "KMF2026000000011", 999);
    await db.sorgu("INSERT INTO fatura_rapor (fatura_id, rapor_id, plan_id, tur_id, fiyat, kaynak) VALUES ($1, $2, $3, $4, 1, 'liste')", [id, r6, P6, ht]);
  }), /tutarsız/);
  await assert.rejects(tek((db) => fatura(db, "KMF2026000000012", 1, gunEkle(BUGUN(), 1))), /ileri tarihli fatura/);
  await assert.rejects(tek(async (db) => {
    const id = await fatura(db, "KMF2026000000013", 1);
    await db.sorgu("INSERT INTO fatura_rapor (fatura_id, rapor_id, plan_id, tur_id, fiyat, kaynak) VALUES ($1, $2, $3, $4, 1, 'liste')", [id, r1, P1, ht]);
  }), /duplicate|unique|fatura_rapor/);
  const kim = (await sql<{ k: string }>(A, "SELECT kaydeden::text AS k FROM fatura WHERE id = $1", [F1])).rows[0].k;
  assert.equal(kim, MUH.id, "kaydeden oturumdan");
});

test("firma sızıntısı: B, A'nın işini / faturasını görmez, tahsilat ekleyemez, faturalayamaz; ham SQL de görmez", async () => {
  const b = <T,>(is: (db: Sorgulayici) => Promise<T>) => kiraciIcinde(havuz, B, is, { hesapId: YON_B.id });
  assert.equal(await b((db) => isKarti(db, YON_B, P1)), null);
  assert.equal(await b((db) => faturaKarti(db, YON_B, F1)), null);
  assert.deepEqual(await b((db) => isListesi(db, YON_B)), []);
  assert.deepEqual(await b((db) => faturaListesi(db, YON_B)), []);
  assert.equal((await b((db) => tahsilatKaydet(db, YON_B, F1, { tarih: BUGUN(), tutar: "1", yontem: "nakit", aciklama: "" }))).durum, "yok");
  assert.equal((await b((db) => faturaKaydet(db, YON_B, P1, { no: "ABC2026000000001", tarih: BUGUN() }))).durum, "yok");
  for (const t of ["fatura", "fatura_rapor", "tahsilat"]) assert.equal((await sql<{ n: number }>(B, `SELECT count(*)::int AS n FROM ${t}`)).rows[0].n, 0, t);
});

/* ── 328: GİDERLER, KÂRLILIK, GELİR-GİDER ─────────────────────────────────────────────────────────────────────────────────────────── */
const G = (ek: object = {}) => ({ tarih: BUGUN(), tur: "yakit", tutar: "1.200,00", oran: "20", aciklama: "Deneme yakıt", is: "", personel: "", ...ek });
const gk = (k: Kisi, id: string | null, surum: number, girdi: object, belge: GiderBelgesi = null, sonra: GiderSonra = null) =>
  a(k, (db) => giderKaydet(db, depo, k, A, id, surum, girdi, belge, sonra));
const gider = async (id: string) => (await a(MUH, (db) => giderListesi(db, MUH)))!.find((g) => g.id === id)!;
const gunNo = (g: string) => `${g.slice(8, 10)}.${g.slice(5, 7)}.${g.slice(0, 4)}`;
let G1: string, G2: string, F_BEK: string;

test("gider (yetki): muhasebe ve firma yöneticisi yazar; 'gör' düzeyi yalnız görür; planlama, denetçi, branş yöneticisi görmez ve yazamaz", async () => {
  for (const k of [PLAN, DEN, MEK]) {
    assert.equal(await a(k, (db) => giderListesi(db, k)), null, k.roller[0]);
    assert.equal(await a(k, (db) => giderSecenekleri(db, k)), null, k.roller[0]);
    assert.equal((await gk(k, null, 0, G())).durum, "yetkisiz", k.roller[0]);
    assert.equal((await a(k, (db) => giderExceliYukle(db, k, [["01.10.2026", "Yol", "1", "", "", ""]]))).durum, "yetkisiz", k.roller[0]);
  }
  const gor = { ...MUH, matris: { 18: ["yok", "yok", "yok", "yok", "yaz", "gor"] } as never };
  assert.ok(Array.isArray(await a(gor, (db) => giderListesi(db, gor))), "gör düzeyi listeyi görür");
  assert.equal(await a(gor, (db) => giderSecenekleri(db, gor)), null);
  assert.equal((await gk(gor, null, 0, G())).durum, "yetkisiz", "gör düzeyi yazamaz");
  assert.equal((await a(gor, (db) => giderReddet(db, gor, P1, 0, { gerekce: "Deneme gerekçe" }))).durum, "yetkisiz");
});

test("gider (elle): ödendi / ödenecek doğar, numara G-AAYY-SIRA, KDV dahil tutardan KDV; belge isteğe bağlı (türü baytlardan); ileri tarih, yabancı iş yok; düzenle + ödendi", async () => {
  const s = (await a(MUH, (db) => giderSecenekleri(db, MUH)))!;
  assert.ok(s.isler.some((x) => x.id === P1) && s.kisiler.some((x) => x.id === denP));
  const r = tamam(await gk(MUH, null, 0, G({ is: P1, personel: denP }), { ad: "fis.pdf", bayt: await uret() }));
  G1 = r.id;
  assert.match(r.no!, /^G-\d{4}-\d{3}$/);
  assert.equal(r.bildirim, `${r.no} kaydedildi: 1.200,00 TL (KDV dahil).`);
  const g = await gider(G1);
  assert.deepEqual([g.durum, g.odeme, g.kaynak, g.tutar, g.kdv, g.haric, g.is?.id, g.personel?.ad, !!g.belge], ["odendi", BUGUN(), "muhasebe", 120000, 20000, 100000, P1, "Deneme Denetçi", true]);
  assert.equal(await a(MUH, (db) => giderDosyasiGorulur(db, MUH, G1)), true);
  assert.equal(await a(PLAN, (db) => giderDosyasiGorulur(db, PLAN, G1)), false, "Muhasebe'yi görmeyen belgeyi açamaz");
  const r2 = tamam(await gk(MUH, null, 0, G({ odeme: "onaylandi", tur: "konaklama", aciklama: "" })));
  G2 = r2.id;
  assert.match(r2.bildirim!, /genel gider; belge eklenmedi\.$/);
  const y2 = await gider(G2);
  assert.deepEqual([y2.durum, y2.odeme, y2.aciklama], ["onaylandi", null, null]);
  const kac = (await a(MUH, (db) => giderListesi(db, MUH)))!.length;
  assert.deepEqual(await gk(MUH, null, 0, G({ tarih: gunEkle(BUGUN(), 1) })), { durum: "gecersiz", hatalar: { tarih: "İleri tarihli gider kaydedilmez." } });
  assert.deepEqual(await gk(MUH, null, 0, G(), { ad: "fis.txt", bayt: new TextEncoder().encode("düz metin") }),
    { durum: "gecersiz", hatalar: { belge: "Belge PDF, JPEG ya da PNG olmalı." } });
  assert.deepEqual(await gk(MUH, null, 0, G({ is: "00000000-0000-4000-8000-000000000009" })), { durum: "gecersiz", hatalar: { is: "İş seçilmeli." } });
  assert.equal((await gk(MUH, null, 0, G(), null, "odendi")).durum, "red", "yeni gider durum geçişiyle doğmaz");
  assert.equal((await a(MUH, (db) => giderListesi(db, MUH)))!.length, kac, "geçersiz girdi kayıt bırakmaz");
  /* ödenecek → düzenle + ödendi (aynı işlem) */
  assert.equal((await gk(MUH, G2, 999, G())).durum, "cakisma");
  const o = tamam(await gk(MUH, G2, y2.surum, G({ tur: "konaklama", tutar: "2.200,00", oran: "10", aciklama: "Otel" }), null, "odendi"));
  assert.equal(o.bildirim, `${r2.no} ödendi: 2.200,00 TL.`);
  const g2 = await gider(G2);
  assert.deepEqual([g2.durum, g2.odeme, g2.tutar, g2.oran, g2.kdv, g2.aciklama], ["odendi", BUGUN(), 220000, 10, 20000, "Otel"]);
  assert.equal((await gk(MUH, G2, g2.surum, G(), null, "odendi")).durum, "red", "ödenen yeniden ödenmez");
  /* belge kaldır */
  tamam(await gk(MUH, G1, g.surum, G({ is: P1, personel: denP }), "kaldir"));
  assert.equal((await gider(G1)).belge, null);
  const kim = (await sql<{ k: string; o: string }>(A, "SELECT kaydeden::text AS k, onaylayan::text AS o FROM gider WHERE id = $1", [G1])).rows[0];
  assert.deepEqual([kim.k, kim.o], [MUH.id, MUH.id], "kaydeden ve onaylayan oturumdan");
  assert.deepEqual((await a(MUH, (db) => isGiderleri(db, MUH, P1)))!.map((x) => x.id), [G1]);
});

test("gider (masraf formu): onay bekler → Onayla (içerikle aynı işlemde) → ödendi; Reddet gerekçe ≥ 5; reddedilen değişmez; veritabanı geçişleri ve damgaları", async () => {
  const form = async (no: string) => (await sql<{ id: string }>(A,
    "INSERT INTO gider (no, tarih, tur, tutar, oran, kaynak, durum, personel_id) VALUES ($1, $2, 'yol', 5000, 20, 'form', 'bekliyor', $3) RETURNING id::text", [no, BUGUN(), denP], DEN.id)).rows[0].id;
  F_BEK = await form("G-0001-901");
  const f2 = await form("G-0001-902");
  const db0 = (await sql<{ k: string; o: string | null }>(A, "SELECT kaydeden::text AS k, onaylayan::text AS o FROM gider WHERE id = $1", [F_BEK])).rows[0];
  assert.deepEqual([db0.k, db0.o], [DEN.id, null], "formu dolduran kaydeden; onaylayan yok");
  await assert.rejects(sql(A, "INSERT INTO gider (no, tarih, tur, tutar, oran, kaynak, durum, odeme) VALUES ('G-0001-903', $1, 'yol', 1, 20, 'form', 'odendi', $1)", [BUGUN()]), /onay bekler/);
  await assert.rejects(sql(A, "INSERT INTO gider (no, tarih, tur, tutar, oran, kaynak, durum) VALUES ('G-0001-904', $1, 'yol', 1, 20, 'muhasebe', 'bekliyor')", [BUGUN()]), /elle girilen/);
  await assert.rejects(sql(A, "INSERT INTO gider (no, tarih, tur, tutar, oran, kaynak, durum) VALUES ('G-0001-905', $1, 'yol', 1, 20, 'form', 'bekliyor')", [gunEkle(BUGUN(), 1)]), /ileri tarihli/);
  await assert.rejects(sql(A, "UPDATE gider SET durum = 'odendi', odeme = $2 WHERE id = $1", [F_BEK, BUGUN()]), /durumundan/);
  await assert.rejects(sql(A, "UPDATE gider SET onaylayan = $2 WHERE id = $1", [F_BEK, MUH.id]), /yalnız durum değişirken/);
  await assert.rejects(sql(A, "UPDATE gider SET kaydeden = $2 WHERE id = $1", [F_BEK, MUH.id]), /değişmez/);
  await assert.rejects(sql(A, "DELETE FROM gider WHERE id = $1", [F_BEK]), /permission denied|silinmez/);
  let x = await gider(F_BEK);
  assert.equal((await gk(MUH, F_BEK, x.surum, G({ tur: "yol", tutar: "50,00" }), null, "odendi")).durum, "red", "onay bekleyen doğrudan ödenmez");
  const on = tamam(await gk(MUH, F_BEK, x.surum, G({ tur: "yol", tutar: "60,00", personel: denP, aciklama: "Köprü" }), null, "onaylandi"));
  assert.match(on.bildirim!, /onaylandı; ödenecek: 60,00 TL\.$/);
  x = await gider(F_BEK);
  assert.deepEqual([x.durum, x.tutar, x.kaynak, x.aciklama], ["onaylandi", 6000, "form", "Köprü"]);
  const d1 = (await sql<{ k: string; o: string; t: string | null }>(A, "SELECT kaydeden::text AS k, onaylayan::text AS o, karar::text AS t FROM gider WHERE id = $1", [F_BEK])).rows[0];
  assert.deepEqual([d1.k, d1.o, !!d1.t], [DEN.id, MUH.id, true], "onaylayan ve karar zamanı oturumdan");
  tamam(await gk(YON, F_BEK, x.surum, G({ tur: "yol", tutar: "60,00", personel: denP, aciklama: "Köprü" }), null, "odendi"));
  const x2 = await gider(F_BEK);
  assert.deepEqual([x2.durum, x2.odeme], ["odendi", BUGUN()]);
  /* reddet */
  const y = await gider(f2);
  assert.equal((await a(MUH, (db) => giderReddet(db, MUH, f2, y.surum, { gerekce: "Kısa" }))).durum, "gecersiz");
  assert.equal((await a(MUH, (db) => giderReddet(db, MUH, F_BEK, x2.surum, { gerekce: "Fiş okunmuyor" }))).durum, "red", "yalnız onay bekleyen reddedilir");
  const rd = tamam(await a(MUH, (db) => giderReddet(db, MUH, f2, y.surum, { gerekce: "  Fiş okunmuyor  " })));
  assert.equal(rd.bildirim, "G-0001-902 reddedildi.");
  const z = await gider(f2);
  assert.deepEqual([z.durum, z.red], ["red", "Fiş okunmuyor"]);
  assert.deepEqual(await gk(MUH, f2, z.surum, G()), { durum: "red", neden: "Reddedilen gider değişmez." });
  await assert.rejects(sql(A, "UPDATE gider SET tutar = 1 WHERE id = $1", [f2]), /reddedilen gider değişmez/);
});

test("gider (Excel'den yükle): satırlar sunucuda yeniden denetlenir, geçerliler ödendi girer, proje no işe bağlanır; büyük / bozuk dosya reddedilir", async () => {
  const no = (await a(MUH, (db) => isKarti(db, MUH, P1)))!.no;
  const r = await a(MUH, (db) => giderExceliYukle(db, MUH, [
    ["Tarih", "Tür", "Tutar (KDV dahil)", "KDV oranı", "Açıklama", "Proje no"],
    [gunNo(BUGUN()), "Yakıt", "120,00", "20", "Excel satırı", no],
    [gunNo(gunEkle(BUGUN(), 1)), "Yakıt", "1", "", "", ""],
    [gunNo(BUGUN()), "Uzay", "1", "", "", ""],
  ]));
  assert.deepEqual(r, { durum: "tamam", id: "", eklenen: 1, bildirim: "1 gider Excel'den eklendi." });
  const l = (await a(MUH, (db) => isGiderleri(db, MUH, P1)))!;
  const e = l.find((g) => g.aciklama === "Excel satırı")!;
  assert.deepEqual([e.durum, e.odeme, e.tutar, e.kaynak], ["odendi", BUGUN(), 12000, "muhasebe"]);
  assert.equal((await a(MUH, (db) => giderExceliYukle(db, MUH, Array.from({ length: 502 }, () => ["01.10.2026", "Yol", "1"])))).durum, "red", "en çok 500 satır");
  assert.equal((await a(MUH, (db) => giderExceliYukle(db, MUH, [[1, 2, 3]]))).durum, "red", "metin olmayan hücre");
  assert.equal((await a(MUH, (db) => giderExceliYukle(db, MUH, "x"))).durum, "red");
  assert.deepEqual(await a(MUH, (db) => giderExceliYukle(db, MUH, [[gunNo(BUGUN()), "Uzay", "1"]])), { durum: "red", neden: "Geçerli satır yok." });
});

test("kârlılık: işe bağlı masraf (KDV hariç, red hariç), denetçinin bordrosu (kişi-gün) ve sabit giderler (genel gider payı) iş kârına ve gelir-gidere girer", async () => {
  const ay = BUGUN().slice(0, 7);
  await sahip("INSERT INTO bordro (firma_id, personel_id, ay, brut, net, maliyet) VALUES ($1, $2, $3, 20000, 15000, 22000)", [A, denP, ay]);
  await a(YON, async (db) => {
    const s = await ayarOku(db, "sabit_gider");
    assert.equal((await ayarYaz(db, "sabit_gider", s.surum, { kalemler: [{ ad: "Ofis kirası", aylik: 2_200_000, not: "" }] }, { kim: YON.ad, ne: "ayar.sabit_gider" })).durum, "tamam");
  });
  const x = (await a(MUH, (db) => isKarti(db, MUH, P1)))!;
  const k = x.karlilik;
  const gunToplam = Number((await sql<{ n: number }>(A, `SELECT count(*)::int AS n FROM rapor WHERE personel_id = $1 AND silindi IS NULL
    AND (olustu AT TIME ZONE 'Europe/Istanbul')::date = $2::date`, [denP, BUGUN()])).rows[0].n);
  const gun = Math.round((2 / gunToplam) * 100) / 100;
  assert.deepEqual(k.kisiler, [{ kisi: denP, ad: "Deneme Denetçi", gun, gunluk: 100_000 }], "denetçi günü o gün yazdığı raporlara bölünür");
  assert.deepEqual([k.gelir, k.rapor, k.dogrudan, k.tahmini], [225000, 2, 100000 + 10000, false], "işe bağlı: elle 1.200,00 (%20) + Excel 120,00 (%20), KDV hariç");
  const genel = (await a(MUH, (db) => giderListesi(db, MUH)))!.filter((g) => !g.is && g.durum !== "red" && g.tarih.slice(0, 7) === ay).reduce((n, g) => n + giderKdv(g.tutar, g.oran).haric, 0);
  assert.equal(genel, 200000 + 5000, "genel: konaklama 2.200,00 (%10) + onaylanan masraf formu 60,00 (%20); reddedilen girmez");
  assert.equal(k.gunPay, Math.round((2_200_000 + genel) / 1 / 22), "tek denetçi: (sabit + genel) ÷ 22");
  assert.deepEqual([k.personel, k.genel, k.kar], [Math.round(gun * 100_000), Math.round(k.gunPay * gun), k.gelir - k.dogrudan - k.personel - k.genel]);
  assert.equal(x.kar, k.kar);
  assert.equal((await a(MUH, (db) => isListesi(db, MUH)))!.find((y) => y.id === P1)!.karOran, k.oran);
  const gg = (await a(MUH, (db) => gelirGider(db, MUH, ay)))!;
  const am = gg.donem.aylar[0].am;
  assert.deepEqual([gg.secili, am.maasDenetci, am.maasDiger, am.sabit, am.genel, am.masraf, am.bordroVar, gg.sabit], [ay, 2_200_000, 0, 2_200_000, genel, 110000, true,
    [{ ad: "Ofis kirası", aylik: 2_200_000, not: "" }]]);
  assert.equal(gg.donem.gider, am.maasDenetci + am.maasDiger + am.masraf + am.genel + am.sabit);
  assert.ok(gg.isler.some((y) => y.id === P1) && gg.donem.gelir >= 225000);
  assert.equal((await a(MUH, (db) => gelirGider(db, MUH, "1999-01")))!.secili, "toplam", "seçenek dışı dönem: toplam");
  assert.equal(await a(PLAN, (db) => gelirGider(db, PLAN, ay)), null);
});

test("gider sızıntısı: B, A'nın giderini görmez, düzenleyemez, reddedemez, belgesini açamaz; A'nın işine gider yazamaz; Excel'de A'nın proje no'su bulunmaz", async () => {
  const b = <T,>(is: (db: Sorgulayici) => Promise<T>) => kiraciIcinde(havuz, B, is, { hesapId: YON_B.id });
  assert.deepEqual(await b((db) => giderListesi(db, YON_B)), []);
  assert.deepEqual((await b((db) => giderSecenekleri(db, YON_B)))!.isler, []);
  assert.equal((await b((db) => giderKaydet(db, depo, YON_B, B, G1, 0, G()))).durum, "yok");
  assert.equal((await b((db) => giderReddet(db, YON_B, F_BEK, 0, { gerekce: "Deneme gerekçe" }))).durum, "yok");
  assert.equal(await b((db) => giderDosyasiGorulur(db, YON_B, G1)), false);
  assert.deepEqual(await b((db) => giderKaydet(db, depo, YON_B, B, null, 0, G({ is: P1 }))), { durum: "gecersiz", hatalar: { is: "İş seçilmeli." } });
  const no = (await a(MUH, (db) => isKarti(db, MUH, P1)))!.no;
  assert.deepEqual(await b((db) => giderExceliYukle(db, YON_B, [[gunNo(BUGUN()), "Yol", "1", "", "", no]])), { durum: "red", neden: "Geçerli satır yok." });
  assert.equal((await sql<{ n: number }>(B, "SELECT count(*)::int AS n FROM gider")).rows[0].n, 0);
  assert.equal((await b((db) => gelirGider(db, YON_B, "toplam")))!.isler.length, 0);
});

/* ── 324–327 incelemesi: rapor ↔ teklif bağı faturalı raporda sabit; kalem adedini önce faturadakiler, sonra imzalılar tüketir ── */
test("birim fiyat bağı (324–327 incelemesi): imzalı rapor imzasızdan önce teklif fiyatını alır; faturalı raporun bağı faturadaki — yeni kabul edilen teklif onu çekmez, adedi tüketir", async () => {
  const q = async (metin: string, p: unknown[] = []) => (await sql<{ id: string }>(A, metin, p)).rows[0].id;
  const t3 = await q("INSERT INTO tesis (musteri_id, ad) VALUES ($1, 'Atölye') RETURNING id::text", [m1]);
  for (const kod of ["HT-7A", "HT-7B", "HT-7C"]) ekp[kod] = await q("INSERT INTO ekipman (tesis_id, tur_id, kod, ekleyen) VALUES ($1, $2, $3, 'x') RETURNING id::text", [t3, ht, kod]);
  const teklifKur = async (no: string) => {
    const id = await q("INSERT INTO teklif (no, musteri_id, gecerlilik) VALUES ($1, $2, 30) RETURNING id::text", [no, m1]);
    await q("INSERT INTO teklif_kalem (teklif_id, tur_id, adet, fiyat) VALUES ($1, $2, 1, 100000) RETURNING id::text", [id, ht]);
    await q("INSERT INTO teklif_tesis (teklif_id, tesis_id) VALUES ($1, $2) RETURNING id::text", [id, t3]);
    await q("UPDATE teklif SET durum = 'gonderildi' WHERE id = $1 RETURNING id::text", [id]);
    await q("UPDATE teklif SET durum = 'kabul' WHERE id = $1 RETURNING id::text", [id]);
    return id;
  };
  const T2 = await teklifKur("T-1026-902");
  const P7 = await planKur(t3);
  const ilk = await rapor(P7, "HT-7A", false);   // önce açılan, imzasız
  const imzali = await rapor(P7, "HT-7B");        // sonra açılan, imzalı
  const bag = async () => new Map((await a(MUH, (db) => isKarti(db, MUH, P7)))!.raporlar.map((r) => [r.id, r]));
  let b = await bag();
  assert.deepEqual([b.get(imzali)!.kaynak, b.get(imzali)!.fiyat, b.get(imzali)!.teklif?.id], ["teklif", 100000, T2], "imzalı rapor teklifin tek adedini alır");
  assert.deepEqual([b.get(ilk)!.kaynak, b.get(ilk)!.fiyat], ["disi", 125000], "imzasız erken rapor adedi elinden almaz");
  const f = tamam(await a(MUH, (db) => faturaKaydet(db, MUH, P7, { no: "KMF2026000000020", tarih: BUGUN() })));
  assert.match(f.bildirim!, /1 rapor, 1\.200,00 TL/, "teklif fiyatıyla faturalandı");
  /* yenileme teklifi (tarihi bugün, raporun açılış gününden sonra değil) kabul edilir: faturalı rapor T2'de kalır, adedi tüketmiş sayılır */
  const T3 = await teklifKur("T-1026-903");
  const ucuncu = await rapor(P7, "HT-7C");
  b = await bag();
  assert.deepEqual([b.get(imzali)!.kaynak, b.get(imzali)!.fiyat, b.get(imzali)!.teklif], ["teklif", 100000, { id: T2, no: "T-1026-902" }], "faturalı bağ değişmez, numara çözülür");
  assert.deepEqual([b.get(ucuncu)!.teklif?.id, b.get(ucuncu)!.kaynak, b.get(ucuncu)!.fiyat], [T3, "teklif", 100000], "yeni teklifin adedi yeni rapora");
  assert.deepEqual([b.get(ilk)!.teklif?.id, b.get(ilk)!.kaynak], [T3, "disi"], "imzasız rapor imzalıdan sonra");
  /* imzasız rapor silinse de faturalı rapor ve sıradaki imzalı rapor fiyatını korur */
  await sahip("UPDATE rapor SET silindi = now() WHERE id = $1", [ilk]);
  b = await bag();
  assert.deepEqual([b.has(ilk), b.get(imzali)!.kaynak, b.get(ucuncu)!.kaynak], [false, "teklif", "teklif"]);
});
