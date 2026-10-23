/* NEREDEN GELDİ: 2026-10-23 (görev 135) — probata-sign'ın 2026-10-18 denetiminde bulunan YÜKSEK hata probata'da da vardı: src/server/imza/pdf-imzalar.ts
   iptalBul DSS'teki İLK sağlam OCSP / iptal listesi kanıtında durup onun durumunu dönüyordu; kanıtın ZAMANI imza anıyla hiç karşılaştırılmıyordu.
   Sonuç: imzadan aylar önceki "geçerli" OCSP cevabı ya da süresi imzadan önce biten iptal listesi iptal edilmiş sertifikayı "geçerli" gösteriyordu;
   aynı DSS'teki iptal listesinin "iptal" kararı ilk sağlam OCSP cevabıyla eziliyordu. Yükleme kapısı (src/server/imza/yukleme.ts ekImzaNedeni)
   iptal durumuna bakmıyordu (2026-10-18'de öteki oturum i.iptal === "iptal" reddini ekledi; o karar da ilk kanıtın, zamansız). Kaynak düzeltme probata-sign
   src/imza/iptal.ts iptalKarari + src/imza/pdf-imzalar.ts iptalKanitlari (orada tests/uygulama/iptal-zamani.test.ts); burada aynı kural bu deponun
   kendi koduyla (içe aktarma yok).
   Neyi koruyor (src/server/imza/iptal.ts iptalKarari, ocspCevabi / crlDenetle iptalZamani; pdf-imzalar.ts iptalKanitlari + imza anı; yukleme.ts):
   a. imzadan ÖNCE üretilmiş "geçerli" OCSP imza anını kanıtlamaz → kanıt yok (null), düzey B-LT değil;
   b. imzadan SONRA üretilmiş "geçerli" OCSP → gecerli (B-LT);
   c. iptal anı imzadan önce → iptal — aynı DSS'te "geçerli" diyen OCSP (taze ya da bayat) bunu EZEMEZ; kapı reddeder;
   d. iptal anı imzadan (damgadan) sonra → çözümleyicide gecerli; KAPI damgaya güvenmez (damga sunucusu güvenilir listeye bağlı değil —
      2026-10-18, geriye tarihli damga basılabilir) ve kararı yükleme anına göre verir: iptal yükleme anından önceyse ret, sonraysa kabul;
   e. süresi (nextUpdate) imzadan önce biten liste → kanıt yok;
   f. iptal anı okunamayan kanıt → iptal (her an iptal sayılır);
   g. imzası tutmayan kanıt (verenin adıyla başka anahtarın listesi, yetkisiz imzacının OCSP cevabı) sayılmaz — "geçerli" B-LT saydırmaz, "iptal"
      reddettirmez (2026-10-23 denetim bulgusu: iptalKanitlariBul'un `r.imza === "tamam"` süzgeci kilitsizdi);
   çözümleyicide imza anı: SAĞLAM imza damgası, yoksa imzayı KAPSAYAN (imzadan sonra basılmış) ilk sağlam belge damgası, yoksa çözüm anı (simdi) —
   bozuk damga, imzadan önceki belge damgası, sonraki belge damgası an olmaz; imza damgası belge damgasından önce gelir (2026-10-23 denetim bulgusu:
   bu koşullar kilitsizdi); kapıda yükleme anı — damga anına göre karar "iptal" ise de ret (ileri tarihli damga; 2026-10-23 denetim bulgusu).
   Gerçek kriptografi: uydurma makam / kişi / damga sunucusu / OCSP / iptal listesi (tests/yardimci/gercek-imza.ts; imza üretimi probata-sign'da,
   burada yalnız test verisi). Olumsuz kanıt: tests/bozan/iptal-zamani.bozan.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { crlDenetle, iptalKarari, ocspCevabi, type IptalKaniti } from "../src/server/imza/iptal.ts";
import { pdfImzalariniCozumle } from "../src/server/imza/pdf-imzalar.ts";
import { sertifikaOku } from "../src/server/imza/sertifika.ts";
import { ekImzaNedeni } from "../src/server/imza/yukleme.ts";
import { TABAN_PDF, kanitliDss, pdfImzala } from "./yardimci/gercek-imza.ts";
import { IMZA_ANI, IPTAL_RET, IPTAL_SENARYOLARI, SIMDI, T, dk, imzaliDss, iptalK, kanitliBelge } from "./yardimci/iptal-zamani.ts";

const cozum = (pdf: Buffer, simdi = SIMDI) => pdfImzalariniCozumle(pdf, { simdi }).imzalar[0];

for (const s of IPTAL_SENARYOLARI) {
  test(`senaryo ${s.ad}: iptal ${s.iptal ?? "yok (null)"}, düzey ${s.duzey}, kapı ${s.kapi ? "kabul" : "ret"}`, () => {
    const pdf = s.pdf();
    const c = pdfImzalariniCozumle(pdf, { simdi: SIMDI });
    assert.equal(c.imzalar.filter((i) => i.tur === "imza").length, 1);
    const i = c.imzalar.find((x) => x.tur === "imza")!;
    assert.deepEqual([i.butunluk, i.imzaDegeri, i.sertifikaBagi], ["tamam", "tamam", true], "imza sağlam");
    assert.equal(i.iptalKanitlari.length, s.kanit, "DSS'teki bu sertifikaya ait sağlam kanıtların HEPSİ toplandı");
    assert.equal(i.iptal, s.iptal);
    assert.equal(c.duzey, s.duzey);
    const nedeni = ekImzaNedeni(iptalK.taban, pdf, SIMDI);
    if (s.kapi) assert.equal(nedeni, null);
    else assert.equal(nedeni, IPTAL_RET);
  });
}

test("çözümleyici iptal anını okur: OCSP RevokedInfo revocationTime, iptal listesi revocationDate; okunamazsa null (kanıt düşmez)", () => {
  const sk = sertifikaOku(iptalK.k.kisi.der)!, sv = sertifikaOku(iptalK.k.ara.der)!;
  const o = ocspCevabi(iptalK.ocsp({ durum: "iptal", zaman: dk(5), iptalZamani: dk(-60) }), sk, sv);
  assert.deepEqual([o.durum, o.imza, o.zaman, o.iptalZamani], ["iptal", "tamam", dk(5).toISOString(), dk(-60).toISOString()]);
  assert.equal(ocspCevabi(iptalK.ocsp({ zaman: dk(5) }), sk, sv).iptalZamani, null, "geçerli cevapta iptal anı yok");
  const ob = ocspCevabi(iptalK.ocsp({ durum: "iptal", zaman: dk(5), iptalZamani: "bozuk" }), sk, sv);
  assert.deepEqual([ob.durum, ob.imza, ob.iptalZamani], ["iptal", "tamam", null]);
  const l = crlDenetle(iptalK.liste([iptalK.k.kisi], dk(5), { iptalZamani: dk(-30) }), sk, sv);
  assert.deepEqual([l.durum, l.imza, l.zaman, l.iptalZamani], ["iptal", "tamam", dk(5).toISOString(), dk(-30).toISOString()]);
  assert.equal(crlDenetle(iptalK.liste([], dk(5)), sk, sv).iptalZamani, null, "temiz listede iptal anı yok");
  const lb = crlDenetle(iptalK.liste([iptalK.k.kisi], dk(5), { iptalZamani: "bozuk" }), sk, sv);
  assert.deepEqual([lb.durum, lb.imza, lb.iptalZamani], ["iptal", "tamam", null]);
});

test("imza anı: damgasız imzada çözüm anı (simdi); imzayı kapsayan belge damgası varsa onun anı", () => {
  /* damgasız imza + T + 5 dk "geçerli" OCSP: çözüm anı 12:00 → kanıt imza anını kanıtlamıyor; çözüm anı T + 1 dk → geçerli */
  const damgasiz = imzaliDss({ ocsp: [iptalK.ocsp({ zaman: dk(5) })] }, { damga: false });
  assert.equal(cozum(damgasiz).iptal, null);
  assert.equal(cozum(damgasiz, dk(1)).iptal, "gecerli");
  /* aynı kanıt, imzayı kapsayan belge damgası T anında: imza anı T (simdi 12:00 olsa da) */
  const belgeDamgali = kanitliBelge({ ocsp: [iptalK.ocsp({ zaman: dk(5) })] }, { belgeDamgasi: T });
  assert.equal(cozum(belgeDamgali).iptal, "gecerli");
  /* damgasız imza, iptal T + 60 dk: imza anı bilinmiyor → yükleme anı (12:00) → iptal, kapı reddeder; yükleme anı T + 1 dk → kabul */
  const sonraIptal = imzaliDss({ ocsp: [iptalK.ocsp({ durum: "iptal", zaman: dk(65), iptalZamani: dk(60) })] }, { damga: false });
  assert.equal(cozum(sonraIptal).iptal, "iptal");
  assert.equal(ekImzaNedeni(iptalK.taban, sonraIptal, SIMDI), IPTAL_RET);
  assert.equal(ekImzaNedeni(iptalK.taban, sonraIptal, dk(1)), null, "kapı imza anını kendi yükleme anından (simdi) alır");
});

