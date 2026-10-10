"use client";
/* SAHA GÖRÜNÜMÜ (472–474; reisim 2026-10-10, maket kararları: k1 "evet" — saha ekranında da düzenleme · k2 "format" — madde cevabının biçimi
   format başına · k3 "kağıt açılsın kağıtta yapılan değişiklik saha ekranında saha ekranında yapılan değişiklik kağıtta etki etsin" · k4
   varsayılan aygıt tablet). Format kurucusunun (ve sürüm sayfasının) "Saha ekranı" görünümü: denetçinin tablette / telefonda göreceği GERÇEK
   saha ekranı, çerçevede (src/app/(cerceve)/…/saha — gerçek aygıt genişliğinde çizilir, sayfaya sığacak kadar küçültülür) örnek raporla.
   Taslak çerçeveye canlı gider (SahaCerceve.tsx iletileri); "Düzenle" kipinde saha ekranında yazılan ad / eklenen / çıkarılan öğe kâğıda geçer.
   Araç çubuğu: aygıt (Tablet · Telefon) · kip (Düzenle · Denetçi gibi dene) · madde cevabı (Açılır liste · Yan yana tuşlar — formatın ayarı)
   · Denemeyi temizle. Altında kullanım özeti (kullanim.ts). degis yoksa salt görünüm (sürüm sayfası): yalnız aygıt ve dene. */
import { useCallback, useEffect, useRef, useState } from "react";
import { Tus } from "../../../components/tus/Tus";
import { FormatTanimi } from "../../../format/tanim";
import { gorunumYaz } from "../kurucu";
import { kullanim } from "../kullanim";
import type { FormatIletisi, SahaKipi } from "./SahaCerceve";
import stil from "./format.module.css";

const AYGIT = {
  tablet: { ad: "Tablet", ikon: "tablet-smartphone", en: 820, boy: 1180 },
  telefon: { ad: "Telefon", ikon: "smartphone", en: 390, boy: 844 },
} as const;
type Aygit = keyof typeof AYGIT;

export function SahaGorunumu({ turId, formatId, t, degis }: { turId: string; formatId: string; t: FormatTanimi; degis?: (t: FormatTanimi) => void }) {
  const [aygit, setAygit] = useState<Aygit>("tablet");
  const [kip, setKip] = useState<SahaKipi>(degis ? "duzenle" : "dene");
  const [temizle, setTemizle] = useState(0);
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
    ileti.current = { tur: "probata-format", tanim: t, kip: degis ? kip : "dene", tema: document.documentElement.getAttribute("data-tema") ?? undefined, temizle };
    gonder();
  }, [t, kip, temizle, degis, gonder]);
  /* tema değişince çerçeve de değişir */
  useEffect(() => {
    const g = new MutationObserver(() => {
      if (ileti.current) ileti.current = { ...ileti.current, tema: document.documentElement.getAttribute("data-tema") ?? undefined };
      gonder();
    });
    g.observe(document.documentElement, { attributes: true, attributeFilter: ["data-tema"] });
    return () => g.disconnect();
  }, [gonder]);
  const degisRef = useRef(degis);
  useEffect(() => { degisRef.current = degis; });
  useEffect(() => {
    const al = (e: MessageEvent) => {
      if (e.origin !== location.origin || !cerceve.current || e.source !== cerceve.current.contentWindow) return;
      const m = e.data as { tur?: unknown; tanim?: unknown } | null;
      if (!m || typeof m !== "object") return;
      if (m.tur === "probata-hazir") gonder();
      else if (m.tur === "probata-degis" && degisRef.current) {
        /* çerçeveden gelen tanım da şemadan geçer (taslak yine sunucuda, kaydederken denetlenir) */
        const y = FormatTanimi.safeParse(m.tanim);
        if (y.success) degisRef.current(y.data);
      }
    };
    window.addEventListener("message", al);
    return () => window.removeEventListener("message", al);
  }, [gonder]);

  const a = AYGIT[aygit];
  const olcek = genislik ? Math.min(1, genislik / a.en) : 1;
  const k = kullanim(t);
  const secici = <T extends string>(ad: string, deger: T, l: readonly (readonly [T, string, string])[], sec: (x: T) => void) => (
    <span className={stil.gorunumSecici} role="group" aria-label={ad}>
      {l.map(([x, etiket, ikon]) => (
        <Tus key={x} tur={deger === x ? "birincil" : "ikincil"} ikon={ikon} aria-pressed={deger === x} onClick={() => sec(x)}>{etiket}</Tus>
      ))}
    </span>
  );
  return (
    <section className={stil.saha} aria-label="Saha ekranı">
      <div className={stil.sahaArac}>
        {secici("Aygıt", aygit, [["tablet", AYGIT.tablet.ad, AYGIT.tablet.ikon], ["telefon", AYGIT.telefon.ad, AYGIT.telefon.ikon]] as const, setAygit)}
        {degis && secici("Kip", kip, [["duzenle", "Düzenle", "pencil"], ["dene", "Denetçi gibi dene", "eye"]] as const, setKip)}
        {degis && secici("Madde cevabı", t.gorunum.cevap, [["acilir", "Açılır liste", "chevron-down"], ["tus", "Yan yana tuşlar", "list-checks"]] as const,
          (cevap) => degis(gorunumYaz(t, { cevap })))}
        <Tus tur="ikincil" ikon="rotate-ccw" onClick={() => setTemizle((x) => x + 1)}>Denemeyi temizle</Tus>
      </div>
      <dl className={stil.kullanim} aria-label="Bu formatla bir rapor">
        <div><dt>Kontrol maddesi</dt><dd>{k.madde} · hepsi “Uygun” gelir; değiştirmek {k.dokunus === 1 ? "tek dokunuş (yan yana tuşlar)" : "iki dokunuş (açılır liste)"}</dd></div>
        <div><dt>Yazılan kutu</dt><dd>{k.yazilan}</dd></div>
        <div><dt>Seçilen kutu</dt><dd>{k.secilen}</dd></div>
        {k.tablolar.length > 0 && <div><dt>Ölçüm tablosu</dt><dd>{k.tablolar.map((x) => `${x.ad} (satır başına ${x.sutun})`).join(" · ")}</dd></div>}
        {k.foto > 0 && <div><dt>Zorunlu fotoğraf</dt><dd>{k.foto} bölüm</dd></div>}
      </dl>
      <div ref={kap} className={stil.sahaKap}>
        <div className={stil.sahaAygit} style={{ width: a.en * olcek, height: a.boy * olcek }}>
          <iframe ref={cerceve} className={stil.sahaCerceve} src={`/ekipman-turleri/${turId}/sablon/${formatId}/saha`} title={`Saha ekranı · ${a.ad.toLocaleLowerCase("tr")}`}
            onLoad={gonder} style={{ width: a.en, height: a.boy, transform: olcek < 1 ? `scale(${olcek})` : undefined }} />
        </div>
      </div>
    </section>
  );
}
