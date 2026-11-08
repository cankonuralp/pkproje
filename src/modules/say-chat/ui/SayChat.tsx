"use client";
/* S.A.Y CHAT — DÜĞME VE PANEL (2026-11-07 yeniden; sunum claude.ai 2PiEskE9jDqF5kSefutRBC — reisim: "Evet, önerilerle"). Her firma sayfasında
   (uygulama düzeni), S.A.Y düğmesinin solunda "S.A.Y Chat"; kişinin KENDİ sohbeti (plana bağlı değil). S.A.Y paneliyle aynı yerde: biri açılınca
   öteki kapanır. Panel küçülür (yalnız başlık), boyu sürüklenir (components/pencere/PanelBoyu), "En alta in"; tam sayfası /planlar/sohbet.
   Açılınca sohbet sunucudan gelir (bağlantı yoksa cihazda bekleyenler görünür). Düğmede cihazda bekleyen mesaj sayısı. */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { kuyrukAbone, kuyrukAnlik, kuyrukSunucuAnlik } from "../../../components/cevrimdisi/kuyruk";
import { Ikon } from "../../../components/ikon/Ikon";
import { useFabKonumu } from "../../../components/pencere/fabKonumu";
import { useGorunurAlan } from "../../../components/pencere/gorunurAlan";
import { usePanelBoyu } from "../../../components/pencere/PanelBoyu";
import { Sohbet } from "./Sohbet";
import stil from "./SayChat.module.css";

/** küçük hâl ve boy bu cihazda kalır */
const SC_KUCUK = "probata-saychat-kucuk", SC_BOY = "probata-saychat-boy";
export const SOHBET_YOLU = "/planlar/sohbet";

