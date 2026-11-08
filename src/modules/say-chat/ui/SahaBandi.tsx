"use client";
/* S.A.Y CHAT — SAHA LİSTESİ BANDI VE SONUÇ KARTI (2026-11-08, K6; sunum claude.ai 4ApGDVAfUgvm8C5nTSRVbh sürüm 2). Bant: bugünkü plan (birden çoksa en yakın tarihli; "Değiştir" ile seçilir) →
   Saha listesi. Plan listesi cihazda da durur (bağlantısız açılınca bant görünür; liste sayfası önceden iner). Kart: son oluşturulan raporların özeti — kuyruktaki işlerden canlı (hazır /
   cihazda / yapılamayan). Kart ve seçim cihazda (localStorage): yalnız bu kişinin ekran kolaylığı, kayıt değil. */
import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { kuyrukAbone, kuyrukAnlik, kuyrukSunucuAnlik } from "../../../components/cevrimdisi/kuyruk";
import { Ikon } from "../../../components/ikon/Ikon";
import { bantPlani, type BantPlani } from "../saha";
import { istanbulGunu } from "../sema";
import { sahaPlanlariEylemi } from "./eylemler";
import stil from "./SayChat.module.css";

const PLANLAR = "probata-saha-planlar", SECILI = "probata-saha-plan", KART = "probata-saha-sonuc";
const oku = <T,>(a: string): T | null => { try { const s = localStorage.getItem(a); return s ? JSON.parse(s) as T : null; } catch { return null; } };
const yaz = (a: string, d: unknown) => { try { if (d === null) localStorage.removeItem(a); else localStorage.setItem(a, JSON.stringify(d)); } catch { /* saklama yok */ } };

export const sahaListesiYolu = (plan: string) => `/raporlar/saha/${plan}`;

/** kişinin planları ve seçili plan */
export function useSahaPlani() {
  const [planlar, setPlanlar] = useState<BantPlani[] | null>(null);
  const [secili, setSecili] = useState<string | null>(null);
  useEffect(() => {
    let canli = true;
    /* eslint-disable-next-line react-hooks/set-state-in-effect -- cihazdaki liste yalnız tarayıcıda okunur (sunucuyla aynı ilk çizim) */
    setPlanlar(oku<BantPlani[]>(PLANLAR)); setSecili(oku<string>(SECILI));
    sahaPlanlariEylemi().then((r) => { if (canli && r) { setPlanlar(r); yaz(PLANLAR, r); } }, () => { /* bağlantı yok: cihazdaki liste */ });
    return () => { canli = false; };
  }, []);
  const plan = useMemo(() => bantPlani(planlar ?? [], istanbulGunu(new Date().toISOString()), secili), [planlar, secili]);
  return { planlar: planlar ?? [], plan, sec: (id: string) => { setSecili(id); yaz(SECILI, id); } };
}

export function SahaBandi({ p }: { p: ReturnType<typeof useSahaPlani> }) {
  const [liste, setListe] = useState(false);
  if (!p.plan) return null;
  /* panelden geçilince panel kapanır (telefonda tam ekran sayfanın üstünde kalmasın) */
  const kapat = () => window.dispatchEvent(new CustomEvent("probata-saychat-kapat"));
  return (
    <div className={stil.bant}>
      <div className={stil.bantSatir}>
        <span className={stil.bantPlan}><b>{p.plan.no}</b> · {p.plan.kalan} ekipman</span>
        {p.planlar.length > 1 && <button type="button" className={stil.bantDegistir} aria-expanded={liste} onClick={() => setListe((x) => !x)}>Değiştir</button>}
        <Link className={stil.bantTus} href={sahaListesiYolu(p.plan.id)} onClick={kapat}>Saha listesi<Ikon ad="chevron-right" kucuk /></Link>
      </div>
      {liste && (
        <ul className={stil.bantListe} aria-label="Planlar">
          {p.planlar.map((x) => (
            <li key={x.id}>
              <button type="button" aria-current={x.id === p.plan?.id || undefined} onClick={() => { p.sec(x.id); setListe(false); }}>
                <b>{x.no}</b> · {x.tesis} · {x.kalan} ekipman
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ── sonuç kartı ── */
export interface SahaSonucKarti {
  plan: { id: string; no: string }; kayitlar: string[]; adet: number; zaman: string;
  uygunDegil: { kod: string; madde: string | null }[]; girilecek: string[]; isaretsiz: string[];
}
const dinleyen = new Set<() => void>();
let kart: SahaSonucKarti | null | undefined;
const kartAnlik = () => { if (kart === undefined) kart = oku<SahaSonucKarti>(KART); return kart; };
const kartAbone = (f: () => void) => { dinleyen.add(f); return () => { dinleyen.delete(f); }; };
export function sahaSonucYaz(k: SahaSonucKarti | null) {
  kart = k; yaz(KART, k);
  for (const f of dinleyen) f();
}
export const useSahaSonuc = () => useSyncExternalStore(kartAbone, kartAnlik, () => null);

export function SahaSonucu({ k }: { k: SahaSonucKarti }) {
  const kuyruk = useSyncExternalStore(kuyrukAbone, kuyrukAnlik, kuyrukSunucuAnlik);
  const isler = kuyruk.isler.filter((x) => x.tur === "rapor.saha" && k.kayitlar.includes(x.kayit));
  const bekleyen = isler.filter((x) => x.durum === "bekliyor").length, yapilamayan = isler.filter((x) => x.durum !== "bekliyor");
  const hazir = k.adet - isler.length;
  return (
    <section className={stil.sonuc} aria-label="Saha listesi sonucu">
      <div className={stil.sonucBas}>
        <p><b>{hazir} rapor hazır</b> (taslak, gönderilmedi){bekleyen > 0 ? ` · ${bekleyen} cihazda` : ""}</p>
        <button type="button" className={stil.sonucKapat} onClick={() => sahaSonucYaz(null)} aria-label="Özeti kapat"><Ikon ad="x" kucuk /></button>
      </div>
      <ul>
        {k.uygunDegil.length > 0 && <li><b>Uygun değil:</b> {k.uygunDegil.map((x) => (x.madde ? `${x.kod} ${x.madde}` : x.kod)).join(" · ")}</li>}
        {k.girilecek.length > 0 && <li><b>Raporda girilecek:</b> {k.girilecek.join(", ")}</li>}
        {k.isaretsiz.length > 0 && <li><b>İşaretsiz kaldı:</b> {k.isaretsiz.join(", ")}</li>}
        {yapilamayan.map((x) => <li key={x.id}><b>Yapılamayan:</b> {x.ad}{x.ileti ? `: ${x.ileti}` : ""}</li>)}
      </ul>
      <Link className={stil.sonucTus} href={`/planlar/${k.plan.id}`} onClick={() => window.dispatchEvent(new CustomEvent("probata-saychat-kapat"))}>Raporları aç</Link>
    </section>
  );
}
