"use client";
/* GÖRÜNEN ALAN (542; reisim 2026-10-14, iPhone ekran görüntüleriyle: "ekranda yazı yazmak için tıklayınca yaklaşıyor ve uzaklaşmam gerekiyor sürekli
   ekranda anlamsız yerlere kayıyorum"): telefonda tam ekran sabit panel (S.A.Y, S.A.Y Chat) klavye açılınca klavyenin altında kalıyor, tarayıcı
   sayfayı kaydırıyordu. Panel açıkken görünen alanın yüksekliği ve üstü (VisualViewport) panelin değişkenlerine yazılır: --vv-y, --vv-ust
   (CSS'te başlangıç değerleri panelin kuralında; telefon kuralı kullanır). VisualViewport yoksa CSS'teki başlangıç değerleri kalır. */
import { useEffect, type RefObject } from "react";

export function useGorunurAlan(ref: RefObject<HTMLElement | null>, acik: boolean) {
  useEffect(() => {
    const vv = typeof window !== "undefined" ? window.visualViewport : null;
    if (!acik || !vv) return;
    const olc = () => {
      const el = ref.current;
      if (!el) return;
      el.style.setProperty("--vv-y", `${Math.round(vv.height)}px`);
      el.style.setProperty("--vv-ust", `${Math.round(vv.offsetTop)}px`);
    };
    olc();
    vv.addEventListener("resize", olc); vv.addEventListener("scroll", olc);
    return () => { vv.removeEventListener("resize", olc); vv.removeEventListener("scroll", olc); };
  }, [ref, acik]);
}
