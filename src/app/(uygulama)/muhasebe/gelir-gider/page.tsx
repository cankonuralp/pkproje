/* MUHASEBE › GELİR-GİDER (maket muhasebe.html #/gelir-gider; 328 — reisim 2026-09-27: "gelir gidere göre bilançoda olacak", L3 toplam): dönem
   seçilir (Toplam ya da son 13 ay; ?ay=YYYY-AA). O dönemin geliri (denetlenen işlerin raporlananı, KDV hariç), maaşlar (bordro, işverene
   maliyet), işe bağlı ve genel masraflar, sabit giderler; kâr. Toplamda aylara göre döküm, ayda işlerin kârı. Görmeyen: yetkisiz ekranı. */
import type { Metadata } from "next";
import { Yetkisiz } from "../../../../components/hata/Hata";
import { modulBul } from "../../../../modules/moduller";
import { gelirGider } from "../../../../modules/muhasebe/server/muhasebe";
import { GelirGiderGorunumu } from "../../../../modules/muhasebe/ui/Karlilik";
import { modulOturumu, oturumIslemi } from "../../../../server/kimlik/istek";

const MODUL = modulBul("muhasebe")!;
export const metadata: Metadata = { title: "Gelir-gider" };

export default async function Sayfa({ searchParams }: { searchParams: Promise<{ ay?: string | string[] }> }) {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  const { ay } = await searchParams;
  const v = await oturumIslemi(o, (db) => gelirGider(db, o, typeof ay === "string" ? ay : "toplam"));
  if (!v) return <Yetkisiz />;
  return <GelirGiderGorunumu v={v} />;
}
