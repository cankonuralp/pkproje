/* MÜŞTERİ PANELİ › MUAYENE PERSONELİ (323; maket musteri.html #/personel; P3): tesislerine giden muayene personeli ve firmanın müşteriye açtığı
   belgeleri. Oturum ve görme sunucuda (müşteri oturumu + veritabanında müşteri rolü — yalnız işlevlerin döndürdüğü, 0035). */
import type { Metadata } from "next";
import { panelPersoneli } from "../../../../modules/musteri-paneli/server/panel";
import { PanelPersonelListesi } from "../../../../modules/musteri-paneli/ui/PersonelListesi";
import { musteriIslemi, musteriOturumGerekli } from "../../../../server/kimlik/istek";

export const metadata: Metadata = { title: "Muayene personeli" };

export default async function Sayfa() {
  const o = await musteriOturumGerekli();
  const v = await musteriIslemi(o, (db) => panelPersoneli(db));
  return <PanelPersonelListesi v={v} />;
}
