/* ONAYLAR › İMZAMI BEKLEYEN RAPORLAR (C5; maket onaylar.html BB4): kişinin yazdığı, onaylanmış raporlar — son imza rapor ekranında. Yönetici
   aynı zamanda rapor yazıyorsa ayrı sekme; denetçinin Onaylar'ı zaten bu listedir (/onaylar). */
import type { Metadata } from "next";
import { Yetkisiz } from "../../../../components/hata/Hata";
import { modulBul } from "../../../../modules/moduller";
import { onayListeleri } from "../../../../modules/onaylar/server/onaylar";
import { ImzaBekleyen } from "../../../../modules/onaylar/ui/OnayListesi";
import { modulOturumu, oturumIslemi } from "../../../../server/kimlik/istek";

const MODUL = modulBul("onaylar")!;
export const metadata: Metadata = { title: "İmzamı bekleyen raporlar" };

export default async function Sayfa() {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  const v = await oturumIslemi(o, (db) => onayListeleri(db, o));
  if (!v) return <Yetkisiz />;
  return <ImzaBekleyen v={v} />;
}
