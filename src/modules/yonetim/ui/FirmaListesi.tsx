"use client";
/* YÖNETİM › FİRMALAR listesi (348; maket yonetim.html listeCiz): sayaç "N firma · M etkin", "Firma aç", yalnız probata ekibine açık şeridi;
   tablo ↔ kart (firma + adres · durum · kısa kod · depo · açılış · kullanıcı). */
import Link from "next/link";
import { useMemo } from "react";
import { Ikon } from "../../../components/ikon/Ikon";
import { KartEtiket, Kirp, type Sutun } from "../../../components/liste/Liste";
import { Sayac, SuzgecliListe, useSuzgec } from "../../../components/liste/SuzgecliListe";
import type { SuzgecTanimi } from "../../../components/liste/suzgec";
import { AltSatir, Kod, SayfaBasi } from "../../../components/sayfa/Sayfa";
import { TusBaglanti } from "../../../components/tus/Tus";
import type { FirmaSatiri } from "../server/yonetim";
import { Rozet } from "../../../components/sayfa/Sayfa";
import { DEPO_AD, DurumRozeti, firmaAdresi, tarihYaz, type DepoTuru } from "./ortak";
import stil from "./yonetim.module.css";

/* aranan metin listede görünen tam adresi de taşır (ana alan sunucudan — 347–348 incelemesi: yapıştırılan adres bulunmuyordu) */
const tanimKur = (anaAlan: string): SuzgecTanimi<FirmaSatiri> => ({
  ad: "Firmalarda ara", ipucu: "Ünvan, adres, kısa kod", birim: "firma", sayfa: 20, imkansiz: "",
  metin: (f) => `${f.ad} ${firmaAdresi(f.kisaAd, anaAlan)} ${f.kod} ${f.yonetici?.eposta ?? ""}`,
  cipler: [],
  seciciler: [
    { k: "durum", ad: "Durum", secenek: () => [["tumu", "Tümü"], ["etkin", "Etkin"], ["dondu", "Dondurulmuş"], ["kurulum", "Kuruluyor"]], gecer: (f, v) => v === "tumu" || f.durum === v },
  ],
});

export function FirmaListesi({ kayitlar, anaAlan, depo }: { kayitlar: FirmaSatiri[]; anaAlan: string; depo: DepoTuru }) {
  const tanim = useMemo(() => tanimKur(anaAlan), [anaAlan]);
  const s = useSuzgec(tanim, kayitlar);
  const etkin = kayitlar.filter((f) => f.durum === "etkin").length;
  const sutunlar: Sutun<FirmaSatiri>[] = [
    { k: "firma", genislik: "28%", baslik: "Firma", kart: "ust", sira: 1, hucre: (f) => (
      <span className={stil.hucreSatir}><Ikon ad="building-2" kucuk /><span className={stil.adres}>
        <Link className={stil.ad} href={`/yonetim/f/${f.id}`}>{f.ad}</Link><AltSatir><Kirp>{firmaAdresi(f.kisaAd, anaAlan)}</Kirp></AltSatir>
      </span></span>
    ) },
    { k: "durum", genislik: "12%", baslik: "Durum", kart: "rozet", sira: 1, hucre: (f) => <DurumRozeti durum={f.durum} /> },
    { k: "kod", genislik: "9%", baslik: "Kısa kod", kart: "govde", sira: 3, hucre: (f) => <><KartEtiket>Kısa kod</KartEtiket><Kod>{f.kod}</Kod></> },
    { k: "depo", genislik: "14%", baslik: "Veritabanı", kart: "govde", sira: 4, hucre: () => <><KartEtiket>Veritabanı</KartEtiket><Kirp>{DEPO_AD[depo]}</Kirp></> },
    { k: "yedek", genislik: "19%", baslik: "Yedek", kart: "govde", sira: 4, hucre: (f) => <><KartEtiket>Yedek</KartEtiket><YedekHucresi f={f} /></> },
    { k: "acilis", genislik: "9%", baslik: "Açılış", kart: "govde", sira: 5, hucre: (f) => <><KartEtiket>Açılış</KartEtiket>{tarihYaz(f.acilis)}</> },
    { k: "kullanici", genislik: "9%", baslik: "Kullanıcı", kart: "govde", sira: 6, hucre: (f) => <><KartEtiket>Kullanıcı</KartEtiket><span className={stil.sayi}>{f.kullanici}</span></> },
  ];
  return (
    <>
      <SayfaBasi baslik="Firmalar" sayac={<><Sayac s={s} /><span className={stil.sayacEk}> · {etkin} etkin</span></>}
        tuslar={<>
          {/* 567: hata kaydı (yalnız probata ekibi) */}
          <TusBaglanti tur="ikincil" ikon="triangle-alert" href="/yonetim/hatalar">Hata kaydı</TusBaglanti>
          <TusBaglanti tur="birincil" ikon="plus" href="/yonetim/yeni">Firma aç</TusBaglanti>
        </>} />
      <SuzgecliListe s={s} on="y" baslik="Firmalar" sutunlar={sutunlar} anahtar={(f) => f.id} href={(f) => `/yonetim/f/${f.id}`}
        bosVeri={{ ikon: "building-2", baslik: "Firma yok", eylem: { href: "/yonetim/yeni", etiket: "Firma aç", ikon: "plus" } }} />
    </>
  );
}

/* firmanın kendi yedeği (2026-11-04): Drive durumu + son gönderim; bekleyen dosya ve son Drive denetimi alt satırda */
const YEDEK_DURUM = { bagli: ["Drive bağlı", "tamam"], kopuk: ["Bağlantı koptu", "red"], dolu: ["Drive dolu", "red"], kesildi: ["Kesildi", "bekliyor"] } as const;
function YedekHucresi({ f }: { f: FirmaSatiri }) {
  const y = f.yedek;
  if (!y) return <Rozet tur="notr">Bağlı değil</Rozet>;
  const d = y.dogrulama;
  const [ad, tur] = d && !d.tamam ? ["Doğrulama sorunlu", "bekliyor"] as const : y.durum ? YEDEK_DURUM[y.durum] : ["Bağlı değil", "notr"] as const;
  const alt = [y.durum ? (y.son ? `son ${tarihYaz(y.son.slice(0, 10))}` : "henüz gönderim yok") : "probata arşivi", y.bekleyen ? `${y.bekleyen} bekliyor` : null,
    d ? (d.tamam ? `doğrulandı ${tarihYaz(d.zaman.slice(0, 10))}` : `${tarihYaz(d.zaman.slice(0, 10))}: ${d.sorun} sorun`) : null].filter(Boolean).join(" · ");
  return <span className={stil.adres}><Rozet tur={tur}>{ad}</Rozet><AltSatir><Kirp>{alt}</Kirp></AltSatir></span>;
}
