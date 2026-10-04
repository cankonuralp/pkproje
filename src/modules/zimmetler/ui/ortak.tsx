/* Zimmetler ekranlarının ortak parçaları (maket zimmetler.html: durum rozeti, kimde, zaman) */
import { Rozet } from "../../../components/sayfa/Sayfa";
import type { Kimde, VarlikSatiri } from "../server/zimmet";

export const kimdeAd = (k: Kimde) => (k.tip === "depo" ? "Depo" : k.tip === "lab" ? "Kalibrasyonda" : k.ad);
export const zamanYaz = (iso: string) => new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
export const TUR_AD = { c: "Ölçüm cihazı", d: "Diğer" } as const;
export const TUR_IKON = { c: "gauge", d: "hard-hat" } as const;
/** kalibrasyonu geçmiş cihaz (bugün Türkiye günüyle) */
export const kalGecti = (v: Pick<VarlikSatiri, "tur" | "bitis">, bugun: string) => v.tur === "c" && (!v.bitis || v.bitis < bugun);
export function DurumRozeti({ v, bugun }: { v: VarlikSatiri; bugun: string }) {
  if (v.kimde.tip === "lab") return <Rozet tur="kabul">Kalibrasyonda</Rozet>;
  if (kalGecti(v, bugun)) return <Rozet tur="red">Kalibrasyonu geçti</Rozet>;
  return v.kimde.tip === "depo" ? <Rozet tur="notr">Depoda</Rozet> : <Rozet tur="tamam">Zimmette</Rozet>;
}
