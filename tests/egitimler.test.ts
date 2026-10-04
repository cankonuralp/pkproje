/* NEREDEN GELDİ: maket egitimler.html (M16; pkproje §1.1 "personelin ilgili eğitimi ve tekrar süreleri sistem üzerinden takip edilebilecek";
   153 firma eğitim türü ekler / düzenler) · KOD-GECIS §3 (tekrar 1–120 ay, ileri tarihli kayıt yok) · §4 (Eğitimler: yöneticiler değiştirir,
   denetçi kendi, muhasebe görmez) · reisim 2026-10-04: "rol değiştirme sızma veri çalma". GERÇEK PostgreSQL, iki firma. */
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import type { GomuluKume } from "../src/server/db/gomulu.ts";
import { havuzKur, kiraciIcinde, type Havuz } from "../src/server/db/kiraci.ts";
import { klasorDepo } from "../src/server/dosya/depo.ts";
import { dosyaIndirilebilir } from "../src/server/dosya/dosya.ts";
import { DOSYA_ERISIMI } from "../src/server/dosya/erisim.ts";
import { ayEkle } from "../src/modules/egitimler/sema.ts";
import { bugunTr, DosyaHatasi, egitimKaydet, egitimListesi, egitimTuruKaydet, kisininEgitimleri, sertifikaYukle, type Kisi } from "../src/modules/egitimler/server/egitimler.ts";
import { personelEkle } from "../src/modules/personel/server/personel.ts";
import { testKumesi } from "./yardimci/kume.ts";

let kume: GomuluKume;
let havuz: Havuz;
let A: string, B: string;
const klasor = mkdtempSync(join(tmpdir(), "egt-depo-"));
const depo = klasorDepo(klasor);
const kisi = (id: string, ...roller: string[]): Kisi => ({ id, ad: "Deneme", roller: roller as Kisi["roller"] });
let YON: Kisi, DENETCI: Kisi, MUH: Kisi, PLAN: Kisi, YON_B: Kisi;
let pDenetci: string, pIkinci: string, tur: string;
const P = { ad: "Deneme Kişi", eposta: "", imzaTel: "", basla: "2024-02-01", meslek: "elk-muh", meslekMetin: "", diploma: "", oda: "", ekipnet: "" };
const PDF = { ad: "sertifika.pdf", bayt: new TextEncoder().encode("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n") };
const tamam = <R extends { durum: string }>(r: R) => { assert.equal(r.durum, "tamam", JSON.stringify(r)); return r as Extract<R, { durum: "tamam" }>; };
const K = (personel: string, tarih: string, ek: object = {}) => ({ personel, tur, tarih, kurum: "Firma içi", ...ek });

async function hesapli(firma: string, eposta: string, roller: string[], personelId: string | null = null) {
  return (await kiraciIcinde(havuz, firma, (db) => db.sorgu<{ id: string }>(
    "INSERT INTO hesap (eposta, ad, roller, durum, personel_id) VALUES ($1, 'Deneme', $2, 'etkin', $3) RETURNING id::text", [eposta, roller, personelId]))).rows[0].id;
}
const a = <T,>(is: Parameters<typeof kiraciIcinde<T>>[2]) => kiraciIcinde(havuz, A, is);
const b = <T,>(is: Parameters<typeof kiraciIcinde<T>>[2]) => kiraciIcinde(havuz, B, is);

before(async () => {
  kume = await testKumesi();
  havuz = havuzKur(kume.uygulama);
  const s = kume.sahipIstemci(); await s.connect();
  try {
    [A, B] = (await s.query<{ id: string }>(
      "INSERT INTO firma (kisa_ad, ad, rapor_kodu) VALUES ('deneme-a', 'Deneme A', 'DA'), ('deneme-b', 'Deneme B', 'DB') RETURNING id")).rows.map((r) => r.id);
  } finally { await s.end(); }
  YON = kisi(await hesapli(A, "yonetici@deneme.example", ["firma_yoneticisi"]), "firma_yoneticisi");
  PLAN = kisi(await hesapli(A, "planlama@deneme.example", ["planlama"]), "planlama");
  MUH = kisi(await hesapli(A, "muhasebe@deneme.example", ["muhasebe"]), "muhasebe");
  YON_B = kisi(await hesapli(B, "yonetici@deneme-b.example", ["firma_yoneticisi"]), "firma_yoneticisi");
  pDenetci = tamam(await a((db) => personelEkle(db, YON, { ...P, ad: "Deneme Denetçi" }))).id;
  pIkinci = tamam(await a((db) => personelEkle(db, YON, { ...P, ad: "Deneme İkinci" }))).id;
  DENETCI = kisi(await hesapli(A, "denetci@deneme.example", ["denetci"], pDenetci), "denetci");
});
after(async () => { await havuz?.end(); await kume?.durdur(); rmSync(klasor, { recursive: true, force: true }); });

