"use client";
/* BİLDİRİM — tek üretici (maket MK.bildir). Her kullanıcı eyleminin sonucu söylenir (anayasa 2.8: sessiz başarı yok); ekran
   okuyucu duyar (role=status, aria-live). Kullanım: const bildir = useBildir(); bildir("Kaydedildi."); 4 sn sonra kaybolur.
   UYARI (2026-10-12, reisim: "onaya gönder diyince ekrana pop-up uyarı ekranı gelmesin. ilgili yere ekran kaysın zorunlu yerler doldurulmalıdır
   uyarısı kısa süreli ekranın üstünden belirsin bildirim gibi"): const uyar = useUyar(); uyar("…") — işlemi durduran kısa uyarı, pencere değil:
   üstte (üst çubuğun altında), uyarı renginde, 4 sn; ekran okuyucu hemen duyar (role=alert). Bildirimle ayrı yerde, biri ötekini silmez. */
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { Ikon } from "../ikon/Ikon";
import stil from "./Bildirim.module.css";

const SURE_MS = 4000;
const BildirimBag = createContext<(metin: string) => void>(() => {});
const UyariBag = createContext<(metin: string) => void>(() => {});

export function useBildir() {
  return useContext(BildirimBag);
}

export function useUyar() {
  return useContext(UyariBag);
}

/** kısa ileti: görünür olunca SURE_MS sonra kaybolur; her yeni ileti süreyi baştan başlatır (aynı metin art arda gelse de) */
function useKisaIleti() {
  const [metin, setMetin] = useState("");
  const [gorunur, setGorunur] = useState(false);
  const [sira, setSira] = useState(0);
  const goster = useCallback((yeni: string) => { setMetin(yeni); setGorunur(true); setSira((s) => s + 1); }, []);
  /* 2026-10-04: zamanlayıcı görünür duruma bağlı etkide. Önceki hâli (ref'te zamanlayıcı + yalnız sökülürken temizleme) bileşen yeniden
     bağlandığında (geliştirmede Fast Refresh) zamanlayıcıyı silip "görünür"ü bırakıyordu → bildirim kaybolmuyordu (CI, tablet, a733ddb). */
  useEffect(() => {
    if (!gorunur) return;
    const t = setTimeout(() => setGorunur(false), SURE_MS);
    return () => clearTimeout(t);
  }, [gorunur, sira]);
  return { metin, gorunur, goster };
}

export function BildirimSaglayici({ children }: { children: ReactNode }) {
  const b = useKisaIleti(), u = useKisaIleti();
  return (
    <BildirimBag.Provider value={b.goster}>
      <UyariBag.Provider value={u.goster}>
        {children}
        <div className={b.gorunur ? `${stil.bildirim} ${stil.gorunur}` : stil.bildirim} role="status" aria-live="polite" data-bildirim="">
          <Ikon ad="circle-check" />
          <span>{b.metin}</span>
        </div>
        <div className={u.gorunur ? `${stil.bildirim} ${stil.uyari} ${stil.gorunur}` : `${stil.bildirim} ${stil.uyari}`} role="alert" data-uyari="">
          <Ikon ad="circle-alert" />
          <span>{u.metin}</span>
        </div>
      </UyariBag.Provider>
    </BildirimBag.Provider>
  );
}
