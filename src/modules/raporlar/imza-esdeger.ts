/* YENİDEN YAZILMIŞ İMZALI PDF — İÇERİK EŞDEĞERLİĞİ (2026-10-17; reisim: "imzayeri ile mobil imza attım, o şeritler imzayerinde imzalanınca geliyor …
   kalacak tabiki bizim kontrolümüzde değil" · "sistemimiz her hangi bir imzalı raporu kabul etmeli zaten bu müşterilerden çokca dönüş almamıza
   sabep olabilir"). Saf; saldırganın denetlediği girdi (her yol sınırlı: sayfa, karşılaştırma, belirteç sayısı).
   Bulgu: aracı imza servisleri (imzayeri — OpenPDF) imzadan ÖNCE belgeyi baştan yeniden yazar (nesneler yeniden numaralanır), her sayfaya kendi
   damgasını ekler (sayfanın çizim akışlarının önüne "q", arkasına "Q q … cm /Xi Do Q Q"), hazırladığımız boş imza alanını atabilir, kendi doğrulama
   bağlantısını koyar, imzayı görünmez alana atar; sonra imzayı ve uzun süreli doğrulama eklerini ARTIMLI ekler. Bayt öneki tutmaz → imzaliPdfGecerli
   (imza-pdf.ts) tek başına reddeder. Burada imzalı dosyanın imzadan önceki bir sürümü (bir %%EOF sınırı) "taban" adayıdır; tabandan sonrası beyaz
   listeye uyuyorsa (imzaliPdfGecerli(taban, imzalı)) ve taban hazırladığımız PDF'le İÇERİKÇE eşdeğerse imzalı PDF kabul edilir. Eşdeğerlik:
   · aynı sayfa sayısı; her sayfanın boyutu, kırpma alanı, yönü aynı (miras dahil);
   · sayfanın BİZİM çizimimiz (çözülmüş akışlar, satır sonuyla birleştirilmiş) aynen, tek parça; öncesine / sonrasına eklenende YALNIZ q, Q, cm, Do,
     gs, BMC / BDC / EMC (damga çizmek) — yazı, çizgi, kırpma, satır içi resim yok; bizim çizimimiz başlarken dönüşüm birim, grafik durumu
     değiştirilmemiş, işaretli içerik açık değil (raporu küçültemez, saydamlaştıramaz, gizleyemez);
   · eklenen her çizimin (Do — form: BBox × Matrix × dönüşüm, form kendi BBox'ına kırpılır; resim: birim kare × dönüşüm) kapladığı alan sayfanın
     KENAR BOŞLUĞUNDA (KENAR — raporun kendi boşlukları: üst 10, yan 8, alt 20 mm; alttaki şeridin üstüne gelebilir) ya da bizim e-imza yerimizde;
   · bizim kaynaklarımız (yazı tipi, resim, grafik durumu, renk uzayı …) aynı adla, içerikçe aynı; yeni ad yalnız damga için;
   · bizim bağlantılarımız aynı yerde aynı adresle ya da atılmış (adres değiştirilemez); yeni açıklama yalnız imza alanı ya da http(s) bağlantı ve
     yalnız kenarda / imza yerinde; katalogda / sayfada eylem (OpenAction, AA), JavaScript, gömülü dosya, isteğe bağlı içerik eklenemez;
   · hazırladığımız PDF zaten imzalıysa (teknik yöneticinin imzası) onu yeniden yazmak o imzayı bozar → kabul edilmez (ek artımlıysa — önek — kabul).
   Kripto (imza sağlam, nitelikli) ve imzalayanın adı tabana göre ayrıca denetlenir (src/server/imza/yukleme.ts ekImzaNedeni, imza-kimlik.ts).
   Desteklenmeyen: baştan çizilmiş belge (yazdırarak yeniden PDF yapmak — çizim akışı bizimki değil), sıkıştırılmış nesne akışlı taban, yeniden
   yazımla aynı geçişte atılmış imza (taban yok) — hepsi nedeniyle reddedilir. */
import { latin1, nesneOkuyucu, PdfHatasi, sonDurum, type NesneOkuyucu } from "../../server/imza/pdf-ek.ts";
import { degerAyristir, imzaliPdfGecerli, type Deger } from "./imza-pdf.ts";

