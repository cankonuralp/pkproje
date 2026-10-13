"use client";
/* S.A.Y CHAT FOTOĞRAF TUŞU (527; reisim 2026-10-13: "say chatte fotoğraf işaretine tıklayınca galeriden veya pc den de fotoğraf yükleyebilmek olsun").
   Tuş → küçük menü: "Fotoğraf çek" (telefonda kamera açılır) · "Galeriden / bilgisayardan seç" (telefon galerisi ya da bilgisayardaki dosya; çoklu
   tuşta birden çok fotoğraf). S.A.Y ataç menüsünün düzeni (say.module.css .ekMenu). Menü üst katmanda yüzer (components/secim/yuzen.ts — panelin
   kenarında kesilmez, kayan gövdeyi itmez); dışarı tıklanınca ya da Esc ile kapanır (Esc paneli kapatmaz, odak tuşa döner); seçim yapılınca kapanır.
   Hangi fotoğrafın kayda gireceği çağıranda (foto-secim.ts). Kamera da galeri de aynı küçültme ve denetimden geçer. */
import { useEffect, useId, useRef, useState, type ChangeEvent } from "react";
import { useYuzen } from "../../../components/secim/yuzen";
import { Ikon } from "../../../components/ikon/Ikon";
import stil from "./SayChat.module.css";

interface Props {
  /** tuşta yazan */
  ad: string;
  ikon: string;
  /** tuşun görünümü (SayChat.module.css .birincil / .ikincil / .ekle) */
  sinif: string;
  id?: string;
  /** erişilebilir ad, tuşta yazandan farklıysa ("+ ek" → "Ekipman fotoğrafı ekle") */
  etiket?: string;
  /** galeriden birden çok fotoğraf seçilebilir */
  coklu?: boolean;
  sec: (dosyalar: File[]) => void;
}

/** menü yalnız açıkken çizilir (üst katmana açılırken yerleşir; aynı anda tek menü) */
function Menu({ id, coklu, degisti }: { id: string; coklu: boolean; degisti: (e: ChangeEvent<HTMLInputElement>) => void }) {
  const kap = useRef<HTMLDivElement>(null);
  useYuzen(kap, { genislik: "dogal", enAzGenislik: 220, enCokYukseklik: 200 });
  return (
    <div className={stil.fotoMenu} id={id} ref={kap} popover="manual">
      <label className={stil.fotoOge}><input className={stil.gizli} type="file" accept="image/*" capture="environment" onChange={degisti} />
        <Ikon ad="camera" kucuk />Fotoğraf çek</label>
      <label className={stil.fotoOge}><input className={stil.gizli} type="file" accept="image/*" multiple={coklu} onChange={degisti} />
        <Ikon ad="image" kucuk />Galeriden / bilgisayardan seç</label>
    </div>
  );
}

export function FotoTusu({ ad, ikon, sinif, id, etiket, coklu = false, sec }: Props) {
  const [acik, setAcik] = useState(false);
  const kok = useRef<HTMLSpanElement>(null), tus = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  /* dışarı tıklanınca kapanır (menü DOM'da tuşun yanında: içindeki tıklama dışarı sayılmaz) */
  useEffect(() => {
    if (!acik) return;
    const d = (e: MouseEvent) => { if (!(e.target instanceof Node && kok.current?.contains(e.target))) setAcik(false); };
    document.addEventListener("click", d);
    return () => document.removeEventListener("click", d);
  }, [acik]);
  const degisti = (e: ChangeEvent<HTMLInputElement>) => {
    const l = [...(e.target.files ?? [])];
    e.target.value = "";
    setAcik(false);
    /* menü kapanınca odak tuşa (yeni pencere açılırsa odağı o alır, kapanınca buraya döndürür) */
    requestAnimationFrame(() => tus.current?.focus());
    if (l.length) sec(l);
  };
  return (
    <span className={stil.fotoKap} ref={kok}
      onKeyDown={(e) => { if (e.key === "Escape" && acik) { e.stopPropagation(); setAcik(false); tus.current?.focus(); } }}>
      <button ref={tus} id={id} className={sinif} type="button" aria-label={etiket} aria-haspopup="true" aria-expanded={acik}
        aria-controls={acik ? menuId : undefined} onClick={() => setAcik((a) => !a)}>
        <Ikon ad={ikon} kucuk /><span>{ad}</span>
      </button>
      {acik && <Menu id={menuId} coklu={coklu} degisti={degisti} />}
    </span>
  );
}
