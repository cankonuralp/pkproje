/* ONAYLAR (modül 15; maket onaylar.html #/): onay kuyruğu — branşın onaydaki raporları, en yeni üstte. Kapı ve süzgeç sunucuda (onayListeleri:
   Onaylar düzeyi; branş yöneticisi kendi branşını, firma yöneticisi hepsini görür; denetçi — C5 — yalnız imzasını bekleyen raporlarını).
   477: rapor yazmayan "kendi" düzeyi (muhasebe) Talepler'e, karar da vermiyorsa (planlama) Diğer belgeler'e açılır. */
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Yetkisiz } from "../../../components/hata/Hata";
import { modulBul } from "../../../modules/moduller";
import { onayListeleri } from "../../../modules/onaylar/server/onaylar";
import { ImzaBekleyen, OnayKuyrugu } from "../../../modules/onaylar/ui/OnayListesi";
import { modulOturumu, oturumIslemi } from "../../../server/kimlik/istek";

const MODUL = modulBul("onaylar")!;
export const metadata: Metadata = { title: MODUL.ad };

export default async function Sayfa() {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  const v = await oturumIslemi(o, (db) => onayListeleri(db, o));
  if (!v) return <Yetkisiz />;
  /* denetçi (C5): Onaylar'ı yalnız imzasını bekleyen raporları */
  if (v.yonetici) return <OnayKuyrugu v={v} />;
  if (v.imzaci) return <ImzaBekleyen v={v} />;
  redirect(v.talepOnaylar ? "/onaylar/talepler" : "/onaylar/diger");
}
