/* S.A.Y CHAT · EKİPMAN SEÇİMİ (549; sunum 546 K1–K2 — reisim 2026-10-14: "plandan seç diyince plandaki ekipmanlar gözükmüyor"; karar: "diğer
   önerilerini kabul ediyorum") — saf. "Plandan seç"te plandaki BÜTÜN ekipman, durumuyla:
   · uygun — kişinin branşında, raporsuz;
   · brans — başka branşın ekipmanı: UYARIYLA seçilir (genel ilke: kural uyarıdır, engel değil — pkproje §9 on ikinci tur);
   · rapor — kişinin kendi Yeni raporu var: seçilir, kayıt o raporun BOŞ alanlarına girer (server/rapor-yaz.ts);
   · kapali — pasif, formatı yayında değil, başkasının ya da onaya gitmiş raporu var: görünür, nedeni yazar, seçilmez (sunucu da reddeder). */
import { RAPOR_DURUM, type RaporDurumu } from "../raporlar/sema.ts";

export type PlanEkipmanDurumu = "uygun" | "brans" | "rapor" | "kapali";
export interface PlanEkipmani { id: string; kod: string; turId: string; konum: string | null; durum: PlanEkipmanDurumu; neden: string | null }
const BRANS_AD = { m: "Mekanik", e: "Elektrik" } as const;

/** başka branşın uyarısı (listede ve seçilince) */
export const bransUyarisi = (ekipman: "m" | "e", kisi: "m" | "e") => `${BRANS_AD[ekipman]} branşında — sizin branşınız ${BRANS_AD[kisi].toLocaleLowerCase("tr")}.`;

/** plan ekipmanının durumu; brans null → branş bakılmaz (kaydet: uyarı ekranda, sunucu engellemez) */
export function planEkipmanDurumu(e: { id: string; brans: "m" | "e"; pasif: boolean }, brans: "m" | "e" | null,
  raporlar: readonly { ekipmanId: string; durum: string; benimTaslak: boolean }[], formatli: boolean): { durum: PlanEkipmanDurumu; neden: string | null } {
  if (e.pasif) return { durum: "kapali", neden: "Pasif ekipman." };
  if (!formatli) return { durum: "kapali", neden: "Türün rapor formatı yayında değil." };
  const r = raporlar.find((x) => x.ekipmanId === e.id);
  if (r?.benimTaslak) return { durum: "rapor", neden: "Raporunuz var (Yeni): kayıt o raporun boş alanlarına girer." };
  if (r) {
    return { durum: "kapali", neden: r.durum === "taslak" ? "Başka birinin raporu var."
      : `Raporu “${RAPOR_DURUM[r.durum as RaporDurumu]?.[0] ?? r.durum}” durumunda; yeni kayıt yazılmaz.` };
  }
  if (brans && e.brans !== brans) return { durum: "brans", neden: bransUyarisi(e.brans, brans) };
  return { durum: "uygun", neden: null };
}
