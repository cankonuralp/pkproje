"use client";
/* BELGE ÖNİZLEMESİ — tek üretici (2026-11-09; reisim: "telefonda pdf ön izlemesi ekrana sığmıyor, düzelt"): programın ürettiği belgenin (rapor, teklif,
   sözleşme …; PDF'le aynı çizici) ekrandaki kâğıdı KABA SIĞAR. Kap ölçülür, oran belge.css'teki --rb-olcek değişkenine yazılır (zoom: düzen de küçülür,
   kâğıdın altında boşluk kalmaz); kap değişince (telefon yatay / dikey, yan menü, pencere) yeniden hesaplanır. Betik çalışana kadar belge.css'in
   telefon başlangıç oranı geçerli. Yakınlaştırma tarayıcının kendi iki parmak hareketiyle. ⛔ "rb-onizleme" sınıfı yalnız burada (kilit:
   tests/belge-onizleme.test.ts). */
import { useLayoutEffect, useRef, type ReactNode } from "react";
import { belgeOlcegi } from "./olcek";

export function BelgeOnizleme({ etiket, etiketId, ek, children }: {
  /** ekran okuyucunun okuduğu ad ("Rapor belgesi önizlemesi") */
  etiket?: string;
  /** adı veren başlığın kimliği (etiket yerine) */
  etiketId?: string;
  /** kabın ek sınıfı */
  ek?: string;
  children: ReactNode;
}) {
  const kap = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const k = kap.current;
    if (!k) return;
    const ayarla = () => k.style.setProperty("--rb-olcek", String(belgeOlcegi(k.clientWidth)));
    ayarla();
    const g = new ResizeObserver(ayarla);
    g.observe(k);
    return () => g.disconnect();
  }, []);
  return (
    <div ref={kap} className={ek ? `rb-onizleme ${ek}` : "rb-onizleme"} role="region" aria-label={etiketId ? undefined : etiket} aria-labelledby={etiketId} tabIndex={0}>
      {children}
    </div>
  );
}
