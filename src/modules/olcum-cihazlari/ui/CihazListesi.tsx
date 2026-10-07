"use client";
/* Ölçüm cihazları listesi (maket olcum-cihazlari.html #/): üstte kalibrasyon uyarı şeritleri (geçti · eşik içinde bitiyor; "Göster" çipi açar),
   süzgeç (kalıp 15; kalibrasyon çipleri aynı grupta — iki durum birden olamaz), Cihaz türü ve Konum seçicileri, Görünüm (358: Etkin cihazlar
   varsayılan · Pasif · Hepsi — müşteri listesi deseni), tablo ↔ kart. Kişi zimmeti ve ara kontrol sütunu kendi kalemlerinde. Uyarı şeritleri yalnız etkin
   cihazları sayar. */
import Link from "next/link";
import { useState } from "react";
import { KartEtiket, Kirp, type Sutun } from "../../../components/liste/Liste";
import { Sayac, SuzgecliListe, useSuzgec } from "../../../components/liste/SuzgecliListe";
import type { SuzgecTanimi } from "../../../components/liste/suzgec";
import { AltSatir, Rozet, SayfaBasi } from "../../../components/sayfa/Sayfa";
import { Serit } from "../../../components/serit/Serit";
import { Tus } from "../../../components/tus/Tus";
import { kalanGun } from "../sema";
import type { CihazSatiri, CihazTuru, CihazTuruSatiri } from "../server/cihazlar";
import { CihazPenceresi } from "./Pencereler";
import { CihazTurleriPenceresi } from "./TurPencereleri";
import { KalRozeti, KONUM_AD, tarihYaz } from "./ortak";
import stil from "./cihazlar.module.css";

function tanim(esik: number, turler: readonly CihazTuru[]): SuzgecTanimi<CihazSatiri> {
  return {
    ad: "Cihazlarda ara", ipucu: "Cihaz kodu, cihaz, seri no", birim: "cihaz", imkansiz: "Bir cihazın kalibrasyonu aynı anda iki durumda olamaz",
    metin: (c) => [c.kod, c.tur, c.marka ?? "", c.model ?? "", c.seri ?? ""].join(" "),
    cipler: [
      { k: "gecti", ad: "Kalibrasyonu geçmiş", grup: "kal", test: (c) => c.durum === "gecti" },
      { k: "yakin", ad: `${esik} gün içinde bitiyor`, grup: "kal", test: (c) => c.durum === "yakin" },
      { k: "lab", ad: "Kalibrasyonda", grup: "kal", test: (c) => c.durum === "lab" },
      { k: "depo", ad: "Depoda", test: (c) => c.konum === "depo" },
    ],
    seciciler: [
      { k: "tur", ad: "Cihaz türü", secenek: () => [["tumu", "Tümü"], ...turler.map((t) => [t.id, t.ad] as const)], gecer: (c, v) => v === "tumu" || c.turId === v },
      /* görünüm anahtarı (kalıp 8; 358): pasif cihaz listeden kalkar, burada görünür */
      { k: "gorunum", ad: "Görünüm", bas: "etkin", secenek: () => [["etkin", "Etkin cihazlar"], ["pasif", "Pasif cihazlar"], ["hepsi", "Hepsi"]],
        gecer: (c, v) => v === "hepsi" || (v === "pasif") === !!c.pasif },
    ],
  };
}

const kalanMetni = (bitis: string | null, bugun: string, esik: number) => {
  if (!bitis) return <AltSatir uyari>Kayıt yok</AltSatir>;
  const k = kalanGun(bitis, bugun);
  return <><span className={stil.tarih}>{tarihYaz(bitis)}</span>{k < 0 ? <span className={stil.hata}>{-k} gün geçti</span> : <AltSatir uyari={k <= esik}>{k === 0 ? "Bugün bitiyor" : `${k} gün`}</AltSatir>}</>;
};

