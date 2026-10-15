"use client";
/* oturumlu sayfalarda beklenmeyen hata: kabuk (menü) yerinde kalır, içerik yerine hata ekranı — 567: tarayıcıda çıkan hata kaydına da düşer (ağ hatası değilse) */
import { useEffect } from "react";
import { agHatasiMi, BeklenmeyenHata } from "../../components/hata/BeklenmeyenHata";
import { hataBildir } from "../../components/hata/bildir";

export default function UygulamaHatasi({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  /* sunucudan gelen hata (digest'li) sunucuda zaten kaydedildi (instrumentation.ts) — burada yalnız tarayıcıda çıkan */
  useEffect(() => { if (!agHatasiMi(error) && !error.digest) hataBildir(error, "sınır:uygulama"); }, [error]);
  return <BeklenmeyenHata kod={error.digest} yeniden={retry} ag={agHatasiMi(error)} />;
}
