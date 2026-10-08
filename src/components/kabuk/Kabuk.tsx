"use client";
/* ══ KABUK — yan menü + üst çubuk (maket 5. tur, reisim onaylı) ═══════════════════════════════════════════════
   · Menü MODUL_GRUPLARI'ndan (tek kaynak, src/modules/moduller.ts); 15 modül (2026-09-25: Kullanıcılar Personel'e katıldı; 2026-09-26: Ekipmanlar planın içinde), 6 grup, genel adlar.
   · Geniş (≥ 1280) menü sabit; orta ve dar (< 1280) ☰ çekmecesi (anayasa 2.11: ikon rayına dönüşmez).
   · Sığmayan yükseklikte YALNIZ menü kayar; logo yerinde kalır.
   · Tema: açık / koyu, tercih bu cihazda saklanır (anahtar maketle aynı: "probata-tema").
   · Daraltma (maket 6. tur, reisim 2026-09-24 "uygun"): geniş bantta sol barın başındaki ☰ (2026-10-03; önce üst çubuktaydı) menüyü 64 px simge
     şeridine indirir / açar; ad görünmez (ekran okuyucu okur), üstüne gelince ipucu. Tercih bu cihazda ("probata-menu").
     Orta ve dar bantta etkisiz: orada ☰ çekmeceyi açar (anayasa 2.11).
   · K1 (2026-10-04): menüde yalnız kişinin görebildiği modüller (gorunur: sunucuda canDo ile hesaplanır — yapamayacağı yer çizilmez, anayasa 7.4;
     KAPI değildir, her sayfa sunucuda ayrıca denetler). Sağ üstte kullanıcı (baş harfler, ad, rol) ve menüsünde Çıkış yap (maket).
   · Takip balonları (339; maket takipHtml, T6): modül başına kırmızı (süresi geçen) / sarı (bekleyen, yaklaşan) sayı; 0 olan çizilmez; sayfa
     açılınca sunucudan istenir (çizimi bekletmez; sayılar yetkiye duyarlı — anasayfa/server/takip.ts). Daraltılmış şeritte yalnız en önemlisi. */
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { ANA_SAYFA, MODUL_GRUPLARI } from "../../modules/moduller";
import { KALIP } from "../../styles/kalip";
import { cikisEylemi } from "../../server/kimlik/eylemler";
import { CevrimdisiGosterge } from "../cevrimdisi/Cevrimdisi";
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

/** modül (§3.1 no) → balon; ad: ekran okuyucunun ve ipucunun okuduğu anlam */
export type KabukTakip = Record<number, { kirmizi: number; sari: number; ad: { kirmizi: string; sari: string } }>;
function Balonlar({ b }: { b: KabukTakip[number] | undefined }) {
  if (!b || (b.kirmizi <= 0 && b.sari <= 0)) return null;
  return (
    <span className={stil.takip}>
      <span className="gizli">: </span>
      {b.kirmizi > 0 && <span className={`${stil.balon} ${stil.balonKirmizi}`} title={`${b.kirmizi} ${b.ad.kirmizi}`}>{b.kirmizi}<span className="gizli"> {b.ad.kirmizi}</span></span>}
      {b.sari > 0 && <span className={`${stil.balon} ${stil.balonSari}`} title={`${b.sari} ${b.ad.sari}`}>{b.sari}<span className="gizli"> {b.ad.sari}</span></span>}
    </span>
  );
}

/** açık / koyu tema tuşu (kabukta ve giriş ekranında; 2026-10-04 reisim: "giriş ekranında gece modu ayarı tuşu yok") */
export function TemaTusu({ sinif }: { sinif?: string }) {
  const koyu = useSyncExternalStore(temaAboneOl, temaOku, () => null) === "koyu";
  const degistir = () => {
    const yeni = koyu ? "acik" : "koyu";
    document.documentElement.setAttribute("data-tema", yeni);
    try { localStorage.setItem("probata-tema", yeni); } catch { /* tarayıcı saklamaya izin vermiyorsa tercih yalnız bu sayfada kalır */ }
  };
  return (
    <button className={sinif ?? stil.ikonTus} type="button" onClick={degistir} aria-label={koyu ? "Açık temaya geç" : "Koyu temaya geç"}>
      <Ikon ad={koyu ? "sun" : "moon"} />
    </button>
  );
}

/** yazan (394): çevrimdışı kuyruğun "işi kim yazdı" etiketi — sunucudan, kimlik değil (server/islem/yazan.ts); yoksa gösterge çizilmez */
export interface KabukKullanicisi { ad: string; rol: string; yazan?: string }

/** baş harfler (en çok iki; Türkçe büyük harf) */
const basHarfler = (ad: string) => ad.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toLocaleUpperCase("tr")).join("");

/** kullanıcı menüsü (Çıkış yap): firma kabuğunda ve müşteri paneli kabuğunda (MusteriKabugu) aynı */
/** `cikis`: çıkış eylemi (verilmezse firma / müşteri çıkışı) ya da düz form isteğinin adresi (yönetim sayfası — 355: /yonetim/cikis, POST; sunucu
    eyleminin yönlendirmesi yönetim adresini kaybediyordu) */
