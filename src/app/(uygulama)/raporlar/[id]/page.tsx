/* SAHA RAPORU (maket rapor.html M8; 311): plan içinde ekipmanın "Rapor oluştur"uyla açılan rapor. Kapı modül 14 (Raporlar); raporu görme
   yetkisi (gör / branşı / kendi) ve düzenleme (yalnız yazan, Yeni) sunucuda — sahaRaporu göremeyene null döner, var olduğu da söylenmez.
   Ekran SahaRaporu (istemci; yerel taslak rapor ya da formatı değişince sıfırlansın diye rapor kimliği + format sürümüyle anahtarlı). */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Yetkisiz } from "../../../../components/hata/Hata";
import { modulBul } from "../../../../modules/moduller";
import { sahaRaporu } from "../../../../modules/raporlar/server/raporlar";
import { SahaRaporu } from "../../../../modules/raporlar/ui/SahaRaporu";
import { modulOturumu, oturumIslemi } from "../../../../server/kimlik/istek";

const MODUL = modulBul("raporlar")!;
export const metadata: Metadata = { title: "Rapor" };

export default async function Sayfa({ params }: { params: Promise<{ id: string }> }) {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  const { id } = await params;
  const v = await oturumIslemi(o, (db) => sahaRaporu(db, o, id));
  if (!v) notFound();
  return <SahaRaporu key={`${v.id}-${v.formatSira}`} v={v} />;
}
