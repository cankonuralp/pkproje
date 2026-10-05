/* MÜŞTERİ PANELİ › RAPORLARINIZ (maket musteri.html #/): müşterinin görebildiği imzalı raporların son sürümleri. Oturum ve görme sunucuda
   (müşteri oturumu + veritabanında müşteri rolü — kısıtlayıcı politikalar). */
import type { Metadata } from "next";
import { panelRaporlari } from "../../../modules/musteri-paneli/server/panel";
import { PanelRaporListesi } from "../../../modules/musteri-paneli/ui/RaporListesi";
import { musteriIslemi, musteriOturumGerekli } from "../../../server/kimlik/istek";

export const metadata: Metadata = { title: "Raporlarınız" };

export default async function Sayfa() {
  const o = await musteriOturumGerekli();
  const v = await musteriIslemi(o, (db) => panelRaporlari(db));
  return <PanelRaporListesi v={v} />;
}