class Esdegersiz extends Error {}
const SAYFA_SINIR = 500, KARSILASTIRMA_SINIR = 300_000, BELIRTEC_SINIR = 3_000_000, SINIR_SAYISI = 32, BULMA_SINIR = 4;
/** damganın girebileceği kenar boşlukları (pt) — raporun sayfa boşlukları (src/belge/pdf.ts RAPOR_SAYFA: 10mm 8mm 20mm 8mm) */
export const KENAR = { alt: 57, ust: 28, yan: 22 } as const;
const DAMGA_ISLEMLERI = new Set(["q", "Q", "cm", "Do", "gs", "BMC", "BDC", "EMC"]);
/** katalogda / sayfada eklenemeyen ya da değiştirilemeyen (davranış ve görünürlük) */
const KATALOG_KORUNAN = ["OpenAction", "AA", "OCProperties", "Collection", "NeedsRendering"];
const ADLAR_KORUNAN = ["JavaScript", "EmbeddedFiles", "AlternatePresentations", "Renditions"];
const SAYFA_KORUNAN = ["AA", "UserUnit"];

type Matris = [number, number, number, number, number, number];
const BIRIM: Matris = [1, 0, 0, 1, 0, 0];
/** m × n (PDF: yeni dönüşüm = cm × geçerli) */
const carp = (m: Matris, n: Matris): Matris => [m[0] * n[0] + m[1] * n[2], m[0] * n[1] + m[1] * n[3], m[2] * n[0] + m[3] * n[2], m[2] * n[1] + m[3] * n[3],
  m[4] * n[0] + m[5] * n[2] + n[4], m[4] * n[1] + m[5] * n[3] + n[5]];
const birimMi = (m: Matris) => m.every((x, i) => Math.abs(x - BIRIM[i]) <= 1e-6);
type Kutu = [number, number, number, number];
function kutuDonustur(k: Kutu, m: Matris): Kutu {
  const n = [[k[0], k[1]], [k[2], k[1]], [k[0], k[3]], [k[2], k[3]]].map(([x, y]) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]]);
  const xs = n.map((p) => p[0]), ys = n.map((p) => p[1]);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
}

