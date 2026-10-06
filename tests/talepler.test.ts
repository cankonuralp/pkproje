/* NEREDEN GELDİ: maket talepler.html (izin talebi, masraf formu, talep penceresi — geri çek, belge), personel.html #/izinler (onay / gerekçeli red)
   · KOD-GECIS §3 Talepler ("izin_talebi, masraf (gider'e yazar) · izin onayı yönetici, masraf onayı muhasebe"), §4 Talepler (herkes kendi,
   firma yöneticisi değiştirir) · reisim 2026-10-04: "rol değiştirme, sızma, veri çalma; yetki her zaman sunucuda". GERÇEK PostgreSQL, iki firma
   (göç 0042, 0040; 330). Saf şema tests/talep-sema.test.ts; olumsuz kanıt tests/bozan/talepler.bozan.ts. */
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import type { GomuluKume } from "../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz, type Sorgulayici } from "../src/server/db/kiraci.ts";
import { klasorDepo } from "../src/server/dosya/depo.ts";
import { gunEkle } from "../src/modules/muhasebe/sema.ts";
import { giderDosyasiGorulur, giderKaydet, giderListesi } from "../src/modules/muhasebe/server/giderler.ts";
import {
  bugunTr, izinBelgesi, izinDosyasiGorulur, izinGeriCek, izinGonder, izinOnayla, izinReddet, izinTalepleri, masrafFormuGeriCek, masrafFormuGonder,
  talepFormuVerisi, taleplerim, type Kisi,
} from "../src/modules/talepler/server/talepler.ts";
import { testKumesi } from "./yardimci/kume.ts";

let kume: GomuluKume;
let havuz: Havuz;
let A: string, B: string;
let YON: Kisi, PLAN: Kisi, MUH: Kisi, DEN: Kisi, YON_B: Kisi;
let denP: string, planP: string, P1: string, P2: string;
const klasor = mkdtempSync(join(tmpdir(), "talepler-depo-"));
const depo = klasorDepo(klasor);
const tamam = <R extends { durum: string }>(r: R) => { assert.equal(r.durum, "tamam", JSON.stringify(r)); return r as Extract<R, { durum: "tamam" }>; };
const a = <T,>(k: Kisi, is: (db: Sorgulayici) => Promise<T>, firma = A) => kiraciIcinde(havuz, firma, is, { hesapId: k.id });
const sql = async (firma: string, metin: string, p: unknown[] = [], hesapId?: string) =>
  (await kiraciIcinde(havuz, firma, (db) => db.sorgu<{ id: string }>(metin, p), hesapId ? { hesapId } : {})).rows[0]?.id;
async function sahip(metin: string, p: unknown[] = []): Promise<string> {
  const s = kume.sahipIstemci(); await s.connect();
  try { await s.query("SET session_replication_role = replica"); return (await s.query<{ id: string }>(metin, p)).rows[0]?.id; } finally { await s.end(); }
}
async function hesap(firma: string, eposta: string, roller: string[], ad: string, personel: string | null): Promise<Kisi> {
  const id = (await sql(firma, "INSERT INTO hesap (eposta, ad, roller, durum, personel_id) VALUES ($1, $2, $3, 'etkin', $4) RETURNING id::text", [eposta, ad, roller, personel]))!;
  return { id, ad, roller: roller as Kisi["roller"] };
}
const BUGUN = () => bugunTr();
/* bu yılın, bugünden sonraki ilk pazartesisi (yıl sonuna yakınsa bu yılın ilk pazartesisi — özet bu yılın yıllık iznini sayar) */
function pazartesi(): string {
  let d = gunEkle(BUGUN(), 1);
  while (new Date(`${d}T12:00:00Z`).getUTCDay() !== 1) d = gunEkle(d, 1);
  if (d.slice(0, 4) !== BUGUN().slice(0, 4)) { d = `${BUGUN().slice(0, 4)}-01-01`; while (new Date(`${d}T12:00:00Z`).getUTCDay() !== 1) d = gunEkle(d, 1); }
  return d;
}
const PDF = new TextEncoder().encode("%PDF-1.4\n% deneme\n1 0 obj << /Type /Catalog >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n");

