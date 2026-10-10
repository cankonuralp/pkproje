/* DÖKÜMANLAR › Eğitim türleri (maket egitimler.html #/turler) — firmanın eğitimleri ve tekrar süreleri (153: firma ekler / düzenler). 479: Eğitimler'in alt
   sekmesi (üst sırada Eğitimler seçili). */
import type { Metadata } from "next";
import { Yetkisiz } from "../../../../../components/hata/Hata";
import { egitimDegistirir, egitimListesi } from "../../../../../modules/egitimler/server/egitimler";
import { TurListesi } from "../../../../../modules/egitimler/ui/EgitimListesi";
import { modulOturumu, oturumIslemi } from "../../../../../server/kimlik/istek";

const MODUL = { no: 10 };   // Eğitimler: modül kaydında ayrı menü değil, Dökümanlar sekmesi (2026-09-28); yetkisi modül 10
export const metadata: Metadata = { title: "Eğitim türleri" };

export default async function Sayfa() {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  const l = await oturumIslemi(o, (db) => egitimListesi(db, o));
  if (!l) return <Yetkisiz />;
  return <TurListesi turler={l.turler} yaz={egitimDegistirir(o)} kayitSayisi={l.kayitlar.filter((x) => !x.onceki).length} />;
}
