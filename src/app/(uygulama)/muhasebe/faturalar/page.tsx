/* MUHASEBE › FATURALAR (maket muhasebe.html #/faturalar; 327): fatura no (tarih), müşteri / iş, vade (kalan gün ya da geçen), tutar (KDV dahil),
   kalan, durum. Görmeyen: yetkisiz ekranı. */
import type { Metadata } from "next";
import { Yetkisiz } from "../../../../components/hata/Hata";
import { modulBul } from "../../../../modules/moduller";
import { bordroGonderebilir } from "../../../../modules/muhasebe/server/bordro-gonder";
import { faturaSayfasi } from "../../../../modules/muhasebe/server/muhasebe";
import { FATURA_DURUM } from "../../../../modules/muhasebe/sema";
import { FaturaListesi } from "../../../../modules/muhasebe/ui/Listeler";
import { modulOturumu, oturumIslemi } from "../../../../server/kimlik/istek";

const MODUL = modulBul("muhasebe")!;
export const metadata: Metadata = { title: "Faturalar" };

export default async function Sayfa({ searchParams }: { searchParams: Promise<{ durum?: string | string[] }> }) {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  const { durum: d } = await searchParams;
  const durum = typeof d === "string" && Object.hasOwn(FATURA_DURUM, d) ? d : undefined;
  /* 566: liste SUNUCUDA sayfalı — ilk sayfa adresteki çiple (?durum=gecikti) burada, sonrakiler eylemle */
  const v = await oturumIslemi(o, (db) => faturaSayfasi(db, o, durum ? { secili: [durum] } : {}));
  if (!v) return <Yetkisiz />;
  /* adres süzgeci değişince (şeritteki "Faturalar" → ?durum=gecikti) liste yeniden kurulur — başlangıç durumu yalnız ilk çizimde okunur (329–332 incelemesi) */
  return <FaturaListesi key={durum ?? ""} ilk={v.liste} uyari={v.uyari} durum={durum} bordro={bordroGonderebilir(o)} />;
}
