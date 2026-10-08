"use client";
/* BEKLENMEYEN HATA ekranı (K1 "hata sayfası"; maket hata.html'in yetkisiz / bulunamadı diliyle). Hatanın İÇERİĞİ gösterilmez (iç yapı, sorgu, yol
   sızmaz); yalnız yayında sunucunun verdiği kısa başvuru kodu — bildirilirse kayıtta bulunur. "Yeniden dene" aynı bölümü yeniden çizer.
   397 (çevrimdışı): bağlantı yoksa ya da hata ağdan geldiyse "Bağlantı yok" — işlem bağlantı gerektirir; raporda Kaydet / Onaya gönder ve daha önce
   açılan saha sayfaları bağlantısız çalışır (yol gösterir, "beklenmeyen sorun" diye korkutmaz). Bağlantı durumu canlı izlenir. */
import { useSyncExternalStore } from "react";
import { BosDurum } from "../bos/BosDurum";
import { Tus, TusBaglanti } from "../tus/Tus";
import stil from "./Hata.module.css";

const baglantiAbone = (f: () => void) => {
  window.addEventListener("online", f); window.addEventListener("offline", f);
  return () => { window.removeEventListener("online", f); window.removeEventListener("offline", f); };
};
const cevrimdisiMi = () => navigator.onLine === false;

/** `ag`: hata bir ağ hatası (istek sunucuya ulaşmadı) */
export function BeklenmeyenHata({ kod, yeniden, ag = false }: { kod?: string; yeniden: () => void; ag?: boolean }) {
  const cevrimdisi = useSyncExternalStore(baglantiAbone, cevrimdisiMi, () => false);
  if (cevrimdisi || ag) {
    return (
      <BosDurum ikon="wifi-off" baslik="Bağlantı yok"
        metin="Bu işlem internet bağlantısı gerektirir; bağlantı gelince yeniden deneyin. Raporda Kaydet ve Onaya gönder bağlantısız da çalışır (cihaza kaydedilir); daha önce açtığınız saha sayfaları bağlantısız açılır."
        eylemTus={<div className={stil.tuslar}><Tus tur="birincil" ikon="rotate-ccw" onClick={yeniden}>Yeniden dene</Tus><TusBaglanti tur="ikincil" href="/planlar" ikon="calendar-check">Planlar</TusBaglanti></div>} />
    );
  }
  return (
    <BosDurum ikon="circle-alert" baslik="Bu sayfa açılamadı"
      metin={`Beklenmeyen bir sorun oldu; yaptığınız son işlem kaydedilmemiş olabilir. Yeniden deneyin; sürerse firma yöneticinize bildirin.${kod ? ` Başvuru kodu: ${kod.slice(0, 16)}` : ""}`}
      eylemTus={<div className={stil.tuslar}><Tus tur="birincil" ikon="rotate-ccw" onClick={yeniden}>Yeniden dene</Tus><TusBaglanti tur="ikincil" href="/" ikon="house">Ana sayfaya dön</TusBaglanti></div>} />
  );
}

/** hata ağdan mı geldi (sunucu eylemi / istek bağlantısızken "Failed to fetch" gibi TypeError atar) */
export const agHatasiMi = (e: Error) => e.name === "TypeError" && /fetch|network|ağ/i.test(e.message);
