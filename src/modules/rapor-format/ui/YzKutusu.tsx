"use client";
/* YAPAY ZEKÂYA ANLAT (497; hata listesi 29 + 46 maketi https://claude.ai/artifact/TgA7oTqRojdEe7qAfjqAfJ onaylandı — karar K6: "öneri kâğıtta kesik
   çizgiyle görünür; Ekle / Uygula demeden yazılmaz"). Gelişmiş görünümde kâğıdın üstünde: istek yazılır ya da örnek seçilir → "Öner" → yapay zekânın
   "ekle" önerileri kâğıtta yerinde kesik çizgiyle (Kagit.tsx), "değiştir" önerileri burada — "Uygula" / "Vazgeç". Firmada yapay zekâ kapalıysa
   ya da anahtar yoksa kutunun yerinde nereden açılacağı yazar (maket). Karar ve yetki sunucuda (server/yz.ts). */
import { useRef, useState } from "react";
import { Ikon } from "../../../components/ikon/Ikon";
import { Tus } from "../../../components/tus/Tus";
import type { FormatTanimi } from "../../../format/tanim";
import type { Oneri } from "../yz-oneri";
import { BLOK_ADI } from "./ortak";
import stil from "./yapboz.module.css";

const ORNEKLER = ["Zincir uzaması için ölçüm tablosu ekle, sınır %3", "Lastik ve tekerlek kontrol maddeleri ekle", "Fotoğraf en az 1 olsun",
  "Raporun sonuna teknik yönetici imzası ekle"];

export function YzKutusu({ t, yz, mesgul, cevap, oneriler, oner, uygula, vazgec, belgeden }: {
  t: FormatTanimi;
  /** sunucudan: hazır mı, değilse kullanıcıya ne söylenecek */
  yz: { hazir: boolean; neden: string };
  mesgul: boolean; cevap: string; oneriler: readonly Oneri[];
  oner: (istek: string) => void; uygula: (id: string) => void; vazgec: (id: string) => void;
  /** 498: "Belgeden başlat…" — firmanın format belgesi (PDF / Word / fotoğraf); yoksa tuş yok */
  belgeden?: (f: File) => void;
}) {
  const [metin, setMetin] = useState("");
  const dosya = useRef<HTMLInputElement>(null);
  if (!yz.hazir) {
    return (
      <section className={stil.yz} aria-label="Yapay zekâya anlat">
        <p className={stil.yzBas}><Ikon ad="sparkles" kucuk />Yapay zekâya anlat</p>
        <p className={stil.not}>{yz.neden}</p>
      </section>
    );
  }
  const gonder = (x: string) => { const s = x.trim(); if (s && !mesgul) oner(s); };
  const degisenler = oneriler.filter((o): o is Extract<Oneri, { tur: "degistir" }> => o.tur === "degistir");
  return (
    <section className={stil.yz} aria-label="Yapay zekâya anlat" aria-busy={mesgul || undefined}>
      <form className={stil.yzForm} onSubmit={(e) => { e.preventDefault(); gonder(metin); }}>
        <label className="gizli" htmlFor="kb-yz">Yapay zekâya anlatın</label>
        <input id="kb-yz" className={stil.yzGirdi} value={metin} maxLength={500} autoComplete="off" disabled={mesgul}
          placeholder="Yapay zekâya anlatın" onChange={(e) => setMetin(e.target.value)} />
        <Tus type="submit" ikon="sparkles" disabled={mesgul || !metin.trim()} aria-busy={mesgul || undefined}>{mesgul ? "Düşünüyor…" : "Öner"}</Tus>
        {belgeden && <>
          <Tus tur="ikincil" ikon="scan-text" disabled={mesgul} onClick={() => dosya.current?.click()}>Belgeden başlat…</Tus>
          <input ref={dosya} type="file" className="gizli" tabIndex={-1} aria-label="Format belgesi (PDF, Word, fotoğraf)"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png"
            onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) belgeden(f); }} />
        </>}
      </form>
      <div className={stil.ornekler} role="group" aria-label="Örnek istekler">
        {ORNEKLER.map((x) => <button key={x} type="button" className={stil.ornek} disabled={mesgul} onClick={() => { setMetin(x); gonder(x); }}>{x}</button>)}
      </div>
      {cevap && <p className={stil.yzCevap} role="status">{cevap}</p>}
      {degisenler.map((o) => {
        const h = t.bolumler.find((b) => b.id === o.hedef);
        return (
          <div key={o.id} className={stil.degisiklik} role="group" aria-label={`Değişiklik önerisi: ${h?.ad ?? o.bolum.ad}`}>
            <span><b>Öneri:</b> “{h?.ad ?? o.bolum.ad}” ({BLOK_ADI[o.bolum.blok]}) — {o.aciklama}</span>
            <span className={stil.tuslar}>
              <Tus ikon="check" onClick={() => uygula(o.id)} disabled={!h}>Uygula</Tus>
              <Tus tur="ikincil" onClick={() => vazgec(o.id)}>Vazgeç</Tus>
            </span>
          </div>
        );
      })}
    </section>
  );
}