/* ── belge ── */
interface Belge { o: NesneOkuyucu; deger: (no: number) => Deger | null; kok: number }
function belge(b: Uint8Array): Belge {
  const s = latin1(b), o = nesneOkuyucu(s), onbellek = new Map<number, Deger | null>();
  const kok = Number(sonDurum(s).kok.split(/[\x00\t\n\f\r ]+/)[0]);
  const deger = (no: number) => {
    if (!onbellek.has(no)) { const g = o(no); onbellek.set(no, g === null ? null : degerAyristir(g)); }
    return onbellek.get(no)!;
  };
  return { o, deger, kok };
}
const sozluk = (d: Deger | null | undefined) => (d?.t === "sozluk" ? d.d : null);
const coz = (B: Belge, d: Deger | null | undefined): Deger | null => (d?.t === "ref" ? B.deger(d.n) : d ?? null);
const SAYI = /^[+-]?(?:\d+\.?\d*|\.\d+)$/;
const sayi = (d: Deger | null | undefined): number | null => (d?.t === "yalin" && SAYI.test(d.v) ? Number(d.v) : null);
const sayilar = (B: Belge, d: Deger | null | undefined): number[] | null => {
  const x = coz(B, d);
  if (x?.t !== "dizi") return null;
  const l = x.l.map((y) => sayi(coz(B, y)));
  return l.every((y): y is number => y !== null) ? l : null;
};
const adCoz = (v: string) => v.replace(/#([0-9a-fA-F]{2})/g, (_, h: string) => String.fromCharCode(parseInt(h, 16)));
const adDegeri = (B: Belge, d: Deger | null | undefined) => { const x = coz(B, d); return x?.t === "yalin" && x.v.startsWith("/") ? adCoz(x.v) : null; };

/* ── dizgi / ad / sayı (yeniden yazım biçimi değiştirir: kaçışlı ↔ onaltılık dizgi, #xx ad, sayının basamakları — OpenPDF 1'den büyükte 2 ondalık) ── */
function dizgiBayt(v: string): string | null {
  if (v.startsWith("<")) { const h = v.slice(1, -1).replace(/[\x00\t\n\f\r ]/g, "").toLowerCase(); return h.length % 2 ? `${h}0` : h; }
  if (!v.startsWith("(")) return null;
  const ic = v.slice(1, -1), b: number[] = [];
  const kac: Record<string, number> = { n: 10, r: 13, t: 9, b: 8, f: 12, "(": 40, ")": 41, "\\": 92 };
  for (let i = 0; i < ic.length; i++) {
    const c = ic.charCodeAt(i);
    if (c !== 0x5c) { b.push(c); continue; }
    const n = ic[++i];
    if (n === undefined) break;
    if (n in kac) b.push(kac[n]);
    else if (/[0-7]/.test(n)) { let o = n; while (o.length < 3 && /[0-7]/.test(ic[i + 1] ?? "")) o += ic[++i]; b.push(parseInt(o, 8) & 0xff); }
    else if (n === "\r") { if (ic[i + 1] === "\n") i++; }
    else if (n !== "\n") b.push(n.charCodeAt(0));
  }
  return Buffer.from(b).toString("hex");
}
function yalinEsit(a: string, b: string): boolean {
  if (a === b) return true;
  if (SAYI.test(a) && SAYI.test(b)) { const x = Number(a), y = Number(b); return Math.abs(x - y) <= 0.006 + 1e-4 * Math.abs(x); }
  if (a.startsWith("/") && b.startsWith("/")) return adCoz(a) === adCoz(b);
  const da = dizgiBayt(a), db = dizgiBayt(b);
  return da !== null && db !== null && da === db;
}

/* ── derin karşılaştırma: başvurular çözülür, akışlar verisiyle, sayfa başvurusu sayfanın karşılığıyla; sonuç hatırlanır, bütçe sınırlı ── */
interface Bag { A: Belge; B: Belge; sayac: { n: number }; sonuc: Map<string, boolean>; sayfaEsi: Map<number, number> }
const ATLA = new Set(["Parent", "Length", "P", "StructParent", "StructParents"]);
function akisVerisi(D: Belge, no: number): { veri: Buffer; cozuldu: boolean } | null {
  const c = D.o.akis(no);
  if (c) return { veri: c, cozuldu: true };
  const h = D.o.ham(no);
  return h ? { veri: h, cozuldu: false } : null;
}
function esit(g: Bag, a: Deger | null | undefined, b: Deger | null | undefined, derinlik = 0): boolean {
  if (++g.sayac.n > KARSILASTIRMA_SINIR || derinlik > 64) throw new Esdegersiz("belge çok karmaşık");
  if (a?.t === "ref" && g.sayfaEsi.has(a.n)) return b?.t === "ref" && g.sayfaEsi.get(a.n) === b.n;
  if (a?.t === "ref" && b?.t === "ref") {
    const k = `${a.n}:${b.n}`, once = g.sonuc.get(k);
    if (once !== undefined) return once;
    g.sonuc.set(k, true);   // döngüde varsayım; sonuç aşağıda yazılır
    let r: boolean;
    const va = akisVerisi(g.A, a.n), vb = akisVerisi(g.B, b.n);
    if (!va || !vb) r = !va && !vb && esit(g, g.A.deger(a.n), g.B.deger(b.n), derinlik + 1);
    else {
      const haric = va.cozuldu && vb.cozuldu ? new Set(["Filter", "DecodeParms"]) : new Set<string>();
      r = va.cozuldu === vb.cozuldu && va.veri.equals(vb.veri) && sozlukEsit(g, g.A.deger(a.n), g.B.deger(b.n), derinlik + 1, haric);
    }
    g.sonuc.set(k, r);
    return r;
  }
  if (a?.t === "ref" || b?.t === "ref") return esit(g, coz(g.A, a), coz(g.B, b), derinlik + 1);
  if (!a || !b) return !a && !b;
  if (a.t !== b.t) return false;
  if (a.t === "yalin") return yalinEsit(a.v, (b as { v: string }).v);
  if (a.t === "dizi") { const l = (b as { l: Deger[] }).l; return a.l.length === l.length && a.l.every((x, i) => esit(g, x, l[i], derinlik + 1)); }
  return sozlukEsit(g, a, b, derinlik);
}
function sozlukEsit(g: Bag, a: Deger | null, b: Deger | null, derinlik: number, haric: Set<string> = new Set()): boolean {
  const da = sozluk(a), db = sozluk(b);
  if (!da || !db) return !da && !db && esit(g, a, b, derinlik + 1);
  const anahtar = (d: Map<string, Deger>) => [...d.keys()].filter((k) => !ATLA.has(k) && !haric.has(k)).sort();
  const ka = anahtar(da), kb = anahtar(db);
  return ka.length === kb.length && ka.every((k, i) => k === kb[i] && esit(g, da.get(k), db.get(k), derinlik + 1));
}

/* ── sayfalar ── */
interface Sayfa { no: number; d: Map<string, Deger>; miras: (k: string) => Deger | null }
function sayfalar(D: Belge): Sayfa[] {
  const kat = sozluk(D.deger(D.kok));
  if (!kat) throw new Esdegersiz("belgenin kataloğu okunamadı");
  const l: Sayfa[] = [], gorulen = new Set<number>();
  const gez = (r: Deger | undefined, ust: Map<string, Deger>[]) => {
    if (r?.t !== "ref" || gorulen.has(r.n) || ust.length > 32) throw new Esdegersiz("sayfa ağacı okunamadı");
    gorulen.add(r.n);
    const d = sozluk(D.deger(r.n));
    if (!d) throw new Esdegersiz("sayfa ağacı okunamadı");
    if (d.has("Kids") && adDegeri(D, d.get("Type")) !== "/Page") {
      const kids = coz(D, d.get("Kids"));
      if (kids?.t !== "dizi") throw new Esdegersiz("sayfa ağacı okunamadı");
      for (const k of kids.l) gez(k, [d, ...ust]);
      return;
    }
    if (l.length >= SAYFA_SINIR) throw new Esdegersiz("belgede çok sayfa var");
    const zincir = [d, ...ust];
    l.push({ no: r.n, d, miras: (k) => { for (const z of zincir) if (z.has(k)) return z.get(k)!; return null; } });
  };
  gez(kat.get("Pages"), []);
  return l;
}
/** sayfanın çizimi: içerik akışları çözülmüş, satır sonuyla birleştirilmiş (okuyucular akışları arada boşlukla birleştirir) */
function cizim(D: Belge, s: Sayfa): string {
  const c = s.d.get("Contents");
  if (!c) return "";
  const x = coz(D, c);
  const l = x?.t === "dizi" ? x.l : [c];
  if (l.length > 4096) throw new Esdegersiz("sayfanın çizimi okunamadı");
  return l.map((r) => {
    if (r.t !== "ref") throw new Esdegersiz("sayfanın çizimi okunamadı");
    const v = D.o.akis(r.n);
    if (!v) throw new Esdegersiz("sayfanın çizimi okunamadı (desteklenmeyen sıkıştırma)");
    return v.toString("latin1");
  }).join("\n");
}

/* ── çizim belirteçleri (konumlu; yalnız dönüşümü, grafik durumunu ve damga çizimini izlemek için) ── */
type Belirtec = { t: "sayi"; v: number; bas: number; son: number } | { t: "ad"; v: string; bas: number; son: number }
  | { t: "islem"; v: string; bas: number; son: number } | { t: "diger"; bas: number; son: number };
const BOSLUK = new Set([" ", "\n", "\r", "\t", "\f", "\0"]);
const AYRAC = new Set(["(", ")", "<", ">", "[", "]", "{", "}", "/", "%"]);
function* belirtecler(s: string, sayac: { n: number }): Generator<Belirtec> {
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (BOSLUK.has(c)) { i++; continue; }
    if (++sayac.n > BELIRTEC_SINIR) throw new Esdegersiz("sayfanın çizimi çok büyük");
    const bas = i;
    if (c === "%") { while (i < s.length && s[i] !== "\n" && s[i] !== "\r") i++; yield { t: "diger", bas, son: i }; continue; }
    if (c === "(") {
      let d = 0;
      for (; i < s.length; i++) { if (s[i] === "\\") { i++; continue; } if (s[i] === "(") d++; else if (s[i] === ")" && --d === 0) { i++; break; } }
      yield { t: "diger", bas, son: Math.min(i, s.length) };
      continue;
    }
    if ((c === "<" && s[i + 1] === "<") || (c === ">" && s[i + 1] === ">")) { i += 2; yield { t: "diger", bas, son: i }; continue; }
    if (c === "<") { const j = s.indexOf(">", i); i = j < 0 ? s.length : j + 1; yield { t: "diger", bas, son: i }; continue; }
    if (c === "[" || c === "]" || c === "{" || c === "}" || c === ">" || c === ")") { i++; yield { t: "diger", bas, son: i }; continue; }
    i++;
    while (i < s.length && !BOSLUK.has(s[i]) && !AYRAC.has(s[i])) i++;
    const k = s.slice(bas, i);
    if (c === "/") { yield { t: "ad", v: adCoz(k), bas, son: i }; continue; }
    if (SAYI.test(k)) { yield { t: "sayi", v: Number(k), bas, son: i }; continue; }
    if (k === "true" || k === "false" || k === "null") { yield { t: "diger", bas, son: i }; continue; }
    /* satır içi resim: ID'den sonra ham veri, boşlukla ayrılmış EI'ye kadar — tek belirteç */
    if (k === "ID") { const e = /[\0\t\n\f\r ]EI(?=[\0\t\n\f\r ]|$)/.exec(s.slice(i)); i = e ? i + e.index + 3 : s.length; }
    yield { t: "islem", v: k, bas, son: i };
  }
}

