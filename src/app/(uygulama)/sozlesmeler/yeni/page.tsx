/* yeni iş sözleşmesi (maket sozlesmeler.html #/yeni; ?teklif=<id> — teklif sayfasındaki "İş sözleşmesi": müşteri, Dayanak teklif ve teklifin etkin
   tesisleri dolu açılır, 326) — yalnız "değiştirir" düzeyi; öteki kişi yetkisiz ekranı görür */
import type { Metadata } from "next";
import { Yetkisiz } from "../../../../components/hata/Hata";
import { modulBul } from "../../../../modules/moduller";
import { sozlesmeSecenekleri } from "../../../../modules/sozlesmeler/server/sozlesmeler";
import { SozlesmeFormu } from "../../../../modules/sozlesmeler/ui/SozlesmeFormu";
import { modulOturumu, oturumIslemi } from "../../../../server/kimlik/istek";

const MODUL = modulBul("sozlesmeler")!;
export const metadata: Metadata = { title: "Yeni sözleşme" };

export default async function Sayfa({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  const q = await searchParams;
  const s = await oturumIslemi(o, (db) => sozlesmeSecenekleri(db, o));
  if (!s) return <Yetkisiz />;
  const t = typeof q.teklif === "string" ? s.teklifler.find((x) => x.id === q.teklif) : undefined;
  const m = t ? s.musteriler.find((x) => x.id === t.musteri) : undefined;
  const baslangic = t && m ? { musteri: m.id, teklif: t.id, tesisler: t.tesisler.filter((y) => m.tesisler.some((z) => z.id === y)) } : null;
  return <SozlesmeFormu musteriler={s.musteriler} teklifler={s.teklifler} baslangicDegeri={baslangic} />;
}
