/* müşteri panelinin ortak küçük parçaları: sonuç yazısı (maket sonucHtml), bugüne gün farkı (Türkiye takvim günü), panel sekmeleri, Excel'deki
   rapor bağlantısı */
import { Sekmeler } from "../../../components/sayfa/Sayfa";
import stil from "./panel.module.css";

const GUN = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" });
/** bugünden verilen güne kaç gün (geçmişse eksi) */
export const gunFarki = (iso: string) => Math.round((Date.parse(`${iso.slice(0, 10)}T00:00:00Z`) - Date.parse(`${GUN.format(new Date())}T00:00:00Z`)) / 864e5);

export function SonucYazisi({ sonuc }: { sonuc: "uygun" | "uygun_degil" | null }) {
  if (!sonuc) return <span className={stil.sonucYok}>—</span>;
  return <span className={sonuc === "uygun" ? stil.sonucUygun : stil.sonucHata}>{sonuc === "uygun" ? "Uygun" : "Uygun değil"}</span>;
}

/** panel sekmeleri (maket musteri.html a-sekmeler): Raporlar · Uygunsuzluklar (açık sayısı) · Planlanan kontroller (321); sözleşmeler ve muayene
    personeli sonraki kalemlerde */
export function PanelSekmeleri({ acikUygunsuz, secili }: { acikUygunsuz: number; secili: "/portal" | "/portal/uygunsuz" | "/portal/plan" }) {
  return <Sekmeler ad="Panel görünümleri" secili={secili}
    ogeler={[["Raporlar", "/portal"], [`Uygunsuzluklar (${acikUygunsuz})`, "/portal/uygunsuz"], ["Planlanan kontroller", "/portal/plan"]]} />;
}

/** Excel'deki "Rapor" bağlantısı: panelde raporu açar (giriş ister; kalıcı herkese açık dosya bağlantısı değil — anayasa 5.1) */
export const raporAdresi = (id: string) => new URL(`/portal/r/${encodeURIComponent(id)}`, window.location.origin).href;
