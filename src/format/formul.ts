/* FORMÜL (495; hata listesi 29 + 46 maketi onaylı — reisim 2026-10-11: "isteyenin istediği gibi bir şey yapabileceği bir sistem"; sunum: "yeni bir
   hesap gereken her rapor bugün kod işi") — saf. Firmanın KENDİ hesabı: sayı alanı (bilgi), ölçüm tablosu sütunu ve test değeri bir formülle
   hesaplanır; sahada denetçi yazmaz, kendiliğinden dolar; sınırı varsa Uygun / Uygun değil ondan çıkar (motor aynı sınır kuralıyla).
   · Dil: adlar köşeli parantezle [İlk kalınlık], sayılar (ondalık virgül ya da nokta), + − × ÷ * /, parantez, yüzde (12% = 0,12). eval YOK —
     küçük özyinelemeli çözücü; başka işaret hata.
   · Ad: ölçüm tablosunda AYNI SATIRIN sütunları; test değerinde ve bilgi alanında formatın sayı alanları ve test değerleri (büyük / küçük harf
     önemsiz). Formül formüle bakabilir (en çok 5 kat; döngü hesaplanamaz).
   · Hesaplanamaz (boş değer, sıfıra bölme, bilinmeyen ad): değer boş kalır — sonuç çıkmaz, eksik sayılmaz (girdileri zorunluysa onlar eksik).
   Motor (degerlendir), belge (PDF) ve saha ekranı formulUygula'nın doldurduğu cevaplarla çalışır; kaydedilen cevaplarda hesap yok (her açılışta
   yeniden). Kurucuda formulDenet yazarken söyler; adı değişen öğenin formüllerdeki adı formulAdDegistir'le değişir. */
import { sayiOku } from "./hesap.ts";
import type { BolumOf, Cevaplar, FormatTanimi } from "./tanim.ts";

export const FORMUL_EN_UZUN = 400;
const DERINLIK = 5;
type Jeton = { n: number } | { ad: string } | { o: string };

function jetonla(ifade: string): Jeton[] {
  const s = ifade.replace(/×/g, "*").replace(/÷/g, "/").replace(/[−–]/g, "-");
  const l: Jeton[] = [];
  for (let i = 0; i < s.length;) {
    const c = s[i];
    if (/\s/.test(c)) { i++; continue; }
    if (c === "[") {
      const j = s.indexOf("]", i);
      if (j < 0) throw new Error("“]” eksik");
      const ad = s.slice(i + 1, j).trim();
      if (!ad) throw new Error("boş ad: []");
      l.push({ ad }); i = j + 1; continue;
    }
    if (/[0-9]/.test(c)) {
      let j = i;
      while (j < s.length && /[0-9]/.test(s[j])) j++;
      if ((s[j] === "," || s[j] === ".") && /[0-9]/.test(s[j + 1] ?? "")) { j++; while (j < s.length && /[0-9]/.test(s[j])) j++; }
      l.push({ n: Number.parseFloat(s.slice(i, j).replace(",", ".")) }); i = j; continue;
    }
    if ("+-*/()%".includes(c)) { l.push({ o: c }); i++; continue; }
    throw new Error(`“${c}” anlaşılmadı`);
  }
  if (!l.length) throw new Error("formül boş");
  return l;
}

