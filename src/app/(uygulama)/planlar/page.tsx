import type { Metadata } from "next";
import { Yetkisiz } from "../../../components/hata/Hata";
import { modulBul } from "../../../modules/moduller";
import { planSayfasi } from "../../../modules/planlar/server/liste";
import { planAcabilir } from "../../../modules/planlar/server/planlar";
import { PlanListesi } from "../../../modules/planlar/ui/PlanListesi";
import { modulOturumu, oturumIslemi } from "../../../server/kimlik/istek";

const MODUL = modulBul("planlar")!;

export const metadata: Metadata = { title: MODUL.ad };

/* Planlar (referans ekran): görülebilen planlar — denetçi yalnız ekibinde olduklarını görür (sunucuda). Plan aç yalnız yetkisi olana.
   566: liste SUNUCUDA sayfalı (planSayfasi — ilk sayfa burada, sonrakiler eylemle). */
export default async function Sayfa() {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  const ilk = await oturumIslemi(o, (db) => planSayfasi(db, o, {}));
  if (!ilk) return <Yetkisiz />;
  return <PlanListesi ilk={ilk} acabilir={planAcabilir(o)} />;
}
