/* FORMÜL (495; hata listesi 29 + 46 maketi onaylı — reisim 2026-10-11: "isteyenin istediği gibi bir şey yapabileceği bir sistem") — saf. Firmanın
   KENDİ hesabı; motor (değerlendir), belge (PDF) ve saha ekranı aynı formulUygula'yla çalışır; kaydedilen cevaplarda hesap yok (her açılışta yeniden).
   552 (reisim 2026-10-14: "RCa=480/RCd"): yazıldığı gibi de kabul — boşluksuz ad köşeli parantezsiz, baştaki "Ad =" ya da "=" atılır; kurucu
   kaydederken formulDuzelt ile köşeli parantezli biçime çevirir (ad değişince formüldeki adı da değişsin).
   556 (sunum 556 · 2. tur onaylı — reisim 2026-10-14: "hesaplama tuşu her kutucukta olmalı", "istediğim hesabı istediğim gibi yapabilmeliyim
   kısıtlama olmamalı", "görüntüdeki gibi değiştirilemez olmasın", "ileride yapılacak olan formlarda da olmalı"):
   · formül HER KUTUDA: bilgi alanı (her tür; kayıttan gelen ve ekipman bilgisi dahil), tablo sütunu, test değeri, kontrol maddesinin cevabı;
   · dil Excel gibi: + − × ÷ ^ %, parantez, karşılaştırma (= <> < > <= >=), yazı ("…") ve birleştirme (&), DOĞRU / YANLIŞ; işlevler Excel'in
     işlevleri, Türkçe ya da İngilizce adıyla (./excel.ts — 373 işlev), ayraç ";" (sayının içinde olmayan "," de);
   · adlar formatın her kutusu: bilgi alanı, test değeri, madde metni (cevabı), tablo sütunu (tabloda o satır; tablo dışında ya da SÜTUN([Ad]) ile
     bütün satırlar), tablo adı (DÜŞEYARA için satırlar × sütunlar); büyük / küçük harf önemsiz;
   · ELLE YAZILAN KALIR: kutunun kendi değeri (sahada yazılan) varsa o; boşsa formül; kayıttan gelen kutuda formül boşsa kayıttaki; ekipman
     bilgisinde ekipman bilgisi boşsa formül;
   · hesaplanamayan (boş girdi, sıfıra bölme, hata değeri, döngü) kutu boş kalır — eksik sayılmaz.
   eval YOK — küçük özyinelemeli çözücü; işlevleri kitaplık hesaplar.
   2026-10-16 (pkproje §9 "SONUÇ KURALI FORMAT YAPICIDA" — reisim: "kurala göre otomatik uygun uygun değil diyor … koda gömülmüş gibi"): ölçüm
   tablosunun sonuç kuralları da bu dille (src/format/sonuc.ts) — satirHesabi satırın bağlamında hesaplar (sayı kutusunda sayı olmayan yazı boş
   sayılır: Bakanlık hesaplarının "sayı değilse değerlendirilmez" kuralı); probata işlevi ZS (ZPKK01 Zs — OZEL_ISLEVLER); çözülen formül önbellekte. */
import { excelCagir, islevAdi, islevYazimi } from "./excel.ts";
import { EGRI_KAT, UO } from "./hesap.ts";
import type { BolumOf, Cevaplar, FormatTanimi } from "./tanim.ts";
/* 2026-10-24: serbest tablonun formüllü hücreleri sanal bölümlerinden (alan, çoğalan satır sütunu) */
import { sahaTanimi } from "./tablo.ts";

/** formülün en çok uzunluğu (tanim.ts şeması ile aynı) */
export const FORMUL_EN_UZUN = 2_000;
/** formül zinciri en çok bu kadar derin (döngü değil, yığın güvenliği) */
const DERINLIK = 50;

/* ── dil ── */
type Jeton = { t: "sayi"; v: number } | { t: "yazi"; v: string } | { t: "ad"; v: string; koseli: boolean } | { t: "islev"; v: string } | { t: "op"; v: string };
type Dugum =
  | { k: "n"; v: number } | { k: "s"; v: string } | { k: "b"; v: boolean } | { k: "ad"; v: string }
  | { k: "eksi" | "%"; a: Dugum } | { k: "&" | "+" | "-" | "*" | "/" | "^"; a: Dugum; b: Dugum } | { k: "kar"; o: string; a: Dugum; b: Dugum }
  | { k: "f"; ad: string; arg: Dugum[] };
/** değer: sayı, yazı, mantık, tarih, boş; sütun / tablo dizi */
export type Deger = number | string | boolean | Date | null | readonly Deger[];

/** 552: baştaki "Ad =" ya da "=" atılır (formülün gövdesi) — ">=", "<=", "==" değil */
const ONEK = /^\s*(?:\[[^\]]*\]|[\p{L}_][\p{L}\p{N}_.]*)?\s*=(?![=><])/u;
const govde = (ifade: string) => { const m = ONEK.exec(ifade); return m ? ifade.slice(m[0].length) : ifade; };
const HARF = /[\p{L}_]/u, AD_HARFI = /[\p{L}\p{N}_.]/u;

