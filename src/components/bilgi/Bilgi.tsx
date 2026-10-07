/* BİLGİ YÜZLERİ · BİLGİ LİSTESİ · KOŞUL LİSTESİ — tek üreticiler (kalıp 20 a, d; maketteki .a-yuzler / .a-bilgi / .a-kosullar).
   Yüz: sayı + kısa not; uyarı notu uyarı renginde; bağlantıysa tıklanınca ilgili listeye gider — sayı gittiği listeyle AYNI ölçütten
   sayılır (anayasa 2.7–2.8; bu çağıranın işi). Bilgi listesi: etiket + değer (dl); genis telefonda tam satır, "tam" her bantta tam satır,
   "cift" her bantta iki sütun (bölünmez uzun kimlik). Koşul listesi: ✓ tamam · ⚠ eksik · bilgi — engel değil bilgi (kalıp 20 d). */
import Link from "next/link";
import type { ReactNode } from "react";
import { Ikon } from "../ikon/Ikon";
import stil from "./Bilgi.module.css";

export function Yuzler({ children }: { children: ReactNode }) {
  return <div className={stil.yuzler}>{children}</div>;
}

export function Yuz({ ikon, ad, sayi, not, uyari = false, href }:
  { ikon: string; ad: string; sayi: ReactNode; not?: ReactNode; uyari?: boolean; href?: string }) {
  const ic = (
    <>
      <span className={stil.yuzUst}><Ikon ad={ikon} kucuk />{ad}</span>
      <span className={stil.yuzSayi}>{sayi}</span>
      {not && <span className={uyari ? `${stil.yuzNot} ${stil.yuzUyari}` : stil.yuzNot}>{not}</span>}
    </>
  );
  return href ? <Link className={`${stil.yuz} ${stil.yuzBag}`} href={href}>{ic}</Link> : <div className={stil.yuz}>{ic}</div>;
}

export function BilgiListesi({ children }: { children: ReactNode }) {
  return <dl className={stil.bilgi}>{children}</dl>;
}

export function Bilgi({ etiket, children, genis }: { etiket: string; children: ReactNode; genis?: boolean | "tam" | "cift" }) {
  const sinif = [stil.oge, genis && stil.genis, genis === "tam" && stil.tam, genis === "cift" && stil.cift].filter(Boolean).join(" ");
  return <div className={sinif}><dt>{etiket}</dt><dd>{children}</dd></div>;
}

export type KosulTuru = "tamam" | "eksik" | "bilgi";
const KOSUL_IKON: Record<KosulTuru, string> = { tamam: "circle-check", eksik: "triangle-alert", bilgi: "info" };
const KOSUL_SINIF: Record<KosulTuru, string> = { tamam: stil.kosulTamam, eksik: stil.kosulEksik, bilgi: stil.kosulBilgi };

/** ikon: türün ikonunun yerine (379: duyuru satırı "scroll-text", maket a-duyurular) */
export function Kosullar({ ogeler }: { ogeler: readonly { tur: KosulTuru; metin: ReactNode; eylem?: ReactNode; ikon?: string }[] }) {
  return (
    <ul className={stil.kosullar}>
      {ogeler.map((o, i) => (
        <li key={i} className={KOSUL_SINIF[o.tur]} data-kosul={o.tur}>
          <Ikon ad={o.ikon ?? KOSUL_IKON[o.tur]} kucuk />
          <span className={stil.kosulMetin}>{o.metin}</span>
          {o.eylem && <span className={stil.kosulEylem}>{o.eylem}</span>}
        </li>
      ))}
    </ul>
  );
}
