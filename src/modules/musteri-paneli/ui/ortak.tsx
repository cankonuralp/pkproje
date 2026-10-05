/* müşteri panelinin ortak küçük parçaları: sonuç yazısı (maket sonucHtml) ve bugüne gün farkı (Türkiye takvim günü) */
import stil from "./panel.module.css";

const GUN = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" });
/** bugünden verilen güne kaç gün (geçmişse eksi) */
export const gunFarki = (iso: string) => Math.round((Date.parse(`${iso.slice(0, 10)}T00:00:00Z`) - Date.parse(`${GUN.format(new Date())}T00:00:00Z`)) / 864e5);

export function SonucYazisi({ sonuc }: { sonuc: "uygun" | "uygun_degil" | null }) {
  if (!sonuc) return <span className={stil.sonucYok}>—</span>;
  return <span className={sonuc === "uygun" ? stil.sonucUygun : stil.sonucHata}>{sonuc === "uygun" ? "Uygun" : "Uygun değil"}</span>;
}
