/* GERÇEK (KRİPTOGRAFİK) DENEME İMZASI (2026-10-17, IMZA-SERVISI.md ES1): uydurma sertifika makamı, 5070 işaretli uydurma imzalayan sertifikası,
   uydurma zaman damgası, OCSP cevabı ve iptal listesi; imzalar ve damgalar GERÇEKTEN doğrulanır (node:crypto). Gerçek kişi / kurum / sertifika yok.
   PDF ekleri ham metindir (çözümleyici tarar; xref doğruluğu burada aranmaz — artımlı yazıcı tests/yardimci/imza-uret/pdf-ek-yaz.ts). YALNIZ TEST
   VERİSİ: CMS kurulumu tests/yardimci/imza-uret/'ten (ürün kodu bu klasörleri içe aktaramaz — imza üretimi probata-sign'da; kilit
   tests/imza-ayrim.test.ts). */
import { createHash, generateKeyPairSync, sign, type KeyObject } from "node:crypto";
import { acik, cocuklar, dugum, genelZaman, ic, kume, mantiksal, oid, okuyucu, oktet, sira, tamsayi, tlv, utcZaman } from "../../src/server/imza/der.ts";
import { CMS_OID } from "../../src/server/imza/cms.ts";
import { OID, sertifikaOku } from "../../src/server/imza/sertifika.ts";
import { damgaOzniteligi, imzaliOznitelikler, imzaliVeriKur, type OzetAdi } from "./imza-uret/cms-yaz.ts";

export type AnahtarTuru = "rsa" | "ecdsa";
export interface Kimlik { der: Buffer; anahtar: KeyObject; acik: KeyObject; tur: AnahtarTuru; ad: Buffer }

const yeniAnahtar = (tur: AnahtarTuru) => tur === "rsa"
  ? generateKeyPairSync("rsa", { modulusLength: 2048 })
  : generateKeyPairSync("ec", { namedCurve: "prime256v1" });
const adYap = (cn: string, o?: string) => sira(
  kume(sira(oid("2.5.4.6"), tlv(0x13, Buffer.from("TR")))),
  ...(o ? [kume(sira(oid("2.5.4.10"), tlv(0x0c, Buffer.from(o, "utf8"))))] : []),
  kume(sira(oid("2.5.4.3"), tlv(0x0c, Buffer.from(cn, "utf8")))),
);
export const uzanti = (o: string, kritik: boolean, deger: Buffer) => sira(oid(o), ...(kritik ? [mantiksal(true)] : []), oktet(deger));
const imzaAlg = (tur: AnahtarTuru) => (tur === "rsa" ? sira(oid("1.2.840.113549.1.1.11"), Buffer.from([5, 0])) : sira(oid("1.2.840.10045.4.3.2")));
let seri = 0x5000;

