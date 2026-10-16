"use client";
/* RAPORLAR LİSTESİ (modül 14; maket raporlar.html #/ — reisim 2026-09-28: "filtreleyip arama detaylı olmalı; ekipman türüne rapor numarasına göre
   ayrı ayrı arayabilmeliyim", 2026-09-26: "sıralama tarihi olsun her zaman en yeni en yukarıda olsun", "raporlar modülünde kusurlu tuşunu kaldır"):
   alan alan arama (rapor no · ekipman kodu · ekipman türü · tesis), durum çipleri + Geri gönderilen, seçiciler Müşteri · İl · Sonuç · Yıl, 20'şer,
   en yeni üstte. Sütunlar Rapor no (+ tarih) · Ekipman · Müşteri / tesis · Sonuç · Durum; satır raporu açar. İmzasını bekleyen raporu olana
   şerit (Onaylar › İmzamı bekleyen raporlar). Görme sunucuda: denetçi kendi, branş yöneticisi branşı, planlama ve firma yöneticisi hepsi.
   566 (09-B3): süzgeç ve sayfa SUNUCUDA (server/liste.ts raporSayfasi — aynı anahtarlar); ekrana yalnız sayfanın 20 satırı ve sayılar gelir. */
import Link from "next/link";
import { KartEtiket, Kirp, type Sutun } from "../../../components/liste/Liste";
import { Sayac, SuzgecliListe } from "../../../components/liste/SuzgecliListe";
import { useSunucuSuzgec } from "../../../components/liste/SunucuSuzgec";
import type { Secenek, SunucuListe, SuzgecTanimi } from "../../../components/liste/suzgec";
import { AltSatir, Rozet, SayfaBasi, SeritKap } from "../../../components/sayfa/Sayfa";
import { tarihNo } from "../../../components/secim/tarih";
import { Serit } from "../../../components/serit/Serit";
import { TusBaglanti } from "../../../components/tus/Tus";
import { RAPOR_DURUM, SONUC_AD } from "../sema";
import type { RaporListeSatiri } from "../server/raporlar";
import { raporSayfasiEylemi } from "./eylemler";
import stil from "./raporlar.module.css";

const GUN = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" });
const gun = (iso: string) => GUN.format(new Date(iso));
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
    return <><KartEtiket>Sonuç</KartEtiket>{s ? <span className={r.sonuc === "uygun_degil" ? stil.sonucHata : r.sonuc === "sartli" ? stil.sonucUyari : undefined}>{s}</span> : <span className={stil.bosSatir}>—</span>}</>;
  } },
  { k: "durum", genislik: "18%", baslik: "Durum", kart: "rozet", sira: 1, hucre: (r) => <Rozet tur={RAPOR_DURUM[r.durum][1]}>{RAPOR_DURUM[r.durum][0]}</Rozet> },
];

/* süzgeç tanımı: anahtarlar sunucudakiyle aynı (server/liste.ts raporKaynagi); test / gecer / metin SUNUCUDA uygulanır — burada yalnız ekranın
   çizimi için (ad, seçenek); seçenekler (müşteri, il, yıl) sunucudan, görebildiği raporlardan */
const hep = () => true;
function tanim(sec: Record<string, Secenek[]>): SuzgecTanimi<RaporListeSatiri> {
  const tumu: Secenek = ["tumu", "Tümü"];
  return {
    ad: "Raporlarda ara", ipucu: "Hepsinde ara", birim: "rapor", sayfa: 20, imkansiz: "Bir rapor aynı anda iki durumda olamaz",
    metin: () => "",
    alanlar: [
      { k: "no", ad: "Rapor no", ipucu: "ör. DA-1026-…", metin: () => "" },
      { k: "kod", ad: "Ekipman kodu", ipucu: "ör. HT-10", metin: () => "" },
      { k: "tur", ad: "Ekipman türü", ipucu: "ör. hava tankı", metin: () => "" },
      { k: "tesis", ad: "Tesis", ipucu: "ör. fabrika", metin: () => "" },
    ],
    cipler: [
      ...(Object.keys(RAPOR_DURUM) as (keyof typeof RAPOR_DURUM)[]).map((d) => ({ k: d, ad: RAPOR_DURUM[d][0], grup: "durum", test: hep })),
      { k: "geri", ad: "Geri gönderilen", test: hep },
    ],
    seciciler: [
      { k: "musteri", ad: "Müşteri", secenek: () => [tumu, ...(sec.musteri ?? [])], gecer: hep },
      { k: "il", ad: "İl", secenek: () => [tumu, ...(sec.il ?? [])], gecer: hep },
      { k: "sonuc", ad: "Sonuç", secenek: () => [tumu, ["uygun", "Uygun"], ["uygun_degil", "Uygun değil"], ["sartli", "Şartlı uygun"], ["yok", "Sonuç yok"]], gecer: hep },
      { k: "yil", ad: "Yıl", secenek: () => [tumu, ...(sec.yil ?? [])], gecer: hep },
    ],
  };
}

/** imzaGor: kişi Onaylar'ı görür (İmzamı bekleyen raporlar orada); görmüyorsa şerit yalnız bilgi verir, raporlar listede "Muayene uzmanı imzası" */
export function RaporListesi({ ilk, imza, imzaGor }: { ilk: SunucuListe<RaporListeSatiri>; imza: number; imzaGor: boolean }) {
  const s = useSunucuSuzgec(tanim, ilk, raporSayfasiEylemi);
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
