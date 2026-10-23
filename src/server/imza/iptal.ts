/* İPTAL DURUMU — OCSP (RFC 6960) VE İPTAL LİSTESİ (CRL, RFC 5280) ÇÖZÜMLEMESİ (2026-10-17; IMZA-SERVISI.md — yükleme denetimi). Saf; ağ yok. İmzalı
   belgenin DSS'indeki kanıt (pdf-imzalar.ts) okunur: cevabın imzası (verenin ya da verence yetkilendirilmiş OCSP imzacısının anahtarıyla), CertID'nin
   veren izleri ve sertifikanın durumu denetlenir. Kanıtı ağdan ALMAK (OCSP isteği, iptal listesi indirme) imza üretiminin parçası — probata-sign'da.
   2026-10-23 (probata-sign denetimi 2026-10-18, YÜKSEK — aynı hata burada da vardı): kanıtın ZAMANI imza anıyla karşılaştırılır (iptalKarari). Her
   kanıtın üretim anı (thisUpdate), süresi (nextUpdate) ve iptal anı (OCSP RevokedInfo revocationTime, iptal listesinde revocationDate) okunur;
   karar saf, ağ yok. Kaynak: probata-sign src/imza/iptal.ts (aynı kural, bu deponun kendi kodu — içe aktarma yok). */
import { createHash } from "node:crypto";
import { BozukDer, bekle, cocuklar, dugum, ic, oidOku, okuyucu, tamsayiHex, tum, zamanOku, type Dugum, type Okuyucu } from "./der.ts";
import { algoritmaDenetle } from "./cms.ts";
import { sertifikaOku, type Sertifika } from "./sertifika.ts";

export type IptalDurumu = "gecerli" | "iptal" | "bilinmiyor";
export class IptalHatasi extends Error {}
const OCSP_TEMEL = "1.3.6.1.5.5.7.48.1.1", OCSP_IMZA_KULLANIMI = "1.3.6.1.5.5.7.3.9", SHA1 = "1.3.14.3.2.26";
const ID_OZET: Record<string, string> = { [SHA1]: "sha1", "2.16.840.1.101.3.4.2.1": "sha256", "2.16.840.1.101.3.4.2.2": "sha384", "2.16.840.1.101.3.4.2.3": "sha512" };

/** sertifikanın açık anahtarının bit dizisi (SubjectPublicKeyInfo'nun BIT STRING'i, kullanılmayan bit baytı hariç) */
function anahtarBitleri(s: Sertifika): Buffer {
  const spki = s.anahtar.export({ type: "spki", format: "der" });
  const o = okuyucu(new Uint8Array(spki));
  const p = cocuklar(o, bekle(dugum(o, 0), 0x30));
  return Buffer.from(ic(o, bekle(p[1], 0x03)).subarray(1));
}

/** zaman: thisUpdate (durumun bilindiği an) · sonraki: nextUpdate · iptalZamani: "iptal"de revocationTime (okunamazsa null — iptal her an sayılır) */
export interface OcspSonucu { durum: IptalDurumu; zaman: string | null; sonraki: string | null; iptalZamani: string | null; imza: "tamam" | "bozuk" | "desteklenmiyor" }

