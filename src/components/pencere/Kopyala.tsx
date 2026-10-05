"use client";
/* KOPYALA (tek üretici; geçici parola pencereleri): sonuç PENCERENİN İÇİNDE söylenir — telefonda alttan levha sayfa bildirimini örter, modal
   açıkken pencere dışı duyurulmaz (319 incelemesi; anayasa 2.8 sessiz başarı yok). Pano reddedilirse metin seçilir, elle kopyalanır.
   tus: pencerenin alt tuşlarına · durum: pencere gövdesine (role=status). */
import { useState, type ReactNode } from "react";
import { Tus } from "../tus/Tus";
import { pencereMetinSinifi } from "./Pencere";

export function useKopyala(metin: string | null, hedefId: string): { tus: ReactNode; durum: ReactNode; sifirla: () => void } {
  const [s, setS] = useState<"tamam" | "hata" | null>(null);
  const kopyala = async () => {
    try { await navigator.clipboard.writeText(metin ?? ""); setS("tamam"); }
    catch {
      setS("hata");
      const p = document.getElementById(hedefId), sec = window.getSelection();
      if (p && sec) { const a = document.createRange(); a.selectNodeContents(p); sec.removeAllRanges(); sec.addRange(a); }
    }
  };
  return {
    tus: <Tus tur="ikincil" ikon={s === "tamam" ? "check" : undefined} onClick={() => void kopyala()}>{s === "tamam" ? "Kopyalandı" : "Kopyala"}</Tus>,
    durum: <p className={pencereMetinSinifi} role="status">{s === "tamam" ? "Panoya kopyalandı." : s === "hata" ? "Kopyalanamadı; metin seçildi, elle kopyalayın." : ""}</p>,
    sifirla: () => setS(null),
  };
}
