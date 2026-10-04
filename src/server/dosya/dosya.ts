/* DOSYA — yükleme ve indirme mantığı (09-A1, A2, A4). Uç (src/app/api/dosya/[id]/route.ts) ve modüller yalnız buradan geçer.
   · Yükleme: tür baytlardan, sınır sunucuda, EXIF silinir; anahtar tek üreticiden; kayıt ve iz aynı işlemde (izYaz).
   · İndirme: dosya satırı RLS altında (başka firmanın dosyası "yok"); sonra dosyanın bağlı olduğu KAYDI görme yetkisi o modülün
     erişim denetiminden sorulur. Erişim denetimi kaydedilmemiş modülün dosyası kimseye açılmaz (güvenli varsayılan → "yok").
   Yanıt "yok" ile "yetkisiz" ayrımı yapmaz (dosyanın varlığı sızmaz). */
import { createHash, randomUUID } from "node:crypto";
import type { Sorgulayici } from "../db/kiraci.ts";
import { izYaz } from "../db/yazici.ts";
import { dosyaAnahtari } from "./anahtar.ts";
import type { Depo } from "./depo.ts";
import { jpegTemizle, pngTemizle, SINIR, turBul, TURLER, type DosyaTuru } from "./tur.ts";

/** indiren kişi (oturumdan) */
export interface Indiren { id: string; roller: readonly string[] }
/** modül başına: bu kişi bu kaydı görebilir mi (RLS altında, aynı işlemde) */
export type ErisimDenetimi = (db: Sorgulayici, kisi: Indiren, kayitId: string) => Promise<boolean>;
export type ErisimKaydi = Readonly<Record<string, ErisimDenetimi>>;

export type YuklemeSonucu =
  | { tamam: true; id: string; ad: string; tur: DosyaTuru; boyut: number }
  | { tamam: false; neden: "tur" | "buyuk" | "bos" | "bozuk" };

const AD_TEMIZ = (ad: string) => ad.normalize("NFC").replace(/[\u0000-\u001f\u007f/\\]/g, " ").replace(/\s+/g, " ").trim().slice(0, 200) || "dosya";

export async function dosyaYukle(db: Sorgulayici, depo: Depo, p: {
  firmaId: string; modul: string; kayitId: string; ad: string; bayt: Uint8Array; izinli: readonly DosyaTuru[]; kim: string; yukleyen?: string;
}): Promise<YuklemeSonucu> {
  if (p.bayt.length === 0) return { tamam: false, neden: "bos" };
  const tur = turBul(p.bayt, p.izinli);
  if (!tur) return { tamam: false, neden: "tur" };
  if (p.bayt.length > SINIR[tur]) return { tamam: false, neden: "buyuk" };
  let icerik: Uint8Array;
  try { icerik = tur === "jpeg" ? jpegTemizle(p.bayt) : tur === "png" ? pngTemizle(p.bayt) : p.bayt; } catch { return { tamam: false, neden: "bozuk" }; }
  const id = randomUUID();
  const anahtar = dosyaAnahtari({ firmaId: p.firmaId, modul: p.modul, kayitId: p.kayitId, dosyaId: id });
  const ad = AD_TEMIZ(p.ad);
  /* önce depo, sonra kayıt: kayıt düşerse depoda öksüz nesne kalır — gece işi raporlar, silmez (A5) */
  await depo.yaz(anahtar, icerik);
  await db.sorgu(
    "INSERT INTO dosya (id, modul, kayit_id, anahtar, ad, tur, boyut, sha256, yukleyen) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
    [id, p.modul, p.kayitId, anahtar, ad, TURLER[tur], icerik.length, createHash("sha256").update(icerik).digest("hex"), p.yukleyen ?? null]);
  await izYaz(db, { kim: p.kim, ne: "dosya.yukle", nesne: "dosya", nesneId: id, yeni: { modul: p.modul, kayit_id: p.kayitId, ad, tur: TURLER[tur], boyut: icerik.length } });
  return { tamam: true, id, ad, tur, boyut: icerik.length };
}

export interface IndirilecekDosya { anahtar: string; ad: string; tur: string; boyut: number }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** indirilebilir mi: dosya bu firmada, çöpte değil, ve kişi bağlı kaydı görebiliyor. Değilse null (yok / yetkisiz ayrımı yok). */
export async function dosyaIndirilebilir(db: Sorgulayici, kisi: Indiren, dosyaId: string, erisim: ErisimKaydi): Promise<IndirilecekDosya | null> {
  if (!UUID.test(dosyaId)) return null;
  const d = (await db.sorgu<{ modul: string; kayit_id: string; anahtar: string; ad: string; tur: string; boyut: string }>(
    "SELECT modul, kayit_id::text, anahtar, ad, tur, boyut FROM dosya WHERE id = $1 AND cop IS NULL", [dosyaId])).rows[0];
  if (!d) return null;
  const denetim = Object.hasOwn(erisim, d.modul) ? erisim[d.modul] : undefined;
  if (!denetim || !(await denetim(db, kisi, d.kayit_id))) return null;
  return { anahtar: d.anahtar, ad: d.ad, tur: d.tur, boyut: Number(d.boyut) };
}

/** yanıt başlıkları (A2): özel önbellek, tür koklama yok, dosya kendi kökeninde betik çalıştıramaz (sandbox) */
export function indirmeBasliklari(d: IndirilecekDosya, kip: "ac" | "indir"): Record<string, string> {
  const ac = kip === "ac" && (d.tur.startsWith("image/") || d.tur === "application/pdf");
  const ascii = d.ad.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
  return {
    "Content-Type": d.tur,
    "Content-Length": String(d.boyut),
    "Content-Disposition": `${ac ? "inline" : "attachment"}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(d.ad)}`,
    "Cache-Control": "private, max-age=3600, immutable",
    "X-Content-Type-Options": "nosniff",
    /* görsel / tablo: hiçbir şey çalışmaz (sandbox). PDF: tarayıcının PDF görüntüleyicisi sandbox altında açılmıyor, yalnız gömme sınırı
       (PDF görüntüleyici sayfanın kökeninde betik çalıştırmaz). Uygulama içinde çerçevede açılabilir, başka site gömemez. */
    "Content-Security-Policy": d.tur === "application/pdf" ? "frame-ancestors 'self'" : "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox; frame-ancestors 'self'",
    "X-Frame-Options": "SAMEORIGIN",
    "Cross-Origin-Resource-Policy": "same-origin",
  };
}
