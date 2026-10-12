"use client";
/* SAHA RAPORU · BÖLÜM BAŞLIĞINDAKİ TUŞ (2026-10-12; reisim, ekran görüntüsüyle: "o tuşun orada olmasını istiyorum, ekran daralınca logo olarak
   kalsın, aynı şekilde fotoğraflar bölümü için de ekipman bölümü içinde fotoğraf istenen yerlerde bu şekilde olsun"): bölümün fotoğraf tuşu
   ("Fotoğraf ekle (yapay zekâ okur)", Fotoğraflar bölümünün "Fotoğraf ekle") başlık satırında, aç / kapat tuşunun yanında; telefonda yalnız simge
   (raporlar.module.css .basTuslari). Tuşu çizen içerik bileşeni (FotoOkuma, AlanOkuma, FotoListesi) tuşu başlığa TAŞIR (portal): durumu (okunuyor,
   öneri kartı, odak) kendinde kalır, bölüm kapalıyken de görünür; fotoğraf seçilince bölüm açılır (okunan, eklenen görünsün). Bölümün dışında
   (madde fotoğrafı) tuş yerinde çizilir. Bloklar ile Doldurma birbirini içe aktarmasın diye ayrı dosya. */
import { createContext, useContext, type ReactNode } from "react";
import { createPortal } from "react-dom";

export interface BaslikYuvasi {
  /** başlık satırındaki yuva (RaporBolumu çizer; ilk çizimde henüz yok) */
  yuva: HTMLElement | null;
  /** bölüm kapalıysa açar */
  ac: () => void;
}
export const BaslikBaglami = createContext<BaslikYuvasi | null>(null);

/** çocuğu bölümün başlık satırına taşır; bölüm dışında yerinde çizer */
export function BaslikTusu({ children }: { children: ReactNode }) {
  const b = useContext(BaslikBaglami);
  if (!b) return <>{children}</>;
  return b.yuva ? createPortal(children, b.yuva) : null;
}

const bos = () => undefined;
/** başlıktaki tuş seçilince bölümü açar (bölüm dışında işlevsiz) */
export function useBolumAc(): () => void {
  return useContext(BaslikBaglami)?.ac ?? bos;
}
