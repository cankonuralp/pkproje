/* CMS SignedData — ÇÖZÜMLEME VE DOĞRULAMA (IMZA-SERVISI.md ES1). Saf. PDF imzasının (/Contents — ETSI.CAdES.detached, adbe.pkcs7.detached) ve
   zaman damgasının (RFC 3161 TimeStampToken) ortak yapısı. Doğrulanan: içerik özeti (messageDigest), imza değeri (imzalı öznitelikler üzerinde;
   RSA PKCS#1 v1.5, RSA-PSS, ECDSA — SHA-256/384/512; SHA-1 imza ve özet "desteklenmiyor", ETSI TS 119 312), imzalayan sertifikası
   (signingCertificateV2 / V1 özetiyle; yoksa veren + seri ya da anahtar tanımlayıcısı), zaman damgası sunucusunun sertifikası (zaman damgası
   kullanımı, damga anında geçerli, damganın sertifika bağı). Zincirin güvenilir köke bağlanması burada değil (kök listesi kararı ertelendi).
   2026-10-17 bağımsız inceleme: imzalayanın kendi anahtarıyla bastığı "damga", sertifika değiştirme (sid + küme), SHA-1, eksik alanlı yapıda
   kaçan TypeError — hepsi kapatıldı (tests/imza-cozum.test.ts). */
import { constants, createHash, verify, type KeyObject } from "node:crypto";
import { BozukDer, bekle, cocuklar, dugum, ic, oidOku, okuyucu, tamsayiHex, tum, zamanOku, type Dugum, type Okuyucu } from "./der.ts";
import { gecerliMi, sertifikaOku, type Sertifika } from "./sertifika.ts";

export const CMS_OID = {
  imzaliVeri: "1.2.840.113549.1.7.2",
  veri: "1.2.840.113549.1.7.1",
  icerikTuru: "1.2.840.113549.1.9.3",
  ozet: "1.2.840.113549.1.9.4",
  imzaZamani: "1.2.840.113549.1.9.5",
  imzaSertifikasi2: "1.2.840.113549.1.9.16.2.47",
  imzaSertifikasi1: "1.2.840.113549.1.9.16.2.12",
  imzaDamgasi: "1.2.840.113549.1.9.16.2.14",
  tstBilgisi: "1.2.840.113549.1.9.16.1.4",
} as const;

const OZET: Record<string, string> = {
  "1.3.14.3.2.26": "sha1", "2.16.840.1.101.3.4.2.1": "sha256", "2.16.840.1.101.3.4.2.2": "sha384", "2.16.840.1.101.3.4.2.3": "sha512",
};
export const OZET_OID: Record<string, string> = Object.fromEntries(Object.entries(OZET).map(([k, v]) => [v, k]));
/** imza algoritması OID'i → { tür, özet (yoksa SignerInfo'nunki) } */
const IMZA: Record<string, { tur: "rsa" | "ecdsa" | "pss"; ozet: string | null }> = {
  "1.2.840.113549.1.1.1": { tur: "rsa", ozet: null },
  "1.2.840.113549.1.1.5": { tur: "rsa", ozet: "sha1" },
  "1.2.840.113549.1.1.11": { tur: "rsa", ozet: "sha256" },
  "1.2.840.113549.1.1.12": { tur: "rsa", ozet: "sha384" },
  "1.2.840.113549.1.1.13": { tur: "rsa", ozet: "sha512" },
  "1.2.840.113549.1.1.10": { tur: "pss", ozet: null },
  "1.2.840.10045.2.1": { tur: "ecdsa", ozet: null },
  "1.2.840.10045.4.1": { tur: "ecdsa", ozet: "sha1" },
  "1.2.840.10045.4.3.2": { tur: "ecdsa", ozet: "sha256" },
  "1.2.840.10045.4.3.3": { tur: "ecdsa", ozet: "sha384" },
  "1.2.840.10045.4.3.4": { tur: "ecdsa", ozet: "sha512" },
};
export const ozetAdi = (oid: string): string | null => OZET[oid] ?? null;
/** imza / içerik özeti için kabul edilen (SHA-1 değil) */
const guvenliOzet = (ad: string | null) => !!ad && ad !== "sha1";
const SERTIFIKA_SINIR = 32;

