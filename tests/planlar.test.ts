/* NEREDEN GELDİ: maket plan-ac.html (M6 2. tur; L6 kapsam seçimi yok; G1 geçmiş tarih uyarı; L2 İSG-KATİP uyarı) · pkproje §3.4 (plan künyesi),
   §3.5 (proje no P-AAYY-SIRA, ekipman kodu firmada eşsiz) · KOD-GECIS §3 ("eski kod başkasına verilmez"), §4 (Planlar: planlama ve firma yöneticisi
   değiştirir, yöneticiler görür, denetçi kendi, muhasebe yok; plan aç özel eylemi), §9 (uyarı engel değil) · M5 G (kullanılmış İSG-KATİP ID silinmez) ·
   reisim 2026-10-04: "rol değiştirme, sızma, veri çalma; yetki her zaman sunucuda". GERÇEK PostgreSQL, iki firma (309). */
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import type { GomuluKume } from "../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz, type Sorgulayici } from "../src/server/db/kiraci.ts";
import { klasorDepo } from "../src/server/dosya/depo.ts";
import { bugunTr, planAc, planAcVerisi, planKarti, tesisPlanBilgisi, type Kisi } from "../src/modules/planlar/server/planlar.ts";
import { MATRIS_ONERI } from "../src/server/yetki/tanim.ts";
import { testKumesi } from "./yardimci/kume.ts";

let kume: GomuluKume;
let havuz: Havuz;
let A: string, B: string;
const klasor = mkdtempSync(join(tmpdir(), "plan-depo-"));
const depo = klasorDepo(klasor);
const SGK = "1".repeat(26);
const bugun = bugunTr();
const gunEkle = (n: number) => new Date(Date.parse(`${bugun}T00:00:00Z`) + n * 864e5).toISOString().slice(0, 10);
const tamam = <R extends { durum: string }>(r: R) => { assert.equal(r.durum, "tamam", JSON.stringify(r)); return r as Extract<R, { durum: "tamam" }>; };
const kisi = (id: string, ...roller: string[]): Kisi => ({ id, ad: "Deneme", roller: roller as Kisi["roller"] });

interface Firma { plan: Kisi; mek: Kisi; muh: Kisi; den1: Kisi; den2: Kisi; den1P: string; den2P: string; digerP: string; tesis: string; tesis2: string; pasifTesis: string; isgId: string; tur: string }
let FA: Firma, FB: Firma;

async function firmaKur(firma: string, ek: string): Promise<Firma> {
  return kiraciIcinde(havuz, firma, async (db) => {
    const q = async (sql: string, p: unknown[] = []) => (await db.sorgu<{ id: string }>(sql, p)).rows[0].id;
    const m = await q("INSERT INTO musteri (unvan, kisa) VALUES ('Deneme Sanayi A.Ş.', 'Deneme') RETURNING id::text");
    const tesis = await q("INSERT INTO tesis (musteri_id, ad, adres, il, ilce, sgk) VALUES ($1, 'Merkez', 'Deneme Cad. 1', 'Ankara', 'Çankaya', $2) RETURNING id::text", [m, SGK]);
    const tesis2 = await q("INSERT INTO tesis (musteri_id, ad) VALUES ($1, 'Depo') RETURNING id::text", [m]);
    const pasifTesis = await q("INSERT INTO tesis (musteri_id, ad, pasif) VALUES ($1, 'Kapalı', current_date) RETURNING id::text", [m]);
    const per = (ad: string, ekipnet: string | null) => q("INSERT INTO personel (ad, basla, meslek, ekipnet) VALUES ($1, '2024-01-01', 'elk-muh', $2) RETURNING id::text", [ad, ekipnet]);
    const hes = (eposta: string, roller: string[], durum: string, personel: string | null) =>
      q("INSERT INTO hesap (eposta, ad, roller, durum, personel_id) VALUES ($1, 'Deneme', $2, $3, $4) RETURNING id::text", [`${eposta}@${ek}.example`, roller, durum, personel]);
    const den1P = await per("Deneme Bir", "12345"), den2P = await per("Deneme İki", null), digerP = await per("Deneme Üç", "999");
    const den1 = kisi(await hes("den1", ["denetci"], "etkin", den1P), "denetci");
    const den2 = kisi(await hes("den2", ["denetci"], "ilk", den2P), "denetci");
    await hes("diger", ["planlama"], "etkin", digerP);
    const plan = kisi(await hes("plan", ["planlama"], "etkin", null), "planlama");
    const mek = kisi(await hes("mek", ["mekanik_yonetici"], "etkin", null), "mekanik_yonetici");
    const muh = kisi(await hes("muh", ["muhasebe"], "etkin", null), "muhasebe");
    const s = await q("INSERT INTO is_sozlesmesi (no, musteri_id, baslangic, bitis, vade, yenileme) VALUES ('IS-0126-001', $1, $2, $3, 30, 'yok') RETURNING id::text", [m, gunEkle(-30), gunEkle(300)]);
    await q("INSERT INTO is_sozlesmesi_tesis (sozlesme_id, tesis_id) VALUES ($1, $2) RETURNING id::text", [s, tesis]);
    const isgId = await q("INSERT INTO isg_katip (tesis_id, personel_id, no) VALUES ($1, $2, 'ISG-111') RETURNING id::text", [tesis, den1P]);
    const tur = await q("INSERT INTO ekipman_turu (kod, ad, grup, brans, periyot) VALUES ('HT', 'Hava tankı', 'basincli', 'm', 12) RETURNING id::text");
    return { plan, mek, muh, den1, den2, den1P, den2P, digerP, tesis, tesis2, pasifTesis, isgId, tur };
  });
}
const a = <T,>(k: Kisi, is: (db: Sorgulayici) => Promise<T>) => kiraciIcinde(havuz, A, is, { hesapId: k.id });
const b = <T,>(k: Kisi, is: (db: Sorgulayici) => Promise<T>) => kiraciIcinde(havuz, B, is, { hesapId: k.id });
const sql = <T extends object>(firma: string, metin: string, p: unknown[] = []) => kiraciIcinde(havuz, firma, (db) => db.sorgu<T & Record<string, unknown>>(metin, p));

