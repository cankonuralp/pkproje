"use client";
/* BİLDİRİM — tek üretici (maket MK.bildir). Her kullanıcı eyleminin sonucu söylenir (anayasa 2.8: sessiz başarı yok); ekran
   okuyucu duyar (role=status, aria-live). Kullanım: const bildir = useBildir(); bildir("Kaydedildi."); 4 sn sonra kaybolur. */
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
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
  const zaman = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bildir = useCallback((yeni: string) => {
    setMetin(yeni); setGorunur(true);
    if (zaman.current) clearTimeout(zaman.current);
    zaman.current = setTimeout(() => setGorunur(false), SURE_MS);
  }, []);
  useEffect(() => () => { if (zaman.current) clearTimeout(zaman.current); }, []);
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
