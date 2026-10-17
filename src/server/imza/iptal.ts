/* İPTAL DURUMU — OCSP (RFC 6960) VE İPTAL LİSTESİ (CRL, RFC 5280) (IMZA-SERVISI.md ES2 — imza motoru, 2026-10-17). İmza anında sertifikanın iptal edilmediğinin
   kanıtı belgeye (DSS) gömülür; sonradan sorulduğunda süresi biten sertifika için bu cevap alınamayabilir. Saf çözümleme + enjekte edilen ağ
   çağrısı: istek kurulur, cevabın imzası (verenin ya da verence yetkilendirilmiş OCSP imzacısının anahtarıyla) ve sertifikanın durumu denetlenir.
   Ham cevap DER'i olduğu gibi saklanır (DSS'e o girer). */
import { createHash } from "node:crypto";
import { BozukDer, bekle, cocuklar, dugum, ic, oidOku, okuyucu, tamsayiHex, tum, zamanOku, type Dugum, type Okuyucu } from "./der.ts";
import { oktet, oid, sira, tamsayi } from "./der.ts";
import { algoritmaDenetle } from "./cms.ts";
import { sertifikaOku, type Sertifika } from "./sertifika.ts";
import type { Getir } from "./zaman-damgasi.ts";

export type IptalDurumu = "gecerli" | "iptal" | "bilinmiyor";
export class IptalHatasi extends Error {}
const OCSP_TEMEL = "1.3.6.1.5.5.7.48.1.1", OCSP_IMZA_KULLANIMI = "1.3.6.1.5.5.7.3.9", SHA1 = "1.3.14.3.2.26";
const OCSP_SINIR = 256 * 1024, CRL_SINIR = 32 * 1024 * 1024;
const ID_OZET: Record<string, string> = { [SHA1]: "sha1", "2.16.840.1.101.3.4.2.1": "sha256", "2.16.840.1.101.3.4.2.2": "sha384", "2.16.840.1.101.3.4.2.3": "sha512" };

/** sertifikanın açık anahtarının bit dizisi (SubjectPublicKeyInfo'nun BIT STRING'i, kullanılmayan bit baytı hariç) */
function anahtarBitleri(s: Sertifika): Buffer {
  const spki = s.anahtar.export({ type: "spki", format: "der" });
  const o = okuyucu(new Uint8Array(spki));
  const p = cocuklar(o, bekle(dugum(o, 0), 0x30));
  return Buffer.from(ic(o, bekle(p[1], 0x03)).subarray(1));
}
const seriBayt = (hex: string) => Buffer.from(hex.length % 2 ? `0${hex}` : hex, "hex");

/** OCSPRequest DER (SHA-1 CertID — sunucuların ortak beklentisi) */
export function ocspIstegi(s: Sertifika, veren: Sertifika): Buffer {
  const certId = sira(
    sira(oid(SHA1), Buffer.from([0x05, 0x00])),
    oktet(createHash("sha1").update(s.verenDer).digest()),
    oktet(createHash("sha1").update(anahtarBitleri(veren)).digest()),
    tamsayi(seriBayt(s.seri)),
  );
  return sira(sira(sira(sira(certId))));
}

export interface OcspSonucu { durum: IptalDurumu; zaman: string | null; sonraki: string | null; imza: "tamam" | "bozuk" | "desteklenmiyor" }

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
      return { durum, zaman: zamanOku(t, sp[2]), sonraki, imza: imzaSonuc };
    }
    return { durum: "bilinmiyor", zaman: null, sonraki: null, imza: imzaSonuc };
  } catch (e) {
    if (e instanceof BozukDer || e instanceof RangeError) throw new IptalHatasi("OCSP cevabı okunamadı");
    throw e;
  }
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

export interface CrlSonucu { durum: IptalDurumu; zaman: string | null; sonraki: string | null; imza: "tamam" | "bozuk" | "desteklenmiyor" }

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
    if (!verenAdi.equals(s.verenDer)) return { durum: "bilinmiyor", zaman: null, sonraki: null, imza: imzaSonuc === "desteklenmiyor" ? "desteklenmiyor" : "bozuk" };
    const zaman = zamanOku(o, t[i++]);
    const sonraki = t[i] && (t[i].tag === 0x17 || t[i].tag === 0x18) ? zamanOku(o, t[i++]) : null;
    let durum: IptalDurumu = "gecerli";
    if (t[i]?.tag === 0x30) for (const r of cocuklar(o, t[i])) if (tamsayiHex(o, cocuklar(o, r)[0]) === s.seri) { durum = "iptal"; break; }
    return { durum, zaman, sonraki, imza: imzaSonuc === "tamam" ? "tamam" : imzaSonuc === "desteklenmiyor" ? "desteklenmiyor" : "bozuk" };
  } catch (e) {
    if (e instanceof BozukDer || e instanceof RangeError) throw new IptalHatasi("iptal listesi okunamadı");
    throw e;
  }
}

/** ağdan: önce OCSP, olmazsa iptal listesi — dönen ham DER'ler DSS'e girer. Hiçbiri doğrulanamazsa hata. */
export async function iptalKaniti(s: Sertifika, veren: Sertifika, getir: Getir = globalThis.fetch as unknown as Getir, sure = 15_000):
  Promise<{ ocsp?: Buffer; crl?: Buffer; durum: IptalDurumu }> {
  const oku = async (adres: string, istek: Parameters<Getir>[1], sinir: number) => {
    if (!/^https?:\/\//i.test(adres)) throw new IptalHatasi("desteklenmeyen adres");
    const c = await getir(adres, { ...istek, signal: AbortSignal.timeout(sure) });
    if (!c.ok) throw new IptalHatasi(`${adres} ${c.status}`);
    const b = Buffer.from(await c.arrayBuffer());
    if (b.length > sinir) throw new IptalHatasi("cevap çok büyük");
    return b;
  };
  for (const adres of s.bilgi.ocsp) {
    try {
      const der = await oku(adres, { method: "POST", headers: { "content-type": "application/ocsp-request" }, body: ocspIstegi(s, veren) }, OCSP_SINIR);
      const r = ocspCevabi(der, s, veren);
      if (r.imza === "tamam" && r.durum !== "bilinmiyor") return { ocsp: der, durum: r.durum };
    } catch { /* sıradaki yol */ }
  }
  for (const adres of s.bilgi.crl) {
    try {
      const der = await oku(adres, { method: "GET", headers: {} }, CRL_SINIR);
      const r = crlDenetle(der, s, veren);
      if (r.imza === "tamam") return { crl: der, durum: r.durum };
    } catch { /* sıradaki yol */ }
  }
  throw new IptalHatasi(`${s.bilgi.ad ?? "sertifika"} için iptal kanıtı alınamadı`);
}
