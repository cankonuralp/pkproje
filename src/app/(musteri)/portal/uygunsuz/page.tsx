/* MÜŞTERİ PANELİ › UYGUNSUZLUKLAR (320; maket musteri.html #/uygunsuz): görebildiği imzalı raporların uygunsuzlukları + "Uygunsuzları indir"
   (Excel, rapor bağlantılı). Oturum ve görme sunucuda (müşteri oturumu + veritabanında müşteri rolü — kısıtlayıcı politikalar). */
import type { Metadata } from "next";
import { panelUygunsuzlukSayfasi } from "../../../../modules/musteri-paneli/server/panel";
import { PanelUygunsuzlukListesi } from "../../../../modules/musteri-paneli/ui/UygunsuzlukListesi";
import { musteriIslemi, musteriOturumGerekli } from "../../../../server/kimlik/istek";

export const metadata: Metadata = { title: "Uygunsuzluklar" };

export default async function Sayfa() {
  const o = await musteriOturumGerekli();
  /* 577: liste SUNUCUDA sayfalı — ilk sayfa burada, sonrakiler eylemle */
  const v = await musteriIslemi(o, (db) => panelUygunsuzlukSayfasi(db, {}));
  return <PanelUygunsuzlukListesi v={v} />;
}