test("ay ekle: ay sonu taşmaz", () => {
  assert.equal(ayEkle("2026-01-31", 1), "2026-02-28");
  assert.equal(ayEkle("2024-02-29", 12), "2025-02-28");
  assert.equal(ayEkle("2026-10-04", 36), "2029-10-04");
});

test("eğitim türü: ad eşsiz (büyük / küçük harf), tekrar 1–120 ay; yalnız 'değiştirir'", async () => {
  tur = tamam(await a((db) => egitimTuruKaydet(db, YON, null, 0, { ad: "Yüksekte çalışma eğitimi", tekrar: "12" }))).id;
  assert.deepEqual(await a((db) => egitimTuruKaydet(db, YON, null, 0, { ad: "YÜKSEKTE ÇALIŞMA EĞİTİMİ", tekrar: "12" })), { durum: "gecersiz", hatalar: { ad: "Bu adla bir eğitim türü var." } });
  assert.deepEqual(await a((db) => egitimTuruKaydet(db, YON, null, 0, { ad: "X", tekrar: "200" })), { durum: "gecersiz", hatalar: { ad: "Eğitim adı yazılmalı.", tekrar: "1–120 ay." } });
  assert.deepEqual(await a((db) => egitimTuruKaydet(db, DENETCI, null, 0, { ad: "Deneme", tekrar: "12" })), { durum: "yetkisiz" });
});

test("kayıt: tekrar = tarih + süre; ileri tarih reddedilir; tekrarı kaydedince eskisi önceki; eski tarihli tekrar reddedilir; tür süresi değişse geçmiş kayıt değişmez", async () => {
  const ileri = ayEkle(bugunTr(), 1);
  assert.deepEqual(await a((db) => egitimKaydet(db, depo, YON, A, K(pDenetci, ileri))), { durum: "gecersiz", hatalar: { tarih: "Eğitim tarihi bugünden ileri olamaz." } });
  tamam(await a((db) => egitimKaydet(db, depo, YON, A, K(pDenetci, "2025-03-10"))));
  let l = (await a((db) => egitimListesi(db, YON)))!;
  assert.deepEqual(l.kayitlar.map((x) => [x.tarih, x.tekrar, x.durum, x.onceki]), [["2025-03-10", "2026-03-10", "gecti", false]]);
  assert.deepEqual(await a((db) => egitimKaydet(db, depo, YON, A, K(pDenetci, "2025-01-01"))), { durum: "gecersiz", hatalar: { tarih: "Güncel kayıttan (aynı eğitim) sonraki bir tarih olmalı." } });
  const t = l.turler[0];
  tamam(await a((db) => egitimTuruKaydet(db, YON, tur, t.surum, { ad: t.ad, tekrar: "24" })));
  tamam(await a((db) => egitimKaydet(db, depo, YON, A, K(pDenetci, bugunTr()), PDF)));
  l = (await a((db) => egitimListesi(db, YON)))!;
  assert.deepEqual(l.kayitlar.map((x) => [x.tekrar, x.onceki]), [[ayEkle(bugunTr(), 24), false], ["2026-03-10", true]]);
  await assert.rejects(a((db) => egitimKaydet(db, depo, YON, A, K(pIkinci, "2025-05-05"), { ad: "x.pdf", bayt: new TextEncoder().encode("metin") })), DosyaHatasi);
  assert.equal((await a((db) => egitimListesi(db, YON)))!.kayitlar.length, 2, "sertifika reddinde kayıt yazılmadı");
  const g = await a((db) => egitimKaydet(db, depo, YON, A, { personel: "", tur: "", tarih: "2026-02-30", kurum: "Kahve" }));
  assert.deepEqual(g.durum === "gecersiz" && Object.keys(g.hatalar).sort(), ["kurum", "personel", "tarih", "tur"]);
  /* veritabanı da tutar: aynı kişi × eğitimde ikinci güncel kayıt girmez; silme yok */
  await assert.rejects(a((db) => db.sorgu("INSERT INTO egitim_kaydi (personel_id, tur_id, tarih, tekrar, kurum) VALUES ($1, $2, '2024-01-01', '2025-01-01', 'Firma içi')", [pDenetci, tur])), /unique|duplicate|eşsiz/i);
  await assert.rejects(a((db) => db.sorgu("DELETE FROM egitim_kaydi")), /permission denied|izin/i);
});

