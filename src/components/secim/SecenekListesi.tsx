"use client";
/* SEÇENEK LİSTESİ — seçim alanının ve filtre seçicisinin açılır listesi (tek üretici; kalıp 19). 8'den fazla seçenekte arama kutusu
   (yazdıkça süzer, eşleşme yoksa söyler); klavye: ↑ ↓ Home End seçenekler arasında, Enter / boşluk seçer, Esc kapatır (odak tetikleyiciye
   döner), Tab kapatır, harfe basınca o harfle başlayan sonraki seçenek. Açılınca odak aramaya, yoksa seçili seçeneğe. Liste yalnız açıkken
   çizilir; 452: ÜST KATMANDA yüzer (yuzen.ts — alanın altı, sığmazsa üstü; sayfayı / pencereyi itmez, kesilmez). */
import { useEffect, useRef, useState } from "react";
import { useYuzen, type YuzenAyar } from "./yuzen";
import { Ikon } from "../ikon/Ikon";
import { tr } from "../liste/suzgec";
import { EN_COK_GORUNEN, gorunenSecenekler, type SecimSecenegi } from "./gorunen";
import stil from "./Secim.module.css";

export { EN_COK_GORUNEN, gorunenSecenekler, type SecimSecenegi };

export const UZUN_LISTE = 8;

export function SecenekListesi({ id, ad, secenekler, deger, sec, kapat, yuzen, sinif }: {
  id: string;
  ad: string;
  secenekler: readonly SecimSecenegi[];
  deger: string;
  sec: (v: string) => void;
  /** odakGeri: Esc ile kapandıysa odak tetikleyiciye döner */
  kapat: (odakGeri: boolean) => void;
  /** yüzen katmanın genişliği / hizası (süzgeç seçicisi: içerik kadar, sağa hizalı) */
  yuzen?: YuzenAyar;
  sinif?: string;
}) {
  const [ara, setAra] = useState("");
  const kap = useRef<HTMLDivElement>(null);
  useYuzen(kap, yuzen);
  const uzun = secenekler.length > UZUN_LISTE;
  const { liste: gorunen, kalan, hic } = gorunenSecenekler(secenekler, deger, ara);

  useEffect(() => {
    const k = kap.current; if (!k) return;
    (k.querySelector<HTMLElement>("[data-secim-ara]") ?? k.querySelector<HTMLElement>('[aria-selected="true"]') ?? k.querySelector<HTMLElement>('[role="option"]'))?.focus();
  }, []);

  const tuslar = () => Array.from(kap.current?.querySelectorAll<HTMLButtonElement>('[role="option"]') ?? []);
  const klavye = (e: React.KeyboardEvent) => {
    const l = tuslar(), i = l.indexOf(document.activeElement as HTMLButtonElement);
    const git = (n: number) => { e.preventDefault(); l[Math.max(0, Math.min(l.length - 1, n))]?.focus(); };
    switch (e.key) {
      case "ArrowDown": return git(i < 0 ? 0 : i + 1);
      case "ArrowUp": return git(i <= 0 ? 0 : i - 1);
      case "Home": if (i >= 0) git(0); return;
      case "End": if (i >= 0) git(l.length - 1); return;
      case "Escape": e.preventDefault(); e.stopPropagation(); kapat(true); return;
      case "Tab": kapat(false); return;
    }
    /* harfle atlama: arama kutusunda değilken, o harfle başlayan sonraki seçenek */
    if (i >= 0 && e.key.length === 1 && /\p{L}|\d/u.test(e.key)) {
      const h = tr(e.key), sira = [...l.slice(i + 1), ...l.slice(0, i + 1)];
      const hedef = sira.find((b) => tr(b.dataset.etiket ?? "").startsWith(h));
      if (hedef) { e.preventDefault(); hedef.focus(); }
    }
  };

  return (
    <div className={[stil.liste, sinif].filter(Boolean).join(" ")} id={id} role="listbox" aria-label={ad} ref={kap} onKeyDown={klavye} popover="manual">
      {uzun && <SecenekArama ad={ad} deger={ara} degistir={setAra} bos={hic} />}
      {gorunen.map((o) => <SecenekTusu key={o[0]} o={o} secili={o[0] === deger} sec={() => sec(o[0])} />)}
      <KalanNotu kalan={kalan} />
    </div>
  );
}

/** tek seçenek (listede ve telefon levhasının kayan listesinde aynı) */
export function SecenekTusu({ o, secili, sec }: { o: SecimSecenegi; secili: boolean; sec: () => void }) {
  return (
    <button className={stil.secenek} type="button" role="option" aria-selected={secili} data-deger={o[0]} data-etiket={o[1]} onClick={sec}>
      <Ikon ad="check" kucuk />
      <span className={stil.kirp} title={o[1]}>{o[1]}</span>
      {o[2] && <span className={stil.ek}>{o[2]}</span>}
    </button>
  );
}

/** çizilmeyen eşleşmeler (425): kaç seçenek daha var, aramayla daraltılır */
export function KalanNotu({ kalan }: { kalan: number }) {
  return kalan > 0 ? <p className={stil.yok} role="status">{kalan.toLocaleString("tr-TR")} seçenek daha — aramayla daraltın.</p> : null;
}

/** arama kutusu (listenin başında; levhada da) */
export function SecenekArama({ ad, deger, degistir, bos }: { ad: string; deger: string; degistir: (v: string) => void; bos: boolean }) {
  return (
    <>
      <input className={`${stil.girdi} ${stil.ara}`} type="search" data-secim-ara="" placeholder="Ara" aria-label={`${ad} içinde ara`} autoComplete="off"
        value={deger} onChange={(e) => degistir(e.target.value)} />
      {bos && <p className={stil.yok}>Bu adla seçenek yok.</p>}
    </>
  );
}

/** açık listeyi dışarı tıklanınca kapatır (kap dışı) */
export function useDisariTiklama(acik: boolean, kap: React.RefObject<HTMLElement | null>, kapat: () => void) {
  useEffect(() => {
    if (!acik) return;
    const dinle = (e: PointerEvent) => { if (!kap.current?.contains(e.target as Node)) kapat(); };
    document.addEventListener("pointerdown", dinle);
    return () => document.removeEventListener("pointerdown", dinle);
  }, [acik, kap, kapat]);
}