export type Sonuc = "tamam" | "bozuk" | "desteklenmiyor" | "okunamadi";

export interface ImzaciBilgisi {
  /** imzalayan: IssuerAndSerialNumber ya da SubjectKeyIdentifier */
  verenDer: Buffer | null;
  seri: string | null;
  ski: string | null;
  ozetOid: string;
  /** imzalı öznitelikler ([0] — tam TLV) ve oid → değerler (DER) */
  imzaliOzDer: Buffer | null;
  imzaliOz: Map<string, Buffer[]>;
  imzaOid: string;
  imzaParam: Buffer | null;
  imza: Buffer;
  imzasizOz: Map<string, Buffer[]>;
}
export interface ImzaliVeri {
  icerikTuru: string;
  /** kapsüllü içerik (zaman damgasında TSTInfo); ayrık imzada null */
  icerik: Buffer | null;
  sertifikalar: Sertifika[];
  imzacilar: ImzaciBilgisi[];
}

function oznitelikler(o: Okuyucu, d: Dugum): Map<string, Buffer[]> {
  const m = new Map<string, Buffer[]>();
  for (const a of cocuklar(o, d)) {
    const [t, degerler] = cocuklar(o, bekle(a, 0x30));
    const id = oidOku(o, t);
    m.set(id, [...(m.get(id) ?? []), ...cocuklar(o, bekle(degerler, 0x31)).map((x) => Buffer.from(tum(o, x)))]);
  }
  return m;
}

/** ContentInfo(SignedData) DER/BER → ImzaliVeri; değilse BozukDer (eksik alanlı yapıda da — TypeError dışarı kaçmaz) */
export function imzaliVeriOku(der: Uint8Array): ImzaliVeri {
  try { return imzaliVeriCoz(der); } catch (e) { if (e instanceof TypeError) throw new BozukDer(); throw e; }
}

function imzaliVeriCoz(der: Uint8Array): ImzaliVeri {
  const o = okuyucu(der);
  const kok = cocuklar(o, bekle(dugum(o, 0), 0x30));
  if (oidOku(o, kok[0]) !== CMS_OID.imzaliVeri) throw new BozukDer();
  const sd = cocuklar(o, bekle(cocuklar(o, bekle(kok[1], 0xa0))[0], 0x30));
  const kaps = cocuklar(o, bekle(sd[2], 0x30));
  const icerikTuru = oidOku(o, kaps[0]);
  let icerik: Buffer | null = null;
  if (kaps[1]) {
    const e = cocuklar(o, bekle(kaps[1], 0xa0))[0];
    if (!e) throw new BozukDer();
    /* OCTET STRING (DER) ya da parçalı OCTET STRING (BER, 0x24) */
    icerik = e.tag === 0x04 ? Buffer.from(ic(o, e)) : e.tag === 0x24 ? Buffer.concat(cocuklar(o, e).map((p) => Buffer.from(ic(o, bekle(p, 0x04))))) : null;
    if (!icerik) throw new BozukDer();
  }
  const sertifikalar: Sertifika[] = [];
  let k = 3;
  if (sd[k]?.tag === 0xa0) {
    /* küme sınırlı: gerçek imzada birkaç sertifika; yüzlerce aday yalnız işlem yükü içindir */
    for (const c of cocuklar(o, sd[k]).slice(0, SERTIFIKA_SINIR)) if (c.tag === 0x30) { const s = sertifikaOku(tum(o, c)); if (s) sertifikalar.push(s); }
    k++;
  }
  if (sd[k]?.tag === 0xa1) k++;
  const imzacilar: ImzaciBilgisi[] = [];
  for (const si of cocuklar(o, bekle(sd[k], 0x31))) {
    const p = cocuklar(o, bekle(si, 0x30));
    let i = 1;
    const sid = p[i++];
    if (!sid) throw new BozukDer();
    let verenDer: Buffer | null = null, seri: string | null = null, ski: string | null = null;
    if (sid.tag === 0x30) { const [v, s] = cocuklar(o, sid); verenDer = Buffer.from(tum(o, bekle(v, 0x30))); seri = tamsayiHex(o, s); }
    else if (sid.tag === 0x80) ski = Buffer.from(ic(o, sid)).toString("hex").toUpperCase();
    else throw new BozukDer();
    const ozetOid = oidOku(o, cocuklar(o, bekle(p[i++], 0x30))[0]);
    let imzaliOzDer: Buffer | null = null, imzaliOz = new Map<string, Buffer[]>();
    if (p[i]?.tag === 0xa0) { imzaliOzDer = Buffer.from(tum(o, p[i])); imzaliOz = oznitelikler(o, p[i]); i++; }
    const alg = cocuklar(o, bekle(p[i++], 0x30));
    const imzaOid = oidOku(o, alg[0]);
    const imzaParam = alg[1] && alg[1].tag !== 0x05 ? Buffer.from(tum(o, alg[1])) : null;
    const imza = Buffer.from(ic(o, bekle(p[i++], 0x04)));
    const imzasizOz = p[i]?.tag === 0xa1 ? oznitelikler(o, p[i]) : new Map<string, Buffer[]>();
    imzacilar.push({ verenDer, seri, ski, ozetOid, imzaliOzDer, imzaliOz, imzaOid, imzaParam, imza, imzasizOz });
  }
  if (!imzacilar.length) throw new BozukDer();
  return { icerikTuru, icerik, sertifikalar, imzacilar };
}

