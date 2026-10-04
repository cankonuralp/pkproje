"use client";
/* BİLDİRİM — tek üretici (maket MK.bildir). Her kullanıcı eyleminin sonucu söylenir (anayasa 2.8: sessiz başarı yok); ekran
   okuyucu duyar (role=status, aria-live). Kullanım: const bildir = useBildir(); bildir("Kaydedildi."); 4 sn sonra kaybolur. */
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { Ikon } from "../ikon/Ikon";
import stil from "./Bildirim.module.css";

const SURE_MS = 4000;
const BildirimBag = createContext<(metin: string) => void>(() => {});

export function useBildir() {
  return useContext(BildirimBag);
}

export function BildirimSaglayici({ children }: { children: ReactNode }) {
  const [metin, setMetin] = useState("");
  const [gorunur, setGorunur] = useState(false);
  /* her bildirim yeni sayı: aynı metin art arda gelse de süre baştan başlar */
  const [sira, setSira] = useState(0);
  const bildir = useCallback((yeni: string) => { setMetin(yeni); setGorunur(true); setSira((s) => s + 1); }, []);
  /* 2026-10-04: zamanlayıcı görünür duruma bağlı etkide. Önceki hâli (ref'te zamanlayıcı + yalnız sökülürken temizleme) bileşen yeniden
     bağlandığında (geliştirmede Fast Refresh) zamanlayıcıyı silip "görünür"ü bırakıyordu → bildirim kaybolmuyordu (CI, tablet, a733ddb). */
  useEffect(() => {
    if (!gorunur) return;
    const t = setTimeout(() => setGorunur(false), SURE_MS);
    return () => clearTimeout(t);
  }, [gorunur, sira]);
  return (
    <BildirimBag.Provider value={bildir}>
      {children}
      <div className={gorunur ? `${stil.bildirim} ${stil.gorunur}` : stil.bildirim} role="status" aria-live="polite" data-bildirim="">
        <Ikon ad="circle-check" />
        <span>{metin}</span>
      </div>
    </BildirimBag.Provider>
  );
}
