/* SAYFA PARÇALARI — tek üretici (maket MK.kirinti, .a-sayfa-bas, .a-nesne-bas, .a-alt-bas, MK.rozet, .a-sekmeler). Nesne sayfası (anayasa 2.7):
   kırıntı + kimlik + rozet + tek birincil tuş. Rozet türleri maketin rozet sınıflarıyla aynı. */
import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { Ikon } from "../ikon/Ikon";
import stil from "./Sayfa.module.css";

export type RozetTuru = "bekliyor" | "kabul" | "denetimde" | "tamam" | "red" | "notr";
export function Rozet({ tur, children }: { tur: RozetTuru; children: ReactNode }) {
  return <span className={`${stil.rozet} ${stil[tur]}`}>{children}</span>;
}
export function Rozetler({ children }: { children: ReactNode }) {
  return <span className={stil.rozetler}>{children}</span>;
}

export function SayfaBasi({ baslik, sayac, tuslar }: { baslik: string; sayac?: ReactNode; tuslar?: ReactNode }) {
  return <div className={stil.sayfaBas}><h1 tabIndex={-1}>{baslik}</h1>{sayac}{tuslar && <div className={stil.sagda}>{tuslar}</div>}</div>;
}

/** kırıntı: son öğe bulunulan sayfa (bağlantısız) */
export function Kirinti({ ogeler }: { ogeler: readonly (readonly [ad: string, href?: string])[] }) {
  return (
    <nav className={stil.kirinti} aria-label="Konum">
      {ogeler.map(([ad, href], i) => (
        <Fragment key={i}>
          {i > 0 && <Ikon ad="chevron-right" kucuk />}
          {href && !(i === ogeler.length - 1 && ogeler.length > 1)
            ? <Link href={href}>{i === 0 && <Ikon ad="arrow-left" kucuk />}{ad}</Link>
            : <span aria-current="page">{ad}</span>}
        </Fragment>
      ))}
    </nav>
  );
}

export function NesneBasi({ baslik, rozet, alt, altIkon, tuslar }: { baslik: string; rozet?: ReactNode; alt?: ReactNode; altIkon?: string; tuslar?: ReactNode }) {
  return (
    <div className={stil.nesneBas}>
      <div className={stil.nesneKimlik}>
        <div className={stil.nesneBaslik}><h1 tabIndex={-1}>{baslik}</h1>{rozet}</div>
        {alt && <p className={stil.nesneAlt}>{altIkon && <Ikon ad={altIkon} kucuk />}<span>{alt}</span></p>}
      </div>
      {tuslar && <div className={stil.eylemCubugu}>{tuslar}</div>}
    </div>
  );
}

export function Bolum({ id, baslik, sayac, tuslar, children }: { id: string; baslik: string; sayac?: ReactNode; tuslar?: ReactNode; children: ReactNode }) {
  return (
    <section className={stil.bolum} aria-labelledby={id}>
      <div className={stil.altBas}><h2 className={stil.altBaslik} id={id} tabIndex={-1}>{baslik}</h2>{sayac}{tuslar && <div className={stil.sagda}>{tuslar}</div>}</div>
      {children}
    </section>
  );
}

export function Aciklama({ children }: { children: ReactNode }) { return <p className={stil.aciklama}>{children}</p>; }
export function SeritKap({ children }: { children: ReactNode }) { return <div className={stil.seritKap}>{children}</div>; }
export function Kod({ children }: { children: ReactNode }) { return <span className={stil.kod}>{children}</span>; }
export function AltSatir({ children, uyari = false }: { children: ReactNode; uyari?: boolean }) { return <span className={uyari ? stil.uyariMetin : stil.altSatir}>{children}</span>; }
export function DegerYok({ children = "—" }: { children?: ReactNode }) { return <span className={stil.yok}>{children}</span>; }

/** sayfa sekmeleri (bağlantı; bulunulan aria-current). 442 `alt`: üst sekmenin ALTINDA ikinci düzey (reisim 2026-10-09: "altında bir sekme gibi
    olacak") — kendi satırında, çizgili; üst sekmeyle yan yana dizilmez */
export function Sekmeler({ ad, ogeler, secili, alt = false }: { ad: string; ogeler: readonly (readonly [ad: string, href: string])[]; secili: string; alt?: boolean }) {
  return (
    <nav className={alt ? stil.altSekmeler : stil.sekmeler} aria-label={ad}>
      {ogeler.map(([a, href]) => <Link key={href} className={alt ? stil.altSekme : stil.sekme} href={href} aria-current={href === secili ? "page" : undefined}>{a}</Link>)}
    </nav>
  );
}
