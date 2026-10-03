"use client";
/* PENCERE — tek üretici (yerli <dialog>, kalıp 6: başlıkta X + Esc; telefonda alttan levha). Açık / kapalı dışarıdan (acik), kapanış
   tek yoldan bildirilir (onKapat: X, Esc, perdeye tıklama değil — yanlışlıkla kapanmasın). Odak açılınca ilk tuşa / alana. */
import { useEffect, useId, useRef, type ReactNode } from "react";
import { Ikon } from "../ikon/Ikon";
import stil from "./Pencere.module.css";

export function Pencere({ acik, baslik, onKapat, children, alt, genis = false, odak }:
  { acik: boolean; baslik: string; onKapat: () => void; children: ReactNode; alt?: ReactNode; genis?: boolean; odak?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const baslikId = useId();
  useEffect(() => {
    const d = ref.current; if (!d) return;
    if (acik && !d.open) {
      d.showModal();
      const hedef = (odak && d.querySelector<HTMLElement>(odak)) || d.querySelector<HTMLElement>("[data-ilk-odak]");
      hedef?.focus();
    } else if (!acik && d.open) d.close();
  }, [acik, odak]);
  return (
    <dialog ref={ref} className={genis ? `${stil.pencere} ${stil.genis}` : stil.pencere} aria-labelledby={baslikId}
      onCancel={(e) => { e.preventDefault(); onKapat(); }}>
      <div className={stil.bas}>
        <h2 id={baslikId}>{baslik}</h2>
        <button className={stil.kapat} type="button" onClick={onKapat} aria-label="Kapat"><Ikon ad="x" /></button>
      </div>
      <div className={stil.govde}>{children}</div>
      {alt && <div className={stil.alt}>{alt}</div>}
    </dialog>
  );
}

export const pencereMetinSinifi = stil.metin;
