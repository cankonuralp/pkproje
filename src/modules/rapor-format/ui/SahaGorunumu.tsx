"use client";
/* SAHA GÖRÜNÜMÜ (472–474; reisim 2026-10-10, maket kararları: k1 "evet" — saha ekranında da düzenleme · k2 "format" — madde cevabının biçimi
   format başına · k3 "kağıt açılsın kağıtta yapılan değişiklik saha ekranında saha ekranında yapılan değişiklik kağıtta etki etsin" · k4
   varsayılan aygıt tablet). Format kurucusunun (ve sürüm sayfasının) "Saha ekranı" görünümü: denetçinin tablette / telefonda göreceği GERÇEK
   saha ekranı, çerçevede (src/app/(cerceve)/…/saha — gerçek aygıt genişliğinde çizilir, sayfaya sığacak kadar küçültülür) örnek raporla.
   Taslak çerçeveye canlı gider (SahaCerceve.tsx iletileri); "Düzenle" kipinde saha ekranında yazılan ad / eklenen / çıkarılan / taşınan öğe
   kâğıda geçer. Araç çubuğu: aygıt (Tablet · Telefon) · kip (Düzenle · Denetçi gibi dene) · madde cevabı (Açılır liste · Yan yana tuşlar —
   formatın ayarı) · Denemeyi temizle. Yanda KULLANIM kutusu (maket): bu formatla bir rapor — bölüm, madde, yazılan / seçilen kutu, cevap
   dokunuşu açılır liste ↔ yan yana tuş; denemede canlı eksik / kusur sayısı. degis yoksa salt görünüm (sürüm sayfası): aygıt ve dene.
   Telefonda (maket: "telefonda kurucu yalnız önizler ve denetçi gibi deneyi açar") aygıt telefon, kip dene, kullanım kutusu yok.
   483 (reisim 2026-10-10: "rapor düzenlemede sadece saha ekranı gözüksün o ekranda düzenleme yapılamasın … sadece sahada personelin nasıl göreceği
   gözüksün"; "kağıttan düzenleyebiliyoruz ama sahadaki görüntü nasıl oluyor düzenleyemiyoruz burası çok karmaşık bir çözüm öner"): SALT ÖNİZLEME —
   "Düzenle" kipi ve madde cevabı seçicisi kalktı; araç çubuğunda yalnız aygıt ve "Denemeyi temizle". Çözüm: sahaya özgü her ayar KÂĞITTA, öğenin
   ya da formatın ayarı olarak (madde cevabının biçimi "Kurallar, saha ekranı ve talimat" bölümünde; bölümün "Fotoğraftan / Excel'den doldur"
   seçeneği bölüm ayarında — 484); saha ekranı o ayarların sonucunu gösterir. */
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Tus } from "../../../components/tus/Tus";
import type { FormatTanimi } from "../../../format/tanim";
import { kullanim } from "../kullanim";
import type { FormatIletisi } from "./SahaCerceve";
import stil from "./format.module.css";

const AYGIT = {
  tablet: { ad: "Tablet", ikon: "tablet-smartphone", en: 820, boy: 1180 },
  telefon: { ad: "Telefon", ikon: "smartphone", en: 390, boy: 844 },
} as const;
type Aygit = keyof typeof AYGIT;
/** kalıbın dar bandı (telefon; src/styles/kalip.ts 768) */
const DAR = "(max-width: 767.98px)";
const darAbone = (f: () => void) => { const m = matchMedia(DAR); m.addEventListener("change", f); return () => m.removeEventListener("change", f); };

