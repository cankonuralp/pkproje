"use client";
/* PERSONEL › İZİN TALEPLERİ (maket personel.html #/izinler — IZIN_SUTUN, izinCiz; 2026-09-28 reisim: izin onayı firma yöneticisinde; 330). Talepler'den
   gelen izin talepleri, bekleyen üstte; yıllık izinde kişinin kalan hakkı yanında (aşıyorsa uyarı, engel değil).
   477 (reisim 2026-10-10, Talepler–Onaylar kararları T1 · T4 "kalksın"): KARAR ONAYLAR'DA — burada liste ve geçmiş; onay bekleyen satırda "Onaylar'da
   aç". Görme sunucuda (Talepler "değiştirir" — firma yöneticisi).
   481 (site taraması, kalıp 14–15): süzgeç — arama · durum çipleri · ve/veya · Personel · İzin türü · Yıl; boşken de görünür. */
import Link from "next/link";
import { DosyaAcTusu } from "../../../components/gizli-resim/GizliResim";
import { KartEtiket, Kirp, type Sutun } from "../../../components/liste/Liste";
import { Sayac, SuzgecliListe, useSuzgec } from "../../../components/liste/SuzgecliListe";
import type { SuzgecTanimi } from "../../../components/liste/suzgec";
import { AltSatir, Rozet, SayfaBasi, SeritKap } from "../../../components/sayfa/Sayfa";
import { tarihNo } from "../../../components/secim/tarih";
import { Serit } from "../../../components/serit/Serit";
import { Ikon } from "../../../components/ikon/Ikon";
import { TusBaglanti, tusSinifi } from "../../../components/tus/Tus";
import { PersonelSekmeleri } from "../../personel/ui/ortak";
import { IZIN_DURUM, IZIN_TUR, type IzinDurumu } from "../sema";
import type { IzinSatiri } from "../server/talepler";
import stil from "./talepler.module.css";

const aralik = (x: { bas: string; bit: string }) => `${tarihNo(x.bas)}${x.bit !== x.bas ? ` – ${tarihNo(x.bit)}` : ""}`;
/* gönderim günü Türkiye takvimiyle (UTC'de gece yarısından önceki güne düşmesin — 329–332 incelemesi) */
const GUN = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" });
const gunTr = (iso: string) => GUN.format(new Date(iso));
const onayAdresi = (x: IzinSatiri) => `/onaylar/talepler?sec=izin-${x.id}`;

function tanim(l: readonly IzinSatiri[]): SuzgecTanimi<IzinSatiri> {
  const tekil = (x: [string, string][]) => [...new Map(x)].sort((a, b) => a[1].localeCompare(b[1], "tr"));
  const durum = (d: IzinDurumu, ad: string) => ({ k: d, ad, grup: "durum", test: (x: IzinSatiri) => x.durum === d });
  return {
    ad: "İzin taleplerinde ara", ipucu: "No, personel, açıklama", birim: "talep", sayfa: 20, imkansiz: "Bir talep aynı anda iki durumda olamaz",
    metin: (x) => `${x.no} ${x.personel} ${IZIN_TUR[x.tur]} ${x.aciklama ?? ""}`,
    cipler: [durum("bekliyor", "Onay bekliyor"), durum("duzeltme", "Düzeltmede"), durum("onaylandi", "Onaylandı"), durum("red", "Reddedildi")],
    seciciler: [
      { k: "kisi", ad: "Personel", secenek: () => [["tumu", "Tümü"], ...tekil(l.map((x) => [x.personelId, x.personel]))], gecer: (x, s) => s === "tumu" || x.personelId === s },
      { k: "tur", ad: "İzin türü", secenek: () => [["tumu", "Tümü"], ...Object.entries(IZIN_TUR)], gecer: (x, s) => s === "tumu" || x.tur === s },
      { k: "yil", ad: "Yıl", secenek: () => [["tumu", "Tümü"], ...[...new Set(l.map((x) => x.bas.slice(0, 4)))].sort().reverse().map((y) => [y, y] as const)],
        gecer: (x, s) => s === "tumu" || x.bas.startsWith(s) },
    ],
  };
}

