/* NEREDEN GELDİ: maket araclar.html (AA4, reisim 2026-10-02: "hangi aracın kimde olduğu belli olsun … elinde araç olanlar sadece kendi aracını
   yöneticiler her aracı kimde olduğunu vs görsün … fotoğraflı zimmet oluşturma olsun zimmetlere otomatik oradan gitsin"; 2026-10-03: "Araç km
   bilgisi haftalık girilebilecek … kullanan kişi yazsın") · KOD-GECIS §3 (plaka eşsiz, km öncekinden küçük olamaz) · §4 (Araçlar: yöneticiler
   değiştirir, planlama görür, denetçi kendi, muhasebe görmez) · reisim 2026-10-04: "rol değiştirme sızma veri çalma". GERÇEK PostgreSQL, iki firma. */
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
import { haftaBasi } from "../src/modules/araclar/sema.ts";
import { aracKaydet, aracKarti, aracListesi, bugunTr, FotoHatasi, kmKaydet, tutanakBelgesiVerisi, tutanakKaydet, tutanakListesi, TutanakPdfHatasi, type Kisi,
  type TutanakPdfUretici } from "../src/modules/araclar/server/araclar.ts";
import type { AracTutanagiVerisi } from "../src/belge/arac.ts";
import { PDF_UYGUNSUZ } from "../src/modules/onaylar/server/belge-baglanti.ts";
import { digerBelgeler } from "../src/modules/onaylar/server/belgeler.ts";
import { personelEkle } from "../src/modules/personel/server/personel.ts";
import { teslimEt, varlikKarti, zimmetListeleri } from "../src/modules/zimmetler/server/zimmet.ts";
import { testKumesi } from "./yardimci/kume.ts";

let kume: GomuluKume;
let havuz: Havuz;
let A: string, B: string;
const klasor = mkdtempSync(join(tmpdir(), "arac-depo-"));
const depo = klasorDepo(klasor);
const kisi = (id: string, ...roller: string[]): Kisi => ({ id, ad: "Deneme", roller: roller as Kisi["roller"] });
let YON: Kisi, PLAN: Kisi, DENETCI: Kisi, IKINCI: Kisi, MUH: Kisi, YON_B: Kisi;
let pDenetci: string, pIkinci: string;
const P = { ad: "Deneme Kişi", eposta: "", imzaTel: "", basla: "2024-02-01", meslek: "elk-muh", meslekMetin: "", diploma: "", oda: "", ekipnet: "" };
const bayt = (...p: (number[] | string)[]) => new Uint8Array(p.flatMap((x) => (typeof x === "string" ? [...Buffer.from(x, "latin1")] : x)));
const seg = (isaret: number, govde: string) => bayt([0xff, isaret, (govde.length + 2) >> 8, (govde.length + 2) & 0xff], govde);
/* uydurma JPEG (tests/dosya.test.ts ile aynı yapı) */
const JPEG = bayt([0xff, 0xd8], [...seg(0xe0, "JFIF\0\x01\x01")], [...seg(0xdb, "\0" + "\x01".repeat(64))], [0xff, 0xda, 0, 2], "goruntu-verisi", [0xff, 0xd9]);
const tamam = <R extends { durum: string }>(r: R) => { assert.equal(r.durum, "tamam", JSON.stringify(r)); return r as Extract<R, { durum: "tamam" }>; };
const ARAC = { plaka: "00 dnm 001", tur: "Hafif ticari araç", marka: "Deneme", model: "Model", yil: "2022", yakit: "dizel", ilkKm: "1.000", bakimKm: "", muayene: "", sigorta: "", kasko: "" };
/* 2026-10-05 (CI 7725142, Türkiye saatiyle 00:3x'te düştü): tutanak bugünün 08:00'ine yazılınca, testin o anki haftalık kilometre kayıtlarından
   "sonra" sayılıp son kilometre olarak seçiliyordu (saat 08:00'den önce koşan CI). Tutanaklar DÜNÜN tarihine yazılır: her zaman geçmişte kalır,
   beklentiler aynı. */
