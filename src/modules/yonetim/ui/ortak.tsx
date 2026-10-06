/* YÖNETİM ortak parçaları (348): durum rozeti, firma adresi, depo durumu — liste, firma sayfası ve firma aç aynı metni gösterir. */
import { Rozet } from "../../../components/sayfa/Sayfa";
import type { FirmaDurumu } from "../server/yonetim";

export const DURUM: Record<FirmaDurumu, { ad: string; tur: "tamam" | "red" }> = { etkin: { ad: "Etkin", tur: "tamam" }, dondu: { ad: "Dondurulmuş", tur: "red" } };
export const DurumRozeti = ({ durum }: { durum: FirmaDurumu }) => <Rozet tur={DURUM[durum].tur}>{DURUM[durum].ad}</Rozet>;

/** firmanın adresi: <alt alan>.<ana alan> (yerelde kapısız gösterilir) */
export const firmaAdresi = (alt: string, anaAlan: string) => `${alt}.${anaAlan}`;

/* Depo (maket: firmanın kendi S3 deposu zorunlu — KOD-GECIS Y2b, K7). Bugün dosyalar uygulamanın deposunda: deneme yayınında veritabanı (347),
   geliştirmede klasör. Firmanın kendi deposu bağlanınca bu metin ve "depo bağlanmadan açılmaz" engeli gelir. */
export type DepoTuru = "vt" | "klasor";
export const DEPO_AD: Record<DepoTuru, string> = { vt: "probata veritabanı (deneme)", klasor: "Yerel klasör (geliştirme)" };
export const DEPO_NOT = "Firmanın kendi deposu (S3 uyumlu; raporlar 5 yıl, yedekler) yayından önce bağlanır. O zamana kadar dosyalar probata'nın deposunda tutulur.";

/** tarih: GG.AA.YYYY */
export const tarihYaz = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}`;
