/* İMZALI PDF DENETİMİ (317; 315–317 ve 318 çapraz incelemeleri, 2026-10-05) — saf, veritabanısız, DOĞRUSAL süreli (saldırganın denetlediği ekte
   karesel arama yok: sınırlı niceleyiciler, tek geçiş). İmzalı PDF = hazırlanan imzasız PDF'in KENDİSİ + artımlı imza eki (PAdES: özgün baytlar
   korunur; sonuna yeni nesneler, yeni xref ve trailer). Ek BEYAZ LİSTEYLE kabul edilir:
   · ilk baytlar imzasız PDF'in kendisi; ek boş değil, en çok 4 MB, en çok 500 nesne; sıkıştırılmış nesne akışı (ObjStm) yok (içi denetlenemez);
   · nesneler ham metinden bulunur (yorum satırına saklanmış başlık da sayılır — okuyucu nesneyi xref konumundan okur), numara tamsayıya
     çevrilir ("04" = 4); sözlükler gerçek PDF sözdizimiyle ayrıştırılır, yinelenen anahtar reddedilir;
   · ekteki her trailer / xref akışının /Root'u özgün /Root'la AYNI;
   · özgün bir nesne yeniden tanımlanıyorsa yalnız: Sayfa (/Type /Page; yalnız /Annots değişebilir, öteki her anahtar — /Contents, /Resources,
     /MediaBox … — anlamca aynı) ya da Katalog (yalnız /AcroForm, /DSS, /Perms, /Extensions değişebilir). Sayfa ağacı (Pages), içerik akışları,
     kaynaklar, yazı tipleri ve öteki her özgün nesne yeniden tanımlanamaz; akışla hiç;
   · yeni açıklama yalnız imza alanı (/Subtype /Widget) — metin, damga, serbest yazı vb. açıklama eklenemez;
   · bir yeni nesne imza sözlüğüdür: /Type /Sig, /ByteRange dizisi, /Contents onaltılık dize.
   Kalan risk (kayıtta): imza alanının görünümü (/AP) sayfaya çizilir; kriptografik zincir ve görsel karşılaştırma sonraki fazda (K7). */

type Deger = { t: "sozluk"; d: Map<string, Deger> } | { t: "dizi"; l: Deger[] } | { t: "ref"; n: number; g: number } | { t: "yalin"; v: string };
interface Nesne { n: number; govde: string; deger: Deger | null; akis: boolean }

const EK_SINIR = 4 * 1024 * 1024, NESNE_SINIR = 500;
const BOSLUK = /[\x00\t\n\f\r ]/, AYRAC = /[()<>[\]{}/%]/;
/* sınırlı niceleyiciler: her konumda sabit iş (uzun rakam / boşluk dizisiyle karesel geri izleme yok) */
const BASLIK = /(\d{1,10})[\x00\t\n\f\r ]{1,20}(\d{1,5})[\x00\t\n\f\r ]{1,20}obj\b|\bendobj\b/g;
const ACIKLAMA = new Set(["Text", "Link", "FreeText", "Line", "Square", "Circle", "Polygon", "PolyLine", "Highlight", "Underline", "Squiggly", "StrikeOut",
  "Stamp", "Caret", "Ink", "Popup", "FileAttachment", "Sound", "Movie", "Screen", "PrinterMark", "TrapNet", "Watermark", "3D", "Redact", "RichMedia", "Projection"]);
const KATALOG_SERBEST = new Set(["AcroForm", "DSS", "Perms", "Extensions"]);

class Bozuk extends Error {}