function jetonla(ifade: string): Jeton[] {
  const s = govde(ifade).replace(/×/g, "*").replace(/÷/g, "/").replace(/[−–]/g, "-").replace(/[“”„]/g, "\"").replace(/≤/g, "<=").replace(/≥/g, ">=").replace(/≠/g, "<>");
  const l: Jeton[] = [];
  for (let i = 0; i < s.length;) {
    const c = s[i];
    if (/\s/.test(c)) { i++; continue; }
    if (c === "[") {
      const j = s.indexOf("]", i);
      if (j < 0) throw new Error("“]” eksik");
      const ad = s.slice(i + 1, j).trim();
      if (!ad) throw new Error("boş ad: []");
      l.push({ t: "ad", v: ad, koseli: true }); i = j + 1; continue;
    }
    if (c === "\"") {
      const j = s.indexOf("\"", i + 1);
      if (j < 0) throw new Error("tırnak kapanmadı");
      l.push({ t: "yazi", v: s.slice(i + 1, j) }); i = j + 1; continue;
    }
    if (/[0-9]/.test(c)) {
      let j = i;
      while (j < s.length && /[0-9]/.test(s[j])) j++;
      if ((s[j] === "," || s[j] === ".") && /[0-9]/.test(s[j + 1] ?? "")) { j++; while (j < s.length && /[0-9]/.test(s[j])) j++; }
      l.push({ t: "sayi", v: Number.parseFloat(s.slice(i, j).replace(",", ".")) }); i = j; continue;
    }
    const iki = s.slice(i, i + 2);
    if (iki === "<=" || iki === ">=" || iki === "<>") { l.push({ t: "op", v: iki }); i += 2; continue; }
    if (c === ",") { l.push({ t: "op", v: ";" }); i++; continue; }   // sayının içinde olmayan virgül ayraç
    if ("+-*/^%&=<>();".includes(c)) { l.push({ t: "op", v: c }); i++; continue; }
    /* 552: boşluksuz ad köşeli parantezsiz (RCd, Icu); ardından "(" geliyorsa işlev (EĞER, TOPLA.ÇARPIM) */
    if (HARF.test(c)) {
      let j = i;
      while (j < s.length && AD_HARFI.test(s[j])) j++;
      let k = j;
      while (k < s.length && /\s/.test(s[k])) k++;
      l.push(s[k] === "(" ? { t: "islev", v: s.slice(i, j) } : { t: "ad", v: s.slice(i, j), koseli: false });
      i = j; continue;
    }
    throw new Error(`“${c}” anlaşılmadı`);
  }
  if (!l.length) throw new Error("formül boş");
  return l;
}

const KARSILASTIRMA = ["=", "<>", "<", ">", "<=", ">="];
/** SÜTUN([Ad]): tablonun bütün satırları (tablonun içindeki formülde bile) */
const SUTUN_ISLEVI = "SÜTUN";
function coz(ifade: string): Dugum {
  const l = jetonla(ifade);
  let p = 0;
  const op = (v: string) => { const j = l[p]; return !!j && j.t === "op" && j.v === v; };
  const kok = (): Dugum => {
    const a = birles(), j = l[p];
    if (j && j.t === "op" && KARSILASTIRMA.includes(j.v)) { p++; return { k: "kar", o: j.v, a, b: birles() }; }
    return a;
  };
  const birles = (): Dugum => { let a = topla(); while (op("&")) { p++; a = { k: "&", a, b: topla() }; } return a; };
  const topla = (): Dugum => { let a = carp(); while (op("+") || op("-")) { const o = (l[p++] as { v: "+" | "-" }).v; a = { k: o, a, b: carp() }; } return a; };
  const carp = (): Dugum => { let a = us(); while (op("*") || op("/")) { const o = (l[p++] as { v: "*" | "/" }).v; a = { k: o, a, b: us() }; } return a; };
  const us = (): Dugum => { const a = tekli(); if (op("^")) { p++; return { k: "^", a, b: us() }; } return a; };
  const tekli = (): Dugum => {
    if (op("-")) { p++; return { k: "eksi", a: tekli() }; }
    if (op("+")) { p++; return tekli(); }
    let a = oge();
    while (op("%")) { p++; a = { k: "%", a }; }
    return a;
  };
  const oge = (): Dugum => {
    const j = l[p++];
    if (!j) throw new Error("formül yarım kaldı");
    if (j.t === "sayi") return { k: "n", v: j.v };
    if (j.t === "yazi") return { k: "s", v: j.v };
    if (j.t === "ad") {
      const u = j.v.toLocaleUpperCase("tr");
      if (!j.koseli && (u === "DOĞRU" || j.v.toUpperCase() === "TRUE")) return { k: "b", v: true };
      if (!j.koseli && (u === "YANLIŞ" || j.v.toUpperCase() === "FALSE")) return { k: "b", v: false };
      return { k: "ad", v: j.v };
    }
    if (j.t === "islev") {
      const sutun = j.v.toLocaleUpperCase("tr") === SUTUN_ISLEVI || j.v.toUpperCase() === "SUTUN";
      const ad = sutun ? SUTUN_ISLEVI : ozelIslevAdi(j.v) ?? islevAdi(j.v);
      if (!ad) throw new Error(`“${j.v}” adında işlev yok`);
      p++;   // "("
      const arg: Dugum[] = [];
      if (!op(")")) { arg.push(kok()); while (op(";")) { p++; arg.push(kok()); } }
      if (!op(")")) throw new Error("parantez kapanmadı");
      p++;
      if (sutun && (arg.length !== 1 || arg[0].k !== "ad")) throw new Error("SÜTUN bir tablo sütununun adını ister: SÜTUN([Direnç])");
      return { k: "f", ad, arg };
    }
    if (j.v === "(") {
      const a = kok();
      if (!op(")")) throw new Error("parantez kapanmadı");
      p++;
      return a;
    }
    throw new Error(`“${j.v === "*" ? "×" : j.v === "/" ? "÷" : j.v}” yanlış yerde`);
  };
  const d = kok();
  if (p !== l.length) {
    /* 552: art arda iki ad = boşluklu ad parantezsiz yazılmış ("RCD testi") */
    const a = l[p - 1], b = l[p];
    if (a?.t === "ad" && b.t === "ad") throw new Error(`boşluklu ad köşeli parantezle yazılır: [${a.v} ${b.v}…]`);
    throw new Error(op(")") ? "fazladan “)”" : "fazladan işaret");
  }
  return d;
}
const adlari = (d: Dugum, l: string[] = []): string[] => {
  if (d.k === "ad") l.push(d.v);
  if ("a" in d) adlari(d.a, l);
  if ("b" in d) adlari(d.b, l);
  if (d.k === "f") for (const x of d.arg) adlari(x, l);
  return l;
};
/** çözülen formüller (aynı formül her satırda, her değerlendirmede yeniden çözülmesin — ağaç değişmez); hata da saklanır */
const COZUM = new Map<string, Dugum | Error>();
function cozulen(ifade: string): Dugum {
  let d = COZUM.get(ifade);
  if (d === undefined) {
    try { d = coz(ifade); } catch (e) { d = e instanceof Error ? e : new Error(String(e)); }
    if (COZUM.size >= 2_000) COZUM.clear();
    COZUM.set(ifade, d);
  }
  if (d instanceof Error) throw d;
  return d;
}

