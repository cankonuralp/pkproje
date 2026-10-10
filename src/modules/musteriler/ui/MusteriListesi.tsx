"use client";
/* Müşteriler listesi (maket musteriler.html #/): süzgeç (kalıp 15), çipler, İl seçicisi, Görünüm anahtarı (Etkin müşteriler varsayılan), tablo ↔ kart.
   Bu kalemde gerçek verisi olan sütunlar: müşteri, tesisler, durum. Ekipman, müşteri girişi, en yakın kontrol, İSG-KATİP ve uygunsuzluk sütunları
   o modüllerin kalemiyle gelir (sayı uydurulmaz). */
import { useState } from "react";
import Link from "next/link";
import { Ikon } from "../../../components/ikon/Ikon";
import { KartEtiket, Kirp, type Sutun } from "../../../components/liste/Liste";
import { Sayac, SuzgecliListe, useSuzgec } from "../../../components/liste/SuzgecliListe";
import type { SuzgecTanimi } from "../../../components/liste/suzgec";
import { AltSatir, DegerYok, SayfaBasi } from "../../../components/sayfa/Sayfa";
import { Tus } from "../../../components/tus/Tus";
import { eksikMusteri, eksikTesis } from "../sema";
import type { MusteriSatiri } from "../server/musteriler";
import { MusteriPenceresi } from "./Pencereler";
import { PasifRozeti } from "./ortak";
import stil from "./musteriler.module.css";

const etkinTesisler = (m: MusteriSatiri) => m.tesisler.filter((t) => !t.pasif);
const iller = (m: MusteriSatiri) => [...new Set(etkinTesisler(m).map((t) => t.il).filter(Boolean) as string[])];
const eksikVar = (m: MusteriSatiri) => eksikMusteri(m).length > 0 || etkinTesisler(m).some((t) => eksikTesis(t).length > 0);

function tanim(kayitlar: readonly MusteriSatiri[]): SuzgecTanimi<MusteriSatiri> {
  return {
    ad: "Müşterilerde ara", ipucu: "Ünvan, vergi no, tesis, il", birim: "müşteri", sayfa: 20, imkansiz: "",
    metin: (m) => [m.unvan, m.kisa, m.vno ?? "", ...m.tesisler.map((t) => `${t.ad} ${t.ilce ?? ""} ${t.il ?? ""}`)].join(" "),
    cipler: [
      { k: "eksik", ad: "Bilgisi eksik", test: eksikVar },
      { k: "tesissiz", ad: "Tesisi yok", test: (m) => etkinTesisler(m).length === 0 },
    ],
    seciciler: [
      { k: "il", ad: "İl", secenek: () => [["tumu", "Tümü"], ...[...new Set(kayitlar.flatMap((m) => m.tesisler.map((t) => t.il)).filter(Boolean) as string[])]
        .sort((a, b) => a.localeCompare(b, "tr")).map((x) => [x, x] as const)],
        gecer: (m, v) => v === "tumu" || m.tesisler.some((t) => t.il === v) },
      /* görünüm anahtarı (kalıp 8): pasif müşteri listeden kalkar, burada görünür (karar 48) */
      { k: "gorunum", ad: "Görünüm", bas: "etkin", secenek: () => [["etkin", "Etkin müşteriler"], ["pasif", "Pasif müşteriler"], ["hepsi", "Hepsi"]],
        gecer: (m, v) => v === "hepsi" || (v === "pasif") === !!m.pasif },
    ],
  };
}

const SUTUNLAR: Sutun<MusteriSatiri>[] = [
  { k: "unvan", genislik: "44%", baslik: "Müşteri", kart: "ust", sira: 1, hucre: (m) => (
    <><Link className={stil.ad} href={`/musteriler/${m.id}`}>{m.unvan}</Link>{m.vno && <AltSatir>VKN {m.vno}</AltSatir>}</>
  ) },
  { k: "tesis", genislik: "32%", baslik: "Tesisler", kart: "govde", sira: 2, hucre: (m) => (
    <span className={stil.hucreSatir}><Ikon ad="map-pin" kucuk /><span><span className={stil.sayi}>{etkinTesisler(m).length} tesis</span><AltSatir><Kirp>{iller(m).join(" · ") || "—"}</Kirp></AltSatir></span></span>
  ) },
  { k: "durum", genislik: "24%", baslik: "Durum", kart: "rozet", sira: 1, hucre: (m) => {
    if (m.pasif) return <PasifRozeti />;
    const e = [...eksikMusteri(m), ...(etkinTesisler(m).some((t) => eksikTesis(t).length) ? ["tesis bilgisi"] : [])];
    return e.length ? <><KartEtiket>Durum</KartEtiket><AltSatir uyari>Eksik: {e.join(" · ")}</AltSatir></> : <DegerYok />;
  } },
];

export function MusteriListesi({ kayitlar, ekleyebilir }: { kayitlar: MusteriSatiri[]; ekleyebilir: boolean }) {
  const s = useSuzgec(tanim(kayitlar), kayitlar);
  const [pencere, setPencere] = useState(false);
  return (
    <>
      <SayfaBasi baslik="Müşteriler" sayac={<Sayac s={s} />}
        tuslar={ekleyebilir && <Tus ikon="plus" onClick={() => setPencere(true)}>Müşteri ekle</Tus>} />
      <SuzgecliListe s={s} on="m" baslik="Müşteriler" sutunlar={SUTUNLAR} anahtar={(m) => m.id} href={(m) => `/musteriler/${m.id}`}
        bosVeri={{ ikon: "building-2", baslik: "Müşteri yok", metin: "“Müşteri ekle” ile ilk müşteri ve tesisi kaydedilir." }} />
      {pencere && <MusteriPenceresi acik kapat={() => setPencere(false)} />}
    </>
  );
}
