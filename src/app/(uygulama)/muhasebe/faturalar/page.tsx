/* MUHASEBE › FATURALAR (maket muhasebe.html #/faturalar; 327): fatura no (tarih), müşteri / iş, vade (kalan gün ya da geçen), tutar (KDV dahil),
   kalan, durum. Görmeyen: yetkisiz ekranı. */
import type { Metadata } from "next";
import { Yetkisiz } from "../../../../components/hata/Hata";
import { modulBul } from "../../../../modules/moduller";
import { bordroGonderebilir } from "../../../../modules/muhasebe/server/bordro-gonder";
import { faturaListesi, isListesi } from "../../../../modules/muhasebe/server/muhasebe";
import { FaturaListesi } from "../../../../modules/muhasebe/ui/Listeler";
import { modulOturumu, oturumIslemi } from "../../../../server/kimlik/istek";

const MODUL = modulBul("muhasebe")!;
export const metadata: Metadata = { title: "Faturalar" };

export default async function Sayfa({ searchParams }: { searchParams: Promise<{ durum?: string | string[] }> }) {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  const v = await oturumIslemi(o, async (db) => ({ isler: await isListesi(db, o), faturalar: await faturaListesi(db, o) }));
  if (!v.isler || !v.faturalar) return <Yetkisiz />;
  const { durum } = await searchParams;
  /* adres süzgeci değişince (şeritteki "Faturalar" → ?durum=gecikti) liste yeniden kurulur — useSuzgec başlangıcı yalnız ilk çizimde okunur (329–332 incelemesi) */
  return <FaturaListesi key={typeof durum === "string" ? durum : ""} isler={v.isler} faturalar={v.faturalar} durum={typeof durum === "string" ? durum : undefined} bordro={bordroGonderebilir(o)} />;
}
