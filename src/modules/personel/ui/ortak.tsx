/* Personel ekranlarının ortak parçaları (maket personel.html: DURUM / HESAP rozetleri, rol adları, branş) */
import { Rozet, Sekmeler, type RozetTuru } from "../../../components/sayfa/Sayfa";
import { ROL_ADI, type Rol } from "../../../server/yetki/tanim";
import { bransAd, meslek } from "../sema";

export const DURUM: Record<"etkin" | "ayrildi", { ad: string; tur: RozetTuru }> = { etkin: { ad: "Çalışıyor", tur: "tamam" }, ayrildi: { ad: "Ayrıldı", tur: "notr" } };
export const HESAP_DURUM: Record<"etkin" | "ilk" | "pasif", { ad: string; tur: RozetTuru }> = {
  etkin: { ad: "Etkin", tur: "tamam" }, ilk: { ad: "İlk giriş bekleniyor", tur: "bekliyor" }, pasif: { ad: "Kapalı", tur: "notr" },
};
/** Personel sekmeleri (maket personel.html: Personel · Rol yetkileri · İzin talepleri — son sekme yalnız izin onaylayana, 330) */
export const PersonelSekmeleri = ({ secili, izinler = false }: { secili: string; izinler?: boolean }) => (
  <Sekmeler ad="Personel bölümleri" secili={secili}
    ogeler={[["Personel", "/personel"], ["Rol yetkileri", "/personel/roller"], ...(izinler ? [["İzin talepleri", "/personel/izinler"] as [string, string]] : [])]} />
);
export const DurumRozeti = ({ d }: { d: "etkin" | "ayrildi" }) => <Rozet tur={DURUM[d].tur}>{DURUM[d].ad}</Rozet>;
export const RolRozeti = ({ r }: { r: Rol }) => <Rozet tur="notr">{ROL_ADI[r]}</Rozet>;
export const meslekAdi = (p: { meslek: string; meslekMetin: string | null }) => (p.meslek === "diger" ? p.meslekMetin ?? "Diğer meslek" : meslek(p.meslek)?.ad ?? "—");
export const bransi = (k: string) => meslek(k)?.b || null;
export { bransAd };
export const tarihYaz = (iso: string | null) => (iso ? iso.slice(0, 10).split("-").reverse().join(".") : "—");
