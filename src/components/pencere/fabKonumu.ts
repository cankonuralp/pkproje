"use client";
/* YÜZEN ASİSTAN DÜĞMESİNİN YERİ — S.A.Y asistan ile S.A.Y Chat ortak (2026-10-25; reisim: "say chat neden gözükmüyor", "bu sefer de say chat say asistanı
   kapatıyor reisim küçülünce"). İki düğme de sağ altta; birinin paneli açık ya da küçültülmüşken öteki düğme panelin altında kalıyordu (panel z 70,
   düğme z 45). Kural: komşu düğme varsa onun solunda; yoksa komşunun açık paneli varsa panelin solunda, solunda yer yoksa (telefon) üstünde; ikisi de
   yoksa düğmenin kendi biçemi (sağ alt). Sayfa değişince (MutationObserver) ve pencere boyu değişince yeniden ölçülür. */
import { useEffect, useState } from "react";

export interface FabKonumu { right: number; bottom: number }

/** komsuDugme: solunda durulacak düğmenin seçicisi (yoksa yalnız panel); komsuPanel: komşunun panelinin kimliği */
export function useFabKonumu(komsuDugme: string | null, komsuPanel: string): FabKonumu | null {
  const [konum, setKonum] = useState<FabKonumu | null>(null);
  useEffect(() => {
    const olc = () => {
      const f = komsuDugme ? document.querySelector<HTMLElement>(komsuDugme) : null, p = f ? null : document.getElementById(komsuPanel);
      const s = f ?? p;
      if (!s) { setKonum(null); return; }
      const r = s.getBoundingClientRect(), yanda = !p || r.left >= 220;
      /* telefonda tam boy açık panel ekranı kaplar — üstünde yer yok, düğme kendi yerinde (panelin altında) kalır */
      if (!yanda && r.top < 120) { setKonum(null); return; }
      const right = Math.round(yanda ? window.innerWidth - r.left + 10 : window.innerWidth - r.right);
      const bottom = Math.round(yanda ? window.innerHeight - r.bottom : window.innerHeight - r.top + 10);
      /* aynı konumda durum değişmez (her DOM değişikliğinde yeniden çizilmesin) */
      setKonum((k) => (k && k.right === right && k.bottom === bottom ? k : { right, bottom }));
    };
    olc();
    const g = new MutationObserver(olc);
    g.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("resize", olc);
    return () => { g.disconnect(); window.removeEventListener("resize", olc); };
  }, [komsuDugme, komsuPanel]);
  return konum;
}