before(async () => {
  kume = await testKumesi();
  havuz = havuzKur(kume.uygulama);
  const s = kume.sahipIstemci(); await s.connect();
  try {
    [A, B] = (await s.query<{ id: string }>(
      "INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-a', 'Deneme A', 'DA'), ('deneme-b', 'Deneme B', 'DB') RETURNING id")).rows.map((r) => r.id);
  } finally { await s.end(); }
  FA = await firmaKur(A, "deneme-a");
  FB = await firmaKur(B, "deneme-b");
});
after(async () => { await havuz?.end(); await kume?.durdur(); rmSync(klasor, { recursive: true, force: true }); });

test("plan aç: proje no P-AAYY-SIRA; künye kayıttan; İSG-KATİP ID sözleşmeden gelir ve 'kullanıldı' olur; el ile ID sözleşmeye de kaydedilir", async () => {
  const r = tamam(await a(FA.plan, (db) => planAc(db, depo, FA.plan, A, {
    tesis: FA.tesis, baslangic: bugun, bitis: gunEkle(1), aciklama: "  giriş   izni ",
    ekip: [{ personel: FA.den1P, isgNo: "BAŞKA", kaydet: false }, { personel: FA.den2P, isgNo: "EL-777", kaydet: true }],
  })));
  assert.match(r.no, /^P-\d{4}-001$/);
  const p = (await sql<{ no: string; firma_adi: string; adres: string; sgk: string; aciklama: string; durum: string; acan: string }>(A,
    "SELECT no, firma_adi, adres, sgk, aciklama, durum, acan FROM plan WHERE id = $1", [r.id])).rows[0];
  assert.deepEqual(p, { no: r.no, firma_adi: "Deneme Sanayi A.Ş.", adres: "Deneme Cad. 1, Çankaya / Ankara", sgk: SGK, aciklama: "giriş izni", durum: "bekliyor", acan: "Deneme" });
  const e = (await sql<{ personel_id: string; isg_no: string; isg_id: string }>(A, "SELECT personel_id::text, isg_no, isg_id::text FROM plan_ekip WHERE plan_id = $1", [r.id])).rows;
  assert.equal(e.find((x) => x.personel_id === FA.den1P)?.isg_no, "ISG-111", "sözleşmedeki ID el ile yazılandan önce gelir");
  assert.equal(e.find((x) => x.personel_id === FA.den1P)?.isg_id, FA.isgId);
  const yeni = e.find((x) => x.personel_id === FA.den2P)!;
  assert.equal(yeni.isg_no, "EL-777");
  const k = (await sql<{ no: string; kullanildi: string; personel_id: string }>(A, "SELECT no, kullanildi::text, personel_id::text FROM isg_katip WHERE id = ANY ($1::uuid[]) ORDER BY no", [[FA.isgId, yeni.isg_id]])).rows;
  assert.deepEqual(k.map((x) => [x.no, x.kullanildi, x.personel_id]), [["EL-777", bugun, FA.den2P], ["ISG-111", bugun, FA.den1P]], "sözleşmeye kaydedildi, ikisi de kullanıldı");
  const r2 = tamam(await a(FA.plan, (db) => planAc(db, depo, FA.plan, A, { tesis: FA.tesis2, baslangic: bugun, bitis: bugun, aciklama: "", ekip: [{ personel: FA.den1P, isgNo: "", kaydet: false }] })));
  assert.match(r2.no, /^P-\d{4}-002$/, "sıra artar");
  /* denetim izine plan.ac düşer */
  assert.ok((await sql(A, "SELECT 1 FROM denetim_izi WHERE ne = 'plan.ac' AND nesne_id = $1", [r.id])).rowCount);
});

