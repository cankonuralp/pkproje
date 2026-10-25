/* Sözleşmeler ekranlarının ortak parçaları (maket sozlesmeler.html: durum rozeti, tarih) */
import { Rozet } from "../../../components/sayfa/Sayfa";
import { DURUM_AD, type SozlesmeDurumu } from "../sema";

export const tarihYaz = (iso: string | null) => (iso ? iso.slice(0, 10).split("-").reverse().join(".") : "—");
const ZAMAN = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
/** zaman damgası → "GG.AA.YYYY SS:DD" (Türkiye saati; 2026-10-25 gönderilen e-postalar) */
export const zamanYaz = (iso: string) => { const s = ZAMAN.format(new Date(iso)); return `${tarihYaz(s.slice(0, 10))} ${s.slice(12, 17)}`; };
const TUR = { imza: "bekliyor", yururlukte: "tamam", suresi: "notr" } as const;
export function DurumRozeti({ d }: { d: SozlesmeDurumu }) { return <Rozet tur={TUR[d]}>{DURUM_AD[d]}</Rozet>; }
