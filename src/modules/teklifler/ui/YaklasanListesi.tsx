"use client";
/* YAKLAŞAN MUAYENELER LİSTESİ (2026-11-09; reisim: "senesi yaklaşan aranması gereken müşteriler için … orada sadece gelecek muayenesine son 2 ay kalan
   müşteriler - tesisler gözüksün"): en yakın tarih üstte; aranacak kişi ve telefonu satırda (telefonda dokununca arar), teklif durumu, "Teklif hazırla"
   (tesis ve tesisteki ekipman fiyat listesiyle dolu açılır) ya da var olan teklife bağlantı. Süzgeç ve sayfa sunucuda. */
import Link from "next/link";
import { KartEtiket, Kirp, type Sutun } from "../../../components/liste/Liste";
import { Sayac, SuzgecliListe } from "../../../components/liste/SuzgecliListe";
import { useSunucuSuzgec } from "../../../components/liste/SunucuSuzgec";
import type { SunucuListe } from "../../../components/liste/suzgec";
import { AltSatir, DegerYok, Kirinti, Rozet, SayfaBasi } from "../../../components/sayfa/Sayfa";
import { tarihNo } from "../../../components/secim/tarih";
import { TusBaglanti } from "../../../components/tus/Tus";
import { yaklasanTanim } from "../liste";
import { TEKLIF_DURUM } from "../sema";
import type { YaklasanSatiri } from "../server/yaklasan";
import { kalanYazi } from "../yaklasan";
import { yaklasanSayfasiEylemi } from "./eylemler";
import stil from "./teklifler.module.css";

const tanim = () => yaklasanTanim();

function sutunlar(yaz: boolean): Sutun<YaklasanSatiri>[] {
  return [
    { k: "tesis", genislik: "24%", baslik: "Müşteri / tesis", kart: "ust", sira: 1, hucre: (y) => <span><Kirp>{y.musteri}</Kirp><AltSatir><Kirp>{[y.tesis, y.yer].filter(Boolean).join(" · ")}</Kirp></AltSatir></span> },
    { k: "muayene", genislik: "14%", baslik: "En yakın muayene", kart: "govde", sira: 2, hucre: (y) => <><KartEtiket>En yakın muayene</KartEtiket><span><span className={stil.sayi}>{tarihNo(y.sonraki)}</span><AltSatir uyari={y.kalan < 30}>{kalanYazi(y.kalan)}</AltSatir></span></> },
    { k: "ekipman", genislik: "18%", baslik: "Ekipman", kart: "govde", sira: 3, hucre: (y) => <><KartEtiket>Ekipman</KartEtiket><span>{y.ekipman} / {y.toplam} ekipman<AltSatir><Kirp>{y.turler.join(", ")}</Kirp></AltSatir></span></> },
    { k: "iletisim", genislik: "20%", baslik: "Aranacak kişi", kart: "govde", sira: 4, hucre: (y) => <><KartEtiket>Aranacak kişi</KartEtiket>{y.ilgili || y.tel || y.eposta
      ? <span><Kirp>{y.ilgili ?? "—"}</Kirp>{y.tel && <AltSatir><a href={`tel:${y.tel.replace(/[^\d+]/g, "")}`}>{y.tel}</a></AltSatir>}{!y.tel && y.eposta && <AltSatir><a className={stil.posta2} href={`mailto:${y.eposta}`}>{y.eposta}</a></AltSatir>}</span>
      : <DegerYok>Bilgi yok</DegerYok>}</> },
    { k: "teklif", genislik: "12%", baslik: "Teklif", kart: "rozet", sira: 1, hucre: (y) => (y.teklif
      ? <span><Rozet tur={TEKLIF_DURUM[y.teklif.durum][1]}>{TEKLIF_DURUM[y.teklif.durum][0]}</Rozet><AltSatir><Link href={`/teklifler/${y.teklif.id}`}>{y.teklif.no}</Link></AltSatir></span>
      : <Rozet tur="bekliyor">Teklif yok</Rozet>) },
    { k: "eylem", genislik: "12%", baslik: "İşlem", gizliBaslik: true, siralanmaz: true, kart: "eylem", sira: 9, hucre: (y) => (yaz && y.bekliyor && y.teklif?.durum !== "taslak"
      ? <TusBaglanti ikon="plus" href={`/teklifler/yeni?tesis=${y.id}&doldur=1`}>Teklif hazırla</TusBaglanti> : null) },
  ];
}

export function YaklasanListesi({ ilk, yaz }: { ilk: SunucuListe<YaklasanSatiri>; yaz: boolean }) {
  const s = useSunucuSuzgec(tanim, ilk, yaklasanSayfasiEylemi);
  return (
    <>
      <Kirinti ogeler={[["Teklifler", "/teklifler"], ["Yaklaşan muayeneler"]]} />
      <SayfaBasi baslik="Yaklaşan muayeneler" sayac={<Sayac s={s} />} />
      <SuzgecliListe s={s} on="y" baslik="Yaklaşan muayeneler" sutunlar={sutunlar(yaz)} anahtar={(y) => y.id}
        bosVeri={{ ikon: "calendar-check", baslik: "Muayenesi 2 ay içinde gelen tesis yok" }} />
    </>
  );
}