const dun = () => new Date(Date.parse(`${bugunTr()}T00:00:00Z`) - 864e5).toISOString().slice(0, 10);
const T = (arac: string, alan: string, km: string, saat = "10:00", ek: object = {}) => ({ arac, alan, zaman: `${dun()}T${saat}`, km, yakit: "yarim", kontrol: ["ruhsat"], hasar: "", ...ek });

async function hesapli(firma: string, eposta: string, roller: string[], personelId: string | null = null) {
  return (await kiraciIcinde(havuz, firma, (db) => db.sorgu<{ id: string }>(
    "INSERT INTO hesap (eposta, ad, roller, durum, personel_id) VALUES ($1, 'Deneme', $2, 'etkin', $3) RETURNING id::text", [eposta, roller, personelId]))).rows[0].id;
}
const a = <T,>(is: Parameters<typeof kiraciIcinde<T>>[2]) => kiraciIcinde(havuz, A, is);
/* 342: kişiye teslimde tutanağın PDF'i teslim alanın imzasına gider — belgeyi oturumdaki kişi gönderir (hesap kimliği işlemde), PDF üretici verilir.
   Sahte üretici imzalanabilir biçimde en küçük PDF'i döner (gerçek Chromium çıktısı tests/pdf.test.ts'te) ve belge verisini saklar. */
const PDF = new TextEncoder().encode("%PDF-1.4\n1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n"
  + "3 0 obj << /Type /Page /Parent 2 0 R /Contents 4 0 R /Resources << >> >> endobj\n4 0 obj << /Length 19 >> stream\nBT (Tutanak) Tj ET\nendstream\nendobj\n"
  + "trailer << /Root 1 0 R >>\n%%EOF\n");
let sonBelge: AracTutanagiVerisi | null = null;
const SAHTE: TutanakPdfUretici = async (v) => { sonBelge = v; return PDF; };
/* uret null: üretici verilmeden (depoya iade bunu ister; kişiye teslim istemez) */
const tk = (kim: Kisi, firma: string, girdi: object, fotolar: { aci: string; ad: string; bayt: Uint8Array }[] = [], uret: TutanakPdfUretici | null = SAHTE) =>
  kiraciIcinde(havuz, firma, (db) => tutanakKaydet(db, depo, kim, firma, girdi, fotolar, uret ?? undefined), { hesapId: kim.id });
const b = <T,>(is: Parameters<typeof kiraciIcinde<T>>[2]) => kiraciIcinde(havuz, B, is);
let arac: string;

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
  IKINCI = kisi(await hesapli(A, "ikinci@deneme.example", ["denetci"], pIkinci), "denetci");
});
after(async () => { await havuz?.end(); await kume?.durdur(); rmSync(klasor, { recursive: true, force: true }); });