export function sertifikaYap(p: {
  cn: string; o?: string; tur?: AnahtarTuru; veren?: Kimlik; ca?: boolean; nitelikli?: boolean; damga?: boolean; ocsp?: boolean;
  bas?: Date; son?: Date;
  /** aynı anahtarla ikinci sertifika (sertifika değiştirme denemesi) */
  ayniAnahtar?: Kimlik;
  /** ek uzantılar (tam Extension DER'leri — bozuk yapı denemesi) */
  ekUzanti?: Buffer[];
}): Kimlik {
  const tur = p.ayniAnahtar?.tur ?? p.tur ?? "rsa";
  const k = p.ayniAnahtar ? { privateKey: p.ayniAnahtar.anahtar, publicKey: p.ayniAnahtar.acik } : yeniAnahtar(tur);
  const ad = adYap(p.cn, p.o);
  const verenTur = p.veren?.tur ?? tur, verenAd = p.veren?.ad ?? ad, verenAnahtar = p.veren?.anahtar ?? k.privateKey;
  const uz: Buffer[] = [uzanti(OID.konuAnahtari, false, oktet(createHash("sha1").update(k.publicKey.export({ type: "spki", format: "der" })).digest()))];
  if (p.ca) {
    uz.push(uzanti(OID.temelKisit, true, sira(mantiksal(true))), uzanti(OID.anahtarKullanimi, true, tlv(0x03, Buffer.from([1, 0x06]))));
  } else if (p.damga) {
    uz.push(uzanti(OID.genisKullanim, true, sira(oid(OID.zamanDamgasiKullanimi))));
  } else if (p.ocsp) {
    uz.push(uzanti(OID.genisKullanim, false, sira(oid("1.3.6.1.5.5.7.3.9"))));
  } else {
    uz.push(
      uzanti(OID.anahtarKullanimi, true, tlv(0x03, Buffer.from([6, 0xc0]))),
      uzanti(OID.politikalar, false, sira(sira(oid("2.16.792.3.0.99.1")))),
      uzanti(OID.aia, false, sira(sira(oid(OID.ocsp), tlv(0x86, Buffer.from("http://ocsp.ornek.test"))))),
      uzanti(OID.crlDp, false, sira(sira(tlv(0xa0, tlv(0xa0, tlv(0x86, Buffer.from("http://depo.ornek.test/nes.crl"))))))),
    );
    if (p.nitelikli !== false) uz.push(uzanti(OID.qcStatements, false, sira(sira(oid(OID.qcUyum)), sira(oid(OID.nes5070), tlv(0x0c, Buffer.from("Deneme beyanı"))))));
  }
  uz.push(...(p.ekUzanti ?? []));
  const tbs = sira(
    acik(0, tamsayi(2)), tamsayi(seri++), imzaAlg(verenTur), verenAd,
    sira(utcZaman(p.bas ?? new Date("2026-01-01T00:00:00Z")), utcZaman(p.son ?? new Date("2036-12-31T23:59:59Z"))),
    ad, k.publicKey.export({ type: "spki", format: "der" }), acik(3, sira(...uz)),
  );
  const imza = sign(verenTur === "rsa" ? "sha256" : "sha256", tbs, verenAnahtar);
  return { der: sira(tbs, imzaAlg(verenTur), tlv(0x03, Buffer.from([0]), imza)), anahtar: k.privateKey, acik: k.publicKey, tur, ad };
}

/** deneme makamı + imzalayan + damga sunucusu */
export function denemeKimlikleri(tur: AnahtarTuru = "rsa", imzalayan = "AYŞE DENEME") {
  const kok = sertifikaYap({ cn: "Deneme Kök Sertifika Hizmet Sağlayıcısı", o: "Deneme ESHS", ca: true, tur: "ecdsa" });
  const ara = sertifikaYap({ cn: "Deneme Sertifika Hizmet Sağlayıcısı", o: "Deneme ESHS", ca: true, veren: kok, tur: "ecdsa" });
  const kisi = sertifikaYap({ cn: imzalayan, veren: ara, tur });
  const tsa = sertifikaYap({ cn: "Deneme Zaman Damgası Sunucusu", o: "Deneme ESHS", damga: true, veren: ara, tur: "ecdsa" });
  return { kok, ara, kisi, tsa };
}

/** RFC 3161 TimeStampToken: `veri`nin özetine damga */
export function damgaYap(veri: Buffer[], tsa: Kimlik, zincir: Kimlik[] = [], zaman = new Date("2026-10-17T09:00:00Z"), ozet: OzetAdi = "sha256"): Buffer {
  const h = createHash(ozet); for (const v of veri) h.update(v);
  return damgaIzYap(h.digest(), ozet, tsa, zincir, zaman);
}

