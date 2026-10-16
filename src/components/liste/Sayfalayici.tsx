"use client";
/* SAYFALAYICI — ekran tablolarının ve listelerinin TEK sayfalama üreticisi (kalıp 10; maketteki .a-sayfalar). Hesap saf: ./sayfa.ts.
   2026-10-16 (reisim: "herhangi bir tabloda 20 den sonrası sayfalı olacak … herhangi bir liste tablo, ekranda çok fazla veri olunca ekran kasacağı
   için 20 den fazlası sayfalı olsun diğer sayfalara doğru aksın"; örnek: saha raporunda 35+ satırlık pano sigortaları tablosu tek sayfadaydı):
   · Sayfalayici — süzgeçli listenin (SuzgecliListe) ve öteki tabloların ortak sayfa tuşları; tıklanınca odak yeni sayfanın tuşuna geçer;
   · useSayfa(toplam) — tablonun / listenin sayfası (boy kalıptan, 20). Kendi durumunu tutar — akis: satır eklenince eklenen satırın sayfası;
     anahtar: veri kümesi değişince (yeni dosya, arama, sekme, yeniden açılan pencere) 1. sayfa; ac: verilen sıradaki öğenin sayfası (açılışta ve
     değişince). Ya da üst bileşenin durumunu kullanır (deger + degistir: saha raporunun ölçüm tabloları ve kontrol maddeleri — hangi sayfanın
     açılacağına rapor ekranı karar verir; burada yalnız sayfa sayısını aşan değer düzeltilir). Satır silinince sayfa taşmaz;
   · TabloSayfalari — useSayfa'nın tuşları; satır sayısı sayfa boyunu aşmıyorsa (20 ve altı) HİÇ çizilmez; sayfa bilgisi canlı bölge (sayfa
     kendiliğinden değişince — akış, eksiğe git, S.A.Y'ın yazdığı satır — ekran okuyucu "21–25 / 25" duyar);
   · SayfaliListe — ul / ol listesi (öğeler dizi olarak verilir; ol'da numara genel: 2. sayfa 21'den).
   Kaynak kilidi: tests/sayfalama.test.ts (ekran tablosu sayfalamasız eklenemez). */
import { useEffect, useLayoutEffect, useRef, useState, type HTMLAttributes, type ReactNode } from "react";
import { Ikon } from "../ikon/Ikon";
import { degisenSayfa, sayfaDilimi, sayfaHesapla, satirSayfasi, TABLO_SAYFA, type SayfaHesabi } from "./sayfa";
import { sayfaOgeleri } from "./suzgec";
import stil from "./SuzgecliListe.module.css";

/* sayfalayıcı (kalıp 10; reisim 2026-09-23 "10 taneden sonra diğer sayfaya geçsin") — tıklanınca odak yeni sayfanın tuşuna geçer (yeniden
   çizimde kaybolmaz). birim: gezinme bölgesinin adı ("<birim> sayfaları"); canli: sayfa bilgisi canlı bölge (role="status") */
export function Sayfalayici({ birim, toplam, boy, sayfa, degistir, canli = false }: {
  birim: string; toplam: number; boy: number; sayfa: number; degistir: (n: number) => void; canli?: boolean;
}) {
  const kap = useRef<HTMLElement>(null);
  /* odaklanacak sayfa NUMARASI (bayrak değil): tuş hangi çizimde DOM'a gelirse gelsin o sayfanın tuşu odak alır. 2026-10-04: CI'da (telefon) odak
     "Sayfa 1"de kaldı (6739afa); yerelde yeniden üretilemedi. Önceki hâli yalnız [sayfa] değişince bir kez "aria-current"ı arıyordu — o çizimde
     kaçırılırsa bir daha denemiyordu. Şimdi her çizimden sonra, hedef sayfanın tuşu odak alana kadar. */
  const hedef = useRef<number | null>(null);
  useEffect(() => {
    if (hedef.current === null || hedef.current !== sayfa) return;
    const tus = kap.current?.querySelector<HTMLButtonElement>(`button[aria-label="Sayfa ${sayfa}"]`);
    if (!tus) return;
    tus.focus();
    if (document.activeElement === tus) hedef.current = null;
  });
  const n = Math.ceil(toplam / boy);
  const git = (i: number) => { hedef.current = i; degistir(i); };
  return (
    <nav className={stil.sayfalar} aria-label={`${birim} sayfaları`} ref={kap}>
      <span className={stil.sayfaBilgi} role={canli ? "status" : undefined}>{(sayfa - 1) * boy + 1}–{Math.min(toplam, sayfa * boy)} / {toplam}</span>
      {n > 1 && (
        <div className={stil.sayfaTuslar}>
          <button className={stil.sayfa} type="button" aria-label="Önceki sayfa" disabled={sayfa === 1} onClick={() => git(sayfa - 1)}><Ikon ad="chevron-left" kucuk /></button>
          {sayfaOgeleri(n, sayfa).map((o) => o.tur === "ara"
            ? <span key={`a${o.no}`} className={stil.sayfaAra} aria-hidden="true">…</span>
            : <button key={o.no} className={o.komsu ? `${stil.sayfa} ${stil.komsu}` : stil.sayfa} type="button" aria-label={`Sayfa ${o.no}`}
                aria-current={o.no === sayfa ? "page" : undefined} onClick={() => git(o.no)}>{o.no}</button>)}
          <button className={stil.sayfa} type="button" aria-label="Sonraki sayfa" disabled={sayfa === n} onClick={() => git(sayfa + 1)}><Ikon ad="chevron-right" kucuk /></button>
        </div>
      )}
    </nav>
  );
}