test("kapı damgaya güvenmez: iptalden sonra yüklenen belgeyi geriye tarihli (iptalden önceki) damga kurtarmaz; iptalden önce yüklenen kabul", () => {
  /* d: damga 09:00, iptal 10:00 — çözümleyici damga anına göre "gecerli" */
  const d = IPTAL_SENARYOLARI.find((s) => s.ad.startsWith("d ·"))!.pdf();
  assert.equal(cozum(d).iptal, "gecerli");
  assert.equal(ekImzaNedeni(iptalK.taban, d, SIMDI), IPTAL_RET, "yükleme 12:00 — iptalden sonra");
  assert.equal(ekImzaNedeni(iptalK.taban, d, dk(30)), null, "yükleme 09:30 — iptalden önce");
  /* aynı kanıt, damgası iptalden önceye (08:00) basılmış: kapının sonucu değişmez */
  const geriTarihli = kanitliDss(pdfImzala(TABAN_PDF, 10, iptalK.k, { damga: true, damgaZamani: dk(-60) }), 11,
    { ocsp: [iptalK.ocsp({ durum: "iptal", zaman: dk(65), iptalZamani: dk(60) })] });
  assert.equal(cozum(geriTarihli).iptal, "gecerli");
  assert.equal(ekImzaNedeni(iptalK.taban, geriTarihli, SIMDI), IPTAL_RET);
});