const OZET_NO = { sha256: "2.16.840.1.101.3.4.2.1", sha384: "2.16.840.1.101.3.4.2.2", sha512: "2.16.840.1.101.3.4.2.3" } as const;
/** iz (özet) verilmiş damga; nonce istekteki tek kullanımlık sayı */
export function damgaIzYap(iz: Buffer, ozet: OzetAdi, tsa: Kimlik, zincir: Kimlik[] = [], zaman = new Date("2026-10-17T09:00:00Z"), nonce?: Buffer): Buffer {
  const tst = sira(
    tamsayi(1), oid("2.16.792.3.0.99.9"),
    sira(sira(oid(OZET_NO[ozet]), Buffer.from([5, 0])), oktet(iz)),
    tamsayi(seri++), genelZaman(zaman), ...(nonce ? [tamsayi(nonce)] : []),
  );
  const oz = imzaliOznitelikler({ belgeOzeti: createHash("sha256").update(tst).digest(), sertifikaDer: tsa.der, ozet: "sha256", icerikTuru: CMS_OID.tstBilgisi });
  const imza = sign("sha256", oz, tsa.anahtar);
  return imzaliVeriKur({ imzaliOz: oz, imzaDegeri: imza, sertifikaDer: tsa.der, ekSertifikalar: zincir.map((k) => k.der), ozet: "sha256", anahtarTuru: tsa.tur, icerikTuru: CMS_OID.tstBilgisi, icerik: tst });
}

/* ── İPTAL KANITI (ES2): uydurma OCSP cevabı ve iptal listesi — verenin (ya da verence yetkilendirilmiş OCSP imzacısının) anahtarıyla ── */
const seriOf = (k: Kimlik) => { const s = sertifikaOku(k.der); if (!s) throw new Error("sertifika"); return Buffer.from(s.seri.length % 2 ? `0${s.seri}` : s.seri, "hex"); };
const anahtarBitleri = (k: Kimlik) => {
  const spki = k.acik.export({ type: "spki", format: "der" });
  const o = okuyucu(new Uint8Array(spki));
  return Buffer.from(ic(o, cocuklar(o, dugum(o, 0))[1]).subarray(1));
};
/** OCSP imzacısı sertifikası (genişletilmiş anahtar kullanımı id-kp-OCSPSigning) */
export const ocspImzacisiYap = (veren: Kimlik) => sertifikaYap({ cn: "Deneme OCSP İmzacısı", o: "Deneme ESHS", veren, tur: "ecdsa", ocsp: true });
/** zaman: thisUpdate · sonraki: nextUpdate (verilmezse zaman + 7 gün) · iptalZamani: "iptal"de revocationTime (verilmezse zaman; "bozuk" → okunamayan
    zaman — 2026-10-23 iptal anı kilidi) */
export function ocspCevabiYap(s: Kimlik, veren: Kimlik, p: {
  durum?: "gecerli" | "iptal" | "bilinmiyor"; zaman?: Date; sonraki?: Date; iptalZamani?: Date | "bozuk"; imzalayan?: Kimlik; ekSertifika?: Kimlik[];
  idVeren?: Kimlik; seri?: Buffer; basariKodu?: number;
} = {}): Buffer {
  if (p.basariKodu) return sira(tlv(0x0a, Buffer.from([p.basariKodu])));
  const zaman = p.zaman ?? new Date("2026-10-17T09:05:00Z"), imzalayan = p.imzalayan ?? veren, idv = p.idVeren ?? veren;
  const certId = sira(sira(oid("1.3.14.3.2.26"), Buffer.from([5, 0])), oktet(createHash("sha1").update(idv.ad).digest()),
    oktet(createHash("sha1").update(anahtarBitleri(idv)).digest()), tamsayi(p.seri ?? seriOf(s)));
  const iptalAni = p.iptalZamani === "bozuk" ? BOZUK_ZAMAN : genelZaman(p.iptalZamani ?? zaman);
  const durum = p.durum === "iptal" ? tlv(0xa1, iptalAni) : p.durum === "bilinmiyor" ? Buffer.from([0x82, 0]) : Buffer.from([0x80, 0]);
  const tbs = sira(acik(1, imzalayan.ad), genelZaman(zaman), sira(sira(certId, durum, genelZaman(zaman), acik(0, genelZaman(p.sonraki ?? new Date(zaman.getTime() + 7 * 864e5))))));
  const imza = sign("sha256", tbs, imzalayan.anahtar);
  const temel = sira(tbs, imzaAlg(imzalayan.tur), tlv(0x03, Buffer.from([0]), imza), ...(p.ekSertifika?.length ? [acik(0, sira(...p.ekSertifika.map((k) => k.der)))] : []));
  return sira(tlv(0x0a, Buffer.from([0])), acik(0, sira(oid("1.3.6.1.5.5.7.48.1.1"), oktet(temel))));
}
/** biçimi tutmayan GeneralizedTime (okunamayan iptal anı) */
const BOZUK_ZAMAN = tlv(0x18, Buffer.from("bozuk-zaman", "latin1"));
/** iptal listesi (CRL v2) — verenin anahtarıyla; iptaller listede. p.sonraki: nextUpdate (verilmezse zaman + 7 gün) · p.iptalZamani: revocationDate
    (verilmezse zaman; "bozuk" → okunamayan zaman) */
