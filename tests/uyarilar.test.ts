/* NEREDEN GELDİ: maket uyarilar.html M10 (maket-veri.js MV.uyarilar: kalibrasyon, eğitim tekrarı, araç belgesi; kimde; eşikler firma ayarı) ·
   pkproje §3 "kalibrasyon bitişine 30 gün kala uyarı" · anayasa 1.3 (yalnız ekranda) · KOD-GECIS §3 "tablo yok — koşuldan türetilir; okundu yok",
   §4 Uyarılar (planlama, branş yöneticileri, firma yöneticisi görür; denetçi kendi; muhasebe —) · reisim 2026-10-04: "rol değiştirme, sızma".
   GERÇEK PostgreSQL, iki firma (331). Kayıtlar süper kullanıcıyla, tetiksiz kurulur (ölçülen şey türetme ve görünürlük). */
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { GomuluKume } from "../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz, type Sorgulayici } from "../src/server/db/kiraci.ts";
import { gunEkle } from "../src/modules/muhasebe/sema.ts";
import { bugunTr, uyariListesi } from "../src/modules/uyarilar/server/uyarilar.ts";
import type { YetkiHesabi } from "../src/server/yetki/canDo.ts";
import { testKumesi } from "./yardimci/kume.ts";

let kume: GomuluKume;
let havuz: Havuz;
let A: string, B: string;
let YON: YetkiHesabi, PLAN: YetkiHesabi, MEK: YetkiHesabi, MUH: YetkiHesabi, DEN: YetkiHesabi, YON_B: YetkiHesabi;
let denP: string, digerP: string;
const a = <T,>(k: YetkiHesabi, is: (db: Sorgulayici) => Promise<T>, firma = A) => kiraciIcinde(havuz, firma, is, { hesapId: k.id });
async function sahip(metin: string, p: unknown[] = []): Promise<string> {
  const s = kume.sahipIstemci(); await s.connect();
  try { await s.query("SET session_replication_role = replica"); return (await s.query<{ id: string }>(metin, p)).rows[0]?.id; } finally { await s.end(); }
}
const BUGUN = () => bugunTr();
const g = (n: number) => gunEkle(BUGUN(), n);
async function hesap(firma: string, eposta: string, roller: string[], personel: string | null = null): Promise<YetkiHesabi> {
  const id = await sahip("INSERT INTO hesap (firma_id, eposta, ad, roller, durum, personel_id) VALUES ($1, $2, 'Deneme', $3, 'etkin', $4) RETURNING id::text", [firma, eposta, roller, personel]);
  return { id, roller: roller as YetkiHesabi["roller"] };
}

