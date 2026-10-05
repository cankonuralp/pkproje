/* PERFORMANS › KİŞİ (maket performans.html #/p/<kişi>; 329): aynı ölçüler yalnız o kişi için, rapor süreci grafikleri (tamamlanma süresi, yazım /
   düzeltme / onay / son imza ortalaması) ve günlük iş (gün × tesis). Görmeyen ya da göremediği kişi (branş dışı; denetçi başkası): bulunamadı. */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Yetkisiz } from "../../../../components/hata/Hata";
import { modulBul } from "../../../../modules/moduller";
import { donemSecimi, performansKisi } from "../../../../modules/performans/server/performans";
import { KisiGorunumu } from "../../../../modules/performans/ui/Performans";
import { modulGorur, modulOturumu, oturumIslemi } from "../../../../server/kimlik/istek";

const MODUL = modulBul("performans")!;
export const metadata: Metadata = { title: "Kişinin performansı" };

export default async function Sayfa({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  const { id } = await params;
  const s = donemSecimi(await searchParams);
  const v = await oturumIslemi(o, (db) => performansKisi(db, o, id, s));
  if (!v) notFound();
  return <KisiGorunumu v={v} personelGor={modulGorur(o, 2)} isGor={modulGorur(o, 18)} />;
}
