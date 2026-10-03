/* SÜZGEÇ — saf mantık (React'siz; birim testi tests/suzgec.test.ts). Maketteki tek üreticinin (docs/assets/maket-ortak.js "SÜZGEÇ",
   MK.taban / cipGecer / imkansiz / listeCiz / sayfalayici) birebir karşılığı; ekran FiltreSatiri + Liste'de (kalıp 15).
   · alan alan arama kutuları varsa genel arama yok (pkproje §3.8 kural 6);
   · çip sayıları çipler HARİÇ her şey uygulanmış listeden (dürüst sayaç, anayasa 2.8);
   · aynı gruptan iki çip "ve" ile seçilince sonuç imkânsızdır, sebebi söylenir (kalıp 8);
   · başlangıç değeri (bas) taşıyan seçici GÖRÜNÜM ANAHTARIDIR, sıralama da süzgeç değildir: ikisi sayılmaz, Temizle onları sıfırlamaz. */

export type Secenek = readonly [deger: string, etiket: string];

export interface Cip<K> { k: string; ad: string; grup?: string; test: (kayit: K) => boolean }
export interface Secici<K> {
  k: string; ad: string;
  secenek: () => readonly Secenek[];
  gecer: (kayit: K, deger: string) => boolean;
  /** başlangıç değeri: verilirse görünüm anahtarı (süzgeç sayılmaz) */
  bas?: string;
  /** sıralama seçicisi: değer "varsayilan" ya da "<sütun>-artan|azalan" (yalnız kart kipinde satırda görünür) */
  siralama?: boolean;
}
export interface AlanArama<K> { k: string; ad: string; ipucu?: string; metin: (kayit: K) => string }

export interface SuzgecTanimi<K> {
  /** genel arama kutusunun erişilebilir adı (ör. "Planlarda ara") */
  ad: string;
  ipucu: string;
  /** sayaçta ve boş durumda kayıt adı (ör. "plan") */
  birim: string;
  cipler: readonly Cip<K>[];
  seciciler: readonly Secici<K>[];
  metin: (kayit: K) => string;
  /** imkânsız çip birleşiminin sebebi (ör. "Bir plan aynı anda iki durumda olamaz") */
  imkansiz: string;
  alanlar?: readonly AlanArama<K>[];
  /** sayfa boyu (kalip.ts sayfa); verilmezse sayfalama yok (kalıp 10) */
  sayfa?: number;
  /** sıralama anahtarları: sütun → karşılaştırılan değer */
  siraAnahtari?: Record<string, (kayit: K) => string | number>;
  /** "varsayilan" sıralama (verilmezse kayıt sırası) */
  varsayilanSira?: (a: K, b: K) => number;
}

export interface SuzgecDurumu {
  ara: string;
  secili: string[];
  kip: "veya" | "ve";
  sec: Record<string, string>;
  sayfa: number;
  alan: Record<string, string>;
}

export const tr = (s: string) => String(s).toLocaleLowerCase("tr");

export function yeniDurum<K>(t: SuzgecTanimi<K>): SuzgecDurumu {
  const sec: Record<string, string> = {};
  for (const x of t.seciciler) sec[x.k] = x.siralama ? "varsayilan" : x.bas ?? "tumu";
  const alan: Record<string, string> = {};
  for (const x of t.alanlar ?? []) alan[x.k] = "";
  return { ara: "", secili: [], kip: "veya", sec, sayfa: 1, alan };
}

/** Temizle: sıralama ve görünüm anahtarı kalır, gerisi başa döner */
export function temizle<K>(t: SuzgecTanimi<K>, d: SuzgecDurumu): SuzgecDurumu {
  const y = yeniDurum(t);
  for (const x of t.seciciler) if (x.siralama || x.bas) y.sec[x.k] = d.sec[x.k];
  return y;
}

export const aktifSecici = <K>(t: SuzgecTanimi<K>, d: SuzgecDurumu) =>
  t.seciciler.filter((x) => !x.siralama && !x.bas && d.sec[x.k] !== "tumu").length;
const alanSay = (d: SuzgecDurumu) => Object.values(d.alan).filter((v) => v.trim()).length;

/** uygulanan süzgeç sayısı (kutunun başlığında "N filtre uygulandı") */
export const uygulanan = <K>(t: SuzgecTanimi<K>, d: SuzgecDurumu) =>
  (d.ara.trim() ? 1 : 0) + d.secili.length + aktifSecici(t, d) + alanSay(d);
export const suzgecVar = <K>(t: SuzgecTanimi<K>, d: SuzgecDurumu) => uygulanan(t, d) > 0;

/** çipler HARİÇ her şey uygulanmış liste — çip sayıları buradan */
export function taban<K>(t: SuzgecTanimi<K>, d: SuzgecDurumu, kayitlar: readonly K[]): K[] {
  const a = tr(d.ara.trim());
  return kayitlar.filter((k) => {
    if (a && !tr(t.metin(k)).includes(a)) return false;
    for (const x of t.alanlar ?? []) {
      const v = tr((d.alan[x.k] ?? "").trim());
      if (v && !tr(x.metin(k)).includes(v)) return false;
    }
    return t.seciciler.every((x) => x.gecer(k, d.sec[x.k]));
  });
}

