"use client";
/* UYARILAR (maket uyarilar.html M10 — SUTUN, suzgecTanimla "u"; 331): kalibrasyon bitişi, eğitim tekrarı, araç belgesi; en yakın tarih üstte; tür çipleri
   (adresten ?tur=kalibrasyon|egitim|arac), "Süresi geçmiş", kişi seçicisi. Yalnız ekranda (anayasa 1.3); "okundu" yok — koşul kalkınca düşer. */
import Link from "next/link";
import { KartEtiket, Kirp, type Sutun } from "../../../components/liste/Liste";
import { Sayac, SuzgecliListe, useSuzgec } from "../../../components/liste/SuzgecliListe";
import type { SuzgecTanimi } from "../../../components/liste/suzgec";
import { Ikon } from "../../../components/ikon/Ikon";
import { AltSatir, DegerYok, Rozet, SayfaBasi } from "../../../components/sayfa/Sayfa";
import { tarihNo } from "../../../components/secim/tarih";
import { UYARI_TUR, type UyariTuru } from "../sema";
import type { Uyari } from "../server/uyarilar";
import stil from "./uyarilar.module.css";

const GUN = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" });
const kalan = (iso: string) => Math.round((Date.parse(`${iso}T00:00:00Z`) - Date.parse(`${GUN.format(new Date())}T00:00:00Z`)) / 864e5);
const DURUM = { gecti: ["red", "Süresi geçti"], yakin: ["bekliyor", "Yaklaşıyor"] } as const;
const TARIH_AD: Record<UyariTuru, string> = { kal: "Kalibrasyon bitişi", egt: "Tekrar tarihi", arac: "Belge bitişi" };

function tanim(l: readonly Uyari[]): SuzgecTanimi<Uyari> {
  const kisiler = [...new Map(l.filter((u) => u.kisi).map((u) => [u.kisi!.id, u.kisi!.ad])).entries()].sort((a, b) => a[1].localeCompare(b[1], "tr"));
  return {
    ad: "Uyarılarda ara", ipucu: "Cihaz, eğitim, araç, kişi", birim: "uyarı", sayfa: 20, imkansiz: "Bir uyarı tek türdendir",
    metin: (u) => [u.konu, u.alt, u.kisi?.ad ?? "depo"].join(" "),
    cipler: [
      ...(Object.keys(UYARI_TUR) as UyariTuru[]).map((k) => ({ k, ad: UYARI_TUR[k].ad, grup: "tur", test: (u: Uyari) => u.tur === k })),
      { k: "gecti", ad: "Süresi geçmiş", test: (u) => u.durum === "gecti" },
    ],
    seciciler: [{ k: "kisi", ad: "Kişi", secenek: () => [["tumu", "Tümü"], ["depo", "Depoda"], ...kisiler.map(([id, ad]) => [id, ad] as [string, string])],
      gecer: (u, v) => v === "tumu" || (v === "depo" ? !u.kisi : u.kisi?.id === v) }],
  };
}
const SUTUN: Sutun<Uyari>[] = [
  { k: "konu", genislik: "34%", baslik: "Uyarı", kart: "ust", sira: 1, hucre: (u) => (
    <span className={stil.satir}><Ikon ad={UYARI_TUR[u.tur].ikon} kucuk /><span><Link className={stil.ad} href={u.href}><Kirp>{u.konu}</Kirp></Link><AltSatir>{u.alt}</AltSatir></span></span>
  ) },
  { k: "kisi", genislik: "20%", baslik: "Kimde / kim", kart: "govde", sira: 2, hucre: (u) => <><KartEtiket>{u.tur === "egt" ? "Kişi" : "Kimde"}</KartEtiket>{u.kisi ? <Kirp>{u.kisi.ad}</Kirp> : <DegerYok>Depoda</DegerYok>}</> },
  { k: "tarih", genislik: "16%", baslik: "Bitiş / tekrar", kart: "govde", sira: 3, hucre: (u) => <><KartEtiket>{TARIH_AD[u.tur]}</KartEtiket><span className={stil.sayi}>{tarihNo(u.tarih)}</span></> },
  { k: "kalan", genislik: "18%", baslik: "Kalan", kart: "govde", sira: 4, hucre: (u) => { const k = kalan(u.tarih); return (
    <><KartEtiket>Kalan</KartEtiket><span><span className={k < 0 ? stil.hata : stil.uyari}>{k < 0 ? `${-k} gün geçti` : k === 0 ? "bugün" : `${k} gün`}</span><AltSatir>{u.sonuc}</AltSatir></span></>
  ); } },
  { k: "durum", genislik: "12%", baslik: "Durum", kart: "rozet", sira: 1, hucre: (u) => <Rozet tur={DURUM[u.durum][0]}>{DURUM[u.durum][1]}</Rozet> },
];
export function UyariListesi({ l, tur }: { l: Uyari[]; tur?: UyariTuru }) {
  const s = useSuzgec(tanim(l), l, tur ? { secili: [tur] } : undefined);
  return (
    <>
      <SayfaBasi baslik="Uyarılar" sayac={<Sayac s={s} />} />
      <SuzgecliListe s={s} on="u" baslik="Uyarılar" sutunlar={SUTUN} anahtar={(u) => u.id} href={(u) => u.href}
        bosVeri={{ ikon: "circle-check", baslik: "Uyarı yok", metin: "Yaklaşan kalibrasyon, eğitim tekrarı ya da araç belgesi yok." }} />
    </>
  );
}
