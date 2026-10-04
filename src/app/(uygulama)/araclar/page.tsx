/* ARAÇLAR (maket araclar.html #/ yönetici · #/benim sürücü) — kimde, kilometre, belge bitişleri. Kapı sunucuda (modül 23); "kendi" düzeyi
   (sürücü) yalnız kendi zimmetindeki aracı görür ve haftalık kilometreyi yazar. */
import type { Metadata } from "next";
import { Yetkisiz } from "../../../components/hata/Hata";
import { modulBul } from "../../../modules/moduller";
import { aracDegistirir, aracListesi } from "../../../modules/araclar/server/araclar";
import { AracListesi } from "../../../modules/araclar/ui/AracListesi";
import { modulOturumu, oturumIslemi } from "../../../server/kimlik/istek";

const MODUL = modulBul("araclar")!;
export const metadata: Metadata = { title: MODUL.ad };

export default async function Sayfa() {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  const l = await oturumIslemi(o, (db) => aracListesi(db, o));
  if (!l) return <Yetkisiz />;
  return <AracListesi araclar={l.araclar} kisiler={l.kisiler} yaz={aracDegistirir(o)} kendi={l.kendi} />;
}
