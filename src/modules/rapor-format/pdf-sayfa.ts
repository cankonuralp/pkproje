/* BASILI FORMDAN ŞABLON — PDF SAYFASININ OKUNMASI, yapay zekâsız (2026-10-24; reisim: "ben şablon yükledim bu şablondan başlat dedim neden yapay
   zeka çalışıyor ?", "en baştan beri bunu istedim"). pdf.js'in işlem listesi (getOperatorList) ve metni (getTextContent) → PdfSayfasi (pdf-tipler.ts):
     · yazılar — yer, boy, genişlik; kalın / eğik ve yazı tipinin adı yüklenen yazı tipi nesnesinden (page.commonObjs; alt küme ön eki "ABCDEF+" atılır)
     · dolgular — dolgulu yolların her alt yolunun kutusu + o anki dolgu rengi; aynı yolda iç içe dikdörtgenler (çerçeve: dış + iç, çift-tek dolgu ya
       da ters dönüş) DELİK sayılır, dolgu çerçevenin şeritleridir (dış kutu zemin sanılmasın)
     · çizgiler — çizilen yolların düz parçaları, kalınlık dönüşüm ölçeğiyle; saydam çizgi / dolgu atılır, yumuşak maske grubunun içi görünmez
     · resimler — birim karenin dönüşümle kapladığı kutu
   Dönüşüm yığını (save / restore / transform, form nesnesi, açıklama) çizimdeki gibi izlenir; kırpma bölgesi kutu olarak tutulur (kırpılan dışta kalan
   atılır, taşan kısım kesilir). Koordinatlar viewport.transform ile SOL ÜST kökenli punto. Sınırlar PDF_SINIR (aşan sayfa / öğe kesilir, hata yok).
   pdfjs-dist BU DOSYADA içe aktarılmaz: tarayıcı (ui/pdfOku.ts) ve testler kendi modülünü verir. İşlem listesinin biçimi pdfjs-dist 5.4.149'un
   kaynağından doğrulandı (legacy/build/pdf.worker.mjs buildPath / getOperatorList, pdf.mjs CanvasGraphics):
     constructPath [boyama işlemi, [yol verisi Float32Array | null], minMax] — yol verisi kullanıcı uzayında, DrawOPS kodlarıyla
     setFillRGBColor / setStrokeRGBColor ["#rrggbb"] — işçi gri, CMYK ve renk uzaylarını onaltılığa çevirir (sayı gelirse burada çevrilir)
     paintImageXObject / paintInlineImageXObject / paintImageMaskXObject birim kare × CTM; …Repeat ve …Group kendi dönüşümleriyle */

import { PDF_SINIR, type PdfCizgi, type PdfDolgu, type PdfResim, type PdfSayfasi, type PdfYazi } from "./pdf-tipler.ts";

/** pdf.js modülünün kullanılan kısmı (pdfjs-dist/legacy/build/pdf.mjs) */
export interface PdfjsModulu { OPS: Record<string, number>; Util: { transform(a: number[], b: number[]): number[] } }
/** pdf.js PDFDocumentProxy'nin kullanılan kısmı; sayfanın kullanılan kısmı aşağıda (SayfaNesnesi) denetlenir */
export interface PdfBelgesi { numPages: number; getPage(n: number): Promise<unknown> }

interface Gorunum { width: number; height: number; transform: number[] }
interface YaziTipleri { has(id: string): boolean; get(id: string, geri?: (v: unknown) => void): unknown }
interface SayfaNesnesi {
  getViewport(o: { scale: number }): Gorunum;
  getOperatorList(): Promise<{ fnArray: ArrayLike<number>; argsArray: ArrayLike<unknown> }>;
  getTextContent(): Promise<{ items: unknown[]; styles?: Record<string, { fontFamily?: unknown; vertical?: unknown } | undefined> }>;
  commonObjs?: YaziTipleri;
  cleanup?(): unknown;
}

