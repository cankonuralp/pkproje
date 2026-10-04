"use client";
/* Tesisin ekipmanı tür başına (maket plan-ac.html KSUTUN, L6: hepsi plana girer): tür · ekipte yetkili · kontrolü geliyor · ekipman. Plan aç özeti ve
   plan sayfası aynı tabloyu kullanır (tek üretici: Liste). */
import { KartEtiket, Kirp, Liste, type Sutun } from "../../../components/liste/Liste";
import { AltSatir, DegerYok } from "../../../components/sayfa/Sayfa";
import { bransAd } from "../../personel/sema";
import { turYetkili, type Aday, type KapsamSatiri } from "../sema";
import stil from "./planlar.module.css";

export function KapsamTablosu({ kapsam, ekip }: { kapsam: KapsamSatiri[]; ekip: Pick<Aday, "ad" | "meslek">[] }) {
  const sutunlar: Sutun<KapsamSatiri>[] = [
    { k: "tur", genislik: "34%", baslik: "Tür", kart: "ust", sira: 1, hucre: (x) => <><Kirp>{x.tur.ad}</Kirp><AltSatir>{bransAd(x.tur.brans)}</AltSatir></> },
    { k: "yetkili", genislik: "36%", baslik: "Ekipte yetkili", kart: "govde", sira: 4, hucre: (x) => {
      const l = ekip.filter((a) => turYetkili(a, x.tur));
      return <><KartEtiket>Ekipte yetkili</KartEtiket>{!ekip.length ? <DegerYok>Denetçi seçilmedi</DegerYok> : l.length ? <Kirp>{l.map((a) => a.ad).join(", ")}</Kirp>
        : <span className={stil.uyari}>Yok</span>}</>;
    } },
    { k: "geldi", genislik: "16%", baslik: "Kontrolü geliyor", kart: "govde", sira: 3, hucre: (x) => <><KartEtiket>Kontrolü geliyor</KartEtiket>{x.geliyor ? <b className={stil.sayi}>{x.geliyor}</b> : <DegerYok />}</> },
    { k: "ekipman", genislik: "14%", baslik: "Ekipman", kart: "rozet", sira: 1, hucre: (x) => <b className={stil.sayi}>{x.ekipman}</b> },
  ];
  return <Liste baslik="Tesisteki ekipman tür başına" sutunlar={sutunlar} kayitlar={kapsam} anahtar={(x) => x.tur.id} />;
}
