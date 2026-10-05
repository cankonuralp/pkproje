/* TEKLİFİ DÜZENLE (maket teklifler.html #/t/<no>/duzenle) — yalnız TASLAK ve yalnız "yaz" düzeyi; gönderilmiş teklif sayfasına döner. */
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Yetkisiz } from "../../../../../components/hata/Hata";
import { modulBul } from "../../../../../modules/moduller";
import { paraGirdi } from "../../../../../modules/teklifler/sema";
import { teklifKarti, teklifSecenekleri } from "../../../../../modules/teklifler/server/teklifler";
import { BOS_ADAY, TeklifFormu } from "../../../../../modules/teklifler/ui/TeklifFormu";
import { modulOturumu, oturumIslemi } from "../../../../../server/kimlik/istek";

const MODUL = modulBul("teklifler")!;
export const metadata: Metadata = { title: "Teklifi düzenle" };

export default async function Sayfa({ params }: { params: Promise<{ id: string }> }) {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  const { id } = await params;
  const [s, k] = await oturumIslemi(o, async (db) => [await teklifSecenekleri(db, o), await teklifKarti(db, o, id)] as const);
  if (!k) notFound();
  if (!s) return <Yetkisiz />;
  if (!k.izin.duzenle) redirect(`/teklifler/${k.id}`);   // yalnız taslak düzenlenir
  return (
    <TeklifFormu secenekler={s} id={k.id} surum={k.surum} no={k.no} deger={{
      tip: k.musteriKart ? "kayitli" : "aday", musteri: k.musteriKart?.id ?? "", tesis: k.tesisler[0]?.id ?? "", ekTesisler: k.tesisler.slice(1).map((t) => t.id),
      aday: { ...BOS_ADAY, ...Object.fromEntries(Object.entries(k.aday ?? {}).map(([a, b]) => [a, b ?? ""])) }, gecerlilik: String(k.gecerlilik), kdv: String(k.kdv),
      notlar: k.notlar ?? "", kalemler: k.kalemler.map((x) => ({ tur: x.turId, adet: String(x.adet), fiyat: paraGirdi(x.fiyat) })), ekipmanlar: k.ekipmanlar,
    }} />
  );
}
