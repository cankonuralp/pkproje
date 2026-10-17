/* X.509 SERTİFİKA BİLGİSİ (IMZA-SERVISI.md ES1). Saf. İmzalayanın / zaman damgası sunucusunun sertifikasından kimlik, geçerlilik ve 5070
   işaretleri: nitelikli sertifika = qcStatements içinde QcCompliance (0.4.0.1862.1.1) ya da Türkiye'nin 5070 NES beyanı (2.16.792.1.61.0.1.5070.1.1)
   — incelenen gerçek bir nitelikli sertifikada ikisi de vardı (2026-10-17, depoya girmedi). İptal adresleri (OCSP, CRL) bilgi olarak okunur (kanıtı ağdan
   almak imza üretiminin işi — probata-sign'da). */
import { X509Certificate, type KeyObject } from "node:crypto";
import { bekle, cocuklar, dugum, ic, oidOku, okuyucu, tamsayiHex, tum, zamanOku, type Dugum, type Okuyucu } from "./der.ts";

export const OID = {
  qcStatements: "1.3.6.1.5.5.7.1.3",
  qcUyum: "0.4.0.1862.1.1",
  qcSscd: "0.4.0.1862.1.4",
  nes5070: "2.16.792.1.61.0.1.5070.1.1",
  politikalar: "2.5.29.32",
  aia: "1.3.6.1.5.5.7.1.1",
  ocsp: "1.3.6.1.5.5.7.48.1",
  caVeren: "1.3.6.1.5.5.7.48.2",
  crlDp: "2.5.29.31",
  anahtarKullanimi: "2.5.29.15",
  genisKullanim: "2.5.29.37",
  zamanDamgasiKullanimi: "1.3.6.1.5.5.7.3.8",
  temelKisit: "2.5.29.19",
  konuAnahtari: "2.5.29.14",
  verenAnahtari: "2.5.29.35",
} as const;

export interface SertifikaBilgisi {
  /** konu adı (CN) */
  ad: string | null;
  /** kurum (O) */
  kurum: string | null;
  /** veren (CN) */
  veren: string | null;
  seri: string;
  gecerlilikBas: string | null;
  gecerlilikSon: string | null;
  /** 5070 nitelikli elektronik sertifika işareti (qcStatements) */
  nitelikli: boolean;
  /** inkâr edilemezlik (nonRepudiation) anahtar kullanımı */
  inkarEdilemez: boolean;
  /** zaman damgası kullanımı (EKU timeStamping) */
  zamanDamgasi: boolean;
  ca: boolean;
  politikalar: string[];
  ocsp: string[];
  crl: string[];
  caVeren: string[];
  parmakIzi: string;
}

export interface Sertifika {
  x: X509Certificate;
  /** açık anahtar (okunurken çözülür: çözülemeyen ya da aşırı büyük anahtarlı sertifika okunmaz) */
  anahtar: KeyObject;
  der: Buffer;
  /** TBSCertificate'deki veren adının DER'i (IssuerAndSerialNumber eşleşmesi) */
  verenDer: Buffer;
  seri: string;
  /** konu anahtarı tanımlayıcısı (SubjectKeyIdentifier) — onaltılık */
  ski: string | null;
  /** veren anahtarı tanımlayıcısı (AuthorityKeyIdentifier keyIdentifier) — onaltılık; veren adayını daraltır */
  aki: string | null;
  bilgi: SertifikaBilgisi;
}

/* aşırı büyük anahtar (ör. dev açık üslü RSA) her doğrulamada saniyeler yer — saldırganın sertifika kümesinde işlem yükü (inceleme 2026-10-17) */
const RSA_EN_COK = 8192, US_EN_COK = 2n ** 32n;

const adAlani = (metin: string, alan: string) => {
  const m = new RegExp(`^${alan}=(.+)$`, "m").exec(metin)?.[1];
  return m ? m.replace(/^"|"$/g, "").trim() || null : null;
};

/** genel ad (GeneralName) içindeki URI'ler ([6] IA5String) — yapı içinde özyinelemeli arar */
function urilar(o: Okuyucu, d: Dugum | undefined, derinlik = 0): string[] {
  if (!d || derinlik > 8) return [];
  if (d.tag === 0x86) return [Buffer.from(ic(o, d)).toString("latin1")];
  if (!(d.tag & 0x20)) return [];
  return cocuklar(o, d).flatMap((c) => urilar(o, c, derinlik + 1));
}