/** pdf.js 5.x DrawOPS (src/shared/util.js — modül dışa açmaz): yol verisindeki komut kodları */
const YOL = { git: 0, cizgi: 1, egri: 2, kapat: 3 } as const;
/** yazı tipi nesnesi gelmezse beklenecek en uzun süre (ms) */
const YAZI_TIPI_BEKLE = 1500;
/** iç içe dikdörtgen araması bu sayıya kadar (bir yolda daha çok dikdörtgen: her alt yolun kutusu) */
const DELIK_EN_COK = 1500;
const E = 0.01;

type Matris = number[];
interface Kutu { x0: number; y0: number; x1: number; y1: number }
interface Durum {
  ctm: Matris;
  /** "#RRGGBB" · null: saydam / desen (dolgu atılır) */
  dolgu: string | null;
  cizgiRengi: string | null;
  dolguAlfa: number; cizgiAlfa: number;
  kalinlik: number;
  /** kırpma bölgesinin kutusu (sayfa noktası) · null: kırpma yok */
  kirp: Kutu | null;
}
/** alt yol: noktalar sayfa noktası; düz parçaların kullanıcı uzayındaki uçları (kalınlık için) */
interface AltYol { noktalar: number[][]; parcalar: number[][]; egri: boolean }

const BIRIM: Matris = [1, 0, 0, 1, 0, 0];
const yuv = (n: number) => Math.round(n * 100) / 100;
const sayi = (x: unknown): x is number => typeof x === "number" && Number.isFinite(x);
const matrisMi = (x: unknown): x is ArrayLike<number> =>
  !!x && typeof x === "object" && (x as ArrayLike<unknown>).length === 6 && Array.from(x as ArrayLike<unknown>).every(sayi);
const nokta = (m: Matris, x: number, y: number) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
const kutuBos = (k: Kutu) => k.x1 - k.x0 <= E || k.y1 - k.y0 <= E;
function kutusu(noktalar: number[][]): Kutu {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of noktalar) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  return { x0, y0, x1, y1 };
}
const kesisim = (a: Kutu, b: Kutu | null): Kutu => (b ? { x0: Math.max(a.x0, b.x0), y0: Math.max(a.y0, b.y0), x1: Math.min(a.x1, b.x1), y1: Math.min(a.y1, b.y1) } : a);
/** birim karenin (resim) m ile kapladığı kutu */
const birimKare = (m: Matris) => kutusu([nokta(m, 0, 0), nokta(m, 1, 0), nokta(m, 0, 1), nokta(m, 1, 1)]);

/* ── renk ── */
const onaltili = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
/** renk işleminin argümanı → "#RRGGBB"; desen / bilinmeyen → null. pdf.js 5.x onaltılık verir; sayılar 1 (gri) · 3 (RGB) · 4 (CMYK) */
function renk(a: unknown[]): string | null {
  const x = a[0];
  if (typeof x === "string") return /^#[0-9a-fA-F]{6}$/.test(x) ? x.toUpperCase() : null;
  const s = a.filter(sayi);
  if (s.length !== a.length) return null;
  const bir = s.every((v) => v <= 1);
  const b = (v: number) => (bir ? v * 255 : v);
  if (s.length === 1) { const g = onaltili(b(s[0])); return `#${g}${g}${g}`.toUpperCase(); }
  if (s.length === 3) return `#${s.map((v) => onaltili(b(v))).join("")}`.toUpperCase();
  if (s.length === 4) {
    const [c, m, y, k] = s.map((v) => Math.max(0, Math.min(1, bir ? v : v / 255)));
    return `#${[c, m, y].map((v) => onaltili(255 * (1 - v) * (1 - k))).join("")}`.toUpperCase();
  }
  return null;
}

