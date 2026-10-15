"use client";
/* PANEL BOYU (561; reisim 2026-10-15: "chati yukarıdan tutup aşağıya doğru küçültmeyi yapamadım") — yan panelin (S.A.Y, S.A.Y Chat) boyu TEK yerde:
   üst kenardaki tutamak ya da başlık çubuğu (tuşları dışında) fareyle / dokunarak aşağı sürüklenince panel kısalır, yukarı sürüklenince uzar; klavyede
   tutamakta ↑ uzatır, ↓ kısaltır (40 px), Home tam boy, End en kısa. En kısası tutamak + başlık + alttaki yazı yeri; en uzunu panelin tam boyu
   (CSS max-height — o boya varınca tam boya döner). 4 px'ten az kıpırdama sürükleme sayılmaz (başlığa basmak boyu değiştirmez). Boy bu cihazda
   kalır. 557'de S.A.Y Chat'te kurulan tutamak buraya taşındı (S.A.Y'da yoktu). Panelin parçaları işaretle bulunur: data-panel-bas (başlık),
   data-panel-alt (alttaki yazı yeri — birden çok görünümde biri görünür). */
import { useCallback, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactElement, type RefObject } from "react";
import stil from "./PanelBoyu.module.css";

/** sürükleme sayılan en az kıpırdama (px) */
const ESIK = 4;
/** klavyede bir basış (px) */
const ADIM = 40;

export interface PanelBoyu {
  /** kısaltılmış boy (px); null: tam boy */
  boy: number | null;
  /** boyu koyar (sınırlar içinde; tam boya varınca null) — kaydeder */
  koy: (h: number | null) => void;
  /** saklanan boyu okur (panel açılırken) */
  oku: () => void;
  /** başlık çubuğunun sınıfına eklenecek sınıf (sürükleme imleci, dokunmada kaydırma yok) */
  basSinif: string;
  /** başlık çubuğuna verilecek olaylar (tuşlara basmak sürükleme başlatmaz) */
  bas: { "data-panel-bas": ""; onPointerDown: (e: PointerEvent<HTMLElement>) => void; onPointerMove: (e: PointerEvent<HTMLElement>) => void;
    onPointerUp: () => void; onPointerCancel: () => void };
  /** tutamak düğmesi (sinif: panelin kendi görünümü — ör. S.A.Y'da başlığın üstünde) */
  tutamak: (ad: string, sinif?: string) => ReactElement;
}

export function usePanelBoyu(panel: RefObject<HTMLElement | null>, anahtar: string): PanelBoyu {
  const [boy, setBoy] = useState<number | null>(null);
  const surukle = useRef<{ y: number; h: number; basladi: boolean } | null>(null);
  const koy = (h: number | null) => {
    const p = panel.current;
    if (h !== null && p) {
      const yuk = (s: string) => [...p.querySelectorAll<HTMLElement>(s)].reduce((t, e) => t + e.offsetHeight, 0);
      const enKisa = yuk("[data-panel-tutamak]") + yuk("[data-panel-bas]") + yuk("[data-panel-alt]") + 2;
      const ust = parseFloat(getComputedStyle(p).maxHeight);
      const enUzun = Number.isFinite(ust) && ust > 0 ? ust : window.innerHeight - 16;
      h = Math.max(enKisa, Math.min(enUzun, Math.round(h)));
      if (h >= enUzun - 4) h = null;
    }
    setBoy(h);
    try { if (h === null) localStorage.removeItem(anahtar); else localStorage.setItem(anahtar, String(h)); } catch { /* saklama yok */ }
  };
  /* kararlı (etkide kullanılır) */
  const oku = useCallback(() => {
    try { const b = Number(localStorage.getItem(anahtar)); setBoy(b > 0 ? b : null); } catch { /* saklama yok */ }
  }, [anahtar]);
  const basla = (e: PointerEvent<HTMLElement>) => {
    if (e.button !== 0 || (e.target as Element).closest("button:not([data-panel-tutamak]), a, input, textarea, select")) return;
    surukle.current = { y: e.clientY, h: panel.current?.offsetHeight ?? 0, basladi: false };
    e.currentTarget.setPointerCapture(e.pointerId);
    e.preventDefault();
  };
  const hareket = (e: PointerEvent<HTMLElement>) => {
    const s = surukle.current;
    if (!s) return;
    const d = s.y - e.clientY;
    if (!s.basladi && Math.abs(d) < ESIK) return;
    s.basladi = true;
    koy(s.h + d);
  };
  const bitir = () => { surukle.current = null; };
  const tus = (e: KeyboardEvent<HTMLButtonElement>) => {
    const h = panel.current?.offsetHeight ?? 0;
    if (e.key === "ArrowUp") koy(h + ADIM); else if (e.key === "ArrowDown") koy(h - ADIM);
    else if (e.key === "Home") koy(null); else if (e.key === "End") koy(0); else return;
    e.preventDefault();
  };
  return {
    boy, koy, oku, basSinif: stil.bas,
    bas: { "data-panel-bas": "", onPointerDown: basla, onPointerMove: hareket, onPointerUp: bitir, onPointerCancel: bitir },
    tutamak: (ad, sinif) => (
      <button className={sinif ? `${stil.tutamak} ${sinif}` : stil.tutamak} type="button" data-panel-tutamak="" aria-label={`${ad} boyu: yukarı ok uzatır, aşağı ok kısaltır`}
        title="Sürükleyip boyu değiştirin" onPointerDown={basla} onPointerMove={hareket} onPointerUp={bitir} onPointerCancel={bitir} onKeyDown={tus} />
    ),
  };
}
