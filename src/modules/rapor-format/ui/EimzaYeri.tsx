"use client";
/* E-İMZANIN YERİ (2026-10-16; sunum 595 madde 25 — reisim: "format yapıcıda e imza yeri de seçilebilsin e imza seçilen yere işlesin"; K7 "ikisi"):
   imza bölümünün ayarında — İmza hücresi (varsayılan: imza bölümündeki İmza satırı) · Son sayfada kutu (küçük A4 üstünde sürüklenir; ölçüler mm
   olarak da yazılır) · Görünmez imza. Sayfanın altındaki şerit bandı (madde 26) kutuya kapalı. İmzaya hazırlanan PDF'te bu yerde boş imza alanı
   olur (src/belge/eimza.ts); değişiklik taslakta, kurucunun geçmişine sürükleme bitince bir adım. */
import { useRef, useState, type PointerEvent } from "react";
import { EIMZA_KUTU, type FormatTanimi } from "../../../format/tanim";
import { eimzaYaz, EIMZA_SERIT_MM } from "../kurucu";
import k from "./kagit.module.css";

const OLCEK = 0.9;   // px / mm
type Kutu = { x: number; y: number; en: number; boy: number };

export function EimzaYeriAyari({ t, degis, hucreVar }: { t: FormatTanimi; degis: (y: FormatTanimi) => void; hucreVar: boolean }) {
  const e = t.gorunum.eimza, yer = e?.yer ?? "hucre";
  const kayitli: Kutu = { x: e?.x ?? EIMZA_KUTU.x, y: e?.y ?? EIMZA_KUTU.y, en: e?.en ?? EIMZA_KUTU.en, boy: e?.boy ?? EIMZA_KUTU.boy };
  const [surukle, setSurukle] = useState<Kutu | null>(null);
  const bas = useRef<{ px: number; py: number; k: Kutu } | null>(null);
  const kutu = surukle ?? kayitli;
  const yaz = (y: Partial<Kutu>) => degis(eimzaYaz(t, { yer: "kutu", ...kayitli, ...y }));
  const sinirli = (y: Kutu): Kutu => ({ ...y, x: Math.round(Math.min(Math.max(y.x, 0), 210 - y.en)), y: Math.round(Math.min(Math.max(y.y, 0), 297 - EIMZA_SERIT_MM - y.boy)) });
  const indir = (ev: PointerEvent<HTMLDivElement>) => { ev.currentTarget.setPointerCapture(ev.pointerId); bas.current = { px: ev.clientX, py: ev.clientY, k: kayitli }; setSurukle(kayitli); };
  const kaydir = (ev: PointerEvent<HTMLDivElement>) => {
    const b = bas.current;
    if (!b) return;
    setSurukle(sinirli({ ...b.k, x: b.k.x + (ev.clientX - b.px) / OLCEK, y: b.k.y + (ev.clientY - b.py) / OLCEK }));
  };
  const birak = () => { const s = surukle; bas.current = null; setSurukle(null); if (s && (s.x !== kayitli.x || s.y !== kayitli.y)) yaz({ x: s.x, y: s.y }); };
  const olcu = (ad: string, a: keyof Kutu, en: number, cok: number) => (
    <label className={k.panelAlan}>{ad}
      <OlcuGirdi deger={Math.round(kutu[a])} en={en} cok={cok} ad={`E-imza kutusu · ${ad}`} yaz={(n) => yaz({ [a]: n })} />
    </label>
  );
  return (
    <div className={k.eimzaAyar} role="group" aria-label="E-imzanın yeri">
      <span className={k.panelIpucu}><b>E-imzanın yeri</b> · imzaya hazırlanan PDF&apos;te bu yerde boş imza alanı olur; e-imza aracı imzayı oraya işler.</span>
      <div className={k.panelSatir}>
        {([["hucre", "İmza hücresi (imza bölümündeki İmza satırı)"], ["kutu", "Son sayfada kutu"], ["gorunmez", "Görünmez imza"]] as const).map(([x, ad]) => (
          <label key={x} className={k.panelKutu}>
            <input type="radio" name="kb-eimza-yer" checked={yer === x} onChange={() => degis(eimzaYaz(t, { yer: x, ...(x === "kutu" ? kayitli : {}) }))} />{ad}
          </label>
        ))}
      </div>
      {yer === "hucre" && !hucreVar && <p className={k.eimzaUyari} role="status">İmza bölümünde muayene uzmanının İmza satırı yok — imza görünmez atılır. Satırı
        “+ Satır ekle”den geri ekleyin ya da kutu seçin.</p>}
      {yer === "kutu" && (
        <div className={k.eimzaKutuAyar}>
          <div className={k.eimzaSayfa} style={{ width: 210 * OLCEK, height: 297 * OLCEK }} aria-hidden="true">
            <span className={k.eimzaSayfaAd}>Son sayfa (A4)</span>
            <div className={k.eimzaSerit} style={{ height: EIMZA_SERIT_MM * OLCEK }}>şerit</div>
            <div className={k.eimzaKutu} data-suruklenen={surukle ? "" : undefined}
              style={{ left: kutu.x * OLCEK, top: kutu.y * OLCEK, width: kutu.en * OLCEK, height: kutu.boy * OLCEK }}
              onPointerDown={indir} onPointerMove={kaydir} onPointerUp={birak} onPointerCancel={birak}>e-imza</div>
          </div>
          <div className={k.eimzaOlculer}>
            {olcu("Soldan (mm)", "x", 0, 210 - kutu.en)}
            {olcu("Üstten (mm)", "y", 0, 297 - EIMZA_SERIT_MM - kutu.boy)}
            {olcu("Genişlik (mm)", "en", 20, 210)}
            {olcu("Yükseklik (mm)", "boy", 10, 100)}
            <p className={k.panelIpucu}>Kutuyu küçük sayfada sürükleyin ya da ölçüleri yazın. Alttaki bant her sayfanın “Bu rapor e-imzalıdır” şeridine ayrılmıştır.</p>
          </div>
        </div>
      )}
    </div>
  );
}

/** ölçü girdisi: yazarken serbest, çıkarken (ya da Enter) sınır içindeyse yazılır — ara değer (ör. "8" → "80") reddedilip silinmez */
function OlcuGirdi({ deger, en, cok, ad, yaz }: { deger: number; en: number; cok: number; ad: string; yaz: (n: number) => void }) {
  const [taslak, setTaslak] = useState<string | null>(null);
  const bitir = () => { if (taslak === null) return; const n = Math.round(Number(taslak.replace(",", "."))); if (Number.isFinite(n) && n >= en && n <= cok && n !== deger) yaz(n); setTaslak(null); };
  return <input className={k.panelGirdi} inputMode="numeric" maxLength={3} value={taslak ?? String(deger)} aria-label={ad}
    onChange={(ev) => setTaslak(ev.target.value)} onBlur={bitir} onKeyDown={(ev) => { if (ev.key === "Enter") { ev.preventDefault(); bitir(); } }} />;
}