test("imza anı yalnız SAĞLAM damgadan: izi bozuk imza damgası ve izi bozuk belge damgası an olmaz (an çözüm anına düşer)", () => {
  const bi = pdfImzalariniCozumle(IMZA_ANI.bozukImzaDamgasi(), { simdi: SIMDI }).imzalar.find((x) => x.tur === "imza")!;
  assert.deepEqual([bi.damga?.zaman, bi.damga?.iz, bi.damga?.imza], [T.toISOString(), "bozuk", "tamam"], "damganın zamanı T, izi bozuk");
  assert.equal(bi.iptal, null, "bozuk imza damgası imza anı sayılmadı");
  assert.equal(cozum(IMZA_ANI.bozukImzaDamgasi(), dk(1)).iptal, "gecerli", "an çözüm anı (simdi)");
  const c = pdfImzalariniCozumle(IMZA_ANI.bozukBelgeDamgasi(), { simdi: SIMDI });
  const bd = c.imzalar.find((x) => x.tur === "belge_damgasi")!;
  assert.deepEqual([bd.damga?.zaman, bd.butunluk], [T.toISOString(), "bozuk"], "belge damgasının zamanı T, izi bozuk");
  assert.equal(c.imzalar.find((x) => x.tur === "imza")!.iptal, null, "bozuk belge damgası imza anı sayılmadı");
});

