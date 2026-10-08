/* RAPOR ÖN İZLEME (maket rapor.html "Ön izle", reisim 2026-09-28: "en sağ üstte ön izleme tuşu olmalı PDF çıktısını ön izleyebilmeliyim"):
   raporun belgesi — kesin PDF'le aynı çiziciden (src/belge). Görme yetkisi sunucuda (raporBelgesiVerisi: Raporlar düzeyi); göremeyene "bulunamadı".
   İmzasızdır; muayene uzmanının son imzasıyla geçerli olur. Tamamlanan raporda "PDF indir" yerine imzalı PDF (315–317 incelemesi); saklama
   süresi dolup silindiyse PDF yok (387). */
import "../../../../../belge/belge.css";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { raporBelgesi } from "../../../../../belge/belge";
import { Yetkisiz } from "../../../../../components/hata/Hata";
import { Kirinti, NesneBasi } from "../../../../../components/sayfa/Sayfa";
import { DosyaAcTusu } from "../../../../../components/gizli-resim/GizliResim";
import { Ikon } from "../../../../../components/ikon/Ikon";
import { TusBaglanti, tusSinifi } from "../../../../../components/tus/Tus";
import { modulBul } from "../../../../../modules/moduller";
import { raporBelgesiVerisi } from "../../../../../modules/raporlar/server/raporlar";
import { depo } from "../../../../../server/dosya/depo";
import { modulOturumu, oturumIslemi } from "../../../../../server/kimlik/istek";

const MODUL = modulBul("raporlar")!;
export const metadata: Metadata = { title: "Ön izleme" };

export default async function Sayfa({ params }: { params: Promise<{ id: string }> }) {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  const { id } = await params;
  const v = await oturumIslemi(o, (db) => raporBelgesiVerisi(db, depo(), o, id));
  if (!v) notFound();
  return (
    <>
      <Kirinti ogeler={[["Planlar", "/planlar"], [v.plan.no, `/planlar/${v.plan.id}`], [v.no, `/raporlar/${v.id}`], ["Ön izleme"]]} />
      <NesneBasi baslik={`${v.no} · ön izleme`} altIkon="file-text"
        alt={v.imzaliSilindi ? "Saklama süresi dolduğu için imzalı PDF silindi." : "Kesin PDF bu belgeyle aynı çiziciden üretilir."}
        tuslar={<>
          <TusBaglanti ikon="arrow-left" href={`/raporlar/${v.id}`}>Rapora dön</TusBaglanti>
          {/* PDF indir (reisim 2026-09-28: "ön izle halinde PDF halini indirebilmeliyim"): imzasız, kesin PDF motoruyla; düz bağlantı (indirme) */}
          {v.imzaliDosya
            ? <DosyaAcTusu dosyaId={v.imzaliDosya} ikon="file-check">İmzalı PDF</DosyaAcTusu>
            : v.imzaliSilindi ? null
            : <a className={tusSinifi("birincil")} href={`/raporlar/${v.id}/pdf`} download><Ikon ad="download" kucuk />PDF indir</a>}
        </>} />
      <div className="rb-onizleme" tabIndex={0} role="region" aria-label="Rapor belgesi önizlemesi">{raporBelgesi(v.belge)}</div>
    </>
  );
}
