"use client";
/* KÜRESEL HATA DİNLEYİCİSİ (567; 06-HATA-TAKIBI "error ve unhandledrejection tek yerde dinlenir, ikisi de aynı kayıt yoluna") — kök düzende
   bir kez; çizim yok. */
import { useEffect } from "react";
import { hataBildir } from "./bildir";

export function HataDinleyici() {
  useEffect(() => {
    const hata = (e: ErrorEvent) => hataBildir(e.error ?? e.message, `pencere ${e.filename ?? ""}:${e.lineno ?? ""}`);
    const soz = (e: PromiseRejectionEvent) => hataBildir(e.reason, "söz");
    window.addEventListener("error", hata);
    window.addEventListener("unhandledrejection", soz);
    return () => { window.removeEventListener("error", hata); window.removeEventListener("unhandledrejection", soz); };
  }, []);
  return null;
}
