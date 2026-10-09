/* FORMAT KURUCU (K4; RAPOR-FORMAT.md §6; maket ekipman-turleri.html #/tur/<kod>/kurucu): türün TASLAK rapor şablonu düzenlenir. Kapı ve yetki
   sunucuda (Ekipman türleri "değiştirir"); yayınlanmış ya da eski sürüm, başka tür / firma: önizlemeye döner ya da bulunamadı. Kayıt ve yayın
   denetimi modül işlevinde (rapor-format/server/formatlar.ts). */
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Yetkisiz } from "../../../../../../../components/hata/Hata";
import { Kirinti } from "../../../../../../../components/sayfa/Sayfa";
import { bransAd } from "../../../../../../../modules/ekipman-turleri/sema";
import { turOzeti } from "../../../../../../../modules/ekipman-turleri/server/turler";
import { modulBul } from "../../../../../../../modules/moduller";
import { formatAyrintisi, formatDegistirir } from "../../../../../../../modules/rapor-format/server/formatlar";
import { FormatKurucu } from "../../../../../../../modules/rapor-format/ui/FormatKurucu";
import { modulOturumu, oturumIslemi } from "../../../../../../../server/kimlik/istek";

const MODUL = modulBul("ekipman-turleri")!;
export const metadata: Metadata = { title: "Format kurucu" };

export default async function Sayfa({ params }: { params: Promise<{ id: string; sid: string }> }) {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  const { id, sid } = await params;
  const [f, tur] = await oturumIslemi(o, async (db) => {
    const f = await formatAyrintisi(db, o, sid);
    return [f, f && f.turId === id ? await turOzeti(db, id) : null] as const;
  });
  if (!f || !tur) notFound();
  /* yalnız taslak ve yalnız "değiştirir": öteki durumda salt okunur önizleme */
  if (f.durum !== "taslak" || !formatDegistirir(o) || !f.tanim) redirect(`/ekipman-turleri/${id}/sablon/${sid}`);
  return (
    <>
      <Kirinti ogeler={[[`Ekipman türleri · ${bransAd(tur.brans)}`, tur.brans === "e" ? "/ekipman-turleri?brans=e" : "/ekipman-turleri"],
        [tur.ad, `/ekipman-turleri/${tur.id}`], ["Format kurucu"]]} />
      <FormatKurucu turId={tur.id} turAd={tur.ad} turKod={tur.kod} format={{ id: f.id, surum: f.surum }} tanim={f.tanim} kaynakAd={f.kaynakAd} />
    </>
  );
}
