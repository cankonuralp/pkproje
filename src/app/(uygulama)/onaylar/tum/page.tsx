/* ONAYLAR › TÜM RAPORLAR (maket onaylar.html #/tum — 190): branşın bütün raporları; satır onay ekranını açar (Durumu değiştir, Onayı geri al). */
import type { Metadata } from "next";
import { Yetkisiz } from "../../../../components/hata/Hata";
import { modulBul } from "../../../../modules/moduller";
import { onayListeleri } from "../../../../modules/onaylar/server/onaylar";
import { TumRaporlar } from "../../../../modules/onaylar/ui/OnayListesi";
import { modulOturumu, oturumIslemi } from "../../../../server/kimlik/istek";

const MODUL = modulBul("onaylar")!;
export const metadata: Metadata = { title: "Tüm raporlar" };

export default async function Sayfa() {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  const v = await oturumIslemi(o, (db) => onayListeleri(db, o));
  if (!v) return <Yetkisiz />;
  return <TumRaporlar v={v} />;
}
