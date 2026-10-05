/* MÜŞTERİ PANELİ › SÖZLEŞMELER (322; maket musteri.html #/sozlesme; karar 134): görebildiği iş sözleşmeleri. Oturum ve görme sunucuda
   (müşteri oturumu + veritabanında müşteri rolü — sözleşmenin yalnız izinli sütunları, 0034). */
import type { Metadata } from "next";
import { panelSozlesmeleri } from "../../../../modules/musteri-paneli/server/panel";
import { PanelSozlesmeListesi } from "../../../../modules/musteri-paneli/ui/SozlesmeListesi";
import { musteriIslemi, musteriOturumGerekli } from "../../../../server/kimlik/istek";

export const metadata: Metadata = { title: "Sözleşmeler" };

export default async function Sayfa() {
  const o = await musteriOturumGerekli();
  const v = await musteriIslemi(o, (db) => panelSozlesmeleri(db));
  return <PanelSozlesmeListesi v={v} />;
}
