/* BASILI FORMDAN ŞABLON — sunucu (2026-10-23; reisim: "ben bunu yükleyince format buna dönüşsün format düzenleyicide bundan düzenleme yapabileyim
   istiyorum", "sürüm 2 ne işe yarıyor orda o zaman yüklemem ne işe yaradı"). Türün basılı format PDF'i (ekipman-turleri basiliPdf) tek seferlik
   bir yapay zekâ okumasıyla formatın tamamına çevrilir ve türün TASLAĞI olur; kurucuda düzenlenir, Yayınla ile geçer (yayındaki sürüm değişmez).
   Fotoğraftan okuma / format yapıcı önerisiyle aynı üç adım: hazırlık (işlem içinde: "değiştirir" düzeyi · firmada yapay zekâ açık · anahtar ·
   PDF · kişinin aylık sınırı → en kötü maliyet AYRILIR) → çağrı (işlem DIŞINDA) → kapanış (gerçek maliyet; çeviri şemadan geçer; taslak yazılır —
   istemcinin gördüğü taslak sürümüyle, görmediğini ezmez). */
import { ayarOku } from "../../../server/ayar/ayar.ts";
import { sirKullan } from "../../../server/ayar/sir.ts";
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import type { Depo } from "../../../server/dosya/depo.ts";
import { BASILI_PDF_EN_BUYUK, basiliEnCokMaliyet, basiliIstegi, basiliYanitiCoz } from "../../../server/yz/basili.ts";
import { yzAyi, yzAyir, yzAyirmaBirak, yzSohbetKapat } from "../../../server/yz/kullanim.ts";
import { maliyetHesapla, type OkumaIstegi, type YzModel } from "../../../server/yz/okuma.ts";
import { basiliPdf, turOzeti } from "../../ekipman-turleri/server/turler.ts";
import { basilidanTanim } from "../basili.ts";
import { formatDegistirir, taslakYaz, type Kisi } from "./formatlar.ts";

export interface BasiliHazir { durum: "hazir"; istek: OkumaIstegi; anahtar: string; model: YzModel; ay: string; ust: number; turId: string; turAd: string; sira: number }
export type BasiliRed = { durum: "red"; neden: string };
export type BasiliSonucu = { durum: "tamam"; id: string; sira: number; cevap: string; atilan: string[] } | BasiliRed | { durum: "cakisma" };

export const BASILI_YZ_KAPALI = "Basılı formdan şablon kurmak için yapay zekâ gerekir; firma yöneticisi Firma ayarları › Yapay zekâ'dan açar.";
export const BASILI_ANAHTARSIZ = "Basılı formdan şablon kurmak için yapay zekâ API anahtarı gerekir (Firma ayarları › Yapay zekâ).";

/** hazırlık (işlem içinde): yetki, ayar, anahtar, PDF, ayırma — en sonda (geçersiz istek ayırma yapmaz) */
export async function basiliHazirla(db: Sorgulayici, depo: Depo, kim: Kisi, turId: string, formatId: string | null, simdi = new Date()): Promise<BasiliHazir | BasiliRed> {
  if (!formatDegistirir(kim)) return { durum: "red", neden: "Bu işlem için yetkiniz yok." };
  const yz = (await ayarOku(db, "yapay_zeka")).deger;
  if (!yz.acik) return { durum: "red", neden: BASILI_YZ_KAPALI };
  const anahtar = await sirKullan(db, "yapay_zeka_anahtari");
  if (!anahtar) return { durum: "red", neden: BASILI_ANAHTARSIZ };
  const tur = await turOzeti(db, turId);
  if (!tur) return { durum: "red", neden: "Ekipman türü bulunamadı." };
  const pdf = await basiliPdf(db, depo, turId, formatId);
  if (!pdf) return { durum: "red", neden: "Basılı format PDF'i bulunamadı." };
  if (pdf.bayt.length > BASILI_PDF_EN_BUYUK) return { durum: "red", neden: "PDF çok büyük (en çok 24 MB). Sayfaları ayırıp yeniden yükleyin." };
  const ay = yzAyi(simdi), ust = basiliEnCokMaliyet(yz.model);
  if (!(await yzAyir(db, ay, yz.sinir, ust))) {
    return { durum: "red", neden: `Bu ay yapay zekâ sınırınız (${String(yz.sinir ?? 0).replace(".", ",")} $) doldu; firma yöneticisi Firma ayarları › Yapay zekâ'dan artırabilir.` };
  }
  return { durum: "hazir", istek: basiliIstegi({ model: yz.model, pdf: pdf.bayt, turAd: tur.ad }), anahtar, model: yz.model, ay, ust, turId, turAd: tur.ad, sira: pdf.sira };
}

/** kapanış (işlem içinde): ayırma gerçek maliyetle kapanır; cevap formata çevrilir ve türün taslağı olur */
export async function basiliKapat(db: Sorgulayici, kim: Kisi, h: Omit<BasiliHazir, "istek" | "anahtar">, govde: unknown, taslakSurumu: number | null): Promise<BasiliSonucu> {
  const c = basiliYanitiCoz(govde);
  await yzSohbetKapat(db, { ay: h.ay, ust: h.ust, maliyet: maliyetHesapla(h.model, c.giris, c.cikis) });
  if (c.durum === "ret") return { durum: "red", neden: "Yapay zekâ bu PDF'i okumadı." };
  if (c.durum === "kesik") return { durum: "red", neden: "Form çok uzun; cevap yarım kaldı. Sayfaları ayırıp yeniden deneyin." };
  const ceviri = c.ham ? basilidanTanim(c.ham, h.turAd) : null;
  if (!ceviri) return { durum: "red", neden: "Form şablona çevrilemedi; yeniden deneyin." };
  const y = await taslakYaz(db, kim, h.turId, ceviri.tanim, `basılı format sürüm ${h.sira}`, taslakSurumu);
  if (y.durum === "tamam") return { durum: "tamam", id: y.id, sira: h.sira, cevap: ceviri.cevap, atilan: ceviri.atilan };
  if (y.durum === "cakisma") return { durum: "cakisma" };
  return { durum: "red", neden: y.durum === "yetkisiz" ? "Bu işlem için yetkiniz yok." : y.durum === "yok" ? "Ekipman türü bulunamadı." : "Form şablona çevrilemedi; yeniden deneyin." };
}

/** çağrı cevapsız bitti: ücretsizse ayırma bırakılır; sonucu bilinmiyorsa (zaman aşımı) harcamaya ve mesaja yazılır */
export async function basiliBirak(db: Sorgulayici, h: Pick<BasiliHazir, "ay" | "ust">, ucret: "yok" | "bilinmiyor"): Promise<void> {
  await yzAyirmaBirak(db, h.ay, h.ust, ucret === "bilinmiyor", "mesaj");
}
