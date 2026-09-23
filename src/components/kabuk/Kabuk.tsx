"use client";
/* ══ KABUK — yan menü + üst çubuk (maket 5. tur, reisim onaylı) ═══════════════════════════════════════════════
   · Menü MODUL_GRUPLARI'ndan (tek kaynak, src/modules/moduller.ts); 17 modül, 6 grup, genel adlar.
   · Geniş (≥ 1280) menü sabit; orta ve dar (< 1280) ☰ çekmecesi (anayasa 2.11: ikon rayına dönüşmez).
   · Sığmayan yükseklikte YALNIZ menü kayar; logo yerinde kalır.
   · Tema: açık / koyu, tercih bu cihazda saklanır (anahtar maketle aynı: "probata-tema"). */
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { MODUL_GRUPLARI } from "../../modules/moduller";
import { Ikon } from "../ikon/Ikon";
import stil from "./Kabuk.module.css";
import isaretKoyu from "./marka/probata-isaret-koyu-zemin.svg";
import isaretRenkli from "./marka/probata-isaret-renkli.svg";
import logoKoyu from "./marka/probata-yatay-koyu-zemin.svg";

const temizYol = (yol: string) => (yol.length > 1 ? yol.replace(/\/+$/, "") : yol);

/* tema, <html data-tema> özniteliğidir (ilk boyamadan önce layout'taki betik kurar); tuş ona abone olur */
function temaAboneOl(bildir: () => void) {
  const gozcu = new MutationObserver(bildir);
  gozcu.observe(document.documentElement, { attributes: true, attributeFilter: ["data-tema"] });
  return () => gozcu.disconnect();
}
const temaOku = () => document.documentElement.getAttribute("data-tema");

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
  const yol = temizYol(usePathname() ?? "/");
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
                      <Link className={stil.menuBaglanti} href={hedef} aria-current={yol === hedef ? "page" : undefined} onClick={() => setAcik(false)}>
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
