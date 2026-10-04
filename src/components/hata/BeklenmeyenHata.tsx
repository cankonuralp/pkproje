"use client";
/* BEKLENMEYEN HATA ekranı (K1 "hata sayfası"; maket hata.html'in yetkisiz / bulunamadı diliyle). Hatanın İÇERİĞİ gösterilmez (iç yapı, sorgu, yol
   sızmaz); yalnız yayında sunucunun verdiği kısa başvuru kodu — bildirilirse kayıtta bulunur. "Yeniden dene" aynı bölümü yeniden çizer. */
import { BosDurum } from "../bos/BosDurum";
import { Tus, TusBaglanti } from "../tus/Tus";
import stil from "./Hata.module.css";

export function BeklenmeyenHata({ kod, yeniden }: { kod?: string; yeniden: () => void }) {
  return (
    <BosDurum ikon="circle-alert" baslik="Bu sayfa açılamadı"
      metin={`Beklenmeyen bir sorun oldu; yaptığınız son işlem kaydedilmemiş olabilir. Yeniden deneyin; sürerse firma yöneticinize bildirin.${kod ? ` Başvuru kodu: ${kod.slice(0, 16)}` : ""}`}
      eylemTus={<div className={stil.tuslar}><Tus tur="birincil" ikon="rotate-ccw" onClick={yeniden}>Yeniden dene</Tus><TusBaglanti tur="ikincil" href="/" ikon="house">Ana sayfaya dön</TusBaglanti></div>} />
  );
}
