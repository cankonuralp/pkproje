/* RAPORUN ZAMAN ÇİZELGESİ (2026-11-12; maket yerel/maket/turkak-modeli.html 4. bölüm — pkproje.md §11 T7): raporu gören herkes açar (denetçi kendi
   raporunu, branş yöneticisi branşını …); görme yetkisi sunucuda (raporZamanCizelgesi), göremeyene "bulunamadı". */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Yetkisiz } from "../../../../../components/hata/Hata";
import { Kirinti, NesneBasi } from "../../../../../components/sayfa/Sayfa";
import { TusBaglanti } from "../../../../../components/tus/Tus";
import { modulBul } from "../../../../../modules/moduller";
import { raporZamanCizelgesi } from "../../../../../modules/raporlar/server/raporlar";
import { ZamanCizelgesi } from "../../../../../modules/raporlar/ui/ZamanCizelgesi";
import { modulOturumu, oturumIslemi } from "../../../../../server/kimlik/istek";

const MODUL = modulBul("raporlar")!;
export const metadata: Metadata = { title: "Zaman çizelgesi" };

export default async function Sayfa({ params }: { params: Promise<{ id: string }> }) {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  const { id } = await params;
  const v = await oturumIslemi(o, (db) => raporZamanCizelgesi(db, o, id));
  if (!v) notFound();
  return (
    <>
      <Kirinti ogeler={[["Planlar", "/planlar"], [v.plan.no, `/planlar/${v.plan.id}`], [v.no, `/raporlar/${v.id}`], ["Zaman çizelgesi"]]} />
      <NesneBasi baslik={`${v.no} · zaman çizelgesi`} altIkon="history" alt={`${v.ekipmanKod} · ${v.turAd} · ${v.yazan}`}
        tuslar={<TusBaglanti ikon="arrow-left" href={`/raporlar/${v.id}`}>Rapora dön</TusBaglanti>} />
      <ZamanCizelgesi no={v.no} satirlar={v.satirlar} />
    </>
  );
}