export function cipGecer<K>(t: SuzgecTanimi<K>, d: SuzgecDurumu, k: K): boolean {
  if (!d.secili.length) return true;
  const sonuc = d.secili.map((c) => t.cipler.find((x) => x.k === c)?.test(k) ?? false);
  return d.kip === "ve" ? sonuc.every(Boolean) : sonuc.some(Boolean);
}

export function imkansiz<K>(t: SuzgecTanimi<K>, d: SuzgecDurumu): boolean {
  if (d.kip !== "ve") return false;
  const gruplar: Record<string, number> = {};
  for (const c of d.secili) {
    const g = t.cipler.find((x) => x.k === c)?.grup;
    if (g) gruplar[g] = (gruplar[g] ?? 0) + 1;
  }
  return Object.values(gruplar).some((n) => n >= 2);
}

/** sıralama değeri döngüsü (sütun başlığı): artan → azalan → varsayılan */
export function siraSonraki(mevcut: string, sutun: string): string {
  return mevcut === `${sutun}-artan` ? `${sutun}-azalan` : mevcut === `${sutun}-azalan` ? "varsayilan" : `${sutun}-artan`;
}

function sirala<K>(t: SuzgecTanimi<K>, deger: string | undefined, liste: K[]): K[] {
  if (!deger || deger === "varsayilan") return t.varsayilanSira ? [...liste].sort(t.varsayilanSira) : liste;
  const [sutun, yon] = deger.split("-");
  const anahtar = t.siraAnahtari?.[sutun];
  if (!anahtar) return liste;
  const carpan = yon === "azalan" ? -1 : 1;
  return [...liste].sort((a, b) => {
    const x = anahtar(a), y = anahtar(b);
    const f = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), "tr", { numeric: true });
    return f * carpan;
  });
}

export type ListeHali = "veri-yok" | "gorunum-bos" | "imkansiz" | "suzgec-bos" | "dolu";

export interface ListeSonucu<K> {
  /** çip sayıları için taban */
  tb: K[];
  /** süzgeçten geçen, sıralı, sayfalanmamış */
  liste: K[];
  /** sayfadaki kayıtlar */
  gorunen: K[];
  /** görünüm anahtarının içindeki toplam (sayaç paydası) */
  toplam: number;
  /** geçerli sayfa (sayfa sayısını aşarsa sona çekilir) ve sayfa sayısı */
  sayfa: number;
  sayfaSayisi: number;
  hal: ListeHali;
}

export function listele<K>(t: SuzgecTanimi<K>, d: SuzgecDurumu, kayitlar: readonly K[]): ListeSonucu<K> {
  const tb = taban(t, d, kayitlar);
  const sira = t.seciciler.find((x) => x.siralama);
  const liste = sirala(t, sira ? d.sec[sira.k] : undefined, tb.filter((k) => cipGecer(t, d, k)));
  /* dürüst sayaç: toplam görünüm anahtarının (bas'lı seçici) İÇİNDEKİ kayıtlar (maket 2026-09-24: ayrılan kişi de sayılıyordu) */
  const gorunum = t.seciciler.filter((x) => x.bas);
  const toplam = kayitlar.filter((k) => gorunum.every((x) => x.gecer(k, d.sec[x.k]))).length;
  const boy = t.sayfa;
  const sayfaSayisi = boy ? Math.max(1, Math.ceil(liste.length / boy)) : 1;
  const sayfa = Math.min(Math.max(1, d.sayfa), sayfaSayisi);
  const gorunen = boy ? liste.slice((sayfa - 1) * boy, sayfa * boy) : liste;
  const hal: ListeHali = !kayitlar.length ? "veri-yok" : !toplam ? "gorunum-bos" : liste.length ? "dolu" : imkansiz(t, d) ? "imkansiz" : "suzgec-bos";
  return { tb, liste, gorunen, toplam, sayfa, sayfaSayisi, hal };
}

/** sayfa tuşları: 7'den fazla sayfada ilk · … · bulunulan ±1 · … · son; komşular telefonda gizlenir (maket 2026-09-24) */
export type SayfaOgesi = { tur: "sayfa"; no: number; komsu: boolean } | { tur: "ara"; no: number };
export function sayfaOgeleri(n: number, sayfa: number): SayfaOgesi[] {
  const goster = (i: number) => n <= 7 || i === 1 || i === n || Math.abs(i - sayfa) <= 1;
  const sonuc: SayfaOgesi[] = [];
  for (let i = 1; i <= n; i++) {
    if (goster(i)) sonuc.push({ tur: "sayfa", no: i, komsu: n > 7 && Math.abs(i - sayfa) === 1 && i !== 1 && i !== n });
    else if (goster(i - 1)) sonuc.push({ tur: "ara", no: i });
  }
  return sonuc;
}