/* ── probata işlevleri (Excel'de olmayan, Bakanlık kriterlerinin hesabı) ── */
/** ZS(eğri; In): ZPKK01 çevrim empedansı sınırı Zs = Uo ÷ Ia, Ia = eğri çarpanı × In (B 5 · C 10 · D 15; başka eğri 10); In sayı değilse ya da
    Ia sıfırsa 0 — Bakanlık hesabının (hesap.ts noktaHesap) aynısı, 3 ondalık */
function zs(a: readonly Deger[]): Deger {
  if (a.some((x) => Array.isArray(x))) throw new FormulHatasi("ZS bir eğri ve bir In ister: ZS([Açma eğrisi]; [In])");
  const egri = typeof a[0] === "string" ? a[0] : "";
  const kat = Object.hasOwn(EGRI_KAT, egri) ? EGRI_KAT[egri] : 10;
  const In = sayiMi((a[1] ?? null) as Deger);
  const ia = kat * (In ?? 0);
  return ia > 0 ? Math.round((UO / ia) * 1000) / 1000 : 0;
}
const OZEL_ISLEVLER: Readonly<Record<string, (a: readonly Deger[]) => Deger>> = Object.freeze({ ZS: zs });
/** probata işlevlerinin adları ve kısa tarifleri (kurucuda işlev listesinde) */
export const OZEL_ISLEV_TARIFI: Readonly<Record<string, string>> = Object.freeze({
  ZS: `ZS(eğri; In) — Zs = ${UO} V ÷ (eğri çarpanı × In); B 5, C 10, D 15 (ZPKK01)`,
});
const ozelIslevAdi = (yazilan: string): string | null => {
  const u = yazilan.toLocaleUpperCase("tr");
  return Object.hasOwn(OZEL_ISLEVLER, u) ? u : null;
};

/* ── değerler ── */
const anahtar = (s: string) => s.trim().toLocaleLowerCase("tr");
/** sonucun yazımı: en çok 3 ondalık, ondalık virgül */
export const formulYazimi = (v: number) => String(Math.round(v * 1000) / 1000).replace(".", ",");
const SAYI = /^[-+]?\d+([.,]\d+)?$/;
const sayiMi = (v: Deger): number | null => {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "boolean") return v ? 1 : 0;
  if (typeof v === "string") { const t = v.replace(/\s/g, ""); return SAYI.test(t) ? Number(t.replace(",", ".")) : null; }
  return null;
};
const iki = (n: number) => String(n).padStart(2, "0");
const isoTarih = (d: Date) => `${d.getFullYear()}-${iki(d.getMonth() + 1)}-${iki(d.getDate())}`;
const tarihYazimi = (d: Date) => `${iki(d.getDate())}.${iki(d.getMonth() + 1)}.${d.getFullYear()}`;
function tarihOku(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s) ?? null, n = m ? null : /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(s.trim());
  const y = m ? +m[1] : n ? +n[3] : NaN, a = m ? +m[2] : n ? +n[2] : NaN, g = m ? +m[3] : n ? +n[1] : NaN;
  if (!Number.isFinite(y)) return null;
  const d = new Date(y, a - 1, g);
  return d.getFullYear() === y && d.getMonth() === a - 1 && d.getDate() === g ? d : null;
}
const bosMu = (v: Deger | undefined) => v === null || v === undefined || v === "" || (Array.isArray(v) && !v.length);
/** değerin yazıyla gösterimi */
export function metne(v: Deger): string {
  if (v === null) return "";
  if (typeof v === "number") return formulYazimi(v);
  if (typeof v === "boolean") return v ? "DOĞRU" : "YANLIŞ";
  if (v instanceof Date) return tarihYazimi(v);
  if (Array.isArray(v)) return v.map(metne).filter(Boolean).join(", ");
  return String(v);
}