/* ── yol ── */
/** yol verisi (DrawOPS) → alt yollar; noktalar m ile sayfaya çevrilir */
function altYollar(veri: ArrayLike<number>, m: Matris): AltYol[] {
  const l: AltYol[] = [];
  let a: AltYol | undefined;
  /* b: şu anki nokta, s: alt yolun başı (kullanıcı uzayı) */
  let bx = 0, by = 0, sx = 0, sy = 0;
  for (let k = 0; k < veri.length;) {
    const kod = veri[k++];
    if (kod === YOL.kapat) {
      /* tek parçalı alt yolun kapanışı aynı parçanın tersidir (sıfır kalınlıklı dikdörtgen) */
      if (a && (bx !== sx || by !== sy) && !(a.parcalar.length === 1 && !a.egri)) a.parcalar.push([bx, by, sx, sy]);
      a = undefined; bx = sx; by = sy;
      continue;
    }
    const n = kod === YOL.git || kod === YOL.cizgi ? 2 : kod === YOL.egri ? 6 : 0;
    if (!n || k + n > veri.length) break;
    const v = Array.from({ length: n }, (_, i) => veri[k + i]);
    k += n;
    if (!v.every(sayi)) break;
    const x = v[n - 2], y = v[n - 1];
    if (kod === YOL.git) {
      a = { noktalar: [nokta(m, x, y)], parcalar: [], egri: false };
      l.push(a);
      sx = bx = x; sy = by = y;
      continue;
    }
    /* kapanıştan sonra git'siz çizgi: yeni alt yol şu anki noktadan başlar */
    if (!a) { a = { noktalar: [nokta(m, bx, by)], parcalar: [], egri: false }; l.push(a); sx = bx; sy = by; }
    if (kod === YOL.cizgi) a.parcalar.push([bx, by, x, y]);
    else { a.egri = true; a.noktalar.push(nokta(m, v[0], v[1]), nokta(m, v[2], v[3])); }
    a.noktalar.push(nokta(m, x, y));
    bx = x; by = y;
  }
  return l;
}

/** alt yol eksenlere paralel bir dikdörtgen mi (sayfa noktasında); öyleyse kutusu ve dönüş yönü */
function dikdortgen(a: AltYol): { k: Kutu; yon: number } | null {
  if (a.egri) return null;
  const n = a.noktalar.slice();
  const ilk = n[0], son = n[n.length - 1];
  if (n.length === 5 && Math.abs(ilk[0] - son[0]) < E && Math.abs(ilk[1] - son[1]) < E) n.pop();
  if (n.length !== 4) return null;
  for (let i = 0; i < 4; i++) {
    const [x1, y1] = n[i], [x2, y2] = n[(i + 1) % 4];
    if (Math.abs(x1 - x2) >= E && Math.abs(y1 - y2) >= E) return null;
  }
  let alan = 0;
  for (let i = 0; i < 4; i++) { const [x1, y1] = n[i], [x2, y2] = n[(i + 1) % 4]; alan += x1 * y2 - x2 * y1; }
  return { k: kutusu(n), yon: Math.sign(alan) };
}
const icinde = (a: Kutu, b: Kutu) => a.x0 >= b.x0 - E && a.y0 >= b.y0 - E && a.x1 <= b.x1 + E && a.y1 <= b.y1 + E
  && (a.x0 > b.x0 + E || a.y0 > b.y0 + E || a.x1 < b.x1 - E || a.y1 < b.y1 - E);
