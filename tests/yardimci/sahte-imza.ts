/* SAHTE E-İMZA (2026-10-17, teknik yönetici imzası — src/modules/raporlar/imza-kimlik.ts): testlerde imzalı PDF'in ekine konan imza sözlüğünün
   /Contents'i — CMS SignedData; içinde CN'i verilen adla UYDURMA, kendinden imzalı X.509 sertifika ve onu gösteren SignerInfo (veren + seri no).
   İmza değeri anlamsız (denetim kriptografik doğrulama yapmaz — K7). Gerçek kişi / sertifika yok. Yalnız node:crypto. */
import { createHash, generateKeyPairSync, sign } from "node:crypto";

const uzunluk = (n: number) => (n < 0x80 ? [n] : n < 0x100 ? [0x81, n] : n < 0x10000 ? [0x82, n >> 8, n & 0xff] : [0x83, n >> 16, (n >> 8) & 0xff, n & 0xff]);
const tlv = (tag: number, ...ic: Buffer[]) => { const g = Buffer.concat(ic); return Buffer.concat([Buffer.from([tag, ...uzunluk(g.length)]), g]); };
const sira = (...ic: Buffer[]) => tlv(0x30, ...ic);
const kume = (...ic: Buffer[]) => tlv(0x31, ...ic);
function oid(s: string) {
  const p = s.split(".").map(Number), l = [40 * p[0] + p[1]];
  for (const x of p.slice(2)) { const b = [x & 0x7f]; for (let y = x >> 7; y; y >>= 7) b.unshift((y & 0x7f) | 0x80); l.push(...b); }
  return tlv(0x06, Buffer.from(l));
}
const tamsayi = (n: number) => { const h = n.toString(16).padStart(2, "0"), b = Buffer.from(h.length % 2 ? `0${h}` : h, "hex"); return tlv(0x02, b[0] & 0x80 ? Buffer.concat([Buffer.from([0]), b]) : b); };
const ad = (cn: string) => sira(kume(sira(oid("2.5.4.3"), tlv(0x0c, Buffer.from(cn, "utf8")))));
const ECDSA = sira(oid("1.2.840.10045.4.3.2")), SHA256 = sira(oid("2.16.840.1.101.3.4.2.1"));
const anahtar = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
const VEREN = ad("Deneme Sertifika Hizmet Saglayicisi");
let seriSayac = 4096;

/** CN'i ad olan uydurma sertifika (DER) ve seri numarası */
export function sahteSertifika(cn: string): { der: Buffer; seri: number } {
  const seri = seriSayac++;
  const tbs = sira(tlv(0xa0, tamsayi(2)), tamsayi(seri), ECDSA, VEREN,
    sira(tlv(0x17, Buffer.from("260101000000Z")), tlv(0x17, Buffer.from("361231235959Z"))), ad(cn),
    anahtar.publicKey.export({ type: "spki", format: "der" }));
  return { der: sira(tbs, ECDSA, tlv(0x03, Buffer.from([0]), sign("sha256", tbs, anahtar.privateKey))), seri };
}

/** imza sözlüğünün /Contents'i (onaltılık): CMS SignedData — sertifikalar [0] içinde bu adın sertifikası (+ istenirse ek bir sertifika), SignerInfo
    onu veren + seri numarasıyla gösterir */
export function sahteImzaIcerigi(cn: string, ek: string[] = []): string {
  const s = sahteSertifika(cn), ekler = ek.map((x) => sahteSertifika(x).der);
  const imzaci = sira(tamsayi(1), sira(VEREN, tamsayi(s.seri)), SHA256, ECDSA, tlv(0x04, createHash("sha256").update(cn).digest()));
  const veri = sira(tamsayi(1), kume(SHA256), sira(oid("1.2.840.113549.1.7.1")), tlv(0xa0, ...ekler, s.der), kume(imzaci));
  return sira(oid("1.2.840.113549.1.7.2"), tlv(0xa0, veri)).toString("hex");
}

/** imzalı PDF'in ekine konacak imza sözlüğü nesnesi */
export const sahteImzaSozlugu = (no: number, cn: string) =>
  `${no} 0 obj << /Type /Sig /Filter /Adobe.PPKLite /SubFilter /ETSI.CAdES.detached /ByteRange [0 10 20 30] /Contents <${sahteImzaIcerigi(cn)}> >> endobj\n`;
