/* NEREDEN GELDİ: maket personel.html (M1, onaylı 2026-09-25) · karar 33 (hesap personele bağlı), 39 (zorunlu yalnız ad, işe başlama, meslek; eksik
   bilgi uyarı), 43 (ayrılan silinmez) · ENGEL 8 (ayrılana hesap açılmaz) · KOD-GECIS §4 (Personel: planlama görür, denetçi kendi, yönetici
   değiştirir, muhasebe görmez) · reisim 2026-10-04: "rol değiştirme sızma veri çalma gibi şeylere dikkat et". GERÇEK PostgreSQL, iki firma. */
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { GomuluKume } from "../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz } from "../src/server/db/kiraci.ts";
import { eksikBilgi, personelAyrildi, personelEkle, personelGuncelle, personelKarti, personelListesi, type Kisi } from "../src/modules/personel/server/personel.ts";
import { testKumesi } from "./yardimci/kume.ts";

let kume: GomuluKume;
let havuz: Havuz;
let A: string, B: string;
const kisi = (id: string, ...roller: string[]): Kisi => ({ id, ad: "Deneme", roller: roller as Kisi["roller"] });
let YON: Kisi, PLAN: Kisi, DENETCI: Kisi, MUH: Kisi;
let denetciPersonel: string;
const GIRDI = { ad: "Deneme Kişi", eposta: "", imzaTel: "", basla: "2024-02-01", meslek: "mak-muh", meslekMetin: "", diploma: "", oda: "", ekipnet: "" };

async function hesapli(firma: string, eposta: string, roller: string[], personelId: string | null) {
  return (await kiraciIcinde(havuz, firma, (db) => db.sorgu<{ id: string }>(
    "INSERT INTO hesap (eposta, ad, roller, durum, personel_id) VALUES ($1, 'Deneme', $2, 'etkin', $3) RETURNING id::text", [eposta, roller, personelId]))).rows[0].id;
}

before(async () => {
  kume = await testKumesi();
  havuz = havuzKur(kume.uygulama);
  const s = kume.sahipIstemci(); await s.connect();
  try {
    [A, B] = (await s.query<{ id: string }>(
      "INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-a', 'Deneme A', 'DA'), ('deneme-b', 'Deneme B', 'DB') RETURNING id")).rows.map((r) => r.id);
  } finally { await s.end(); }
  YON = kisi(await hesapli(A, "yonetici@deneme.example", ["firma_yoneticisi"], null), "firma_yoneticisi");
  PLAN = kisi(await hesapli(A, "planlama@deneme.example", ["planlama"], null), "planlama");
  MUH = kisi(await hesapli(A, "muhasebe@deneme.example", ["muhasebe"], null), "muhasebe");
  const p = await kiraciIcinde(havuz, A, (db) => personelEkle(db, YON, { ...GIRDI, ad: "Deneme Denetçi", eposta: "denetci@deneme.example" }));
  assert.equal(p.durum, "tamam");
  denetciPersonel = p.durum === "tamam" ? p.id : "";
  DENETCI = kisi(await hesapli(A, "denetci@deneme.example", ["denetci"], denetciPersonel), "denetci");
});
after(async () => { await havuz?.end(); await kume?.durdur(); });

test("ekle: zorunlu ad (ad + soyad), işe başlama, meslek; maketle aynı iletiler; 'Diğer meslek' adı ister", async () => {
  const r = await kiraciIcinde(havuz, A, (db) => personelEkle(db, YON, { ...GIRDI, ad: "Tek", basla: "2024-02-30", meslek: "", imzaTel: "12345", eposta: "x@" }));
  assert.equal(r.durum, "gecersiz");
  if (r.durum === "gecersiz") assert.deepEqual(r.hatalar, {
    ad: "Ad ve soyad yazılmalı.", basla: "Takvimde olmayan bir gün.", meslek: "Meslek seçilmeli.", imzaTel: "05XX XXX XX XX biçiminde yazılmalı.", eposta: "E-posta biçimi geçersiz.",
  });
  const d = await kiraciIcinde(havuz, A, (db) => personelEkle(db, YON, { ...GIRDI, meslek: "diger" }));
  assert.equal(d.durum === "gecersiz" && d.hatalar.meslekMetin, "Meslek adı yazılmalı.");
  const t = await kiraciIcinde(havuz, A, (db) => personelEkle(db, YON, { ...GIRDI, ad: "Deneme  Teknik ", imzaTel: "0532 123 45 67", meslek: "teknisyen" }));
  assert.equal(t.durum, "tamam");
});

test("YETKİ: yönetici ekler / değiştirir; planlama görür ama değiştiremez; muhasebe göremez; denetçi yalnız kendi kartını görür, düzenleyemez", async () => {
  const yeni = await kiraciIcinde(havuz, A, (db) => personelEkle(db, YON, { ...GIRDI, ad: "Deneme Planlı" }));
  assert.equal(yeni.durum, "tamam");
  const id = yeni.durum === "tamam" ? yeni.id : "";
  assert.deepEqual(await kiraciIcinde(havuz, A, (db) => personelEkle(db, PLAN, GIRDI)), { durum: "yetkisiz" });
  assert.deepEqual(await kiraciIcinde(havuz, A, (db) => personelGuncelle(db, PLAN, id, 0, GIRDI)), { durum: "yetkisiz" });
  assert.ok((await kiraciIcinde(havuz, A, (db) => personelListesi(db, PLAN)))!.length >= 2);
  assert.equal(await kiraciIcinde(havuz, A, (db) => personelListesi(db, MUH)), null);
  assert.equal(await kiraciIcinde(havuz, A, (db) => personelKarti(db, MUH, id)), null);
  const kendi = await kiraciIcinde(havuz, A, (db) => personelListesi(db, DENETCI));
  assert.deepEqual(kendi!.map((x) => x.id), [denetciPersonel], "denetçi yalnız kendisini görür");
  assert.equal(await kiraciIcinde(havuz, A, (db) => personelKarti(db, DENETCI, id)), null, "başkasının kartı yok");
  assert.equal((await kiraciIcinde(havuz, A, (db) => personelKarti(db, DENETCI, denetciPersonel)))?.ad, "Deneme Denetçi");
  assert.deepEqual(await kiraciIcinde(havuz, A, (db) => personelGuncelle(db, DENETCI, denetciPersonel, 0, { ...GIRDI, ad: "Kendi Değiştirdi" })), { durum: "yetkisiz" });
  /* rolsüz / tanımsız rol hiçbir şey görmez */
  assert.equal(await kiraciIcinde(havuz, A, (db) => personelListesi(db, kisi(YON.id, "tanri"))), null);
});

