/* SÖZLEŞMELER (maket sozlesmeler.html #/) — iş sözleşmeleri. Kapı sunucuda (modül 12); denetçi ("kendi") yalnız kendi İSG-KATİP ID'si olanları görür.
   449: yan menüdeki kırmızı sayının planları (İSG-KATİP ID'si eksik / bitmiş açık planlar) listenin üstünde. */
import type { Metadata } from "next";
import { Yetkisiz } from "../../../components/hata/Hata";
import { isgEksikTakip } from "../../../modules/anasayfa/server/takip";
import { modulBul } from "../../../modules/moduller";
import { sablonlar, sozlesmeDegistirir, sozlesmeListesi } from "../../../modules/sozlesmeler/server/sozlesmeler";
import { SozlesmeListesi } from "../../../modules/sozlesmeler/ui/SozlesmeListesi";
import { modulOturumu, oturumIslemi } from "../../../server/kimlik/istek";

const MODUL = modulBul("sozlesmeler")!;
export const metadata: Metadata = { title: MODUL.ad };

export default async function Sayfa() {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  const [l, s, eksik] = await oturumIslemi(o, async (db) => [await sozlesmeListesi(db, o), await sablonlar(db, o), await isgEksikTakip(db, o)] as const);
  if (!l) return <Yetkisiz />;
  return <SozlesmeListesi sozlesmeler={l} yaz={sozlesmeDegistirir(o)} sablonlar={s} isgEksik={eksik} />;
}
