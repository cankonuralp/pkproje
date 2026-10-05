/* MÜŞTERİ PANELİ › PLANLANAN KONTROLLER (321; maket musteri.html #/plan; karar 81): görebildiği tesislerin açık planları ve sonraki kontrol.
   Oturum ve görme sunucuda (müşteri oturumu + veritabanında müşteri rolü — planın yalnız tarih ve durum sütunları, 0032). */
import type { Metadata } from "next";
import { panelPlanlari } from "../../../../modules/musteri-paneli/server/panel";
import { PanelPlanListesi } from "../../../../modules/musteri-paneli/ui/PlanListesi";
import { musteriIslemi, musteriOturumGerekli } from "../../../../server/kimlik/istek";

export const metadata: Metadata = { title: "Planlanan kontroller" };

export default async function Sayfa() {
  const o = await musteriOturumGerekli();
  const v = await musteriIslemi(o, (db) => panelPlanlari(db));
  return <PanelPlanListesi v={v} />;
}
