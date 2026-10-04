/* ZİMMETLER › Kimde (maket zimmetler.html #/) — anlık "kimde" listesi. Kapı sunucuda (modül 9); "kendi" düzeyi yalnız kendi zimmetini görür. */
import type { Metadata } from "next";
import { Yetkisiz } from "../../../components/hata/Hata";
import { modulBul } from "../../../modules/moduller";
import { bugunTr } from "../../../modules/olcum-cihazlari/server/cihazlar";
import { zimmetDegistirir, zimmetListeleri } from "../../../modules/zimmetler/server/zimmet";
import { KimdeListesi } from "../../../modules/zimmetler/ui/ZimmetListesi";
import { modulOturumu, oturumIslemi } from "../../../server/kimlik/istek";

const MODUL = modulBul("zimmetler")!;
export const metadata: Metadata = { title: MODUL.ad };

export default async function Sayfa() {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  const l = await oturumIslemi(o, (db) => zimmetListeleri(db, o));
  return <KimdeListesi varliklar={l?.varliklar ?? []} kisiler={l?.kisiler ?? []} bugun={bugunTr()} yaz={zimmetDegistirir(o)} />;
}
