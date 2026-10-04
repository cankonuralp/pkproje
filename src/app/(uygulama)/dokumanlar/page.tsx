/* DÖKÜMANLAR › Standartlar (maket standartlar.html #/) — firmanın standart kütüphanesi. Kapı sunucuda (modül 4); yükleme yalnız "değiştirir". */
import type { Metadata } from "next";
import { Yetkisiz } from "../../../components/hata/Hata";
import { modulBul } from "../../../modules/moduller";
import { dokumanDegistirir, standartListesi } from "../../../modules/dokumanlar/server/dokumanlar";
import { StandartListesi } from "../../../modules/dokumanlar/ui/Listeler";
import { modulOturumu, oturumIslemi } from "../../../server/kimlik/istek";

const MODUL = modulBul("dokumanlar")!;
export const metadata: Metadata = { title: MODUL.ad };

export default async function Sayfa() {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  const l = await oturumIslemi(o, (db) => standartListesi(db, o));
  if (!l) return <Yetkisiz />;
  return <StandartListesi standartlar={l} yaz={dokumanDegistirir(o)} />;
}
