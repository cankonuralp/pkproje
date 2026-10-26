"use client";
/* KIRPMA ZİNCİRİ + TIKLAYINCA TAMAMI (kalıp 4; 2026-10-26, reisim: "uzun cümlelerde … olsun tıklayınca açılsın dedim çünkü sıkıştırırken çok bozuyorsun
   ekranı"; maket onaylı): tek satır + "…". Metin gerçekten kısalmışsa (ölçülür) metne basınca / dokununca (klavyede Enter, Boşluk) altında tam metin
   balonu açılır — üst katmanda (secim/yuzen.ts): sayfayı itmez, kayan kap kesmez, ekran kenarından taşmaz; dışarı basınca, Esc ile ya da aynı metne
   yeniden basınca kapanır. Sığan metin bir şey değiştirmez. Bağlantı / tuş içindeki metin tıklamayı onlara bırakır (tam metin title'da kalır); tıklanır
   liste satırı kırpık metne basılınca satıra girmez (Liste.tsx satiraGir [data-kirpik]).
   YALNIZ EKRAN: rapor belgesi (src/belge) ve PDF bu bileşeni kullanmaz. */
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useYuzen } from "../secim/yuzen";
import stil from "./Liste.module.css";

function Balon({ children, kimlik }: { children: ReactNode; kimlik: string }) {
  const k = useRef<HTMLSpanElement>(null);
  useYuzen(k, { genislik: "dogal", enAzGenislik: 220, enCokYukseklik: 320 });
  return <span ref={k} id={kimlik} className={stil.balon} popover="manual" role="tooltip">{children}</span>;
}

export function Kirp({ children, baslik }: { children: ReactNode; baslik?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const kimlik = useId();
  const [tiklanir, setTiklanir] = useState(false);
  const [acik, setAcik] = useState(false);
  /* metin kısaldı mı: boyut değişince (pencere, sütun, yazı) yeniden ölçülür; bağlantı / tuş içindeyse tıklama onlarındır */
  useEffect(() => {
    const e = ref.current;
    if (!e) return;
    const ici = !!e.closest("a, button");
    const olc = () => setTiklanir(!ici && e.scrollWidth > e.clientWidth + 1);
    olc();
    const g = typeof ResizeObserver === "function" ? new ResizeObserver(olc) : null;
    g?.observe(e);
    return () => g?.disconnect();
  }, [children]);
  /* açıkken: dışarı basınca ve Esc kapatır (Esc yalnız balonu — açık pencereyi değil) */
  useEffect(() => {
    if (!acik) return;
    const disari = (ev: Event) => { if (!(ev.target instanceof Node && ref.current?.contains(ev.target))) setAcik(false); };
    const esc = (ev: KeyboardEvent) => { if (ev.key === "Escape") { ev.stopPropagation(); setAcik(false); ref.current?.focus({ preventScroll: true }); } };
    document.addEventListener("pointerdown", disari, true);
    document.addEventListener("keydown", esc, true);
    return () => { document.removeEventListener("pointerdown", disari, true); document.removeEventListener("keydown", esc, true); };
  }, [acik]);
  const ac = () => setAcik((a) => !a);
  const baslikMetni = baslik ?? (typeof children === "string" ? children : undefined);
  if (!tiklanir) return <span ref={ref} className={stil.kirp} title={baslikMetni}>{children}</span>;
  return (
    <span ref={ref} className={`${stil.kirp} ${stil.kirpik}`} data-kirpik="" role="button" tabIndex={0} aria-expanded={acik} aria-controls={acik ? kimlik : undefined}
      onClick={(e) => { e.stopPropagation(); if (!(e.target instanceof Element && e.target.closest("[role=tooltip]"))) ac(); }}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); ac(); } }}>
      {children}
      {acik && <Balon kimlik={kimlik}>{children}</Balon>}
    </span>
  );
}
