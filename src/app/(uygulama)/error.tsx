"use client";
/* oturumlu sayfalarda beklenmeyen hata: kabuk (menü) yerinde kalır, içerik yerine hata ekranı */
import { agHatasiMi, BeklenmeyenHata } from "../../components/hata/BeklenmeyenHata";

export default function UygulamaHatasi({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <BeklenmeyenHata kod={error.digest} yeniden={retry} ag={agHatasiMi(error)} />;
}