/** kutudan delikleri çıkar → kalan dikdörtgenler */
function cikar(k: Kutu, delikler: Kutu[], enCok: number): Kutu[] {
  let parca = [k];
  for (const d of delikler) {
    const yeni: Kutu[] = [];
    for (const p of parca) {
      const x0 = Math.max(p.x0, d.x0), y0 = Math.max(p.y0, d.y0), x1 = Math.min(p.x1, d.x1), y1 = Math.min(p.y1, d.y1);
      if (x1 - x0 <= E || y1 - y0 <= E) { yeni.push(p); continue; }
      yeni.push({ x0: p.x0, y0: p.y0, x1: p.x1, y1: y0 }, { x0: p.x0, y0: y1, x1: p.x1, y1: p.y1 },
        { x0: p.x0, y0, x1: x0, y1 }, { x0: x1, y0, x1: p.x1, y1 });
    }
    parca = yeni.filter((p) => !kutuBos(p));
    if (parca.length > enCok) break;
  }
  return parca.slice(0, enCok);
}
/** dolgulu yolun boyanan kutuları: her alt yolun kutusu; iç içe dikdörtgenlerde delik çıkarılır (çift-tek: derinlik çift; sıfırdan farklı: dönüş toplamı 0) */
function dolguKutulari(yollar: AltYol[], ciftTek: boolean, enCok: number): Kutu[] {
  const sonuc: Kutu[] = [];
  const d: { k: Kutu; yon: number }[] = [];
  for (const a of yollar) {
    if (a.noktalar.length < 2) continue;
    const r = dikdortgen(a);
    if (r && r.yon !== 0) d.push(r); else sonuc.push(kutusu(a.noktalar));
  }
  if (d.length > DELIK_EN_COK) return [...sonuc, ...d.map((x) => x.k)];
  /* her dikdörtgeni içine alanlar ve en yakın (en küçük) kapsayan */
  const kapsayan = d.map((x) => d.flatMap((y, j) => (icinde(x.k, y.k) ? [j] : [])));
  const alan = (k: Kutu) => (k.x1 - k.x0) * (k.y1 - k.y0);
  const ust = kapsayan.map((l) => (l.length ? l.reduce((a, b) => (alan(d[b].k) < alan(d[a].k) ? b : a)) : -1));
  const dolu = d.map((x, i) => (ciftTek ? (kapsayan[i].length + 1) % 2 === 1 : x.yon + kapsayan[i].reduce((t, j) => t + d[j].yon, 0) !== 0));
  for (let i = 0; i < d.length && sonuc.length < enCok; i++) {
    if (!dolu[i] || (ust[i] >= 0 && dolu[ust[i]])) continue;
    /* delikler: bu dikdörtgenin içinde, dolu olmayan ve üstü dolu olanlar (en dıştaki delikler) */
    const delikler = d.flatMap((x, j) => (kapsayan[j].includes(i) && !dolu[j] && ust[j] >= 0 && dolu[ust[j]] ? [x.k] : []));
    sonuc.push(...cikar(d[i].k, delikler, enCok - sonuc.length));
  }
  return sonuc;
}

/** parçayı kutuya kırp (Liang–Barsky); dışta kalırsa null */
function parcaKirp(p: number[], k: Kutu | null): number[] | null {
  if (!k) return p;
  const [x1, y1, x2, y2] = p, dx = x2 - x1, dy = y2 - y1;
  let t0 = 0, t1 = 1;
  for (const [q, r] of [[-dx, x1 - k.x0], [dx, k.x1 - x1], [-dy, y1 - k.y0], [dy, k.y1 - y1]]) {
    if (Math.abs(q) < 1e-9) { if (r < 0) return null; continue; }
    const t = r / q;
    if (q < 0) { if (t > t1) return null; if (t > t0) t0 = t; } else { if (t < t0) return null; if (t < t1) t1 = t; }
  }
  return [x1 + t0 * dx, y1 + t0 * dy, x1 + t1 * dx, y1 + t1 * dy];
}

