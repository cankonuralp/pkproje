/* MUHASEBE › GİDERLER (maket muhasebe.html #/giderler; 328): gider no, tür / açıklama, iş / personel, tutar (KDV dahil, KDV), durum, belge; onay
   bekleyen masraf ve belgesiz gider şeridi; Gider ekle, Excel'e aktar, Excel'den yükle. Görmeyen: yetkisiz ekranı. Değiştirme yalnız "yaz" düzeyine. */
import type { Metadata } from "next";
import { Yetkisiz } from "../../../../components/hata/Hata";
import { modulBul } from "../../../../modules/moduller";
import { bordroGonderebilir } from "../../../../modules/muhasebe/server/bordro-gonder";
import { giderListesi, giderSecenekleri } from "../../../../modules/muhasebe/server/giderler";
import { bugunTr } from "../../../../modules/muhasebe/server/muhasebe";
import { GiderListesi } from "../../../../modules/muhasebe/ui/Giderler";
import { modulOturumu, oturumIslemi } from "../../../../server/kimlik/istek";

const MODUL = modulBul("muhasebe")!;
export const metadata: Metadata = { title: "Giderler" };

export default async function Sayfa() {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  const v = await oturumIslemi(o, async (db) => ({ giderler: await giderListesi(db, o), secenekler: await giderSecenekleri(db, o) }));
  if (!v.giderler) return <Yetkisiz />;
  return <GiderListesi giderler={v.giderler} secenekler={v.secenekler} bugun={bugunTr()} bordro={bordroGonderebilir(o)} />;
}
