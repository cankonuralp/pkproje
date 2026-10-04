/* DÖKÜMANLAR › Diğer dökümanlar (maket standartlar.html #/diger) — firmanın kendi belgeleri (ad, tür, kod, revizyon, PDF). */
import type { Metadata } from "next";
import { Yetkisiz } from "../../../../components/hata/Hata";
import { modulBul } from "../../../../modules/moduller";
import { dokumanDegistirir, dokumanListesi } from "../../../../modules/dokumanlar/server/dokumanlar";
import { DokumanListesi } from "../../../../modules/dokumanlar/ui/Listeler";
import { modulOturumu, oturumIslemi } from "../../../../server/kimlik/istek";

const MODUL = modulBul("dokumanlar")!;
export const metadata: Metadata = { title: "Diğer dökümanlar" };

export default async function Sayfa() {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  const l = await oturumIslemi(o, (db) => dokumanListesi(db, o));
  if (!l) return <Yetkisiz />;
  return <DokumanListesi dokumanlar={l} yaz={dokumanDegistirir(o)} />;
}
