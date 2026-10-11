"use client";
/* GELİŞMİŞ GÖRÜNÜM · YAN PANELLER (494; hata listesi 29 + 46 maketi https://claude.ai/artifact/TgA7oTqRojdEe7qAfjqAfJ onaylandı — reisim 2026-10-11:
   "mevcuttaki sistemi koruyalım gelişmiş seçenekler tuşu olsun ve tıklayınca buraya gitsin"). Solda PARÇALAR: kâğıda sürüklenir ya da basılıp
   (tutulur) yeri seçilir — kâğıtta "Buraya ekle" / "Bu bölüme ekle" (tablet ve klavye için de). Sağda SEÇİLİ BÖLÜM: kâğıtta basılan bölümün özeti
   ve tuşları (kopyala, kâğıtta göster, sil). Adlar, maddeler, sütunlar kâğıtta yerinde yazılır — gelişmiş görünüm kâğıdı değiştirmez, yanına
   parça kutusu ve seçili bölümü koyar. Saf işlevler ../yapboz.ts.
   496 PARÇA KİTAPLIĞI: kutunun altında "Firmanızın parçaları" (seçili bölümde "Parça olarak kaydet"; yönetici siler) ve hazır formatların (Bakanlık + genel)
   bölümleri — şablon başına katlanır grup. Parça formata kopyalanır; sonradan değişmez / silinirse format etkilenmez. */
import { Ikon } from "../../../components/ikon/Ikon";
import { Tus } from "../../../components/tus/Tus";
import type { FormatTanimi } from "../../../format/tanim";
import { bolumOgeleri } from "../kurucu";
import { parcaGruplari, parcaOlur, surukleTuru, type Kitaplik, type Parca, type ParcaGrubu } from "../yapboz";
import { BLOK_ADI } from "./ortak";
import { bolumeKaydir } from "./kaydir";
import stil from "./yapboz.module.css";

/** silebilir: firmanın parçasının yanında Sil (yalnız yönetici; karar sunucuda) */
export function Parcalar({ t, kitaplik, tutulan, tut, sil }: {
  t: FormatTanimi; kitaplik: Kitaplik; tutulan: string | null; tut: (k: string | null) => void; sil: ((id: string, ad: string) => void) | null;
}) {
  const tus = (p: Parca) => (
    <button key={p.k} type="button" className={stil.parca} draggable aria-pressed={tutulan === p.k} data-parca={p.k}
      onClick={() => tut(tutulan === p.k ? null : p.k)}
      onDragStart={(e) => { e.dataTransfer.setData(surukleTuru(p), p.k); e.dataTransfer.setData("text/plain", p.ad); e.dataTransfer.effectAllowed = "copy"; }}>
      <span className={stil.parcaAd}>{p.ad}</span><span className={stil.parcaAcik}>{p.acik}</span>
    </button>
  );
  const liste = (g: ParcaGrubu) => (
    <div className={stil.liste}>
      {g.parcalar.map((p) => (g.firma && sil ? (
        <div key={p.k} className={stil.firmaParca}>
          {tus(p)}
          <button type="button" className={stil.parcaSil} aria-label={`${p.ad} parçasını sil`} title="Parçayı sil" onClick={() => sil(p.k.slice(2), p.ad)}>
            <Ikon ad="trash-2" kucuk />
          </button>
        </div>
      ) : tus(p)))}
    </div>
  );
  const gruplar = parcaGruplari(t, kitaplik), hazir = gruplar.filter((g) => g.katlanir);
  return (
    <aside className={stil.yan} aria-label="Parçalar">
      <h2 className={stil.baslik}><Ikon ad="puzzle" kucuk />Parçalar</h2>
      <p className={stil.not}>Kâğıda sürükleyin ya da basıp yerini seçin (Esc bırakır).</p>
      {gruplar.filter((g) => !g.katlanir).map((g) => (
        <div key={g.ad} className={stil.grup} role="group" aria-label={g.ad}>
          <span className={stil.grupAd}>{g.firma && <Ikon ad="bookmark-plus" kucuk />}{g.ad}</span>
          {g.firma && !g.parcalar.length
            ? <p className={stil.not}>Henüz yok. Kâğıtta bir bölüme basın, sağda “Parça olarak kaydet” — bütün formatlarınızda burada çıkar.</p>
            : liste(g)}
        </div>
      ))}
      {hazir.length > 0 && (
        <div className={stil.grup} role="group" aria-label="Hazır formatlardan bölümler">
          <span className={stil.grupAd}>Hazır formatlardan bölümler</span>
          {hazir.map((g) => (
            <details key={g.ad} className={stil.katlanir}>
              <summary>{g.ad} <span className={stil.parcaAcik}>· {g.parcalar.length}</span></summary>
              {liste(g)}
            </details>
          ))}
        </div>
      )}
    </aside>
  );
}

/** seçili bölüm: kopya ve silme FormatKurucu'dan (geri al / yinele aynı geçmişte) */
export function SeciliBolum({ t, secili, kopyala, sil, parcaKaydet }: {
  t: FormatTanimi; secili: string | null; kopyala: (i: number) => void; sil: (i: number) => void;
  /** 496: bölümü firmanın parçası olarak kaydet (yoksa tuş yok) */
  parcaKaydet: ((i: number) => void) | null;
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
        <Tus tur="ikincil" ikon="eye" onClick={() => bolumeKaydir(yer)}>Kâğıtta göster</Tus>
        {!tam && b.blok !== "cihaz" && <Tus tur="ikincil" ikon="copy" onClick={() => kopyala(i)}>Kopyala</Tus>}
        {parcaKaydet && parcaOlur(b) && <Tus tur="ikincil" ikon="bookmark-plus" onClick={() => parcaKaydet(i)}>Parça olarak kaydet</Tus>}
        {!tam && b.blok !== "cihaz" && <Tus tur="tehlike" ikon="trash-2" onClick={() => sil(i)}>Sil</Tus>}
      </div>
      <p className={stil.not}>{tam ? "Ekipman bilgileri bölümü kâğıttaki çöp kutusuyla kaldırılır, geri eklenir."
        : "Bölümün ayarları kâğıtta şeritteki ayar tuşunda; öğenin ayrıntıları öğenin ayar tuşunda."}</p>
    </aside>
  );
}
