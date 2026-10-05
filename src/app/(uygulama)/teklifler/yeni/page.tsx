/* YENİ TEKLİF (maket teklifler.html #/yeni; ?kopya=<id> "Yeni teklif (kopyala)", ?tesis=<id> tesisten başlat) — yalnız "yaz" düzeyi; öteki kişi
   yetkisiz ekranı görür. Kopyada müşteri / tesisler / koşullar / kalemler gelir (pasife alınan müşteri / tesis düşer, şeritte söylenir); numara ve
   tarih yeni. Başlangıç değeri sunucuda (form-degeri.ts). */
import type { Metadata } from "next";
import { Yetkisiz } from "../../../../components/hata/Hata";
import { modulBul } from "../../../../modules/moduller";
import { formDegeri } from "../../../../modules/teklifler/form-degeri";
import { teklifKarti, teklifSecenekleri } from "../../../../modules/teklifler/server/teklifler";
import { TeklifFormu } from "../../../../modules/teklifler/ui/TeklifFormu";
import { modulOturumu, oturumIslemi } from "../../../../server/kimlik/istek";

const MODUL = modulBul("teklifler")!;
export const metadata: Metadata = { title: "Yeni teklif" };

export default async function Sayfa({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  const q = await searchParams;
  const kopya = typeof q.kopya === "string" ? q.kopya : null, tesis = typeof q.tesis === "string" ? q.tesis : null;
  const [s, k] = await oturumIslemi(o, async (db) => [await teklifSecenekleri(db, o), kopya ? await teklifKarti(db, o, kopya) : null] as const);
  if (!s) return <Yetkisiz />;
  const { deger, dusen } = formDegeri(k, s, tesis);
  return <TeklifFormu secenekler={s} deger={deger} dusen={dusen} kopyaKaynak={k ? { id: k.id, no: k.no } : null} />;
}
