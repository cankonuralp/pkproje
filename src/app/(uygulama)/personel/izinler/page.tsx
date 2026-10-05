/* PERSONEL › İZİN TALEPLERİ (maket personel.html #/izinler; 330): Talepler'den gelen izin talepleri; onay ya da gerekçeli red firma
   yöneticisinde (Talepler "değiştirir"). Personel'i görmeyen ya da izin onaylamayan: yetkisiz ekranı. */
import type { Metadata } from "next";
import { Yetkisiz } from "../../../../components/hata/Hata";
import { modulBul } from "../../../../modules/moduller";
import { izinTalepleri } from "../../../../modules/talepler/server/talepler";
import { IzinTalepleri } from "../../../../modules/talepler/ui/IzinTalepleri";
import { modulOturumu, oturumIslemi } from "../../../../server/kimlik/istek";

const MODUL = modulBul("personel")!;
export const metadata: Metadata = { title: "İzin talepleri" };

export default async function Sayfa() {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  const l = await oturumIslemi(o, (db) => izinTalepleri(db, o));
  if (!l) return <Yetkisiz />;
  return <IzinTalepleri l={l} />;
}
