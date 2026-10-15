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
  /* önce depo, sonra kayıt: kayıt düşerse depoda öksüz nesne kalır — gece işi raporlar, silmez (A5); veritabanı deposu aynı işlemde yazar (geri
     alınırsa nesne de kalmaz — 347) */
  await depo.yaz(anahtar, icerik, db, TURLER[tur]);
  await db.sorgu(
    "INSERT INTO dosya (id, modul, kayit_id, anahtar, ad, tur, boyut, sha256, yukleyen) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
    [id, p.modul, p.kayitId, anahtar, ad, TURLER[tur], icerik.length, createHash("sha256").update(icerik).digest("hex"), p.yukleyen ?? null]);
  await izYaz(db, { kim: p.kim, ne: "dosya.yukle", nesne: "dosya", nesneId: id, yeni: { modul: p.modul, kayit_id: p.kayitId, ad, tur: TURLER[tur], boyut: icerik.length } });
  return { tamam: true, id, ad, tur, boyut: icerik.length };
}

/** dosyayı çöpe alır (silinmez; çöpteki dosya indirilmez, depodan silme çöp süresi dolunca — A5). Yetki ÇAĞIRANDA (bağlı kaydın modülü). */
export async function dosyaCope(db: Sorgulayici, dosyaId: string, iz: { kim: string; ne: string; gerekce?: string }): Promise<void> {
  if (!UUID_DOSYA.test(dosyaId)) return;
  const r = await db.sorgu("UPDATE dosya SET cop = now() WHERE id = $1 AND cop IS NULL", [dosyaId]);
  if (r.rowCount) await izYaz(db, { ...iz, nesne: "dosya", nesneId: dosyaId });
}
const UUID_DOSYA = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

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

/** müşteri panelinin indirebildiği dosya (0030): YALNIZ müşteri işleminde (src/server/kimlik/istek.ts musteriIslemi → probata_musteri) çağrılır —
    veritabanının kısıtlayıcı politikası yalnız müşterinin görebildiği (kendi, kapsamındaki tesis, son imzalı sürüm) imzalı PDF'i döndürür */
export async function musteriDosyasi(db: Sorgulayici, dosyaId: string): Promise<IndirilecekDosya | null> {
  if (!UUID.test(dosyaId)) return null;
  const d = (await db.sorgu<{ anahtar: string; ad: string; tur: string; boyut: string }>(
    "SELECT anahtar, ad, tur, boyut FROM dosya WHERE id = $1 AND modul IN ('rapor_imzali', 'is_sozlesmesi', 'ozluk', 'egitim', 'atama') AND cop IS NULL", [dosyaId])).rows[0];
  return d ? { anahtar: d.anahtar, ad: d.ad, tur: d.tur, boyut: Number(d.boyut) } : null;
}

/** kaydın kendi dosyası (belge çizimi için: rapor fotoğrafı belgeye gömülür): dosya bu firmada, çöpte değil, VERİLEN modül ve kayda bağlı.
    Kaydı görme yetkisi ÇAĞIRANDA (kaydı görebilen, kaydın dosyasını görür — erişim kaydıyla aynı kural). */
export async function kayitDosyasi(db: Sorgulayici, modul: string, kayitId: string, dosyaId: string): Promise<IndirilecekDosya | null> {
  if (!UUID.test(dosyaId) || !UUID.test(kayitId)) return null;
  const d = (await db.sorgu<{ anahtar: string; ad: string; tur: string; boyut: string }>(
    "SELECT anahtar, ad, tur, boyut FROM dosya WHERE id = $1 AND modul = $2 AND kayit_id = $3 AND cop IS NULL", [dosyaId, modul, kayitId])).rows[0];
  return d ? { anahtar: d.anahtar, ad: d.ad, tur: d.tur, boyut: Number(d.boyut) } : null;
}

/** yanıt başlıkları (A2): önbelleğe yazılmaz, tür koklama yok, dosya kendi kökeninde betik çalıştıramaz (sandbox).
    563 (reisim 2026-10-15 analizi): "private, max-age=3600" idi — çıkıştan sonra ortak bilgisayarda fotoğraf / PDF tarayıcı geçmişinden bir saat
    açılabiliyordu (önbellekten, oturum sorulmadan). "no-store": tarayıcı diske yazmaz. Bir kez inme (B2) <GizliResim>'in oturum belleğinde. */
