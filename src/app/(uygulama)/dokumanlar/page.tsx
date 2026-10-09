/* DÖKÜMANLAR › Standartlar (maket standartlar.html #/) — firmanın standart kütüphanesi. Kapı sunucuda (modül 4); yükleme yalnız "değiştirir".
   440: Mekanik / Elektrik sekmesi adresten (?brans=e). */
import type { Metadata } from "next";
import { Yetkisiz } from "../../../components/hata/Hata";
import { modulBul } from "../../../modules/moduller";
import { dokumanDegistirir, standartListesi } from "../../../modules/dokumanlar/server/dokumanlar";
import { StandartListesi } from "../../../modules/dokumanlar/ui/Listeler";
import { modulOturumu, oturumIslemi } from "../../../server/kimlik/istek";

const MODUL = modulBul("dokumanlar")!;
export const metadata: Metadata = { title: MODUL.ad };

export default async function Sayfa({ searchParams }: { searchParams: Promise<{ brans?: string }> }) {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  const brans = (await searchParams).brans === "e" ? "e" : "m";
  const l = await oturumIslemi(o, (db) => standartListesi(db, o));
  if (!l) return <Yetkisiz />;
  return <StandartListesi key={brans} standartlar={l} yaz={dokumanDegistirir(o)} brans={brans} />;
}
