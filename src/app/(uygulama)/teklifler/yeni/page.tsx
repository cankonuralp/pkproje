/* YENİ TEKLİF (maket teklifler.html #/yeni; ?kopya=<id> "Yeni teklif (kopyala)", ?tesis=<id> tesisten başlat) — yalnız "yaz" düzeyi; öteki kişi
   yetkisiz ekranı görür. Kopyada müşteri / tesisler / koşullar / kalemler gelir; numara ve tarih yeni. */
import type { Metadata } from "next";
import { Yetkisiz } from "../../../../components/hata/Hata";
import { modulBul } from "../../../../modules/moduller";
import { paraGirdi } from "../../../../modules/teklifler/sema";
import { teklifKarti, teklifSecenekleri } from "../../../../modules/teklifler/server/teklifler";
import { BOS_ADAY, TeklifFormu, type TeklifFormDegeri } from "../../../../modules/teklifler/ui/TeklifFormu";
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
  const tm = tesis ? s.musteriler.find((m) => m.tesisler.some((t) => t.id === tesis)) : undefined;
  const deger: TeklifFormDegeri = k
    ? {
        tip: k.musteriKart ? "kayitli" : "aday", musteri: k.musteriKart?.id ?? "", tesis: k.tesisler[0]?.id ?? "", ekTesisler: k.tesisler.slice(1).map((t) => t.id),
        aday: { ...BOS_ADAY, ...Object.fromEntries(Object.entries(k.aday ?? {}).map(([a, b]) => [a, b ?? ""])) }, gecerlilik: String(k.gecerlilik), kdv: String(k.kdv),
        notlar: k.notlar ?? "", kalemler: k.kalemler.map((x) => ({ tur: x.turId, adet: String(x.adet), fiyat: paraGirdi(x.fiyat) })), ekipmanlar: k.ekipmanlar,
      }
    : { tip: "kayitli", musteri: tm?.id ?? "", tesis: tm ? tesis! : "", ekTesisler: [], aday: BOS_ADAY, gecerlilik: "", kdv: "20", notlar: "", kalemler: [{ tur: "", adet: "1", fiyat: "" }], ekipmanlar: [] };
  return <TeklifFormu secenekler={s} deger={deger} kopyaKaynak={k ? { id: k.id, no: k.no } : null} />;
}
