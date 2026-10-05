"use client";
/* GRAFİK — TEK ÜRETİCİ: DİKEY SÜTUNLAR (maket maket-performans.js grafik / grafikKur, maket.css .a-grafik / .a-sutun-*; 2026-09-28 T9, reisim:
   "sütun grafikleri yatay olmasın ve boşluklu olmasın"). Sütunlar yuvasını doldurur (aralarında 2 px), taban çizgisine oturur, üst ucu 4 px
   yuvarlak; yığında parçalar arası 2 px. Izgara silik (0 · yarı · üst). Değer: az sütunda (≤ 6) her sütunun üstünde, çokta yalnız en yüksekte;
   hepsi üzerine gelince ipucunda ve gizli tabloda (ekran okuyucu). Etiket sütunun ortasına ölçülerek yerleşir; komşusuyla çakışan gizlenir,
   uçtaki kartın içine çekilir. Dış kütüphane yok; renk yalnız var olan değişkenlerden (seri kimliği: m / k onay, e vurgu-2, h hata). */
import { useLayoutEffect, useRef, type ReactNode } from "react";
import stil from "./Grafik.module.css";

export type Seri = "m" | "e" | "k" | "h";
export interface GrafikSatiri { etiket: string; tam?: string; parcalar: [Seri, number][]; deger: string; alt?: string }
export interface GrafikOzellik {
  baslik: string; ilkSutun: string; seriler: [Seri, string][]; satirlar: GrafikSatiri[];
  /** ölçek üstü (verilmezse yuvarlak sayı) */ ust?: number;
  /** tam sayılı veri (rapor sayısı) */ tam?: boolean;
  onEk?: string; birim?: string; bos?: string;
}
const SERI: Record<Seri, string> = { m: stil.seriM, k: stil.seriK, e: stil.seriE, h: stil.seriH };

/** ölçeğin üstü: yuvarlak sayı (1 · 2 · 2,5 · 5 × 10ⁿ); tam sayılı veride orta çizgi de tam sayı olur */
export function yuvarla(v: number, tam = false): number {
  if (v <= 0) return tam ? 2 : 1;
  const u = 10 ** Math.floor(Math.log10(v)), k = v / u;
  const adim = tam ? (u < 10 ? [2, 4, 6, 8, 10] : [1, 2, 3, 4, 5, 6, 8, 10]) : [1, 2, 2.5, 5, 10];
  return adim.find((a) => a >= k - 1e-9)! * u;
}
export const sayiKisa = (n: number) => (n >= 1e6 ? `${(n / 1e6).toLocaleString("tr-TR", { maximumFractionDigits: 1 })} mn`
  : n >= 1e4 ? `${Math.round(n / 1e3).toLocaleString("tr-TR")} bin` : n.toLocaleString("tr-TR", { maximumFractionDigits: 1 }));

export function Grafik(o: GrafikOzellik) {
  const cizim = useRef<HTMLDivElement>(null);
  const toplam = (s: GrafikSatiri) => s.parcalar.reduce((t, p) => t + p[1], 0);
  const enYuksek = Math.max(0, ...o.satirlar.map(toplam)), ust = o.ust ?? yuvarla(enYuksek, o.tam);
  const n = o.satirlar.length, hepsi = n <= 6, on = o.onEk ?? "", birim = o.birim ?? "";
  /* etiket yerleşimi: her etiket kendi sütununun ortasında; öncekiyle çakışan gizlenir; ipucu sütunun iç tarafına açılır */
  useLayoutEffect(() => {
    const c = cizim.current;
    if (!c) return;
    const kur = () => {
      const et = c.querySelector<HTMLElement>(`.${stil.etiketler}`), sut = c.querySelectorAll<HTMLElement>(`.${stil.sutun}`);
      if (!et) return;
      const kb = et.getBoundingClientRect();
      let son = -Infinity;
      [...et.children].forEach((x, i) => {
        const e = x as HTMLElement, r = sut[i]?.getBoundingClientRect();
        if (!r) return;
        e.classList.remove(stil.seyrek);
        const w = e.getBoundingClientRect().width, sol = Math.max(0, Math.min(kb.width - w, r.left + r.width / 2 - kb.left - w / 2));
        e.style.left = `${sol.toFixed(1)}px`;
        if (sol < son + 6) e.classList.add(stil.seyrek); else son = sol + w;
      });
      sut.forEach((x, i) => x.classList.toggle(stil.sag, i >= sut.length / 2));
    };
    kur();
    const g = new ResizeObserver(kur);
    g.observe(c);
    return () => g.disconnect();
  }, [o.satirlar]);
  return (
    <figure className={stil.grafik}>
      <div className={stil.bas}>
        <figcaption className={stil.baslik}>{o.baslik}</figcaption>
        {o.seriler.length > 1 && <ul className={stil.lejant}>{o.seriler.map(([k, ad]) => <li key={k}><span className={`${stil.renk} ${SERI[k]}`} />{ad}</li>)}</ul>}
      </div>
      {n ? (
        <div className={stil.cizim} ref={cizim} aria-hidden="true">
          <div className={stil.eksen}>
            <span style={{ bottom: "100%" }}>{on}{sayiKisa(ust)}{birim}</span><span style={{ bottom: "50%" }}>{on}{sayiKisa(ust / 2)}{birim}</span><span style={{ bottom: 0 }}>0</span>
          </div>
          <div className={stil.alan}>
            {o.satirlar.map((s, i) => {
              const t = toplam(s), yaz = t > 0 && (hepsi || t === enYuksek);
              return (
                <div key={i} className={stil.sutun}>
                  <span className={stil.yigin} style={{ height: `${Math.min(100, (t * 100) / ust).toFixed(2)}%` }}>
                    {yaz && <span className={stil.deger}>{on}{sayiKisa(t)}{birim}</span>}
                    {s.parcalar.filter((p) => p[1] > 0).map(([k, v]) => <span key={k} className={SERI[k]} style={{ flexGrow: v }} />)}
                  </span>
                  <span className={stil.ipucu}><b>{s.tam ?? s.etiket}</b>{s.deger}{s.alt && <><br />{s.alt}</>}
                    {o.seriler.length > 1 && <><br />{o.seriler.map(([k, ad]) => `${ad} ${s.parcalar.find((p) => p[0] === k)?.[1] ?? 0}`).join(" · ")}</>}</span>
                </div>
              );
            })}
          </div>
          <div className={stil.etiketler}>{o.satirlar.map((s, i) => <span key={i}>{s.etiket}</span>)}</div>
        </div>
      ) : <p className={stil.bos}>{o.bos ?? "Bu dönemde rapor yok."}</p>}
      <div className="gizli">
        <table>
          <caption>{o.baslik}</caption>
          <thead><tr><th scope="col">{o.ilkSutun}</th><th scope="col">Değer</th></tr></thead>
          <tbody>{o.satirlar.map((s, i) => <tr key={i}><th scope="row">{s.tam ?? s.etiket}</th><td>{s.deger}{s.alt ? ` · ${s.alt}` : ""}</td></tr>)}</tbody>
        </table>
      </div>
    </figure>
  );
}

/** grafik ızgarası (iki sütun; dar ekranda tek) */
export function Grafikler({ children }: { children: ReactNode }) {
  return <div className={stil.grafikler}>{children}</div>;
}
