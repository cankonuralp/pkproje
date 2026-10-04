/* MÜŞTERİLER (maket musteriler.html #/) — liste. Kapı sunucuda (modül 3); veri modül işlevinden (yetki ve kiracı içeride). */
import type { Metadata } from "next";
import { Yetkisiz } from "../../../components/hata/Hata";
import { modulBul } from "../../../modules/moduller";
import { musteriDegistirir, musteriListesi } from "../../../modules/musteriler/server/musteriler";
import { MusteriListesi } from "../../../modules/musteriler/ui/MusteriListesi";
import { modulOturumu, oturumIslemi } from "../../../server/kimlik/istek";

const MODUL = modulBul("musteriler")!;
export const metadata: Metadata = { title: MODUL.ad };

export default async function Sayfa() {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  const liste = (await oturumIslemi(o, (db) => musteriListesi(db, o))) ?? [];
  return <MusteriListesi kayitlar={liste} ekleyebilir={musteriDegistirir(o)} />;
}
