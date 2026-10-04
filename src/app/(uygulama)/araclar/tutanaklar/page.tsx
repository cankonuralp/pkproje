/* ARAÇLAR › Tutanaklar (maket araclar.html #/tutanaklar): her teslim alma / teslim etme bir tutanak. Sürücü yalnız taraf olduklarını görür. */
import type { Metadata } from "next";
import { Yetkisiz } from "../../../../components/hata/Hata";
import { SayfaBasi, Sekmeler } from "../../../../components/sayfa/Sayfa";
import { BosDurum } from "../../../../components/bos/BosDurum";
import { modulBul } from "../../../../modules/moduller";
import { aracDegistirir, aracListesi, tutanakListesi } from "../../../../modules/araclar/server/araclar";
import { aracSekmeleri, TutanakTablosu } from "../../../../modules/araclar/ui/AracListesi";
import { modulOturumu, oturumIslemi } from "../../../../server/kimlik/istek";

const MODUL = modulBul("araclar")!;
export const metadata: Metadata = { title: "Tutanaklar" };

export default async function Sayfa() {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  const [t, l] = await oturumIslemi(o, async (db) => [await tutanakListesi(db, o), await aracListesi(db, o)] as const);
  if (!t || !l) return <Yetkisiz />;
  return (
    <>
      <SayfaBasi baslik={l.kendi ? "Aracım" : "Araçlar"} sayac={<><b>{t.length}</b> tutanak</>} />
      <Sekmeler ad="Araç bölümleri" ogeler={aracSekmeleri(aracDegistirir(o), l.kendi)} secili="/araclar/tutanaklar" />
      {t.length ? <TutanakTablosu tutanaklar={t} />
        : <BosDurum ikon="file-text" baslik="Tutanak yok" metin="Her teslim alma ve teslim etme bir tutanak olarak burada birikir." />}
    </>
  );
}
