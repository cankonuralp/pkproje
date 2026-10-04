/* Ekranı henüz yapılmamış modülün sayfası: başlık + boş durum. Reisim menüde bütün modüllerin görünmesini istedi
   (2026-09-23); ekranı yapılan modül bu bileşeni bırakır, kendi sayfasını çizer. Sayfa iş mantığı taşımaz (§8.11).
   K1 (2026-10-04): sayfa düzeyi yetki SUNUCUDA — kişi modülü göremiyorsa içerik yerine Yetkisiz (menüde de yoktur; adresi elle yazan da
   giremez). Kayıt düzeyi denetimi modül işlevinde ayrıca yapılır. */
import type { Modul } from "../../modules/moduller";
import { modulGorur, oturumGerekli } from "../../server/kimlik/istek";
import type { ModulAnahtari } from "../../server/yetki/tanim";
import { BosDurum } from "../bos/BosDurum";
import { Yetkisiz } from "../hata/Hata";
import stil from "./ModulSayfasi.module.css";

export async function ModulSayfasi({ modul }: { modul: Pick<Modul, "ad" | "ikon"> & { no?: number } }) {
  if (modul.no !== undefined) {
    const o = await oturumGerekli();
    if (!modulGorur(o, modul.no as ModulAnahtari)) return <Yetkisiz />;
  }
  return (
    <>
      <div className={stil.sayfaBas}>
        <h1>{modul.ad}</h1>
      </div>
      <BosDurum ikon={modul.ikon} baslik={`${modul.ad} ekranı hazır değil`} metin="Bu modülün ekranı henüz tasarlanmadı." />
    </>
  );
}