/* ── hesap ── */
const DIZI = "tablo sütunu burada bir işlevin içinde yazılır: TOPLA([Direnç])";
class FormulHatasi extends Error {}
interface Bag {
  /** adın değeri (satir: tablodaki satır ya da null); undefined: öyle bir ad yok */
  ad(ad: string, satir: number | null): Deger | undefined;
  /** tablo sütununun bütün satırları; sütun değilse null */
  sutun(ad: string): Deger[] | null;
  satir: number | null;
}
function aritmetik(o: "+" | "-" | "*" | "/" | "^", a: Deger, b: Deger): Deger {
  if (Array.isArray(a) || Array.isArray(b)) throw new FormulHatasi(DIZI);
  if (bosMu(a) || bosMu(b)) return null;
  if (a instanceof Date || b instanceof Date) {
    const gun = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + Math.round(n));
    if (o === "+" && a instanceof Date && !(b instanceof Date)) { const n = sayiMi(b); return n === null ? null : gun(a, n); }
    if (o === "+" && b instanceof Date && !(a instanceof Date)) { const n = sayiMi(a); return n === null ? null : gun(b, n); }
    if (o === "-" && a instanceof Date && b instanceof Date) return Math.round((a.getTime() - b.getTime()) / 864e5);
    if (o === "-" && a instanceof Date) { const n = sayiMi(b); return n === null ? null : gun(a, -n); }
    return null;
  }
  const x = sayiMi(a), y = sayiMi(b);
  if (x === null || y === null) return null;
  const r = o === "+" ? x + y : o === "-" ? x - y : o === "*" ? x * y : o === "/" ? (y === 0 ? Number.NaN : x / y) : x ** y;
  return Number.isFinite(r) ? r : null;
}
function karsilastir(o: string, a: Deger, b: Deger): Deger {
  if (Array.isArray(a) || Array.isArray(b)) throw new FormulHatasi(DIZI);
  if (bosMu(a) || bosMu(b)) return null;
  let x: number | string, y: number | string;
  if (a instanceof Date && b instanceof Date) { x = a.getTime(); y = b.getTime(); }
  else if (sayiMi(a) !== null && sayiMi(b) !== null) { x = sayiMi(a)!; y = sayiMi(b)!; }
  else { x = anahtar(metne(a)); y = anahtar(metne(b)); }
  return o === "=" ? x === y : o === "<>" ? x !== y : o === "<" ? x < y : o === ">" ? x > y : o === "<=" ? x <= y : x >= y;
}
/** işleve giden değer: boş null; yazıdaki sayı sayı (Excel hücresi gibi); dizi içi aynı */
const excelDegeri = (v: Deger): unknown => (Array.isArray(v) ? v.map(excelDegeri) : typeof v === "string" && sayiMi(v) !== null ? sayiMi(v) : v);
/** işlevden gelen değer */
function islevDegeri(r: unknown): Deger {
  if (r === null || r === undefined) return null;
  if (typeof r === "number") return Number.isFinite(r) ? r : null;
  if (typeof r === "string" || typeof r === "boolean" || r instanceof Date) return r;
  if (Array.isArray(r)) return r.map(islevDegeri);
  return null;
}
function hesapla(d: Dugum, bag: Bag): Deger {
  switch (d.k) {
    case "n": case "s": case "b": return d.v;
    case "ad": {
      const v = bag.ad(d.v, bag.satir);
      if (v === undefined) throw new BilinmeyenAd(d.v);
      return v;
    }
    case "eksi": { const a = hesapla(d.a, bag); if (Array.isArray(a)) throw new FormulHatasi(DIZI); const n = sayiMi(a); return bosMu(a) || n === null ? null : -n; }
    case "%": { const a = hesapla(d.a, bag); if (Array.isArray(a)) throw new FormulHatasi(DIZI); const n = sayiMi(a); return bosMu(a) || n === null ? null : n / 100; }
    case "&": return metne(hesapla(d.a, bag)) + metne(hesapla(d.b, bag));
    case "kar": return karsilastir(d.o, hesapla(d.a, bag), hesapla(d.b, bag));
    case "f": {
      if (d.ad === SUTUN_ISLEVI) {
        const a = d.arg[0] as { v: string };
        const s = bag.sutun(a.v);
        if (!s) throw new FormulHatasi("SÜTUN bir tablo sütununun adını ister: SÜTUN([Direnç])");
        return s;
      }
      const ozel = Object.hasOwn(OZEL_ISLEVLER, d.ad) ? OZEL_ISLEVLER[d.ad] : null;
      if (ozel) return ozel(d.arg.map((x) => hesapla(x, bag)));
      return islevDegeri(excelCagir(d.ad, d.arg.map((x) => excelDegeri(hesapla(x, bag)))));
    }
    default: return aritmetik(d.k as "+" | "-" | "*" | "/" | "^", hesapla(d.a, bag), hesapla(d.b, bag));
  }
}
class BilinmeyenAd extends Error { ad: string; constructor(ad: string) { super(ad); this.ad = ad; } }

