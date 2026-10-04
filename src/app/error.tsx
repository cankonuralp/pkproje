"use client";
/* kabuk dışındaki sayfalarda (giriş, geliştirme vitrini) beklenmeyen hata */
import { BeklenmeyenHata } from "../components/hata/BeklenmeyenHata";
import stil from "./tek-sayfa.module.css";

export default function KokHata({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <main className={stil.tek}><BeklenmeyenHata kod={error.digest} yeniden={retry} /></main>;
}