before(async () => {
  kume = await testKumesi();
  havuz = havuzKur(kume.uygulama);
  const s = kume.sahipIstemci(); await s.connect();
  try {
    [A, B] = (await s.query<{ id: string }>(
      "INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-a', 'Deneme A', 'DA'), ('deneme-b', 'Deneme B', 'DB') RETURNING id")).rows.map((r) => r.id);
  } finally { await s.end(); }
  denP = (await sql(A, "INSERT INTO personel (ad, basla, meslek) VALUES ('Deneme Denetçi', '2024-01-01', 'mak-muh') RETURNING id::text"))!;
  planP = (await sql(A, "INSERT INTO personel (ad, basla, meslek) VALUES ('Deneme Planlama', '2024-01-01', 'mak-tek') RETURNING id::text"))!;
  const yonP = (await sql(A, "INSERT INTO personel (ad, basla, meslek) VALUES ('Deneme Yönetici', '2024-01-01', 'mak-muh') RETURNING id::text"))!;
  const bP = (await sql(B, "INSERT INTO personel (ad, basla, meslek) VALUES ('Deneme B', '2024-01-01', 'mak-muh') RETURNING id::text"))!;
  DEN = await hesap(A, "den@deneme-a.example", ["denetci"], "Deneme Denetçi", denP);
  PLAN = await hesap(A, "plan@deneme-a.example", ["planlama"], "Deneme Planlama", planP);
  YON = await hesap(A, "yon@deneme-a.example", ["firma_yoneticisi"], "Deneme Yönetici", yonP);
  MUH = await hesap(A, "muh@deneme-a.example", ["muhasebe"], "Deneme Muhasebe", null);
  YON_B = await hesap(B, "yon@deneme-b.example", ["firma_yoneticisi"], "Deneme Yönetici B", bP);
  const m = (await sql(A, "INSERT INTO musteri (unvan, kisa) VALUES ('Deneme Bir A.Ş.', 'Deneme Bir') RETURNING id::text"))!;
  const t = (await sql(A, "INSERT INTO tesis (musteri_id, ad) VALUES ($1, 'Merkez') RETURNING id::text", [m]))!;
  const plan = (no: string) => sahip(`INSERT INTO plan (firma_id, no, tesis_id, baslangic, bitis, durum, firma_adi, acan, kabul, kabul_eden, beyan)
    VALUES ($1, $2, $3, $4, $4, 'kabul', 'Deneme Bir A.Ş.', 'Deneme', now(), 'Deneme', 'Deneme tarafsızlık beyanı metni.') RETURNING id::text`, [A, no, t, BUGUN()]);
  P1 = await plan("P-1026-001"); P2 = await plan("P-1026-002");
  await sahip("INSERT INTO plan_ekip (firma_id, plan_id, personel_id) VALUES ($1, $2, $3) RETURNING id::text", [A, P1, denP]);
});
after(async () => { await havuz?.end(); await kume?.durdur(); rmSync(klasor, { recursive: true, force: true }); });

test("yetki (modül 21): herkes kendi talebini görür; personeli olmayan hesap talep gönderemez; izin onayı yalnız firma yöneticisinde", async () => {
  const v = (await a(DEN, (db) => taleplerim(db, DEN)))!;
  assert.deepEqual([v.izinler, v.masraflar, v.ozet.hak, v.ozet.kalan, v.isler.map((x) => x.no)], [[], [], 14, 14, ["P-1026-001"]], "iş seçeneği: ekibinde olduğu plan");
  assert.equal(await a(MUH, (db) => taleplerim(db, MUH)), null);
  assert.equal((await a(MUH, (db) => izinGonder(db, depo, MUH, A, { tur: "yillik", bas: pazartesi(), bit: pazartesi() }))).durum, "yetkisiz");
  for (const k of [DEN, PLAN, MUH]) assert.equal(await a(k, (db) => izinTalepleri(db, k)), null, k.roller[0]);
  assert.deepEqual(await a(YON, (db) => izinTalepleri(db, YON)), []);
});

