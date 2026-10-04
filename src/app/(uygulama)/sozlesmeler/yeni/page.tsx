/* yeni iş sözleşmesi (maket sozlesmeler.html #/yeni) — yalnız "değiştirir" düzeyi; öteki kişi yetkisiz ekranı görür */
import type { Metadata } from "next";
import { Yetkisiz } from "../../../../components/hata/Hata";
import { modulBul } from "../../../../modules/moduller";
import { sozlesmeSecenekleri } from "../../../../modules/sozlesmeler/server/sozlesmeler";
import { SozlesmeFormu } from "../../../../modules/sozlesmeler/ui/SozlesmeFormu";
import { modulOturumu, oturumIslemi } from "../../../../server/kimlik/istek";

const MODUL = modulBul("sozlesmeler")!;
export const metadata: Metadata = { title: "Yeni sözleşme" };

export default async function Sayfa() {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  const s = await oturumIslemi(o, (db) => sozlesmeSecenekleri(db, o));
  if (!s) return <Yetkisiz />;
  return <SozlesmeFormu musteriler={s.musteriler} />;
}
