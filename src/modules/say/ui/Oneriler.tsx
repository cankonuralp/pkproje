"use client";
/* S.A.Y HAZIR ÖNERİLERİ (2026-10-31, kalem 8 — E6; maket 1, 2, 3; 02-HAZIR-SABLONLAR.md): sayfada tek öneri → tek tuş; birden çok → ilk öneri + "…" (liste
   tuşun üstünde; Esc, dışarı tıklama ve ok tuşları); girdisi olan öneri küçük form açar (plan sayfadan, gün bugünden; son değerler bu cihazda hatırlanır),
   "Başlat" komutu kullanıcının balonunda gönderir, şablon notu aynı iletiyle (sunucuya kimlik + değerler). "Fotoğrafları oku ve gir" ekranın okumasıdır. */
import { useEffect, useMemo, useRef, useState } from "react";
import { eksikGirdiler, sayfaOnerileri, type Sablon } from "../sablonlar";
import stil from "./say.module.css";

const SON_ANAHTARI = "probata.say.sonOneriler", DEGER_ANAHTARI = "probata.say.oneriDegerleri";
const oku = <T,>(a: string, y: T): T => { try { const v = localStorage.getItem(a); return v ? JSON.parse(v) as T : y; } catch { return y; } };
const yaz = (a: string, v: unknown) => { try { localStorage.setItem(a, JSON.stringify(v)); } catch { /* saklama yok */ } };
const bugun = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(new Date());

export function Oneriler({ yol, roller, kapali, oku: okuIs, baslat }: {
  yol: string; roller: readonly string[]; kapali: boolean; oku: (() => void) | null;
  baslat: (metin: string, sablon: { id: string; girdiler: Record<string, string | boolean> }) => void;
}) {
  const [son, setSon] = useState<string[]>(() => oku<string[]>(SON_ANAHTARI, []));
  const [acik, setAcik] = useState(false), [secili, setSecili] = useState(0), [form, setForm] = useState<Sablon | null>(null);
  const [degerler, setDegerler] = useState<Record<string, string | boolean>>({}), [hata, setHata] = useState<string | null>(null);
  const kap = useRef<HTMLDivElement>(null);
  /* liste panelin içine sığar (panelin üstüyle önerilerin arası); taşan kısım listenin içinde kayar */
  const [boy, setBoy] = useState<number | null>(null);
  const l = useMemo(() => sayfaOnerileri(yol, roller, son).filter((s) => s.id !== "S13" || !!okuIs), [yol, roller, son, okuIs]);
  useEffect(() => {
    if (!acik) return;
    const p = kap.current?.closest("[role=dialog]"), k = kap.current;
    if (p && k) setBoy(Math.max(120, k.getBoundingClientRect().top - p.getBoundingClientRect().top - 12));
    const d = (e: MouseEvent) => { if (kap.current && !kap.current.contains(e.target as Node)) setAcik(false); };
    document.addEventListener("mousedown", d);
    return () => document.removeEventListener("mousedown", d);
  }, [acik]);
  if (!l.length) return null;

  const sec = (s: Sablon) => {
    setAcik(false); setHata(null);
    const kalan = [s.id, ...son.filter((x) => x !== s.id)].slice(0, 8);
    setSon(kalan); yaz(SON_ANAHTARI, kalan);
    if (s.id === "S13" && okuIs) { okuIs(); return; }
    if (!s.girdiler.some((g) => g.tur !== "ek")) { baslat(s.komut({}), { id: s.id, girdiler: {} }); return; }
    const once = oku<Record<string, Record<string, string | boolean>>>(DEGER_ANAHTARI, {})[s.id] ?? {};
    setDegerler(Object.fromEntries(s.girdiler.filter((g) => g.tur !== "ek").map((g) => [g.ad, once[g.ad] ?? g.varsayilan ?? (g.tur === "tarih" ? bugun() : g.tur === "onay" ? false : "")])));
    setForm(s);
  };
  const basla = () => {
    if (!form) return;
    const eksik = eksikGirdiler(form, degerler);
    if (eksik.length) { setHata(`Doldurun: ${eksik.join(", ")}`); return; }
    const t = oku<Record<string, unknown>>(DEGER_ANAHTARI, {});
    yaz(DEGER_ANAHTARI, { ...t, [form.id]: degerler });
    baslat(form.komut(degerler), { id: form.id, girdiler: degerler });
    setForm(null);
  };
  const tus = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { setAcik(false); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setSecili((i) => Math.min(l.length - 1, i + 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setSecili((i) => Math.max(0, i - 1)); }
    if (e.key === "Enter" && l[secili]) { e.preventDefault(); sec(l[secili]); }
  };

  if (form) {
    return (
      <form className={stil.oneriForm} data-sablon={form.id} onSubmit={(e) => { e.preventDefault(); basla(); }} aria-labelledby="oneri-form-baslik">
        <p id="oneri-form-baslik" className={stil.mdBaslik}>{form.ad}</p>
        {form.girdiler.map((g) => (
          g.tur === "ek" ? <p key={g.ad} className={stil.oneriNot}>{g.etiket}</p>
          : g.tur === "onay" ? (
            <label key={g.ad} className={stil.oneriOnay}><input type="checkbox" id={`oneri-${g.ad}`} checked={degerler[g.ad] === true}
              onChange={(e) => setDegerler((d) => ({ ...d, [g.ad]: e.target.checked }))} />{g.etiket}</label>
          ) : (
            <label key={g.ad} className={stil.oneriAlan}><span>{g.etiket}</span>
              {g.tur === "secim" ? (
                <select id={`oneri-${g.ad}`} value={String(degerler[g.ad] ?? "")} onChange={(e) => setDegerler((d) => ({ ...d, [g.ad]: e.target.value }))}>
                  {(g.secenekler ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input id={`oneri-${g.ad}`} type={g.tur === "tarih" ? "date" : g.tur === "saat" ? "time" : g.tur === "sayi" ? "number" : "text"}
                  value={String(degerler[g.ad] ?? "")} onChange={(e) => setDegerler((d) => ({ ...d, [g.ad]: e.target.value }))} />
              )}
            </label>
          )
        ))}
        {hata && <p role="alert" className={stil.oneriNot}>{hata}</p>}
        <div className={stil.oneriTuslar}>
          <button className={stil.kucukTus} type="button" onClick={() => setForm(null)}>Vazgeç</button>
          <button className={stil.kucukTus} type="submit" disabled={kapali}>Başlat</button>
        </div>
      </form>
    );
  }
  const ilk = l[0]!;
  return (
    <div className={stil.oneriler} ref={kap} onKeyDown={tus}>
      <button className={stil.cip} type="button" disabled={kapali} onClick={() => sec(ilk)} data-oneri={ilk.id}>{ilk.ad}</button>
      {l.length > 1 && (
        <button className={stil.cip} type="button" disabled={kapali} aria-label="Öteki öneriler" aria-expanded={acik} aria-haspopup="listbox"
          onClick={() => { setAcik((a) => !a); setSecili(0); }}>…</button>
      )}
      {acik && (
        <ul className={stil.oneriListe} role="listbox" aria-label="Öneriler" style={boy ? { maxHeight: boy } : undefined}>
          {l.map((s, i) => (
            <li key={s.id} role="option" aria-selected={i === secili} data-oneri={s.id} className={i === secili ? stil.oneriSecili : undefined}
              onMouseEnter={() => setSecili(i)} onClick={() => sec(s)}>
              <b>{s.ad}</b><small>{s.aciklama}</small>{s.ikinciOnay && <span className={stil.oneriIsaret}>İkinci onay</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
