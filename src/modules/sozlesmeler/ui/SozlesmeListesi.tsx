"use client";
/* SÖZLEŞMELER LİSTESİ (maket sozlesmeler.html #/): süzgeç (durum çipleri aynı grupta, müşteri ve denetçi seçicisi), en yeni üstte, tablo ↔ kart.
   "Yeni sözleşme" ve "Sözleşme şablonu" yalnız "değiştirir" düzeyine. Hizmet sözleşmesinin bitişi için uyarı yok (reisim 2026-09-26). */
import Link from "next/link";
import { useState } from "react";
import { KartEtiket, Kirp, type Sutun } from "../../../components/liste/Liste";
import { Sayac, SuzgecliListe, useSuzgec } from "../../../components/liste/SuzgecliListe";
import type { SuzgecTanimi } from "../../../components/liste/suzgec";
import { AltSatir, SayfaBasi } from "../../../components/sayfa/Sayfa";
import { Tus, TusBaglanti } from "../../../components/tus/Tus";
import type { SablonSatiri, SozlesmeSatiri } from "../server/sozlesmeler";
import { DurumRozeti, tarihYaz } from "./ortak";
import { SablonPenceresi } from "./Pencereler";
import stil from "./sozlesmeler.module.css";

function tanim(l: readonly SozlesmeSatiri[]): SuzgecTanimi<SozlesmeSatiri> {
  const tekil = (x: string[]) => [...new Set(x)].sort((a, b) => a.localeCompare(b, "tr"));
  return {
    ad: "Sözleşmelerde ara", ipucu: "No, müşteri, tesis", birim: "sözleşme", imkansiz: "Bir sözleşme aynı anda iki durumda olamaz",
    metin: (x) => `${x.no} ${x.musteri} ${x.tesisler.join(" ")} ${x.teklif?.no ?? ""}`,
    cipler: [
      { k: "imza", ad: "İmza bekliyor", grup: "durum", test: (x) => x.durum === "imza" },
      { k: "yururlukte", ad: "Yürürlükte", grup: "durum", test: (x) => x.durum === "yururlukte" },
      { k: "suresi", ad: "Süresi doldu", grup: "durum", test: (x) => x.durum === "suresi" },
      { k: "isgyok", ad: "İSG-KATİP ID yok", test: (x) => x.isgSayisi === 0 },
    ],
    seciciler: [
      { k: "musteri", ad: "Müşteri", secenek: () => [["tumu", "Tümü"], ...tekil(l.map((x) => x.musteri)).map((m) => [m, m] as const)], gecer: (x, s) => s === "tumu" || x.musteri === s },
      { k: "kisi", ad: "Denetçi", secenek: () => [["tumu", "Tümü"], ...tekil(l.flatMap((x) => x.isgKisileri)).map((k) => [k, k] as const)], gecer: (x, s) => s === "tumu" || x.isgKisileri.includes(s) },
    ],
  };
}

export function SozlesmeListesi({ sozlesmeler, yaz, sablonlar }: { sozlesmeler: SozlesmeSatiri[]; yaz: boolean; sablonlar: SablonSatiri[] }) {
  const s = useSuzgec(tanim(sozlesmeler), sozlesmeler);
  const [sablon, setSablon] = useState(false);
  const sutunlar: Sutun<SozlesmeSatiri>[] = [
    { k: "no", genislik: "16%", baslik: "Sözleşme no", kart: "ust", sira: 1, hucre: (x) => <Link className={stil.no} href={`/sozlesmeler/${x.id}`}>{x.no}</Link> },
    { k: "musteri", genislik: "30%", baslik: "Müşteri / tesis", kart: "govde", sira: 2, hucre: (x) => <span><Kirp>{x.musteri}</Kirp><AltSatir><Kirp>{x.tesisler.join(", ")}</Kirp></AltSatir></span> },
    { k: "sure", genislik: "22%", baslik: "Süre", kart: "govde", sira: 3, hucre: (x) => <><KartEtiket>Süre</KartEtiket><span><span className={stil.tarih}>{tarihYaz(x.baslangic)} – {tarihYaz(x.bitis)}</span>
      {x.durum === "yururlukte" && <AltSatir>{x.kalan} gün kaldı{x.yenileme === "otomatik" ? " · kendiliğinden yenilenir" : ""}</AltSatir>}</span></> },
    { k: "isg", genislik: "16%", baslik: "İSG-KATİP", kart: "govde", sira: 4, hucre: (x) => <><KartEtiket>İSG-KATİP</KartEtiket><span>{x.isgSayisi} ID</span></> },
    { k: "durum", genislik: "16%", baslik: "Durum", kart: "rozet", sira: 1, hucre: (x) => <DurumRozeti d={x.durum} /> },
  ];
  return (
    <>
      <SayfaBasi baslik="Sözleşmeler" sayac={<Sayac s={s} />} tuslar={yaz && <>
        <Tus tur="ikincil" ikon="file-text" onClick={() => setSablon(true)}>Sözleşme şablonu</Tus>
        <TusBaglanti tur="birincil" ikon="plus" href="/sozlesmeler/yeni">Yeni sözleşme</TusBaglanti>
      </>} />
      <SuzgecliListe s={s} on="s" baslik="İş sözleşmeleri" sutunlar={sutunlar} anahtar={(x) => x.id} href={(x) => `/sozlesmeler/${x.id}`}
        bosVeri={{ ikon: "file-signature", baslik: "İş sözleşmesi yok", metin: "“Yeni sözleşme” ile müşteri ve tesisler seçilerek hazırlanır." }} />
      {sablon && <SablonPenceresi kapat={() => setSablon(false)} sablonlar={sablonlar} />}
    </>
  );
}