export interface Sayfa extends SayfaHesabi {
  /** sayfaya git (sayfa sayısıyla sınırlanır) */
  git: (n: number) => void;
  /** genel sırası i (0'dan) olan satırın sayfasına git */
  satiraGit: (i: number) => void;
  /** dizinin bu sayfadaki öğeleri (genel sıra = bas + sayfadaki sıra) */
  dilim: <T>(l: readonly T[]) => T[];
}

export interface SayfaSecenegi {
  /** sayfa boyu (verilmezse kalip.ts sayfa.tablo) */
  boy?: number;
  /** üst bileşenin tuttuğu sayfa (degistir ile birlikte) — açılacak sayfaya üst bileşen karar verir; akis / anahtar / ac yalnız kendi durumunda */
  deger?: number;
  degistir?: (n: number) => void;
  /** satır eklenince eklenen ilk satırın sayfası açılır (yazılan listeler; okunan listede yeni kayıt sıralamaya göre yer alır — kapalı) */
  akis?: boolean;
  /** veri kümesinin kimliği: değişince 1. sayfa (yeni dosya, arama / sekme, yeniden açılan pencerenin listesi — Object.is ile karşılaştırılır) */
  anahtar?: unknown;
  /** genel sırası verilen öğenin (0'dan) sayfası açılır — açılışta ve değer değişince (null / -1: yok); ör. eklenen kaydın, seçili öğenin sayfası */
  ac?: number | null;
}

export function useSayfa(toplam: number, o: SayfaSecenegi = {}): Sayfa {
  const boy = o.boy ?? TABLO_SAYFA, disari = o.degistir, akis = !!o.akis, ac = o.ac ?? null;
  const acSayfasi = (a: number | null) => (a !== null && a >= 0 ? satirSayfasi(a, boy) : null);
  const [ic, setIc] = useState(() => acSayfasi(ac) ?? 1);
  /* kendi durumunda: satır sayısı, anahtar ya da açılacak öğe değişince sayfa ÇİZİMDE düzeltilir (React: önceki çizimin bilgisini durumda tutmak) —
     eklenen satır aynı çizimde görünür, odak hemen verilebilir */
  const [once, setOnce] = useState({ toplam, anahtar: o.anahtar, ac });
  let istenen = disari ? o.deger ?? 1 : ic;
  if (!disari && (once.toplam !== toplam || !Object.is(once.anahtar, o.anahtar) || once.ac !== ac)) {
    let y = ic;
    if (!Object.is(once.anahtar, o.anahtar)) y = 1;
    else if (once.toplam !== toplam && akis) y = degisenSayfa(once.toplam, toplam, ic, boy);
    if (ac !== once.ac) y = acSayfasi(ac) ?? y;
    y = sayfaHesapla(toplam, y, boy).sayfa;
    setOnce({ toplam, anahtar: o.anahtar, ac });
    if (y !== ic) setIc(y);
    istenen = y;
  }
  const h = sayfaHesapla(toplam, istenen, boy);
  /* üst bileşenin durumunda: sayfa sayısını aşan değer (satır silindi) üst bileşene düzeltilmiş yazılır — çizimden sonra, ekrana basılmadan (üst
     bileşen çizim sırasında değiştirilemez; ekrana zaten sınırlı sayfa çizilir) */
  useLayoutEffect(() => { if (disari && h.sayfa !== istenen) disari(h.sayfa); }, [disari, h.sayfa, istenen]);
  const git = (n: number) => {
    const y = sayfaHesapla(toplam, n, boy).sayfa;
    if (disari) disari(y); else setIc(y);
  };
  return { ...h, git, satiraGit: (i) => git(satirSayfasi(i, boy)), dilim: (l) => sayfaDilimi(l, h) };
}

/** useSayfa'nın sayfa tuşları; 20 ve altı satırda (sayfa boyunu aşmayan) çizilmez. ad: gezinme bölgesinin adı ("<ad> sayfaları"); sayfa bilgisi
    canlı bölge — sayfa kendiliğinden değişince (akış, eksiğe git, S.A.Y'ın yazdığı satır) ekran okuyucu duyar */
export function TabloSayfalari({ s, ad }: { s: Sayfa; ad: string }) {
  if (!s.sayfali) return null;
  return <Sayfalayici birim={ad} toplam={s.toplam} boy={s.boy} sayfa={s.sayfa} degistir={s.git} canli />;
}

/** sayfalı ul / ol: öğeler dizi (her biri kendi anahtarıyla); sirali'da numara genel (start) — sunucu bileşeni de öğeleri çizip verebilir.
    anahtar / ac: useSayfa'nınki (veri kümesi değişince 1. sayfa · verilen sıradaki öğenin sayfası) */
export function SayfaliListe({ ad, ogeler, sirali = false, className, anahtar, ac, ...ek }: {
  /** listenin erişilebilir adı (aria-label) ve sayfalayıcının adı */
  ad: string; ogeler: readonly ReactNode[]; sirali?: boolean; className?: string; anahtar?: unknown; ac?: number | null;
} & Omit<HTMLAttributes<HTMLElement>, "children" | "className">) {
  const s = useSayfa(ogeler.length, { anahtar, ac });
  const gorunen = s.dilim(ogeler);
  return (
    <>
      {sirali
        ? <ol className={className} aria-label={ad} start={s.bas + 1} {...ek}>{gorunen}</ol>
        : <ul className={className} aria-label={ad} {...ek}>{gorunen}</ul>}
      <TabloSayfalari s={s} ad={ad} />
    </>
  );
}