test("araç ekle: plaka biçimi ve eşsizliği (boşluk / harf büyüklüğü fark etmez); yalnız 'değiştirir' düzeyi ekler", async () => {
  arac = tamam(await a((db) => aracKaydet(db, YON, null, 0, ARAC))).id;
  const k = (await a((db) => aracKarti(db, YON, arac)))!;
  assert.deepEqual([k.plaka, k.km, k.kimde, k.kmDurum], ["00 DNM 001", 1000, { tip: "depo" }, "depoda"]);
  assert.deepEqual(await a((db) => aracKaydet(db, YON, null, 0, { ...ARAC, plaka: "00DNM001" })),
    { durum: "gecersiz", hatalar: { plaka: "Bu plaka kayıtlı; aynı plakayla ikinci araç açılmaz." } });
  const g = await a((db) => aracKaydet(db, YON, null, 0, { ...ARAC, plaka: "ABC", yil: "1900", yakit: "su", muayene: "2026-02-30" }));
  assert.deepEqual(g.durum === "gecersiz" && Object.keys(g.hatalar).sort(), ["muayene", "plaka", "yakit", "yil"]);
  assert.deepEqual(await a((db) => aracKaydet(db, PLAN, null, 0, { ...ARAC, plaka: "00 DNM 002" })), { durum: "yetkisiz" });
  assert.deepEqual(await a((db) => aracKaydet(db, DENETCI, null, 0, { ...ARAC, plaka: "00 DNM 002" })), { durum: "yetkisiz" });
  /* veritabanı da tutar: sunucu denetimi atlanırsa aynı plaka (boşluksuz) ikinci kez girmez */
  await assert.rejects(a((db) => db.sorgu("INSERT INTO arac (plaka, tur, marka, model, yil, yakit) VALUES ('00DNM001', 'Kamyon', 'D', 'M', 2020, 'dizel')")), /unique|eşsiz|duplicate/i);
  /* düzenle: sürüm kilidi */
  tamam(await a((db) => aracKaydet(db, YON, arac, k.surum, { ...ARAC, model: "Yeni model", muayene: "2030-01-01" })));
  assert.deepEqual(await a((db) => aracKaydet(db, YON, arac, k.surum, ARAC)), { durum: "cakisma" });
});

test("teslim tutanağı: zimmet hareketi oluşur (Zimmetler'de aynı kayıt), numara AT-AAYY-SIRA, km son bilinenden küçük olamaz; Zimmetler araç teslim etmez", async () => {
  assert.deepEqual(await tk(YON, A, T(arac, pDenetci, "900", "08:00")),
    { durum: "gecersiz", hatalar: { km: "Son bilinen kilometreden (1.000) küçük olamaz." } });
  const r = tamam(await tk(YON, A, T(arac, pDenetci, "1.200", "08:00")));
  assert.match(r.no, /^AT-\d{4}-001$/);
  const k = (await a((db) => aracKarti(db, YON, arac)))!;
  assert.deepEqual([k.kimde, k.km, k.tutanaklar[0].eden, k.tutanaklar[0].kontrol, k.tutanaklar[0].yakit], [{ tip: "kisi", id: pDenetci, ad: "Deneme Denetçi" }, 1200, "Depo", ["ruhsat"], "yarim"]);
  const z = (await a((db) => varlikKarti(db, YON, `a:${arac}`)))!;
  assert.deepEqual([z.tur, z.kod, z.kimde.tip, z.hareketler[0].km], ["a", "00 DNM 001", "kisi", 1200]);
  assert.deepEqual(await a((db) => teslimEt(db, depo, YON, A, { varlik: `a:${arac}`, alan: "depo", zaman: `${bugunTr()}T09:00`, notu: "" })),
    { durum: "gecersiz", hatalar: { varlik: "Varlık seçilmeli." } }, "araç Zimmetler'den teslim edilmez (kilometre ve tutanak gerekir)");
  assert.deepEqual(await tk(YON, A, T(arac, pDenetci, "1.300", "08:30")), { durum: "gecersiz", hatalar: { alan: "Araç zaten bu kişinin zimmetinde." } });
  const g = await tk(YON, A, { arac, alan: "", zaman: "x", km: "", yakit: "", kontrol: ["sahte"], hasar: "" });
  assert.deepEqual(g.durum === "gecersiz" && Object.keys(g.hatalar).sort(), ["alan", "kontrol.0", "km", "yakit", "zaman"].sort());
});

test("tutanak ve hareket DEĞİŞMEZ: uygulama rolü güncelleyemez, silemez", async () => {
  await assert.rejects(a((db) => db.sorgu("UPDATE arac_tutanagi SET hasar = 'sonradan'")), /permission denied|izin/i);
  await assert.rejects(a((db) => db.sorgu("DELETE FROM arac_tutanagi")), /permission denied|izin/i);
  await assert.rejects(a((db) => db.sorgu("DELETE FROM arac")), /permission denied|izin/i);
});