/** imzalayanın sertifikası: imzalı öznitelikteki signingCertificate özetini tutan (imzalayanın imzaladığı kimlik — imzasız sid ve küme
    değiştirilerek aynı anahtarlı başka sertifika gösterilemez); öznitelik yoksa SignerInfo'nun gösterdiği */
export function imzaciSertifikasi(v: ImzaliVeri, s: ImzaciBilgisi, ek: readonly Sertifika[] = []): Sertifika | null {
  const havuz = [...v.sertifikalar, ...ek];
  if (s.imzaliOz.has(CMS_OID.imzaSertifikasi2) || s.imzaliOz.has(CMS_OID.imzaSertifikasi1)) {
    const c = havuz.find((x) => imzaSertifikasiTutar(s, x) === true);
    if (c) return c;
  }
  if (s.seri && s.verenDer) return havuz.find((c) => c.seri === s.seri && c.verenDer.equals(s.verenDer!)) ?? null;
  if (s.ski) return havuz.find((c) => c.ski === s.ski) ?? null;
  return null;
}

const tekOktet = (der: Buffer): Buffer | null => {
  try { const o = okuyucu(der); const d = dugum(o, 0); return d.tag === 0x04 && d.son === der.length ? Buffer.from(ic(o, d)) : null; } catch { return null; }
};

/** içeriğin özeti imzalı özniteliklerdeki messageDigest'le aynı mı (ayrık imzada içerik = ByteRange verisi; damgada TSTInfo) */
export function ozetDenetle(s: ImzaciBilgisi, parcalar: readonly Uint8Array[]): Sonuc {
  const ad = ozetAdi(s.ozetOid);
  if (!ad || !guvenliOzet(ad)) return "desteklenmiyor";
  const h = createHash(ad);
  for (const p of parcalar) h.update(p);
  const ozet = h.digest();
  if (!s.imzaliOzDer) return "desteklenmiyor";
  const md = s.imzaliOz.get(CMS_OID.ozet);
  if (!md || md.length !== 1) return "okunamadi";
  const deger = tekOktet(md[0]);
  if (!deger) return "okunamadi";
  return deger.equals(ozet) ? "tamam" : "bozuk";
}

