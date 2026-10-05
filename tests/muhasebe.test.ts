/* NEREDEN GELDİ: maket muhasebe.html (M14; iş = plan, fatura, tahsilat) · pkproje §3 akış ("… müşteriye açıldı → fatura → tahsilat → iş kapandı"),
   §3.2 madde 5 (her rapor teklif kalemine bağlanır; adedi aşan "teklif dışı", fiyat listesinden) · KOD-GECIS §3 Muhasebe ("fatura no · tahsilat
   kalanı aşmaz · ileri tarih yok · fatura tarihi son imzadan önce olamaz"), §4 (Muhasebe: firma yöneticisi ve muhasebe değiştirir, öteki roller
   yok) · reisim 2026-10-04: "rol değiştirme, sızma, veri çalma; yetki her zaman sunucuda". GERÇEK PostgreSQL, iki firma (göç 0039; 327).
   Olumsuz kanıt: tests/bozan/muhasebe.bozan.ts. */
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
import { gunEkle } from "../src/modules/muhasebe/sema.ts";
import { faturaKarti, faturaKaydet, faturaListesi, isKarti, isListesi, tahsilatKaydet, type Kisi } from "../src/modules/muhasebe/server/muhasebe.ts";
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
    assert.equal((await a(k, (db) => faturaKaydet(db, k, P1, { no: "KMF202600000001", tarih: BUGUN() }))).durum, "yetkisiz");
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
  const g2 = await k({ no: "KMF202600000001", tarih: gunEkle(BUGUN(), 1) });
  assert.deepEqual(g2, { durum: "gecersiz", hatalar: { tarih: "İleri tarihli fatura kaydedilmez." } });
  const g3 = await k({ no: "KMF202600000001", tarih: gunEkle(BUGUN(), -1) });
  assert.ok(g3.durum === "gecersiz" && /imzalandı; fatura bundan önce olamaz/.test(g3.hatalar.tarih), JSON.stringify(g3));
  const r = tamam(await k({ no: " kmf202600000001 ", tarih: BUGUN() }));
  F1 = r.id;
  assert.match(r.bildirim!, /KMF202600000001 kaydedildi: 2 rapor, 2\.700,00 TL/);
  const f = (await a(MUH, (db) => faturaKarti(db, MUH, F1)))!;
  assert.deepEqual([f.no, f.ara, f.kdvTutar, f.toplam, f.vade, f.vadeGun, f.sozlesme?.no, f.durum, f.kaydeden, f.unvan, f.vno, f.isler.map((x) => x.id)],
    ["KMF202600000001", 225000, 45000, 270000, gunEkle(BUGUN(), 45), 45, "IS-1026-001", "bekliyor", "Deneme Muhasebe", "Deneme Bir Sanayi A.Ş.", "1234567890", [P1]]);
  const x = (await a(MUH, (db) => isKarti(db, MUH, P1)))!;
  assert.deepEqual([x.durum, x.faturali, x.hazir, x.kalan, x.izin.fatura, x.izin.tahsilat], ["tahsilat", 2, 0, 270000, false, true]);
  assert.equal((await k({ no: "KMF202600000002", tarih: BUGUN() })).durum, "red", "faturaya hazır rapor kalmadı");
  /* başka bir işin faturasında aynı no */
  const P2 = await planKur(t2);
  await rapor(P2, "HT-3");
  const d = await a(MUH, (db) => faturaKaydet(db, MUH, P2, { no: "KMF202600000001", tarih: BUGUN() }));
  assert.deepEqual(d, { durum: "gecersiz", hatalar: { no: "KMF202600000001 zaten kayıtlı." } });
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
  const r = tamam(await a(YON, (db) => faturaKaydet(db, YON, P3, { no: "KMF202600000003", tarih: BUGUN() })));
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
  const r = tamam(await a(MUH, (db) => faturaKaydet(db, MUH, P4, { no: "KMF202600000004", tarih: BUGUN(), toplu: true })));
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
    const id = await fatura(db, "KMF202600000010", 1);
    await db.sorgu("INSERT INTO fatura_rapor (fatura_id, rapor_id, plan_id, tur_id, fiyat, kaynak) VALUES ($1, $2, $3, $4, 1, 'liste')", [id, imzasiz, P6, ht]);
  }), /yalnız imzalı rapor/);
  await assert.rejects(tek(async (db) => {
    const id = await fatura(db, "KMF202600000011", 999);
    await db.sorgu("INSERT INTO fatura_rapor (fatura_id, rapor_id, plan_id, tur_id, fiyat, kaynak) VALUES ($1, $2, $3, $4, 1, 'liste')", [id, r6, P6, ht]);
  }), /tutarsız/);
  await assert.rejects(tek((db) => fatura(db, "KMF202600000012", 1, gunEkle(BUGUN(), 1))), /ileri tarihli fatura/);
  await assert.rejects(tek(async (db) => {
    const id = await fatura(db, "KMF202600000013", 1);
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
  assert.equal((await b((db) => faturaKaydet(db, YON_B, P1, { no: "ABC202600000001", tarih: BUGUN() }))).durum, "yok");
  for (const t of ["fatura", "fatura_rapor", "tahsilat"]) assert.equal((await sql<{ n: number }>(B, `SELECT count(*)::int AS n FROM ${t}`)).rows[0].n, 0, t);
});
