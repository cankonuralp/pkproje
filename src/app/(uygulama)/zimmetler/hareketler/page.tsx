/* ZİMMETLER › Hareketler (maket zimmetler.html #/hareketler) — her teslim ayrı, değişmez kayıt. Kapı sunucuda (modül 9). */
import type { Metadata } from "next";
import { Yetkisiz } from "../../../../components/hata/Hata";
import { modulBul } from "../../../../modules/moduller";
import { zimmetListeleri } from "../../../../modules/zimmetler/server/zimmet";
import { HareketListesi } from "../../../../modules/zimmetler/ui/ZimmetListesi";
import { modulOturumu, oturumIslemi } from "../../../../server/kimlik/istek";

const MODUL = modulBul("zimmetler")!;
export const metadata: Metadata = { title: "Hareketler" };

export default async function Sayfa() {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  const l = await oturumIslemi(o, (db) => zimmetListeleri(db, o));
  return <HareketListesi hareketler={l?.hareketler ?? []} />;
}