/** kurucuda yazarken: yapı hatası, bilinmeyen ad ya da işlev, kendine bakma; null = formül doğru. adlar: formülün başvurabildiği adlar */
export function formulDenet(ifade: string, adlar: readonly string[], kendi?: string): string | null {
  if (ifade.length > FORMUL_EN_UZUN) return `En çok ${FORMUL_EN_UZUN} karakter.`;
  let d: Dugum;
  try { d = cozulen(ifade); } catch (e) { return `Formül anlaşılmadı: ${(e as Error).message}.`; }
  const bilinen = new Set(adlar.map(anahtar));
  const l = adlari(d);
  const yok = l.find((a) => !bilinen.has(anahtar(a)));
  if (yok) return `“${yok}” adında kutu yok — adı aynen yazın (boşluklu adı köşeli parantezle: [RCD testi IΔ]).`;
  if (kendi && l.some((a) => anahtar(a) === anahtar(kendi))) return "Formül kendisine bakamaz.";
  return null;
}
/** formülün başvurduğu adlar (yapı hatasında boş) */
export function formulAdlari(ifade: string): string[] {
  try { return adlari(cozulen(ifade)); } catch { return []; }
}
/** formülü SAYI değerlerle hesaplar (bul: ad → sayı · null boş · undefined yok); sonuç sayı değilse ya da hesaplanamazsa null */
export function formulHesapla(ifade: string, bul: (ad: string) => number | null | undefined): number | null {
  try {
    const v = hesapla(cozulen(ifade), { satir: null, sutun: () => null, ad: (a) => bul(a) });
    return typeof v === "number" ? v : sayiMi(v as Deger);
  } catch { return null; }
}

/* ── formatın kutuları ── */
type Alan = BolumOf<"bilgi">["alanlar"][number];
type DegerT = BolumOf<"test">["degerler"][number];
type Sutun = BolumOf<"olcum">["sutunlar"][number];
type Madde = BolumOf<"liste">["gruplar"][number]["maddeler"][number];
const var_ = (f?: string) => !!f?.trim();
/** formüllü öğe mi (556: her türde) */
export const formulluAlan = (a: Alan) => var_(a.formul);
export const formulluDeger = (d: DegerT) => var_(d.formul);
export const formulluSutun = (s: Sutun) => var_(s.formul);
export const formulluMadde = (m: Madde) => var_(m.formul);
export function formulVar(t0: FormatTanimi): boolean {
  const t = sahaTanimi(t0);
  return t.bolumler.some((b) => (b.blok === "bilgi" && b.alanlar.some(formulluAlan)) || (b.blok === "test" && b.degerler.some(formulluDeger))
    || (b.blok === "olcum" && b.sutunlar.some(formulluSutun)) || (b.blok === "liste" && b.gruplar.some((g) => g.maddeler.some(formulluMadde))));
}

/** formatın genel adları — tablo dışındaki formüllerin başvurabildiği: bilgi alanları, test değerleri, madde metinleri, tablo adları ve sütunları */
export function genelAdlar(t0: FormatTanimi): string[] {
  const t = sahaTanimi(t0);
  return t.bolumler.flatMap((b) => b.blok === "bilgi" ? b.alanlar.map((a) => a.ad) : b.blok === "test" ? b.degerler.map((d) => d.ad)
    : b.blok === "liste" ? b.gruplar.flatMap((g) => g.maddeler.map((m) => m.metin)) : b.blok === "olcum" ? [b.ad, ...b.sutunlar.map((s) => s.ad)] : []);
}
/** tablonun içindeki formülün adları: kendi sütunları (o satır) + genel adlar */
export const tabloAdlari = (t: FormatTanimi, b: BolumOf<"olcum">) => [...b.sutunlar.map((s) => s.ad), ...genelAdlar(t)];

/** kayıttan gelen ve ekipman kaydına bağlı kutuların değerleri (saha ekranı ve belge verir; motor vermez — o kutular boş sayılır) */
export interface FormulEki { kaynak?: Readonly<Partial<Record<string, string | null>>>; ekipman?: Readonly<Record<string, string>> }

/** saklanan yazı → değer (kutunun türüne göre). kati (sonuç kuralı — satirHesabi): sayı kutusunda sayı olmayan yazı BOŞ sayılır (Bakanlık
    hesaplarının "sayı değilse değerlendirilmez" kuralı; yazı karşılaştırması sonucu belirlemesin) */
