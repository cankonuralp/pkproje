import type { Metadata } from "next";
import { Yetkisiz } from "../../../components/hata/Hata";
import { modulBul } from "../../../modules/moduller";
import { planListesi } from "../../../modules/planlar/server/plan-ici";
import { bugunTr, planAcabilir } from "../../../modules/planlar/server/planlar";
import { PlanListesi } from "../../../modules/planlar/ui/PlanListesi";
import { modulOturumu, oturumIslemi } from "../../../server/kimlik/istek";

const MODUL = modulBul("planlar")!;

export const metadata: Metadata = { title: MODUL.ad };

/* Planlar (referans ekran): görülebilen planlar — denetçi yalnız ekibinde olduklarını görür (sunucuda). Plan aç yalnız yetkisi olana. */
export default async function Sayfa() {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  const kayitlar = await oturumIslemi(o, (db) => planListesi(db, o));
  if (!kayitlar) return <Yetkisiz />;
  return <PlanListesi kayitlar={kayitlar} bugun={bugunTr()} acabilir={planAcabilir(o)} />;
}