test("YETKİ: denetçi yalnız kendi kayıtlarını ve sertifikasını görür, ekleyemez; planlama görür, yazamaz; muhasebe görmez", async () => {
  assert.deepEqual(await a((db) => egitimKaydet(db, depo, PLAN, A, K(pIkinci, "2025-06-01"), PDF)), { durum: "yetkisiz" });
  assert.ok((await a((db) => egitimListesi(db, PLAN)))!.kayitlar.length > 0, "planlama görür");
  tamam(await a((db) => egitimKaydet(db, depo, YON, A, K(pIkinci, "2025-06-01"), PDF)));
  const k = (await a((db) => egitimListesi(db, DENETCI)))!;
  assert.ok(k.kayitlar.length > 0 && k.kayitlar.every((x) => x.personelId === pDenetci), "yalnız kendi");
  assert.deepEqual(k.kisiler, []);
  const tumu = (await a((db) => egitimListesi(db, YON)))!.kayitlar;
  const kendiSertifika = tumu.find((x) => x.personelId === pDenetci && x.dosyaId)!.dosyaId!;
  const baskaSertifika = tumu.find((x) => x.personelId === pIkinci && x.dosyaId)!.dosyaId!;
  assert.ok(await a((db) => dosyaIndirilebilir(db, DENETCI, kendiSertifika, DOSYA_ERISIMI)));
  assert.equal(await a((db) => dosyaIndirilebilir(db, DENETCI, baskaSertifika, DOSYA_ERISIMI)), null);
  assert.equal(await a((db) => dosyaIndirilebilir(db, MUH, kendiSertifika, DOSYA_ERISIMI)), null);
  assert.equal(await a((db) => kisininEgitimleri(db, DENETCI, pIkinci)), null);
  assert.equal((await a((db) => kisininEgitimleri(db, DENETCI, pDenetci)))!.length, 1);
  assert.deepEqual(await a((db) => egitimKaydet(db, depo, DENETCI, A, K(pDenetci, "2025-01-01"))), { durum: "yetkisiz" });
  const x = tumu.find((y) => y.personelId === pIkinci)!;
  assert.deepEqual(await a((db) => sertifikaYukle(db, depo, DENETCI, A, x.id, x.surum, null)), { durum: "yetkisiz" });
  tamam(await a((db) => sertifikaYukle(db, depo, YON, A, x.id, x.surum, null)));
  assert.equal(await a((db) => egitimListesi(db, MUH)), null);
});

test("KİRACI: B, A'nın kaydını ve sertifikasını göremez; veritabanı başka firmanın personeline / türüne bağlamaz", async () => {
  const sertifika = (await a((db) => egitimListesi(db, YON)))!.kayitlar.find((x) => x.dosyaId)!.dosyaId!;
  assert.deepEqual((await b((db) => egitimListesi(db, YON_B)))!.kayitlar, []);
  assert.equal(await b((db) => dosyaIndirilebilir(db, YON_B, sertifika, DOSYA_ERISIMI)), null);
  assert.deepEqual(await b((db) => egitimKaydet(db, depo, YON_B, B, K(pDenetci, "2025-01-01"))), { durum: "gecersiz", hatalar: { personel: "Personel seçilmeli." } });
  const pB = tamam(await b((db) => personelEkle(db, YON_B, { ...P, ad: "Deneme B" }))).id;
  await assert.rejects(b((db) => db.sorgu("INSERT INTO egitim_kaydi (personel_id, tur_id, tarih, tekrar, kurum) VALUES ($1, $2, '2025-01-01', '2026-01-01', 'Firma içi')", [pB, tur])), /foreign key|yabancı anahtar/i);
});
