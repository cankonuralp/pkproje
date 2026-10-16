/* müşteri panelinin ortak küçük parçaları: sonuç yazısı (maket sonucHtml), bugüne gün farkı (Türkiye takvim günü), panel sekmeleri, Excel'deki
   rapor bağlantısı */
import { Sekmeler } from "../../../components/sayfa/Sayfa";
import type { RaporSonucu } from "../../../format/tanim";
import { SONUC_AD } from "../../raporlar/sema";
import stil from "./panel.module.css";

/** bugünden verilen güne kaç gün — 577: tek tanım ../liste.ts'te (sunucu süzgeci de kullanır) */
export { gunFarki } from "../liste";

export function SonucYazisi({ sonuc }: { sonuc: RaporSonucu | null }) {
  if (!sonuc) return <span className={stil.sonucYok}>—</span>;
  return <span className={sonuc === "uygun" ? stil.sonucUygun : sonuc === "sartli" ? stil.sonucSartli : stil.sonucHata}>{SONUC_AD[sonuc]}</span>;
}

/** panel sekmeleri (maket musteri.html a-sekmeler): Raporlar · Uygunsuzluklar (açık sayısı) · Planlanan kontroller (321) · Sözleşmeler (322) ·
    Muayene personeli (323) */
export function PanelSekmeleri({ acikUygunsuz, secili }: { acikUygunsuz: number; secili: "/portal" | "/portal/uygunsuz" | "/portal/plan" | "/portal/sozlesme" | "/portal/personel" }) {
  return <Sekmeler ad="Panel görünümleri" secili={secili}
    ogeler={[["Raporlar", "/portal"], [`Uygunsuzluklar (${acikUygunsuz})`, "/portal/uygunsuz"], ["Planlanan kontroller", "/portal/plan"], ["Sözleşmeler", "/portal/sozlesme"],
      ["Muayene personeli", "/portal/personel"]]} />;
}

/** sözleşme durumu (maket SOZ_DURUM) */
export const SOZ_DURUM = { imza: ["İmza bekliyor", "bekliyor"], yururlukte: ["Yürürlükte", "tamam"], suresi: ["Süresi doldu", "notr"] } as const;

/** Excel'deki "Rapor" bağlantısı: panelde raporu açar (giriş ister; kalıcı herkese açık dosya bağlantısı değil — anayasa 5.1) */
export const raporAdresi = (id: string) => new URL(`/portal/r/${encodeURIComponent(id)}`, window.location.origin).href;
