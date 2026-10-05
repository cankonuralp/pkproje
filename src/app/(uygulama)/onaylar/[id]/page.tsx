/* ONAY EKRANI (maket onaylar.html #/r/<no>): gözden geçirme özeti, Onayla / Geri gönder / Onayı geri al / Durumu değiştir. Görme ve eylem
   yetkisi sunucuda — onayEkrani göremeyene null döner, var olduğu da söylenmez. Ekran rapor kimliği + sürümüyle anahtarlı (geçişten sonra yerel
   pencere durumu sıfırlansın). */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Yetkisiz } from "../../../../components/hata/Hata";
import { modulBul } from "../../../../modules/moduller";
import { onayEkrani } from "../../../../modules/onaylar/server/onaylar";
import { OnayEkrani } from "../../../../modules/onaylar/ui/OnayEkrani";
import { modulOturumu, oturumIslemi } from "../../../../server/kimlik/istek";

const MODUL = modulBul("onaylar")!;
export const metadata: Metadata = { title: "Onay" };

export default async function Sayfa({ params }: { params: Promise<{ id: string }> }) {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  const { id } = await params;
  const v = await oturumIslemi(o, (db) => onayEkrani(db, o, id));
  if (!v) notFound();
  return <OnayEkrani key={`${v.r.id}-${v.r.surum}`} v={v} />;
}
