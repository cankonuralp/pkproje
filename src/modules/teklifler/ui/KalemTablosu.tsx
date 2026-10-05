"use client";
/* TEKLİF KALEMLERİ TABLOSU (maket teklifler.html teklifCiz KS): tür (branş · periyot) × adet × birim fiyat × tutar; kabul edilmişte "Raporlanan"
   (raporlanan / adet rozeti). Sütun tanımları (hücre işlevleri) istemcide durur: sunucu sayfası yalnız veri geçirir (işlev istemci bileşenine
   geçirilemez — 324 incelemesi). */
import { KartEtiket, Kirp, Liste, type Sutun } from "../../../components/liste/Liste";
import { AltSatir, Rozet } from "../../../components/sayfa/Sayfa";
import { para } from "../sema";
import type { TeklifKalemi } from "../server/teklifler";

export function KalemTablosu({ kalemler, kabul }: { kalemler: TeklifKalemi[]; kabul: boolean }) {
  const sutunlar: Sutun<TeklifKalemi>[] = [
    { k: "tur", genislik: kabul ? "34%" : "40%", baslik: "Ekipman türü", kart: "ust", sira: 1, hucre: (k) => (
      <><Kirp>{k.turAd}</Kirp>{k.brans && <AltSatir>{k.brans === "m" ? "Mekanik" : "Elektrik"}{k.periyot ? ` · periyot ${k.periyot} ay` : ""}</AltSatir>}</>
    ) },
    { k: "adet", genislik: "14%", baslik: "Adet", kart: "govde", sira: 2, hucre: (k) => <><KartEtiket>Adet</KartEtiket>{k.adet}</> },
    { k: "fiyat", genislik: "20%", baslik: "Birim fiyat", kart: "govde", sira: 3, hucre: (k) => <><KartEtiket>Birim fiyat</KartEtiket>{para(k.fiyat)}</> },
    { k: "tutar", genislik: "20%", baslik: "Tutar", kart: "govde", sira: 4, hucre: (k) => <><KartEtiket>Tutar</KartEtiket>{para(k.adet * k.fiyat)}</> },
    ...(kabul ? [{ k: "rapor", genislik: "12%", baslik: "Raporlanan", kart: "rozet" as const, sira: 1, hucre: (k: TeklifKalemi) => {
      const n = k.raporlanan ?? 0;
      return <Rozet tur={n >= k.adet ? "tamam" : n ? "kabul" : "notr"}>{`${n} / ${k.adet}`}</Rozet>;
    } }] : []),
  ];
  return <Liste baslik="Teklif kalemleri" sutunlar={sutunlar} kayitlar={kalemler} anahtar={(k) => k.turId} />;
}
