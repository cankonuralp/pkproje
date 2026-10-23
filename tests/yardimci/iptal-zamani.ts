/* İPTAL KANITININ ZAMANI — ÖRNEKLER (2026-10-23; tests/iptal-zamani.test.ts kilidi ve tests/bozan/iptal-zamani.bozan.ts ortak). probata-sign
   tests/uygulama/iptal-zamani-ornekleri.ts'in karşılığı, bu deponun kendi test verisi üreticisiyle (içe aktarma yok). UYDURMA makam / kişi / damga
   sunucusu / OCSP / iptal listesi (tests/yardimci/gercek-imza.ts — imzalar gerçekten doğrulanır); DSS imzadan sonra izinli ek olarak eklenir
   (kanıtı belgeyi değiştiren seçer). İmza damgası anı T = 2026-10-17T09:00Z, çözüm / yükleme anı 12:00. Çözümleyici kararı damga anına göre verir;
   yükleme kapısı damgaya güvenmez (damga sunucusu güvenilir listeye bağlı değil — 2026-10-18), kararı yükleme anına göre yeniden verir. */
import { TABAN_PDF, belgeDamgala, crlYap, denemeKimlikleri, kanitliDss, ocspCevabiYap, pdfImzala, sertifikaYap, type Kimlik } from "./gercek-imza.ts";

export const T = new Date("2026-10-17T09:00:00Z");
export const SIMDI = new Date("2026-10-17T12:00:00Z");
/** T'den n dakika sonra (eksi: önce) */
export const dk = (n: number) => new Date(T.getTime() + n * 60_000);
const ESKI = new Date("2026-01-02T00:00:00Z");
const k = denemeKimlikleri("ecdsa");
/** verence (ara makam) yetkilendirilmemiş OCSP imzacısı: OCSP kullanım amacı var ama kökün verdiği — cevabın imzası tutmaz (ocspCevabi) */
const yetkisiz = sertifikaYap({ cn: "Deneme Yetkisiz OCSP İmzacısı", o: "Deneme ESHS", veren: k.kok, tur: "ecdsa", ocsp: true });

type OcspSecenek = NonNullable<Parameters<typeof ocspCevabiYap>[2]>;
type ListeSecenek = NonNullable<Parameters<typeof crlYap>[4]>;
/** imzalayanın (kişi) kanıtları: OCSP cevabı ve iptal listesi verenin (ara makam) anahtarıyla */
export const iptalK = {
  k,
  taban: TABAN_PDF,
  ocsp: (p: OcspSecenek = {}) => ocspCevabiYap(k.kisi, k.ara, p),
  liste: (iptaller: Kimlik[], zaman: Date, p: ListeSecenek = {}) => crlYap(k.ara, iptaller, zaman, k.ara, p),
};
type Kanit = { ocsp?: Buffer[]; crl?: Buffer[] };

/** kişinin imzası (istenirse T anlı imza zaman damgasıyla — varsayılan) + DSS'te verilen kanıtlar */
export function imzaliDss(kanit: Kanit, p: { damga?: boolean } = {}): Buffer {
  return kanitliDss(pdfImzala(TABAN_PDF, 10, k, { damga: p.damga ?? true }), 11, kanit);
}
/** damgasız imza + imzayı kapsayan belge zaman damgası + DSS'te verilen kanıtlar */
export function kanitliBelge(kanit: Kanit, p: { belgeDamgasi: Date }): Buffer {
  return kanitliDss(belgeDamgala(pdfImzala(TABAN_PDF, 10, k), 11, k, p.belgeDamgasi), 12, kanit);
}

/** src/server/imza/yukleme.ts ekImzaNedeni'nin iptal ret metni */
export const IPTAL_RET = "PDF'teki imzanın sertifikası iptal edilmiş (belgedeki iptal kanıtına göre).";

export interface IptalSenaryosu {
  ad: string;
  pdf: () => Buffer;
  /** DSS'teki bu sertifikaya ait sağlam kanıt sayısı (hepsi toplanır) */
  kanit: number;
  /** çözümleyicinin imza (damga) anındaki iptal kararı (null: kanıt imza anını kanıtlamıyor) */
  iptal: "gecerli" | "iptal" | null;
  duzey: "B-T" | "B-LT";
  /** yükleme kapısı (yükleme anı 12:00) kabul eder mi */
  kapi: boolean;
}

