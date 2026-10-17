/* YALNIZ TEST VERİSİ ÜRETİR; ürün kodu bu klasörü import edemez — imza üretimi probata-sign'da (reisim 2026-10-17: "probatanın kaynak kodlarına
   bunları bulaştırma"; kilit tests/imza-ayrim.test.ts). ARTIMLI PAdES İMZASI, iki adım (gerçek imza araçlarının yaptığı gibi):
   1. imzaHazirla: belgeye imza yer tutucusu (boş e-imza alanı varsa o), kapsanan baytların özeti, imzalayanın sertifikasıyla imzalı öznitelikler
      (CAdES-B) → imzalanacak bayt dizisi ve onun özeti;
   2. imzaTamamla: imza değeri (testte yazılım anahtarıyla) → SignedData (sertifika zinciriyle) → /Contents; istenirse imza zaman damgası.
   Testler bununla imzalı deneme PDF'i üretir; probata'nın okuyucusu (src/server/imza/pdf-imzalar.ts) ve yükleme denetimleri (src/modules/raporlar/
   imza-pdf.ts yapı + src/server/imza/yukleme.ts kriptografi) onları doğrular. src/server/imza/imzala.ts'ten taşındı (davranış aynı). */
import { createHash } from "node:crypto";
import { sertifikaOku } from "../../../src/server/imza/sertifika.ts";
import { damgaOzniteligi, imzaliOznitelikler, imzaliVeriKur, type OzetAdi } from "./cms-yaz.ts";
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
