/* MUHASEBE ortak parçaları: sekmeler (maket muhasebe.html a-sekme-is / fatura — giderler ve gelir-gider 328'de) ve gün farkı (Türkiye takvimi) */
import { Sekmeler } from "../../../components/sayfa/Sayfa";

const GUN = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" });
/** bugünden verilen güne kalan gün (geçmişse eksi) */
export const gunFarki = (gun: string) => Math.round((Date.parse(`${gun}T00:00:00Z`) - Date.parse(`${GUN.format(new Date())}T00:00:00Z`)) / 864e5);

export function MuhasebeSekmeleri({ secili }: { secili: string }) {
  return <Sekmeler ad="Muhasebe bölümleri" secili={secili} ogeler={[["İşler", "/muhasebe"], ["Faturalar", "/muhasebe/faturalar"]]} />;
}
