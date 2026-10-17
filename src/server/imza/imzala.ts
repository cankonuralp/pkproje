/* KENDİ İMZAMIZ — SUNUCU TARAFI (IMZA-SERVISI.md ES2 — imza motoru, 2026-10-17). İki adım, arada kart:
   1. imzaHazirla: belgeye imza yer tutucusu (boş e-imza alanı varsa o), kapsanan baytların özeti, imzalayanın sertifikasıyla imzalı öznitelikler
      (CAdES-B) → karta / mobil imzaya gidecek bayt dizisi ("imzalanacak") ve onun özeti. Dosya bilgisayardan dışarı çıkmaz; karta yalnız bu gider.
   2. imzaTamamla: karttan dönen imza değeri → SignedData (sertifika zinciriyle) → /Contents. İstenirse imza zaman damgası (imzasız öznitelik).
   Bitmiş belge çözümleyiciden (pdf-imzalar.ts) geçmeden kullanılmaz — çağıran denetler (ES1 yükleme denetimiyle aynı). Uzun süreli doğrulama
   eki ayrı (ltv.ts). Hazırlık durumunu (yer tutuculu belge, imzalı öznitelikler) saklamak çağıranın işi; hiçbir şey veritabanına yazılmaz. */
import { createHash } from "node:crypto";
import { damgaOzniteligi, imzaliOznitelikler, imzaliVeriKur, type OzetAdi } from "./cms-yaz.ts";
import { sertifikaOku } from "./sertifika.ts";
import { icerikYaz, yerTutucuEkle, type YerTutucu } from "./yer-tutucu.ts";

export interface ImzaHazirligi {
  yer: YerTutucu;
  ozet: OzetAdi;
  /** karta imzalatılacak bayt dizisi (imzalı öznitelikler, DER SET) */
  imzalanacak: Buffer;
  /** imzalanacak dizinin özeti (kart yalnız özet imzalıyorsa) */
  imzalanacakOzeti: Buffer;
  sertifikaDer: Buffer;
  anahtarTuru: "rsa" | "ecdsa";
}

export function imzaHazirla(pdf: Uint8Array, p: { sertifikaDer: Buffer; ozet?: OzetAdi; alan?: string; neden?: string; zaman?: Date }): ImzaHazirligi {
  const s = sertifikaOku(p.sertifikaDer);
  if (!s) throw new Error("imzalayanın sertifikası okunamadı");
  const tur = s.anahtar.asymmetricKeyType;
  if (tur !== "rsa" && tur !== "ec") throw new Error(`desteklenmeyen anahtar türü: ${tur}`);
  const ozet = p.ozet ?? "sha256";
  const yer = yerTutucuEkle(pdf, { tur: "imza", alan: p.alan, neden: p.neden, zaman: p.zaman });
  const h = createHash(ozet); for (const x of yer.parcalar) h.update(x);
  const imzalanacak = imzaliOznitelikler({ belgeOzeti: h.digest(), sertifikaDer: p.sertifikaDer, ozet });
  return { yer, ozet, imzalanacak, imzalanacakOzeti: createHash(ozet).update(imzalanacak).digest(), sertifikaDer: p.sertifikaDer, anahtarTuru: tur === "rsa" ? "rsa" : "ecdsa" };
}

export function imzaTamamla(h: ImzaHazirligi, p: { imzaDegeri: Buffer; zincir?: Buffer[]; damga?: Buffer }): Buffer {
  const cms = imzaliVeriKur({
    imzaliOz: h.imzalanacak, imzaDegeri: p.imzaDegeri, sertifikaDer: h.sertifikaDer, ekSertifikalar: p.zincir ?? [], ozet: h.ozet,
    anahtarTuru: h.anahtarTuru, imzasizOz: p.damga ? [damgaOzniteligi(p.damga)] : [],
  });
  return icerikYaz(h.yer, cms);
}
