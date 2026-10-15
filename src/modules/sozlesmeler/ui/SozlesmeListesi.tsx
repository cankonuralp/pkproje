"use client";
/* SÖZLEŞMELER LİSTESİ (maket sozlesmeler.html #/): süzgeç (durum çipleri aynı grupta, müşteri ve denetçi seçicisi), en yeni üstte, tablo ↔ kart.
   "Yeni sözleşme" ve "Sözleşme şablonu" yalnız "değiştirir" düzeyine. Hizmet sözleşmesinin bitişi için uyarı yok (reisim 2026-09-26).
   570 (09-B3): süzgeç ve sayfa SUNUCUDA (server/sozlesmeler.ts sozlesmeSayfasi; tanım ../liste.ts — ekranla aynı); ekrana yalnız sayfa. */
import Link from "next/link";
import { useState } from "react";
import { KartEtiket, Kirp, type Sutun } from "../../../components/liste/Liste";
import { Sayac, SuzgecliListe } from "../../../components/liste/SuzgecliListe";
import { useSunucuSuzgec } from "../../../components/liste/SunucuSuzgec";
import type { Secenek, SunucuListe } from "../../../components/liste/suzgec";
import { AltSatir, SayfaBasi, SeritKap } from "../../../components/sayfa/Sayfa";
import { Serit } from "../../../components/serit/Serit";
import { Tus, TusBaglanti } from "../../../components/tus/Tus";
import type { SablonSatiri, SozlesmeSatiri } from "../server/sozlesmeler";
import { DurumRozeti, tarihYaz } from "./ortak";
import { SablonPenceresi } from "./Pencereler";
import { sozlesmeTanim } from "../liste";
import { sozlesmeSayfasiEylemi } from "./eylemler";
import stil from "./sozlesmeler.module.css";

const tanim = (sec: Record<string, Secenek[]>) => sozlesmeTanim(sec);

/** 449: isgEksik — yan menüdeki kırmızı sayının planları (açık planda İSG-KATİP ID'si eksik ya da bitmiş) */
export function SozlesmeListesi({ ilk, yaz, sablonlar, isgEksik = [] }:
  { ilk: SunucuListe<SozlesmeSatiri>; yaz: boolean; sablonlar: SablonSatiri[]; isgEksik?: { id: string; no: string; baslangic: string; firmaAdi: string; eksik: number }[] }) {
  const s = useSunucuSuzgec(tanim, ilk, sozlesmeSayfasiEylemi);
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
      {isgEksik.length > 0 && <SeritKap><Serit tur="hata" ikon="triangle-alert">
        <span>Açık planda İSG-KATİP SÖZLEŞME ID&apos;si eksik ya da bitmiş (yan menüdeki kırmızı sayı):{" "}
          {isgEksik.map((p, i) => <span key={p.id}>{i > 0 && ", "}<Link href={`/planlar/${p.id}`}>{p.no}</Link> · {p.firmaAdi} · {tarihYaz(p.baslangic)}{p.eksik > 1 ? ` (${p.eksik} kişi)` : ""}</span>)}.
          {" "}Planın ekibine ID&apos;yi yazın ya da tesisin iş sözleşmesine ekleyin.</span>
      </Serit></SeritKap>}
      <SuzgecliListe s={s} on="s" baslik="İş sözleşmeleri" sutunlar={sutunlar} anahtar={(x) => x.id} href={(x) => `/sozlesmeler/${x.id}`}
        bosVeri={{ ikon: "file-signature", baslik: "İş sözleşmesi yok", metin: "“Yeni sözleşme” ile müşteri ve tesisler seçilerek hazırlanır." }} />
      {sablon && <SablonPenceresi kapat={() => setSablon(false)} sablonlar={sablonlar} />}
    </>
  );
}