test("haftalık kilometre: aracı kullanan girer, aynı hafta düzeltilir, küçük değer reddedilir, büyük artış uyarılır; başkası giremez", async () => {
  assert.deepEqual(await a((db) => kmKaydet(db, DENETCI, arac, { km: "1.100" })), { durum: "gecersiz", hatalar: { km: "Son bilinen kilometreden (1.200) küçük olamaz." } });
  const r = tamam(await a((db) => kmKaydet(db, DENETCI, arac, { km: "1.500" })));
  assert.deepEqual([r.duzeltildi, r.uyari], [false, null]);
  const d = tamam(await a((db) => kmKaydet(db, DENETCI, arac, { km: "9.000" })));
  assert.deepEqual([d.duzeltildi, d.uyari], [true, "Dikkat: son kayıttan 7.800 km fazla."], "düzeltme kendi haftasının kaydını hariç tutar");
  tamam(await a((db) => kmKaydet(db, DENETCI, arac, { km: "1.400" })));   // aynı hafta düzeltilirken eski değer engel değil
  const k = (await a((db) => aracKarti(db, DENETCI, arac)))!;
  assert.deepEqual([k.kmDurum, k.km, k.buHafta?.km, k.kmGecmisi[0].hafta, k.kmGecmisi[0].giren], ["girildi", 1400, 1400, haftaBasi(bugunTr()), "Deneme Denetçi"]);
  assert.deepEqual(await a((db) => kmKaydet(db, IKINCI, arac, { km: "1.600" })), { durum: "yetkisiz" }, "aracı olmayan denetçi");
  assert.deepEqual(await a((db) => kmKaydet(db, PLAN, arac, { km: "1.600" })), { durum: "yetkisiz" }, "planlama görür, yazamaz");
  tamam(await a((db) => kmKaydet(db, YON, arac, { km: "1.450" })));   // yönetici kullanan adına girer
  assert.equal((await a((db) => aracKarti(db, YON, arac)))!.kmGecmisi[0].giren, "Deneme Denetçi");
});

test("YETKİ: sürücü yalnız kendi aracını ve tutanaklarını görür, yalnız kendi aracını teslim eder; planlama görür; muhasebe görmez", async () => {
  const ikinciArac = tamam(await a((db) => aracKaydet(db, YON, null, 0, { ...ARAC, plaka: "00 DNM 002", ilkKm: "" }))).id;
  tamam(await tk(YON, A, T(ikinciArac, pIkinci, "50", "09:00")));
  const l = (await a((db) => aracListesi(db, DENETCI)))!;
  assert.deepEqual([l.kendi, l.araclar.map((x) => x.plaka)], [true, ["00 DNM 001"]]);
  assert.equal(await a((db) => aracKarti(db, DENETCI, ikinciArac)), null, "başkasının aracı: bulunamadı");
  assert.ok((await a((db) => tutanakListesi(db, DENETCI)))!.every((t) => t.plaka === "00 DNM 001"));
  assert.deepEqual(await tk(DENETCI, A, T(ikinciArac, "depo", "60", "10:00")), { durum: "yetkisiz" });
  assert.deepEqual(await a((db) => aracKaydet(db, PLAN, ikinciArac, 0, ARAC)), { durum: "yetkisiz" });
  assert.equal((await a((db) => aracListesi(db, PLAN)))!.araclar.length, 2);
  assert.deepEqual(await tk(PLAN, A, T(ikinciArac, "depo", "60", "10:00")), { durum: "yetkisiz" });
  assert.equal(await a((db) => aracListesi(db, MUH)), null);
  assert.equal(await a((db) => aracKarti(db, MUH, arac)), null);
  /* sürücü kendi aracını teslim eder (depoya); sonra göremez */
  tamam(await tk(DENETCI, A, T(arac, "depo", "1.500", "11:00")));
  assert.deepEqual((await a((db) => aracListesi(db, DENETCI)))!.araclar, []);
  assert.deepEqual(await a((db) => kmKaydet(db, YON, arac, { km: "1.600" })), { durum: "gecersiz", hatalar: { km: "Araç depoda; haftalık kilometre istenmez." } });
  /* Zimmetler'de sürücü yalnız kendi zimmetini görür: araç artık orada değil */
  assert.ok(!(await a((db) => zimmetListeleri(db, DENETCI)))!.varliklar.some((v) => v.tur === "a"));
});

