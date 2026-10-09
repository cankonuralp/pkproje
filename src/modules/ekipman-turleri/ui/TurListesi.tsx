"use client";
/* Ekipman türleri kataloğu (maket ekipman-turleri.html #/): branşa göre iki sekme (AA5: Mekanik · Elektrik), süzgeç (kalıp 15), Ek-III grubu
   seçicisi, tablo ↔ kart. Ekipman sayısı, Bakanlık formatı ve standart sütunları o modüllerin kalemiyle gelir (sayı uydurulmaz).
   450 (reisim 2026-10-09: "standart olarak pdf formatı yükleyin diyor hala"): "Rapor formatı" sütunu YAYINDAKİ rapor şablonunu gösterir (rapor ondan
   yazılır, belge Bakanlık görünümünde çizilir) — yüklenen PDF değil; PDF isteğe bağlı. */
import Link from "next/link";
import { useState } from "react";
import { KartEtiket, Kirp, type Sutun } from "../../../components/liste/Liste";
import { Sayac, SuzgecliListe, useSuzgec } from "../../../components/liste/SuzgecliListe";
import type { SuzgecTanimi } from "../../../components/liste/suzgec";
import { AltSatir, Rozet, SayfaBasi, Sekmeler } from "../../../components/sayfa/Sayfa";
import { Tus } from "../../../components/tus/Tus";
import { GRUPLAR, grupBul } from "../sema";
import type { TurSatiri } from "../server/turler";
import { HazirFormatlar, type HazirFormat } from "./HazirFormatlar";
import { TurPenceresi } from "./Pencereler";
import { tarihYaz } from "./ortak";
import stil from "./turler.module.css";

type Yayinda = Record<string, { sira: number; yayin: string | null }>;

function tanim(brans: "m" | "e", yayinda: Yayinda): SuzgecTanimi<TurSatiri> {
  return {
    ad: "Türlerde ara", ipucu: "Tür, kod", birim: "tür", sayfa: 20, imkansiz: "",
    metin: (t) => `${t.ad} ${t.kod}`,
    cipler: [{ k: "formatsiz", ad: "Rapor formatı yayında değil", test: (t) => !yayinda[t.id] }],
    seciciler: [{ k: "grup", ad: "Ek-III grubu", secenek: () => [["tumu", "Tümü"], ...GRUPLAR.filter((g) => !g.b || g.b === brans).map((g) => [g.k, g.ad] as const)],
      gecer: (t, v) => v === "tumu" || t.grup === v }],
  };
}

const sutunlar = (yayinda: Yayinda): Sutun<TurSatiri>[] => [
  { k: "tur", genislik: "34%", baslik: "Tür", kart: "ust", sira: 1, hucre: (t) => <><Link className={stil.ad} href={`/ekipman-turleri/${t.id}`}>{t.ad}</Link><AltSatir>Kod {t.kod}</AltSatir></> },
  { k: "grup", genislik: "30%", baslik: "Ek-III grubu", kart: "govde", sira: 2, hucre: (t) => <><KartEtiket>Ek-III grubu</KartEtiket><Kirp>{grupBul(t.grup)?.ad ?? "—"}</Kirp></> },
  { k: "periyot", genislik: "12%", baslik: "Periyot", kart: "govde", sira: 3, hucre: (t) => <span className={stil.sayi}><KartEtiket>Periyot</KartEtiket>{t.periyot} ay</span> },
  { k: "rapor", genislik: "24%", baslik: "Rapor formatı", kart: "rozet", sira: 1, hucre: (t) => yayinda[t.id]
    ? <span className={stil.hucreSatir}><Rozet tur="tamam">Yayında</Rozet><AltSatir>Sürüm {yayinda[t.id].sira}{yayinda[t.id].yayin ? ` · ${tarihYaz(yayinda[t.id].yayin!)}` : ""}</AltSatir></span>
    : <Rozet tur="bekliyor">Yayında değil</Rozet> },
];

export function TurListesi({ kayitlar, brans, sayilar, ekleyebilir, yayinda, hazir, sablondanEkler }:
  { kayitlar: TurSatiri[]; brans: "m" | "e"; sayilar: { m: number; e: number }; ekleyebilir: boolean; yayinda: Yayinda; hazir: HazirFormat[]; sablondanEkler: boolean }) {
  const s = useSuzgec(tanim(brans, yayinda), kayitlar);
  const [pencere, setPencere] = useState(false);
  return (
    <>
      <SayfaBasi baslik="Ekipman türleri" sayac={<Sayac s={s} />} tuslar={ekleyebilir && <Tus ikon="plus" onClick={() => setPencere(true)}>Tür ekle</Tus>} />
      <Sekmeler ad="Branşlar" ogeler={[[`Mekanik (${sayilar.m})`, "/ekipman-turleri"], [`Elektrik (${sayilar.e})`, "/ekipman-turleri?brans=e"]]}
        secili={brans === "e" ? "/ekipman-turleri?brans=e" : "/ekipman-turleri"} />
      <SuzgecliListe s={s} on="t" baslik="Ekipman türleri" sutunlar={sutunlar(yayinda)} anahtar={(t) => t.id} href={(t) => `/ekipman-turleri/${t.id}`}
        bosVeri={{ ikon: "layers", baslik: "Ekipman türü yok", metin: hazir.length ? "“Tür ekle” ile ya da aşağıdaki hazır rapor formatlarından tür eklenir." : "“Tür ekle” ile ilk tür eklenir; rapor formatı Ek-III grubuna göre hazır gelir." }} />
      <HazirFormatlar formatlar={hazir} brans={brans} ekleyebilir={sablondanEkler} />
      {pencere && <TurPenceresi kapat={() => setPencere(false)} brans={brans} />}
    </>
  );
}
