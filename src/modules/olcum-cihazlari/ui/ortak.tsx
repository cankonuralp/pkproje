/* Ölçüm cihazları ekranlarının ortak parçaları (maket olcum-cihazlari.html: KAL rozetleri, kalan gün metni, konum) */
import { Rozet, type RozetTuru } from "../../../components/sayfa/Sayfa";
import type { KalDurum } from "../sema";

export const tarihYaz = (iso: string | null) => (iso ? iso.slice(0, 10).split("-").reverse().join(".") : "—");
export const kalRozet = (d: KalDurum, esik: number): { ad: string; tur: RozetTuru } => ({
  gecerli: { ad: "Geçerli", tur: "tamam" as const }, yakin: { ad: `${esik} gün içinde bitiyor`, tur: "bekliyor" as const },
  gecti: { ad: "Kalibrasyonu geçti", tur: "red" as const }, lab: { ad: "Kalibrasyonda", tur: "kabul" as const },
}[d]);
export const KalRozeti = ({ d, esik }: { d: KalDurum; esik: number }) => { const r = kalRozet(d, esik); return <Rozet tur={r.tur}>{r.ad}</Rozet>; };
export const KONUM_AD = { depo: "Depo", lab: "Kalibrasyonda" } as const;