test("engeller yalnız veri bütünlüğü (tesis, tarih, bitiş ≥ başlangıç, denetçi); pasif tesis ve denetçi olmayan reddedilir; uyarılar engel değil", async () => {
  const bos = await a(FA.plan, (db) => planAc(db, depo, FA.plan, A, {}));
  assert.equal(bos.durum, "gecersiz");
  assert.deepEqual(bos.durum === "gecersiz" && Object.keys(bos.hatalar).sort(), ["baslangic", "bitis", "ekip", "tesis"]);
  const g = (x: object) => a(FA.plan, (db) => planAc(db, depo, FA.plan, A, { tesis: FA.tesis2, baslangic: bugun, bitis: bugun, aciklama: "", ekip: [{ personel: FA.den1P, isgNo: "", kaydet: false }], ...x }));
  assert.deepEqual(await g({ bitis: gunEkle(-1) }), { durum: "gecersiz", hatalar: { bitis: "Bitiş başlangıçtan önce olamaz." } });
  assert.deepEqual(await g({ baslangic: "2026-02-30" }), { durum: "gecersiz", hatalar: { baslangic: "GG.AA.YYYY biçiminde geçerli bir tarih." } });
  assert.deepEqual(await g({ tesis: FA.pasifTesis }), { durum: "gecersiz", hatalar: { tesis: "Pasif tesise plan açılmaz; önce tesisi yeniden etkinleştirin." } });
  assert.deepEqual(await g({ ekip: [{ personel: FA.digerP, isgNo: "", kaydet: false }] }), { durum: "gecersiz", hatalar: { ekip: "Denetçi listeden seçilmeli." } });
  assert.deepEqual(await g({ ekip: [{ personel: FA.den1P }, { personel: FA.den1P }] }), { durum: "gecersiz", hatalar: { ekip: "Aynı denetçi iki kez seçilmiş." } });
  /* geçmiş tarih + EKİPNET'siz, ilk girişini yapmamış, İSG-KATİP ID'si olmayan denetçi: plan AÇILIR, uyarılar planın üstünde */
  const r = tamam(await g({ baslangic: gunEkle(-10), bitis: gunEkle(-9), ekip: [{ personel: FA.den2P, isgNo: "", kaydet: false }] }));
  const k = (await a(FA.plan, (db) => planKarti(db, FA.plan, r.id)))!;
  assert.equal(k.gecmis, true);
  assert.deepEqual(k.ekip[0].uyarilar, ["İSG-KATİP SÖZLEŞME ID'si yok", "EKİPNET kayıt numarası yok", "İlk girişini yapmadı"]);
  /* sözleşmeye kaydetme: tesisin yürürlükte sözleşmesi yoksa reddedilir, sessizce atlanmaz */
  assert.deepEqual(await g({ ekip: [{ personel: FA.den2P, isgNo: "X-1", kaydet: true }] }), { durum: "gecersiz", hatalar: { ekip: "Tesisin yürürlükte iş sözleşmesi yok; ID sözleşmeye kaydedilemez." } });
});

test("tesis bilgisi: İSG-KATİP ID'leri, sözleşmeler, ekipman; yürürlükte sözleşme; plan açamayana yok", async () => {
  const t = (await a(FA.plan, (db) => tesisPlanBilgisi(db, FA.plan, FA.tesis)))!;
  assert.ok(t.isg.some((x) => x.no === "ISG-111"));
  assert.deepEqual(t.sozlesmeler.map((x) => x.no), ["IS-0126-001"]);
  assert.equal(t.yururlukte, true);
  assert.equal((await a(FA.plan, (db) => tesisPlanBilgisi(db, FA.plan, FA.tesis2)))!.yururlukte, false);
  assert.equal(await a(FA.den1, (db) => tesisPlanBilgisi(db, FA.den1, FA.tesis)), null);
  assert.equal(await b(FB.plan, (db) => tesisPlanBilgisi(db, FB.plan, FA.tesis)), null, "başka firmanın tesisi");
});

