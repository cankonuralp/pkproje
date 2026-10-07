/* ÖLÇÜM CİHAZLARI (maket olcum-cihazlari.html #/) — liste + kalibrasyon uyarı şeritleri. Kapı sunucuda (modül 8). */
import type { Metadata } from "next";
import { Yetkisiz } from "../../../components/hata/Hata";
import { modulBul } from "../../../modules/moduller";
import { bugunTr, cihazDegistirir, cihazListesi, cihazTuruListesi, cihazTurleri } from "../../../modules/olcum-cihazlari/server/cihazlar";
import { CihazListesi } from "../../../modules/olcum-cihazlari/ui/CihazListesi";
import { modulOturumu, oturumIslemi } from "../../../server/kimlik/istek";

const MODUL = modulBul("olcum-cihazlari")!;
export const metadata: Metadata = { title: MODUL.ad };

export default async function Sayfa() {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  const [liste, turler, turSatirlari] = await oturumIslemi(o, async (db) => [await cihazListesi(db, o), await cihazTurleri(db, o),
    cihazDegistirir(o) ? await cihazTuruListesi(db, o) : []] as const);
  return <CihazListesi kayitlar={liste?.cihazlar ?? []} turler={turler} esik={liste?.esik ?? 30} bugun={bugunTr()} ekleyebilir={cihazDegistirir(o)} turSatirlari={turSatirlari} />;
}