export function SahaGorunumu({ turId, formatId, t }: { turId: string; formatId: string; t: FormatTanimi }) {
  const dar = useSyncExternalStore(darAbone, () => matchMedia(DAR).matches, () => false);
  const [aygitSecim, setAygit] = useState<Aygit>("tablet");
  const aygit: Aygit = dar ? "telefon" : aygitSecim;
  const [temizle, setTemizle] = useState(0);
  const [durum, setDurum] = useState<{ eksik: number; kusur: number } | null>(null);
  const cerceve = useRef<HTMLIFrameElement>(null);
  const kap = useRef<HTMLDivElement>(null);
  const [genislik, setGenislik] = useState(0);
  useEffect(() => {
    const el = kap.current;
    if (!el) return;
    const olc = () => setGenislik(el.clientWidth);
    olc();
    const g = new ResizeObserver(olc);
    g.observe(el);
    return () => g.disconnect();
  }, []);
  /* çerçeveye giden son ileti (açılınca ve her değişiklikte) — yalnız kendi kökenimize */
  const ileti = useRef<FormatIletisi | null>(null);
  const gonder = useCallback(() => {
    const w = cerceve.current?.contentWindow;
    if (w && ileti.current) w.postMessage(ileti.current, location.origin);
  }, []);
  useEffect(() => {
    ileti.current = { tur: "probata-format", tanim: t, tema: document.documentElement.getAttribute("data-tema") ?? undefined, temizle };
    gonder();
  }, [t, temizle, gonder]);
  /* tema değişince çerçeve de değişir */
  useEffect(() => {
    const g = new MutationObserver(() => {
      if (ileti.current) ileti.current = { ...ileti.current, tema: document.documentElement.getAttribute("data-tema") ?? undefined };
      gonder();
    });
    g.observe(document.documentElement, { attributes: true, attributeFilter: ["data-tema"] });
    return () => g.disconnect();
  }, [gonder]);
  useEffect(() => {
    const al = (e: MessageEvent) => {
      if (e.origin !== location.origin || !cerceve.current || e.source !== cerceve.current.contentWindow) return;
      const m = e.data as { tur?: unknown; eksik?: unknown; kusur?: unknown } | null;
      if (!m || typeof m !== "object") return;
      if (m.tur === "probata-hazir") gonder();
      else if (m.tur === "probata-durum" && typeof m.eksik === "number" && typeof m.kusur === "number") setDurum({ eksik: m.eksik, kusur: m.kusur });
    };
    window.addEventListener("message", al);
    return () => window.removeEventListener("message", al);
  }, [gonder]);

  const a = AYGIT[aygit];
  const olcek = genislik ? Math.min(1, genislik / a.en) : 1;
  const k = kullanim(t);
  const secici = <T extends string>(ad: string, deger: T, l: readonly (readonly [T, string, string])[], sec: (x: T) => void) => (
    <span className={stil.onizlemeSecici} role="group" aria-label={ad}>
      {l.map(([x, etiket, ikon]) => (
        <Tus key={x} tur={deger === x ? "birincil" : "ikincil"} ikon={ikon} aria-pressed={deger === x} onClick={() => sec(x)}>{etiket}</Tus>
      ))}
    </span>
  );
  return (
    <section className={stil.saha} aria-label="Saha ekranı">
      <div className={stil.sahaArac}>
        {!dar && secici("Aygıt", aygit, [["tablet", AYGIT.tablet.ad, AYGIT.tablet.ikon], ["telefon", AYGIT.telefon.ad, AYGIT.telefon.ikon]] as const, setAygit)}
        <Tus tur="ikincil" ikon="rotate-ccw" onClick={() => setTemizle((x) => x + 1)}>Denemeyi temizle</Tus>
      </div>
      <p className={stil.bosMetin}>Denetçinin sahada göreceği ekran: denetçi gibi deneyebilirsiniz, hiçbir şey kaydedilmez. Format kâğıtta düzenlenir.</p>
      <div className={dar ? stil.sahaSahneTek : stil.sahaSahne}>
        <div ref={kap} className={stil.sahaKap}>
          <div className={stil.sahaAygit} style={{ width: a.en * olcek, height: a.boy * olcek }}>
            <iframe ref={cerceve} className={stil.sahaCerceve} src={`/ekipman-turleri/${turId}/sablon/${formatId}/saha`} title={`Saha ekranı · ${a.ad.toLocaleLowerCase("tr")}`}
              onLoad={gonder} style={{ width: a.en, height: a.boy, transform: olcek < 1 ? `scale(${olcek})` : undefined }} />
          </div>
        </div>
        {!dar && (
          <section className={stil.kullanim} aria-label="Kullanım">
            <h3 className={stil.kullanimBaslik}>Kullanım <span className={stil.ogeAlt}>(bu formatla bir rapor)</span></h3>
            <dl className={stil.olcu}>
              <dt>Bölüm</dt><dd>{k.bolum}</dd>
              <dt>Kontrol maddesi</dt><dd>{k.madde}</dd>
              <dt>Yazılan kutu</dt><dd>{k.yazilan}</dd>
              <dt>Seçilen kutu</dt><dd>{k.secilen}</dd>
              {k.tablolar.length > 0 && <><dt>Ölçüm tablosu</dt><dd>{k.tablolar.length}</dd></>}
              {k.foto > 0 && <><dt>Zorunlu fotoğraf</dt><dd>{k.foto} bölüm</dd></>}
            </dl>
            <div>
              <p className={stil.kullanimEtiket}>Cevap dokunuşu (maddeler hepsi “Uygun” gelir; değiştirmek)</p>
              <dl className={stil.olcu}>
                <dt>Açılır liste{t.gorunum.cevap === "acilir" ? " · seçili" : ""}</dt><dd>{k.acilir}</dd>
                <dt>Yan yana tuş{t.gorunum.cevap === "tus" ? " · seçili" : ""}</dt><dd>{k.tus}</dd>
              </dl>
              <div className={stil.cubuk} aria-hidden="true"><i style={{ width: `${k.acilir ? Math.round((k.tus / k.acilir) * 100) : 0}%` }} /></div>
            </div>
            {k.tablolar.length > 0 && <p className={stil.ogeAlt}>Tablolar: {k.tablolar.map((x) => `${x.ad} (satır başına ${x.sutun})`).join(" · ")}</p>}
            {durum && <p className={stil.kullanimDeneme} aria-live="polite">Deneme: <b>{durum.eksik}</b> eksik · <b>{durum.kusur}</b> kusur</p>}
          </section>
        )}
      </div>
    </section>
  );
}