/** görevin altı maddesi (a–f) + aynı DSS'te birbirini ezme denemeleri (c2, c3) ve iptal listesi karşılıkları (d2, e2, f2) + imzası tutmayan kanıt
    (g, g2, g3 — 2026-10-23 denetim bulgusu: pdf-imzalar.ts iptalKanitlariBul'un `r.imza === "tamam"` süzgeci kilitsizdi; verenin adını taşıyan ama
    başka anahtarla imzalanmış liste ya da yetkisiz imzacının OCSP cevabı kanıt sayılmaz) */
export const IPTAL_SENARYOLARI: readonly IptalSenaryosu[] = [
  { ad: "a · OCSP 'geçerli', imzadan 9 ay önce üretilmiş", kanit: 1, iptal: null, duzey: "B-T", kapi: true,
    pdf: () => imzaliDss({ ocsp: [iptalK.ocsp({ zaman: ESKI })] }) },
  { ad: "b · OCSP 'geçerli', imzadan 5 dk sonra", kanit: 1, iptal: "gecerli", duzey: "B-LT", kapi: true,
    pdf: () => imzaliDss({ ocsp: [iptalK.ocsp({ zaman: dk(5) })] }) },
  { ad: "c · OCSP 'iptal', iptal anı imzadan 1 saat önce", kanit: 1, iptal: "iptal", duzey: "B-LT", kapi: false,
    pdf: () => imzaliDss({ ocsp: [iptalK.ocsp({ durum: "iptal", zaman: dk(5), iptalZamani: dk(-60) })] }) },
  { ad: "c2 · taze 'geçerli' OCSP + aynı DSS'te 08:30'da İPTAL eden liste (geçerli diyen ezemez)", kanit: 2, iptal: "iptal", duzey: "B-LT", kapi: false,
    pdf: () => imzaliDss({ ocsp: [iptalK.ocsp({ zaman: dk(5) })], crl: [iptalK.liste([k.kisi], dk(5), { iptalZamani: dk(-30) })] }) },
  { ad: "c3 · bayat 'geçerli' OCSP + 08:30'da İPTAL eden liste", kanit: 2, iptal: "iptal", duzey: "B-LT", kapi: false,
    pdf: () => imzaliDss({ ocsp: [iptalK.ocsp({ zaman: ESKI })], crl: [iptalK.liste([k.kisi], dk(-30))] }) },
  /* d, d2: damga anında iptal değil (çözümleyici "gecerli"); kapı damgaya güvenmez — iptal (10:00) yükleme anından (12:00) önce → ret */
  { ad: "d · OCSP 'iptal', iptal anı damgalı imzadan 1 saat sonra", kanit: 1, iptal: "gecerli", duzey: "B-LT", kapi: false,
    pdf: () => imzaliDss({ ocsp: [iptalK.ocsp({ durum: "iptal", zaman: dk(65), iptalZamani: dk(60) })] }) },
  { ad: "d2 · iptal listesi, iptal anı damgalı imzadan 1 saat sonra", kanit: 1, iptal: "gecerli", duzey: "B-LT", kapi: false,
    pdf: () => imzaliDss({ crl: [iptalK.liste([k.kisi], dk(65), { iptalZamani: dk(60) })] }) },
  { ad: "e · temiz iptal listesi, thisUpdate ve nextUpdate imzadan önce", kanit: 1, iptal: null, duzey: "B-T", kapi: true,
    pdf: () => imzaliDss({ crl: [iptalK.liste([], ESKI)] }) },
  { ad: "e2 · temiz iptal listesi imzadan sonra üretilmiş ama nextUpdate imzadan önce", kanit: 1, iptal: null, duzey: "B-T", kapi: true,
    pdf: () => imzaliDss({ crl: [iptalK.liste([], dk(5), { sonraki: dk(-10) })] }) },
  { ad: "f · OCSP 'iptal', iptal anı okunamıyor", kanit: 1, iptal: "iptal", duzey: "B-LT", kapi: false,
    pdf: () => imzaliDss({ ocsp: [iptalK.ocsp({ durum: "iptal", zaman: dk(5), iptalZamani: "bozuk" })] }) },
  { ad: "f2 · iptal listesi, iptal anı okunamıyor", kanit: 1, iptal: "iptal", duzey: "B-LT", kapi: false,
    pdf: () => imzaliDss({ crl: [iptalK.liste([k.kisi], dk(5), { iptalZamani: "bozuk" })] }) },
  /* g, g2, g3: imzası tutmayan kanıt sayılmaz — "geçerli" diyen B-LT saydırmaz, "iptal" diyen reddettirmez */
  { ad: "g · temiz iptal listesi, verenin adıyla ama KÖKÜN anahtarıyla imzalı", kanit: 0, iptal: null, duzey: "B-T", kapi: true,
    pdf: () => imzaliDss({ crl: [crlYap(k.ara, [], dk(5), k.kok)] }) },
  { ad: "g2 · OCSP 'geçerli', verence yetkilendirilmemiş imzacının", kanit: 0, iptal: null, duzey: "B-T", kapi: true,
    pdf: () => imzaliDss({ ocsp: [iptalK.ocsp({ zaman: dk(5), imzalayan: yetkisiz, ekSertifika: [yetkisiz] })] }) },
  { ad: "g3 · iptal eden liste, verenin adıyla ama KÖKÜN anahtarıyla imzalı", kanit: 0, iptal: null, duzey: "B-T", kapi: true,
    pdf: () => imzaliDss({ crl: [crlYap(k.ara, [k.kisi], dk(5), k.kok, { iptalZamani: dk(-30) })] }) },
];
/* ── İMZA ANI SEÇİMİ (2026-10-23 denetim bulgusu: pdf-imzalar.ts'te anın "sağlam damga" ve "imzayı kapsayan" koşulları kilitsizdi). Hepsinde DSS'te
   T + 5 dk "geçerli" OCSP: an T (09:00) ya da öncesiyse "gecerli", an çözüm anına (12:00) düşerse kanıt anı kanıtlamaz → null ── */
