"use client";
/* ══ KABUK — yan menü + üst çubuk (maket 5. tur, reisim onaylı) ═══════════════════════════════════════════════
   · Menü MODUL_GRUPLARI'ndan (tek kaynak, src/modules/moduller.ts); 15 modül (2026-09-25: Kullanıcılar Personel'e katıldı; 2026-09-26: Ekipmanlar planın içinde), 6 grup, genel adlar.
   · Geniş (≥ 1280) menü sabit; orta ve dar (< 1280) ☰ çekmecesi (anayasa 2.11: ikon rayına dönüşmez).
   · Sığmayan yükseklikte YALNIZ menü kayar; logo yerinde kalır.
   · Tema: açık / koyu, tercih bu cihazda saklanır (anahtar maketle aynı: "probata-tema").
   · Daraltma (maket 6. tur, reisim 2026-09-24 "uygun"): geniş bantta üst çubuğun solundaki ☰ menüyü 64 px simge
     şeridine indirir / açar; ad görünmez (ekran okuyucu okur), üstüne gelince ipucu. Tercih bu cihazda ("probata-menu").
     Orta ve dar bantta etkisiz: orada ☰ çekmeceyi açar (anayasa 2.11). */
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { MODUL_GRUPLARI } from "../../modules/moduller";
import { KALIP } from "../../styles/kalip";
import { Ikon } from "../ikon/Ikon";
import stil from "./Kabuk.module.css";
import isaretKoyu from "./marka/probata-isaret-koyu-zemin.svg";
import isaretRenkli from "./marka/probata-isaret-renkli.svg";
import logoKoyu from "./marka/probata-yatay-koyu-zemin.svg";

const temizYol = (yol: string) => (yol.length > 1 ? yol.replace(/\/+$/, "") : yol);

/* tema <html data-tema>, daraltma <html data-menu="dar"> özniteliğidir (ilk boyamadan önce layout'taki betik kurar);
   tuşlar özniteliğe abone olur */
const kokOzelligineAbone = (ozellik: string) => (bildir: () => void) => {
  const gozcu = new MutationObserver(bildir);
  gozcu.observe(document.documentElement, { attributes: true, attributeFilter: [ozellik] });
  return () => gozcu.disconnect();
};
const temaAboneOl = kokOzelligineAbone("data-tema");
const temaOku = () => document.documentElement.getAttribute("data-tema");
const menuAboneOl = kokOzelligineAbone("data-menu");
const menuDarMi = () => document.documentElement.getAttribute("data-menu") === "dar";

/* geniş bant: daraltma yalnız burada görünür, ipucu da yalnız burada konur (orta/dar bantta çekmece adı zaten yazar) */
const GENIS_BANT = `(min-width: ${KALIP.bant.genis}px)`;
function bantAboneOl(bildir: () => void) {
  const sorgu = matchMedia(GENIS_BANT);
  sorgu.addEventListener("change", bildir);
  return () => sorgu.removeEventListener("change", bildir);
}
const genisBantMi = () => matchMedia(GENIS_BANT).matches;

function TemaTusu() {
  const koyu = useSyncExternalStore(temaAboneOl, temaOku, () => null) === "koyu";
  const degistir = () => {
    const yeni = koyu ? "acik" : "koyu";
    document.documentElement.setAttribute("data-tema", yeni);
    try { localStorage.setItem("probata-tema", yeni); } catch { /* tarayıcı saklamaya izin vermiyorsa tercih yalnız bu sayfada kalır */ }
  };
  return (
    <button className={stil.ikonTus} type="button" onClick={degistir} aria-label={koyu ? "Açık temaya geç" : "Koyu temaya geç"}>
      <Ikon ad={koyu ? "sun" : "moon"} />
    </button>
  );
}

export function Kabuk({ children }: { children: ReactNode }) {
  const [acik, setAcik] = useState(false);
  const dar = useSyncExternalStore(menuAboneOl, menuDarMi, () => false);
  const serit = useSyncExternalStore(bantAboneOl, genisBantMi, () => false) && dar;
  const yol = temizYol(usePathname() ?? "/");
  const daralt = () => {
    if (dar) document.documentElement.removeAttribute("data-menu");
    else document.documentElement.setAttribute("data-menu", "dar");
    try { localStorage.setItem("probata-menu", dar ? "genis" : "dar"); } catch { /* saklamaya izin yoksa tercih yalnız bu sayfada kalır */ }
  };
  // çekmece açıkken Esc kapatır
  useEffect(() => {
    if (!acik) return;
    const tus = (e: KeyboardEvent) => { if (e.key === "Escape") setAcik(false); };
    document.addEventListener("keydown", tus);
    return () => document.removeEventListener("keydown", tus);
  }, [acik]);

  return (
    <div className={acik ? `${stil.kabuk} ${stil.cekmeceAcik}` : stil.kabuk}>
      <aside className={stil.cubuk} id="ana-menu" aria-label="Ana menü">
        <div className={stil.cubukBas}>
          <Image className={stil.logo} src={logoKoyu} alt="probata" priority unoptimized />
          <Image className={stil.cubukIsaret} src={isaretKoyu} alt="probata" unoptimized />
          <button className={`${stil.ikonTus} ${stil.cubukKapat}`} type="button" onClick={() => setAcik(false)} aria-label="Menüyü kapat">
            <Ikon ad="x" />
          </button>
        </div>
        <nav className={stil.menu} aria-label="Modüller">
          {MODUL_GRUPLARI.map((g, i) => (
            <div key={g.grup}>
              <p className={stil.menuGrup} id={`menu-grup-${i}`}>{g.grup}</p>
              <ul className={stil.menuListe} aria-labelledby={`menu-grup-${i}`}>
                {g.moduller.map((m) => {
                  const hedef = "/" + m.yol;
                  return (
                    <li key={m.no}>
                      <Link className={stil.menuBaglanti} href={hedef} aria-current={yol === hedef ? "page" : undefined}
                        title={serit ? m.ad : undefined} onClick={() => setAcik(false)}>
                        <Ikon ad={m.ikon} />
                        <span className={stil.menuAd}>{m.ad}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
      <div className={stil.perde} onClick={() => setAcik(false)} aria-hidden="true" />
      <div className={stil.govde}>
        <header className={stil.ust}>
          <button className={`${stil.ikonTus} ${stil.menuTus}`} type="button" onClick={() => setAcik(true)}
            aria-label="Menüyü aç" aria-controls="ana-menu" aria-expanded={acik}>
            <Ikon ad="menu" />
          </button>
          <button className={`${stil.ikonTus} ${stil.daraltTus}`} type="button" onClick={daralt}
            aria-label={dar ? "Menüyü genişlet" : "Menüyü daralt"} aria-controls="ana-menu" aria-expanded={!dar}>
            <Ikon ad="menu" />
          </button>
          <Image className={`${stil.ustIsaret} ${stil.isaretAcik}`} src={isaretRenkli} alt="probata" unoptimized />
          <Image className={`${stil.ustIsaret} ${stil.isaretKoyu}`} src={isaretKoyu} alt="probata" unoptimized />
          <div className={stil.ustBosluk} />
          <TemaTusu />
        </header>
        <main className={stil.icerik}>{children}</main>
      </div>
    </div>
  );
}
