/* Müşteriler ekranlarının ortak parçaları (maket musteriler.html: PASIF rozeti, tarih, il seçenekleri) */
import { Rozet } from "../../../components/sayfa/Sayfa";
import { IL_ILCE } from "../../../tanim/iller";

export const PasifRozeti = () => <Rozet tur="notr">Pasif</Rozet>;
export const tarihYaz = (iso: string | null) => (iso ? iso.slice(0, 10).split("-").reverse().join(".") : "—");
export const IL_SECENEK = Object.keys(IL_ILCE).map((x) => [x, x] as const);
export const ilceSecenek = (il: string) => (IL_ILCE[il] ?? []).map((x) => [x, x] as const);
/** "Gebze / Kocaeli" (ilçe / il; biri yoksa öteki) */
export const yerYaz = (t: { il: string | null; ilce: string | null }) => [t.ilce, t.il].filter(Boolean).join(" / ");
