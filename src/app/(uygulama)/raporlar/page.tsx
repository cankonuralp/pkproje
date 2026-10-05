/* RAPORLAR (modül 14; maket raporlar.html #/): görebildiği raporlar — denetçi kendi, branş yöneticisi branşı, planlama ve firma yöneticisi
   hepsi (görme sunucuda, raporListesi). Rapor plan içinde oluşturulur; buradan açılır. */
import type { Metadata } from "next";
import { Yetkisiz } from "../../../components/hata/Hata";
import { modulBul } from "../../../modules/moduller";
import { raporListesi } from "../../../modules/raporlar/server/raporlar";
import { RaporListesi } from "../../../modules/raporlar/ui/RaporListesi";
import { modulGorur, modulOturumu, oturumIslemi } from "../../../server/kimlik/istek";
import type { ModulAnahtari } from "../../../server/yetki/tanim";

const MODUL = modulBul("raporlar")!, ONAYLAR = modulBul("onaylar")!;

export const metadata: Metadata = { title: MODUL.ad };

export default async function Sayfa() {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  const l = await oturumIslemi(o, (db) => raporListesi(db, o));
  if (!l) return <Yetkisiz />;
  /* imza şeridinin tuşu Onaylar'ı görene (318 incelemesi: Onaylar'ı kapalı kişi yetkisiz sayfaya giderdi) */
  return <RaporListesi kayitlar={l} imzaGor={modulGorur(o, ONAYLAR.no as ModulAnahtari)} />;
}
