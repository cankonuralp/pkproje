/* FİRMA AYARLARI (modül 22; maket firma-ayarlari.html — 334): kapı ve yetki sunucuda (Firma ayarları "gör"; değiştirmek "yaz"). */
import type { Metadata } from "next";
import { Yetkisiz } from "../../../components/hata/Hata";
import { modulBul } from "../../../modules/moduller";
import { firmaAyarlari } from "../../../modules/firma-ayarlari/server/ayarlar";
import { FirmaAyarlari } from "../../../modules/firma-ayarlari/ui/FirmaAyarlari";
import { modulOturumu, oturumIslemi } from "../../../server/kimlik/istek";

const MODUL = modulBul("firma-ayarlari")!;
export const metadata: Metadata = { title: MODUL.ad };

export default async function Sayfa() {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  const v = await oturumIslemi(o, (db) => firmaAyarlari(db, o));
  if (!v) return <Yetkisiz />;
  return <FirmaAyarlari v={v} />;
}