/** birleşik çizimde bizimkinin yeri [bas, son): öncesi ve sonrası eklenen; eklenende yalnız damga işlemleri; bizim çizimimiz başlarken grafik
    durumu el değmemiş. Eklenen her Do'nun adı ve o andaki dönüşüm döner; uymazsa neden. */
function eklenenCizimler(s: string, bas: number, son: number, sayac: { n: number }): { ad: string; m: Matris }[] | string {
  const yigin: { m: Matris; gs: boolean }[] = [], cizimler: { ad: string; m: Matris }[] = [];
  let d = { m: BIRIM, gs: false }, mc = 0, baktik = false;
  const bizimBasi = () => (birimMi(d.m) && !d.gs && mc === 0 ? null : "İmza programı belgenin çizimini etkileyen bir ayar eklemiş (küçültme, saydamlık ya da gizleme); belge değişmiş sayılır.");
  const islenen: (number | string)[] = [];
  for (const t of belirtecler(s, sayac)) {
    if ((t.bas < bas && t.son > bas) || (t.bas < son && t.son > son)) return "İmza programının eklediği çizim belgenin çizimine karışmış; belge değişmiş sayılır.";
    if (!baktik && t.bas >= bas) { baktik = true; const n = bizimBasi(); if (n) return n; }
    const eklenen = t.bas < bas || t.bas >= son;
    if (t.t === "sayi") { islenen.push(t.v); continue; }
    if (t.t === "ad") { islenen.push(t.v); continue; }
    if (t.t === "diger") { islenen.push(""); continue; }
    const op = t.v;
    if (eklenen && !DAMGA_ISLEMLERI.has(op)) return `İmza programı sayfaya izin dışı bir çizim eklemiş (${op.slice(0, 8)}); belge değişmiş sayılır.`;
    if (op === "q") { if (yigin.length > 512) return "Sayfanın çizimi okunamadı."; yigin.push(d); }
    else if (op === "Q") d = yigin.pop() ?? d;
    else if (op === "cm") {
      const n = islenen.slice(-6);
      if (n.length === 6 && n.every((x): x is number => typeof x === "number")) d = { ...d, m: carp(n as Matris, d.m) };
      else if (eklenen) return "İmza programının eklediği çizim okunamadı.";
    } else if (op === "gs") d = { ...d, gs: true };
    else if (op === "BMC" || op === "BDC") mc++;
    else if (op === "EMC") mc = Math.max(0, mc - 1);
    else if (op === "Do" && eklenen) {
      const ad = islenen.at(-1);
      if (typeof ad !== "string" || !ad.startsWith("/")) return "İmza programının eklediği çizim okunamadı.";
      cizimler.push({ ad: ad.slice(1), m: d.m });
    }
    islenen.length = 0;
  }
  if (!baktik) { const n = bizimBasi(); if (n) return n; }
  return cizimler;
}

