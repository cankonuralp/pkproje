"use client";
/* "S.A.Y OKUSUN" TUŞU (2026-11-08 — reisim: "say asistana oku demediği sürece okumaz"; "fiyat yazmasın"): sohbetteki tek yapay zekâ işaretli tuş. Basınca S.A.Y Asistan açılır, komut gider
   (ayrıca onay yok). S.A.Y kapalı firmada (anahtar yok, kapalı) ve bağlantı yokken görünmez; okunacak mesaj yoksa da. */
import { useEffect, useState } from "react";
import { useUyar } from "../../../components/bildirim/Bildirim";
import { Ikon } from "../../../components/ikon/Ikon";
import { okuKomutu } from "../plan";
import stil from "./SayChat.module.css";

export function SayOkusun({ plan, adet }: { plan: string | null; adet: number }) {
  const uyar = useUyar();
  /* SayAsistan açıkken html[data-say] koyar; bağlantı durumu tarayıcıda */
  const [hazir, setHazir] = useState(false);
  useEffect(() => {
    const bak = () => setHazir(document.documentElement.getAttribute("data-say") === "var" && navigator.onLine !== false);
    bak();
    const g = new MutationObserver(bak);
    g.observe(document.documentElement, { attributes: true, attributeFilter: ["data-say"] });
    window.addEventListener("online", bak); window.addEventListener("offline", bak);
    return () => { g.disconnect(); window.removeEventListener("online", bak); window.removeEventListener("offline", bak); };
  }, []);
  if (!hazir || adet === 0) return null;
  const bas = () => {
    const olay = new CustomEvent("probata-say-komut", { detail: okuKomutu(plan), cancelable: true });
    window.dispatchEvent(olay);
    if (!olay.defaultPrevented) uyar("S.A.Y şu an açılamıyor.");
  };
  return (
    <button type="button" className={stil.okusun} onClick={bas} data-yapay-zeka="">
      <Ikon ad="sparkles" kucuk />S.A.Y okusun
    </button>
  );
}
