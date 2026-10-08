/* SAHA RAPORU · ETİKET PLAKASINDAN OKUMA (385; maket maket-rapor.js etiket-oku / oneriKart "Etiket plakasından okunan"; ARKA-UC §5.2) — fotoğraftan
   okumayla (foto-oku.ts) aynı iki adım: hazırlık (işlem içinde: yazanın Yeni raporu · firmada yapay zekâ açık · API anahtarı · fotoğraf JPEG / PNG,
   en çok 5 MB, konum bilgisi silinmiş · kişinin sınırı → en kötü maliyet AYRILIR) → çağrı (işlem DIŞINDA) → kayıt (ayırma gerçek maliyetle kapanır,
   okuma kaydı "etiket"; rapor hâlâ yazanın Yeni raporuysa okunanlar ÖNERİ olarak döner — rapora yazılmaz, denetçi uygular, Kaydet'le yazılır).
   Elle giriş her zaman açık. */
import { ayarOku } from "../../../server/ayar/ayar.ts";
import { sirKullan } from "../../../server/ayar/sir.ts";
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { jpegTemizle, pngTemizle, turBul } from "../../../server/dosya/tur.ts";
import { etiketEnCokMaliyet, etiketIstegi, etiketYanitiCoz, type EtiketOkunan } from "../../../server/yz/etiket.ts";
import { yzAyi, yzAyir, yzAyirmaBirak, yzOkumaYaz } from "../../../server/yz/kullanim.ts";
import { maliyetHesapla, type OkumaIstegi, type YzModel } from "../../../server/yz/okuma.ts";
import { FOTO_OKU_EN_BUYUK } from "./foto-oku.ts";
import { etiketOkunabilir, type Kisi, type RaporYazma } from "./raporlar.ts";

const ELLE = "Bilgileri elle girebilirsiniz.";
const dolar = (n: number) => String(n).replace(".", ",");

export interface EtiketOkuHazir { durum: "hazir"; istek: OkumaIstegi; anahtar: string; model: YzModel; ay: string; ust: number }

export async function etiketOkuHazirla(db: Sorgulayici, kim: Kisi, raporId: string, foto: { bayt: Uint8Array }, simdi = new Date()): Promise<EtiketOkuHazir | RaporYazma> {
  const o = await etiketOkunabilir(db, kim, raporId);
  if ("durum" in o) return o;
  const yz = (await ayarOku(db, "yapay_zeka")).deger;
  if (!yz.acik) return { durum: "red", neden: `Etiketten okuma firmada kapalı (Firma ayarları › Yapay zekâ). ${ELLE}` };
  const anahtar = await sirKullan(db, "yapay_zeka_anahtari");
  if (!anahtar) return { durum: "red", neden: `Yapay zekâ API anahtarı girilmedi (Firma ayarları › Yapay zekâ). ${ELLE}` };
  const tur = turBul(foto.bayt, ["jpeg", "png"]);
  if (!tur || (tur !== "jpeg" && tur !== "png")) return { durum: "gecersiz", hatalar: { foto: "Yalnız JPEG ya da PNG fotoğraf." } };
  if (foto.bayt.length > FOTO_OKU_EN_BUYUK) return { durum: "gecersiz", hatalar: { foto: "Fotoğraf çok büyük (en çok 5 MB)." } };
  let temiz: Uint8Array;
  try { temiz = tur === "jpeg" ? jpegTemizle(foto.bayt) : pngTemizle(foto.bayt); } catch { return { durum: "gecersiz", hatalar: { foto: "Fotoğraf bozuk; başka bir fotoğraf deneyin." } }; }
  const ay = yzAyi(simdi), ust = etiketEnCokMaliyet(yz.model);
  if (!(await yzAyir(db, ay, yz.sinir, ust))) {
    return { durum: "red", neden: `Bu ay yapay zekâ sınırınız (${dolar(yz.sinir ?? 0)} $) doldu; firma yöneticisi Firma ayarları › Yapay zekâ'dan artırabilir. ${ELLE}` };
  }
  return { durum: "hazir", istek: etiketIstegi({ model: yz.model, resim: temiz, tur }), anahtar, model: yz.model, ay, ust };
}

/** çağrı cevapsız bitti: ücretsizse ayırma bırakılır; sonucu bilinmiyorsa harcamaya yazılır */
export async function etiketOkuBirak(db: Sorgulayici, h: Pick<EtiketOkuHazir, "ay" | "ust">, ucret: "yok" | "bilinmiyor"): Promise<void> {
  await yzAyirmaBirak(db, h.ay, h.ust, ucret === "bilinmiyor");
}

export interface EtiketOkuKullanim { okunan: EtiketOkunan[]; durum: "tamam" | "kesik" | "ret" }
/** kayıt adımı 1 (kendi işleminde): ayırma gerçek maliyetle kapanır, okuma kaydı ("etiket") yazılır — raporun şimdiki hâlinden bağımsız */
export async function etiketOkuKullanimYaz(db: Sorgulayici, raporId: string, h: Pick<EtiketOkuHazir, "model" | "ay" | "ust">, govde: unknown): Promise<EtiketOkuKullanim> {
  const { okunan, giris, cikis, durum } = etiketYanitiCoz(govde);
  await yzOkumaYaz(db, { ay: h.ay, ust: h.ust, raporId, bolum: "etiket", model: h.model,
    oneri: okunan.map((x) => ({ degerler: { [x.alan]: x.deger }, guven: x.guven })), giris, cikis, maliyet: maliyetHesapla(h.model, giris, cikis) });
  return { okunan, durum };
}

export type EtiketOkuSonucu = { durum: "tamam"; okunan: EtiketOkunan[]; bildirim: string } | Exclude<RaporYazma, { durum: "tamam" }>;

/** kayıt adımı 2 (ayrı işlemde): rapor hâlâ yazanın Yeni raporuysa öneri döner (okuma sürerken gönderildiyse dönmez) */
export async function etiketOkuSonuc(db: Sorgulayici, kim: Kisi, raporId: string, k: EtiketOkuKullanim): Promise<EtiketOkuSonucu> {
  const o = await etiketOkunabilir(db, kim, raporId);
  if ("durum" in o) return o.durum === "tamam" ? { durum: "yok" } : o;
  const bildirim = k.durum === "ret" ? `Yapay zekâ bu fotoğrafı okumadı. ${ELLE}`
    : !k.okunan.length ? `Fotoğrafta etiket bilgisi okunamadı. ${ELLE}`
    : `Etiketten ${k.okunan.length} bilgi okundu; uygulamadan rapora yazılmaz.`;
  return { durum: "tamam", okunan: k.okunan, bildirim };
}