export function SayChat() {
  const yol = usePathname();
  const kuyruk = useSyncExternalStore(kuyrukAbone, kuyrukAnlik, kuyrukSunucuAnlik);
  const [acik, setAcik] = useState(false);
  const [kucuk, setKucuk] = useState(false);
  /* her açılışta sohbet yeniden yüklenir (Sohbet yeniden kurulur) */
  const [acilis, setAcilis] = useState(0);
  const panel = useRef<HTMLElement>(null), fab = useRef<HTMLButtonElement>(null);
  useGorunurAlan(panel, acik);
  const boyu = usePanelBoyu(panel, SC_BOY), boy = boyu.boy;
  const [asagi, setAsagi] = useState<{ alt: number } | null>(null);
  const bekleyen = kuyruk.isler.filter((x) => x.tur === "chat.mesaj" && x.durum === "bekliyor").length;
  const sayfada = yol === SOHBET_YOLU;

  const kucult = (k: boolean) => {
    setKucuk(k);
    try { localStorage.setItem(SC_KUCUK, k ? "1" : "0"); } catch { /* saklama yok */ }
  };
  const ac = () => {
    window.dispatchEvent(new CustomEvent("probata-panel", { detail: "saychat" }));
    setAcik(true); setAcilis((x) => x + 1); setAsagi(null);
    try { setKucuk(localStorage.getItem(SC_KUCUK) === "1"); } catch { /* saklama yok */ }
    boyu.oku();
    requestAnimationFrame(() => document.getElementById("sc-yazi")?.focus());
  };
  const kapat = () => { setAcik(false); requestAnimationFrame(() => fab.current?.focus()); };
  /* plan içi ve başka yerlerden açma isteği */
  useEffect(() => {
    const f = () => ac();
    window.addEventListener("probata-saychat-ac", f);
    return () => window.removeEventListener("probata-saychat-ac", f);
  });
  /* S.A.Y ile aynı yer: S.A.Y açılınca kapanır */
  useEffect(() => {
    const f = (e: Event) => { if ((e as CustomEvent<string>).detail === "say") setAcik(false); };
    window.addEventListener("probata-panel", f);
    return () => window.removeEventListener("probata-panel", f);
  }, []);
  /* panel açıkken sayfa panelin solunda (temel.css html[data-panel-acik]); küçük ya da kısaltılmışken sayfa görünür ve kayar */
  useEffect(() => {
    if (!acik || sayfada) return;
    const h = document.documentElement;
    h.setAttribute("data-panel-acik", "saychat");
    if (kucuk || boy !== null) h.setAttribute("data-panel-kucuk", "saychat");
    return () => {
      if (h.getAttribute("data-panel-acik") === "saychat") h.removeAttribute("data-panel-acik");
      if (h.getAttribute("data-panel-kucuk") === "saychat") h.removeAttribute("data-panel-kucuk");
    };
  }, [acik, kucuk, boy, sayfada]);
  /* sayfanın sonu düğmenin altında kalmasın (temel.css html[data-saychat]) */
  useEffect(() => {
    if (sayfada) return;
    document.documentElement.setAttribute("data-saychat", "var");
    return () => document.documentElement.removeAttribute("data-saychat");
  }, [sayfada]);
  /* gövde yukarı kaydırılınca "En alta in" */
  useEffect(() => {
    if (!acik || kucuk) return;
    const p = panel.current, g = p?.querySelector<HTMLElement>("[data-sc-govde]");
    if (!p || !g) return;
    const bak = () => {
      const alt = p.querySelector<HTMLElement>("[data-panel-alt]")?.offsetHeight ?? 0;
      setAsagi(g.scrollHeight - g.scrollTop - g.clientHeight < 32 ? null : { alt });
    };
    g.addEventListener("scroll", bak);
    return () => g.removeEventListener("scroll", bak);
  }, [acik, kucuk, acilis]);
  const enAlta = () => {
    const g = panel.current?.querySelector<HTMLElement>("[data-sc-govde]");
    if (g) g.scrollTop = g.scrollHeight;
    setAsagi(null);
  };
  const konum = useFabKonumu("[data-say-fab]", "say-panel");

  if (sayfada) return null;
  return (
    <>
      {!acik && (
        <button ref={fab} className={stil.fab} type="button" data-saychat-fab="" onClick={ac} aria-haspopup="dialog" aria-controls="sc-panel" aria-expanded={false}
          aria-label="S.A.Y Chat — kişisel sohbet" style={konum ? { right: konum.right, bottom: konum.bottom } : undefined}>
          <span className={stil.fabIkon}><Ikon ad="message-square-text" /></span>
          <span className={stil.fabYazi}>S.A.Y<small>Chat</small></span>
          {bekleyen > 0 && <span className={stil.fabSayi} aria-label={`${bekleyen} mesaj cihazda`}>{bekleyen}</span>}
        </button>
      )}
      {acik && (
        <aside ref={panel} className={stil.panel} id="sc-panel" role="dialog" aria-labelledby="sc-baslik" data-kucuk={kucuk || undefined}
          data-boy={!kucuk && boy !== null ? "" : undefined} style={!kucuk && boy !== null ? { height: `${boy}px` } : undefined}
          onKeyDown={(e) => { if (e.key === "Escape" && !document.querySelector("dialog[open]")) { e.stopPropagation(); kapat(); } }}>
          {!kucuk && boyu.tutamak("S.A.Y Chat'in")}
          <div className={kucuk ? stil.basP : `${stil.basP} ${boyu.basSinif}`} {...(kucuk ? {} : boyu.bas)}>
            <span className={stil.avatar}><Ikon ad="message-square-text" /></span>
            <div className={stil.kimlik}>
              <h2 id="sc-baslik">S.A.Y Chat</h2>
              <p className={stil.altYazi}>Kişisel sohbet</p>
            </div>
            <Link className={stil.basTus} href={SOHBET_YOLU} aria-label="Tam sayfada aç" title="Tam sayfada aç"><Ikon ad="maximize-2" /></Link>
            <button className={stil.basTus} id="sc-kucult" type="button" onClick={() => kucult(!kucuk)} aria-expanded={!kucuk}
              aria-label={kucuk ? "Büyüt" : "Küçült"} title={kucuk ? "Büyüt" : "Küçült"}><Ikon ad={kucuk ? "chevron-up" : "chevron-down"} /></button>
            <button className={stil.basTus} type="button" onClick={kapat} aria-label="S.A.Y Chat'i kapat"><Ikon ad="x" /></button>
          </div>
          {/* küçükken içerik saklanır (yazılan kaybolmaz) */}
          <div className={stil.icerik}><Sohbet key={acilis} ilk={null} panelde /></div>
          {asagi && !kucuk && (
            <button className={stil.enAlta} type="button" onClick={enAlta} aria-label="En alta in" title="En alta in" style={{ bottom: asagi.alt + 12 }}><Ikon ad="arrow-down" /></button>
          )}
        </aside>
      )}
    </>
  );
}