export function crlYap(veren: Kimlik, iptaller: Kimlik[] = [], zaman = new Date("2026-10-17T08:00:00Z"), imzalayan: Kimlik = veren,
  p: { sonraki?: Date; iptalZamani?: Date | "bozuk" } = {}): Buffer {
  const iptalAni = p.iptalZamani === "bozuk" ? BOZUK_ZAMAN : utcZaman(p.iptalZamani ?? zaman);
  const tbs = sira(tamsayi(1), imzaAlg(imzalayan.tur), veren.ad, utcZaman(zaman), utcZaman(p.sonraki ?? new Date(zaman.getTime() + 7 * 864e5)),
    ...(iptaller.length ? [sira(...iptaller.map((k) => sira(tamsayi(seriOf(k)), iptalAni)))] : []));
  return sira(tbs, imzaAlg(imzalayan.tur), tlv(0x03, Buffer.from([0]), sign("sha256", tbs, imzalayan.anahtar)));
}

/* ── PDF ── */
export const TABAN_PDF = Buffer.from(
  "%PDF-1.7\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n" +
  "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] >>\nendobj\ntrailer\n<< /Root 1 0 R /Size 4 >>\n%%EOF\n", "latin1");
const YER = 24_000;
const sayi = (n: number) => String(n).padEnd(10, " ");

/** PDF'e ham imza nesnesi ekler; `icerik` kapsanan parçalardan /Contents'i (DER) üretir */
export function imzaEkle(pdf: Buffer, no: number, icerik: (parcalar: Buffer[]) => Buffer,
  p: { tur?: "Sig" | "DocTimeStamp"; altFiltre?: string; m?: string; kuyruk?: string } = {}): Buffer {
  const tur = p.tur ?? "Sig", alt = p.altFiltre ?? (tur === "Sig" ? "ETSI.CAdES.detached" : "ETSI.RFC3161");
  const bas = `${no} 0 obj\n<< /Type /${tur} /Filter /Adobe.PPKLite /SubFilter /${alt} ${p.m ? `/M (${p.m}) ` : ""}/ByteRange [0 ${"#".repeat(10)} ${"#".repeat(10)} ${"#".repeat(10)}] /Contents <`;
  const son = `> >>\nendobj\n${p.kuyruk ?? ""}%%EOF\n`;
  const a = pdf.length + bas.length, b = a + YER;
  /* "<" a - 1'de, onaltılık a … b - 1, ">" b'de; son b'den başlar */
  const toplam = b + son.length;
  const c = toplam - (b + 1);
  const metin = bas.replace(`[0 ${"#".repeat(10)} ${"#".repeat(10)} ${"#".repeat(10)}]`, `[0 ${sayi(a - 1)} ${sayi(b + 1)} ${sayi(c)}]`);
  if (metin.length !== bas.length) throw new Error("yer tutucu uzunluğu değişti");
  const dolgu = Buffer.from("0".repeat(YER), "latin1");
  const sonuc = Buffer.concat([pdf, Buffer.from(metin, "latin1"), dolgu, Buffer.from(son, "latin1")]);
  const parcalar = [sonuc.subarray(0, a - 1), sonuc.subarray(b + 1)];
  const der = icerik(parcalar);
  const hex = der.toString("hex");
  if (hex.length > YER) throw new Error("imza yer tutucuya sığmadı");
  sonuc.write(hex, a, "latin1");
  return sonuc;
}