let I1: string, I2: string;
test("izin talebi: kendi adına, iş günü sayılır, numara I-AAYY-SIRA; geçersiz aralık / belge reddedilir; veritabanı başkası adına yazdırmaz", async () => {
  const pzt = pazartesi(), cum = gunEkle(pzt, 4);
  const r = tamam(await a(DEN, (db) => izinGonder(db, depo, DEN, A, { tur: "yillik", bas: pzt, bit: cum, aciklama: "Yaz izni" })));
  I1 = r.id;
  assert.match(r.no!, /^I-\d{4}-\d{3}$/);
  assert.equal(r.bildirim, `${r.no} gönderildi: 5 iş günü yıllık izin; yöneticinin onayında.`);
  const v = (await a(DEN, (db) => taleplerim(db, DEN)))!;
  assert.deepEqual([v.izinler[0].gun, v.izinler[0].durum, v.ozet.bekleyen, v.ozet.kullanilan, v.ozet.kalan], [5, "bekliyor", 5, 0, 14]);
  assert.deepEqual(await a(DEN, (db) => izinGonder(db, depo, DEN, A, { tur: "yillik", bas: gunEkle(pzt, 5), bit: gunEkle(pzt, 6) })),
    { durum: "gecersiz", hatalar: { bit: "Seçilen aralıkta iş günü yok." } });
  assert.deepEqual(await a(DEN, (db) => izinGonder(db, depo, DEN, A, { tur: "rapor", bas: pzt, bit: pzt }, { ad: "x.txt", bayt: new TextEncoder().encode("metin") })),
    { durum: "gecersiz", hatalar: { belge: "Belge PDF, JPEG ya da PNG olmalı." } });
  I2 = tamam(await a(DEN, (db) => izinGonder(db, depo, DEN, A, { tur: "rapor", bas: pzt, bit: gunEkle(pzt, 1) }, { ad: "rapor.pdf", bayt: PDF }))).id;
  /* veritabanı: başkası adına izin yazılmaz; kaydeden oturumdan */
  await assert.rejects(sql(A, "INSERT INTO izin_talebi (no, personel_id, tur, bas, bit, gun) VALUES ('I-0001-901', $1, 'mazeret', $2, $2, 1)", [denP, pzt], PLAN.id), /kendi adına/);
  await assert.rejects(sql(A, "INSERT INTO izin_talebi (no, personel_id, tur, bas, bit, gun, durum, karar) VALUES ('I-0001-902', $1, 'mazeret', $2, $2, 1, 'onaylandi', now())", [planP, pzt], PLAN.id),
    /onay bekler/);
  const k = (await sql(A, "SELECT kaydeden::text AS id FROM izin_talebi WHERE id = $1", [I1]))!;
  assert.equal(k, DEN.id);
});

test("izin belgesi ve erişim: talep eden ve firma yöneticisi açar, başkası açamaz; belgeyi yalnız talep eden onay beklerken değiştirir", async () => {
  const x = (await a(DEN, (db) => taleplerim(db, DEN)))!.izinler.find((y) => y.id === I2)!;
  assert.ok(x.belge);
  assert.equal(await a(DEN, (db) => izinDosyasiGorulur(db, DEN, I2)), true);
  assert.equal(await a(YON, (db) => izinDosyasiGorulur(db, YON, I2)), true);
  assert.equal(await a(PLAN, (db) => izinDosyasiGorulur(db, PLAN, I2)), false);
  assert.equal((await a(PLAN, (db) => izinBelgesi(db, depo, PLAN, A, I2, x.surum, "kaldir"))).durum, "yok", "başkasının talebi");
  tamam(await a(DEN, (db) => izinBelgesi(db, depo, DEN, A, I2, x.surum, "kaldir")));
  await assert.rejects(sql(A, "UPDATE izin_talebi SET belge = NULL, aciklama = 'x' WHERE id = $1", [I2], DEN.id), /içeriği değişmez/);
});

