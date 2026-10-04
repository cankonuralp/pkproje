import type { Metadata } from "next";
import { BosDurum } from "../../../components/bos/BosDurum";
import { Yetkisiz } from "../../../components/hata/Hata";
import { SayfaBasi } from "../../../components/sayfa/Sayfa";
import { TusBaglanti } from "../../../components/tus/Tus";
import { modulBul } from "../../../modules/moduller";
import { planAcabilir } from "../../../modules/planlar/server/planlar";
import { modulOturumu } from "../../../server/kimlik/istek";

const MODUL = modulBul("planlar")!;

export const metadata: Metadata = { title: MODUL.ad };

/* Planlar (referans ekran). Liste ve plan içi Planlar kaleminde (K3); şimdilik Plan aç tuşu (yalnız plan açma yetkisi olana). */
export default async function Sayfa() {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  return (
    <>
      <SayfaBasi baslik={MODUL.ad} tuslar={planAcabilir(o) && <TusBaglanti tur="birincil" ikon="plus" href="/planlar/ac">Plan aç</TusBaglanti>} />
      <BosDurum ikon={MODUL.ikon} baslik={`${MODUL.ad} listesi hazır değil`} metin="Plan listesi ve plan içi sıradaki kalemde." />
    </>
  );
}