/** sertifika DER'i → Sertifika; okunamazsa null */
export function sertifikaOku(der: Uint8Array): Sertifika | null {
  try {
    const x = new X509Certificate(Buffer.from(der));
    const anahtar = x.publicKey;
    const ay = anahtar.asymmetricKeyDetails;
    if (anahtar.asymmetricKeyType === "rsa" || anahtar.asymmetricKeyType === "rsa-pss") {
      if (!ay?.modulusLength || ay.modulusLength > RSA_EN_COK || (ay.publicExponent ?? 0n) > US_EN_COK) return null;
    }
    const o = okuyucu(new Uint8Array(der));
    const kok = bekle(dugum(o, 0), 0x30);
    const tbs = bekle(cocuklar(o, kok)[0], 0x30);
    const p = cocuklar(o, tbs);
    let i = p[0]?.tag === 0xa0 ? 1 : 0;
    const seri = tamsayiHex(o, p[i++]);
    i++; /* imza algoritması */
    const veren = bekle(p[i++], 0x30);
    const gecerlilik = cocuklar(o, bekle(p[i++], 0x30));
    const bilgi: SertifikaBilgisi = {
      ad: adAlani(x.subject, "CN"), kurum: adAlani(x.subject, "O"), veren: adAlani(x.issuer, "CN"), seri,
      gecerlilikBas: gecerlilik[0] ? zamanOku(o, gecerlilik[0]) : null, gecerlilikSon: gecerlilik[1] ? zamanOku(o, gecerlilik[1]) : null,
      nitelikli: false, inkarEdilemez: false, zamanDamgasi: false, ca: x.ca, politikalar: [], ocsp: [], crl: [], caVeren: [],
      parmakIzi: x.fingerprint256.replace(/:/g, ""),
    };
    let ski: string | null = null, aki: string | null = null;
    const uzantilar = p.find((d) => d.tag === 0xa3);
    if (uzantilar) {
      for (const u of cocuklar(o, bekle(cocuklar(o, uzantilar)[0], 0x30))) {
        const a = cocuklar(o, bekle(u, 0x30));
        const id = oidOku(o, a[0]);
        const deger = a[a.length - 1];
        if (deger.tag !== 0x04) continue;
        const icO = okuyucu(new Uint8Array(ic(o, deger)));
        const d = dugum(icO, 0);
        if (id === OID.qcStatements) {
          for (const q of cocuklar(icO, d)) {
            const qid = oidOku(icO, cocuklar(icO, q)[0]);
            if (qid === OID.qcUyum || qid === OID.nes5070) bilgi.nitelikli = true;
          }
        } else if (id === OID.politikalar) {
          for (const pi of cocuklar(icO, d)) bilgi.politikalar.push(oidOku(icO, cocuklar(icO, pi)[0]));
        } else if (id === OID.aia) {
          for (const ad of cocuklar(icO, d)) {
            const [yontem, yer] = cocuklar(icO, ad);
            if (!yontem || !yer) continue;
            const y = oidOku(icO, yontem), l = urilar(icO, yer);
            if (y === OID.ocsp) bilgi.ocsp.push(...l); else if (y === OID.caVeren) bilgi.caVeren.push(...l);
          }
        } else if (id === OID.crlDp) {
          bilgi.crl.push(...urilar(icO, d));
        } else if (id === OID.anahtarKullanimi && d.tag === 0x03) {
          const bitler = ic(icO, d);
          bilgi.inkarEdilemez = bitler.length > 1 && (bitler[1] & 0x40) !== 0;
        } else if (id === OID.genisKullanim) {
          bilgi.zamanDamgasi = cocuklar(icO, d).some((k) => oidOku(icO, k) === OID.zamanDamgasiKullanimi);
        } else if (id === OID.konuAnahtari && d.tag === 0x04) {
          ski = Buffer.from(ic(icO, d)).toString("hex").toUpperCase();
        } else if (id === OID.verenAnahtari && d.tag === 0x30) {
          const k = cocuklar(icO, d).find((c) => c.tag === 0x80);
          if (k) aki = Buffer.from(ic(icO, k)).toString("hex").toUpperCase();
        }
      }
    }
    return { x, anahtar, der: Buffer.from(der), verenDer: Buffer.from(tum(o, veren)), seri, ski, aki, bilgi };
  } catch {
    /* saldırganın denetlediği girdi: her ayrıştırma hatası "okunamadı" (TypeError dahil — eksik alanlı yapı; inceleme 2026-10-17) */
    return null;
  }
}

/** doğrulama bütçesi: imza başına anahtar işlemi sınırı (saldırganın kümesinde aday çoğaltarak işlem yükü yok) */
export interface Butce { n: number }
export const yeniButce = (n = 64): Butce => ({ n });

/** sertifika havuzunda verenini bul: sertifika makamı (temel kısıt cA) olan, adı ve — varsa — anahtar tanımlayıcısı tutan, imzası o verenin
    anahtarıyla doğrulanan */
export function vereniBul(s: Sertifika, havuz: readonly Sertifika[], butce: Butce = yeniButce()): Sertifika | null {
  for (const v of havuz) {
    if (v === s || v.der.equals(s.der) || !v.bilgi.ca) continue;
    if (s.aki && v.ski && s.aki !== v.ski) continue;
    if (!s.x.checkIssued(v.x)) continue;
    if (butce.n-- <= 0) return null;
    try { if (s.x.verify(v.anahtar)) return v; } catch { /* uyumsuz anahtar */ }
  }
  return null;
}

/** kendinden imzalı mı (kök) */
export function kendindenImzali(s: Sertifika, butce: Butce = yeniButce()): boolean {
  try { return s.x.checkIssued(s.x) && butce.n-- > 0 && s.x.verify(s.anahtar); } catch { return false; }
}

/** zincir: imzalayandan köke (en çok 8 halka) */
export function zincirKur(s: Sertifika, havuz: readonly Sertifika[], butce: Butce = yeniButce()): Sertifika[] {
  const l = [s];
  for (let k = 0; k < 8; k++) {
    const son = l[l.length - 1];
    if (kendindenImzali(son, butce)) break;
    const v = vereniBul(son, havuz, butce);
    if (!v || l.includes(v)) break;
    l.push(v);
  }
  return l;
}

/** zaman o sertifikanın geçerlilik aralığında mı (aralık okunamadıysa null) */
export function gecerliMi(b: SertifikaBilgisi, zaman: string): boolean | null {
  if (!b.gecerlilikBas || !b.gecerlilikSon) return null;
  const t = Date.parse(zaman);
  return t >= Date.parse(b.gecerlilikBas) && t <= Date.parse(b.gecerlilikSon);
}