test("yönetici kararı: onay (iş günü kalan haktan düşer), gerekçeli red; karar verilmiş talep değişmez ve geri çekilmez; denetçi karar veremez", async () => {
  assert.equal((await a(DEN, (db) => izinOnayla(db, DEN, I1, 0))).durum, "yetkisiz");
  const l = (await a(YON, (db) => izinTalepleri(db, YON)))!;
  assert.deepEqual(l.map((x) => [x.no.slice(0, 2), x.personel, x.durum]), [["I-", "Deneme Denetçi", "bekliyor"], ["I-", "Deneme Denetçi", "bekliyor"]]);
  const x1 = l.find((x) => x.id === I1)!, x2 = l.find((x) => x.id === I2)!;
  assert.deepEqual([x1.ozet.kalan, x1.ozet.bekleyen], [14, 5]);
  const o = tamam(await a(YON, (db) => izinOnayla(db, YON, I1, x1.surum)));
  assert.match(o.bildirim!, /onaylandı: Deneme Denetçi, 5 iş günü yıllık izin/);
  assert.deepEqual(await a(YON, (db) => izinOnayla(db, YON, I1, x1.surum + 1)), { durum: "red", neden: "Bu talep için karar verilmiş." });
  assert.equal((await a(YON, (db) => izinReddet(db, YON, I2, x2.surum, { gerekce: "kısa" }))).durum, "gecersiz");
  const s2 = (await a(YON, (db) => izinTalepleri(db, YON)))!.find((x) => x.id === I2)!.surum;
  tamam(await a(YON, (db) => izinReddet(db, YON, I2, s2, { gerekce: "Yoğun dönem" })));
  /* 341: talep formu (PDF) — talep eden ve firma yöneticisi açar, başkası açamaz; karar ve gerekçe formda */
  const f1 = (await a(DEN, (db) => talepFormuVerisi(db, DEN, "izin", I1)))!;
  assert.deepEqual([f1.tip, f1.durum, f1.personel.ad, f1.personel.meslek, f1.karar?.ad, f1.karar?.sonuc, f1.alanlar.map((x) => x[0])],
    ["izin", "Onaylandı", "Deneme Denetçi", "Makine mühendisi", "Deneme Yönetici", "onaylandi", ["İzin türü", "Başlangıç", "Bitiş", "Süre", "Açıklama", "Ek belge"]]);
  const f2 = (await a(YON, (db) => talepFormuVerisi(db, YON, "izin", I2)))!;
  assert.deepEqual([f2.durum, f2.red, f2.karar?.sonuc], ["Reddedildi", "Yoğun dönem", "reddedildi"]);
  for (const k of [PLAN, MUH]) assert.equal(await a(k, (db) => talepFormuVerisi(db, k, "izin", I1)), null, "başkasının izin formu");
  assert.equal(await a(DEN, (db) => talepFormuVerisi(db, DEN, "baska", I1)), null);
  assert.equal(await a(DEN, (db) => talepFormuVerisi(db, DEN, "masraf", I1)), null, "izin kimliği masraf olarak okunmaz");
  const v = (await a(DEN, (db) => taleplerim(db, DEN)))!;
  const i1 = v.izinler.find((x) => x.id === I1)!, i2 = v.izinler.find((x) => x.id === I2)!;
  assert.deepEqual([i1.durum, i1.kararVeren, i2.durum, i2.red, v.ozet.kullanilan, v.ozet.bekleyen, v.ozet.kalan], ["onaylandi", "Deneme Yönetici", "red", "Yoğun dönem", 5, 0, 9]);
  assert.deepEqual(await a(DEN, (db) => izinGeriCek(db, DEN, I1)), { durum: "red", neden: "Karar verilmiş talep geri çekilmez." });
  await assert.rejects(sql(A, "UPDATE izin_talebi SET durum = 'bekliyor', karar = NULL WHERE id = $1", [I1], YON.id), /karar verilmiş/);
  await assert.rejects(sql(A, "DELETE FROM izin_talebi WHERE id = $1", [I1], DEN.id), /geri çeker/);
});

test("geri çekme: onay bekleyen talebi yalnız talep eden çeker (silinir); başkası çekemez", async () => {
  const r = tamam(await a(DEN, (db) => izinGonder(db, depo, DEN, A, { tur: "mazeret", bas: pazartesi(), bit: pazartesi() })));
  assert.equal((await a(PLAN, (db) => izinGeriCek(db, PLAN, r.id))).durum, "yok");
  await assert.rejects(sql(A, "DELETE FROM izin_talebi WHERE id = $1", [r.id], PLAN.id), /geri çeker/);
  tamam(await a(DEN, (db) => izinGeriCek(db, DEN, r.id)));
  assert.equal((await a(DEN, (db) => taleplerim(db, DEN)))!.izinler.some((x) => x.id === r.id), false);
});

