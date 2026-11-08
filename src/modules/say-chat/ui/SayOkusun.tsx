"use client";
/* "S.A.Y OKUSUN" TUŞU (2026-11-08, K3 K4 — reisim: "say asistana oku demediği sürece okumaz ve sonuçta token gitmez"): sohbetteki ve Saha listesindeki TEK yapay zekâ işaretli tuş; üstünde
   tahmini tutar. Basınca S.A.Y Asistan açılır, komut gider (ayrıca onay yok). S.A.Y kapalı firmada (anahtar yok, kapalı) ve bağlantı yokken görünmez; okunacak mesaj yoksa da. */
import { useEffect, useState } from "react";
import { useUyar } from "../../../components/bildirim/Bildirim";
import { Ikon } from "../../../components/ikon/Ikon";
import { okuKomutu, tahminMetni } from "../saha";
import stil from "./SayChat.module.css";

export function SayOkusun({ plan, foto, diger, etiket = "S.A.Y okusun" }: { plan: string | null; foto: number; diger: number; etiket?: string }) {
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
  if (!hazir || foto + diger === 0) return null;
  const bas = () => {
    const olay = new CustomEvent("probata-say-komut", { detail: okuKomutu(plan), cancelable: true });
    window.dispatchEvent(olay);
    if (!olay.defaultPrevented) uyar("S.A.Y şu an açılamıyor.");
  };
  return (
    <button type="button" className={stil.okusun} onClick={bas} data-yapay-zeka="">
      <Ikon ad="sparkles" kucuk />{etiket} · {tahminMetni(foto, diger)}
    </button>
  );
}
