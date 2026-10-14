/* EXCEL İŞLEVLERİ (556; sunum 556 · 2. tur onaylı — reisim 2026-10-14: "istediğim hesabı istediğim gibi yapabilmeliyim kısıtlama olmamalı") — formülün
   işlevleri Excel'in işlevleridir: @formulajs/formulajs (MIT, 4.6.1 — 373 işlev). Bu dosya kitaplığa TEK giriş: Türkçe ad ↔ Excel adı, işlev arama,
   çağrı (hata değeri → boş). Saf; tarayıcı ve sunucu ortak. Kitaplık eval kullanmaz; formülün kendisi src/format/formul.ts'te çözülür (eval yok). */
import * as formulajs from "@formulajs/formulajs";

type Islev = (...arg: unknown[]) => unknown;
const KITAPLIK = formulajs as unknown as Record<string, unknown>;

/** Excel'in Türkçe adları (Türkçe Excel'deki adlar) → kitaplıktaki ad. İngilizce ad da her zaman geçerli. */
export const TR_EN: Readonly<Record<string, string>> = {
  "TOPLA": "SUM", "ORTALAMA": "AVERAGE", "EĞER": "IF", "VE": "AND", "YADA": "OR", "DEĞİL": "NOT", "ÖZELVEYA": "XOR", "ÇOKEĞER": "IFS",
  "EĞERHATA": "IFERROR", "YUVARLA": "ROUND", "YUKARIYUVARLA": "ROUNDUP", "AŞAĞIYUVARLA": "ROUNDDOWN", "TAVANAYUVARLA": "CEILING",
  "TABANAYUVARLA": "FLOOR", "KAREKÖK": "SQRT", "MUTLAK": "ABS", "MAK": "MAX", "MİN": "MIN", "ÇARPIM": "PRODUCT", "KUVVET": "POWER", "ÜS": "EXP",
  "Pİ": "PI", "SİN": "SIN", "RADYAN": "RADIANS", "DERECE": "DEGREES", "TAMSAYI": "INT", "NSAT": "TRUNC", "İŞARET": "SIGN", "ÇARPINIM": "FACT",
  "BÖLÜM": "QUOTIENT", "ETOPLA": "SUMIF", "ÇOKETOPLA": "SUMIFS", "EĞERSAY": "COUNTIF", "ÇOKEĞERSAY": "COUNTIFS", "BAĞ_DEĞ_SAY": "COUNT",
  "BAĞ_DEĞ_DOLU_SAY": "COUNTA", "BOŞLUKSAY": "COUNTBLANK", "EĞERORTALAMA": "AVERAGEIF", "ÇOKEĞERORTALAMA": "AVERAGEIFS", "ÇOKEĞERMAK": "MAXIFS",
  "ÇOKEĞERMİN": "MINIFS", "ORTANCA": "MEDIAN", "STDSAPMA": "STDEV", "BÜYÜK": "LARGE", "KÜÇÜK": "SMALL", "TOPKARE": "SUMSQ", "TOPLA.ÇARPIM": "SUMPRODUCT",
  "YÜZDEBİRLİK": "PERCENTILE", "BİRLEŞTİR": "CONCATENATE", "METNEÇEVİR": "TEXT", "SOLDAN": "LEFT", "SAĞDAN": "RIGHT", "PARÇAAL": "MID",
  "UZUNLUK": "LEN", "BÜYÜKHARF": "UPPER", "KÜÇÜKHARF": "LOWER", "KIRP": "TRIM", "YERİNEKOY": "SUBSTITUTE", "SAYIYAÇEVİR": "VALUE", "YİNELE": "REPT",
  "BUL": "FIND", "MBUL": "SEARCH", "ÖZDEŞ": "EXACT", "TARİH": "DATE", "BUGÜN": "TODAY", "ŞİMDİ": "NOW", "YIL": "YEAR", "AY": "MONTH", "GÜN": "DAY",
  "SAAT": "HOUR", "DAKİKA": "MINUTE", "SERİTARİH": "EDATE", "SERİAY": "EOMONTH", "GÜNSAY": "DAYS", "İŞGÜNÜ": "WORKDAY", "TAMİŞGÜNÜ": "NETWORKDAYS",
  "HAFTANINGÜNÜ": "WEEKDAY", "HAFTASAY": "WEEKNUM", "DÜŞEYARA": "VLOOKUP", "YATAYARA": "HLOOKUP", "İNDİS": "INDEX", "KAÇINCI": "MATCH",
  "ELEMAN": "CHOOSE", "EBOŞSA": "ISBLANK", "ESAYIYSA": "ISNUMBER", "EMETİNSE": "ISTEXT", "DOĞRU": "TRUE", "YANLIŞ": "FALSE",
};
/** Excel adı → Türkçe adı (birden çoksa ilki) */
export const EN_TR: Readonly<Record<string, string>> = Object.fromEntries(Object.entries(TR_EN).reverse().map(([tr, en]) => [en, tr]));
/** kitaplıktaki bütün işlevlerin Excel adları (sıralı) */
export const EXCEL_ISLEVLERI: readonly string[] = Object.keys(KITAPLIK).filter((k) => typeof KITAPLIK[k] === "function" && /^[A-Z][A-Z0-9.]*$/.test(k)).sort();

/** yazılan ad (Türkçe ya da İngilizce, büyük / küçük harf önemsiz) → kitaplıktaki Excel adı; yoksa null */
export function islevAdi(yazilan: string): string | null {
  const tr = yazilan.toLocaleUpperCase("tr"), en = yazilan.toUpperCase();
  for (const a of [TR_EN[tr], TR_EN[en], tr, en]) if (a && typeof KITAPLIK[a] === "function") return a;
  return null;
}
/** işlevin formülde görünen adı: Türkçesi varsa o, yoksa Excel adı */
export const islevYazimi = (excel: string) => EN_TR[excel] ?? excel;

/** işlevi çağırır; hata değeri (#DIV/0!, #VALUE! …), atılan hata ve sonsuz sayı → null (kutu boş kalır) */
export function excelCagir(excel: string, arg: readonly unknown[]): unknown {
  const f = KITAPLIK[excel] as Islev | undefined;
  if (typeof f !== "function") return null;
  let r: unknown;
  try { r = f(...arg); } catch { return null; }
  if (r instanceof Error) return null;
  if (typeof r === "number" && !Number.isFinite(r)) return null;
  return r;
}
