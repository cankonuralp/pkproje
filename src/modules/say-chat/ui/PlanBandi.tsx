"use client";
/* S.A.Y CHAT — ÜST BANT (2026-11-08; reisim: "yukarıdan plan değiştir", "geçmişi silme tuşu yok o da olsun"): kişinin planı (bugünkü; birden çoksa en yakın tarihli, kişi değiştirir) ve Geçmişi sil.
   Plan listesi cihazda da durur (bağlantısız açılınca bant görünür); seçim cihazda (localStorage): yalnız bu kişinin ekran kolaylığı, kayıt değil. */
import { useEffect, useMemo, useState } from "react";
import { Ikon } from "../../../components/ikon/Ikon";
import { bantPlani, type BantPlani } from "../plan";
import { istanbulGunu } from "../sema";
import { sahaPlanlariEylemi } from "./eylemler";
import stil from "./SayChat.module.css";

const PLANLAR = "probata-saha-planlar", SECILI = "probata-saha-plan";
const oku = <T,>(a: string): T | null => { try { const s = localStorage.getItem(a); return s ? JSON.parse(s) as T : null; } catch { return null; } };
const yaz = (a: string, d: unknown) => { try { localStorage.setItem(a, JSON.stringify(d)); } catch { /* saklama yok */ } };

/** Chat / Rapor modu (K6: panel en son kullanılan modda açılır; cihazda) */
export type SohbetModu = "chat" | "rapor";
const MOD = "probata-saychat-mod";
export function useSohbetModu(): [SohbetModu, (m: SohbetModu) => void] {
  const [mod, setMod] = useState<SohbetModu>("chat");
  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect -- cihazdaki seçim yalnız tarayıcıda okunur (sunucuyla aynı ilk çizim) */
    if (oku<string>(MOD) === "rapor") setMod("rapor");
  }, []);
  return [mod, (m) => { setMod(m); yaz(MOD, m); }];
}

/** kişinin planları ve seçili plan */
export function usePlanSecimi() {
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

export function PlanBandi({ p, mod, modSec, sil }: { p: ReturnType<typeof usePlanSecimi>; mod: SohbetModu; modSec: (m: SohbetModu) => void; sil: (() => void) | null }) {
  const [liste, setListe] = useState(false);
  const birden = p.planlar.length > 1;
  return (
    <div className={stil.bant}>
      <div className={stil.bantSatir}>
        <div className={stil.modSecim} role="group" aria-label="Mod">
          <button type="button" aria-pressed={mod === "chat"} onClick={() => modSec("chat")}>Chat</button>
          <button type="button" aria-pressed={mod === "rapor"} onClick={() => modSec("rapor")}>Rapor</button>
        </div>
        {sil && <button type="button" className={stil.bantSil} onClick={sil}><Ikon ad="trash-2" kucuk />Geçmişi sil</button>}
      </div>
      {p.plan && <div className={stil.bantSatir}>
        {p.plan && (birden
          ? <button type="button" className={stil.bantPlanTus} aria-expanded={liste} aria-label={`Plan: ${p.plan.no}. Planı değiştir`} onClick={() => setListe((x) => !x)}>
              <span className={stil.bantPlan}><b>{p.plan.no}</b> · {p.plan.tesis}</span><Ikon ad={liste ? "chevron-up" : "chevron-down"} kucuk /></button>
          : <span className={stil.bantPlan}><b>{p.plan.no}</b> · {p.plan.tesis}</span>)}
      </div>}
      {liste && (
        <ul className={stil.bantListe} aria-label="Planlar">
          {p.planlar.map((x) => (
            <li key={x.id}>
              <button type="button" aria-current={x.id === p.plan?.id || undefined} onClick={() => { p.sec(x.id); setListe(false); }}>
                <b>{x.no}</b> · {x.tesis}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
