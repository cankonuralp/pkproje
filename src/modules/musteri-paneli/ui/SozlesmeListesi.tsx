"use client";
/* SÖZLEŞMELER (322; maket musteri.html #/sozlesme — sozCiz; karar 134 "müşteri panelinde görünür, panelden imza atılmaz"): görebildiği iş
   sözleşmeleri — numara (sözleşme sayfasını açar), kapsamdaki tesisler (yalnız görebildikleri), dönem, durum. Salt görüntü. Görme sunucuda
   (müşteri rolü — sözleşmenin yalnız numara / dönem / imza tarihi / imzalı PDF sütunları, 0034). */
import Link from "next/link";
import { KartEtiket, Kirp, Liste, type Sutun } from "../../../components/liste/Liste";
import { Rozet, SayfaBasi } from "../../../components/sayfa/Sayfa";
import { BosDurum } from "../../../components/bos/BosDurum";
import { tarihNo } from "../../../components/secim/tarih";
import type { PanelSozlesmeleri, PanelSozlesmesi } from "../server/panel";
import { PanelSekmeleri, SOZ_DURUM } from "./ortak";
import stil from "./panel.module.css";

const SUTUNLAR: Sutun<PanelSozlesmesi>[] = [
  { k: "no", genislik: "22%", baslik: "Sözleşme", kart: "ust", sira: 1, hucre: (x) => <Link className={stil.kod} href={`/portal/s/${x.id}`}>{x.no}</Link> },
  { k: "tesis", genislik: "36%", baslik: "Tesisler", kart: "govde", sira: 2, hucre: (x) => <><KartEtiket>Tesisler</KartEtiket><Kirp>{x.tesisAdlari.join(", ")}</Kirp></> },
  { k: "donem", genislik: "26%", baslik: "Dönem", kart: "govde", sira: 3, hucre: (x) => (
    <><KartEtiket>Dönem</KartEtiket><span className={stil.sayi}>{tarihNo(x.baslangic)} – {tarihNo(x.bitis)}</span></>
  ) },
  { k: "durum", genislik: "16%", baslik: "Durum", kart: "rozet", sira: 1, hucre: (x) => <Rozet tur={SOZ_DURUM[x.durum][1]}>{SOZ_DURUM[x.durum][0]}</Rozet> },
];

export function PanelSozlesmeListesi({ v }: { v: PanelSozlesmeleri }) {
  return (
    <>
      <SayfaBasi baslik="Sözleşmeler" sayac={<span className={stil.sayi} role="status"><b>{v.sozlesmeler.length}</b> sözleşme</span>} />
      <p className={stil.alt}>{v.musteri?.unvan ?? "—"}</p>
      <PanelSekmeleri acikUygunsuz={v.acikUygunsuz} secili="/portal/sozlesme" />
      {v.sozlesmeler.length
        ? <Liste baslik="Sözleşmeler" sutunlar={SUTUNLAR} kayitlar={v.sozlesmeler} anahtar={(x) => x.id} href={(x) => `/portal/s/${x.id}`} />
        : <BosDurum ikon="scroll-text" baslik="Sözleşme yok" metin="Size açılmış bir sözleşme yok." />}
    </>
  );
}
