"use client";
/* GELİŞMİŞ GÖRÜNÜM · YAN PANELLER (494; hata listesi 29 + 46 maketi https://claude.ai/artifact/TgA7oTqRojdEe7qAfjqAfJ onaylandı — reisim 2026-10-11:
   "mevcuttaki sistemi koruyalım gelişmiş seçenekler tuşu olsun ve tıklayınca buraya gitsin"). Solda PARÇALAR: kâğıda sürüklenir ya da basılıp
   (tutulur) yeri seçilir — kâğıtta "Buraya ekle" / "Bu bölüme ekle" (tablet ve klavye için de). Sağda SEÇİLİ BÖLÜM: kâğıtta basılan bölümün özeti
   ve tuşları (kopyala, kâğıtta göster, sil). Adlar, maddeler, sütunlar kâğıtta yerinde yazılır — gelişmiş görünüm kâğıdı değiştirmez, yanına
   parça kutusu ve seçili bölümü koyar. Saf işlevler ../yapboz.ts. */
import { Ikon } from "../../../components/ikon/Ikon";
import { Tus } from "../../../components/tus/Tus";
import type { FormatTanimi } from "../../../format/tanim";
import { bolumOgeleri } from "../kurucu";
import { parcaGruplari, surukleTuru } from "../yapboz";
import { BLOK_ADI } from "./ortak";
import stil from "./yapboz.module.css";

export function Parcalar({ t, tutulan, tut }: { t: FormatTanimi; tutulan: string | null; tut: (k: string | null) => void }) {
  return (
    <aside className={stil.yan} aria-label="Parçalar">
      <h2 className={stil.baslik}><Ikon ad="puzzle" kucuk />Parçalar</h2>
      <p className={stil.not}>Kâğıda sürükleyin ya da basıp yerini seçin (Esc bırakır).</p>
      {parcaGruplari(t).map((g) => (
        <div key={g.ad} className={stil.grup} role="group" aria-label={g.ad}>
          <span className={stil.grupAd}>{g.ad}</span>
          <div className={stil.liste}>
            {g.parcalar.map((p) => (
              <button key={p.k} type="button" className={stil.parca} draggable aria-pressed={tutulan === p.k} data-parca={p.k}
                onClick={() => tut(tutulan === p.k ? null : p.k)}
                onDragStart={(e) => { e.dataTransfer.setData(surukleTuru(p), p.k); e.dataTransfer.setData("text/plain", p.ad); e.dataTransfer.effectAllowed = "copy"; }}>
                <span className={stil.parcaAd}>{p.ad}</span><span className={stil.parcaAcik}>{p.acik}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </aside>
  );
}

/** seçili bölüm: kopya ve silme FormatKurucu'dan (geri al / yinele aynı geçmişte) */
export function SeciliBolum({ t, secili, kopyala, sil }: {
  t: FormatTanimi; secili: string | null; kopyala: (i: number) => void; sil: (i: number) => void;
}) {
  const i = secili ? t.bolumler.findIndex((b) => b.id === secili) : -1, b = i >= 0 ? t.bolumler[i] : null;
  if (!b) {
    return (
      <aside className={stil.yan} aria-label="Seçili bölüm">
        <h2 className={stil.baslik}>Seçili bölüm</h2>
        <p className={stil.not}>Kâğıtta bir bölüme basın; özeti ve tuşları burada açılır. Adları, maddeleri, sütunları kâğıtta yerinde yazın.</p>
      </aside>
    );
  }
  const tam = b.blok === "bilgi" && !!b.tam, oge = bolumOgeleri(b).length;
  const yer = tam ? "kb-ekipman" : `kb-${b.id}`;
  return (
    <aside className={stil.yan} aria-label="Seçili bölüm">
      <h2 className={stil.baslik}>Seçili bölüm</h2>
      <p className={stil.secAd}>{b.ad}</p>
      <p className={stil.not}>{tam ? "Ekipman bilgileri" : BLOK_ADI[b.blok]}{b.kilit ? " · Bakanlık bölümü" : ""}{oge ? ` · ${oge} öğe` : ""}</p>
      <div className={stil.tuslar}>
        <Tus tur="ikincil" ikon="eye" onClick={() => document.getElementById(yer)?.scrollIntoView({ block: "center", behavior: "smooth" })}>Kâğıtta göster</Tus>
        {!tam && b.blok !== "cihaz" && <Tus tur="ikincil" ikon="copy" onClick={() => kopyala(i)}>Kopyala</Tus>}
        {!tam && b.blok !== "cihaz" && <Tus tur="tehlike" ikon="trash-2" onClick={() => sil(i)}>Sil</Tus>}
      </div>
      <p className={stil.not}>{tam ? "Ekipman bilgileri bölümü kâğıttaki çöp kutusuyla kaldırılır, geri eklenir."
        : "Bölümün ayarları kâğıtta şeritteki ayar tuşunda; öğenin ayrıntıları öğenin ayar tuşunda."}</p>
    </aside>
  );
}
