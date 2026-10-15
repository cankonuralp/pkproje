/* MUHASEBE › GİDERLER (maket muhasebe.html #/giderler; 328): gider no, tür / açıklama, iş / personel, tutar (KDV dahil, KDV), durum, belge; onay
   bekleyen masraf ve belgesiz gider şeridi; Gider ekle, Excel'e aktar, Excel'den yükle. Görmeyen: yetkisiz ekranı. Değiştirme yalnız "yaz" düzeyine. */
import type { Metadata } from "next";
import { Yetkisiz } from "../../../../components/hata/Hata";
import { modulBul } from "../../../../modules/moduller";
import { bordroGonderebilir } from "../../../../modules/muhasebe/server/bordro-gonder";
import { giderSayfasi, giderSecenekleri } from "../../../../modules/muhasebe/server/giderler";
import { bugunTr } from "../../../../modules/muhasebe/server/muhasebe";
import { GiderListesi } from "../../../../modules/muhasebe/ui/Giderler";
import { modulOturumu, oturumIslemi } from "../../../../server/kimlik/istek";

const MODUL = modulBul("muhasebe")!;
export const metadata: Metadata = { title: "Giderler" };

export default async function Sayfa() {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  /* 576: liste SUNUCUDA sayfalı (giderSayfasi — ilk sayfa + toplamlar burada, sonrakiler eylemle) */
  const v = await oturumIslemi(o, async (db) => ({ ilk: await giderSayfasi(db, o, {}), secenekler: await giderSecenekleri(db, o) }));
  if (!v.ilk) return <Yetkisiz />;
  return <GiderListesi ilk={v.ilk} secenekler={v.secenekler} bugun={bugunTr()} bordro={bordroGonderebilir(o)} />;
}
