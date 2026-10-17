/* YALNIZ TEST VERİSİ ÜRETİR; ürün kodu bu klasörü import edemez — imza üretimi probata-sign'da (reisim 2026-10-17: "probatanın kaynak kodlarına
   bunları bulaştırma"; kilit tests/imza-ayrim.test.ts). UZUN SÜRELİ DOĞRULAMA EKİ — DSS + BELGE ZAMAN DAMGASI: imzalı belgeye iki artımlı ek:
   1. DSS: belgedeki her imzanın ve zaman damgasının sertifika zinciri + her uç / ara sertifika için iptal kanıtı (OCSP cevabı ya da iptal listesi)
      — kataloğa /DSS (önceki DSS'in kanıtları korunur: tazelemede yenileri eklenir);
   2. belge zaman damgası (ETSI.RFC3161) DSS'i de kapsar → B-LTA.
   Kaynaklar (damga, iptal kanıtı) enjekte edilir — testte uydurma makamdan (tests/yardimci/gercek-imza.ts). Testler bununla B-LT / B-LTA belge
   kurar; probata'nın çözümleyicisi (src/server/imza/pdf-imzalar.ts) düzeyi, DSS'i, imza sonrası ekleri okur. src/server/imza/ltv.ts'ten taşındı
   (davranış aynı). */
import { BozukDer } from "../../../src/server/imza/der.ts";
import { imzaliVeriOku, CMS_OID } from "../../../src/server/imza/cms.ts";
import { basvuru, degerOku, nesneOkuyucu, sonDurum, latin1, PdfHatasi } from "../../../src/server/imza/pdf-ek.ts";
import { imzaYerleri, imzaIcerigi } from "../../../src/server/imza/pdf-imzalar.ts";
import { kendindenImzali, vereniBul, type Sertifika } from "../../../src/server/imza/sertifika.ts";
import { akisGovdesi, degerYaz, ekle, type YeniNesne } from "./pdf-ek-yaz.ts";
import { icerikYaz, yerTutucuEkle } from "./yer-tutucu.ts";

export interface LtvKaynaklari {
  /** verinin RFC 3161 damgası (doğrulanmış token) */
  damga: (veri: readonly Uint8Array[]) => Promise<Buffer>;
  /** sertifikanın iptal kanıtı (ham OCSP cevabı ya da iptal listesi) */
  iptal: (s: Sertifika, veren: Sertifika) => Promise<{ ocsp?: Buffer; crl?: Buffer }>;
}
/** sayılar: bu ekte YENİ yazılanlar */
export interface LtvSonucu { pdf: Buffer; sertifika: number; ocsp: number; crl: number; eksik: string[] }

/** belgedeki imzaların ve damgaların sertifikaları (tekrar yok) */
export function belgeSertifikalari(pdf: Uint8Array): Sertifika[] {
  const havuz = new Map<string, Sertifika>();
  const ekle1 = (l: Sertifika[]) => { for (const s of l) havuz.set(s.bilgi.parmakIzi, s); };
  for (const y of imzaYerleri(pdf)) {
    const der = imzaIcerigi(pdf, y);
    if (!der) continue;
    try {
      const v = imzaliVeriOku(der);
      ekle1(v.sertifikalar);
      for (const t of v.imzacilar[0]?.imzasizOz.get(CMS_OID.imzaDamgasi) ?? []) ekle1(imzaliVeriOku(t).sertifikalar);
    } catch (e) { if (!(e instanceof BozukDer || e instanceof RangeError)) throw e; }
  }
  return [...havuz.values()];
}


