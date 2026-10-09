/* FORMAT ÖNİZLEMESİ — tanımın saha ekranındaki yapısı (RAPOR-FORMAT.md §6 "sağda canlı önizleme"; maket maket-kurucu.js onizleme()): bölüm bölüm
   alanlar, kontrol maddeleri, ölçüm sütunları ve sınırları, test değerleri, kurallar. Salt okunur; React kancası yok (sunucuda çizilir, Format
   kurucu K4'te de kullanır). Kilitli (Bakanlık) öğe kilit simgesiyle. PDF çizimi PDF kaleminde aynı tanımdan. */
import type { ReactNode } from "react";
import { SINIR_ISARETI } from "../../../format/hesap";
import { kayittanBolumMu } from "../../../format/duzen";
import type { Bolum, FormatTanimi, Sinir } from "../../../format/tanim";
import { Ikon } from "../../../components/ikon/Ikon";
import { Rozet } from "../../../components/sayfa/Sayfa";
import { BLOK_ADI } from "./ortak";
import stil from "./format.module.css";

const ALAN_TUR = { metin: "metin", sayi: "sayı", tarih: "tarih", secim: "seçim", coklu: "çoklu seçim", evet: "evet / hayır" } as const;
const GIRIS = { sayi: "sayı", metin: "metin", secim: "seçim", evet: "evet / hayır" } as const;
const HESAP = { nokta: "Ia · Zs · Ik1 hesabı", selektivite: "RCD testi", linye: "Linye hesabı", pd: "Potansiyel dengeleme hesabı", zi: "Zemin izolasyonu hesabı" } as const;
const IMZA = { uzman: "Muayene uzmanı", teknik: "Teknik yönetici" } as const;
const virgul = (n: number) => String(n).replace(".", ",");
const sinir = (op?: Sinir, s?: number, birim?: string) => (op && s !== undefined ? `${SINIR_ISARETI[op]} ${virgul(s)}${birim ? ` ${birim}` : ""}` : null);
const olumsuz = (l?: readonly string[], agir?: boolean) => (l?.length ? `uygun değil: ${l.join(" / ")}${agir ? " (ağır)" : ""}` : null);
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
        {/* 447 (reisim: "sütun gibi gözükmüyor kafa karıştırıcı tablo gibi gözükmeli"): sütunlar tablo başlığı; altında örnek satır */}
        <OlcumOnizleme b={b} />
        {b.notlar?.length ? <ul className={stil.ogeler}>{b.notlar.map((n, i) => <Oge key={i} ad={`Not-${i + 1}`} alt={ekler(n.metin, n.kusur && (n.agir ? "ağır kusur" : "kusur"))} />)}</ul> : null}
      </>;
    case "test":
      return <ul className={stil.ogeler}>{b.degerler.map((d) => <Oge key={d.id} ad={d.ad} kilit={d.kilit}
        alt={ekler(d.secenekler?.length ? `seçim: ${d.secenekler.join(" / ")}` : d.metin ? "metin" : d.birim, sinir(d.op, d.sinir, d.birim), olumsuz(d.olumsuz, d.agir), d.not, !d.zorunlu && "isteğe bağlı")} />)}</ul>;
    case "foto":
      return <p className={stil.satir}>{ekler(b.enAz > 0 ? `En az ${b.enAz}` : "İsteğe bağlı", `en çok ${b.enCok} fotoğraf`)}</p>;
    case "sonuc":
      return <>
        <p className={stil.satir}>{b.cumle ? `${b.cumle} uygundur / uygun değildir.` : "Uygun / Uygun değil"}</p>
        {b.aciklama && <p className={`${stil.satir} ${stil.aciklama}`}>{b.aciklama}</p>}
      </>;
    case "not":
      return <p className={stil.satir}>{b.zorunlu ? "Zorunlu" : "İsteğe bağlı"}</p>;
    case "imza":
      return <p className={stil.satir}>{b.imzalar.map((i) => IMZA[i]).join(" · ")} · rapor ekranında görünmez, belgede (PDF) basılır</p>;
    default:
      return null;
  }
}

/** 447: ölçüm bölümü tablo gibi — başlıkta sütun adı, birim ve sınır; altında örnek satır (girişin türü) */
export function OlcumOnizleme({ b, tuslar, secili }: { b: Extract<Bolum, { blok: "olcum" }>; tuslar?: (id: string) => ReactNode; secili?: string | null }) {
  return (
    <div className={stil.tabloKap}>
      <table className={stil.onizTablo}>
        <caption className="gizli">{b.ad} · sütunlar</caption>
        <thead>
          <tr>
            <th scope="col">No</th>
            {b.sutunlar.map((s) => (
              <th key={s.id} scope="col" className={secili === s.id ? stil.sutunSecili : undefined}>
                <span className={stil.sutunAd}>{s.ad}{s.birim ? ` (${s.birim})` : ""}</span>
                {(sinir(s.op, s.sinir, s.birim) || s.zorunlu) && <span className={stil.ogeAlt}>{ekler(sinir(s.op, s.sinir, s.birim) && `sınır ${sinir(s.op, s.sinir, s.birim)}`, s.zorunlu && "zorunlu")}</span>}
                {tuslar?.(s.id)}
              </th>
            ))}
            {b.notlar?.length ? <th scope="col">Uygunluk notu</th> : null}
            <th scope="col">Sonuç</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            {b.sutunlar.map((s) => <td key={s.id}><span className={stil.ornekHucre}>{s.giris === "secim" && s.secenekler?.length ? s.secenekler.join(" / ") : GIRIS[s.giris]}</span></td>)}
            {b.notlar?.length ? <td><span className={stil.ornekHucre}>Not-1 … Not-{b.notlar.length}</span></td> : null}
            <td><span className={stil.ornekHucre}>Uygun / Uygun değil</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
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
            {kayittanBolumMu(b) ? <Rozet tur="notr">Sabit · her raporda aynı</Rozet> : b.kilit && <Rozet tur="kabul">Bakanlık alanı</Rozet>}
            {/* 427: belgedeki numara düzeni (format/duzen.ts) */}
            {b.ust && <Rozet tur="notr">Üst başlık: {b.ust}</Rozet>}
            {b.numarasiz && <Rozet tur="notr">Numarasız</Rozet>}
          </div>
          <Icerik b={b} />
        </li>
      ))}
    </ol>
  );
}