test("YETKİ: plan açma planlama + firma yöneticisi; yönetici görür; denetçi yalnız ekibinde olduğu planı; muhasebe hiç", async () => {
  const r = tamam(await a(FA.plan, (db) => planAc(db, depo, FA.plan, A, { tesis: FA.tesis2, baslangic: bugun, bitis: bugun, aciklama: "", ekip: [{ personel: FA.den1P, isgNo: "", kaydet: false }] })));
  for (const k of [FA.den1, FA.mek, FA.muh]) {
    assert.deepEqual(await a(k, (db) => planAc(db, depo, k, A, { tesis: FA.tesis2, baslangic: bugun, bitis: bugun, aciklama: "", ekip: [{ personel: FA.den1P }] })), { durum: "yetkisiz" });
    assert.equal(await a(k, (db) => planAcVerisi(db, k)), null);
  }
  const YON = kisi(FA.plan.id, "firma_yoneticisi");
  assert.ok(await a(YON, (db) => planAcVerisi(db, YON)));
  assert.ok(await a(FA.mek, (db) => planKarti(db, FA.mek, r.id)), "yönetici görür");
  assert.ok(await a(FA.den1, (db) => planKarti(db, FA.den1, r.id)), "ekipteki denetçi görür");
  assert.equal(await a(FA.den2, (db) => planKarti(db, FA.den2, r.id)), null, "ekipte olmayan denetçi görmez");
  assert.equal(await a(FA.muh, (db) => planKarti(db, FA.muh, r.id)), null);
  const v = (await a(FA.plan, (db) => planAcVerisi(db, FA.plan)))!;
  assert.deepEqual(v.adaylar.map((x) => x.ad).sort(), ["Deneme Bir", "Deneme İki"], "yalnız hesabı açık denetçiler");
  assert.ok(!v.musteriler.flatMap((m) => m.tesisler).some((t) => t.id === FA.pasifTesis), "pasif tesis seçilmez");
});

test("ROL DEĞİŞTİRME: yetki firmanın rol düzeninden — planlamaya 'görür' verilince açamaz, denetçiye 'değiştirir' verilince açar; sahte rol bir şey vermez", async () => {
  const satir = (d: string[]) => ({ ...MATRIS_ONERI, 13: d }) as never;
  const PLAN_GOR: Kisi = { ...FA.plan, matris: satir(["gor", "kendi", "gor", "gor", "yaz", "yok"]) };
  assert.deepEqual(await a(PLAN_GOR, (db) => planAc(db, depo, PLAN_GOR, A, { tesis: FA.tesis2, baslangic: bugun, bitis: bugun, ekip: [{ personel: FA.den1P }] })), { durum: "yetkisiz" });
  const DEN_YAZ: Kisi = { ...FA.den1, matris: satir(["yaz", "yaz", "gor", "gor", "yaz", "yok"]) };
  tamam(await a(DEN_YAZ, (db) => planAc(db, depo, DEN_YAZ, A, { tesis: FA.tesis2, baslangic: bugun, bitis: bugun, ekip: [{ personel: FA.den1P }] })));
  const SAHTE: Kisi = { ...FA.den1, roller: ["denetci", "admin", "__proto__"] as never };
  assert.deepEqual(await a(SAHTE, (db) => planAc(db, depo, SAHTE, A, { tesis: FA.tesis2, baslangic: bugun, bitis: bugun, ekip: [{ personel: FA.den1P }] })), { durum: "yetkisiz" });
});