/** OCSPResponse DER → bu sertifikanın durumu (cevabın imzası denetlenir) */
export function ocspCevabi(der: Uint8Array, s: Sertifika, veren: Sertifika): OcspSonucu {
  try {
    const o = okuyucu(der);
    const p = cocuklar(o, bekle(dugum(o, 0), 0x30));
    if (ic(o, bekle(p[0], 0x0a))[0] !== 0) throw new IptalHatasi("OCSP cevabı başarısız");
    const rb = cocuklar(o, bekle(cocuklar(o, bekle(p[1], 0xa0))[0], 0x30));
    if (oidOku(o, rb[0]) !== OCSP_TEMEL) throw new IptalHatasi("OCSP cevap türü desteklenmiyor");
    const t = okuyucu(new Uint8Array(ic(o, bekle(rb[1], 0x04))));
    const temel = cocuklar(t, bekle(dugum(t, 0), 0x30));
    const veri = bekle(temel[0], 0x30), alg = cocuklar(t, bekle(temel[1], 0x30)), imza = ic(t, bekle(temel[2], 0x03)).subarray(1);
    /* imzacı: cevaptaki sertifika (verence yetkilendirilmiş OCSP imzacısı) ya da verenin kendisi */
    const ekler: Sertifika[] = [];
    if (temel[3]?.tag === 0xa0) for (const c of cocuklar(t, bekle(cocuklar(t, temel[3])[0], 0x30))) { const x = sertifikaOku(tum(t, c)); if (x) ekler.push(x); }
    let imzaSonuc: OcspSonucu["imza"] = "bozuk";
    for (const aday of [veren, ...ekler]) {
      if (aday !== veren) {
        let yetkili = false;
        try { yetkili = aday.x.checkIssued(veren.x) && aday.x.verify(veren.anahtar) && ocspImzacisi(aday); } catch { yetkili = false; }
        if (!yetkili) continue;
      }
      const r = algoritmaDenetle(oidOku(t, alg[0]), alg[1] && alg[1].tag !== 0x05 ? Buffer.from(tum(t, alg[1])) : null, null, aday.anahtar, tum(t, veri), imza);
      if (r === "tamam") { imzaSonuc = r; break; }
      if (r === "desteklenmiyor") imzaSonuc = r;
    }
    const vp = cocuklar(t, veri);
    const cevaplar = cocuklar(t, bekle(vp.find((x, i) => x.tag === 0x30 && i > 0 && vp[i - 1].tag === 0x18) ?? vp[vp.length - 1], 0x30));
    for (const c of cevaplar) {
      const sp = cocuklar(t, bekle(c, 0x30));
      const id = cocuklar(t, bekle(sp[0], 0x30));
      if (tamsayiHex(t, id[3]) !== s.seri) continue;
      /* CertID'nin veren izleri (adın ve anahtarın özeti, cevabın kendi algoritmasıyla) — başka verenin aynı seri numaralı sertifikası değil */
      const izAdi = ID_OZET[oidOku(t, cocuklar(t, bekle(id[0], 0x30))[0])];
      if (!izAdi) continue;
      if (!Buffer.from(ic(t, bekle(id[1], 0x04))).equals(createHash(izAdi).update(s.verenDer).digest())) continue;
      if (!Buffer.from(ic(t, bekle(id[2], 0x04))).equals(createHash(izAdi).update(anahtarBitleri(veren)).digest())) continue;
      const durumEtiketi = sp[1].tag;
      const durum: IptalDurumu = durumEtiketi === 0x80 ? "gecerli" : durumEtiketi === 0xa1 ? "iptal" : "bilinmiyor";
      const sonraki = sp[3]?.tag === 0xa0 ? zamanOku(t, cocuklar(t, sp[3])[0]) : null;
      /* RevokedInfo ::= [1] IMPLICIT SEQUENCE { revocationTime GeneralizedTime, revocationReason [0] OPTIONAL } */
      let iptalZamani: string | null = null;
      if (durumEtiketi === 0xa1) iptalZamani = zamanYoksaNull(() => zamanOku(t, cocuklar(t, sp[1])[0]));
      return { durum, zaman: zamanOku(t, sp[2]), sonraki, iptalZamani, imza: imzaSonuc };
    }
    return { durum: "bilinmiyor", zaman: null, sonraki: null, iptalZamani: null, imza: imzaSonuc };
  } catch (e) {
    if (e instanceof BozukDer || e instanceof RangeError) throw new IptalHatasi("OCSP cevabı okunamadı");
    throw e;
  }
}

/** okunamayan iptal anı null (iptalKarari onu "iptal her an" sayar) — bozuk yapı kanıtı düşürmez */
function zamanYoksaNull(oku: () => string | null): string | null {
  try { return oku(); } catch (e) { if (e instanceof BozukDer || e instanceof RangeError || e instanceof TypeError) return null; throw e; }
}

/** sertifika OCSP imzası için yetkilendirilmiş mi (genişletilmiş anahtar kullanımı id-kp-OCSPSigning) */
function ocspImzacisi(s: Sertifika): boolean {
  const o = okuyucu(new Uint8Array(s.der));
  const tbs = cocuklar(o, bekle(cocuklar(o, bekle(dugum(o, 0), 0x30))[0], 0x30));
  const uz = tbs.find((d) => d.tag === 0xa3);
  if (!uz) return false;
  for (const u of cocuklar(o, bekle(cocuklar(o, uz)[0], 0x30))) {
    const a = cocuklar(o, u);
    if (oidOku(o, a[0]) !== "2.5.29.37") continue;
    const io = okuyucu(new Uint8Array(ic(o, a[a.length - 1])));
    return cocuklar(io, dugum(io, 0)).some((k: Dugum) => oidOku(io, k) === OCSP_IMZA_KULLANIMI);
  }
  return false;
}

/** zaman: thisUpdate · sonraki: nextUpdate · iptalZamani: listede ise revocationDate (okunamazsa null) */
export interface CrlSonucu { durum: IptalDurumu; zaman: string | null; sonraki: string | null; iptalZamani: string | null; imza: "tamam" | "bozuk" | "desteklenmiyor" }

