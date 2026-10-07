"use client";
/* Zimmetler listeleri (maket zimmetler.html #/ Kimde · #/hareketler Hareketler): süzgeç (kalıp 15), tür çipleri aynı grupta, Kimde / Kişi seçicisi,
   tablo ↔ kart. "Teslim et" ve "Demirbaş ekle" yalnız "değiştirir" düzeyine çizilir (karar sunucuda). Zimmet formu durumu (imzalı formda mı)
   personel özlük kaleminde. 362: Görünüm (kalıp 8) — pasif varlık listeden kalkar, "Pasif varlıklar"da görünür; teslim penceresinde yok. */
import Link from "next/link";
import { useState } from "react";
import { Ikon } from "../../../components/ikon/Ikon";
import { KartEtiket, Kirp, type Sutun } from "../../../components/liste/Liste";
import { Sayac, SuzgecliListe, useSuzgec } from "../../../components/liste/SuzgecliListe";
import type { SuzgecTanimi } from "../../../components/liste/suzgec";
import { AltSatir, DegerYok, Rozet, SayfaBasi, Sekmeler } from "../../../components/sayfa/Sayfa";
import { Tus } from "../../../components/tus/Tus";
import type { HareketSatiri, VarlikSatiri } from "../server/zimmet";
import { DemirbasPenceresi, TeslimPenceresi } from "./Pencereler";
import { DurumRozeti, kalGecti, kimdeAd, TUR_AD, TUR_IKON, zamanYaz } from "./ortak";
import stil from "./zimmet.module.css";

const adres = (anahtar: string) => `/zimmetler/varlik/${anahtar.replace(":", "/")}`;
const SEKMELER = [["Kimde", "/zimmetler"], ["Hareketler", "/zimmetler/hareketler"]] as const;

function kimdeTanim(varliklar: readonly VarlikSatiri[], bugun: string): SuzgecTanimi<VarlikSatiri> {
  return {
    ad: "Varlıklarda ara", ipucu: "Kod, varlık, kişi", birim: "varlık", imkansiz: "Bir varlık aynı anda iki türde olamaz",
    metin: (v) => `${v.kod} ${v.ad} ${kimdeAd(v.kimde)}`,
    cipler: [
      { k: "c", ad: "Ölçüm cihazı", grup: "tur", test: (v) => v.tur === "c" },
      { k: "a", ad: "Araç", grup: "tur", test: (v) => v.tur === "a" },
      { k: "d", ad: "Diğer", grup: "tur", test: (v) => v.tur === "d" },
      { k: "depo", ad: "Depoda", test: (v) => v.kimde.tip === "depo" },
      { k: "gecti", ad: "Kalibrasyonu geçmiş cihaz", test: (v) => kalGecti(v, bugun) },
    ],
    seciciler: [{ k: "kisi", ad: "Kimde", secenek: () => [["tumu", "Tümü"], ...[...new Map(varliklar.map((v) => [v.kimde.tip === "kisi" ? v.kimde.id : v.kimde.tip, kimdeAd(v.kimde)]))]
      .sort((a, b) => a[1].localeCompare(b[1], "tr")).map(([k, a]) => [k, a] as const)],
      gecer: (v, s) => s === "tumu" || (v.kimde.tip === "kisi" ? v.kimde.id : v.kimde.tip) === s },
      { k: "gorunum", ad: "Görünüm", bas: "etkin", secenek: () => [["etkin", "Etkin varlıklar"], ["pasif", "Pasif varlıklar"], ["hepsi", "Hepsi"]],
        gecer: (v, s) => s === "hepsi" || (s === "pasif") === v.pasif }],
  };
}

