/* Ekranı henüz yapılmamış modülün sayfası: başlık + boş durum. Reisim menüde bütün modüllerin görünmesini istedi
   (2026-09-23); ekranı yapılan modül bu bileşeni bırakır, kendi sayfasını çizer. Sayfa iş mantığı taşımaz (§8.11). */
import type { Modul } from "../../modules/moduller";
import { BosDurum } from "../bos/BosDurum";
import stil from "./ModulSayfasi.module.css";

export function ModulSayfasi({ modul }: { modul: Modul }) {
  return (
    <>
      <div className={stil.sayfaBas}>
        <h1>{modul.ad}</h1>
      </div>
      <BosDurum ikon={modul.ikon} baslik={`${modul.ad} ekranı hazır değil`} metin="Bu modülün ekranı henüz tasarlanmadı." />
    </>
  );
}
