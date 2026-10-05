/* MÜŞTERİ PANELİ › UYGUNSUZLUKLAR (320; maket musteri.html #/uygunsuz): görebildiği imzalı raporların uygunsuzlukları + "Uygunsuzları indir"
   (Excel, rapor bağlantılı). Oturum ve görme sunucuda (müşteri oturumu + veritabanında müşteri rolü — kısıtlayıcı politikalar). */
import type { Metadata } from "next";
import { panelUygunsuzluklari } from "../../../../modules/musteri-paneli/server/panel";
import { PanelUygunsuzlukListesi } from "../../../../modules/musteri-paneli/ui/UygunsuzlukListesi";
import { musteriIslemi, musteriOturumGerekli } from "../../../../server/kimlik/istek";

export const metadata: Metadata = { title: "Uygunsuzluklar" };

export default async function Sayfa() {
  const o = await musteriOturumGerekli();
  const v = await musteriIslemi(o, (db) => panelUygunsuzluklari(db));
  return <PanelUygunsuzlukListesi v={v} />;
}