export function KimdeListesi({ varliklar, kisiler, bugun, yaz }: { varliklar: VarlikSatiri[]; kisiler: { id: string; ad: string }[]; bugun: string; yaz: boolean }) {
  const s = useSuzgec(kimdeTanim(varliklar, bugun), varliklar);
  const [p, setP] = useState<null | "teslim" | "demirbas">(null);
  const sutunlar: Sutun<VarlikSatiri>[] = [
    { k: "varlik", genislik: "30%", baslik: "Varlık", kart: "ust", sira: 1, hucre: (v) => (
      <span className={stil.hucreSatir}><Ikon ad={TUR_IKON[v.tur]} kucuk /><span><Link className={stil.ad} href={adres(v.anahtar)}>{v.kod}</Link><AltSatir><Kirp>{v.ad}</Kirp></AltSatir></span></span>
    ) },
    { k: "tur", genislik: "14%", baslik: "Tür", kart: "govde", sira: 2, hucre: (v) => <><KartEtiket>Tür</KartEtiket>{TUR_AD[v.tur]}</> },
    { k: "kimde", genislik: "20%", baslik: "Kimde", kart: "govde", sira: 3, hucre: (v) => <><KartEtiket>Kimde</KartEtiket><Kirp>{kimdeAd(v.kimde)}</Kirp></> },
    { k: "son", genislik: "20%", baslik: "Son teslim", kart: "govde", sira: 4, hucre: (v) => <><KartEtiket>Son teslim</KartEtiket>{v.son
      ? <><span>{zamanYaz(v.son.zaman)}</span><AltSatir><Kirp>{v.son.eden} → {v.son.alan}</Kirp></AltSatir></> : <DegerYok>Hareket yok</DegerYok>}</> },
    { k: "durum", genislik: "16%", baslik: "Durum", kart: "rozet", sira: 1, hucre: (v) => <DurumRozeti v={v} bugun={bugun} /> },
  ];
  return (
    <>
      <SayfaBasi baslik="Zimmetler" sayac={<Sayac s={s} />} tuslar={yaz && <>
        <Tus tur="ikincil" ikon="plus" onClick={() => setP("demirbas")}>Demirbaş ekle</Tus>
        <Tus ikon="arrow-right-left" onClick={() => setP("teslim")}>Teslim et</Tus>
      </>} />
      <Sekmeler ad="Zimmet bölümleri" ogeler={SEKMELER} secili="/zimmetler" />
      <SuzgecliListe s={s} on="z" baslik="Kimde" sutunlar={sutunlar} anahtar={(v) => v.anahtar} href={(v) => adres(v.anahtar)}
        bosVeri={{ ikon: "package", baslik: "Varlık yok", metin: "Ölçüm cihazları ve demirbaşlar eklenince burada kimde oldukları görünür." }} />
      {p === "teslim" && <TeslimPenceresi kapat={() => setP(null)} varliklar={varliklar} kisiler={kisiler} bugun={bugun} />}
      {p === "demirbas" && <DemirbasPenceresi kapat={() => setP(null)} />}
    </>
  );
}

function hareketTanim(hareketler: readonly HareketSatiri[]): SuzgecTanimi<HareketSatiri> {
  const kisiler = [...new Set(hareketler.flatMap((h) => [h.eden, h.alan]).filter((x) => x !== "Depo"))].sort((a, b) => a.localeCompare(b, "tr"));
  return {
    ad: "Hareketlerde ara", ipucu: "Varlık, kişi, not", birim: "hareket", imkansiz: "Bir hareket aynı anda iki türde olamaz", sayfa: 20,
    metin: (h) => `${h.varlikKod} ${h.varlikAd} ${h.eden} ${h.alan} ${h.notu ?? ""}`,
    cipler: [
      { k: "c", ad: "Ölçüm cihazı", grup: "tur", test: (h) => h.varlik.startsWith("c:") },
      { k: "a", ad: "Araç", grup: "tur", test: (h) => h.varlik.startsWith("a:") },
      { k: "d", ad: "Diğer", grup: "tur", test: (h) => h.varlik.startsWith("d:") },
      { k: "fotosuz", ad: "Fotoğrafsız", test: (h) => !h.fotolar.length },
    ],
    seciciler: [{ k: "kisi", ad: "Kişi", secenek: () => [["tumu", "Tümü"], ...kisiler.map((k) => [k, k] as const)], gecer: (h, s) => s === "tumu" || h.eden === s || h.alan === s }],
  };
}

export function HareketListesi({ hareketler }: { hareketler: HareketSatiri[] }) {
  const s = useSuzgec(hareketTanim(hareketler), hareketler);
  const sutunlar: Sutun<HareketSatiri>[] = [
    { k: "zaman", genislik: "18%", baslik: "Tarih", kart: "ust", sira: 1, hucre: (h) => <span>{zamanYaz(h.zaman)}</span> },
    { k: "varlik", genislik: "26%", baslik: "Varlık", kart: "govde", sira: 2, hucre: (h) => <><Link className={stil.ad} href={adres(h.varlik)}>{h.varlikKod}</Link><AltSatir><Kirp>{h.varlikAd}</Kirp></AltSatir></> },
    { k: "kim", genislik: "30%", baslik: "Teslim eden → alan", kart: "govde", sira: 3, hucre: (h) => <><KartEtiket>Teslim eden → alan</KartEtiket><Kirp>{h.eden} → <b>{h.alan}</b></Kirp></> },
    { k: "foto", genislik: "10%", baslik: "Fotoğraf", kart: "govde", sira: 4, hucre: (h) => <span className={stil.hucreSatir}><Ikon ad="camera" kucuk />{h.fotolar.length}</span> },
    { k: "tur", genislik: "16%", baslik: "Hareket", kart: "rozet", sira: 1, hucre: (h) => h.alanKisi ? <Rozet tur="tamam">Kişiye teslim</Rozet> : <Rozet tur="notr">Depoya alındı</Rozet> },
  ];
  return (
    <>
      <SayfaBasi baslik="Zimmetler" sayac={<Sayac s={s} />} />
      <Sekmeler ad="Zimmet bölümleri" ogeler={SEKMELER} secili="/zimmetler/hareketler" />
      <SuzgecliListe s={s} on="h" baslik="Hareketler" sutunlar={sutunlar} anahtar={(h) => h.id} href={(h) => adres(h.varlik)}
        bosVeri={{ ikon: "arrow-right-left", baslik: "Hareket yok", metin: "Her teslim ayrı kayıt olarak burada birikir." }} />
    </>
  );
}
