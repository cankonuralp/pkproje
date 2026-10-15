"use client";
/* kabuk dışındaki sayfalarda (giriş, geliştirme vitrini) beklenmeyen hata — 567: tarayıcıda çıkan hata kaydına da düşer (ağ hatası değilse) */
import { useEffect } from "react";
import { agHatasiMi, BeklenmeyenHata } from "../components/hata/BeklenmeyenHata";
import { hataBildir } from "../components/hata/bildir";
import stil from "./tek-sayfa.module.css";

export default function KokHata({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  /* sunucudan gelen hata (digest'li) sunucuda zaten kaydedildi (instrumentation.ts) — burada yalnız tarayıcıda çıkan */
  useEffect(() => { if (!agHatasiMi(error) && !error.digest) hataBildir(error, "sınır:kök"); }, [error]);
  return <main className={stil.tek}><BeklenmeyenHata kod={error.digest} yeniden={retry} ag={agHatasiMi(error)} /></main>;
}
