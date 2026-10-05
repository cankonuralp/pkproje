/* TEKLİFİ DÜZENLE (maket teklifler.html #/t/<no>/duzenle) — yalnız TASLAK ve yalnız "yaz" düzeyi; gönderilmiş teklif sayfasına döner. Başlangıç
   değeri sunucuda (form-degeri.ts; pasife alınan müşteri / tesis düşer, şeritte söylenir). */
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Yetkisiz } from "../../../../../components/hata/Hata";
import { modulBul } from "../../../../../modules/moduller";
import { formDegeri } from "../../../../../modules/teklifler/form-degeri";
import { teklifKarti, teklifSecenekleri } from "../../../../../modules/teklifler/server/teklifler";
import { TeklifFormu } from "../../../../../modules/teklifler/ui/TeklifFormu";
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
  const { deger, dusen } = formDegeri(k, s);
  return <TeklifFormu secenekler={s} id={k.id} surum={k.surum} no={k.no} deger={deger} dusen={dusen} />;
}
