"use client";
/* MUHASEBE LİSTELERİ (maket muhasebe.html #/ işler — IS_SUTUN, suzgecTanimla "i"; #/faturalar — F_SUTUN, "f"): en yeni üstte; listenin üstünde
   vadesi geçen alacak ve faturaya hazır işler şeridi (yalnız ekranda; bildirim yok — anayasa 1.3). Görme ve karar sunucuda. */
import Link from "next/link";
import { KartEtiket, Kirp, type Sutun } from "../../../components/liste/Liste";
import { Sayac, SuzgecliListe, useSuzgec } from "../../../components/liste/SuzgecliListe";
import type { SuzgecTanimi } from "../../../components/liste/suzgec";
import { AltSatir, DegerYok, Rozet, SayfaBasi, SeritKap } from "../../../components/sayfa/Sayfa";
import { tarihNo } from "../../../components/secim/tarih";
import { Serit } from "../../../components/serit/Serit";
import { TusBaglanti } from "../../../components/tus/Tus";
import { FATURA_DURUM, IS_DURUM, para } from "../sema";
import type { FaturaSatiri, IsSatiri } from "../server/muhasebe";
import { KarHucre } from "./Karlilik";
import { MuhasebeSekmeleri, gunFarki } from "./ortak";
import stil from "./muhasebe.module.css";

const kalanYaz = (n: number, gec: boolean) => (n > 0 ? <span className={gec ? `${stil.sayi} ${stil.uyari}` : stil.sayi}>{para(n)}</span> : <DegerYok />);
const musteriSecici = <T extends { musteriId: string; musteri: string }>(l: readonly T[]) => {
  const m = [...new Map(l.filter((x) => x.musteriId).map((x) => [x.musteriId, x.musteri])).entries()].sort((a, b) => a[1].localeCompare(b[1], "tr"));
  return { k: "musteri", ad: "Müşteri", secenek: () => [["tumu", "Tümü"], ...m.map(([id, ad]) => [id, ad] as const)] as const, gecer: (x: T, v: string) => v === "tumu" || x.musteriId === v };
};

/* ── İŞLER ── */
const IS_SUTUN: Sutun<IsSatiri>[] = [
  { k: "no", genislik: "12%", baslik: "Proje no", kart: "ust", sira: 1, hucre: (x) => <><Link className={stil.no} href={`/muhasebe/is/${x.id}`}>{x.no}</Link><AltSatir>{tarihNo(x.tarih)}</AltSatir></> },
  { k: "musteri", genislik: "19%", baslik: "Müşteri / tesis", kart: "govde", sira: 2, hucre: (x) => <span><Kirp>{x.musteri}</Kirp><AltSatir><Kirp>{x.tesis}</Kirp></AltSatir></span> },
  { k: "rapor", genislik: "13%", baslik: "Rapor", kart: "govde", sira: 3, hucre: (x) => (
    <><KartEtiket>Rapor</KartEtiket><span><span className={stil.sayi}>{x.imzali} / {x.toplam} imzalı</span><AltSatir>{x.faturali} faturalı</AltSatir></span></>
  ) },
  { k: "tutar", genislik: "16%", baslik: "Raporlanan (KDV hariç)", kart: "govde", sira: 4, hucre: (x) => (
    <><KartEtiket>Raporlanan (KDV hariç)</KartEtiket><span><span className={stil.sayi}>{para(x.raporlanan)}</span>{x.fiyatsiz > 0 && <AltSatir uyari>{x.fiyatsiz} rapor fiyatsız</AltSatir>}</span></>
  ) },
  { k: "kalan", genislik: "14%", baslik: "Açık alacak", kart: "govde", sira: 5, hucre: (x) => <><KartEtiket>Açık alacak</KartEtiket>{kalanYaz(x.kalan, x.durum === "gecikti")}</> },
  /* 328 (reisim 2026-09-27: "kar hesaplanacak kar yüzdesi yazacak iş başına") */
  { k: "kar", genislik: "14%", baslik: "Kâr", kart: "govde", sira: 6, hucre: (x) => <><KartEtiket>Kâr</KartEtiket><KarHucre kar={x.kar} oran={x.karOran} /></> },
  { k: "durum", genislik: "12%", baslik: "Durum", kart: "rozet", sira: 1, hucre: (x) => <Rozet tur={IS_DURUM[x.durum][1]}>{IS_DURUM[x.durum][0]}</Rozet> },
];
function isTanim(l: readonly IsSatiri[]): SuzgecTanimi<IsSatiri> {
  return {
    ad: "İşlerde ara", ipucu: "Proje no, müşteri, tesis", birim: "iş", sayfa: 20, imkansiz: "Bir iş aynı anda iki durumda olamaz",
    metin: (x) => [x.no, x.musteri, x.unvan, x.tesis, ...x.faturaNolari].join(" "),
    cipler: (["gecikti", "hazir", "tahsilat", "rapor", "kapandi"] as const).map((k) => ({ k, ad: IS_DURUM[k][0], grup: "durum", test: (x: IsSatiri) => x.durum === k })),
    seciciler: [musteriSecici(l)],
  };
}
export function IsListesi({ isler, faturalar }: { isler: IsSatiri[]; faturalar: FaturaSatiri[] }) {
  const s = useSuzgec(isTanim(isler), isler);
  return (
    <>
      <SayfaBasi baslik="Muhasebe" sayac={<Sayac s={s} />} />
      <MuhasebeSekmeleri secili="/muhasebe" />
      <UyariSeridi isler={isler} faturalar={faturalar} />
      <SuzgecliListe s={s} on="i" baslik="İşler" sutunlar={IS_SUTUN} anahtar={(x) => x.id} href={(x) => `/muhasebe/is/${x.id}`}
        bosVeri={{ ikon: "wallet", baslik: "İş yok", metin: "Planın ilk raporu yazılınca iş burada görünür." }} />
    </>
  );
}

