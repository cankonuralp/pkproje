"use client";
/* SÖZLEŞMELER (322; maket musteri.html #/sozlesme — sozCiz; karar 134 "müşteri panelinde görünür, panelden imza atılmaz"): görebildiği iş
   sözleşmeleri — numara (sözleşme sayfasını açar), kapsamdaki tesisler (yalnız görebildikleri), dönem, durum. Salt görüntü. Görme sunucuda
   (müşteri rolü — sözleşmenin yalnız numara / dönem / imza tarihi / imzalı PDF sütunları, 0034). 481 (site taraması, kalıp 14–15): süzgeç —
   arama · durum çipleri; boşken de görünür. */
import Link from "next/link";
import { KartEtiket, Kirp, type Sutun } from "../../../components/liste/Liste";
import { SuzgecliListe, useSuzgec } from "../../../components/liste/SuzgecliListe";
import type { SuzgecTanimi } from "../../../components/liste/suzgec";
import { Rozet, SayfaBasi } from "../../../components/sayfa/Sayfa";
import { tarihNo } from "../../../components/secim/tarih";
import type { PanelSozlesmeleri, PanelSozlesmesi } from "../server/panel";
import { PanelSekmeleri, SOZ_DURUM } from "./ortak";
import stil from "./panel.module.css";

const SUTUNLAR: Sutun<PanelSozlesmesi>[] = [
  { k: "no", genislik: "22%", baslik: "Sözleşme", kart: "ust", sira: 1, hucre: (x) => <Link className={stil.no} href={`/portal/s/${x.id}`}>{x.no}</Link> },
  { k: "tesis", genislik: "36%", baslik: "Tesisler", kart: "govde", sira: 2, hucre: (x) => <><KartEtiket>Tesisler</KartEtiket><Kirp>{x.tesisAdlari.join(", ")}</Kirp></> },
  { k: "donem", genislik: "26%", baslik: "Dönem", kart: "govde", sira: 3, hucre: (x) => (
    <><KartEtiket>Dönem</KartEtiket><span className={stil.sayi}>{tarihNo(x.baslangic)} – {tarihNo(x.bitis)}</span></>
  ) },
  { k: "durum", genislik: "16%", baslik: "Durum", kart: "rozet", sira: 1, hucre: (x) => <Rozet tur={SOZ_DURUM[x.durum][1]}>{SOZ_DURUM[x.durum][0]}</Rozet> },
];

function tanim(l: readonly PanelSozlesmesi[]): SuzgecTanimi<PanelSozlesmesi> {
  const durumlar = [...new Set(l.map((x) => x.durum))];
  return {
    ad: "Sözleşmelerde ara", ipucu: "Sözleşme no, tesis", birim: "sözleşme", sayfa: 20, imkansiz: "Bir sözleşme aynı anda iki durumda olamaz",
    metin: (x) => `${x.no} ${x.tesisAdlari.join(" ")}`,
    cipler: durumlar.map((d) => ({ k: d, ad: SOZ_DURUM[d][0], grup: "durum", test: (x: PanelSozlesmesi) => x.durum === d })),
    seciciler: [],
  };
}

export function PanelSozlesmeListesi({ v }: { v: PanelSozlesmeleri }) {
  const s = useSuzgec(tanim(v.sozlesmeler), v.sozlesmeler);
  return (
    <>
      <SayfaBasi baslik="Sözleşmeler" sayac={<span className={stil.sayac} role="status"><b>{v.sozlesmeler.length}</b> sözleşme</span>} />
      <p className={stil.alt}>{v.musteri?.unvan ?? "—"}</p>
      <PanelSekmeleri acikUygunsuz={v.acikUygunsuz} secili="/portal/sozlesme" />
      <SuzgecliListe s={s} on="psz" baslik="Sözleşmeler" sutunlar={SUTUNLAR} anahtar={(x) => x.id} href={(x) => `/portal/s/${x.id}`}
        bosVeri={{ ikon: "scroll-text", baslik: "Sözleşme yok", metin: "Size açılmış bir sözleşme yok." }} />
    </>
  );
}
