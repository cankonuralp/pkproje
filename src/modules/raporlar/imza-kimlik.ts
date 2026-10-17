/* İMZALAYANIN ADI (2026-10-17; teknik yönetici imzası — reisim önerinin ayrıntılarını onayladı: "İki farklı kişi imzalayacağı için imzanın
   sertifikasındaki adı kişinin adıyla karşılaştırmayı öneriyorum. Tutmazsa yükleme reddedilir; böylece denetçi iki imzayı birden kendisi atamaz").
   Saf: imza sözlüğünün /Contents'i (CMS SignedData — DER ya da belirsiz uzunluklu BER) açılır, imzalayanın sertifikası SignerInfo'nun veren + seri
   numarasıyla bulunur (bulunamazsa sertifikalar içindeki TEK uç sertifika), konu adı (CN) döner. KRİPTOGRAFİK DOĞRULAMA YOK (imza değeri, zincir,
   iptal — K7): amaç yanlış kişinin imzasının yüklenmesini yakalamak. Saldırganın denetlediği girdi: derinlik ve düğüm sayısı sınırlı, tek geçiş. */
import { X509Certificate } from "node:crypto";

interface Dugum { tag: number; bas: number; ic: number; icSon: number; son: number }
class Bozuk extends Error {}
const DERINLIK = 32, DUGUM = 20_000;

/** BER/DER düğümü (kısa / uzun / belirsiz uzunluk); sayac paylaşılır — en çok DUGUM düğüm */
function oku(b: Uint8Array, i: number, sayac: { n: number }, derinlik = 0): Dugum {
  if (derinlik > DERINLIK || ++sayac.n > DUGUM || i + 2 > b.length) throw new Bozuk();
  const tag = b[i];
  if ((tag & 0x1f) === 0x1f) throw new Bozuk();
  let j = i + 1, len = b[j++];
  if (len === 0x80) {
    if (!(tag & 0x20)) throw new Bozuk();
    let k = j;
    while (!(b[k] === 0 && b[k + 1] === 0)) { if (k >= b.length) throw new Bozuk(); k = oku(b, k, sayac, derinlik + 1).son; }
    return { tag, bas: i, ic: j, icSon: k, son: k + 2 };
  }
  if (len & 0x80) {
    const n = len & 0x7f;
    if (n < 1 || n > 4) throw new Bozuk();
    len = 0;
    for (let x = 0; x < n; x++) len = len * 256 + b[j++];
  }
  if (j + len > b.length) throw new Bozuk();
  return { tag, bas: i, ic: j, icSon: j + len, son: j + len };
}
function cocuklar(b: Uint8Array, d: Dugum, sayac: { n: number }): Dugum[] {
  const l: Dugum[] = [];
  for (let k = d.ic; k < d.icSon;) { const c = oku(b, k, sayac); l.push(c); k = c.son; }
  return l;
}
const hex = (b: Uint8Array) => Buffer.from(b).toString("hex").toUpperCase().replace(/^0+(?=.)/, "");

/** imza içeriğinden (onaltılık CMS) imzalayanın sertifikasındaki ad (CN); okunamazsa null */
export function imzalayanAdi(icerik: string): string | null {
  try {
    if (!/^[0-9a-f]*$/i.test(icerik) || icerik.length % 2) return null;
    const b = new Uint8Array(Buffer.from(icerik, "hex"));
    const s = { n: 0 };
    const kok = oku(b, 0, s);
    const sd = cocuklar(b, kok, s).find((x) => x.tag === 0xa0);
    if (!sd) return null;
    const imzaVerisi = cocuklar(b, sd, s)[0];
    if (!imzaVerisi || imzaVerisi.tag !== 0x30) return null;
    const p = cocuklar(b, imzaVerisi, s);
    const sertler: X509Certificate[] = [];
    const kume = p.find((x) => x.tag === 0xa0);
    if (kume) for (const c of cocuklar(b, kume, s)) {
      if (c.tag !== 0x30) continue;
      try { sertler.push(new X509Certificate(Buffer.from(b.subarray(c.bas, c.son)))); } catch { /* okunamayan sertifika atlanır */ }
    }
    /* imzalayan: SignerInfo'nun veren + seri numarası (IssuerAndSerialNumber) */
    const imzacilar = [...p].reverse().find((x) => x.tag === 0x31);
    const bilgi = imzacilar ? cocuklar(b, imzacilar, s)[0] : undefined;
    const sid = bilgi ? cocuklar(b, bilgi, s)[1] : undefined;
    let sert: X509Certificate | undefined;
    if (sid?.tag === 0x30) {
      const seri = cocuklar(b, sid, s)[1];
      if (seri?.tag === 0x02) {
        const h = hex(b.subarray(seri.ic, seri.icSon));
        sert = sertler.find((x) => x.serialNumber.toUpperCase().replace(/^0+(?=.)/, "") === h);
      }
    }
    if (!sert) { const uc = sertler.filter((x) => !x.ca); if (uc.length === 1) sert = uc[0]; }
    const cn = sert ? /^CN=(.+)$/m.exec(sert.subject)?.[1] : undefined;
    return cn ? cn.replace(/^"|"$/g, "").trim() || null : null;
  } catch (e) {
    if (e instanceof Bozuk || e instanceof RangeError) return null;
    throw e;
  }
}

const HARF: Record<string, string> = { Ç: "C", Ğ: "G", İ: "I", I: "I", Ö: "O", Ş: "S", Ü: "U", Â: "A", Î: "I", Û: "U" };
/** adın sözcükleri: Türkçe büyük harfe, Türkçe harfler sade Latin'e, harf dışı ayraç */
const sozcukler = (s: string) => s.toLocaleUpperCase("tr-TR").replace(/[ÇĞİIÖŞÜÂÎÛ]/g, (c) => HARF[c] ?? c).normalize("NFD").replace(/[̀-ͯ]/g, "")
  .split(/[^A-Z]+/).filter(Boolean);
/** sertifikadaki ad kişinin adı mı: kısa olanın bütün sözcükleri uzun olanda (ikinci ad bir tarafta eksik olabilir) — büyük / küçük harf ve Türkçe
    harf farkı sayılmaz; iki taraf da en az bir sözcük */
export function adUyuyor(sertifikadaki: string, kisininki: string): boolean {
  const a = sozcukler(sertifikadaki), b = sozcukler(kisininki);
  if (!a.length || !b.length) return false;
  const [kisa, uzun] = a.length <= b.length ? [a, b] : [b, a];
  const kalan = [...uzun];
  return kisa.every((x) => { const i = kalan.indexOf(x); if (i < 0) return false; kalan.splice(i, 1); return true; });
}

/** eklenen imzaların hepsi kişinin mi: hayırsa nedeni (ekranda), evetse null. Hiç imza yoksa ya da biri okunamazsa red. */
export function imzaciNedeni(icerikler: readonly string[], kisi: string): string | null {
  if (!icerikler.length) return "PDF'te imza bulunamadı.";
  for (const c of icerikler) {
    const ad = imzalayanAdi(c);
    if (!ad) return "PDF'teki imzanın sertifikası okunamadı; imzalayan anlaşılamadı.";
    if (!adUyuyor(ad, kisi)) return `PDF'teki imza ${ad} adına; bu raporu ${kisi} imzalamalı.`;
  }
  return null;
}