/** PDF değer ayrıştırıcı (sözlük, dizi, başvuru, ad, sayı, dize, anahtar sözcük); yorumlar atlanır; yinelenen sözlük anahtarı → Bozuk */
function ayristir(s: string, bas = 0): { deger: Deger; son: number } {
  let i = bas;
  const bosAt = () => {
    for (;;) {
      while (i < s.length && BOSLUK.test(s[i])) i++;
      if (s[i] === "%") { while (i < s.length && s[i] !== "\n" && s[i] !== "\r") i++; continue; }
      return;
    }
  };
  const yalin = (): string => { const b = i; while (i < s.length && !BOSLUK.test(s[i]) && !AYRAC.test(s[i])) i++; if (i === b) throw new Bozuk(); return s.slice(b, i); };
  const deger = (derinlik: number): Deger => {
    if (derinlik > 50) throw new Bozuk();
    bosAt();
    if (s.startsWith("<<", i)) {
      i += 2; const d = new Map<string, Deger>();
      for (;;) {
        bosAt();
        if (s.startsWith(">>", i)) { i += 2; return { t: "sozluk", d }; }
        if (s[i] !== "/") throw new Bozuk();
        i++; const k = yalin();
        if (d.has(k)) throw new Bozuk();
        d.set(k, deger(derinlik + 1));
      }
    }
    if (s[i] === "[") {
      i++; const l: Deger[] = [];
      for (;;) { bosAt(); if (s[i] === "]") { i++; return { t: "dizi", l }; } if (i >= s.length) throw new Bozuk(); l.push(deger(derinlik + 1)); }
    }
    if (s[i] === "/") { i++; const b = i; while (i < s.length && !BOSLUK.test(s[i]) && !AYRAC.test(s[i])) i++; return { t: "yalin", v: `/${s.slice(b, i)}` }; }
    if (s[i] === "(") {
      const b = i; let derin = 0;
      for (; i < s.length; i++) { if (s[i] === "\\") { i++; continue; } if (s[i] === "(") derin++; else if (s[i] === ")" && --derin === 0) { i++; return { t: "yalin", v: s.slice(b, i) }; } }
      throw new Bozuk();
    }
    if (s[i] === "<") { const son = s.indexOf(">", i); if (son < 0) throw new Bozuk(); const v = s.slice(i + 1, son).replace(/[\x00\t\n\f\r ]/g, "").toLowerCase(); i = son + 1; return { t: "yalin", v: `<${v}>` }; }
    const k = yalin();
    /* başvuru: "n g R" */
    if (/^\d+$/.test(k)) {
      const geri = i; bosAt(); const m = /^(\d{1,5})[\x00\t\n\f\r ]+R(?![^\x00\t\n\f\r ()<>[\]{}/%])/.exec(s.slice(i, i + 32));
      if (m) { i += m[0].length; return { t: "ref", n: Number(k), g: Number(m[1]) }; }
      i = geri;
    }
    return { t: "yalin", v: k };
  };
  const d = deger(0);
  return { deger: d, son: i };
}

/** anlamca karşılaştırma için kanonik yazım (sözlük anahtarları sıralı, başvuru tamsayıyla) */
function kanonik(d: Deger, haric?: Set<string>): string {
  switch (d.t) {
    case "sozluk": return `<<${[...d.d.entries()].filter(([k]) => !haric?.has(k)).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)).map(([k, v]) => `/${k} ${kanonik(v)}`).join(" ")}>>`;
    case "dizi": return `[${d.l.map((x) => kanonik(x)).join(" ")}]`;
    case "ref": return `${d.n} ${d.g} R`;
    default: return d.v;
  }
}
const ad = (d: Deger | null, k: string) => (d?.t === "sozluk" ? d.d.get(k) : undefined);
const adi = (d: Deger | null, k: string) => { const x = ad(d, k); return x?.t === "yalin" ? x.v : null; };

/** metindeki nesneler (tek geçiş): başlık … endobj. Ekte (katı) iç içe başlık ya da kapanmamış nesne → Bozuk; özgünde (kendi ürettiğimiz PDF)
    iç içe başlık öncekini kapatır. Aynı numara sonra tanımlanırsa sonuncusu geçerli. */
function nesneler(s: string, kati: boolean): Map<number, Nesne> {
  const m = new Map<number, Nesne>();
  let acik: { n: number; bas: number } | null = null, sayi = 0;
  BASLIK.lastIndex = 0;
  for (let x = BASLIK.exec(s); x; x = BASLIK.exec(s)) {
    if (x[1] !== undefined) {
      if (acik && kati) throw new Bozuk();
      if (kati && ++sayi > NESNE_SINIR) throw new Bozuk();
      acik = { n: Number.parseInt(x[1], 10), bas: x.index + x[0].length };
    } else if (acik) {
      const govde = s.slice(acik.bas, x.index);
      let deger: Deger | null = null, akis = false;
      try { const a = ayristir(govde); deger = a.deger; akis = /^[\x00\t\n\f\r ]*stream\b/.test(govde.slice(a.son)); } catch (e) { if (!(e instanceof Bozuk)) throw e; deger = null; akis = /\bstream\b/.test(govde); }
      m.set(acik.n, { n: acik.n, govde, deger, akis });
      acik = null;
    }
  }
  if (acik && kati) throw new Bozuk();
  return m;
}
/** metindeki trailer sözlüklerinin /Root başvuruları */
function kokler(s: string): string[] {
  const l: string[] = [];
  for (let i = s.indexOf("trailer"); i >= 0; i = s.indexOf("trailer", i + 7)) {
    try { const r = ad(ayristir(s, i + 7).deger, "Root"); if (r) l.push(kanonik(r)); else l.push("yok"); } catch (e) { if (!(e instanceof Bozuk)) throw e; l.push("bozuk"); }
  }
  return l;
}

