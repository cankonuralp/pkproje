/* MUHASEBE › İŞLER (maket muhasebe.html #/; 327): planın ilk raporu yazılınca iş görünür — proje no, müşteri / tesis, rapor (imzalı / toplam,
   faturalı), raporlanan (KDV hariç), açık alacak, durum. Vadesi geçen alacak ve faturaya hazır işler şeridi. Görmeyen: yetkisiz ekranı. */
import type { Metadata } from "next";
import { Yetkisiz } from "../../../components/hata/Hata";
import { modulBul } from "../../../modules/moduller";
import { bordroGonderebilir } from "../../../modules/muhasebe/server/bordro-gonder";
import { isSayfasi } from "../../../modules/muhasebe/server/muhasebe";
import { IsListesi } from "../../../modules/muhasebe/ui/Listeler";
import { modulOturumu, oturumIslemi } from "../../../server/kimlik/istek";

const MODUL = modulBul("muhasebe")!;
export const metadata: Metadata = { title: MODUL.ad };

export default async function Sayfa() {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  /* 566: liste SUNUCUDA sayfalı (isSayfasi — ilk sayfa burada, sonrakiler eylemle) */
  const v = await oturumIslemi(o, (db) => isSayfasi(db, o, {}));
  if (!v) return <Yetkisiz />;
  return <IsListesi ilk={v.liste} uyari={v.uyari} bordro={bordroGonderebilir(o)} />;
}