/* ── izinli alan: kenar boşlukları ya da bizim e-imza yerlerimiz ── */
const icinde = (k: Kutu, d: Kutu, pay: number) => k[0] >= d[0] - pay && k[1] >= d[1] - pay && k[2] <= d[2] + pay && k[3] <= d[3] + pay;
function izinli(k: Kutu, sayfa: Kutu, imzaYerleri: Kutu[]): boolean {
  if (k[2] - k[0] <= 0.01 || k[3] - k[1] <= 0.01) return true;   // görünmez (sıfır alan)
  const [x0, y0, x1, y1] = sayfa;
  if (k[3] <= y0 + KENAR.alt + 1 || k[1] >= y1 - KENAR.ust - 1 || k[2] <= x0 + KENAR.yan + 1 || k[0] >= x1 - KENAR.yan - 1) return true;
  return imzaYerleri.some((y) => icinde(k, y, 2));
}
const kutu = (B: Belge, d: Deger | null | undefined): Kutu | null => {
  const n = sayilar(B, d);
  return n && n.length === 4 ? [Math.min(n[0], n[2]), Math.min(n[1], n[3]), Math.max(n[0], n[2]), Math.max(n[1], n[3])] : null;
};
/** açıklama imza alanı mı (alanın kendisi ya da ebeveyni /FT /Sig) */
const imzaAlaniMi = (D: Belge, d: Map<string, Deger>) => (adDegeri(D, d.get("FT")) ?? adDegeri(D, sozluk(coz(D, d.get("Parent")))?.get("FT"))) === "/Sig";
const acikTuru = (D: Belge, d: Map<string, Deger>) => adDegeri(D, d.get("Subtype")) ?? "";
function aciklamalar(D: Belge, s: Sayfa): Map<string, Deger>[] {
  const a = coz(D, s.d.get("Annots"));
  if (!a) return [];
  if (a.t !== "dizi" || a.l.length > 2000) throw new Esdegersiz("sayfanın açıklamaları okunamadı");
  return a.l.map((x) => { const d = sozluk(coz(D, x)); if (!d) throw new Esdegersiz("sayfanın açıklamaları okunamadı"); return d; });
}
/** bağlantının adresi (yalnız http(s) URI eylemi); başka eylem / hedef null */
function baglantiAdresi(D: Belge, d: Map<string, Deger>): string | null {
  const a = sozluk(coz(D, d.get("A")));
  if (!a || adDegeri(D, a.get("S")) !== "/URI" || a.has("Next")) return null;
  const u = coz(D, a.get("URI"));
  const h = u?.t === "yalin" ? dizgiBayt(u.v) : null;
  const adres = h === null ? null : Buffer.from(h, "hex").toString("latin1");
  return adres && /^https?:\/\/[^\s]{1,2000}$/i.test(adres) ? adres : null;
}