export function indirmeBasliklari(d: IndirilecekDosya, kip: "ac" | "indir"): Record<string, string> {
  const ac = kip === "ac" && (d.tur.startsWith("image/") || d.tur === "application/pdf");
  const ascii = d.ad.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
  return {
    "Content-Type": d.tur,
    "Content-Length": String(d.boyut),
    "Content-Disposition": `${ac ? "inline" : "attachment"}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(d.ad)}`,
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
    /* görsel / tablo: hiçbir şey çalışmaz (sandbox). PDF: tarayıcının PDF görüntüleyicisi sandbox altında açılmıyor, yalnız gömme sınırı
       (PDF görüntüleyici sayfanın kökeninde betik çalıştırmaz). Uygulama içinde çerçevede açılabilir, başka site gömemez. */
    "Content-Security-Policy": d.tur === "application/pdf" ? "frame-ancestors 'self'" : "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox; frame-ancestors 'self'",
    "X-Frame-Options": "SAMEORIGIN",
    "Cross-Origin-Resource-Policy": "same-origin",
  };
}

/** 568: imzalı adresin ömrü (sn) — kısa ömürlü, yetkili indirme (anayasa 5.1'in karşılığı). 575 (reisim 2026-10-15: "dediklerini yap" — 5 dk →
    15 dk): uzun PDF açıkken tarayıcının sonradan istediği parçalar da süre içinde kalsın */
export const IMZA_SURESI = 900;
/** tarayıcının kendi içinde gösterdiği tür (görsel, PDF) — öteki türler indirilir */
export const gosterilir = (tur: string) => tur.startsWith("image/") || tur === "application/pdf";
const kacis = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[c] ?? c);
/** 575 DOSYA SAYFASI (reisim 2026-10-15: "dediklerini yap" — süresi dolan bağlantı İngilizce hata yerine bizim sayfamıza dönsün): yeni sekmede
    adres HEP BİZİM (/api/dosya/<id>); dosya Storage'ın kısa ömürlü imzalı adresinden sayfanın İÇİNDE çizilir (PDF çerçevede, görsel resim olarak).
    Sekme yenilenince yetki yeniden denetlenir ve yeni imzalı adres üretilir — "süresi doldu" hatası görülmez; adres kopyalanırsa oturum ister.
    Betik yok; içerik yalnız Storage kökünden; sayfa önbelleğe yazılmaz; Storage'a bizim adresimiz gitmez (no-referrer). */
export function dosyaSayfasi(d: { ad: string; tur: string }, adres: string): { govde: string; basliklar: Record<string, string> } {
  const kok = new URL(adres).origin;
  const resim = d.tur.startsWith("image/");
  const ic = resim ? `<img src="${kacis(adres)}" alt="${kacis(d.ad)}">` : `<iframe src="${kacis(adres)}" title="${kacis(d.ad)}"></iframe>`;
  const bicim = resim ? "body{display:flex;align-items:center;justify-content:center}img{max-width:100%;max-height:100%;object-fit:contain}"
    : "iframe{display:block;border:0;width:100%;height:100%}";
  return {
    govde: `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">`
      + `<title>${kacis(d.ad)}</title><style>:root{color-scheme:light dark}html,body{margin:0;height:100%}${bicim}</style></head><body>${ic}</body></html>`,
    basliklar: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
      "Content-Security-Policy": `default-src 'none'; img-src ${kok}; frame-src ${kok}; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'self'`,
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "SAMEORIGIN",
    },
  };
}
/** 568: istek tarayıcının SAYFA açılışı mı (yeni sekme / indirme bağlantısı) — yalnız o zaman imzalı adrese yönlenir; fetch ve çerçeve kendi
    kökenimizden akar (CSP connect-src / frame-src ve CORS değişmez) */
export const sayfaAcilisi = (h: Headers) => h.get("sec-fetch-dest") === "document";
