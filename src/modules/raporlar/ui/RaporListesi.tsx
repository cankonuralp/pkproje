"use client";
/* RAPORLAR LİSTESİ (modül 14; maket raporlar.html #/ — reisim 2026-09-28: "filtreleyip arama detaylı olmalı; ekipman türüne rapor numarasına göre
   ayrı ayrı arayabilmeliyim", 2026-09-26: "sıralama tarihi olsun her zaman en yeni en yukarıda olsun", "raporlar modülünde kusurlu tuşunu kaldır"):
   alan alan arama (rapor no · ekipman kodu · ekipman türü · tesis), durum çipleri + Geri gönderilen, seçiciler Müşteri · İl · Sonuç · Yıl, 20'şer,
   en yeni üstte. Sütunlar Rapor no (+ tarih) · Ekipman · Müşteri / tesis · Sonuç · Durum; satır raporu açar. İmzasını bekleyen raporu olana
   şerit (Onaylar › İmzamı bekleyen raporlar). Görme sunucuda: denetçi kendi, branş yöneticisi branşı, planlama ve firma yöneticisi hepsi. */
import Link from "next/link";
import { KartEtiket, Kirp, type Sutun } from "../../../components/liste/Liste";
import { Sayac, SuzgecliListe, useSuzgec } from "../../../components/liste/SuzgecliListe";
import type { SuzgecTanimi } from "../../../components/liste/suzgec";
import { AltSatir, Rozet, SayfaBasi, SeritKap } from "../../../components/sayfa/Sayfa";
import { tarihNo } from "../../../components/secim/tarih";
import { Serit } from "../../../components/serit/Serit";
import { TusBaglanti } from "../../../components/tus/Tus";
import { RAPOR_DURUM, SONUC_AD } from "../sema";
import type { RaporListeSatiri } from "../server/raporlar";
import stil from "./raporlar.module.css";

const GUN = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" });
const gun = (iso: string) => GUN.format(new Date(iso));
const benzersiz = <T,>(l: readonly T[]) => [...new Set(l)];
const sonucAd = (r: RaporListeSatiri) => (r.sonuc ? SONUC_AD[r.sonuc] : null);

const SUTUNLAR: Sutun<RaporListeSatiri>[] = [
  { k: "no", genislik: "22%", baslik: "Rapor no", kart: "ust", sira: 1, hucre: (r) => (
    <><Link className={stil.no} href={`/raporlar/${r.id}`}>{r.no}</Link><AltSatir>{tarihNo(gun(r.olustu))}</AltSatir></>
  ) },
  { k: "ekipman", genislik: "24%", baslik: "Ekipman", kart: "govde", sira: 2, hucre: (r) => (
    <span className={stil.hucreSatir}><span className={stil.kod}>{r.ekipmanKod}</span><Kirp>{r.turAd}</Kirp></span>
  ) },
  { k: "tesis", genislik: "24%", baslik: "Müşteri / tesis", kart: "govde", sira: 3, hucre: (r) => (
    <span><Kirp>{r.tesis}</Kirp><AltSatir><Kirp>{r.musteri}</Kirp></AltSatir></span>
  ) },
  { k: "sonuc", genislik: "12%", baslik: "Sonuç", kart: "govde", sira: 4, hucre: (r) => {
    const s = sonucAd(r);
    return <><KartEtiket>Sonuç</KartEtiket>{s ? <span className={r.sonuc === "uygun_degil" ? stil.sonucHata : undefined}>{s}</span> : <span className={stil.bosSatir}>—</span>}</>;
  } },
  { k: "durum", genislik: "18%", baslik: "Durum", kart: "rozet", sira: 1, hucre: (r) => <Rozet tur={RAPOR_DURUM[r.durum][1]}>{RAPOR_DURUM[r.durum][0]}</Rozet> },
];