test("KİRACI: B, A'nın tesisine plan açamaz, A'nın denetçisini ekibe koyamaz, A'nın planını göremez; veritabanı bağlamaz", async () => {
  const r = tamam(await a(FA.plan, (db) => planAc(db, depo, FA.plan, A, { tesis: FA.tesis2, baslangic: bugun, bitis: bugun, ekip: [{ personel: FA.den1P }] })));
  assert.deepEqual(await b(FB.plan, (db) => planAc(db, depo, FB.plan, B, { tesis: FA.tesis, baslangic: bugun, bitis: bugun, ekip: [{ personel: FB.den1P }] })),
    { durum: "gecersiz", hatalar: { tesis: "Tesis seçilmeli." } });
  assert.deepEqual(await b(FB.plan, (db) => planAc(db, depo, FB.plan, B, { tesis: FB.tesis, baslangic: bugun, bitis: bugun, ekip: [{ personel: FA.den1P }] })),
    { durum: "gecersiz", hatalar: { ekip: "Denetçi listeden seçilmeli." } });
  assert.equal(await b(FB.plan, (db) => planKarti(db, FB.plan, r.id)), null);
  await assert.rejects(sql(B, "INSERT INTO plan_ekip (plan_id, personel_id) VALUES ($1, $2)", [r.id, FB.den1P]), /foreign key|yabancı anahtar/i);
  await assert.rejects(sql(B, "INSERT INTO plan (no, tesis_id, baslangic, bitis, firma_adi, acan) VALUES ('P-0126-900', $1, $2, $2, 'x', 'x')", [FA.tesis, bugun]), /foreign key|yabancı anahtar/i);
  assert.equal((await sql(B, "UPDATE plan SET aciklama = 'ele geçirdim' WHERE id = $1", [r.id])).rowCount, 0);
  /* B'nin ilk planı kendi sırasından başlar */
  assert.match(tamam(await b(FB.plan, (db) => planAc(db, depo, FB.plan, B, { tesis: FB.tesis, baslangic: bugun, bitis: bugun, ekip: [{ personel: FB.den1P }] }))).no, /^P-\d{4}-001$/);
});

test("PLAN değişmez alanlar: proje no ve tesis değişmez; bitiş başlangıçtan önce olamaz; silinmez", async () => {
  const r = tamam(await a(FA.plan, (db) => planAc(db, depo, FA.plan, A, { tesis: FA.tesis2, baslangic: bugun, bitis: bugun, ekip: [{ personel: FA.den1P }] })));
  await assert.rejects(sql(A, "UPDATE plan SET no = 'P-0101-999' WHERE id = $1", [r.id]), /değişmez/);
  await assert.rejects(sql(A, "UPDATE plan SET tesis_id = $2 WHERE id = $1", [r.id, FA.tesis]), /değişmez/);
  await assert.rejects(sql(A, "UPDATE plan SET bitis = baslangic - 1 WHERE id = $1", [r.id]), /check/i);
  await assert.rejects(sql(A, "DELETE FROM plan WHERE id = $1", [r.id]), /permission denied|izin/i);
});

test("EKİPMAN KODU: firmada eşsiz; değiştirilen eski kod başkasına verilmez; biçim veritabanında da (A–Z 0–9 tire, 3–20); başka firmada serbest", async () => {
  const ekle = (firma: string, f: Firma, kod: string) => sql<{ id: string }>(firma,
    "INSERT INTO ekipman (tesis_id, tur_id, kod, ekleyen) VALUES ($1, $2, $3, 'Deneme') RETURNING id::text", [f.tesis, f.tur, kod]);
  const x = (await ekle(A, FA, "HT-1001")).rows[0].id;
  await assert.rejects(ekle(A, FA, "HT-1001"), /duplicate|yinelenen|başka bir ekipmana/i);
  await sql(A, "UPDATE ekipman SET kod = 'HT-2001' WHERE id = $1", [x]);
  await assert.rejects(ekle(A, FA, "HT-1001"), /başka bir ekipmana verilmiş/, "eski kod başkasına verilmez");
  await sql(A, "UPDATE ekipman SET kod = 'HT-1001' WHERE id = $1", [x]);
  assert.equal((await sql<{ kod: string }>(A, "SELECT kod FROM ekipman WHERE id = $1", [x])).rows[0].kod, "HT-1001", "ekipman kendi eski koduna dönebilir");
  for (const kotu of ["-HT1", "HT1-", "HT--1", "ht-1", "AB", "A".repeat(21), "HT 1"]) await assert.rejects(ekle(A, FA, kotu), /check/i, kotu);
  assert.ok((await ekle(B, FB, "HT-1001")).rowCount, "başka firmada aynı kod serbest");
  await assert.rejects(sql(A, "DELETE FROM ekipman WHERE id = $1", [x]), /permission denied|izin/i);
  await assert.rejects(sql(A, "DELETE FROM ekipman_kodu WHERE ekipman_id = $1", [x]), /permission denied|izin/i);
  /* plan kartında tesisin ekipmanı tür başına; kontrolü bilinmeyen ekipman "kontrolü geliyor" */
  const r = tamam(await a(FA.plan, (db) => planAc(db, depo, FA.plan, A, { tesis: FA.tesis, baslangic: bugun, bitis: bugun, ekip: [{ personel: FA.den1P }] })));
  const k = (await a(FA.plan, (db) => planKarti(db, FA.plan, r.id)))!;
  assert.deepEqual(k.kapsam.map((y) => [y.tur.ad, y.ekipman, y.geliyor]), [["Hava tankı", 1, 1]]);
  assert.equal(k.ekipman, 1);
});
