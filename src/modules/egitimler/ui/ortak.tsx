/* Eğitimler ekranlarının ortak parçaları — istemci dosyası DEĞİL (sunucu sayfaları da kullanır) */
import { DOKUMAN_SEKMELERI } from "../../dokumanlar/ui/ortak";

export const tarihYaz = (iso: string | null) => (iso ? iso.slice(0, 10).split("-").reverse().join(".") : "—");
export const EGITIM_SEKMELERI = [...DOKUMAN_SEKMELERI, ["Eğitim türleri", "/dokumanlar/egitimler/turler"]] as const;
