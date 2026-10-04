/* yeni personel (maket personel.html #/yeni) — yalnız "değiştirir" düzeyi (firma yöneticisi); öteki kişi yetkisiz ekranı görür */
import type { Metadata } from "next";
import { Yetkisiz } from "../../../../components/hata/Hata";
import { modulBul } from "../../../../modules/moduller";
import { PersonelFormu } from "../../../../modules/personel/ui/PersonelFormu";
import { modulOturumu } from "../../../../server/kimlik/istek";
import { duzey } from "../../../../server/yetki/canDo";
import type { ModulAnahtari } from "../../../../server/yetki/tanim";

const MODUL = modulBul("personel")!;
export const metadata: Metadata = { title: "Yeni personel" };

export default async function Sayfa() {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  if (duzey(o, MODUL.no as ModulAnahtari) !== "yaz") return <Yetkisiz />;
  return <PersonelFormu d={{ id: null, surum: -1, ad: "", eposta: "", imzaTel: "", basla: "", meslek: "", meslekMetin: "", diploma: "", oda: "", ekipnet: "", roller: null }} />;
}