before(async () => {
  kume = await testKumesi();
  havuz = havuzKur(kume.uygulama);
  [A, B] = [await sahip("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-a', 'Deneme A', 'DA') RETURNING id::text"),
    await sahip("INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-b', 'Deneme B', 'DB') RETURNING id::text")];
  const per = (ad: string) => sahip("INSERT INTO personel (firma_id, ad, basla, meslek) VALUES ($1, $2, '2024-01-01', 'mak-muh') RETURNING id::text", [A, ad]);
  denP = await per("Deneme Denetçi"); digerP = await per("Deneme Öteki");
  DEN = await hesap(A, "den@deneme-a.example", ["denetci"], denP);
  YON = await hesap(A, "yon@deneme-a.example", ["firma_yoneticisi"]);
  PLAN = await hesap(A, "plan@deneme-a.example", ["planlama"]);
  MEK = await hesap(A, "mek@deneme-a.example", ["mekanik_yonetici"]);
  MUH = await hesap(A, "muh@deneme-a.example", ["muhasebe"]);
  YON_B = await hesap(B, "yon@deneme-b.example", ["firma_yoneticisi"]);
  /* ölçüm cihazları: geçti (denetçide) · yaklaşıyor (depoda) · geçerli · kalibrasyonda (lab) · hiç kalibrasyonu yok · pasif */
  const tur = await sahip("INSERT INTO cihaz_turu (firma_id, ad) VALUES ($1, 'Manometre') RETURNING id::text", [A]);
  const cihaz = async (kod: string, bitis: string | null, ek = "") => {
    const id = await sahip(`INSERT INTO olcum_cihazi (firma_id, kod, tur_id${ek ? ", " + ek.split("=")[0] : ""}) VALUES ($1, $2, $3${ek ? ", " + ek.split("=")[1] : ""}) RETURNING id::text`, [A, kod, tur]);
    if (bitis) await sahip("INSERT INTO kalibrasyon (firma_id, cihaz_id, tarih, bitis, lab, sertifika, sonuc) VALUES ($1, $2, $3, $4, 'Deneme Lab', 'S-1', 'uygun') RETURNING id::text",
      [A, id, gunEkle(bitis, -365), bitis]);
    return id;
  };
  const c1 = await cihaz("MN-01", g(-5)); await cihaz("MN-02", g(10)); await cihaz("MN-03", g(100)); await cihaz("MN-04", g(-5), "konum='lab'");
  await cihaz("MN-05", null); await cihaz("MN-06", g(-5), "pasif=current_date");
  await sahip("INSERT INTO zimmet_hareket (firma_id, cihaz_id, alan_personel, zaman) VALUES ($1, $2, $3, now()) RETURNING id::text", [A, c1, denP]);
  /* eğitim: denetçinin tekrarı geçmiş, ötekinin yaklaşan, ötekinin önceki (sayılmaz) */
  const et = await sahip("INSERT INTO egitim_turu (firma_id, ad, tekrar_ay) VALUES ($1, 'Yüksekte çalışma', 12) RETURNING id::text", [A]);
  const egitim = (p: string, tekrar: string, onceki = false) => sahip(`INSERT INTO egitim_kaydi (firma_id, personel_id, tur_id, tarih, tekrar, kurum, onceki)
    VALUES ($1, $2, $3, $4, $5, 'Firma içi', $6) RETURNING id::text`, [A, p, et, gunEkle(tekrar, -365), tekrar, onceki]);
  await egitim(denP, g(-1)); await egitim(digerP, g(20)); await egitim(digerP, g(-100), true);
  /* araç: muayene geçmiş, kasko yaklaşan, sigorta geçerli */
  await sahip(`INSERT INTO arac (firma_id, plaka, tur, marka, model, yil, yakit, muayene, sigorta, kasko) VALUES ($1, '34 ABC 123', 'Binek araç', 'Deneme', 'Model', 2022,
    'dizel', $2, $3, $4) RETURNING id::text`, [A, g(-2), g(200), g(15)]);
});
after(async () => { await havuz?.end(); await kume?.durdur(); });

test("uyarılar kayıtlardan türetilir: kalibrasyon (geçti / eşik içinde; kalibrasyondaki, pasif ve geçerli cihaz yok), eğitim tekrarı (önceki kayıt yok), araç belgesi; en yakın tarih üstte; kimde", async () => {
  const l = (await a(YON, (db) => uyariListesi(db, YON)))!;
  /* 2026-10-06 (329–332 incelemesi): kalibrasyonu hiç olmayan cihazın uydurma "bugün" tarihi kalktı — tarihsiz, en üstte */
  assert.deepEqual(l.map((u) => [u.tur, u.konu, u.alt, u.durum, u.kisi?.ad ?? null]), [
    ["kal", "MN-05 · Manometre", "Kalibrasyon", "gecti", null],
    ["kal", "MN-01 · Manometre", "Kalibrasyon", "gecti", "Deneme Denetçi"],
    ["arac", "34 ABC 123 · Deneme Model", "Muayene", "gecti", null],
    ["egt", "Yüksekte çalışma", "Eğitim tekrarı", "gecti", "Deneme Denetçi"],
    ["kal", "MN-02 · Manometre", "Kalibrasyon", "yakin", null],
    ["arac", "34 ABC 123 · Deneme Model", "Kasko", "yakin", null],
    ["egt", "Yüksekte çalışma", "Eğitim tekrarı", "yakin", "Deneme Öteki"],
  ]);
  const k1 = l.find((u) => u.konu.startsWith("MN-01"))!, k5 = l.find((u) => u.konu.startsWith("MN-05"))!, k2 = l.find((u) => u.konu.startsWith("MN-02"))!;
  assert.deepEqual([k1.sonuc, k5.sonuc, k5.tarih, k2.sonuc], ["Deneme Denetçi raporlarını onaya gönderemez", "geçerli kalibrasyon yok", null, "30 gün içinde bitiyor"]);
  assert.match(k1.href, /^\/olcum-cihazlari\/[0-9a-f-]{36}$/);
  /* eğitim uyarısı Eğitimler'i o kişiyle süzülü açar (maket ?kisi=) */
  assert.equal(l.find((u) => u.tur === "egt" && u.durum === "gecti")!.href, `/dokumanlar/egitimler?kisi=${denP}`);
});

