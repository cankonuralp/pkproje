"use client";
/* Tür sayfasındaki rapor formatı sürümleri tablosu (maket pdfSutun). Sütun tanımı hücre işlevleri taşır → istemci bileşeninde (sunucu sayfası
   işlev geçiremez). En yeni sürüm kullanımda; her sürümün PDF'i açılır; kaldırma yalnız "değiştirir" düzeyine çizilir (karar sunucuda). */
import { DosyaAcTusu } from "../../../components/gizli-resim/GizliResim";
import { KartEtiket, Kirp, Liste, type Sutun } from "../../../components/liste/Liste";
import { AltSatir, Rozet } from "../../../components/sayfa/Sayfa";
import type { FormatSurumu } from "../server/turler";
import { FormatKaldirTusu } from "./KartTuslari";
import { tarihYaz } from "./ortak";
import stil from "./turler.module.css";

export function FormatTablosu({ formatlar, kaldirabilir }: { formatlar: FormatSurumu[]; kaldirabilir: boolean }) {
  const p = formatlar[0];
  const sutunlar: Sutun<FormatSurumu>[] = [
    { k: "surum", genislik: "34%", baslik: "Sürüm", kart: "ust", sira: 1, hucre: (x) => <><b>Sürüm {x.sira}</b><AltSatir><Kirp>{x.dosyaAd}</Kirp></AltSatir></> },
    { k: "tarih", genislik: "26%", baslik: "Yüklendi", kart: "govde", sira: 2, hucre: (x) => <><KartEtiket>Yüklendi</KartEtiket>{tarihYaz(x.olustu)}{x.notu && <AltSatir>{x.notu}</AltSatir>}</> },
    { k: "durum", genislik: "14%", baslik: "Durum", kart: "rozet", sira: 1, hucre: (x) => x === p ? <Rozet tur="tamam">Kullanımda</Rozet> : <Rozet tur="notr">Önceki</Rozet> },
    { k: "eylem", genislik: "26%", baslik: "İşlem", gizliBaslik: true, kart: "eylem", sira: 9, hucre: (x) => (
      <span className={stil.tuslar}>
        <DosyaAcTusu dosyaId={x.dosyaId}>PDF&apos;i aç</DosyaAcTusu>
        {kaldirabilir && <FormatKaldirTusu id={x.id} surum={x.surum} sira={x.sira} />}
      </span>
    ) },
  ];
  return <Liste baslik="Rapor formatı sürümleri" sutunlar={sutunlar} kayitlar={formatlar} anahtar={(x) => x.id} />;
}
