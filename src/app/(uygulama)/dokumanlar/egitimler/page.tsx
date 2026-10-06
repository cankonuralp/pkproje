/* DÖKÜMANLAR › Eğitimler (maket egitimler.html #/) — personel eğitim kayıtları ve tekrar tarihleri. Kapı sunucuda (modül 10, Eğitimler);
   denetçi ("kendi") yalnız kendi kayıtlarını görür. */
import type { Metadata } from "next";
import { Yetkisiz } from "../../../../components/hata/Hata";
import { bugunTr, egitimDegistirir, egitimListesi } from "../../../../modules/egitimler/server/egitimler";
import { EgitimListesi } from "../../../../modules/egitimler/ui/EgitimListesi";
import { modulOturumu, oturumIslemi } from "../../../../server/kimlik/istek";

const MODUL = { no: 10 };   // Eğitimler: modül kaydında ayrı menü değil, Dökümanlar sekmesi (2026-09-28); yetkisi modül 10
export const metadata: Metadata = { title: "Eğitimler" };

export default async function Sayfa({ searchParams }: { searchParams: Promise<{ kisi?: string | string[] }> }) {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  const l = await oturumIslemi(o, (db) => egitimListesi(db, o));
  if (!l) return <Yetkisiz />;
  const { kisi } = await searchParams;
  return <EgitimListesi kayitlar={l.kayitlar} turler={l.turler} kisiler={l.kisiler} esik={l.esik} bugun={bugunTr()} yaz={egitimDegistirir(o)}
    kisi={typeof kisi === "string" ? kisi : undefined} />;
}
