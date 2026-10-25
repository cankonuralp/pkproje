/* ARAÇLAR › Tutanaklar (maket araclar.html #/tutanaklar): her teslim alma / teslim etme bir tutanak. Sürücü yalnız taraf olduklarını görür.
   481: süzgeçli liste (TutanakSayfasi). 2026-10-25 (belge doldurma): tutanak penceresinde "Belgeyi doldur" (tutanakDoldurulur). */
import type { Metadata } from "next";
import { Yetkisiz } from "../../../../components/hata/Hata";
import { modulBul } from "../../../../modules/moduller";
import { aracDegistirir, aracListesi, tutanakDoldurulur, tutanakListesi } from "../../../../modules/araclar/server/araclar";
import { TutanakSayfasi } from "../../../../modules/araclar/ui/AracListesi";
import { aracSekmeleri } from "../../../../modules/araclar/ui/ortak";
import { modulOturumu, oturumIslemi } from "../../../../server/kimlik/istek";

const MODUL = modulBul("araclar")!;
export const metadata: Metadata = { title: "Tutanaklar" };

export default async function Sayfa() {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  const [t, l, doldur] = await oturumIslemi(o, async (db) => [await tutanakListesi(db, o), await aracListesi(db, o), await tutanakDoldurulur(db, o)] as const);
  if (!t || !l) return <Yetkisiz />;
  return <TutanakSayfasi tutanaklar={t} baslik={l.kendi ? "Aracım" : "Araçlar"} sekmeler={aracSekmeleri(aracDegistirir(o), l.kendi)} doldur={doldur} />;
}
