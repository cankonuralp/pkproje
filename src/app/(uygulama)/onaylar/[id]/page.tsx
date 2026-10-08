/* ONAY EKRANI (maket onaylar.html #/r/<no>): gözden geçirme özeti, Onayla / Geri gönder / Onayı geri al / Durumu değiştir. Görme ve eylem
   yetkisi sunucuda — onayEkrani göremeyene null döner, var olduğu da söylenmez. Ekran rapor kimliği + sürümüyle anahtarlı (geçişten sonra yerel
   pencere durumu sıfırlansın). */
import "../../../../belge/belge.css";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Yetkisiz } from "../../../../components/hata/Hata";
import { raporBelgesi } from "../../../../belge/belge";
import { modulBul } from "../../../../modules/moduller";
import { raporBelgesiVerisi } from "../../../../modules/raporlar/server/raporlar";
import { depo } from "../../../../server/dosya/depo";
import { onayEkrani } from "../../../../modules/onaylar/server/onaylar";
import { OnayEkrani } from "../../../../modules/onaylar/ui/OnayEkrani";
import { modulOturumu, oturumIslemi } from "../../../../server/kimlik/istek";

const MODUL = modulBul("onaylar")!;
export const metadata: Metadata = { title: "Onay" };

export default async function Sayfa({ params }: { params: Promise<{ id: string }> }) {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  const { id } = await params;
  const sonuc = await oturumIslemi(o, async (db) => {
    const v = await onayEkrani(db, o, id);
    return v ? { v, b: await raporBelgesiVerisi(db, depo(), o, id) } : null;
  });
  if (!sonuc) notFound();
  const { v, b } = sonuc;
  return <OnayEkrani key={`${v.r.id}-${v.r.surum}`} v={v}
    belge={b ? <div className="rb-onizleme" tabIndex={0} role="region" aria-label="Rapor belgesi önizlemesi">{raporBelgesi(b.belge)}</div> : <p>Raporun belgesi görüntülenemiyor.</p>} />;
}