test("FOTOĞRAF: açı başına bir JPEG / PNG; biri reddedilirse tutanak hiç kaydedilmez; fotoğrafı tutanağı gören açar", async () => {
  const once = (await a((db) => aracKarti(db, YON, arac)))!.tutanaklar.length;
  await assert.rejects(tk(YON, A, T(arac, pDenetci, "1.600", "12:00"), [{ aci: "on", ad: "on.jpg", bayt: JPEG }, { aci: "arka", ad: "x.jpg", bayt: new TextEncoder().encode("%PDF-1.4") }]), FotoHatasi);
  assert.equal((await a((db) => aracKarti(db, YON, arac)))!.tutanaklar.length, once, "tutanak geri alındı");
  assert.deepEqual(await tk(YON, A, T(arac, pDenetci, "1.600", "12:00"), [{ aci: "tavan", ad: "x.jpg", bayt: JPEG }]), { durum: "gecersiz", hatalar: { foto: "Her açıya bir fotoğraf." } });
  tamam(await tk(YON, A, T(arac, pDenetci, "1.600", "12:00"), [{ aci: "on", ad: "IMG_1.JPG", bayt: JPEG }]));
  const f = (await a((db) => aracKarti(db, YON, arac)))!.tutanaklar[0].fotolar;
  assert.deepEqual(f.map((x) => x.aci), ["on"]);
  assert.ok(await a((db) => dosyaIndirilebilir(db, DENETCI, f[0].id, DOSYA_ERISIMI)), "teslim alan sürücü açar");
  assert.ok(await a((db) => dosyaIndirilebilir(db, PLAN, f[0].id, DOSYA_ERISIMI)), "planlama açar");
  assert.equal(await a((db) => dosyaIndirilebilir(db, IKINCI, f[0].id, DOSYA_ERISIMI)), null, "başka sürücü açamaz");
  assert.equal(await a((db) => dosyaIndirilebilir(db, MUH, f[0].id, DOSYA_ERISIMI)), null, "muhasebe açamaz");
  assert.equal(await b((db) => dosyaIndirilebilir(db, YON_B, f[0].id, DOSYA_ERISIMI)), null, "başka firma açamaz");
});

