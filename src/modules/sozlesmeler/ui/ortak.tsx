/* Sözleşmeler ekranlarının ortak parçaları (maket sozlesmeler.html: durum rozeti, tarih) */
import { Rozet } from "../../../components/sayfa/Sayfa";
import { DURUM_AD, type SozlesmeDurumu } from "../sema";

export const tarihYaz = (iso: string | null) => (iso ? iso.slice(0, 10).split("-").reverse().join(".") : "—");
const TUR = { imza: "bekliyor", yururlukte: "tamam", suresi: "notr" } as const;
export function DurumRozeti({ d }: { d: SozlesmeDurumu }) { return <Rozet tur={TUR[d]}>{DURUM_AD[d]}</Rozet>; }
