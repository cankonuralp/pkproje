/* CMS SignedData KURULUMU (IMZA-SERVISI.md ES2 — kendi imzamız; ES1 kilit testleri de bunu kullanır). Saf. Kart (ya da mobil imza) yalnız
   İMZALI ÖZNİTELİKLERİN özetini imzalar; özniteliklerin kendisi (içerik türü, belge özeti, imzalayanın sertifikasına bağ — ETSI EN 319 122
   CAdES-B) sunucuda kurulur, karttan dönen imza değeriyle SignedData'ya dizilir. PAdES: imza zamanı (signingTime) imzalı öznitelikte YOK —
   zaman /M ve zaman damgasından. */
import { createHash } from "node:crypto";
import { acik, kume, oid, oktet, sira, tamsayi, tlv } from "./der.ts";
import { CMS_OID, OZET_OID } from "./cms.ts";
import { sertifikaOku } from "./sertifika.ts";

export type OzetAdi = "sha256" | "sha384" | "sha512";
const IMZA_OID: Record<"rsa" | "ecdsa", Record<OzetAdi, string>> = {
  rsa: { sha256: "1.2.840.113549.1.1.11", sha384: "1.2.840.113549.1.1.12", sha512: "1.2.840.113549.1.1.13" },
  ecdsa: { sha256: "1.2.840.10045.4.3.2", sha384: "1.2.840.10045.4.3.3", sha512: "1.2.840.10045.4.3.4" },
};

const algId = (o: string, param = true) => (param ? sira(oid(o), Buffer.from([0x05, 0x00])) : sira(oid(o)));
const oznitelik = (o: string, deger: Buffer) => sira(oid(o), kume(deger));

/** imzalı öznitelikler — SET OF (DER, 0x31 etiketli; karta imzalatılacak bayt dizisi bunun kendisi) */
export function imzaliOznitelikler(p: { belgeOzeti: Buffer; sertifikaDer: Buffer; ozet: OzetAdi; icerikTuru?: string }): Buffer {
  const s = sertifikaOku(p.sertifikaDer);
  if (!s) throw new Error("imzalayanın sertifikası okunamadı");
  const sertOzeti = createHash("sha256").update(p.sertifikaDer).digest();
  /* ESSCertIDv2: özet algoritması SHA-256 (varsayılan, yazılmaz) + sertifika özeti + IssuerSerial (veren genel adı + seri) */
  const verenSeri = sira(sira(tlv(0xa4, s.verenDer)), tamsayi(Buffer.from(s.seri.length % 2 ? `0${s.seri}` : s.seri, "hex")));
  const imzaSertifikasi = sira(sira(sira(oktet(sertOzeti), verenSeri)));
  return kume(
    oznitelik(CMS_OID.icerikTuru, oid(p.icerikTuru ?? CMS_OID.veri)),
    oznitelik(CMS_OID.ozet, oktet(p.belgeOzeti)),
    oznitelik(CMS_OID.imzaSertifikasi2, imzaSertifikasi),
  );
}

/** SignedData (ContentInfo DER) — ayrık imza (PAdES) ya da kapsüllü içerik (zaman damgası) */
export function imzaliVeriKur(p: {
  imzaliOz: Buffer;
  imzaDegeri: Buffer;
  sertifikaDer: Buffer;
  /** zincir (imzalayan dışındaki sertifikalar) */
  ekSertifikalar?: Buffer[];
  ozet: OzetAdi;
  anahtarTuru: "rsa" | "ecdsa";
  /** imzasız öznitelikler (ör. imza zaman damgası) — tam Attribute DER'leri */
  imzasizOz?: Buffer[];
  icerikTuru?: string;
  icerik?: Buffer;
}): Buffer {
  const s = sertifikaOku(p.sertifikaDer);
  if (!s) throw new Error("imzalayanın sertifikası okunamadı");
  if (p.imzaliOz[0] !== 0x31) throw new Error("imzalı öznitelikler SET değil");
  const ozetAlg = algId(OZET_OID[p.ozet]);
  const imzaAlg = p.anahtarTuru === "rsa" ? algId(IMZA_OID.rsa[p.ozet]) : algId(IMZA_OID.ecdsa[p.ozet], false);
  const imzaci = sira(
    tamsayi(1),
    sira(s.verenDer, tamsayi(Buffer.from(s.seri.length % 2 ? `0${s.seri}` : s.seri, "hex"))),
    ozetAlg,
    Buffer.concat([Buffer.from([0xa0]), p.imzaliOz.subarray(1)]),
    imzaAlg,
    oktet(p.imzaDegeri),
    ...(p.imzasizOz?.length ? [Buffer.concat([Buffer.from([0xa1]), kume(...p.imzasizOz).subarray(1)])] : []),
  );
  const kaps = p.icerik ? sira(oid(p.icerikTuru ?? CMS_OID.veri), acik(0, oktet(p.icerik))) : sira(oid(p.icerikTuru ?? CMS_OID.veri));
  const veri = sira(
    tamsayi(p.icerik ? 3 : 1),
    kume(ozetAlg),
    kaps,
    tlv(0xa0, p.sertifikaDer, ...(p.ekSertifikalar ?? [])),
    kume(imzaci),
  );
  return sira(oid(CMS_OID.imzaliVeri), acik(0, veri));
}

/** imza zaman damgasını imzasız özniteliğe çevirir (id-aa-signatureTimeStampToken) */
export const damgaOzniteligi = (token: Buffer) => oznitelik(CMS_OID.imzaDamgasi, token);
