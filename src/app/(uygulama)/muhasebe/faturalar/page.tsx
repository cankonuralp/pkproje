/* MUHASEBE › FATURALAR (maket muhasebe.html #/faturalar; 327): fatura no (tarih), müşteri / iş, vade (kalan gün ya da geçen), tutar (KDV dahil),
   kalan, durum. Görmeyen: yetkisiz ekranı. */
import type { Metadata } from "next";
import { Yetkisiz } from "../../../../components/hata/Hata";
import { modulBul } from "../../../../modules/moduller";
import { faturaListesi, isListesi } from "../../../../modules/muhasebe/server/muhasebe";
import { FaturaListesi } from "../../../../modules/muhasebe/ui/Listeler";
import { modulOturumu, oturumIslemi } from "../../../../server/kimlik/istek";

const MODUL = modulBul("muhasebe")!;
export const metadata: Metadata = { title: "Faturalar" };

export default async function Sayfa() {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  const v = await oturumIslemi(o, async (db) => ({ isler: await isListesi(db, o), faturalar: await faturaListesi(db, o) }));
  if (!v.isler || !v.faturalar) return <Yetkisiz />;
  return <FaturaListesi isler={v.isler} faturalar={v.faturalar} />;
}