/* ── FATURALAR ── */
export const vadeYaz = (f: FaturaSatiri) => {
  const k = gunFarki(f.vade);
  return <span><span className={stil.sayi}>{tarihNo(f.vade)}</span>{f.durum === "odendi" ? f.sonOdeme && <AltSatir>ödendi {tarihNo(f.sonOdeme)}</AltSatir>
    : k < 0 ? <AltSatir uyari>{-k} gün geçti</AltSatir> : <AltSatir uyari={k <= 7}>{k} gün kaldı</AltSatir>}</span>;
};
export const FATURA_SUTUN: Sutun<FaturaSatiri>[] = [
  { k: "no", genislik: "20%", baslik: "Fatura no", kart: "ust", sira: 1, hucre: (f) => <><Link className={stil.no} href={`/muhasebe/f/${f.id}`}>{f.no}</Link><AltSatir>{tarihNo(f.tarih)}</AltSatir></> },
  { k: "musteri", genislik: "24%", baslik: "Müşteri / iş", kart: "govde", sira: 2, hucre: (f) => (
    <span><Kirp>{f.musteri}</Kirp><AltSatir><Kirp>{f.isler.map((x) => `${x.no} · ${x.tesis}`).join(", ")}</Kirp></AltSatir></span>
  ) },
  { k: "vade", genislik: "16%", baslik: "Vade", kart: "govde", sira: 3, hucre: (f) => <><KartEtiket>Vade</KartEtiket>{vadeYaz(f)}</> },
  { k: "tutar", genislik: "14%", baslik: "Tutar (KDV dahil)", kart: "govde", sira: 4, hucre: (f) => <><KartEtiket>Tutar (KDV dahil)</KartEtiket><span className={stil.sayi}>{para(f.toplam)}</span></> },
  { k: "kalan", genislik: "13%", baslik: "Kalan", kart: "govde", sira: 5, hucre: (f) => <><KartEtiket>Kalan</KartEtiket>{kalanYaz(f.kalan, f.durum === "gecikti")}</> },
  { k: "durum", genislik: "13%", baslik: "Durum", kart: "rozet", sira: 1, hucre: (f) => <Rozet tur={FATURA_DURUM[f.durum][1]}>{FATURA_DURUM[f.durum][0]}</Rozet> },
];
function faturaTanim(l: readonly FaturaSatiri[]): SuzgecTanimi<FaturaSatiri> {
  return {
    ad: "Faturalarda ara", ipucu: "Fatura no, müşteri", birim: "fatura", sayfa: 20, imkansiz: "Bir fatura aynı anda iki durumda olamaz",
    metin: (f) => [f.no, f.musteri, f.unvan, ...f.isler.map((x) => x.no)].join(" "),
    cipler: (["gecikti", "bekliyor", "kismi", "odendi"] as const).map((k) => ({ k, ad: FATURA_DURUM[k][0], grup: "durum", test: (f: FaturaSatiri) => f.durum === k })),
    seciciler: [musteriSecici(l)],
  };
}
export function FaturaListesi({ isler, faturalar, durum }: { isler: IsSatiri[]; faturalar: FaturaSatiri[]; durum?: string }) {
  const s = useSuzgec(faturaTanim(faturalar), faturalar, durum && durum in FATURA_DURUM ? { secili: [durum] } : undefined);
  return (
    <>
      <SayfaBasi baslik="Muhasebe" sayac={<Sayac s={s} />} />
      <MuhasebeSekmeleri secili="/muhasebe/faturalar" />
      <UyariSeridi isler={isler} faturalar={faturalar} />
      <SuzgecliListe s={s} on="f" baslik="Faturalar" sutunlar={FATURA_SUTUN} anahtar={(f) => f.id} href={(f) => `/muhasebe/f/${f.id}`}
        bosVeri={{ ikon: "file-text", baslik: "Fatura yok", metin: "Faturaya hazır bir işin sayfasından “Fatura kaydet” ile eklenir." }} />
    </>
  );
}

/** vadesi geçen alacak ve faturaya hazır işler (maket uyariCiz) */
function UyariSeridi({ isler, faturalar }: { isler: readonly IsSatiri[]; faturalar: readonly FaturaSatiri[] }) {
  const gec = faturalar.filter((f) => f.durum === "gecikti"), hazir = isler.filter((x) => x.durum === "hazir");
  if (!gec.length && !hazir.length) return null;
  return (
    <SeritKap>
      {gec.length > 0 && <Serit tur="uyari" ikon="clock" eylem={<TusBaglanti tur="ikincil" href="/muhasebe/faturalar?durum=gecikti">Faturalar</TusBaglanti>}>
        <b>Vadesi geçen alacak:</b> {gec.length} fatura · {para(gec.reduce((n, f) => n + f.kalan, 0))}</Serit>}
      {hazir.length > 0 && <Serit tur="bilgi" ikon="file-check"><b>Faturaya hazır:</b> {hazir.map((x, i) => (
        <span key={x.id}>{i > 0 && ", "}<Link href={`/muhasebe/is/${x.id}`}>{x.no}</Link> · {x.musteri} ({x.hazir} imzalı rapor)</span>
      ))}</Serit>}
    </SeritKap>
  );
}
