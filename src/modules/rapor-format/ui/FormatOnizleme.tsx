/* FORMAT ÖNİZLEMESİ — tanımın saha ekranındaki yapısı (RAPOR-FORMAT.md §6 "sağda canlı önizleme"; maket maket-kurucu.js onizleme()): bölüm bölüm
   alanlar, kontrol maddeleri, ölçüm sütunları ve sınırları, test değerleri, kurallar. Salt okunur; React kancası yok (sunucuda çizilir, Format
   kurucu K4'te de kullanır). Kilitli (Bakanlık) öğe kilit simgesiyle. PDF çizimi PDF kaleminde aynı tanımdan. */
import type { ReactNode } from "react";
import type { Bolum, FormatTanimi } from "../../../format/tanim";
import { Ikon } from "../../../components/ikon/Ikon";
import { Rozet } from "../../../components/sayfa/Sayfa";
import { BLOK_ADI } from "./ortak";
import stil from "./format.module.css";

const ALAN_TUR = { metin: "metin", sayi: "sayı", tarih: "tarih", secim: "seçim", coklu: "çoklu seçim", evet: "evet / hayır" } as const;
const GIRIS = { sayi: "sayı", metin: "metin", secim: "seçim", evet: "evet / hayır" } as const;
const HESAP = { nokta: "Ia · Zs · Ik1 hesabı", selektivite: "RCD testi", linye: "Linye hesabı", pd: "Potansiyel dengeleme hesabı", zi: "Zemin izolasyonu hesabı" } as const;
const IMZA = { uzman: "Muayene uzmanı", teknik: "Teknik yönetici" } as const;
const virgul = (n: number) => String(n).replace(".", ",");
const sinir = (op?: "<=" | ">=", s?: number, birim?: string) => (op && s !== undefined ? `${op === "<=" ? "≤" : "≥"} ${virgul(s)}${birim ? ` ${birim}` : ""}` : null);
const ekler = (...l: (string | null | false | undefined)[]) => l.filter(Boolean).join(" · ");

function Oge({ ad, alt, kilit }: { ad: ReactNode; alt?: string; kilit?: boolean }) {
  return (
    <li className={stil.oge}>
      <span className={stil.ogeAd}>{kilit && <span className={stil.kilit} title="Bakanlık alanı"><Ikon ad="lock" kucuk /><span className="gizli">Bakanlık alanı</span></span>}{ad}</span>
      {alt && <span className={stil.ogeAlt}>{alt}</span>}
    </li>
  );
}

function Icerik({ b }: { b: Bolum }) {
  switch (b.blok) {
    case "bilgi":
      return <ul className={stil.ogeler}>{b.alanlar.map((a) => <Oge key={a.id} ad={a.ad} kilit={a.kilit}
        alt={ekler(ALAN_TUR[a.tur], a.birim, a.kaynak && "kayıttan", a.zorunlu && !a.kaynak && "zorunlu", a.secenekler?.join(" / "))} />)}</ul>;
    case "liste":
      return <>
        <p className={stil.satir}>Cevaplar: <b>{b.cevaplar.join(" · ")}</b></p>
        {b.gruplar.map((g) => (
          <div key={g.id} className={stil.grup}>
            {g.ad && <h3 className={stil.grupAd}>{g.ad}</h3>}
            <ol className={stil.maddeler}>{g.maddeler.map((m) => <Oge key={m.id} ad={m.metin} alt={m.std} kilit={m.kilit} />)}</ol>
          </div>
        ))}
      </>;
    case "olcum":
      return <>
        <p className={stil.satir}>{ekler(b.satir === "ekle" ? "Satırı denetçi ekler" : "Sabit satırlar", b.enAz > 0 && `en az ${b.enAz} satır`, b.hesap && HESAP[b.hesap])}</p>
        <ul className={stil.ogeler}>{b.sutunlar.map((s) => <Oge key={s.id} ad={s.ad} alt={ekler(GIRIS[s.giris], s.birim, sinir(s.op, s.sinir, s.birim), s.zorunlu && "zorunlu", s.secenekler?.join(" / "))} />)}</ul>
        {b.notlar?.length ? <ul className={stil.ogeler}>{b.notlar.map((n, i) => <Oge key={i} ad={`Not-${i + 1}`} alt={ekler(n.metin, n.kusur && (n.agir ? "ağır kusur" : "kusur"))} />)}</ul> : null}
      </>;
    case "test":
      return <ul className={stil.ogeler}>{b.degerler.map((d) => <Oge key={d.id} ad={d.ad} kilit={d.kilit}
        alt={ekler(d.metin ? "metin" : d.birim, sinir(d.op, d.sinir, d.birim), d.not, !d.zorunlu && "isteğe bağlı")} />)}</ul>;
    case "foto":
      return <p className={stil.satir}>{ekler(b.enAz > 0 ? `En az ${b.enAz}` : "İsteğe bağlı", `en çok ${b.enCok} fotoğraf`)}</p>;
    case "sonuc":
      return <p className={stil.satir}>{b.cumle ? `${b.cumle} uygundur / uygun değildir.` : "Uygun / Uygun değil"}</p>;
    case "not":
      return <p className={stil.satir}>{b.zorunlu ? "Zorunlu" : "İsteğe bağlı"}</p>;
    case "imza":
      return <p className={stil.satir}>{b.imzalar.map((i) => IMZA[i]).join(" · ")}</p>;
    default:
      return null;
  }
}

/** bölümler, sırasıyla */
export function FormatOnizleme({ tanim }: { tanim: FormatTanimi }) {
  return (
    <ol className={stil.bolumler}>
      {tanim.bolumler.map((b, i) => (
        <li key={b.id} className={stil.bolum} data-bolum={b.id}>
          <div className={stil.bolumBas}>
            <h3 className={stil.bolumAd}>{i + 1} · {b.ad}</h3>
            <Rozet tur="notr">{BLOK_ADI[b.blok]}</Rozet>
            {b.kilit && <Rozet tur="kabul">Bakanlık alanı</Rozet>}
          </div>
          <Icerik b={b} />
        </li>
      ))}
    </ol>
  );
}