test("yetki (modül 20): planlama, branş yöneticisi ve firma yöneticisi hepsini; denetçi yalnız kendisininkileri; muhasebe göremez; firma eşiği uygulanır", async () => {
  for (const k of [PLAN, MEK]) assert.equal((await a(k, (db) => uyariListesi(db, k)))!.length, 7, k.roller[0]);
  assert.deepEqual((await a(DEN, (db) => uyariListesi(db, DEN)))!.map((u) => u.konu), ["MN-01 · Manometre", "Yüksekte çalışma"]);
  assert.equal(await a(MUH, (db) => uyariListesi(db, MUH)), null);
  await sahip(`INSERT INTO firma_ayar (firma_id, bolum, deger) VALUES ($1, 'uyari_esikleri', '{"kalibrasyon": 5, "egitim": 10, "kontrolu_yaklasan_tesis": 30, "plan_kontrolu_geliyor": 30}')
    RETURNING id::text`, [A]);
  const l = (await a(YON, (db) => uyariListesi(db, YON)))!;
  assert.deepEqual(l.filter((u) => u.durum === "yakin").map((u) => u.konu), [], "eşik daralınca yaklaşan yok");
});

test("329–332 incelemesi: 'branşı' düzeyi (uyarının branşı yok) kısıtlı yönde — yalnız kendisininkiler; ayrılan personelin eğitim tekrarı uyarı değil", async () => {
  const BRANS = { ...MUH, matris: { 20: ["gor", "kendi", "gor", "gor", "gor", "brans"] } } as YetkiHesabi;
  assert.deepEqual((await a(BRANS, (db) => uyariListesi(db, BRANS)))!, [], "muhasebenin personeli yok — hiçbir uyarı");
  const DEN_B = { ...DEN, matris: { 20: ["gor", "brans", "gor", "gor", "gor", "yok"] } } as YetkiHesabi;
  assert.deepEqual((await a(DEN_B, (db) => uyariListesi(db, DEN_B)))!.map((u) => u.konu), ["MN-01 · Manometre", "Yüksekte çalışma"]);
  /* ötekinin güncel eğitiminin tekrarı geçti → uyarı; kişi ayrılınca düşer */
  await sahip("UPDATE egitim_kaydi SET tekrar = current_date - 3 WHERE personel_id = $1 AND NOT onceki RETURNING id::text", [digerP]);
  const egt = async () => (await a(YON, (db) => uyariListesi(db, YON)))!.filter((u) => u.tur === "egt").map((u) => u.kisi?.ad);
  assert.deepEqual(await egt(), ["Deneme Öteki", "Deneme Denetçi"]);
  await sahip("UPDATE personel SET durum = 'ayrildi', ayrildi = current_date WHERE id = $1 RETURNING id::text", [digerP]);
  assert.deepEqual(await egt(), ["Deneme Denetçi"]);
});

test("firma sızıntısı: B, A'nın uyarılarını görmez", async () => {
  assert.deepEqual(await a(YON_B, (db) => uyariListesi(db, YON_B), B), []);
});