function tanim(l: readonly RaporListeSatiri[]): SuzgecTanimi<RaporListeSatiri> {
  return {
    ad: "Raporlarda ara", ipucu: "Hepsinde ara", birim: "rapor", sayfa: 20, imkansiz: "Bir rapor aynı anda iki durumda olamaz",
    metin: (r) => [r.no, r.ekipmanKod, r.turAd, r.tesis, r.musteri].join(" "),
    alanlar: [
      { k: "no", ad: "Rapor no", ipucu: "ör. DA-1026-…", metin: (r) => r.no },
      { k: "kod", ad: "Ekipman kodu", ipucu: "ör. HT-10", metin: (r) => r.ekipmanKod },
      { k: "tur", ad: "Ekipman türü", ipucu: "ör. hava tankı", metin: (r) => r.turAd },
      { k: "tesis", ad: "Tesis", ipucu: "ör. fabrika", metin: (r) => `${r.tesis} ${r.musteri}` },
    ],
    cipler: [
      ...(Object.keys(RAPOR_DURUM) as (keyof typeof RAPOR_DURUM)[]).map((d) => ({ k: d, ad: RAPOR_DURUM[d][0], grup: "durum", test: (r: RaporListeSatiri) => r.durum === d })),
      { k: "geri", ad: "Geri gönderilen", test: (r) => r.geri },
    ],
    seciciler: [
      { k: "musteri", ad: "Müşteri", secenek: () => [["tumu", "Tümü"], ...benzersiz(l.map((r) => r.musteriId)).map((m) => [m, l.find((r) => r.musteriId === m)!.musteri] as const)
        .sort((a, b) => a[1].localeCompare(b[1], "tr"))], gecer: (r, v) => v === "tumu" || r.musteriId === v },
      { k: "il", ad: "İl", secenek: () => [["tumu", "Tümü"], ...benzersiz(l.map((r) => r.il).filter((x): x is string => !!x)).sort((a, b) => a.localeCompare(b, "tr")).map((x) => [x, x] as const)],
        gecer: (r, v) => v === "tumu" || r.il === v },
      { k: "sonuc", ad: "Sonuç", secenek: () => [["tumu", "Tümü"], ["uygun", "Uygun"], ["uygun_degil", "Uygun değil"], ["yok", "Sonuç yok"]],
        gecer: (r, v) => v === "tumu" || (v === "yok" ? !r.sonuc : r.sonuc === v) },
      { k: "yil", ad: "Yıl", secenek: () => [["tumu", "Tümü"], ...benzersiz(l.map((r) => gun(r.olustu).slice(0, 4))).sort().reverse().map((y) => [y, y] as const)],
        gecer: (r, v) => v === "tumu" || gun(r.olustu).startsWith(v) },
    ],
  };
}

/** imzaGor: kişi Onaylar'ı görür (İmzamı bekleyen raporlar orada); görmüyorsa şerit yalnız bilgi verir, raporlar listede "Muayene uzmanı imzası" */
export function RaporListesi({ kayitlar, imzaGor }: { kayitlar: RaporListeSatiri[]; imzaGor: boolean }) {
  const s = useSuzgec(tanim(kayitlar), kayitlar);
  const imza = kayitlar.filter((r) => r.benim && r.durum === "onaylandi").length;
  return (
    <>
      <SayfaBasi baslik="Raporlar" sayac={<Sayac s={s} />} />
      {imza > 0 && (
        <SeritKap>
          <Serit tur="uyari" ikon="file-signature" eylem={imzaGor ? <TusBaglanti ikon="file-signature" href="/onaylar/imza">İmzamı bekleyen raporlar</TusBaglanti> : undefined}>
            <b>{imza} rapor imzanızı bekliyor</b>
          </Serit>
        </SeritKap>
      )}
      <SuzgecliListe s={s} on="r" baslik="Raporlar" sutunlar={SUTUNLAR} anahtar={(r) => r.id} href={(r) => `/raporlar/${r.id}`}
        bosVeri={{ ikon: "file-text", baslik: "Rapor yok", metin: "Raporlar plan içinde ekipmanın satırından oluşturulur." }} />
    </>
  );
}