test("masraf formu: muhasebenin gider kaydına onay bekleyen olarak yazılır (kendi adına; iş yalnız ekibinde olduğu plan); muhasebe onaylar; geri çekme ve fiş erişimi", async () => {
  const M = (ek: object = {}) => ({ is: P1, tarih: BUGUN(), tur: "yakit", tutar: "250,00", oran: "20", aciklama: "Yakıt fişi", ...ek });
  assert.deepEqual(await a(DEN, (db) => masrafFormuGonder(db, depo, DEN, A, M({ is: P2 }))), { durum: "gecersiz", hatalar: { is: "İş seçilmeli." } }, "ekibinde olmadığı plan");
  assert.deepEqual(await a(DEN, (db) => masrafFormuGonder(db, depo, DEN, A, M({ tarih: gunEkle(BUGUN(), 1) }))),
    { durum: "gecersiz", hatalar: { tarih: "İleri tarihli masraf gönderilmez." } });
  const r = tamam(await a(DEN, (db) => masrafFormuGonder(db, depo, DEN, A, M(), { ad: "fis.pdf", bayt: PDF })));
  assert.match(r.bildirim!, /muhasebeye gönderildi: 250,00 TL \(KDV dahil\); onaylanınca ödenir\.$/);
  const g = (await a(MUH, (db) => giderListesi(db, MUH)))!.find((x) => x.id === r.id)!;
  assert.deepEqual([g.kaynak, g.durum, g.personel?.ad, g.is?.no, !!g.belge], ["form", "bekliyor", "Deneme Denetçi", "P-1026-001", true]);
  assert.equal(await a(DEN, (db) => giderDosyasiGorulur(db, DEN, r.id)), true, "fişi gönderen açar");
  assert.equal(await a(PLAN, (db) => giderDosyasiGorulur(db, PLAN, r.id)), false);
  assert.equal((await a(PLAN, (db) => masrafFormuGeriCek(db, PLAN, r.id))).durum, "yok", "başkasının formu");
  await assert.rejects(sql(A, "INSERT INTO gider (no, tarih, tur, tutar, oran, kaynak, durum, personel_id) VALUES ('G-0001-960', $1, 'yol', 1, 20, 'form', 'bekliyor', $2)",
    [BUGUN(), denP], PLAN.id), /kendi adına/);
  tamam(await a(MUH, (db) => giderKaydet(db, depo, MUH, A, r.id, g.surum, { tarih: BUGUN(), tur: "yakit", tutar: "250,00", oran: "20", aciklama: "Yakıt fişi", is: P1, personel: denP },
    null, "onaylandi")));
  const v = (await a(DEN, (db) => taleplerim(db, DEN)))!;
  assert.equal(v.masraflar.find((x) => x.id === r.id)!.durum, "onaylandi");
  /* 341: masraf formu (PDF) — talep eden ve Muhasebe açar; planlamacı açamaz; karar (onaylayan) ve tutar formda */
  const mf = (await a(MUH, (db) => talepFormuVerisi(db, MUH, "masraf", r.id)))!;
  assert.deepEqual([mf.tip, mf.durum, mf.personel.ad, mf.karar?.ad, mf.alanlar.find((x) => x[0] === "Tutar (KDV dahil)")?.[1], mf.alanlar.find((x) => x[0] === "İş")?.[1],
    mf.alanlar.find((x) => x[0] === "Fiş")?.[1]], ["masraf", "Onaylandı", "Deneme Denetçi", "Deneme Muhasebe", "250,00 TL", "P-1026-001", "fis.pdf"]);
  assert.ok(await a(DEN, (db) => talepFormuVerisi(db, DEN, "masraf", r.id)));
  assert.equal(await a(PLAN, (db) => talepFormuVerisi(db, PLAN, "masraf", r.id)), null);
  assert.deepEqual(await a(DEN, (db) => masrafFormuGeriCek(db, DEN, r.id)), { durum: "red", neden: "Karar verilmiş masraf formu geri çekilmez." });
  const r2 = tamam(await a(DEN, (db) => masrafFormuGonder(db, depo, DEN, A, M({ is: "", aciklama: "Genel" }))));
  tamam(await a(DEN, (db) => masrafFormuGeriCek(db, DEN, r2.id)));
  assert.equal((await a(MUH, (db) => giderListesi(db, MUH)))!.some((x) => x.id === r2.id), false, "geri çekilen silinir");
});

