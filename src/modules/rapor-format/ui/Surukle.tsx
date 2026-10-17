"use client";
/* SÜRÜKLE-BIRAK TUTAMAĞI (İ6, 2026-10-17; sunum 595 madde 8 — "her öğede tutamak (sürükle)"; iş planı: "fareyle ve dokunmatikle SÜRÜKLENEREK
   taşınır; madde gruplar arasında; geri al / yinele ile"). İşaretçi olaylarıyla (fare, dokunma, kalem — HTML sürükle-bırakı dokunmada çalışmaz):
   tutamağa basılınca aynı listedeki öteki tutamakların satırları hedeftir; işaretçinin en yakın olduğu satırın önüne / arkasına (üst / alt yarı;
   yatay listede soluna / sağına) bırakılır — satırda çizgi gösterilir. Bırakınca birak çağrılır; taşımayı kâğıt bugünkü bir adımlık işlevlerle yapar
   (kurucu.ts ogeyeTasi / siraya). Klavye: tutamak odak almaz — aynı iş öğenin ↑ ↓ (← →) tuşlarıyla. Satır = tutamağın içinde olduğu öğe
   tuşlarının (ogeTus) kapsayıcısı. */
import { useRef, type PointerEvent } from "react";
import { Ikon } from "../../../components/ikon/Ikon";
import k from "./kagit.module.css";

export interface Birakma { liste: string; kaynak: number; kaynakId: string; hedef: number; hedefId: string; once: boolean }

/** tutamağın satırı: öğe tuşlarının kapsayıcısı (tutamak → ogeTus → satır) */
const satiri = (el: Element) => el.parentElement?.parentElement ?? el;
/** bırakma çizgisinin işareti (kagit.module.css): üst / alt (dikey liste), sol / sağ (yatay) */
const ISARETLER = ["data-surukle-ust", "data-surukle-alt", "data-surukle-sol", "data-surukle-sag"] as const;
const isaretle = (el: HTMLElement | undefined, ad: string | null) => { if (!el) return; for (const x of ISARETLER) el.removeAttribute(x); if (ad) el.setAttribute(ad, ""); };

export function SurukleTutamak({ liste, sira, id, ad, yatay = false, birak }: { liste: string; sira: number; id: string; ad: string; yatay?: boolean; birak: (b: Birakma) => void }) {
  const hedef = useRef<{ el: HTMLElement; sira: number; id: string; once: boolean } | null>(null);
  const kaynak = useRef<HTMLElement | null>(null);
  const temizle = () => {
    isaretle(hedef.current?.el, null);
    kaynak.current?.removeAttribute("data-surukleniyor");
    hedef.current = null; kaynak.current = null;
  };
  const indir = (e: PointerEvent<HTMLSpanElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    kaynak.current = satiri(e.currentTarget) as HTMLElement;
    kaynak.current.setAttribute("data-surukleniyor", "");
  };
  const kaydir = (e: PointerEvent<HTMLSpanElement>) => {
    if (!kaynak.current) return;
    /* aynı listenin tutamakları; işaretçiye en yakın satır (iki sütunlu bilgi tablosunda da) */
    let en: { el: HTMLElement; t: HTMLElement; d: number } | null = null;
    for (const t of document.querySelectorAll<HTMLElement>(`[data-surukle-liste="${CSS.escape(liste)}"]`)) {
      if (t === e.currentTarget) continue;
      const el = satiri(t) as HTMLElement, r = el.getBoundingClientRect();
      const dx = Math.max(r.left - e.clientX, 0, e.clientX - r.right), dy = Math.max(r.top - e.clientY, 0, e.clientY - r.bottom), d = dx * dx + dy * dy;
      if (!en || d < en.d) en = { el, t, d };
    }
    /* dikey listede satırın üst yarısı önü, alt yarısı arkası; yatayda sol / sağ yarı (tutamağın yatay yeri karar vermez — dar etiket hücresinde
       tuşlar hücrenin sol yarısına düşebilir; 2026-10-17 deneme makinesi bulgusu) */
    const once = (r: DOMRect) => (yatay ? e.clientX < r.left + r.width / 2 : e.clientY < r.top + r.height / 2);
    if (!en) return;
    const o = once(en.el.getBoundingClientRect());
    if (hedef.current?.el !== en.el) isaretle(hedef.current?.el, null);
    hedef.current = { el: en.el, sira: Number(en.t.dataset.surukleSira), id: en.t.dataset.surukleId ?? "", once: o };
    isaretle(en.el, yatay ? (o ? "data-surukle-sol" : "data-surukle-sag") : (o ? "data-surukle-ust" : "data-surukle-alt"));
  };
  const birakIs = () => {
    const h = hedef.current;
    temizle();
    if (h && Number.isInteger(h.sira) && h.id) birak({ liste, kaynak: sira, kaynakId: id, hedef: h.sira, hedefId: h.id, once: h.once });
  };
  return (
    <span className={k.surukle} data-surukle-liste={liste} data-surukle-sira={sira} data-surukle-id={id} title={`${ad} · sürükleyip taşıyın`} aria-hidden="true"
      onPointerDown={indir} onPointerMove={kaydir} onPointerUp={birakIs} onPointerCancel={temizle}><Ikon ad="grip-vertical" kucuk /></span>
  );
}