/** hazırladığımız PDF (a) ile imzalı dosyanın tabanı (b) içerikçe eşdeğer mi; değilse nedeni (ekranda, Türkçe tam cümle) */
export function esdegerNedeni(a: Uint8Array, b: Uint8Array): string | null {
  try {
    const A = belge(a), B = belge(b);
    const pa = sayfalar(A), pb = sayfalar(B);
    if (pa.length !== pb.length) return `İmzalı PDF'in sayfa sayısı farklı (${pb.length}; imzaya hazırlanan PDF ${pa.length} sayfa).`;
    const g: Bag = { A, B, sayac: { n: 0 }, sonuc: new Map(), sayfaEsi: new Map(pa.map((s, i) => [s.no, pb[i].no])) };
    /* katalog: eylem, isteğe bağlı içerik, JavaScript, gömülü dosya eklenemez (yapı, dil, üst veri, form, imza düzeni serbest) */
    const ka = sozluk(A.deger(A.kok)), kb = sozluk(B.deger(B.kok));
    if (!ka || !kb) return "İmzalı PDF'in kataloğu okunamadı.";
    for (const k of KATALOG_KORUNAN) if (kb.has(k) && !(ka.has(k) && esit(g, ka.get(k), kb.get(k)))) return `İmza programı belgeye izin dışı bir özellik eklemiş (${k}).`;
    const na = sozluk(coz(A, ka.get("Names"))), nb = sozluk(coz(B, kb.get("Names")));
    for (const k of ADLAR_KORUNAN) if (nb?.has(k) && !(na?.has(k) && esit(g, na.get(k), nb.get(k)))) return `İmza programı belgeye izin dışı bir özellik eklemiş (${k}).`;
    const sayac = { n: 0 };
    for (const [i, sa] of pa.entries()) {
      const sb = pb[i], no = i + 1;
      /* boyut, kırpma, yön */
      const mbA = kutu(A, sa.miras("MediaBox")), mbB = kutu(B, sb.miras("MediaBox"));
      if (!mbA || !mbB || !mbA.every((x, j) => Math.abs(x - mbB[j]) <= 0.01)) return `İmzalı PDF'in ${no}. sayfasının boyutu farklı.`;
      const cbA = kutu(A, sa.miras("CropBox")) ?? mbA, cbB = kutu(B, sb.miras("CropBox")) ?? mbB;
      if (!cbA.every((x, j) => Math.abs(x - cbB[j]) <= 0.01)) return `İmzalı PDF'in ${no}. sayfasının kırpma alanı farklı.`;
      const yon = (D: Belge, s: Sayfa) => ((((sayi(coz(D, s.miras("Rotate"))) ?? 0) % 360) + 360) % 360);
      if (yon(A, sa) !== yon(B, sb)) return `İmzalı PDF'in ${no}. sayfasının yönü farklı.`;
      for (const k of SAYFA_KORUNAN) if (sb.d.has(k) && !(sa.d.has(k) && esit(g, sa.d.get(k), sb.d.get(k)))) return `İmza programı ${no}. sayfaya izin dışı bir özellik eklemiş (${k}).`;
      /* kaynaklar: bizimkiler aynı adla, içerikçe aynı */
      const rA = sozluk(coz(A, sa.miras("Resources"))) ?? new Map<string, Deger>(), rB = sozluk(coz(B, sb.miras("Resources"))) ?? new Map<string, Deger>();
      for (const [tur, grupA] of rA) {
        if (tur === "ProcSet") continue;
        const gA = sozluk(coz(A, grupA)), gB = sozluk(coz(B, rB.get(tur)));
        if (!gA || !gB) return `İmzalı PDF'in ${no}. sayfasının kaynakları farklı (${tur}); belge değişmiş sayılır.`;
        for (const [ad, x] of gA) {
          if (!gB.has(ad) || !esit(g, x, gB.get(ad))) return `İmzalı PDF'in ${no}. sayfasında ${tur === "Font" ? "yazı tipi" : tur === "XObject" ? "resim" : "kaynak"} farklı (${ad}); belge değişmiş sayılır.`;
        }
      }
      /* çizim: bizimki aynen, tek parça; çevresi eklenen — eklenen çizimler kenarda ya da imza yerimizde */
      const sA = cizim(A, sa), sB = cizim(B, sb);
      const imzaYerleri = aciklamalar(A, sa).filter((d) => imzaAlaniMi(A, d)).map((d) => kutu(A, d.get("Rect"))).filter((k): k is Kutu => !!k);
      const gorunen: Kutu = [Math.max(cbB[0], mbB[0]), Math.max(cbB[1], mbB[1]), Math.min(cbB[2], mbB[2]), Math.min(cbB[3], mbB[3])];
      const xB = sozluk(coz(B, rB.get("XObject")));
      const damgaKenarda = (x: { ad: string; m: Matris }) => {
        const r = xB?.get(x.ad), d = sozluk(coz(B, r));
        if (!d || r?.t !== "ref") return false;
        const tur = adDegeri(B, d.get("Subtype"));
        let kap: Kutu | null = null;
        if (tur === "/Image") kap = kutuDonustur([0, 0, 1, 1], x.m);
        else if (tur === "/Form") {
          const bb = kutu(B, d.get("BBox")), fm = sayilar(B, d.get("Matrix"));
          if (bb) kap = kutuDonustur(bb, carp(fm && fm.length === 6 ? (fm as Matris) : BIRIM, x.m));
        }
        return !!kap && izinli(kap, gorunen, imzaYerleri);
      };
      let neden = `İmzalı PDF'in ${no}. sayfasının içeriği imzaya hazırlanan PDF'le aynı değil.`, uydu = false;
      for (let k = sB.indexOf(sA), deneme = 0; k >= 0 && deneme < BULMA_SINIR && !uydu; k = sB.indexOf(sA, k + 1), deneme++) {
        const c = eklenenCizimler(sB, k, k + sA.length, sayac);
        if (typeof c === "string") neden = c;
        else if (!c.every(damgaKenarda)) neden = `İmza programı ${no}. sayfada belgenin içeriğinin üstüne damga koymuş; belge değişmiş sayılır.`;
        else uydu = true;
      }
      if (!uydu) return neden;
      /* açıklamalar: bizim bağlantılarımız aynı yerde aynı adresle ya da atılmış; yeni açıklama yalnız imza alanı / http(s) bağlantı, kenarda */
      const aB = aciklamalar(B, sb), eslesen = new Set<number>(), bizimBaglantilar: Kutu[] = [];
      for (const d of aciklamalar(A, sa)) {
        if (imzaAlaniMi(A, d)) continue;
        const r = kutu(A, d.get("Rect"));
        if (acikTuru(A, d) === "/Link" && r) bizimBaglantilar.push(r);
        const j = aB.findIndex((e, n) => !eslesen.has(n) && acikTuru(B, e) === acikTuru(A, d) && esit(g, d.get("Rect"), e.get("Rect"))
          && esit(g, d.get("A") ?? null, e.get("A") ?? null) && esit(g, d.get("Dest") ?? null, e.get("Dest") ?? null));
        if (j >= 0) eslesen.add(j);
      }
      for (const [n, e] of aB.entries()) {
        if (eslesen.has(n)) continue;
        const r = kutu(B, e.get("Rect")), tur = acikTuru(B, e);
        if (!r) return `İmzalı PDF'in ${no}. sayfasındaki bir açıklama okunamadı.`;
        if (tur === "/Widget" && imzaAlaniMi(B, e)) {
          if (!izinli(r, gorunen, imzaYerleri)) return `İmza programı ${no}. sayfada imza kutusunu belgenin içeriğinin üstüne koymuş; imzayı imza yerine ya da sayfa kenarına koyun.`;
          continue;
        }
        if (tur === "/Link" && baglantiAdresi(B, e) && izinli(r, gorunen, imzaYerleri)) {
          if (bizimBaglantilar.some((x) => x.every((y, j) => Math.abs(y - r[j]) <= 1))) return `İmzalı PDF'in ${no}. sayfasındaki bağlantının adresi değiştirilmiş.`;
          continue;
        }
        return `İmza programı ${no}. sayfaya izin dışı bir açıklama eklemiş (${tur.slice(1) || "?"}).`;
      }
    }
    return null;
  } catch (e) {
    if (e instanceof Esdegersiz) return `İmzalı PDF karşılaştırılamadı: ${e.message}.`;
    if (e instanceof RangeError || e instanceof PdfHatasi) return "İmzalı PDF okunamadı.";
    throw e;
  }
}