export function CihazListesi({ kayitlar, turler, esik, bugun, ekleyebilir, turSatirlari = [] }: {
  kayitlar: CihazSatiri[]; turler: CihazTuru[]; esik: number; bugun: string; ekleyebilir: boolean;
  /** 359: "Cihaz türleri" penceresinin satırları (yalnız değiştirebilene) */
  turSatirlari?: CihazTuruSatiri[];
}) {
  const s = useSuzgec(tanim(esik, turler), kayitlar);
  const [pencere, setPencere] = useState(false);
  const [turPenceresi, setTurPenceresi] = useState(false);
  const gecti = kayitlar.filter((c) => !c.pasif && c.durum === "gecti"), yakin = kayitlar.filter((c) => !c.pasif && c.durum === "yakin");
  /* 365: şerit etkin cihazları sayar — Göster görünümü de etkine döndürür (Pasif görünümde pasifleri listelemesin) */
  const goster = (k: string) => s.degistir({ ...s.durum, sec: { ...s.durum.sec, gorunum: "etkin" }, secili: [k], kip: "veya", sayfa: 1 });
  const sutunlar: Sutun<CihazSatiri>[] = [
    { k: "kod", genislik: "14%", baslik: "Cihaz kodu", kart: "ust", sira: 1, hucre: (c) => <Link className={stil.no} href={`/olcum-cihazlari/${c.id}`}>{c.kod}</Link> },
    { k: "ad", genislik: "34%", baslik: "Cihaz", kart: "govde", sira: 2, hucre: (c) => <><Kirp>{c.tur}</Kirp><AltSatir><Kirp>{[c.marka, c.model].filter(Boolean).join(" ") || "—"}{c.seri ? ` · seri ${c.seri}` : ""}</Kirp></AltSatir></> },
    { k: "konum", genislik: "16%", baslik: "Konum", kart: "govde", sira: 3, hucre: (c) => <><KartEtiket>Konum</KartEtiket>{KONUM_AD[c.konum]}</> },
    { k: "bitis", genislik: "16%", baslik: "Kalibrasyon bitişi", kart: "govde", sira: 4, hucre: (c) => <><KartEtiket>Kalibrasyon bitişi</KartEtiket>{kalanMetni(c.bitis, bugun, esik)}</> },
    { k: "durum", genislik: "20%", baslik: "Kalibrasyon", kart: "rozet", sira: 1, hucre: (c) => c.pasif ? <Rozet tur="notr">Pasif</Rozet> : <KalRozeti d={c.durum} esik={esik} /> },
  ];
  return (
    <>
      <SayfaBasi baslik="Ölçüm cihazları" sayac={<Sayac s={s} />} tuslar={ekleyebilir && <>
        <Tus tur="ikincil" ikon="layers" onClick={() => setTurPenceresi(true)}>Cihaz türleri</Tus>
        <Tus ikon="plus" onClick={() => setPencere(true)}>Cihaz ekle</Tus>
      </>} />
      {ekleyebilir && <CihazTurleriPenceresi acik={turPenceresi} kapat={() => setTurPenceresi(false)} turler={turSatirlari} />}
      {(gecti.length > 0 || yakin.length > 0) && (
        <div className={stil.seritler}>
          {gecti.length > 0 && <Serit tur="hata" ikon="circle-x" eylem={<Tus tur="ikincil" onClick={() => goster("gecti")}>Göster</Tus>}>
            <b>{gecti.length} cihazın kalibrasyonu geçti</b> · bu cihazlarla hazırlanan raporlar onaya gönderilemez.</Serit>}
          {yakin.length > 0 && <Serit tur="uyari" ikon="triangle-alert" eylem={<Tus tur="ikincil" onClick={() => goster("yakin")}>Göster</Tus>}>
            <b>{yakin.length} cihazın kalibrasyonu {esik} gün içinde bitiyor</b> · {yakin.map((c) => `${c.kod} (${tarihYaz(c.bitis)})`).join(", ")}</Serit>}
        </div>
      )}
      <SuzgecliListe s={s} on="c" baslik="Ölçüm cihazları" sutunlar={sutunlar} anahtar={(c) => c.id} href={(c) => `/olcum-cihazlari/${c.id}`}
        bosVeri={{ ikon: "gauge", baslik: "Ölçüm cihazı yok", metin: "“Cihaz ekle” ile ilk cihaz ve kalibrasyon bilgisi kaydedilir." }} />
      {pencere && <CihazPenceresi kapat={() => setPencere(false)} turler={turler} />}
    </>
  );
}
