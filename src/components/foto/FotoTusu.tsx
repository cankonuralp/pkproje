"use client";
/* FOTOĞRAF TUŞU — tek üretici. 527 (reisim 2026-10-13: "say chatte fotoğraf işaretine tıklayınca galeriden veya pc den de fotoğraf yükleyebilmek
   olsun") S.A.Y Chat'te doğdu; 531 (reisim 2026-10-13: "araçlar ve zimmetlerde de galeriden fotoğraf ekleme seçeneği ekle") ortak oldu: S.A.Y Chat,
   araç teslim tutanağı (açı başına), zimmet teslimi. Eskiden hepsi capture'lı tek girdiydi — telefonda yalnız kamera açılıyordu.
   Tuş → küçük menü: "Fotoğraf çek" (telefonda kamera açılır) · "Galeriden / bilgisayardan seç" (telefon galerisi ya da bilgisayardaki dosya; çoklu
   tuşta birden çok fotoğraf). S.A.Y ataç menüsünün düzeni (say.module.css .ekMenu). Menü üst katmanda yüzer (components/secim/yuzen.ts — pencerenin
   ya da panelin kenarında kesilmez, kayan gövdeyi itmez); dışarı tıklanınca ya da Esc ile kapanır (Esc pencereyi / paneli kapatmaz, odak tuşa
   döner); seçim yapılınca kapanır. Hangi fotoğrafın gireceği çağıranda (secim.ts — küçültme, tür, boy, yer). FotoKucuk: seçilen fotoğrafın küçük
   görüntüsü, × ile çıkar. */
import { useEffect, useId, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { Ikon } from "../ikon/Ikon";
import { useYuzen } from "../secim/yuzen";
import stil from "./foto.module.css";

interface Props {
  /** tuşta yazan */
  ad: string;
  ikon: string;
  /** tuşun görünümü (çağıranın sınıfı: tusSinifi("ikincil"), modülün tuşu …) */
  sinif: string;
  id?: string;
  /** erişilebilir ad, tuşta yazandan farklıysa ("+ ek" → "Ekipman fotoğrafı ekle") */
  etiket?: string;
  /** tuşu açıklayan mesajın kimliği (alanın uyarısı / hatası — aria-describedby) */
  tanim?: string;
  /** galeriden birden çok fotoğraf seçilebilir */
  coklu?: boolean;
  sec: (dosyalar: File[]) => void;
}

/** menü yalnız açıkken çizilir (üst katmana açılırken yerleşir; aynı anda tek menü) */
function Menu({ id, coklu, degisti }: { id: string; coklu: boolean; degisti: (e: ChangeEvent<HTMLInputElement>) => void }) {
  const kap = useRef<HTMLDivElement>(null);
  useYuzen(kap, { genislik: "dogal", enAzGenislik: 220, enCokYukseklik: 200 });
  return (
    <div className={stil.menu} id={id} ref={kap} popover="manual">
      <label className={stil.oge}><input className={stil.gizli} type="file" accept="image/*" capture="environment" onChange={degisti} />
        <Ikon ad="camera" kucuk />Fotoğraf çek</label>
      <label className={stil.oge}><input className={stil.gizli} type="file" accept="image/*" multiple={coklu} onChange={degisti} />
        <Ikon ad="image" kucuk />Galeriden / bilgisayardan seç</label>
    </div>
  );
}

export function FotoTusu({ ad, ikon, sinif, id, etiket, tanim, coklu = false, sec }: Props) {
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
    <span className={stil.kap} ref={kok}
      onKeyDown={(e) => { if (e.key === "Escape" && acik) { e.stopPropagation(); e.preventDefault(); setAcik(false); tus.current?.focus(); } }}>
      <button ref={tus} id={id} className={sinif} type="button" aria-label={etiket} aria-describedby={tanim} aria-haspopup="true" aria-expanded={acik}
        aria-controls={acik ? menuId : undefined} onClick={() => setAcik((a) => !a)}>
        <Ikon ad={ikon} kucuk /><span>{ad}</span>
      </button>
      {acik && <Menu id={menuId} coklu={coklu} degisti={degisti} />}
    </span>
  );
}

/** seçilen fotoğrafların listesi (FotoKucuk'lar) — ad: liste adı (ekran okuyucu) */
export function FotoKucukler({ ad, children }: { ad: string; children: ReactNode }) {
  return <ul className={stil.kucukler} aria-label={ad}>{children}</ul>;
}

/** seçilen (henüz gönderilmemiş) fotoğrafın küçük görüntüsü; × çıkarır */
export function FotoKucuk({ url, ad, cikar }: { url: string; ad: string; cikar: () => void }) {
  return (
    <li className={stil.kucuk} title={ad}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={ad} />
      <button className={stil.sil} type="button" onClick={cikar} aria-label={`${ad} kaldır`} title="Kaldır"><Ikon ad="x" kucuk /></button>
    </li>
  );
}