test("329–332 incelemesi: izin belgesi karar anında değişmez; masraf formunun kişisi değişmez; izin özeti talebin yılıyla", async () => {
  /* belge: yönetici durumla aynı UPDATE'te belgeyi kaldıramaz (0042: denetim ELSIF kolundaydı) */
  const b = tamam(await a(DEN, (db) => izinGonder(db, depo, DEN, A, { tur: "rapor", bas: pazartesi(), bit: pazartesi() }, { ad: "rapor.pdf", bayt: PDF })));
  await assert.rejects(sql(A, "UPDATE izin_talebi SET durum = 'onaylandi', belge = NULL WHERE id = $1", [b.id], YON.id), /yalnız talep eden/);
  /* masraf formu: muhasebe düzenlemesi kişiyi değiştirmez (yok sayılır); veritabanı da reddeder (0043) */
  const r = tamam(await a(DEN, (db) => masrafFormuGonder(db, depo, DEN, A, { is: "", tarih: BUGUN(), tur: "yol", tutar: "40,00", oran: "20", aciklama: "Deneme otopark" })));
  const g = (await a(MUH, (db) => giderListesi(db, MUH)))!.find((x) => x.id === r.id)!;
  tamam(await a(MUH, (db) => giderKaydet(db, depo, MUH, A, r.id, g.surum, { tarih: BUGUN(), tur: "yol", tutar: "40,00", oran: "20", aciklama: "Deneme otopark", is: "", personel: planP })));
  assert.equal((await a(MUH, (db) => giderListesi(db, MUH)))!.find((x) => x.id === r.id)!.personel?.ad, "Deneme Denetçi");
  assert.ok((await a(DEN, (db) => taleplerim(db, DEN)))!.masraflar.some((x) => x.id === r.id), "form gönderenin Talepler'inde kalır");
  await assert.rejects(sql(A, "UPDATE gider SET personel_id = $2 WHERE id = $1", [r.id, planP], MUH.id), /personeli değişmez/);
  /* gelecek yıl başlayan yıllık izin o yılın özetine sayılır */
  const gy = String(Number(BUGUN().slice(0, 4)) + 1);
  let d = `${gy}-01-05`;
  while ([0, 6].includes(new Date(`${d}T12:00:00Z`).getUTCDay())) d = gunEkle(d, 1);
  const y = tamam(await a(DEN, (db) => izinGonder(db, depo, DEN, A, { tur: "yillik", bas: d, bit: d })));
  const v = (await a(DEN, (db) => taleplerim(db, DEN)))!;
  assert.deepEqual([v.gelecekOzet.yil, v.gelecekOzet.bekleyen, v.ozet.bekleyen], [gy, 1, 0]);
  assert.equal((await a(YON, (db) => izinTalepleri(db, YON)))!.find((x) => x.id === y.id)!.ozet.yil, gy);
});

test("firma sızıntısı: B, A'nın izin taleplerini görmez, karar veremez, belgesini açamaz; ham SQL de görmez", async () => {
  assert.deepEqual(await a(YON_B, (db) => izinTalepleri(db, YON_B), B), []);
  assert.equal((await a(YON_B, (db) => izinOnayla(db, YON_B, I1, 0), B)).durum, "yok");
  assert.equal(await a(YON_B, (db) => izinDosyasiGorulur(db, YON_B, I2), B), false);
  assert.deepEqual((await a(YON_B, (db) => taleplerim(db, YON_B), B))!.izinler, []);
  assert.equal(await a(YON_B, (db) => talepFormuVerisi(db, YON_B, "izin", I1), B), null, "talep formu (341)");
  assert.equal(await sql(B, "SELECT count(*)::text AS id FROM izin_talebi"), "0");
});
