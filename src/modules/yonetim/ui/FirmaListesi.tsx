"use client";
/* YÖNETİM › FİRMALAR listesi (348; maket yonetim.html listeCiz): sayaç "N firma · M etkin", "Firma aç", yalnız probata ekibine açık şeridi;
   tablo ↔ kart (firma + adres · durum · kısa kod · depo · açılış · kullanıcı). */
import Link from "next/link";
import { Ikon } from "../../../components/ikon/Ikon";
import { KartEtiket, Kirp, type Sutun } from "../../../components/liste/Liste";
import { Sayac, SuzgecliListe, useSuzgec } from "../../../components/liste/SuzgecliListe";
import type { SuzgecTanimi } from "../../../components/liste/suzgec";
import { AltSatir, Kod, SayfaBasi, SeritKap } from "../../../components/sayfa/Sayfa";
import { Serit } from "../../../components/serit/Serit";
import { TusBaglanti } from "../../../components/tus/Tus";
import type { FirmaSatiri } from "../server/yonetim";
import { DEPO_AD, DurumRozeti, firmaAdresi, tarihYaz, type DepoTuru } from "./ortak";
import stil from "./yonetim.module.css";

const tanim: SuzgecTanimi<FirmaSatiri> = {
  ad: "Firmalarda ara", ipucu: "Ünvan, adres, kısa kod", birim: "firma", imkansiz: "",
  metin: (f) => `${f.ad} ${f.kisaAd} ${f.kod} ${f.yonetici?.eposta ?? ""}`,
  cipler: [],
  seciciler: [
    { k: "durum", ad: "Durum", secenek: () => [["tumu", "Tümü"], ["etkin", "Etkin"], ["dondu", "Dondurulmuş"]], gecer: (f, v) => v === "tumu" || f.durum === v },
  ],
};

export function FirmaListesi({ kayitlar, anaAlan, depo }: { kayitlar: FirmaSatiri[]; anaAlan: string; depo: DepoTuru }) {
  const s = useSuzgec(tanim, kayitlar);
  const etkin = kayitlar.filter((f) => f.durum === "etkin").length;
  const sutunlar: Sutun<FirmaSatiri>[] = [
    { k: "firma", genislik: "34%", baslik: "Firma", kart: "ust", sira: 1, hucre: (f) => (
      <span className={stil.hucreSatir}><Ikon ad="building-2" kucuk /><span className={stil.adres}>
        <Link className={stil.ad} href={`/yonetim/f/${f.id}`}>{f.ad}</Link><AltSatir><Kirp>{firmaAdresi(f.kisaAd, anaAlan)}</Kirp></AltSatir>
      </span></span>
    ) },
    { k: "durum", genislik: "14%", baslik: "Durum", kart: "rozet", sira: 1, hucre: (f) => <DurumRozeti durum={f.durum} /> },
    { k: "kod", genislik: "10%", baslik: "Kısa kod", kart: "govde", sira: 3, hucre: (f) => <><KartEtiket>Kısa kod</KartEtiket><Kod>{f.kod}</Kod></> },
    { k: "depo", genislik: "18%", baslik: "Depo", kart: "govde", sira: 4, hucre: () => <><KartEtiket>Depo</KartEtiket><Kirp>{DEPO_AD[depo]}</Kirp></> },
    { k: "acilis", genislik: "12%", baslik: "Açılış", kart: "govde", sira: 5, hucre: (f) => <><KartEtiket>Açılış</KartEtiket>{tarihYaz(f.acilis)}</> },
    { k: "kullanici", genislik: "12%", baslik: "Kullanıcı", kart: "govde", sira: 6, hucre: (f) => <><KartEtiket>Kullanıcı</KartEtiket><span className={stil.sayi}>{f.kullanici}</span></> },
  ];
  return (
    <>
      <SayfaBasi baslik="Firmalar" sayac={<><Sayac s={s} /><span className={stil.sayacEk}> · {etkin} etkin</span></>}
        tuslar={<TusBaglanti tur="birincil" ikon="plus" href="/yonetim/yeni">Firma aç</TusBaglanti>} />
      <SeritKap><Serit tur="bilgi" ikon="shield-check">Bu sayfa yalnız probata ekibine açık; firmalar ve müşteriler görmez.</Serit></SeritKap>
      <SuzgecliListe s={s} on="y" baslik="Firmalar" sutunlar={sutunlar} anahtar={(f) => f.id} href={(f) => `/yonetim/f/${f.id}`}
        bosVeri={{ ikon: "building-2", baslik: "Firma yok", metin: "“Firma aç” ile ilk firma ve yöneticisinin hesabı açılır.", eylem: { href: "/yonetim/yeni", etiket: "Firma aç", ikon: "plus" } }} />
    </>
  );
}