export function KullaniciMenusu({ kullanici, cikis = cikisEylemi }: { kullanici: KabukKullanicisi; cikis?: (() => Promise<void>) | string }) {
  const [acik, setAcik] = useState(false);
  useEffect(() => {
    if (!acik) return;
    const kapat = (e: Event) => { if (!(e.target as Element).closest?.("[data-kullanici-menu]")) setAcik(false); };
    const tus = (e: KeyboardEvent) => { if (e.key === "Escape") setAcik(false); };
    document.addEventListener("pointerdown", kapat);
    document.addEventListener("keydown", tus);
    return () => { document.removeEventListener("pointerdown", kapat); document.removeEventListener("keydown", tus); };
  }, [acik]);
  return (
    <div className={stil.kullaniciKap} data-kullanici-menu="">
      <button className={stil.kullanici} type="button" aria-haspopup="menu" aria-expanded={acik} onClick={() => setAcik(!acik)}
        aria-label={`${kullanici.ad} · kendi işlemlerim`}>
        <span className={stil.avatar} aria-hidden="true">{basHarfler(kullanici.ad)}</span>
        <span className={stil.kullaniciYazi}><span className={stil.kullaniciAd}>{kullanici.ad}</span><span className={stil.kullaniciRol}>{kullanici.rol}</span></span>
      </button>
      {acik && (
        <div className={stil.kullaniciListe} role="menu" aria-label="Kendi işlemlerim">
          <form action={cikis} method={typeof cikis === "string" ? "post" : undefined}>
            <button className={stil.secenek} type="submit" role="menuitem"><Ikon ad="log-out" kucuk />Çıkış yap</button>
          </form>
        </div>
      )}
    </div>
  );
}

export function Kabuk({ children, kullanici, gorunur, takip }: {
  children: ReactNode;
  /** oturumdaki kişi (yoksa — geliştirme vitrini — kullanıcı alanı çizilmez) */
  kullanici?: KabukKullanicisi;
  /** görebildiği modüllerin §3.1 numaraları (verilmezse hepsi — yalnız vitrin / önizleme) */
  gorunur?: readonly number[];
  /** takip balonlarını getiren sunucu eylemi (verilmezse balon yok — vitrin) */
  takip?: () => Promise<KabukTakip>;
}) {
  const [acik, setAcik] = useState(false);
  const dar = useSyncExternalStore(menuAboneOl, menuDarMi, () => false);
  const serit = useSyncExternalStore(bantAboneOl, genisBantMi, () => false) && dar;
  const yol = temizYol(usePathname() ?? "/");
  const [balon, setBalon] = useState<KabukTakip>({});
  /* sayfa değişince (iş yapılmış olabilir) balonlar yeniden istenir; hata olursa eski sayılar kalır */
  useEffect(() => {
    if (!takip) return;
    let canli = true;
    takip().then((t) => { if (canli) setBalon(t); }, () => undefined);
    return () => { canli = false; };
  }, [takip, yol]);
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
          {/* 2026-10-03 (reisim: "şu 3 çizgiyi sol barın içine taşı"): geniş bantta daraltan ☰ sol barın başında (logonun sağı; daralınca
              şeridin tek simgesi). Orta ve dar bantta çekmeceyi açan ☰ üst çubukta kalır (menü kapalıyken başka yer yok). */}
          <button className={`${stil.ikonTus} ${stil.daraltTus}`} type="button" onClick={daralt}
            aria-label={dar ? "Menüyü genişlet" : "Menüyü daralt"} aria-controls="ana-menu" aria-expanded={!dar}>
            <Ikon ad="menu" />
          </button>
        </div>
        <nav className={stil.menu} aria-label="Modüller">
          {/* gruptan bağımsız Ana sayfa (maket M1) */}
          <ul className={stil.menuListe} aria-label={ANA_SAYFA.ad}>
            <li>
              <Link className={stil.menuBaglanti} href="/" aria-current={yol === "/" ? "page" : undefined}
                title={serit ? ANA_SAYFA.ad : undefined} onClick={() => setAcik(false)}>
                <Ikon ad={ANA_SAYFA.ikon} />
                <span className={stil.menuAd}>{ANA_SAYFA.ad}</span>
              </Link>
            </li>
          </ul>
          {MODUL_GRUPLARI.map((g) => ({ ...g, moduller: g.moduller.filter((m) => !gorunur || gorunur.includes(m.no)) }))
            .filter((g) => g.moduller.length > 0).map((g, i) => (
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
                        <Balonlar b={balon[m.no]} />
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
          {kullanici?.yazan && <CevrimdisiGosterge yazan={kullanici.yazan} />}
          <TemaTusu />
          {kullanici && <KullaniciMenusu kullanici={kullanici} />}
        </header>
        <main className={stil.icerik}>{children}</main>
      </div>
    </div>
  );
}