const IMZA_SOZLUGU = /\/Type[\x00\t\n\f\r ]*\/Sig\b/g;
/** imzalı dosyanın sürüm sınırları (her %%EOF'tan ve ardından gelen TEK satır sonundan sonra): verilen konumdan, ilk imza sözlüğüne kadar */
function tabanAdaylari(s: string, bas: number): number[] {
  IMZA_SOZLUGU.lastIndex = bas;
  const ilk = IMZA_SOZLUGU.exec(s)?.index ?? -1, l: number[] = [];
  for (let i = s.indexOf("%%EOF", bas); i >= 0 && l.length < SINIR_SAYISI; i = s.indexOf("%%EOF", i + 5)) {
    let e = i + 5;
    if (s[e] === "\r") e++;
    if (s[e] === "\n") e++;
    if (ilk >= 0 && e > ilk) break;
    if (e > bas) l.push(e);
  }
  return l;
}

/** bayt öneki de içerik de tutmadı */
export const ESLESMEDI_TABAN = "Yüklenen PDF bu raporun imzaya hazırlanan PDF'i değil ya da imza taşımıyor.";
const ONCEKI_IMZA_BOZULUR = "Yüklenen PDF, imzalanacak PDF'in üstüne artımlı imzalanmamış: imza programı belgeyi yeniden yazmış olabilir, bu da belgedeki "
  + "önceki imzayı (teknik yöneticinin imzası) bozar. Belgeyi değiştirmeden imzalayan bir programla imzalayın.";