/** izi bozuk damga için: damgalanan, kapsanması gereken veri değil */
const BASKA_VERI = Buffer.from("damgalanan başka veri", "utf8");
/** PAdES imzası: kişinin anahtarıyla; istenirse imza zaman damgası (damgaBozuk: damganın izi imza değerini tutmaz — 2026-10-23 imza anı kilidi) */
export function pdfImzala(pdf: Buffer, no: number, k: ReturnType<typeof denemeKimlikleri>, p: { ozet?: OzetAdi; damga?: boolean; damgaZamani?: Date; damgaBozuk?: boolean; m?: string; kisi?: Kimlik } = {}): Buffer {
  const ozet = p.ozet ?? "sha256", kisi = p.kisi ?? k.kisi;
  return imzaEkle(pdf, no, (parcalar) => {
    const h = createHash(ozet); for (const x of parcalar) h.update(x);
    const oz = imzaliOznitelikler({ belgeOzeti: h.digest(), sertifikaDer: kisi.der, ozet });
    const imza = sign(ozet, oz, kisi.anahtar);
    return imzaliVeriKur({
      imzaliOz: oz, imzaDegeri: imza, sertifikaDer: kisi.der, ekSertifikalar: [k.ara.der, k.kok.der], ozet, anahtarTuru: kisi.tur,
      imzasizOz: p.damga ? [damgaOzniteligi(damgaYap([p.damgaBozuk ? BASKA_VERI : imza], k.tsa, [k.ara], p.damgaZamani))] : [],
    });
  }, { m: p.m ?? "D:20261017120000+03'00'" });
}

/** belge zaman damgası (ETSI.RFC3161); p.bozuk: damganın izi kapsanan baytları tutmaz (2026-10-23 imza anı kilidi) */
export const belgeDamgala = (pdf: Buffer, no: number, k: ReturnType<typeof denemeKimlikleri>, zaman?: Date, p: { bozuk?: boolean } = {}) =>
  imzaEkle(pdf, no, (parcalar) => damgaYap(p.bozuk ? [BASKA_VERI] : parcalar, k.tsa, [k.ara], zaman), { tur: "DocTimeStamp" });

/** DSS sözlüğü + kataloğun güncel hâli: kişinin OCSP cevabı (verenin imzası) ve verenin iptal listesi, gerçek akışlar olarak */
export function dssEkle(pdf: Buffer, no: number, k: ReturnType<typeof denemeKimlikleri>, ocsp = 1, crl = 1): Buffer {
  return kanitliDss(pdf, no, { ocsp: Array.from({ length: ocsp }, () => ocspCevabiYap(k.kisi, k.ara)), crl: Array.from({ length: crl }, () => crlYap(k.ara)) });
}
/** DSS sözlüğü verilen kanıtlarla (OCSP cevapları, iptal listeleri — sırasıyla; 2026-10-23 iptal anı kilidi) */
export function kanitliDss(pdf: Buffer, no: number, kanit: { ocsp?: Buffer[]; crl?: Buffer[] }): Buffer {
  const o = kanit.ocsp ?? [], c = kanit.crl ?? [], ocsp = o.length, crl = c.length;
  const akislar = [...o, ...c];
  const ref = (n: number, s: number) => Array.from({ length: s }, (_, i) => `${n + i} 0 R`).join(" ");
  const parcalar: Buffer[] = [pdf, Buffer.from(`${no} 0 obj\n<< /OCSPs [${ref(no + 1, ocsp)}] /CRLs [${ref(no + 1 + ocsp, crl)}] /Certs [] >>\nendobj\n`, "latin1")];
  akislar.forEach((b, i) => parcalar.push(Buffer.from(`${no + 1 + i} 0 obj\n<< /Length ${b.length} >>\nstream\n`, "latin1"), b, Buffer.from("\nendstream\nendobj\n", "latin1")));
  parcalar.push(Buffer.from(`1 0 obj\n<< /Type /Catalog /Pages 2 0 R /DSS ${no} 0 R >>\nendobj\n%%EOF\n`, "latin1"));
  return Buffer.concat(parcalar);
}