/** çözümleme: { hesapla(bul) } — bul(ad): sayı · null (değer yok) · undefined (öyle bir ad yok); yapı hatası atar */
function coz(ifade: string): { adlar: string[]; hesapla: (bul: (ad: string) => number | null | undefined) => number | null } {
  const l = jetonla(ifade);
  let p = 0;
  type Dugum = (bul: (ad: string) => number | null | undefined) => number;
  const adlar: string[] = [];
  const toplam = (): Dugum => {
    let sol = carpim();
    while ((l[p] as { o?: string })?.o === "+" || (l[p] as { o?: string })?.o === "-") {
      const o = (l[p++] as { o: string }).o, a = sol, b = carpim();
      sol = o === "+" ? (f) => a(f) + b(f) : (f) => a(f) - b(f);
    }
    return sol;
  };
  const carpim = (): Dugum => {
    let sol = tekli();
    while ((l[p] as { o?: string })?.o === "*" || (l[p] as { o?: string })?.o === "/") {
      const o = (l[p++] as { o: string }).o, a = sol, b = tekli();
      sol = o === "*" ? (f) => a(f) * b(f) : (f) => a(f) / b(f);
    }
    return sol;
  };
  const tekli = (): Dugum => {
    if ((l[p] as { o?: string })?.o === "-") { p++; const a = tekli(); return (f) => -a(f); }
    if ((l[p] as { o?: string })?.o === "+") { p++; return tekli(); }
    return yuzde(oge());
  };
  const yuzde = (a: Dugum): Dugum => {
    if ((l[p] as { o?: string })?.o === "%") { p++; return (f) => a(f) / 100; }
    return a;
  };
  const oge = (): Dugum => {
    const j = l[p++];
    if (!j) throw new Error("formül yarım kaldı");
    if ("n" in j) { const n = j.n; return () => n; }
    if ("ad" in j) {
      const ad = j.ad; adlar.push(ad);
      return (f) => { const v = f(ad); if (v === undefined) throw new BilinmeyenAd(ad); return v === null ? Number.NaN : v; };
    }
    if (j.o === "(") {
      const a = toplam();
      if ((l[p] as { o?: string })?.o !== ")") throw new Error("parantez kapanmadı");
      p++;
      return a;
    }
    throw new Error(`“${j.o === "*" ? "×" : j.o === "/" ? "÷" : j.o}” yanlış yerde`);
  };
  const kok = toplam();
  if (p !== l.length) throw new Error((l[p] as { o?: string })?.o === ")" ? "fazladan “)”" : "fazladan işaret");
  return {
    adlar,
    hesapla: (bul) => {
      try { const v = kok(bul); return Number.isFinite(v) ? v : null; } catch (e) { if (e instanceof BilinmeyenAd) return null; throw e; }
    },
  };
}
class BilinmeyenAd extends Error { ad: string; constructor(ad: string) { super(ad); this.ad = ad; } }

/** kurucuda yazarken: yapı hatası ya da bilinmeyen ad; null = formül doğru. adlar: başvurulabilen adlar */
export function formulDenet(ifade: string, adlar: readonly string[], kendi?: string): string | null {
  if (ifade.length > FORMUL_EN_UZUN) return `En çok ${FORMUL_EN_UZUN} karakter.`;
  let c: ReturnType<typeof coz>;
  try { c = coz(ifade); } catch (e) { return `Formül anlaşılmadı: ${(e as Error).message}.`; }
  const bilinen = new Set(adlar.map(anahtar));
  const yok = c.adlar.find((a) => !bilinen.has(anahtar(a)));
  if (yok) return `“${yok}” adında sayı yok — adı aynen yazın (köşeli parantezle).`;
  if (kendi && c.adlar.some((a) => anahtar(a) === anahtar(kendi))) return "Formül kendisine bakamaz.";
  return null;
}
/** formülün başvurduğu adlar (yapı hatasında boş) */
export function formulAdlari(ifade: string): string[] {
  try { return coz(ifade).adlar; } catch { return []; }
}
/** formülü değerlerle hesaplar; hesaplanamazsa null (yapı hatası da null) */
export function formulHesapla(ifade: string, bul: (ad: string) => number | null | undefined): number | null {
  try { return coz(ifade).hesapla(bul); } catch { return null; }
}

const anahtar = (s: string) => s.trim().toLocaleLowerCase("tr");
/** sonucun yazımı: en çok 3 ondalık, ondalık virgül */
export const formulYazimi = (v: number) => String(Math.round(v * 1000) / 1000).replace(".", ",");

type Alan = BolumOf<"bilgi">["alanlar"][number];
type Deger = BolumOf<"test">["degerler"][number];
type Sutun = BolumOf<"olcum">["sutunlar"][number];
/** formüllü öğe mi (sayı türünde ve formülü yazılı) */
export const formulluAlan = (a: Alan) => a.tur === "sayi" && !!a.formul?.trim();
export const formulluDeger = (d: Deger) => !d.metin && !d.secenekler?.length && !!d.formul?.trim();
export const formulluSutun = (s: Sutun) => s.giris === "sayi" && !!s.formul?.trim();
export function formulVar(t: FormatTanimi): boolean {
  return t.bolumler.some((b) => (b.blok === "bilgi" && b.alanlar.some(formulluAlan)) || (b.blok === "test" && b.degerler.some(formulluDeger))
    || (b.blok === "olcum" && b.sutunlar.some(formulluSutun)));
}

