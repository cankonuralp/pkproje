"use client";
/* LİSTE — tek üretici (kalıp 20: liste ↔ tablo). Aynı işaretleme: kap 600 px ve üstünde tablo (600–960 sıkışık), altında KART
   (kalip.ts kartEsigi — reisim 2026-09-26: "kart görünümü istemiyorum" tablette; kart yalnız telefonda). Maketteki MK.tablo ile aynı:
   sütunun kart rolü ust (sol üst) · rozet (sağ üst) · govde (tam satır, sira ile dizilir) · eylem (altta, çizgiyle).
   Sıralama tabloda sütun başlığından; kartta başlık yok, süzgeç satırındaki "Sıralama" seçicisi yapar (kip bildirilir).
   Tıklanır satır / kart: tuşa, bağlantıya, alana basılmadıysa kayda girer. */
import { useRouter } from "next/navigation";
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { KALIP } from "../../styles/kalip";
import { Ikon } from "../ikon/Ikon";
import stil from "./Liste.module.css";

export type KartRolu = "ust" | "rozet" | "govde" | "eylem";
export type ListeKipi = "tablo" | "kart";

export interface Sutun<K> {
  k: string;
  baslik: string;
  kart: KartRolu;
  /** kartta diziliş (küçük önce); verilmezse 5 */
  sira?: number;
  /** tablo kipinde sütun genişliği (ör. "12.5%") */
  genislik: string;
  /** 600–960 kapta (sıkışık tablo, tablet dikey) farklı genişlik — maketin sıkışık tablo oranı (414); verilmezse genislik */
  sikisik?: string;
  hucre: (kayit: K) => ReactNode;
  siralanmaz?: boolean;
  gizliBaslik?: boolean;
}

export interface ListeSiralama { deger: string; degistir: (sutun: string) => void }

export function Liste<K>({ baslik, sutunlar, kayitlar, anahtar, href, siralama, kipDegisti }: {
  /** tablonun erişilebilir adı (caption, gizli) */
  baslik: string;
  sutunlar: readonly Sutun<K>[];
  kayitlar: readonly K[];
  anahtar: (kayit: K) => string;
  /** satırın adresi; boş / undefined dönen satır bağlantı değildir (437: henüz yüklenmemiş hazır standart) */
  href?: (kayit: K) => string | undefined;
  siralama?: ListeSiralama;
  kipDegisti?: (kip: ListeKipi) => void;
}) {
  const router = useRouter();
  const kap = useRef<HTMLDivElement>(null);
  const odakSutun = useRef<string | null>(null);

  /* kip CSS'in kendi eşiğinden (kap genişliği) okunur; değişince bildirilir */
  useEffect(() => {
    const el = kap.current;
    if (!el || !kipDegisti) return;
    let son: ListeKipi | null = null;
    const gozcu = new ResizeObserver(([g]) => {
      const kip: ListeKipi = g.contentRect.width < KALIP.kartEsigi ? "kart" : "tablo";
      if (kip !== son) { son = kip; kipDegisti(kip); }
    });
    gozcu.observe(el);
    return () => gozcu.disconnect();
  }, [kipDegisti]);

  /* sıralama sonrası odak aynı başlıkta kalır (yeniden çizimde kaybolmasın) */
  useEffect(() => {
    if (!odakSutun.current) return;
    kap.current?.querySelector<HTMLButtonElement>(`[data-sirala="${odakSutun.current}"]`)?.focus();
    odakSutun.current = null;
  }, [siralama?.deger]);

  const satiraGir = (e: React.MouseEvent, adres: string) => {
    if ((e.target as HTMLElement).closest("a, button, label, input, select, textarea")) return;
    router.push(adres);
  };

  return (
    <div className={stil.kap} ref={kap}>
      <table className={stil.tablo}>
        <caption className="gizli">{baslik}</caption>
        <colgroup>{sutunlar.map((s) => <col key={s.k} style={{ "--g": s.genislik, "--gs": s.sikisik ?? s.genislik } as CSSProperties} />)}</colgroup>
        <thead>
          <tr>
            {sutunlar.map((s) => {
              if (s.gizliBaslik) return <th key={s.k} scope="col"><span className="gizli">{s.baslik}</span></th>;
              if (!siralama || s.siralanmaz) return <th key={s.k} scope="col">{s.baslik}</th>;
              const yon = siralama.deger === `${s.k}-artan` ? "ascending" : siralama.deger === `${s.k}-azalan` ? "descending" : undefined;
              return (
                <th key={s.k} scope="col" aria-sort={yon}>
                  <button className={stil.sirala} type="button" data-sirala={s.k}
                    onClick={() => { odakSutun.current = s.k; siralama.degistir(s.k); }}>
                    {s.baslik}
                    <Ikon ad={yon === "ascending" ? "arrow-up" : yon === "descending" ? "arrow-down" : "arrow-up-down"} kucuk />
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {kayitlar.map((r) => {
            const adres = href?.(r);
            return (
              <tr key={anahtar(r)} data-href={adres} onClick={adres ? (e) => satiraGir(e, adres) : undefined}>
                {sutunlar.map((s) => (
                  <td key={s.k} data-alan={s.k} data-kart={s.kart} style={s.sira === undefined ? undefined : ({ "--sira": s.sira } as React.CSSProperties)}>{s.hucre(r)}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** kartta görünen etiket (tabloda başlık zaten söyler): <KartEtiket>Konum</KartEtiket> */
export function KartEtiket({ children }: { children: ReactNode }) {
  return <span className={stil.kartEtiket}>{children}</span>;
}

/** kırpma zinciri (kalıp 4): tek satır + üç nokta, tam metin title'da */
export function Kirp({ children, baslik }: { children: ReactNode; baslik?: string }) {
  return <span className={stil.kirp} title={baslik ?? (typeof children === "string" ? children : undefined)}>{children}</span>;
}