/** imzalı öznitelikler üzerinde imza değeri (imzalı öznitelik yoksa doğrudan içerik — eski biçim) */
export function imzaDenetle(s: ImzaciBilgisi, anahtar: KeyObject, parcalar: readonly Uint8Array[] = []): Sonuc {
  const veri = s.imzaliOzDer ? Buffer.concat([Buffer.from([0x31]), s.imzaliOzDer.subarray(1)]) : Buffer.concat(parcalar.map((p) => Buffer.from(p)));
  return algoritmaDenetle(s.imzaOid, s.imzaParam, s.ozetOid, anahtar, veri, s.imza, false);
}

/** imza algoritması OID'iyle (+ PSS parametresi, özet algoritması yoksa varsayılan özet) imza değeri — OCSP ve iptal listesi de kullanır
    (sha1Izinli: makamın OCSP / liste imzası; belge imzası ve damga için hayır) */
export function algoritmaDenetle(imzaOid: string, param: Buffer | null, ozetOid: string | null, anahtar: KeyObject, veri: Uint8Array, imza: Uint8Array,
  sha1Izinli = true): Sonuc {
  const a = IMZA[imzaOid];
  if (!a) return "desteklenmiyor";
  const ozet = a.ozet ?? (ozetOid ? ozetAdi(ozetOid) : null);
  if (!ozet || (!sha1Izinli && a.tur !== "pss" && !guvenliOzet(ozet))) return "desteklenmiyor";
  try {
    if (a.tur === "pss") {
      const p = pssParam(param);
      if (!p || (!sha1Izinli && !guvenliOzet(p.ozet))) return "desteklenmiyor";
      return verify(p.ozet, veri, { key: anahtar, padding: constants.RSA_PKCS1_PSS_PADDING, saltLength: p.tuz }, imza) ? "tamam" : "bozuk";
    }
    if (a.tur === "rsa") return verify(ozet, veri, { key: anahtar, padding: constants.RSA_PKCS1_PADDING }, imza) ? "tamam" : "bozuk";
    return verify(ozet, veri, anahtar, imza) ? "tamam" : "bozuk";
  } catch {
    return "bozuk";
  }
}

/** RSASSA-PSS parametreleri: [0] özet (varsayılan SHA-1), [2] tuz uzunluğu (varsayılan 20) */
function pssParam(der: Buffer | null): { ozet: string; tuz: number } | null {
  let ozet = "sha1", tuz = 20;
  if (!der) return { ozet, tuz };
  try {
    const o = okuyucu(der);
    for (const c of cocuklar(o, bekle(dugum(o, 0), 0x30))) {
      if (c.tag === 0xa0) { const ad = ozetAdi(oidOku(o, cocuklar(o, cocuklar(o, c)[0])[0])); if (!ad) return null; ozet = ad; }
      if (c.tag === 0xa2) { const n = ic(o, bekle(cocuklar(o, c)[0], 0x02)); tuz = n.reduce((t, x) => t * 256 + x, 0); }
    }
    return tuz <= 1024 ? { ozet, tuz } : null;
  } catch { return null; }
}

/** signingCertificateV2 (ya da v1) varsa sertifikanın özeti onu tutuyor mu; yoksa null */
export function imzaSertifikasiTutar(s: ImzaciBilgisi, sert: Sertifika): boolean | null {
  const v2 = s.imzaliOz.get(CMS_OID.imzaSertifikasi2)?.[0], v1 = s.imzaliOz.get(CMS_OID.imzaSertifikasi1)?.[0];
  const der = v2 ?? v1;
  if (!der) return null;
  try {
    const o = okuyucu(der);
    const certs = cocuklar(o, bekle(cocuklar(o, bekle(dugum(o, 0), 0x30))[0], 0x30));
    const ilk = cocuklar(o, bekle(certs[0], 0x30));
    let ad = v2 ? "sha256" : "sha1", i = 0;
    if (v2 && ilk[0].tag === 0x30) { const x = ozetAdi(oidOku(o, cocuklar(o, ilk[0])[0])); if (!x) return null; ad = x; i = 1; }
    const beklenen = Buffer.from(ic(o, bekle(ilk[i], 0x04)));
    return createHash(ad).update(sert.der).digest().equals(beklenen);
  } catch { return null; }
}