/* ── yazı tipi ── */
interface YaziTipi { ad: string; kalin: boolean; egik: boolean }
async function yaziTipiNesnesi(t: YaziTipleri | undefined, id: string): Promise<Record<string, unknown> | null> {
  if (!t) return null;
  const nesne = (v: unknown) => (v && typeof v === "object" ? (v as Record<string, unknown>) : null);
  try { if (t.has(id)) return nesne(t.get(id)); } catch { return null; }
  let sure: ReturnType<typeof setTimeout> | undefined;
  const v = await Promise.race([
    new Promise<unknown>((tamam) => { try { t.get(id, tamam); } catch { tamam(null); } }),
    new Promise<null>((tamam) => { sure = setTimeout(() => tamam(null), YAZI_TIPI_BEKLE); }),
  ]);
  clearTimeout(sure);
  return nesne(v);
}
/** yazı tipinin adı → kalın / eğik ("TimesNewRomanPS-BoldMT", "Arial,BoldItalic", "Calibri-Bold", "Times-BoldItalic") */
export function yaziTipiCoz(ham: string, yedekAile: string): YaziTipi {
  const ad = ham.replace(/^[A-Z]{6}\+/, "").trim() || yedekAile;
  return { ad, kalin: /bold|black|heavy/i.test(ad), egik: /italic|oblique|kursiv/i.test(ad) };
}

/* ── sayfa ── */
function sayfaMi(x: unknown): x is SayfaNesnesi {
  const s = x as SayfaNesnesi | null;
  return !!s && typeof s.getViewport === "function" && typeof s.getOperatorList === "function" && typeof s.getTextContent === "function";
}

