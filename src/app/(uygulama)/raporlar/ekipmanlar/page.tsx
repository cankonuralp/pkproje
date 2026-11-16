/* RAPORLAR › EKİPMANLAR (2026-11-16; reisim: "teknik yönetici tarafında gözüksün, o silebilsin sadece", "herkesinkini raporlar ekranında bir sekme de
   görsün"): firmanın bütün ekipmanları — yalnız teknik yöneticiye (kendi branşı); kullanılmamış olanı siler. Kapı sunucuda (ekipmanSayfasi). */
import type { Metadata } from "next";
import { Yetkisiz } from "../../../../components/hata/Hata";
import { modulBul } from "../../../../modules/moduller";
import { ekipmanSayfasi } from "../../../../modules/raporlar/server/ekipmanlar";
import { EkipmanListesi } from "../../../../modules/raporlar/ui/EkipmanListesi";
import { modulOturumu, oturumIslemi } from "../../../../server/kimlik/istek";

const MODUL = modulBul("raporlar")!;

export const metadata: Metadata = { title: "Ekipmanlar" };

export default async function Sayfa() {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  const l = await oturumIslemi(o, (db) => ekipmanSayfasi(db, o, {}));
  if (!l) return <Yetkisiz />;
  return <EkipmanListesi ilk={l} />;
}