/* ── ZAMAN DAMGASI (RFC 3161) ── */
export interface DamgaIcerigi {
  politika: string;
  izOzetOid: string;
  iz: Buffer;
  seri: string;
  zaman: string | null;
}

/** TSTInfo DER → içerik */
export function tstOku(der: Uint8Array): DamgaIcerigi {
  const o = okuyucu(der);
  const p = cocuklar(o, bekle(dugum(o, 0), 0x30));
  const politika = oidOku(o, p[1]);
  const [alg, iz] = cocuklar(o, bekle(p[2], 0x30));
  return {
    politika, izOzetOid: oidOku(o, cocuklar(o, bekle(alg, 0x30))[0]), iz: Buffer.from(ic(o, bekle(iz, 0x04))),
    seri: tamsayiHex(o, p[3]), zaman: zamanOku(o, bekle(p[4], 0x18)),
  };
}

export interface DamgaSonucu {
  zaman: string | null;
  /** damga sunucusunun sertifikası */
  tsa: Sertifika | null;
  /** sertifika damga sunucusu olarak kabul edilmediyse nedeni (imza "bozuk" olur) */
  tsaHatasi: string | null;
  politika: string | null;
  /** damganın kapsadığı veri (imza değeri ya da belge) damgadaki izle aynı mı */
  iz: Sonuc;
  /** damganın kendi imzası */
  imza: Sonuc;
  /** damganın içerik özeti (TSTInfo) */
  ozet: Sonuc;
}

/** TimeStampToken (ContentInfo DER) — `veri` damgalanan veridir (imza değeri ya da ByteRange) */
export function damgaDenetle(token: Uint8Array, veri: readonly Uint8Array[], ekSertifikalar: readonly Sertifika[] = []): DamgaSonucu {
  const bos: DamgaSonucu = { zaman: null, tsa: null, tsaHatasi: null, politika: null, iz: "okunamadi", imza: "okunamadi", ozet: "okunamadi" };
  let v: ImzaliVeri;
  try { v = imzaliVeriOku(token); } catch (e) { if (e instanceof BozukDer || e instanceof RangeError) return bos; throw e; }
  if (v.icerikTuru !== CMS_OID.tstBilgisi || !v.icerik) return bos;
  let t: DamgaIcerigi;
  try { t = tstOku(v.icerik); } catch (e) { if (e instanceof BozukDer || e instanceof RangeError || e instanceof TypeError) return bos; throw e; }
  const ad = ozetAdi(t.izOzetOid);
  let iz: Sonuc = "desteklenmiyor";
  if (guvenliOzet(ad)) { const h = createHash(ad!); for (const p of veri) h.update(p); iz = h.digest().equals(t.iz) ? "tamam" : "bozuk"; }
  const s = v.imzacilar[0];
  const tsa = imzaciSertifikasi(v, s, ekSertifikalar);
  /* damga sunucusu: sertifikası zaman damgası için (id-kp-timeStamping, RFC 3161 §2.3), damga anında geçerli, damga onun sertifikasına bağlı —
     imzalayan kendi anahtarıyla geriye tarihli "damga" basamaz */
  const tsaHatasi = !tsa ? null
    : !tsa.bilgi.zamanDamgasi ? "sertifika zaman damgası için değil"
      : !t.zaman || gecerliMi(tsa.bilgi, t.zaman) !== true ? "sertifika damga anında geçerli değil"
        : imzaSertifikasiTutar(s, tsa) === false ? "damganın sertifika bağı tutmuyor" : null;
  return {
    zaman: t.zaman, tsa, tsaHatasi, politika: t.politika, iz,
    ozet: ozetDenetle(s, [v.icerik]),
    imza: !tsa ? "okunamadi" : tsaHatasi ? "bozuk" : imzaDenetle(s, tsa.anahtar),
  };
}
