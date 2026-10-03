"use client";
/* ONAY PENCERESİ — tek üretici (maket MK.onayla, AA8: geri alınamayan / önemli her işlem önce sorulur). Kullanım:
   const onayla = useOnayla(); if (await onayla({ baslik, metin, tus: "Sil", tehlike: true })) …  Odak "Vazgeç"te (yanlışlıkla Enter silmez). */
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { Tus } from "../tus/Tus";
import { Pencere, pencereMetinSinifi } from "./Pencere";

export interface OnaySorusu { baslik: string; metin: ReactNode; tus?: string; tehlike?: boolean }
const OnayBag = createContext<(s: OnaySorusu) => Promise<boolean>>(async () => false);

export function useOnayla() {
  return useContext(OnayBag);
}

export function OnaySaglayici({ children }: { children: ReactNode }) {
  const [soru, setSoru] = useState<OnaySorusu | null>(null);
  const coz = useRef<((evet: boolean) => void) | null>(null);
  const onayla = useCallback((s: OnaySorusu) => new Promise<boolean>((r) => { coz.current = r; setSoru(s); }), []);
  const bitir = (evet: boolean) => { coz.current?.(evet); coz.current = null; setSoru(null); };
  return (
    <OnayBag.Provider value={onayla}>
      {children}
      <Pencere acik={!!soru} baslik={soru?.baslik ?? ""} onKapat={() => bitir(false)}
        alt={<>
          <Tus tur="ikincil" onClick={() => bitir(false)} data-ilk-odak="">Vazgeç</Tus>
          <Tus tur={soru?.tehlike ? "tehlike" : "birincil"} onClick={() => bitir(true)} data-onay-tamam="">{soru?.tus ?? "Tamam"}</Tus>
        </>}>
        <p className={pencereMetinSinifi}>{soru?.metin}</p>
      </Pencere>
    </OnayBag.Provider>
  );
}