function okunan(ham: unknown, tur: "sayi" | "metin" | "tarih" | "evet" | "secim" | "coklu", kati = false): Deger {
  if (Array.isArray(ham)) return ham.filter((x): x is string => typeof x === "string");
  if (typeof ham !== "string" || !ham.trim()) return null;
  if (tur === "sayi") return sayiMi(ham) ?? (kati ? null : ham);
  if (tur === "tarih") return tarihOku(ham) ?? ham;
  if (tur === "evet") return ham === "evet" ? true : ham === "hayir" ? false : ham;
  /* yazı kutusundaki tam tarih (14.10.2026 · 2026-10-14) tarih sayılır — Excel hücresi gibi (kayıttan gelen "Kontrol tarihi" + 365) */
  if (TAM_TARIH.test(ham.trim())) return tarihOku(ham.trim()) ?? ham;
  return ham;
}
const TAM_TARIH = /^(\d{1,2}\.\d{1,2}\.\d{4}|\d{4}-\d{2}-\d{2})$/;
/** formülün sonucu → kutuda saklanan biçim; boş / hesaplanamaz null */
function saklanan(v: Deger, tur: "sayi" | "metin" | "tarih" | "evet" | "secim" | "coklu", secenekler: readonly string[] = []): string | string[] | null {
  if (bosMu(v)) return null;
  if (tur === "coklu") {
    const l = (Array.isArray(v) ? v.map(metne) : metne(v).split(/[,;]/)).map((x) => x.trim()).filter(Boolean);
    return l.length ? l.map((x) => secenekler.find((s) => anahtar(s) === anahtar(x)) ?? x) : null;
  }
  if (Array.isArray(v)) return saklanan(metne(v), tur, secenekler);
  if (tur === "sayi") { const n = sayiMi(v); return n !== null ? formulYazimi(n) : metne(v); }
  if (tur === "tarih") { const d = v instanceof Date ? v : typeof v === "string" ? tarihOku(v) : null; return d ? isoTarih(d) : metne(v); }
  if (tur === "evet") { if (typeof v === "boolean") return v ? "evet" : "hayir"; const x = anahtar(metne(v)); return x === "evet" || x === "1" ? "evet" : x === "hayır" || x === "hayir" || x === "0" ? "hayir" : metne(v); }
  if (tur === "secim") { const x = metne(v); return secenekler.find((s) => anahtar(s) === anahtar(x)) ?? x; }
  return metne(v);
}
const alanTuru = (a: Alan): "sayi" | "metin" | "tarih" | "evet" | "secim" | "coklu" => (a.tur === "sayi" || a.tur === "tarih" || a.tur === "evet" || a.tur === "secim" || a.tur === "coklu" ? a.tur : "metin");
const sutunTuru = (s: Sutun): "sayi" | "metin" | "evet" | "secim" => s.giris;
const degerTuru = (d: DegerT): "sayi" | "metin" | "secim" => (d.secenekler?.length ? "secim" : d.metin ? "metin" : "sayi");

/** cevaplara formüllerin değerini yazar — yalnız kutunun kendi değeri BOŞSA (elle yazılan kalır); yeni nesne, formül yoksa aynısı. Kayıttan gelen
    kutunun formülü kayıttaki değerden önce gelir; ekipman bilgisinin formülü yalnız ekipman bilgisi boşsa. Hesaplanamayan kutu boş. */
export function formulUygula(t0: FormatTanimi, c: Cevaplar, ek: FormulEki = {}): Cevaplar {
  if (!formulVar(t0)) return c;
  const t = sahaTanimi(t0);
  const { formulle } = ortamKur(t, c, ek, false);
  /* yalnız boş kutulara yazılır */
  const alan = { ...c.alan }, deger = { ...c.deger }, tablo = { ...c.tablo }, madde = { ...c.madde };
  for (const b of t.bolumler) {
    if (b.blok === "bilgi") for (const a of b.alanlar) {
      if (!formulluAlan(a)) continue;
      if (!a.ekipman && !bosMu(okunan(c.alan[a.id], alanTuru(a)))) continue;
      if (a.ekipman && !bosMu(okunan(ek.ekipman?.[a.ekipman], alanTuru(a)))) continue;
      const v = saklanan(formulle(`a:${a.id}`, a.formul!, null, null), alanTuru(a), a.secenekler);
      if (v === null) delete alan[a.id]; else alan[a.id] = v;
    }
    if (b.blok === "test") for (const d of b.degerler) {
      if (!formulluDeger(d) || !bosMu(okunan(c.deger[d.id], degerTuru(d)))) continue;
      const v = saklanan(formulle(`d:${d.id}`, d.formul!, null, null), degerTuru(d), d.secenekler);
      if (v === null || Array.isArray(v)) delete deger[d.id]; else deger[d.id] = v;
    }
    if (b.blok === "liste") for (const g of b.gruplar) for (const m of g.maddeler) {
      if (!formulluMadde(m) || c.madde[m.id]?.c) continue;
      const v = saklanan(formulle(`m:${m.id}`, m.formul!, null, null), "secim", b.cevaplar);
      if (v === null || Array.isArray(v)) continue;
      madde[m.id] = { ...(c.madde[m.id] ?? {}), c: v };
    }
    if (b.blok === "olcum" && b.sutunlar.some(formulluSutun) && c.tablo[b.id]) {
      tablo[b.id] = c.tablo[b.id].map((s, i) => {
        const y = { ...s };
        for (const x of b.sutunlar) {
          if (!formulluSutun(x) || !bosMu(okunan(s[x.id], sutunTuru(x)))) continue;
          const v = saklanan(formulle(`t:${b.id}:${i}:${x.id}`, x.formul!, i, b), sutunTuru(x), x.secenekler);
          if (v === null || Array.isArray(v)) delete y[x.id]; else y[x.id] = v;
        }
        return y;
      });
    }
  }
  return { ...c, alan, deger, tablo, madde };
}