test("imza anı yalnız imzayı KAPSAYAN belge damgasından, ilkinden; imza damgası belge damgasından önce gelir", () => {
  /* tabanda (imzadan önce) T anlı belge damgası: imzayı kapsamaz */
  const once = pdfImzalariniCozumle(IMZA_ANI.oncekiBelgeDamgasi(), { simdi: SIMDI });
  assert.deepEqual(once.imzalar.map((x) => x.tur), ["belge_damgasi", "imza"], "belge damgası imzadan önce");
  assert.equal(once.imzalar[1].iptal, null, "imzadan önceki belge damgası imza anı sayılmadı");
  /* imzadan sonra T ve T + 10 dk belge damgaları: an ilki (T) — T + 5 dk kanıt imza anını kanıtlar */
  assert.equal(cozum(IMZA_ANI.ikiBelgeDamgasi()).iptal, "gecerli", "imzayı kapsayan ilk belge damgası");
  /* damgalı imza (T) + T + 10 dk belge damgası: an imza damgası */
  assert.equal(cozum(IMZA_ANI.imzaVeBelgeDamgasi()).iptal, "gecerli", "imza damgası önce");
});

test("kapı: damga anına göre karar 'iptal' ise de ret — ileri tarihli damga (iptal anı yükleme ile damga arasında)", () => {
  const pdf = IMZA_ANI.ileriDamga();
  assert.equal(cozum(pdf).iptal, "iptal", "damga anına (13:00) göre iptal (12:20)");
  assert.equal(iptalKarari(cozum(pdf).iptalKanitlari, SIMDI.toISOString()), "gecerli", "yükleme anına (12:00) göre iptal değil");
  assert.equal(ekImzaNedeni(iptalK.taban, pdf, SIMDI), IPTAL_RET, "kanıtlardan biri imzanın iptalden sonra atıldığını söylüyor");
});

test("iptalKarari (saf): saniye sınırı, okunamayan iptal anı, nextUpdate, 'bilinmiyor', 'iptal' önceliği", () => {
  const an = "2026-10-17T09:00:00.700Z";
  const k = (p: Partial<IptalKaniti>): IptalKaniti => ({ tur: "ocsp", durum: "gecerli", zaman: null, sonraki: null, iptalZamani: null, ...p });
  /* DER zamanı saniyelik: aynı saniyede üretilmiş kanıt imza anını kapsar */
  assert.equal(iptalKarari([k({ zaman: "2026-10-17T09:00:00Z" })], an), "gecerli");
  assert.equal(iptalKarari([k({ zaman: "2026-10-17T08:59:59Z" })], an), null, "imzadan önce üretilmiş");
  assert.equal(iptalKarari([k({ zaman: "2026-10-17T09:05:00Z", sonraki: "2026-10-17T08:00:00Z" })], an), null, "süresi imza anından önce bitmiş");
  assert.equal(iptalKarari([k({ zaman: "2026-10-17T09:05:00Z", sonraki: "2026-10-17T09:00:00Z" })], an), "gecerli", "süresi imza anında bitiyor");
  assert.equal(iptalKarari([k({ zaman: "2026-10-17T09:05:00Z", sonraki: "bozuk" })], an), null, "okunamayan nextUpdate sayılmaz");
  assert.equal(iptalKarari([k({ zaman: null })], an), null, "zamansız kanıt sayılmaz");
  assert.equal(iptalKarari([k({ durum: "iptal", iptalZamani: null })], an), "iptal", "okunamayan iptal anı: iptal");
  assert.equal(iptalKarari([k({ durum: "iptal", iptalZamani: "2026-10-17T09:00:00Z" })], an), "iptal", "iptal anı = imza anı (saniye): iptal");
  assert.equal(iptalKarari([k({ durum: "iptal", iptalZamani: "2026-10-17T09:00:01Z" })], an), "gecerli");
  assert.equal(iptalKarari([k({ durum: "bilinmiyor", zaman: "2026-10-17T09:05:00Z" })], an), null);
  assert.equal(iptalKarari([k({ zaman: "2026-10-17T09:05:00Z" }), k({ tur: "crl", durum: "iptal", iptalZamani: "2026-01-01T00:00:00Z" })], an), "iptal",
    "sonra gelen 'iptal' de 'geçerli'yi ezer");
  assert.equal(iptalKarari([], an), null);
  assert.equal(iptalKarari([k({ zaman: "2026-10-17T09:05:00Z" })], "bozuk"), null, "imza anı okunamıyor");
});