/* ── UYGULAMANIN YÜKLEME TESTLERİ İÇİN (ES1 yükleme denetimi): imzasız PDF + artımlı imza bölümü — yeni nesnede imza sözlüğü (gerçek CMS), trailer özgün kökü
   gösterir (src/modules/raporlar/imza-pdf.ts beyaz listesi). Makam / damga sunucusu süreç başına bir kez, kişi sertifikası ad başına bir kez
   (EC anahtar — hızlı). ── */
let ortak: ReturnType<typeof denemeKimlikleri> | null = null;
const kisiler = new Map<string, Kimlik>();
function kimlikler(cn: string, nitelikli = true): ReturnType<typeof denemeKimlikleri> {
  ortak ??= denemeKimlikleri("ecdsa", "DENEME İMZACI");
  const anahtar = `${nitelikli ? "n" : "x"}:${cn}`;
  let kisi = kisiler.get(anahtar);
  if (!kisi) { kisi = sertifikaYap({ cn, veren: ortak.ara, tur: "ecdsa", nitelikli }); kisiler.set(anahtar, kisi); }
  return { ...ortak, kisi };
}
/** imzasız PDF'in gerçek imzalı hâli (cn: sertifikadaki ad; teknik yönetici imzası akışı adı karşılaştırır) */
export function imzaEki(ham: Uint8Array, cn = "DENEME İMZACI", p: { no?: number; damga?: boolean; kisi?: Kimlik; nitelikli?: boolean } = {}): Uint8Array {
  const pdf = Buffer.from(ham);
  const kok = [...pdf.toString("latin1").matchAll(/\/Root\s+(\d+\s+\d+\s+R)/g)].at(-1)?.[1] ?? "1 0 R";
  const k = kimlikler(cn, p.nitelikli !== false), kisi = p.kisi ?? k.kisi;
  const govde = Buffer.concat([pdf, Buffer.from("\n", "latin1")]);
  /* yeni nesne numarası: belgedeki en büyüğün bir fazlası (önceki imzanın nesnesi yeniden tanımlanmaz — beyaz liste) */
  const no = p.no ?? Math.max(9989, ...[...pdf.toString("latin1").matchAll(/(\d{1,7})\s+\d{1,5}\s+obj\b/g)].map((m) => Number(m[1]))) + 1;
  return new Uint8Array(imzaEkle(govde, no, (parcalar) => {
    const h = createHash("sha256"); for (const x of parcalar) h.update(x);
    const oz = imzaliOznitelikler({ belgeOzeti: h.digest(), sertifikaDer: kisi.der, ozet: "sha256" });
    const imza = sign("sha256", oz, kisi.anahtar);
    return imzaliVeriKur({
      imzaliOz: oz, imzaDegeri: imza, sertifikaDer: kisi.der, ekSertifikalar: [k.ara.der, k.kok.der], ozet: "sha256", anahtarTuru: kisi.tur,
      imzasizOz: p.damga ? [damgaOzniteligi(damgaYap([imza], k.tsa, [k.ara], new Date()))] : [],
    });
  }, { m: "D:20261017120000+03'00'", kuyruk: `trailer << /Root ${kok} /Prev 0 >>\n` }));
}