/** DSS eki (kanıtlar toplanır, önceki DSS korunur) */
export async function dssEkle(pdf: Uint8Array, k: Pick<LtvKaynaklari, "iptal">): Promise<LtvSonucu> {
  const sertler = belgeSertifikalari(pdf);
  const ocsp: Buffer[] = [], crl: Buffer[] = [], eksik: string[] = [];
  for (const s of sertler) {
    if (kendindenImzali(s)) continue;
    const v = vereniBul(s, sertler);
    if (!v) { eksik.push(`${s.bilgi.ad ?? "?"}: veren sertifika belgede yok`); continue; }
    try {
      const r = await k.iptal(s, v);
      if (r.ocsp) ocsp.push(r.ocsp);
      if (r.crl) crl.push(r.crl);
      if (!r.ocsp && !r.crl) eksik.push(`${s.bilgi.ad ?? "?"}: iptal kanıtı yok`);
    } catch (e) { eksik.push(`${s.bilgi.ad ?? "?"}: ${(e as Error).message}`); }
  }
  const d = sonDurum(pdf);
  const kok = basvuru(d.kok)!;
  const oku = nesneOkuyucu(pdf);
  const katalog = oku(kok[0]);
  if (!katalog?.startsWith("<<")) throw new PdfHatasi("katalog okunamadı");
  /* önceki DSS'in dizileri korunur */
  const eski = { Certs: [] as string[], OCSPs: [] as string[], CRLs: [] as string[] };
  const dssRef = basvuru(degerOku(katalog, "DSS"));
  const eskiDss = dssRef ? oku(dssRef[0]) : null;
  if (eskiDss) for (const a of ["Certs", "OCSPs", "CRLs"] as const) {
    let dz = degerOku(eskiDss, a);
    const r = basvuru(dz);
    if (r) dz = oku(r[0]);
    eski[a] = [...(dz ?? "").matchAll(/\d{1,10}[\x00\t\n\f\r ]+\d{1,5}[\x00\t\n\f\r ]+R/g)].map((m) => m[0]);
  }
  /* önceki DSS'te aynısı olan sertifika / kanıt yeniden yazılmaz (tazeleme) */
  const eskiVeri = (l: string[]) => l.map((r) => oku.akis(Number(r.split(/[\x00\t\n\f\r ]+/)[0]))).filter((b): b is Buffer => !!b);
  const yeniler = (l: Buffer[], eskiler: Buffer[]) => l.filter((b, i) => !eskiler.some((e) => e.equals(b)) && l.findIndex((x) => x.equals(b)) === i);
  let no = d.boyut;
  const nesneler: YeniNesne[] = [];
  const akis = (l: Buffer[]) => l.map((b) => { const n = no++; nesneler.push({ no: n, govde: akisGovdesi(b) }); return `${n} 0 R`; });
  const yeni = {
    Certs: akis(yeniler(sertler.map((s) => s.der), eskiVeri(eski.Certs))),
    OCSPs: akis(yeniler(ocsp, eskiVeri(eski.OCSPs))),
    CRLs: akis(yeniler(crl, eskiVeri(eski.CRLs))),
  };
  const dssNo = no++;
  nesneler.push({ no: dssNo, govde: `<< /Type /DSS /Certs [${[...eski.Certs, ...yeni.Certs].join(" ")}] /OCSPs [${[...eski.OCSPs, ...yeni.OCSPs].join(" ")}] /CRLs [${[...eski.CRLs, ...yeni.CRLs].join(" ")}] >>` });
  nesneler.push({ no: kok[0], govde: degerYaz(katalog, "DSS", `${dssNo} 0 R`) });
  return { pdf: ekle(pdf, nesneler, d).pdf, sertifika: yeni.Certs.length, ocsp: yeni.OCSPs.length, crl: yeni.CRLs.length, eksik };
}

/** belge zaman damgası eki (DocTimeStamp) */
export async function belgeDamgasiEkle(pdf: Uint8Array, damga: LtvKaynaklari["damga"], alanAdi = "Arsiv zaman damgasi"): Promise<Buffer> {
  const y = yerTutucuEkle(pdf, { tur: "belge_damgasi", yeniAlanAdi: `${alanAdi} ${imzaYerleri(pdf).length + 1}`, yer: 24_000 });
  return icerikYaz(y, await damga(y.parcalar));
}

/** DSS + belge zaman damgası (B-LTA; tazelemede de aynı) */
export async function ltvEkle(pdf: Uint8Array, k: LtvKaynaklari): Promise<LtvSonucu> {
  if (!latin1(pdf).includes("/ByteRange")) throw new PdfHatasi("belgede imza yok");
  const r = await dssEkle(pdf, k);
  return { ...r, pdf: await belgeDamgasiEkle(r.pdf, k.damga) };
}
