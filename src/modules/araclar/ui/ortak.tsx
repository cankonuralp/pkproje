/* Araçlar ekranlarının ortak parçaları (maket araclar.html: durum, belge rozeti, kilometre rozeti, kimde, tarih) */
import { DegerYok, Rozet } from "../../../components/sayfa/Sayfa";
import { kmYaz, type BelgeDurumu } from "../sema";
import type { AracSatiri, Kimde, KmDurumu } from "../server/araclar";

export const tarihYaz = (iso: string | null) => (iso ? iso.slice(0, 10).split("-").reverse().join(".") : "—");
export const zamanYaz = (iso: string) => new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
export const kimdeAd = (k: Kimde) => (k.tip === "depo" ? "Depo" : k.ad);
export const haftaYaz = (h: string) => {
  const son = new Date(`${h}T12:00:00Z`); son.setUTCDate(son.getUTCDate() + 6);
  return `${tarihYaz(h).slice(0, 5)} – ${tarihYaz(son.toISOString())}`;
};

export function BelgeHucre({ tarih, durum }: { tarih: string | null; durum: BelgeDurumu }) {
  if (durum === "yok") return <DegerYok>Yok</DegerYok>;
  if (durum === "gecti") return <Rozet tur="red">Geçti · {tarihYaz(tarih)}</Rozet>;
  if (durum === "yakin") return <Rozet tur="bekliyor">{tarihYaz(tarih)}</Rozet>;
  return <>{tarihYaz(tarih)}</>;
}

const KM_DURUM = { girildi: ["tamam", "Girildi"], bekliyor: ["bekliyor", "Bekliyor"], eksik: ["red", "Geçen hafta girilmedi"] } as const;
export function KmRozeti({ d }: { d: KmDurumu }) {
  if (d === "depoda") return <DegerYok>Depoda</DegerYok>;
  const [tur, ad] = KM_DURUM[d];
  return <Rozet tur={tur}>{ad}</Rozet>;
}

export function AracDurumu({ v }: { v: Pick<AracSatiri, "belgeler" | "kimde"> }) {
  if (v.belgeler.some((b) => b.durum === "gecti")) return <Rozet tur="red">Belge süresi geçti</Rozet>;
  if (v.belgeler.some((b) => b.durum === "yakin")) return <Rozet tur="bekliyor">Belge yaklaşıyor</Rozet>;
  return v.kimde.tip === "depo" ? <Rozet tur="notr">Depoda</Rozet> : <Rozet tur="tamam">Zimmette</Rozet>;
}

export const kmMetin = (n: number | null) => (n == null ? null : `${kmYaz(n)} km`);