const taze = () => ({ ocsp: [iptalK.ocsp({ zaman: dk(5) })] });
export const IMZA_ANI = {
  /** izi bozuk imza damgası (T) — sağlam değil, an çözüm anı */
  bozukImzaDamgasi: () => kanitliDss(pdfImzala(TABAN_PDF, 10, k, { damga: true, damgaBozuk: true }), 11, taze()),
  /** damgasız imza + izi bozuk belge damgası (T) — sağlam değil, an çözüm anı */
  bozukBelgeDamgasi: () => kanitliDss(belgeDamgala(pdfImzala(TABAN_PDF, 10, k), 11, k, T, { bozuk: true }), 12, taze()),
  /** imzadan ÖNCE (tabanda) basılmış belge damgası (T) + damgasız imza — imzayı kapsamaz, an çözüm anı */
  oncekiBelgeDamgasi: () => kanitliDss(pdfImzala(belgeDamgala(TABAN_PDF, 10, k, T), 11, k), 12, taze()),
  /** damgasız imza + imzadan sonra iki belge damgası (T, T + 10 dk) — imzayı kapsayan İLKİ: an T */
  ikiBelgeDamgasi: () => kanitliDss(belgeDamgala(belgeDamgala(pdfImzala(TABAN_PDF, 10, k), 11, k, T), 12, k, dk(10)), 13, taze()),
  /** damgalı imza (T) + belge damgası (T + 10 dk) — imza damgası önce gelir: an T */
  imzaVeBelgeDamgasi: () => kanitliDss(belgeDamgala(pdfImzala(TABAN_PDF, 10, k, { damga: true }), 11, k, dk(10)), 12, taze()),
  /** İLERİ tarihli damga (13:00) + iptal anı 12:20 (yükleme 12:00 ile damga arasında): damga anına göre "iptal", yükleme anına göre "gecerli" —
      kapı ikisinden biri "iptal" diyorsa reddeder (yukleme.ts) */
  ileriDamga: () => kanitliDss(pdfImzala(TABAN_PDF, 10, k, { damga: true, damgaZamani: dk(240) }), 11,
    { ocsp: [iptalK.ocsp({ durum: "iptal", zaman: dk(205), iptalZamani: dk(200) })] }),
};

/** ada göre senaryo (olumsuz kanıt) */
export const senaryo = (on: string) => {
  const s = IPTAL_SENARYOLARI.find((x) => x.ad.startsWith(`${on} ·`));
  if (!s) throw new Error(`senaryo yok: ${on}`);
  return s;
};