/** formatın genel sayı adları (test değeri ve bilgi alanı formüllerinin başvurabildiği): sayı alanları ve sayı test değerleri */
export function genelSayiAdlari(t: FormatTanimi): string[] {
  return t.bolumler.flatMap((b) => b.blok === "bilgi" ? b.alanlar.filter((a) => a.tur === "sayi").map((a) => a.ad)
    : b.blok === "test" ? b.degerler.filter((d) => !d.metin && !d.secenekler?.length).map((d) => d.ad) : []);
}
/** tablonun sayı sütunlarının adları (aynı satırdan) */
export const tabloSayiAdlari = (b: BolumOf<"olcum">) => b.sutunlar.filter((s) => s.giris === "sayi").map((s) => s.ad);

/** cevaplara formüllerin değerini yazar (yeni nesne; formül yoksa aynısı). Hesaplanamayan formülün değeri boş. */
export function formulUygula(t: FormatTanimi, c: Cevaplar): Cevaplar {
  if (!formulVar(t)) return c;
  const alan = { ...c.alan }, deger = { ...c.deger }, tablo = { ...c.tablo };
  /* genel adlar → öğe (ilk gelen kazanır) */
  const genel = new Map<string, { tur: "alan"; o: Alan } | { tur: "deger"; o: Deger }>();
  for (const b of t.bolumler) {
    if (b.blok === "bilgi") for (const a of b.alanlar) if (a.tur === "sayi" && !genel.has(anahtar(a.ad))) genel.set(anahtar(a.ad), { tur: "alan", o: a });
    if (b.blok === "test") for (const d of b.degerler) if (!d.metin && !d.secenekler?.length && !genel.has(anahtar(d.ad))) genel.set(anahtar(d.ad), { tur: "deger", o: d });
  }
  const genelDeger = (ad: string, k: number): number | null | undefined => {
    const x = genel.get(anahtar(ad));
    if (!x) return undefined;
    const f = x.tur === "alan" ? (formulluAlan(x.o) ? x.o.formul : null) : formulluDeger(x.o) ? x.o.formul : null;
    if (f) return k >= DERINLIK ? null : formulHesapla(f, (a) => genelDeger(a, k + 1));
    const v = sayiOku(x.tur === "alan" ? c.alan[x.o.id] : c.deger[x.o.id]);
    return Number.isNaN(v) ? null : v;
  };
  const yaz = (hedef: Record<string, unknown>, id: string, v: number | null) => { if (v === null) delete hedef[id]; else hedef[id] = formulYazimi(v); };
  for (const b of t.bolumler) {
    if (b.blok === "bilgi") for (const a of b.alanlar) if (formulluAlan(a)) yaz(alan, a.id, formulHesapla(a.formul!, (x) => genelDeger(x, 1)));
    if (b.blok === "test") for (const d of b.degerler) if (formulluDeger(d)) yaz(deger, d.id, formulHesapla(d.formul!, (x) => genelDeger(x, 1)));
    if (b.blok === "olcum" && b.sutunlar.some(formulluSutun) && c.tablo[b.id]) tablo[b.id] = c.tablo[b.id].map((s) => satirFormulu(b, s));
  }
  return { ...c, alan, deger, tablo };
}

/** tablonun bir satırına formül sütunlarının değerini yazar (aynı satırın sütunlarından) */
export function satirFormulu(b: BolumOf<"olcum">, s: Record<string, string>): Record<string, string> {
  if (!b.sutunlar.some(formulluSutun)) return s;
  const adla = new Map(b.sutunlar.map((x) => [anahtar(x.ad), x] as const));
  const deger = (ad: string, k: number): number | null | undefined => {
    const x = adla.get(anahtar(ad));
    if (!x || x.giris !== "sayi") return undefined;
    if (formulluSutun(x)) return k >= DERINLIK ? null : formulHesapla(x.formul!, (a) => deger(a, k + 1));
    const v = sayiOku(s[x.id]);
    return Number.isNaN(v) ? null : v;
  };
  const y = { ...s };
  for (const x of b.sutunlar) if (formulluSutun(x)) { const v = formulHesapla(x.formul!, (a) => deger(a, 1)); if (v === null) delete y[x.id]; else y[x.id] = formulYazimi(v); }
  return y;
}

/** kurucuda öğenin adı değişince formüllerdeki [eski] → [yeni] (kapsamdaki formüllerde; büyük / küçük harf önemsiz) */
export function formulAdDegistir(f: string, eski: string, yeni: string): string {
  const e = anahtar(eski);
  return f.replace(/\[([^\]]*)\]/g, (tam, ad: string) => (anahtar(ad) === e ? `[${yeni.trim()}]` : tam));
}
