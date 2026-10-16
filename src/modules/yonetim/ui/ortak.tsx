/* YÖNETİM ortak parçaları (348): durum rozeti, firma adresi, depo durumu — liste, firma sayfası ve firma aç aynı metni gösterir. */
import { Rozet } from "../../../components/sayfa/Sayfa";
import type { FirmaDurumu } from "../server/yonetim";

export const DURUM: Record<FirmaDurumu, { ad: string; tur: "tamam" | "red" | "bekliyor" }> = {
  etkin: { ad: "Etkin", tur: "tamam" }, dondu: { ad: "Dondurulmuş", tur: "red" }, kurulum: { ad: "Kuruluyor", tur: "bekliyor" },
};
export const DurumRozeti = ({ durum }: { durum: FirmaDurumu }) => <Rozet tur={DURUM[durum].tur}>{DURUM[durum].ad}</Rozet>;

/** firmanın adresi: <alt alan>.<ana alan> (yerelde kapısız gösterilir) */
export const firmaAdresi = (alt: string, anaAlan: string) => `${alt}.${anaAlan}`;

/* Veritabanı (2026-10-12, sunum D1; 2026-10-16 FIRMA-VT FV10, K1: firmanın hesabını bağlama akışı kalktı — kendi projeli firmanın Supabase projesini
   probata panelden açar ve kurar, Firma ayarlarında bağlantı kilitli). Ortak firmalar probata'nın ortak projesinde (deneme firması dahil — K5). */
export type DepoTuru = "vt" | "supabase" | "klasor";
/* 568: dosyalar Supabase Storage'da (veritabanı kotası yemez; eski dosyalar gece taşınır) */
export const DEPO_AD: Record<DepoTuru, string> = {
  vt: "probata ortak deneme projesi (Supabase)", supabase: "probata ortak deneme projesi (Supabase; dosyalar Storage'da)", klasor: "Yerel klasör (geliştirme)",
};
/** sunucuda: ortamın deposu (sayfalar ekrana iletir) */
export const depoTuru = (deger: string | undefined): DepoTuru => (deger === "vt" || deger === "supabase" ? deger : "klasor");
export const DEPO_NOT = "Kendi projeli firmanın veritabanı ve dosyaları kendi Supabase projesinde (Frankfurt); projeyi probata panelden açar ve kurar, firma bir şey yapmaz. Ortak firmalar probata'nın ortak projesinde.";

/** tarih: GG.AA.YYYY */
export const tarihYaz = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}`;
