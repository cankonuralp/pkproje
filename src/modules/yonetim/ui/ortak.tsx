/* YÖNETİM ortak parçaları (348): durum rozeti, firma adresi, depo durumu — liste, firma sayfası ve firma aç aynı metni gösterir. */
import { Rozet } from "../../../components/sayfa/Sayfa";
import type { FirmaDurumu } from "../server/yonetim";

export const DURUM: Record<FirmaDurumu, { ad: string; tur: "tamam" | "red" }> = { etkin: { ad: "Etkin", tur: "tamam" }, dondu: { ad: "Dondurulmuş", tur: "red" } };
export const DurumRozeti = ({ durum }: { durum: FirmaDurumu }) => <Rozet tur={DURUM[durum].tur}>{DURUM[durum].ad}</Rozet>;

/** firmanın adresi: <alt alan>.<ana alan> (yerelde kapısız gösterilir) */
export const firmaAdresi = (alt: string, anaAlan: string) => `${alt}.${anaAlan}`;

/* Veritabanı (2026-10-12, sunum D1 kabul — her firma kendi Supabase hesabında, pkproje §8.8 / 294; eski "firmanın kendi S3 deposu" kalktı). Bugün
   bütün firmalar probata'nın ortak deneme projesinde: dosyalar deneme yayınında veritabanında (347), geliştirmede klasörde. Bağlama akışı
   firma-ayarlari/sema.ts SUPABASE_ADIMLAR (Firma ayarları › Supabase hesabı ve yedek aynı metni gösterir); yayına çıkışta açılır (K7). */
export type DepoTuru = "vt" | "supabase" | "klasor";
/* 568: dosyalar Supabase Storage'da (veritabanı kotası yemez; eski dosyalar gece taşınır) */
export const DEPO_AD: Record<DepoTuru, string> = {
  vt: "probata ortak deneme projesi (Supabase)", supabase: "probata ortak deneme projesi (Supabase; dosyalar Storage'da)", klasor: "Yerel klasör (geliştirme)",
};
/** sunucuda: ortamın deposu (sayfalar ekrana iletir) */
export const depoTuru = (deger: string | undefined): DepoTuru => (deger === "vt" || deger === "supabase" ? deger : "klasor");
export const DEPO_NOT = "Yayına çıkışta her firma kendi Supabase hesabını bağlar: yönetici ilk girişte Supabase'in izin ekranında onaylar, probata projeyi Frankfurt'ta kurar. O zamana kadar veriler probata'nın ortak deneme projesinde.";

/** tarih: GG.AA.YYYY */
export const tarihYaz = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}`;