/** CertificateList DER → bu sertifikanın durumu (listenin imzası verenin anahtarıyla) */
export function crlDenetle(der: Uint8Array, s: Sertifika, veren: Sertifika): CrlSonucu {
  try {
    const o: Okuyucu = okuyucu(der, 5_000_000);
    const p = cocuklar(o, bekle(dugum(o, 0), 0x30));
    const tbs = bekle(p[0], 0x30), alg = cocuklar(o, bekle(p[1], 0x30)), imza = ic(o, bekle(p[2], 0x03)).subarray(1);
    const imzaSonuc = algoritmaDenetle(oidOku(o, alg[0]), alg[1] && alg[1].tag !== 0x05 ? Buffer.from(tum(o, alg[1])) : null, null, veren.anahtar, tum(o, tbs), imza);
    const t = cocuklar(o, tbs);
    let i = t[0].tag === 0x02 ? 1 : 0;
    i++; /* algoritma */
    const verenAdi = Buffer.from(tum(o, bekle(t[i++], 0x30)));
    if (!verenAdi.equals(s.verenDer)) return { durum: "bilinmiyor", zaman: null, sonraki: null, iptalZamani: null, imza: imzaSonuc === "desteklenmiyor" ? "desteklenmiyor" : "bozuk" };
    const zaman = zamanOku(o, t[i++]);
    const sonraki = t[i] && (t[i].tag === 0x17 || t[i].tag === 0x18) ? zamanOku(o, t[i++]) : null;
    let durum: IptalDurumu = "gecerli", iptalZamani: string | null = null;
    if (t[i]?.tag === 0x30) {
      for (const r of cocuklar(o, t[i])) {
        const g = cocuklar(o, r);
        if (tamsayiHex(o, g[0]) !== s.seri) continue;
        /* revokedCertificates: SEQUENCE { userCertificate, revocationDate Time, crlEntryExtensions OPTIONAL } */
        durum = "iptal";
        iptalZamani = zamanYoksaNull(() => zamanOku(o, g[1]));
        break;
      }
    }
    return { durum, zaman, sonraki, iptalZamani, imza: imzaSonuc === "tamam" ? "tamam" : imzaSonuc === "desteklenmiyor" ? "desteklenmiyor" : "bozuk" };
  } catch (e) {
    if (e instanceof BozukDer || e instanceof RangeError) throw new IptalHatasi("iptal listesi okunamadı");
    throw e;
  }
}

/** belgedeki (DSS) imzası doğrulanmış, bu sertifikaya ait bir iptal kanıtı: ne dediği ve ne zaman (pdf-imzalar.ts toplar) */
export interface IptalKaniti {
  tur: "ocsp" | "crl";
  durum: IptalDurumu;
  /** kanıtın üretildiği an: OCSP cevabının / iptal listesinin thisUpdate'i */
  zaman: string | null;
  /** nextUpdate (yoksa null) */
  sonraki: string | null;
  /** "iptal"de iptal anı (okunamazsa null) */
  iptalZamani: string | null;
}

/** ISO zaman → saniyeye indirilmiş ms (DER zamanları saniyelik); okunamazsa null */
const saniye = (iso: string | null): number | null => { if (!iso) return null; const t = Date.parse(iso); return Number.isNaN(t) ? null : Math.floor(t / 1000) * 1000; };

/** İMZA ANINDA İPTAL DURUMU (2026-10-23; probata-sign denetimi 2026-10-18, YÜKSEK: kanıtın zamanı imza anıyla hiç karşılaştırılmıyordu — imzadan aylar
    önceki "geçerli" OCSP cevabı ya da süresi imzadan önce biten iptal listesi iptal edilmiş sertifikayı "geçerli" gösteriyordu; aynı DSS'teki iptal
    listesinin "iptal" kararı ilk sağlam OCSP cevabıyla eziliyordu). `an`: imza anı (pdf-imzalar.ts seçer: sağlam imza damgası, yoksa imzayı kapsayan
    en erken sağlam belge damgası, yoksa çözüm anı). Zamanlar saniyeye indirilir. Kural:
    1. sağlam herhangi bir kanıt "iptal" diyor ve iptal anı imza anından önce ya da ona eşitse (ya da iptal anı okunamıyorsa) → "iptal";
       "geçerli" diyen başka bir kanıt bunu EZEMEZ;
    2. iptal anı imza anından SONRA olan "iptal" kanıtı imza anında iptal olmadığını gösterir → "gecerli";
    3. "geçerli" diyen kanıt yalnız imza anında ya da SONRA üretilmişse (thisUpdate ≥ an) ve süresi imza anından önce bitmemişse (nextUpdate yoksa
       ya da ≥ an) sayılır — daha önce üretilmiş kanıt imza anını kanıtlamaz (ETSI EN 319 102-1: imza anından sonra üretilmiş iptal bilgisi) →
       "gecerli";
    4. hiçbiri yoksa null (kanıt yok). "bilinmiyor" diyen kanıt sayılmaz; imza anı okunamazsa null. */
export function iptalKarari(kanitlar: readonly IptalKaniti[], an: string): "gecerli" | "iptal" | null {
  const A = saniye(an);
  if (A === null) return null;
  let gecerli = false;
  for (const k of kanitlar) {
    if (k.durum !== "iptal") continue;
    const ia = saniye(k.iptalZamani);
    if (ia === null || ia <= A) return "iptal";
    gecerli = true;
  }
  for (const k of kanitlar) {
    if (k.durum !== "gecerli") continue;
    const z = saniye(k.zaman), s = saniye(k.sonraki);
    if (z !== null && z >= A && (k.sonraki === null || (s !== null && s >= A))) gecerli = true;
  }
  return gecerli ? "gecerli" : null;
}
