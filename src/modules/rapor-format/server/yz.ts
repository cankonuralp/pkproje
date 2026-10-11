/* FORMAT YAPICIDA YAPAY ZEKÂ (497 "Yapay zekâya anlat", 498 "Belgeden başlat"; hata listesi 29 + 46 maketi onaylı — K6: "öneri kâğıtta kesik
   çizgiyle görünür; Ekle / Uygula demeden yazılmaz"). S.A.Y ve fotoğraftan okumayla aynı üç adım: hazırlık (işlem içinde: modül 5 "yaz" · firmada
   yapay zekâ açık · API anahtarı · istemciden gelen taslak şemadan geçer · kişinin aylık sınırı → en kötü maliyet AYRILIR) → çağrı (işlem DIŞINDA)
   → kapanış (ayırma gerçek maliyetle kapanır, kişinin aylık mesaj sayısı artar; ücretsiz biten çağrıda ayırma bırakılır, sonucu bilinmeyende
   harcamaya yazılır). Öneriler taslağa YAZILMAZ: kurucu ekranında kullanıcı "Ekle" / "Uygula" der, taslak yine "Taslağı kaydet"le yazılır.
   Yapay zekâya yalnız formatın adları ve sayıları + istek (498'de firmanın format belgesi) gider (src/server/yz/format.ts). */
import { ayarOku } from "../../../server/ayar/ayar.ts";
import { sirDurumu, sirKullan } from "../../../server/ayar/sir.ts";
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { formatEnCokMaliyet, formatIstegi, formatOzeti, formatYanitiCoz, ISTEK_SINIRI, type FormatBelgesi } from "../../../server/yz/format.ts";
import { yzAyi, yzAyir, yzAyirmaBirak, yzSohbetKapat } from "../../../server/yz/kullanim.ts";
import { maliyetHesapla, type OkumaIstegi, type YzModel } from "../../../server/yz/okuma.ts";
import type { YetkiHesabi } from "../../../server/yetki/canDo.ts";
import { FormatTanimi } from "../../../format/tanim.ts";
import { onerileriKur, type Oneri } from "../yz-oneri.ts";
import { formatDegistirir, TANIM_EN_COK } from "./formatlar.ts";

/** kurucu ekranının yapay zekâ kutusu: hazır · firmada kapalı · anahtar girilmemiş */
export type FormatYzDurumu = "hazir" | "kapali" | "anahtarsiz";
export async function formatYzDurumu(db: Sorgulayici): Promise<FormatYzDurumu> {
  if (!(await ayarOku(db, "yapay_zeka")).deger.acik) return "kapali";
  return (await sirDurumu(db, "yapay_zeka_anahtari")).tanimli ? "hazir" : "anahtarsiz";
}
export const YZ_KAPALI = "Yapay zekâ firmada kapalı — firma yöneticisi Firma ayarları › Yapay zekâ'dan açar. Bölümleri parça kutusundan ekleyebilirsiniz.";
export const YZ_ANAHTARSIZ = "Yapay zekâ API anahtarı girilmedi (Firma ayarları › Yapay zekâ). Bölümleri parça kutusundan ekleyebilirsiniz.";

export interface FormatYzHazir { durum: "hazir"; istek: OkumaIstegi; anahtar: string; model: YzModel; ay: string; ust: number; tanim: FormatTanimi }
export type FormatYzRed = { durum: "red"; neden: string };

