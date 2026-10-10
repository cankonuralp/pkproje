"use client";
/* PERSONEL › İZİN TALEPLERİ (maket personel.html #/izinler — IZIN_SUTUN, izinCiz; 2026-09-28 reisim: izin onayı firma yöneticisinde; 330). Talepler'den
   gelen izin talepleri, bekleyen üstte; yıllık izinde kişinin kalan hakkı yanında (aşıyorsa uyarı, engel değil).
   477 (reisim 2026-10-10, Talepler–Onaylar kararları T1 · T4 "kalksın"): KARAR ONAYLAR'DA — burada liste ve geçmiş; onay bekleyen satırda "Onaylar'da
   aç". Görme sunucuda (Talepler "değiştirir" — firma yöneticisi). */
import Link from "next/link";
import { DosyaAcTusu } from "../../../components/gizli-resim/GizliResim";
import { KartEtiket, Kirp, Liste, type Sutun } from "../../../components/liste/Liste";
import { AltSatir, Rozet, SayfaBasi, SeritKap } from "../../../components/sayfa/Sayfa";
import { tarihNo } from "../../../components/secim/tarih";
import { Serit } from "../../../components/serit/Serit";
import { Ikon } from "../../../components/ikon/Ikon";
import { TusBaglanti, tusSinifi } from "../../../components/tus/Tus";
import { BosDurum } from "../../../components/bos/BosDurum";
import { PersonelSekmeleri } from "../../personel/ui/ortak";
import { IZIN_DURUM, IZIN_TUR } from "../sema";
import type { IzinSatiri } from "../server/talepler";
import stil from "./talepler.module.css";

const aralik = (x: { bas: string; bit: string }) => `${tarihNo(x.bas)}${x.bit !== x.bas ? ` – ${tarihNo(x.bit)}` : ""}`;
/* gönderim günü Türkiye takvimiyle (UTC'de gece yarısından önceki güne düşmesin — 329–332 incelemesi) */
const GUN = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" });
const gunTr = (iso: string) => GUN.format(new Date(iso));
const onayAdresi = (x: IzinSatiri) => `/onaylar/talepler?sec=izin-${x.id}`;

export function IzinTalepleri({ l }: { l: IzinSatiri[] }) {
  const bek = l.filter((x) => x.durum === "bekliyor").length;
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
      <SayfaBasi baslik="Personel" sayac={<span className={stil.sayi}><b>{l.length}</b> talep</span>} />
      <PersonelSekmeleri secili="/personel/izinler" izinler />
      {bek > 0 && <SeritKap><Serit tur="uyari" ikon="inbox" eylem={<TusBaglanti tur="ikincil" href="/onaylar/talepler">Onaylar&apos;da aç</TusBaglanti>}>
        <b>{bek} izin talebi onayınızı bekliyor.</b> Karar Onaylar&apos;da verilir.</Serit></SeritKap>}
      {l.length ? <Liste baslik="İzin talepleri" sutunlar={sutunlar} kayitlar={l} anahtar={(x) => x.id} />
        : <BosDurum ikon="inbox" baslik="İzin talebi yok" metin="Personel izin talebini Talepler'den gönderir." />}
    </>
  );
}