/** 2026-10-16 (sonuç kuralı — src/format/sonuc.ts): ölçüm tablosu SATIRININ bağlamında formül hesaplayıcısı (aynı satırın sütunları, formatın
    kutuları; kati — sayı kutusunda sayı olmayan yazı boş). c: formüllerin değeri yazılmış cevaplar (formulUygula). Hesaplanamayan formül null. */
export function satirHesabi(t: FormatTanimi, c: Cevaplar, ek: FormulEki = {}): (b: BolumOf<"olcum">, i: number, ifade: string) => Deger {
  const { bagi } = ortamKur(sahaTanimi(t), c, ek, true);
  return (b, i, ifade) => {
    if (!ifade.trim()) return null;
    try { return hesapla(cozulen(ifade), bagi(i, b)); } catch { return null; }
  };
}

/** formatın kutularının değerleri ve formülün ad bağlamı (formulUygula ve satirHesabi ortak): kutunun kendi değeri > formül (> kayıttaki) */
function ortamKur(t: FormatTanimi, c: Cevaplar, ek: FormulEki, kati: boolean) {
  const genel = new Map<string, { tur: "alan"; o: Alan } | { tur: "deger"; o: DegerT } | { tur: "madde"; o: Madde; cevaplar: readonly string[] }>();
  const tablolar = new Map<string, BolumOf<"olcum">>(), sutunlar = new Map<string, { b: BolumOf<"olcum">; s: Sutun }>();
  for (const b of t.bolumler) {
    const koy = (ad: string, x: Parameters<typeof genel.set>[1]) => { if (!genel.has(anahtar(ad))) genel.set(anahtar(ad), x); };
    if (b.blok === "bilgi") for (const a of b.alanlar) koy(a.ad, { tur: "alan", o: a });
    if (b.blok === "test") for (const d of b.degerler) koy(d.ad, { tur: "deger", o: d });
    if (b.blok === "liste") for (const g of b.gruplar) for (const m of g.maddeler) koy(m.metin, { tur: "madde", o: m, cevaplar: b.cevaplar });
    if (b.blok === "olcum") {
      if (!tablolar.has(anahtar(b.ad))) tablolar.set(anahtar(b.ad), b);
      for (const s of b.sutunlar) if (!sutunlar.has(anahtar(s.ad))) sutunlar.set(anahtar(s.ad), { b, s });
    }
  }
  const onbellek = new Map<string, Deger>(), yigin = new Set<string>();
  const formulle = (k: string, f: string, satir: number | null, tablo: BolumOf<"olcum"> | null): Deger => {
    if (onbellek.has(k)) return onbellek.get(k)!;
    if (yigin.has(k) || yigin.size >= DERINLIK) return null;              // döngü ya da çok derin zincir: hesaplanamaz
    yigin.add(k);
    let v: Deger = null;
    try { v = hesapla(cozulen(f), bagi(satir, tablo)); } catch { v = null; } finally { yigin.delete(k); }
    onbellek.set(k, v);
    return v;
  };
  /* kutuların değeri: kendi değeri > formül (> kayıttaki) */
  const alanDegeri = (a: Alan): Deger => {
    if (a.ekipman) {
      const e = okunan(ek.ekipman?.[a.ekipman], alanTuru(a), kati);
      return !bosMu(e) ? e : formulluAlan(a) ? formulle(`a:${a.id}`, a.formul!, null, null) : null;
    }
    const kendi = okunan(c.alan[a.id], alanTuru(a), kati);
    if (!bosMu(kendi)) return kendi;
    const f = formulluAlan(a) ? formulle(`a:${a.id}`, a.formul!, null, null) : null;
    if (!bosMu(f) || !a.kaynak) return f;
    return okunan(ek.kaynak?.[a.kaynak] ?? null, alanTuru(a), kati);
  };
  const degerDegeri = (d: DegerT): Deger => {
    const kendi = okunan(c.deger[d.id], degerTuru(d), kati);
    return !bosMu(kendi) ? kendi : formulluDeger(d) ? formulle(`d:${d.id}`, d.formul!, null, null) : null;
  };
  const maddeDegeri = (m: Madde): Deger => {
    const kendi = c.madde[m.id]?.c;
    return kendi ? kendi : formulluMadde(m) ? formulle(`m:${m.id}`, m.formul!, null, null) : null;
  };
  const hucre = (b: BolumOf<"olcum">, s: Sutun, i: number): Deger => {
    const kendi = okunan(c.tablo[b.id]?.[i]?.[s.id], sutunTuru(s), kati);
    return !bosMu(kendi) ? kendi : formulluSutun(s) ? formulle(`t:${b.id}:${i}:${s.id}`, s.formul!, i, b) : null;
  };
  const sutunDegerleri = (x: { b: BolumOf<"olcum">; s: Sutun }): Deger[] => (c.tablo[x.b.id] ?? []).map((_, i) => hucre(x.b, x.s, i));
  const bagi = (satir: number | null, tablo: BolumOf<"olcum"> | null): Bag => ({
    satir,
    /* SÜTUN([Ad]): önce kendi tablosunun sütunu, yoksa formatın o adlı ilk sütunu */
    sutun: (ad) => {
      const kendi = tablo?.sutunlar.find((s) => anahtar(s.ad) === anahtar(ad));
      const x = kendi && tablo ? { b: tablo, s: kendi } : sutunlar.get(anahtar(ad));
      return x ? sutunDegerleri(x) : null;
    },
    ad: (ad, s) => {
      const a = anahtar(ad);
      /* tabloda: önce aynı satırın sütunu */
      if (tablo && s !== null) { const kol = tablo.sutunlar.find((x) => anahtar(x.ad) === a); if (kol) return hucre(tablo, kol, s); }
      const g = genel.get(a);
      if (g) return g.tur === "alan" ? alanDegeri(g.o) : g.tur === "deger" ? degerDegeri(g.o) : maddeDegeri(g.o);
      const kol = sutunlar.get(a);
      if (kol) return sutunDegerleri(kol);
      const tb = tablolar.get(a);
      if (tb) return (c.tablo[tb.id] ?? []).map((_, i) => tb.sutunlar.map((x) => hucre(tb, x, i)));
      return undefined;
    },
  });
  return { formulle, bagi };
}