test("342 İMZA: kişiye teslimde tutanağın PDF'i teslim alanın imzasına gider (Onaylar › Diğer, kaynak zimmet hareketi); depoya iadede gitmez", async () => {
  const ucuncu = tamam(await a((db) => aracKaydet(db, YON, null, 0, { ...ARAC, plaka: "00 DNM 003", ilkKm: "" }))).id;
  const r = tamam(await tk(YON, A, T(ucuncu, pDenetci, "10", "06:00", { kontrol: ["ruhsat", "yangin"], hasar: "Sol arka çizik" }), [{ aci: "on", ad: "on.jpg", bayt: JPEG }]));
  const belge = async (kaynak: string) => (await a((db) => db.sorgu<{ tur: string; personel_id: string; durum: string; ad: string; dosya: boolean; gonderen: string }>(
    "SELECT tur, personel_id::text, durum, ad, dosya IS NOT NULL AS dosya, gonderen::text FROM belge_onay WHERE kaynak_id = $1", [kaynak]))).rows;
  assert.deepEqual(await belge(r.id), [{ tur: "arac", personel_id: pDenetci, durum: "bekliyor", ad: `Araç teslim tutanağı · ${r.no} · 00 DNM 003`, dosya: true, gonderen: YON.id }]);
  /* belgenin verisi: tutanağın kendisinden (kişiler, kalemler, açılar) */
  const v = sonBelge!;
  assert.deepEqual([v.no, v.plaka, v.eden, v.alan?.ad, v.km, v.yakit, v.hasar], [r.no, "00 DNM 003", null, "Deneme Denetçi", "10 km", "1/2", "Sol arka çizik"]);
  assert.deepEqual(v.kontrol?.filter(([, x]) => x).map(([k]) => k), ["Ruhsat", "Yangın söndürücü"]);
  assert.deepEqual(v.fotolar.filter(([, x]) => x).map(([k]) => k), ["Ön"]);
  /* teslim alan Onaylar › Diğer'de görür; tutanakta imzanın durumu */
  const d = await kiraciIcinde(havuz, A, (db) => digerBelgeler(db, DENETCI), { hesapId: DENETCI.id });
  assert.ok(d.belgeler.some((x) => x.tur === "arac" && x.durum === "bekliyor"), JSON.stringify(d.belgeler));
  assert.equal((await a((db) => aracKarti(db, YON, ucuncu)))!.tutanaklar[0].imza, "bekliyor");
  /* sürücü kendi aracını başkasına teslim eder: belge yeni teslim alana, gönderen sürücü */
  const r2 = tamam(await tk(DENETCI, A, T(ucuncu, pIkinci, "20", "06:30")));
  assert.deepEqual((await belge(r2.id)).map((x) => [x.personel_id, x.gonderen]), [[pIkinci, DENETCI.id]]);
  assert.deepEqual([sonBelge!.eden?.ad, sonBelge!.alan?.ad], ["Deneme Denetçi", "Deneme İkinci"]);
  /* depoya iade: belge yok */
  const r3 = tamam(await tk(IKINCI, A, T(ucuncu, "depo", "30", "07:00")));
  assert.deepEqual(await belge(r3.id), []);
  assert.equal((await a((db) => aracKarti(db, YON, ucuncu)))!.tutanaklar[0].imza, null);
});

test("342 PDF üretilemezse ya da imzalanabilir değilse tutanak HİÇ kaydedilmez (imzasız teslim kalmaz); üretici verilmeden kişiye teslim olmaz", async () => {
  const dorduncu = tamam(await a((db) => aracKaydet(db, YON, null, 0, { ...ARAC, plaka: "00 DNM 004", ilkKm: "" }))).id;
  const sayi = async () => (await a((db) => db.sorgu<{ n: number }>("SELECT count(*)::int AS n FROM zimmet_hareket WHERE arac_id = $1", [dorduncu]))).rows[0].n;
  await assert.rejects(tk(YON, A, T(dorduncu, pDenetci, "10", "06:00"), [], async () => { throw new Error("motor düştü"); }),
    (h) => h instanceof TutanakPdfHatasi && /üretilemedi/.test(h.message));
  const NESNE_AKISLI = new TextEncoder().encode(new TextDecoder("latin1").decode(PDF).replace("4 0 obj << /Length 19 >>", "4 0 obj << /Type /ObjStm /N 1 /First 4 /Length 19 >>"));
  await assert.rejects(tk(YON, A, T(dorduncu, pDenetci, "10", "06:00"), [], async () => NESNE_AKISLI), (h) => h instanceof TutanakPdfHatasi && h.message === PDF_UYGUNSUZ);
  await assert.rejects(tk(YON, A, T(dorduncu, pDenetci, "10", "06:00"), [], null), /üreticisi verilmedi/);
  assert.equal(await sayi(), 0, "hareket de tutanak da geri alındı");
  assert.deepEqual((await a((db) => aracKarti(db, YON, dorduncu)))!.kimde, { tip: "depo" });
  /* depoya iade üretici istemez */
  tamam(await tk(YON, A, T(dorduncu, pDenetci, "10", "06:00")));
  tamam(await tk(YON, A, T(dorduncu, "depo", "20", "07:00"), [], null));
});