test("KİRACI: başka firmanın personeli görünmez, değiştirilemez ('yok'); B'nin listesi ayrı", async () => {
  const bYon = kisi(await hesapli(B, "yonetici@deneme.example", ["firma_yoneticisi"], null), "firma_yoneticisi");
  const b = await kiraciIcinde(havuz, B, (db) => personelEkle(db, bYon, { ...GIRDI, ad: "Başka Firmalı" }));
  assert.equal(b.durum, "tamam");
  const bId = b.durum === "tamam" ? b.id : "";
  assert.equal(await kiraciIcinde(havuz, A, (db) => personelKarti(db, YON, bId)), null);
  assert.deepEqual(await kiraciIcinde(havuz, A, (db) => personelGuncelle(db, YON, bId, 0, GIRDI)), { durum: "yok" });
  assert.ok(!(await kiraciIcinde(havuz, A, (db) => personelListesi(db, YON)))!.some((x) => x.id === bId));
});

test("güncelle: sürüm kilidi; e-posta başka kişide → alan hatası; personel e-postası değişince giriş e-postası da değişir", async () => {
  const k = await kiraciIcinde(havuz, A, (db) => personelKarti(db, YON, denetciPersonel));
  assert.ok(k);
  const r = await kiraciIcinde(havuz, A, (db) => personelGuncelle(db, YON, denetciPersonel, k!.surum, { ...GIRDI, ad: k!.ad, eposta: "yeni-denetci@deneme.example", ekipnet: "123456" }));
  assert.equal(r.durum, "tamam");
  const h = await kiraciIcinde(havuz, A, (db) => db.sorgu<{ eposta: string }>("SELECT eposta FROM hesap WHERE personel_id = $1", [denetciPersonel]));
  assert.equal(h.rows[0].eposta, "yeni-denetci@deneme.example");
  assert.deepEqual(await kiraciIcinde(havuz, A, (db) => personelGuncelle(db, YON, denetciPersonel, k!.surum, { ...GIRDI, ad: "Eski Sürüm" })), { durum: "cakisma" });
  const ikinci = await kiraciIcinde(havuz, A, (db) => personelEkle(db, YON, { ...GIRDI, ad: "Aynı Postalı", eposta: "yeni-denetci@deneme.example" }));
  assert.deepEqual(ikinci, { durum: "gecersiz", hatalar: { eposta: "Bu e-posta başka bir personelde kayıtlı." } });
});

test("eksik bilgi yalnız denetçide ve UYARI: EKİPNET boş, meslek yetkili değil (teknisyen)", () => {
  assert.deepEqual(eksikBilgi({ ekipnet: null, meslek: "teknisyen", hesap: { durum: "etkin", roller: ["denetci"] } }), ["EKİPNET kayıt no boş", "Meslek yetkili kişi meslekleri arasında değil"]);
  assert.deepEqual(eksikBilgi({ ekipnet: null, meslek: "teknisyen", hesap: { durum: "etkin", roller: ["planlama"] } }), []);
  assert.deepEqual(eksikBilgi({ ekipnet: "1", meslek: "elk-muh", hesap: { durum: "etkin", roller: ["denetci"] } }), []);
});

test("ayrıldı: silinmez; tarih işe başlamadan önce olamaz; hesabı kapanır ve açık oturumu düşer", async () => {
  const k = (await kiraciIcinde(havuz, A, (db) => personelKarti(db, YON, denetciPersonel)))!;
  await kiraciIcinde(havuz, A, (db) => db.sorgu("INSERT INTO oturum (ozet, hesap_id, bitis) VALUES ($1, $2, now() + interval '1 day')", ["a".repeat(64), DENETCI.id]));
  assert.deepEqual(await kiraciIcinde(havuz, A, (db) => personelAyrildi(db, YON, denetciPersonel, k.surum, "2020-01-01")), { durum: "gecersiz", hatalar: { ayrildi: "Ayrılış işe başlamadan önce olamaz." } });
  assert.equal((await kiraciIcinde(havuz, A, (db) => personelAyrildi(db, YON, denetciPersonel, k.surum, "2026-09-30"))).durum, "tamam");
  const s = await kiraciIcinde(havuz, A, (db) => db.sorgu<{ durum: string; oturum: number }>(
    "SELECT h.durum, (SELECT count(*)::int FROM oturum o WHERE o.hesap_id = h.id) AS oturum FROM hesap h WHERE h.personel_id = $1", [denetciPersonel]));
  assert.deepEqual(s.rows[0], { durum: "pasif", oturum: 0 });
  assert.equal((await kiraciIcinde(havuz, A, (db) => personelKarti(db, YON, denetciPersonel)))?.durum, "ayrildi");
  await assert.rejects(kiraciIcinde(havuz, A, (db) => db.sorgu("DELETE FROM personel")), /permission denied/);
});