async function sayfaOku(sayfa: SayfaNesnesi, pdfjs: PdfjsModulu): Promise<PdfSayfasi> {
  const O = pdfjs.OPS;
  const carp = (a: Matris, b: ArrayLike<number>) => pdfjs.Util.transform(a, Array.from(b));
  const g = sayfa.getViewport({ scale: 1 });
  const vt: Matris = matrisMi(g.transform) ? Array.from(g.transform) : [1, 0, 0, -1, 0, g.height];
  const yazilar: PdfYazi[] = [], dolgular: PdfDolgu[] = [], cizgiler: PdfCizgi[] = [], resimler: PdfResim[] = [];
  /* 2026-10-24: görünen sayfa (CropBox — viewport) ilk kırpmadır: görüntüleyicide görünmeyen, sayfa dışındaki çizgi / dolgu / resim okunmaz */
  const sayfaKutusu: Kutu = { x0: 0, y0: 0, x1: g.width, y1: g.height };

  /* önce işlem listesi: yazı tipleri bu sırada yüklenir (commonObjs) */
  const liste = await sayfa.getOperatorList();
  let d: Durum = { ctm: BIRIM, dolgu: "#000000", cizgiRengi: "#000000", dolguAlfa: 1, cizgiAlfa: 1, kalinlik: 1, kirp: sayfaKutusu };
  const yigin: Durum[] = [];
  const kaydet = () => { yigin.push(d); d = { ...d }; };
  const geriAl = () => { d = yigin.pop() ?? d; };
  /** yumuşak maske gruplarının iç içe sayısı (içleri görünmez) · grupların maske olup olmadığı */
  let gizli = 0;
  const gruplar: boolean[] = [];
  let bekleyenKirp = false, yolSayisi = 0;
  const kutuEkle = (k: Kutu, renk_: string) => {
    const x = kesisim(k, d.kirp);
    if (kutuBos(x) || dolgular.length >= PDF_SINIR.yol) return;
    dolgular.push({ x: yuv(x.x0), y: yuv(x.y0), g: yuv(x.x1 - x.x0), h: yuv(x.y1 - x.y0), renk: renk_ });
  };
  const resimEkle = (m: Matris) => {
    if (gizli || resimler.length >= PDF_SINIR.resim) return;
    const x = kesisim(birimKare(carp(vt, m)), d.kirp);
    if (!kutuBos(x)) resimler.push({ x: yuv(x.x0), y: yuv(x.y0), g: yuv(x.x1 - x.x0), h: yuv(x.y1 - x.y0) });
  };
  const DOLGU = new Set([O.fill, O.eoFill, O.fillStroke, O.eoFillStroke, O.closeFillStroke, O.closeEOFillStroke]);
  const CIFT_TEK = new Set([O.eoFill, O.eoFillStroke, O.closeEOFillStroke]);
  const CIZGI = new Set([O.stroke, O.closeStroke, O.fillStroke, O.eoFillStroke, O.closeFillStroke, O.closeEOFillStroke]);

  const yol = (a: unknown[]) => {
    const islem = a[0], veri = Array.isArray(a[1]) ? (a[1] as unknown[])[0] : null;
    if (!sayi(islem) || !veri || typeof veri !== "object" || !sayi((veri as ArrayLike<number>).length)) { bekleyenKirp = false; return; }
    const M = carp(vt, d.ctm);
    const alt = altYollar(veri as ArrayLike<number>, M);
    const boya = !gizli && yolSayisi < PDF_SINIR.yol && (DOLGU.has(islem) || CIZGI.has(islem));
    if (boya) yolSayisi++;
    if (boya && DOLGU.has(islem) && d.dolgu && d.dolguAlfa > 0) {
      for (const k of dolguKutulari(alt, CIFT_TEK.has(islem), PDF_SINIR.yol - dolgular.length)) kutuEkle(k, d.dolgu);
    }
    if (boya && CIZGI.has(islem) && d.cizgiRengi && d.cizgiAlfa > 0) {
      /* kalınlık: kalem çemberi M ile elipse döner; parçaya dik kalınlık = w · |det M| / |M·u| (u parçanın kullanıcı uzayındaki yönü) */
      const det = Math.abs(M[0] * M[3] - M[1] * M[2]);
      for (const p of alt.flatMap((x) => x.parcalar)) {
        if (cizgiler.length >= PDF_SINIR.yol) break;
        const ux = p[2] - p[0], uy = p[3] - p[1], u = Math.hypot(ux, uy);
        if (u < 1e-9) continue;
        const mu = Math.hypot(M[0] * ux + M[2] * uy, M[1] * ux + M[3] * uy) / u;
        const kalinlik = mu > 1e-9 ? (d.kalinlik * det) / mu : 0;
        const pay = kalinlik / 2 + 0.5;
        const kirp = d.kirp && { x0: d.kirp.x0 - pay, y0: d.kirp.y0 - pay, x1: d.kirp.x1 + pay, y1: d.kirp.y1 + pay };
        const s = parcaKirp([...nokta(M, p[0], p[1]), ...nokta(M, p[2], p[3])], kirp);
        if (!s || Math.hypot(s[2] - s[0], s[3] - s[1]) < E) continue;
        cizgiler.push({ x1: yuv(s[0]), y1: yuv(s[1]), x2: yuv(s[2]), y2: yuv(s[3]), kalinlik: yuv(kalinlik) });
      }
    }
    /* kırpma boyamadan SONRA geçerli olur (çizimdeki consumePath gibi); boş yol öncekini bozmaz */
    if (bekleyenKirp) {
      bekleyenKirp = false;
      const noktalar = alt.flatMap((x) => x.noktalar);
      if (noktalar.length) d.kirp = kesisim(kutusu(noktalar), d.kirp);
    }
  };

  const fn = liste.fnArray, args = liste.argsArray;
  for (let i = 0; i < fn.length; i++) {
    const f = fn[i];
    const a = Array.isArray(args[i]) ? (args[i] as unknown[]) : [];
    switch (f) {
      case O.save: kaydet(); break;
      case O.restore: geriAl(); break;
      case O.transform: if (a.length === 6 && a.every(sayi)) d.ctm = carp(d.ctm, a as number[]); break;
      case O.setLineWidth: if (sayi(a[0])) d.kalinlik = Math.abs(a[0]); break;
      case O.setGState:
        for (const s of Array.isArray(a[0]) ? a[0] : []) {
          if (!Array.isArray(s) || !sayi(s[1])) continue;
          if (s[0] === "LW") d.kalinlik = Math.abs(s[1]); else if (s[0] === "ca") d.dolguAlfa = s[1]; else if (s[0] === "CA") d.cizgiAlfa = s[1];
        }
        break;
      case O.setFillRGBColor: case O.setFillGray: case O.setFillCMYKColor: case O.setFillColor: case O.setFillColorN: d.dolgu = renk(a); break;
      case O.setStrokeRGBColor: case O.setStrokeGray: case O.setStrokeCMYKColor: case O.setStrokeColor: case O.setStrokeColorN: d.cizgiRengi = renk(a); break;
      case O.setFillTransparent: d.dolgu = null; break;
      case O.setStrokeTransparent: d.cizgiRengi = null; break;
      case O.clip: case O.eoClip: bekleyenKirp = true; break;
      case O.constructPath: yol(a); break;
      case O.paintFormXObjectBegin: {
        kaydet();
        if (matrisMi(a[0])) d.ctm = carp(d.ctm, a[0]);
        const k = a[1] as ArrayLike<number> | null;
        if (k && k.length === 4 && Array.from(k).every(sayi)) {
          const m = carp(vt, d.ctm);
          d.kirp = kesisim(kutusu([nokta(m, k[0], k[1]), nokta(m, k[2], k[1]), nokta(m, k[0], k[3]), nokta(m, k[2], k[3])]), d.kirp);
        }
        break;
      }
      case O.paintFormXObjectEnd: geriAl(); break;
      case O.beginGroup: {
        kaydet();
        const maske = !!(a[0] && typeof a[0] === "object" && (a[0] as { smask?: unknown }).smask);
        gruplar.push(maske);
        if (maske) gizli++;
        d.dolguAlfa = d.cizgiAlfa = 1;
        break;
      }
      case O.endGroup: if (gruplar.pop()) gizli = Math.max(0, gizli - 1); geriAl(); break;
      case O.beginAnnotation: {
        /* açıklama (form alanı görünümü): sayfanın temel dönüşümünden, kendi dikdörtgenine kırpılı; durum baştan */
        kaydet();
        const r = a[1] as ArrayLike<number> | null;
        d = { ctm: BIRIM, dolgu: "#000000", cizgiRengi: "#000000", dolguAlfa: 1, cizgiAlfa: 1, kalinlik: 1, kirp: sayfaKutusu };
        if (r && r.length === 4 && Array.from(r).every(sayi)) {
          d.kirp = kesisim(kutusu([nokta(vt, r[0], r[1]), nokta(vt, r[2], r[1]), nokta(vt, r[0], r[3]), nokta(vt, r[2], r[3])]), sayfaKutusu);
        }
        if (matrisMi(a[2])) d.ctm = carp(d.ctm, a[2]);
        if (matrisMi(a[3])) d.ctm = carp(d.ctm, a[3]);
        break;
      }
      case O.endAnnotation: geriAl(); break;
      case O.paintImageXObject: case O.paintInlineImageXObject: case O.paintImageMaskXObject: resimEkle(d.ctm); break;
      case O.paintImageXObjectRepeat: {
        const [, sx, sy, yer] = a as [unknown, unknown, unknown, ArrayLike<number> | undefined];
        if (sayi(sx) && sayi(sy) && yer) for (let j = 0; j + 1 < yer.length; j += 2) resimEkle(carp(d.ctm, [sx, 0, 0, sy, yer[j], yer[j + 1]]));
        break;
      }
      case O.paintImageMaskXObjectRepeat: {
        const [, sx, kx, ky, sy, yer] = a as [unknown, unknown, unknown, unknown, unknown, ArrayLike<number> | undefined];
        if ([sx, kx, ky, sy].every(sayi) && yer) {
          for (let j = 0; j + 1 < yer.length; j += 2) resimEkle(carp(d.ctm, [sx as number, kx as number, ky as number, sy as number, yer[j], yer[j + 1]]));
        }
        break;
      }
      case O.paintImageMaskXObjectGroup: case O.paintInlineImageXObjectGroup: {
        const l = f === O.paintImageMaskXObjectGroup ? a[0] : a[1];
        for (const r of Array.isArray(l) ? l : []) {
          const t = (r as { transform?: unknown } | null)?.transform;
          if (matrisMi(t)) resimEkle(carp(d.ctm, t));
        }
        break;
      }
      case O.paintSolidColorImageMask:
        /* tek pikselli maske: birim kare dolgu rengiyle boyanır */
        if (!gizli && d.dolgu && d.dolguAlfa > 0) kutuEkle(birimKare(carp(vt, d.ctm)), d.dolgu);
        break;
    }
  }

  /* sonra metin: konum viewport dönüşümüyle; kutu yazının yönünde (düz yazıda taban çizgisi y + h) */
  const metin = await sayfa.getTextContent();
  const stiller = metin.styles ?? {};
  const tipler = new Map<string, YaziTipi>();
  for (const oge of metin.items) {
    if (yazilar.length >= PDF_SINIR.yazi) break;
    const o = oge as { str?: unknown; transform?: unknown; width?: unknown; fontName?: unknown };
    if (typeof o.str !== "string" || !o.str.trim() || !matrisMi(o.transform)) continue;
    const ad = typeof o.fontName === "string" ? o.fontName : "";
    let tip = tipler.get(ad);
    if (!tip) {
      const n = ad ? await yaziTipiNesnesi(sayfa.commonObjs, ad) : null;
      const aile = stiller[ad]?.fontFamily;
      const c = yaziTipiCoz(typeof n?.name === "string" ? n.name : "", typeof aile === "string" ? aile : "");
      tip = { ...c, kalin: c.kalin || n?.bold === true || n?.black === true, egik: c.egik || n?.italic === true };
      tipler.set(ad, tip);
    }
    const t = carp(vt, o.transform);
    const boy = Math.hypot(t[2], t[3]);
    if (!sayi(boy) || boy <= 0) continue;
    const gen = sayi(o.width) && o.width > 0 ? o.width : 0;
    const sag = Math.hypot(t[0], t[1]) > 1e-9 ? [t[0] / Math.hypot(t[0], t[1]), t[1] / Math.hypot(t[0], t[1])] : [1, 0];
    const yuk = [t[2] / boy, t[3] / boy];
    const p0 = [t[4], t[5]], p1 = [t[4] + gen * sag[0], t[5] + gen * sag[1]];
    const k = kutusu([p0, p1, [p0[0] + boy * yuk[0], p0[1] + boy * yuk[1]], [p1[0] + boy * yuk[0], p1[1] + boy * yuk[1]]]);
    if (![k.x0, k.y0, k.x1, k.y1].every(sayi) || k.x1 < 0 || k.y1 < 0 || k.x0 > g.width || k.y0 > g.height) continue;
    yazilar.push({ s: o.str, x: yuv(k.x0), y: yuv(k.y0), g: yuv(k.x1 - k.x0), h: yuv(k.y1 - k.y0), boy: yuv(boy), kalin: tip.kalin, egik: tip.egik, aile: tip.ad });
  }
  return { en: yuv(g.width), boy: yuv(g.height), yazilar, dolgular, cizgiler, resimler };
}

/** belgenin sayfaları (en çok PDF_SINIR.sayfa) → PdfSayfasi[] */
export async function pdfSayfalari(doc: PdfBelgesi, pdfjs: PdfjsModulu): Promise<PdfSayfasi[]> {
  const l: PdfSayfasi[] = [];
  const n = Math.min(Math.max(0, Math.floor(doc.numPages) || 0), PDF_SINIR.sayfa);
  for (let i = 1; i <= n; i++) {
    const sayfa = await doc.getPage(i);
    if (!sayfaMi(sayfa)) throw new Error("PDF sayfası okunamadı.");
    try { l.push(await sayfaOku(sayfa, pdfjs)); } finally { try { sayfa.cleanup?.(); } catch { /* temizlik okumayı bozmaz */ } }
  }
  return l;
}
