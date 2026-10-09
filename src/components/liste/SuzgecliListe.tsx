"use client";
/* SÜZGEÇLİ LİSTE — filtre satırı + liste + boş durumlar + sayfalayıcı tek yerden (maketteki MK.listeCiz). Kullanım:
     const s = useSuzgec(TANIM, kayitlar);
     <h1>Planlar</h1> <Sayac s={s} />
     <SuzgecliListe s={s} on="l" baslik="Planlar" sutunlar={…} anahtar={(p) => p.id} bosVeri={{ ikon, baslik, metin }} />
   Boş durumun dört hâli ayrı söylenir: veri yok · görünüm boş · süzgeç boş (Temizle) · imkânsız birleşim ("veya"ya geç). */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { BosDurum, type BosDurumEylemi } from "../bos/BosDurum";
import { Ikon } from "../ikon/Ikon";
import { Tus } from "../tus/Tus";
import { FiltreSatiri } from "./Filtre";
import { Liste, type ListeKipi, type Sutun } from "./Liste";
import { listele, sayfaOgeleri, siraSonraki, suzgecVar, temizle, yeniDurum, type ListeSonucu, type SuzgecDurumu, type SuzgecTanimi } from "./suzgec";
import stil from "./SuzgecliListe.module.css";

export interface Suzgec<K> {
  tanim: SuzgecTanimi<K>;
  durum: SuzgecDurumu;
  degistir: (d: SuzgecDurumu) => void;
  sonuc: ListeSonucu<K>;
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
      {suzgecVar(tanim, durum) ? <><b>{sonuc.liste.length}</b> / {sonuc.toplam} {tanim.birim}</> : <><b>{sonuc.toplam}</b> {tanim.birim}</>}
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
  bosVeri: { ikon: string; baslik: string; metin: string; eylem?: BosDurumEylemi };
  /** sütun başlığı sıralar (tanımda siralama seçicisi ve siraAnahtari olmalı) */
  siralanir?: boolean;
}) {
  const { tanim, durum, degistir, sonuc } = s;
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
    case "gorunum-bos": ic = <BosDurum ikon="inbox" baslik={`Bu görünümde ${tanim.birim} yok`} metin="Görünüm değiştirilince liste yeniden dolar." />; break;
    case "imkansiz": ic = (
      <BosDurum ikon="circle-alert" baslik={tanim.imkansiz}
        metin="“ve” seçiliyken aynı gruptan iki çip birlikte hiçbir kayda uymaz. “veya” ile ikisine uyanlar birlikte listelenir."
        eylemTus={<Tus tur="ikincil" onClick={() => degistir({ ...durum, kip: "veya", sayfa: 1 })}>“veya”ya geç</Tus>} />
    ); break;
    case "suzgec-bos": ic = (
      <BosDurum ikon="search" baslik={`Filtreye uyan ${tanim.birim} yok`} metin="Arama ya da filtre değiştirilince liste yeniden dolar."
        eylemTus={<Tus tur="ikincil" onClick={() => degistir(temizle(tanim, durum))}>Süzgeci temizle</Tus>} />
    ); break;
    default: ic = <Liste baslik={baslik} sutunlar={sutunlar} kayitlar={sonuc.gorunen} anahtar={anahtar} href={href} siralama={siralama} kipDegisti={kipDegisti} />;
  }

  return (
    <>
      <FiltreSatiri on={on} tanim={tanim} durum={durum} degistir={degistir} tb={sonuc.tb} kip={kip} />
      {ic}
      {tanim.sayfa && sonuc.liste.length > 0 && (
        <Sayfalayici birim={tanim.birim} toplam={sonuc.liste.length} boy={tanim.sayfa} sayfa={sonuc.sayfa}
          degistir={(n) => degistir({ ...durum, sayfa: n })} />
      )}
    </>
  );
}

/* sayfalayıcı (kalıp 10: yalnız istenen listede; reisim 2026-09-23 "10 taneden sonra diğer sayfaya geçsin") — tıklanınca odak
   yeni sayfanın tuşuna geçer (yeniden çizimde kaybolmaz) */
export function Sayfalayici({ birim, toplam, boy, sayfa, degistir }: { birim: string; toplam: number; boy: number; sayfa: number; degistir: (n: number) => void }) {
  const kap = useRef<HTMLElement>(null);
  /* odaklanacak sayfa NUMARASI (bayrak değil): tuş hangi çizimde DOM'a gelirse gelsin o sayfanın tuşu odak alır. 2026-10-04: CI'da (telefon) odak
     "Sayfa 1"de kaldı (6739afa); yerelde yeniden üretilemedi. Önceki hâli yalnız [sayfa] değişince bir kez "aria-current"ı arıyordu — o çizimde
     kaçırılırsa bir daha denemiyordu. Şimdi her çizimden sonra, hedef sayfanın tuşu odak alana kadar. */
  const hedef = useRef<number | null>(null);
  useEffect(() => {
    if (hedef.current === null || hedef.current !== sayfa) return;
    const tus = kap.current?.querySelector<HTMLButtonElement>(`button[aria-label="Sayfa ${sayfa}"]`);
    if (!tus) return;
    tus.focus();
    if (document.activeElement === tus) hedef.current = null;
  });
  const n = Math.ceil(toplam / boy);
  const git = (i: number) => { hedef.current = i; degistir(i); };
  return (
    <nav className={stil.sayfalar} aria-label={`${birim} sayfaları`} ref={kap}>
      <span className={stil.sayfaBilgi}>{(sayfa - 1) * boy + 1}–{Math.min(toplam, sayfa * boy)} / {toplam}</span>
      {n > 1 && (
        <div className={stil.sayfaTuslar}>
          <button className={stil.sayfa} type="button" aria-label="Önceki sayfa" disabled={sayfa === 1} onClick={() => git(sayfa - 1)}><Ikon ad="chevron-left" kucuk /></button>
          {sayfaOgeleri(n, sayfa).map((o) => o.tur === "ara"
            ? <span key={`a${o.no}`} className={stil.sayfaAra} aria-hidden="true">…</span>
            : <button key={o.no} className={o.komsu ? `${stil.sayfa} ${stil.komsu}` : stil.sayfa} type="button" aria-label={`Sayfa ${o.no}`}
                aria-current={o.no === sayfa ? "page" : undefined} onClick={() => git(o.no)}>{o.no}</button>)}
          <button className={stil.sayfa} type="button" aria-label="Sonraki sayfa" disabled={sayfa === n} onClick={() => git(sayfa + 1)}><Ikon ad="chevron-right" kucuk /></button>
        </div>
      )}
    </nav>
  );
}