/** imzalı PDF'in TABANI: hazırladığımız PDF'in kendisi (bayt öneki — artımlı imza) ya da imza programının imzadan önceki sürümü (yeniden yazılmış
    ya da üstüne artımlı damga eklenmiş), içerikçe eşdeğer. Tabandan sonrası beyaz listeye uymalı (imza, uzun süreli doğrulama). Olmazsa nedeni.
    Kripto ve imzalayanın adı tabana göre ayrıca (ekImzaNedeni(taban, imzali), ekImzaIcerikleri(taban, imzali)). */
export function imzaliTaban(imzasiz: Uint8Array, imzali: Uint8Array): { taban: Uint8Array } | { neden: string } {
  if (imzaliPdfGecerli(imzasiz, imzali)) return { taban: imzasiz };
  const onek = imzali.length > imzasiz.length && Buffer.from(imzali.subarray(0, imzasiz.length)).equals(Buffer.from(imzasiz));
  /* ayrıntılı neden yalnız dosya BU belgenin (yeniden yazılmış) hâliyse — hazırladığımız PDF'in en az bir sayfasının çizimi imzalının aynı
     sayfasında aynen var; başka dosyada (yanlış rapor, başka belge) genel neden: "okunamadı" ya da "içeriği aynı değil" yanıltır */
  const tanidik = () => bizimCizimVar(imzasiz, imzali);
  IMZA_SOZLUGU.lastIndex = 0;
  /* hazırladığımız PDF imzalıysa (teknik yönetici) yalnız artımlı ek kabul: yeniden yazmak önceki imzayı bozar */
  if (!onek && IMZA_SOZLUGU.test(latin1(imzasiz))) return { neden: tanidik() ? ONCEKI_IMZA_BOZULUR : ESLESMEDI_TABAN };
  let neden: string | null = null;
  for (const e of tabanAdaylari(latin1(imzali), onek ? imzasiz.length : 0)) {
    const taban = imzali.subarray(0, e);
    if (!imzaliPdfGecerli(taban, imzali)) continue;
    neden = esdegerNedeni(imzasiz, taban);
    if (neden === null) return { taban };
  }
  /* okunamayan / karşılaştırılamayan dosyada ayrıntı yanıltır — genel neden */
  return { neden: neden !== null && !/^İmzalı PDF (?:okunamadı|karşılaştırılamadı)/.test(neden) && (onek || tanidik()) ? neden : ESLESMEDI_TABAN };
}

/** imzalı dosya bu belgeden mi türemiş: hazırladığımız PDF'in bir sayfasının çizimi (çözülmüş akışlar) imzalının aynı sıradaki sayfasında aynen
    var (okunamazsa hayır) */
function bizimCizimVar(imzasiz: Uint8Array, imzali: Uint8Array): boolean {
  try {
    const A = belge(imzasiz), B = belge(imzali), pa = sayfalar(A), pb = sayfalar(B);
    return pa.some((s, i) => {
      const c = i < pb.length ? cizim(A, s) : "";
      return c.trim().length >= 16 && cizim(B, pb[i]).includes(c);
    });
  } catch (e) {
    if (e instanceof Esdegersiz || e instanceof RangeError || e instanceof PdfHatasi) return false;
    throw e;
  }
}
