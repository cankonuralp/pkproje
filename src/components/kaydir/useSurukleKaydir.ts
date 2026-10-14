"use client";
/* SÜRÜKLEYEREK YANA KAYDIRMA (548; sunum 546 — reisim 2026-10-14: "tabloyu kenara kaydıramıyorum"): yana kayan kap (ölçüm tablosu) fareyle tutulup
   sürüklenince kayar — tekerlek ve dokunma zaten kaydırır, kaydırma çubuğu ince. Yalnız fare; alan, tuş, bağlantı, seçim listesinde başlamaz (yazı
   seçimi ve tıklama bozulmaz); 4 px'ten kısa hareket tıklama sayılır. Sürüklerken kapta data-suruklen (imleç, seçim kapalı). */
import { useEffect, type RefObject } from "react";

const ETKILESIM = "input, textarea, select, button, a, label, [role=button], [role=listbox], [role=option], [contenteditable]";
const ESIK = 4;

export function useSurukleKaydir(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const kap = ref.current;
    if (!kap) return;
    let bas: { x: number; sol: number; kaydi: boolean } | null = null;
    const asagi = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0 || kap.scrollWidth <= kap.clientWidth) return;
      if ((e.target as Element | null)?.closest(ETKILESIM)) return;
      bas = { x: e.clientX, sol: kap.scrollLeft, kaydi: false };
    };
    const hareket = (e: PointerEvent) => {
      if (!bas) return;
      const dx = e.clientX - bas.x;
      if (!bas.kaydi && Math.abs(dx) < ESIK) return;
      bas.kaydi = true;
      kap.setAttribute("data-suruklen", "");
      kap.scrollLeft = bas.sol - dx;
    };
    const birak = () => {
      if (bas?.kaydi) kap.removeAttribute("data-suruklen");
      bas = null;
    };
    kap.addEventListener("pointerdown", asagi);
    window.addEventListener("pointermove", hareket);
    window.addEventListener("pointerup", birak);
    window.addEventListener("pointercancel", birak);
    return () => {
      kap.removeEventListener("pointerdown", asagi);
      window.removeEventListener("pointermove", hareket);
      window.removeEventListener("pointerup", birak);
      window.removeEventListener("pointercancel", birak);
    };
  }, [ref]);
}
