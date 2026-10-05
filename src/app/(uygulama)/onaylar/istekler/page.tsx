/* ONAYLAR › REVİZE İSTEKLERİ (318; maket onaylar.html 141 W4): görebildiği tamamlanan raporlarda muayene uzmanlarının bekleyen revize istekleri;
   yalnız yönetici (denetçinin Onaylar'ı yalnız imzasını bekleyen raporlarıdır — C5). Görme ve yetki sunucuda. */
import type { Metadata } from "next";
import { Yetkisiz } from "../../../../components/hata/Hata";
import { modulBul } from "../../../../modules/moduller";
import { onayListeleri } from "../../../../modules/onaylar/server/onaylar";
import { RevizeIstekleri } from "../../../../modules/onaylar/ui/OnayListesi";
import { modulOturumu, oturumIslemi } from "../../../../server/kimlik/istek";

const MODUL = modulBul("onaylar")!;
export const metadata: Metadata = { title: "Revize istekleri" };

export default async function Sayfa() {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  const v = await oturumIslemi(o, (db) => onayListeleri(db, o));
  if (!v || !v.yonetici) return <Yetkisiz />;
  return <RevizeIstekleri v={v} />;
}
