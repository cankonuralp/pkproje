"use client";
/* Müşteri sayfasındaki tesis tablosu (maket TESIS_SUTUN). Sütun tanımı hücre işlevleri taşır → istemci bileşeninde (sunucu sayfası işlev
   geçiremez). */
import Link from "next/link";
import { Ikon } from "../../../components/ikon/Ikon";
import { KartEtiket, Kirp, Liste, type Sutun } from "../../../components/liste/Liste";
import { AltSatir, DegerYok, Kod } from "../../../components/sayfa/Sayfa";
import { eksikTesis } from "../sema";
import type { TesisSatiri } from "../server/musteriler";
import { PasifRozeti, yerYaz } from "./ortak";
import stil from "./musteriler.module.css";

const SUTUNLAR: Sutun<TesisSatiri>[] = [
  { k: "tesis", genislik: "26%", baslik: "Tesis", kart: "ust", sira: 1, hucre: (t) => <Link className={stil.ad} href={`/musteriler/tesis/${t.id}`}>{t.ad}</Link> },
  { k: "adres", genislik: "36%", baslik: "Adres", kart: "govde", sira: 2, hucre: (t) => t.adres
    ? <span className={stil.hucreSatir}><Ikon ad="map-pin" kucuk /><span><Kirp baslik={t.adres}>{t.adres}</Kirp><AltSatir>{yerYaz(t) || "—"}</AltSatir></span></span>
    : <><KartEtiket>Adres</KartEtiket><AltSatir uyari>Adres eksik</AltSatir></> },
  { k: "sgk", genislik: "26%", baslik: "SGK DETSİS NO", kart: "govde", sira: 3, hucre: (t) => <><KartEtiket>SGK DETSİS NO</KartEtiket>{t.sgk ? <span className={stil.kodUzun}><Kod>{t.sgk}</Kod></span> : <AltSatir uyari>Eksik</AltSatir>}</> },
  { k: "durum", genislik: "12%", baslik: "Durum", kart: "rozet", sira: 1, hucre: (t) => t.pasif ? <PasifRozeti /> : eksikTesis(t).length ? <AltSatir uyari>Bilgi eksik</AltSatir> : <DegerYok /> },
];

export function TesisTablosu({ tesisler }: { tesisler: TesisSatiri[] }) {
  return <Liste baslik="Tesisler" sutunlar={SUTUNLAR} kayitlar={tesisler} anahtar={(t) => t.id} href={(t) => `/musteriler/tesis/${t.id}`} />;
}