export function IzinTalepleri({ l }: { l: IzinSatiri[] }) {
  const bek = l.filter((x) => x.durum === "bekliyor").length;
  const s = useSuzgec(tanim(l), l);
  const sutunlar: Sutun<IzinSatiri>[] = [
    { k: "no", genislik: "16%", baslik: "Talep no", kart: "ust", sira: 1, hucre: (x) => <><span className={stil.sayi}>{x.no}</span><AltSatir>{tarihNo(gunTr(x.gonderildi))}</AltSatir></> },
    { k: "kisi", genislik: "26%", baslik: "Personel / izin", kart: "govde", sira: 2, hucre: (x) => (
      <span><Link href={`/personel/${x.personelId}`}>{x.personel}</Link><AltSatir><Kirp>{`${IZIN_TUR[x.tur]}${x.aciklama ? ` · ${x.aciklama}` : ""}`}</Kirp></AltSatir></span>
    ) },
    { k: "tarih", genislik: "24%", baslik: "Tarih", kart: "govde", sira: 3, hucre: (x) => {
      const asim = x.tur === "yillik" && x.durum === "bekliyor" && x.gun > x.ozet.kalan;
      return <><KartEtiket>Tarih</KartEtiket><span>{aralik(x)}<AltSatir uyari={asim}>{x.gun} iş günü{x.tur === "yillik" ? ` · kalan yıllık izin ${x.ozet.kalan} gün` : ""}</AltSatir></span></>;
    } },
    { k: "durum", genislik: "16%", baslik: "Durum", kart: "rozet", sira: 1, hucre: (x) => (
      <span><Rozet tur={IZIN_DURUM[x.durum][1]}>{IZIN_DURUM[x.durum][0]}</Rozet>{(x.red ?? (x.durum === "duzeltme" ? x.geri : null)) && <AltSatir><Kirp>{x.red ?? x.geri ?? ""}</Kirp></AltSatir>}</span>
    ) },
    { k: "eylem", genislik: "18%", baslik: "İşlem", kart: "eylem", sira: 9, hucre: (x) => (
      <div className={stil.tuslar}>
        {x.belge && <DosyaAcTusu dosyaId={x.belge} ikon="file-text" etiket={`${x.no} belgesi`}>Belge</DosyaAcTusu>}
        <a className={tusSinifi("ikincil")} href={`/talepler/pdf/izin/${x.id}`} download aria-label={`${x.no} formu PDF`}><Ikon ad="file-text" kucuk />PDF</a>
        {x.durum === "bekliyor" && <Link className={tusSinifi("ikincil")} href={onayAdresi(x)} aria-label={`${x.no} Onaylar'da aç`}><Ikon ad="circle-check" kucuk />Onaylar&apos;da aç</Link>}
      </div>
    ) },
  ];
  return (
    <>
      <SayfaBasi baslik="Personel" sayac={<Sayac s={s} />} />
      <PersonelSekmeleri secili="/personel/izinler" izinler />
      {bek > 0 && <SeritKap><Serit tur="uyari" ikon="inbox" eylem={<TusBaglanti tur="ikincil" href="/onaylar/talepler">Onaylar&apos;da aç</TusBaglanti>}>
        <b>{bek} izin talebi onayınızı bekliyor.</b> Karar Onaylar&apos;da verilir.</Serit></SeritKap>}
      <SuzgecliListe s={s} on="izn" baslik="İzin talepleri" sutunlar={sutunlar} anahtar={(x) => x.id}
        bosVeri={{ ikon: "inbox", baslik: "İzin talebi yok", metin: "Personel izin talebini Talepler'den gönderir." }} />
    </>
  );
}