/** kutunun yalnız FORMÜLDEN gelen değeri (kendi değeri yokmuş gibi) — sahada kişi yazdığı değeri hesapla aynı yazınca kutu yeniden kendiliğinden olur */
export type FormulYeri = { tur: "alan" | "deger" | "madde"; id: string } | { tur: "hucre"; bolum: string; satir: number; sutun: string };
export function formulDegeri(t: FormatTanimi, c: Cevaplar, yer: FormulYeri, ek: FormulEki = {}): string | string[] | null {
  const disinda = <V>(r: Record<string, V>, k: string) => Object.fromEntries(Object.entries(r).filter(([x]) => x !== k));
  if (yer.tur === "hucre") {
    const h = formulUygula(t, { ...c, tablo: { ...c.tablo, [yer.bolum]: (c.tablo[yer.bolum] ?? []).map((s, i) => (i === yer.satir ? disinda(s, yer.sutun) : s)) } }, ek);
    return h.tablo[yer.bolum]?.[yer.satir]?.[yer.sutun] ?? null;
  }
  if (yer.tur === "alan") return formulUygula(t, { ...c, alan: disinda(c.alan, yer.id) }, ek).alan[yer.id] ?? null;
  if (yer.tur === "deger") return formulUygula(t, { ...c, deger: disinda(c.deger, yer.id) }, ek).deger[yer.id] ?? null;
  return formulUygula(t, { ...c, madde: disinda(c.madde, yer.id) }, ek).madde[yer.id]?.c ?? null;
}

/** 552 → 556: kaydedilecek biçim — "Ad =" atılır, adlar köşeli parantezli, işaretler × ÷ −, ondalık virgül, işlev adı büyük harfli (Türkçesi varsa
    Türkçe), ayraç "; " ("RCa = 480/RCd" → "480 ÷ [RCd]"); anlaşılmayan formül olduğu gibi kalır (kurucu hatayı gösterir) */
export function formulDuzelt(ifade: string): string {
  let l: Jeton[];
  try { l = jetonla(ifade); coz(ifade); } catch { return ifade.trim(); }
  const isaret = (k: number) => { const j = l[k]; return j && j.t === "op" ? j.v : null; };
  /* tekli eksi: başta ya da işaretten / "(" ya da ";"dan sonra gelen "-" */
  const tekliEksi = (k: number) => isaret(k) === "-" && (k === 0 || (isaret(k - 1) !== null && isaret(k - 1) !== ")" && isaret(k - 1) !== "%"));
  const yazim = (j: Jeton, k: number): string => {
    if (j.t === "sayi") return String(j.v).replace(".", ",");
    if (j.t === "yazi") return `"${j.v}"`;
    if (j.t === "islev") { const u = j.v.toLocaleUpperCase("tr"); return u === SUTUN_ISLEVI || j.v.toUpperCase() === "SUTUN" ? SUTUN_ISLEVI : islevYazimi(islevAdi(j.v) ?? u); }
    if (j.t === "ad") {
      const u = j.v.toLocaleUpperCase("tr");
      if (!j.koseli && (u === "DOĞRU" || u === "YANLIŞ" || j.v.toUpperCase() === "TRUE" || j.v.toUpperCase() === "FALSE")) return u === "DOĞRU" || j.v.toUpperCase() === "TRUE" ? "DOĞRU" : "YANLIŞ";
      return `[${j.v}]`;
    }
    void k;
    return j.v === "*" ? "×" : j.v === "/" ? "÷" : j.v === "-" ? "−" : j.v;
  };
  let m = "";
  l.forEach((j, i) => {
    const onceki = l[i - 1];
    const bosluk = i > 0 && isaret(i - 1) !== "(" && isaret(i) !== ")" && isaret(i) !== "%" && isaret(i) !== ";" && !tekliEksi(i - 1)
      && !(j.t === "op" && j.v === "(" && onceki?.t === "islev");
    m += (bosluk ? " " : "") + yazim(j, i);
  });
  return m;
}

/** kurucuda öğenin adı değişince formüllerdeki [eski] → [yeni] (kapsamdaki formüllerde; büyük / küçük harf önemsiz) */
export function formulAdDegistir(f: string, eski: string, yeni: string): string {
  const e = anahtar(eski);
  return f.replace(/\[([^\]]*)\]/g, (tam, ad: string) => (anahtar(ad) === e ? `[${yeni.trim()}]` : tam));
}