const latin1 = (b: Uint8Array) => Buffer.from(b.buffer, b.byteOffset, b.byteLength).toString("latin1");

/** imzaya gönderilebilir mi (333 — dışarıda üretilmiş PDF, ör. bordro): imzalanmış hâli imzaliPdfGecerli ile denetlenebilsin diye klasik
    xref ve trailer kökü olmalı, sıkıştırılmış nesne akışı (ObjStm) olmamalı — öyle değilse imzalı hâli hiçbir zaman kabul edilmez */
export function imzayaUygun(pdf: Uint8Array): boolean {
  try {
    const s = latin1(pdf);
    for (const x of nesneler(s, false).values()) if (adi(x.deger, "Type") === "/ObjStm") return false;
    const k = kokler(s).at(-1);
    return !!k && k !== "yok" && k !== "bozuk";
  } catch (e) {
    if (e instanceof Bozuk) return false;
    throw e;
  }
}

/** imzalı PDF, imzasız PDF'in beyaz listeye uyan artımlı imzalanmış hâli mi */
export function imzaliPdfGecerli(imzasiz: Uint8Array, imzali: Uint8Array): boolean {
  if (imzali.length <= imzasiz.length || imzali.length - imzasiz.length > EK_SINIR) return false;
  if (!Buffer.from(imzali.subarray(0, imzasiz.length)).equals(Buffer.from(imzasiz))) return false;
  try {
    const ozgunMetin = latin1(imzasiz), ekMetin = latin1(imzali.subarray(imzasiz.length));
    const ozgun = nesneler(ozgunMetin, false), ek = nesneler(ekMetin, true);
    if (!ek.size) return false;
    /* özgün nesneleri sıkıştırılmış akıştaysa yeniden tanımlama denetlenemez (kendi ürettiğimiz PDF'te olmaz) */
    for (const x of ozgun.values()) if (adi(x.deger, "Type") === "/ObjStm") return false;
    /* kök: özgünün son trailer'ı; ekteki her trailer ve xref akışı aynı kökü göstermeli */
    const ozgunKok = kokler(ozgunMetin).at(-1);
    if (!ozgunKok || ozgunKok === "yok" || ozgunKok === "bozuk") return false;
    const ekKokler = kokler(ekMetin);
    for (const x of ek.values()) if (adi(x.deger, "Type") === "/XRef") { const r = ad(x.deger, "Root"); ekKokler.push(r ? kanonik(r) : "yok"); }
    if (!ekKokler.length || ekKokler.some((k) => k !== ozgunKok)) return false;
    let imza = false;
    for (const x of ek.values()) {
      if (!x.deger || x.deger.t !== "sozluk") { if (ozgun.has(x.n)) return false; continue; }
      const tur = adi(x.deger, "Type"), alt = adi(x.deger, "Subtype");
      if (tur === "/ObjStm") return false;
      const eski = ozgun.get(x.n);
      if (eski) {
        if (x.akis || !eski.deger || eski.deger.t !== "sozluk") return false;
        const eskiTur = adi(eski.deger, "Type");
        if (eskiTur === "/Page" && tur === "/Page") {
          if (kanonik(x.deger, new Set(["Annots"])) !== kanonik(eski.deger, new Set(["Annots"]))) return false;
        } else if (eskiTur === "/Catalog" && tur === "/Catalog") {
          if (kanonik(x.deger, KATALOG_SERBEST) !== kanonik(eski.deger, KATALOG_SERBEST)) return false;
        } else return false;
        continue;
      }
      if (alt && ACIKLAMA.has(alt.slice(1))) return false;
      if (tur === "/Annot" && alt !== "/Widget") return false;
      if (tur === "/Sig") {
        const br = ad(x.deger, "ByteRange"), c = ad(x.deger, "Contents");
        if (br?.t === "dizi" && br.l.length === 4 && c?.t === "yalin" && c.v.startsWith("<")) imza = true;
      }
    }
    return imza;
  } catch (e) {
    if (e instanceof Bozuk) return false;
    throw e;
  }
}
