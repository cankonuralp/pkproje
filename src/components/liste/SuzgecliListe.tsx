"use client";
/* SÜZGEÇLİ LİSTE — filtre satırı + liste + boş durumlar + sayfalayıcı tek yerden (maketteki MK.listeCiz). Kullanım:
     const s = useSuzgec(TANIM, kayitlar);
     <h1>Planlar</h1> <Sayac s={s} />
     <SuzgecliListe s={s} on="l" baslik="Planlar" sutunlar={…} anahtar={(p) => p.id} bosVeri={{ ikon, baslik, metin }} />
   Boş durumun dört hâli ayrı söylenir: veri yok · görünüm boş · süzgeç boş (Temizle) · imkânsız birleşim ("veya"ya geç). */
import { useCallback, useMemo, useState, type ReactNode } from "react";
import { BosDurum, type BosDurumEylemi } from "../bos/BosDurum";
import { Tus } from "../tus/Tus";
import { FiltreSatiri } from "./Filtre";
import { Liste, type ListeKipi, type Sutun } from "./Liste";
import { Sayfalayici } from "./Sayfalayici";
import { listele, siraSonraki, suzgecVar, temizle, yeniDurum, type ListeSonucu, type SuzgecDurumu, type SuzgecTanimi } from "./suzgec";
import stil from "./SuzgecliListe.module.css";

/* sayfa tuşlarının tek üreticisi ./Sayfalayici.tsx (2026-10-16: süzgeçsiz tablolar ve listeler de onunla sayfalı — useSayfa) */
export { Sayfalayici };

export interface Suzgec<K> {
  tanim: SuzgecTanimi<K>;
  durum: SuzgecDurumu;
  degistir: (d: SuzgecDurumu) => void;
  sonuc: ListeSonucu<K>;
  /** 566: sunucuda süzülen liste — çip sayıları sunucudan; yükleniyor (liste aria-busy) */
  cipSayilari?: Record<string, number>;
  yukleniyor?: boolean;
  /** 576: listeye özgü sayılar (sunucudan) */
  ek?: Record<string, number>;
}

export function useSuzgec<K>(tanim: SuzgecTanimi<K>, kayitlar: readonly K[], bas?: Partial<SuzgecDurumu>): Suzgec<K> {
  const [durum, degistir] = useState(() => ({ ...yeniDurum(tanim), ...bas }));
  const sonuc = useMemo(() => listele(tanim, durum, kayitlar), [tanim, durum, kayitlar]);
  return { tanim, durum, degistir, sonuc };
}

/** sayaç: süzgeç açıkken "3 / 12 plan", değilse "12 plan" (anayasa 2.8) */
export function Sayac<K>({ s }: { s: Suzgec<K> }) {
  const { tanim, durum, sonuc } = s;
  return (
    <span className={stil.sayac} role="status" data-sayac="">
      {suzgecVar(tanim, durum) ? <><b>{sonuc.adet}</b> / {sonuc.toplam} {tanim.birim}</> : <><b>{sonuc.toplam}</b> {tanim.birim}</>}
    </span>
  );
}

export function SuzgecliListe<K>({ s, on, baslik, sutunlar, anahtar, href, bosVeri, siralanir = false }: {
  s: Suzgec<K>;
  on: string;
  baslik: string;
  sutunlar: readonly Sutun<K>[];
  anahtar: (kayit: K) => string;
  href?: (kayit: K) => string | undefined;
  /** hiç kayıt yokken (ilk kullanım) */
  bosVeri: { ikon: string; baslik: string; metin?: string; eylem?: BosDurumEylemi };
  /** sütun başlığı sıralar (tanımda siralama seçicisi ve siraAnahtari olmalı) */
  siralanir?: boolean;
}) {
  const { tanim, durum, degistir, sonuc, cipSayilari } = s;
  const [kip, setKip] = useState<ListeKipi>("tablo");
  const kipDegisti = useCallback((k: ListeKipi) => setKip(k), []);
  const siraSecici = tanim.seciciler.find((x) => x.siralama);
  const siralama = siralanir && siraSecici ? {
    deger: durum.sec[siraSecici.k],
    degistir: (sutun: string) => degistir({ ...durum, sec: { ...durum.sec, [siraSecici.k]: siraSonraki(durum.sec[siraSecici.k], sutun) } }),
  } : undefined;

  let ic: ReactNode;
  switch (sonuc.hal) {
    case "veri-yok": ic = <BosDurum {...bosVeri} />; break;
    case "gorunum-bos": ic = <BosDurum ikon="inbox" baslik={`Bu görünümde ${tanim.birim} yok`} />; break;
    case "imkansiz": ic = (
      <BosDurum ikon="circle-alert" baslik={tanim.imkansiz}
        eylemTus={<Tus tur="ikincil" onClick={() => degistir({ ...durum, kip: "veya", sayfa: 1 })}>“veya”ya geç</Tus>} />
    ); break;
    case "suzgec-bos": ic = (
      <BosDurum ikon="search" baslik={`Filtreye uyan ${tanim.birim} yok`}
        eylemTus={<Tus tur="ikincil" onClick={() => degistir(temizle(tanim, durum))}>Süzgeci temizle</Tus>} />
    ); break;
    default: ic = <Liste baslik={baslik} sutunlar={sutunlar} kayitlar={sonuc.gorunen} anahtar={anahtar} href={href} siralama={siralama} kipDegisti={kipDegisti} />;
  }

  return (
    <>
      <FiltreSatiri on={on} tanim={tanim} durum={durum} degistir={degistir} tb={sonuc.tb} kip={kip} cipSayilari={cipSayilari} />
      {ic}
      {tanim.sayfa && sonuc.adet > 0 && (
        <Sayfalayici birim={tanim.birim} toplam={sonuc.adet} boy={tanim.sayfa} sayfa={sonuc.sayfa}
          degistir={(n) => degistir({ ...durum, sayfa: n })} />
      )}
    </>
  );
}