/** hazırlık (işlem içinde): yetki, ayar, anahtar, taslak şemadan, istek metni, ayırma — en sonda (geçersiz istek ayırma yapmaz) */
export async function formatYzHazirla(db: Sorgulayici, kim: YetkiHesabi, p: { istek: unknown; tanim: unknown; turAd: unknown; belge?: FormatBelgesi }, simdi = new Date()): Promise<FormatYzHazir | FormatYzRed> {
  if (!formatDegistirir(kim)) return { durum: "red", neden: "Bu işlem için yetkiniz yok." };
  const yz = (await ayarOku(db, "yapay_zeka")).deger;
  if (!yz.acik) return { durum: "red", neden: YZ_KAPALI };
  const anahtar = await sirKullan(db, "yapay_zeka_anahtari");
  if (!anahtar) return { durum: "red", neden: YZ_ANAHTARSIZ };
  if (JSON.stringify(p.tanim ?? null).length > TANIM_EN_COK) return { durum: "red", neden: "Format çok büyük." };
  const t = FormatTanimi.safeParse(p.tanim);
  if (!t.success) return { durum: "red", neden: "Taslak okunamadı; sayfayı yenileyip yeniden deneyin." };
  const istek = typeof p.istek === "string" ? p.istek.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, " ").trim() : "";
  if (!p.belge && !istek) return { durum: "red", neden: "Yapay zekâya ne istediğinizi yazın." };
  if (istek.length > ISTEK_SINIRI) return { durum: "red", neden: `İstek en çok ${ISTEK_SINIRI} karakter.` };
  const ay = yzAyi(simdi), ust = formatEnCokMaliyet(yz.model, !!p.belge);
  if (!(await yzAyir(db, ay, yz.sinir, ust))) {
    return { durum: "red", neden: `Bu ay yapay zekâ sınırınız (${String(yz.sinir ?? 0).replace(".", ",")} $) doldu; firma yöneticisi Firma ayarları › Yapay zekâ'dan artırabilir.` };
  }
  const turAd = typeof p.turAd === "string" ? p.turAd.slice(0, 200) : "";
  return { durum: "hazir", istek: formatIstegi({ model: yz.model, ozet: formatOzeti(t.data, turAd), istek, belge: p.belge }), anahtar, model: yz.model, ay, ust, tanim: t.data };
}

export type FormatYzSonucu = { durum: "tamam"; cevap: string; oneriler: Oneri[] } | FormatYzRed;

/** kapanış (işlem içinde): ayırma gerçek maliyetle kapanır (mesaj sayılır); cevap ÇAĞRI ANINDAKİ taslağa göre önerilere çevrilir */
export async function formatYzKapat(db: Sorgulayici, h: Pick<FormatYzHazir, "model" | "ay" | "ust" | "tanim">, govde: unknown): Promise<FormatYzSonucu> {
  const c = formatYanitiCoz(govde);
  await yzSohbetKapat(db, { ay: h.ay, ust: h.ust, maliyet: maliyetHesapla(h.model, c.giris, c.cikis) });
  if (c.durum === "ret") return { durum: "red", neden: "Yapay zekâ bu isteğe öneri vermedi." };
  const { oneriler, atilan } = onerileriKur(h.tanim, c.oneriler);
  const parcalar = [c.cevap || (oneriler.length ? "" : "Öneri çıkmadı; isteği başka türlü yazmayı deneyin.")];
  if (oneriler.length) parcalar.push(`${oneriler.length} öneri — kâğıtta kesik çizgiyle; “Ekle” / “Uygula” demeden yazılmaz.`);
  if (atilan) parcalar.push(`${atilan} öneri biçime uymadığı için gösterilmedi.`);
  if (c.durum === "kesik") parcalar.push("Cevap yarım kaldı; daha dar bir istek yazın.");
  return { durum: "tamam", cevap: parcalar.filter(Boolean).join(" "), oneriler };
}

/** çağrı cevapsız bitti: ücretsizse ayırma bırakılır; sonucu bilinmiyorsa (zaman aşımı) harcamaya ve mesaja yazılır */
export async function formatYzBirak(db: Sorgulayici, h: Pick<FormatYzHazir, "ay" | "ust">, ucret: "yok" | "bilinmiyor"): Promise<void> {
  await yzAyirmaBirak(db, h.ay, h.ust, ucret === "bilinmiyor", "mesaj");
}
