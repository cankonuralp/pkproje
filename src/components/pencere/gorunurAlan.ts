"use client";
/* GÖRÜNEN ALAN (542; reisim 2026-10-14, iPhone ekran görüntüleriyle: "ekranda yazı yazmak için tıklayınca yaklaşıyor ve uzaklaşmam gerekiyor sürekli
   ekranda anlamsız yerlere kayıyorum"): telefonda tam ekran sabit panel (S.A.Y, S.A.Y Chat) klavye açılınca klavyenin altında kalıyor, tarayıcı
   sayfayı kaydırıyordu. Panel açıkken görünen alanın yüksekliği ve üstü (VisualViewport) panelin değişkenlerine yazılır: --vv-y, --vv-ust
   (CSS'te başlangıç değerleri panelin kuralında; telefon kuralı kullanır). VisualViewport yoksa CSS'teki başlangıç değerleri kalır.
   547 (reisim 2026-10-14, iPhone ekran görüntüsü: panel klavyeden önce bitiyor, arada sayfa görünüyordu): klavyenin açılış hareketi bitmeden ölçülen
   boy kalıyordu — odak değişince ve hareketin sonunda (kısa gecikmeyle) yeniden ölçülür; klavye açıkken panelde data-klavye (S.A.Y Chat üst
   satırları tek satıra indirir). */
import { useEffect, type RefObject } from "react";

/** klavye açık sayılır: görünen alan pencerenin dörtte üçünden kısa (yalnız telefon genişliğinde anlamlı) */
const KLAVYE_ORANI = 0.75;

export function useGorunurAlan(ref: RefObject<HTMLElement | null>, acik: boolean) {
  useEffect(() => {
    const vv = typeof window !== "undefined" ? window.visualViewport : null;
    if (!acik || !vv) return;
    const kok = ref.current;
    const olc = () => {
      const el = ref.current;
      if (!el) return;
      el.style.setProperty("--vv-y", `${Math.round(vv.height)}px`);
      el.style.setProperty("--vv-ust", `${Math.round(vv.offsetTop)}px`);
      const klavye = window.innerWidth < 768 && vv.height < window.innerHeight * KLAVYE_ORANI;
      if (klavye) el.setAttribute("data-klavye", ""); else el.removeAttribute("data-klavye");
    };
    const zaman: number[] = [];
    /* odak değişince klavye açılır / kapanır: hareket boyunca ve sonunda yeniden ölç */
    const gecikmeli = () => { olc(); for (const ms of [120, 320, 600]) zaman.push(window.setTimeout(olc, ms)); };
    olc();
    vv.addEventListener("resize", olc); vv.addEventListener("scroll", olc);
    window.addEventListener("resize", olc);
    document.addEventListener("focusin", gecikmeli); document.addEventListener("focusout", gecikmeli);
    return () => {
      vv.removeEventListener("resize", olc); vv.removeEventListener("scroll", olc);
      window.removeEventListener("resize", olc);
      document.removeEventListener("focusin", gecikmeli); document.removeEventListener("focusout", gecikmeli);
      for (const z of zaman) window.clearTimeout(z);
      kok?.removeAttribute("data-klavye");
    };
  }, [ref, acik]);
}