test("342 tutanak belgesini görme: 'gör' her tutanak, sürücü yalnız taraf olduğu; muhasebe ve başka firma göremez; tutanaksız / bozuk kimlik yok", async () => {
  const t = (await a((db) => tutanakListesi(db, YON)))!.find((x) => x.plaka === "00 DNM 003" && x.alan === "Deneme Denetçi")!;
  const gor = (kim: Kisi, firma = A) => kiraciIcinde(havuz, firma, (db) => tutanakBelgesiVerisi(db, kim, t.hareketId));
  assert.equal((await gor(YON))?.no, t.no);
  assert.equal((await gor(PLAN))?.no, t.no, "planlama görür");
  assert.equal((await gor(DENETCI))?.no, t.no, "teslim alan sürücü");
  assert.equal(await gor(IKINCI), null, "taraf olmayan sürücü");
  assert.equal(await gor(MUH), null, "muhasebe Araçlar'ı görmez");
  assert.equal(await gor(YON_B, B), null, "başka firma");
  assert.equal(await a((db) => tutanakBelgesiVerisi(db, YON, "x")), null);
  assert.equal((await a((db) => tutanakBelgesiVerisi(db, YON, t.hareketId)))?.firma.kod, "DA");
});

test("KİRACI: B, A'nın aracını göremez, tutanak / kilometre yazamaz; veritabanı başka firmanın aracına hareket bağlamaz", async () => {
  assert.equal(await b((db) => aracKarti(db, YON_B, arac)), null);
  assert.deepEqual((await b((db) => aracListesi(db, YON_B)))!.araclar, []);
  assert.deepEqual(await tk(YON_B, B, T(arac, "depo", "9.000")), { durum: "gecersiz", hatalar: { arac: "Araç seçilmeli." } });
  assert.deepEqual(await b((db) => kmKaydet(db, YON_B, arac, { km: "9.000" })), { durum: "yok" });
  const pB = tamam(await b((db) => personelEkle(db, YON_B, { ...P, ad: "Deneme B Kişi" }))).id;
  await assert.rejects(b((db) => db.sorgu("INSERT INTO zimmet_hareket (arac_id, alan_personel, zaman) VALUES ($1, $2, now())", [arac, pB])), /foreign key|yabancı anahtar/i);
  await assert.rejects(b((db) => db.sorgu("INSERT INTO arac_km (arac_id, hafta, km) VALUES ($1, $2, 1)", [arac, haftaBasi(bugunTr())])), /foreign key|yabancı anahtar/i);
  await assert.rejects(a((db) => db.sorgu("INSERT INTO zimmet_hareket (arac_id, demirbas_id, zaman) VALUES ($1, NULL, now())", [null])), /check/i);
});

test("340–345 incelemesi: teslim alanın giriş hesabı yoksa tutanak kaydedilir, imzaya gönderilmez (imzaya: false)", async () => {
  const pHesapsiz = tamam(await a((db) => personelEkle(db, YON, { ...P, ad: "Deneme Hesapsız" }))).id;
  const besinci = tamam(await a((db) => aracKaydet(db, YON, null, 0, { ...ARAC, plaka: "00 DNM 005", ilkKm: "" }))).id;
  const r = tamam(await tk(YON, A, T(besinci, pHesapsiz, "10", "06:00"), [], null));
  assert.equal(r.imzaya, false);
  assert.equal((await a((db) => db.sorgu("SELECT 1 FROM belge_onay WHERE kaynak_id = $1", [r.id]))).rowCount, 0);
  assert.equal((await a((db) => aracKarti(db, YON, besinci)))!.tutanaklar[0].imza, null);
});
