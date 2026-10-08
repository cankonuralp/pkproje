/* FİRMA AYARLARI › SAKLAMA SÜRESİ DOLACAK RAPORLAR (387; KOD-GECIS ENGEL 11): süresi 30 gün içinde dolacak imzalı raporlar — süre dolunca PDF'leri
   gece işiyle firmanın deposundan silinir. Yalnız firma yöneticisi (Firma ayarları "yaz"); öteki: yetkisiz ekranı. */
import type { Metadata } from "next";
import { Yetkisiz } from "../../../../components/hata/Hata";
import { modulBul } from "../../../../modules/moduller";
import { saklamaSayfasi } from "../../../../modules/firma-ayarlari/server/saklama";
import { SaklamaListesi } from "../../../../modules/firma-ayarlari/ui/SaklamaListesi";
import { modulOturumu, oturumIslemi } from "../../../../server/kimlik/istek";

const MODUL = modulBul("firma-ayarlari")!;
export const metadata: Metadata = { title: "Saklama süresi dolacak raporlar" };

export default async function Sayfa() {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  const v = await oturumIslemi(o, (db) => saklamaSayfasi(db, o));
  if (!v) return <Yetkisiz />;
  return <SaklamaListesi v={v} />;
}
