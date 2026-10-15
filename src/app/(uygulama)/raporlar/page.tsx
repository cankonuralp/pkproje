/* RAPORLAR (modül 14; maket raporlar.html #/): görebildiği raporlar — denetçi kendi, branş yöneticisi branşı, planlama ve firma yöneticisi
   hepsi. Rapor plan içinde oluşturulur; buradan açılır. 566: liste SUNUCUDA sayfalı (raporSayfasi — ilk sayfa burada, sonrakiler eylemle). */
import type { Metadata } from "next";
import { Yetkisiz } from "../../../components/hata/Hata";
import { modulBul } from "../../../modules/moduller";
import { imzamiBekleyenSayisi, raporSayfasi } from "../../../modules/raporlar/server/liste";
import { RaporListesi } from "../../../modules/raporlar/ui/RaporListesi";
import { modulGorur, modulOturumu, oturumIslemi } from "../../../server/kimlik/istek";
import type { ModulAnahtari } from "../../../server/yetki/tanim";

const MODUL = modulBul("raporlar")!, ONAYLAR = modulBul("onaylar")!;

export const metadata: Metadata = { title: MODUL.ad };

export default async function Sayfa() {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  const v = await oturumIslemi(o, async (db) => {
    const l = await raporSayfasi(db, o, {});
    return l ? { l, imza: await imzamiBekleyenSayisi(db, o) } : null;
  });
  if (!v) return <Yetkisiz />;
  /* imza şeridinin tuşu Onaylar'ı görene (318 incelemesi: Onaylar'ı kapalı kişi yetkisiz sayfaya giderdi) */
  return <RaporListesi ilk={v.l} imza={v.imza} imzaGor={modulGorur(o, ONAYLAR.no as ModulAnahtari)} />;
}
