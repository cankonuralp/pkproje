/* DER / BER — İMZA SERVİSİNİN ORTAK OKUYUCU VE YAZICISI (IMZA-SERVISI.md ES1, 2026-10-17). Saf. Saldırganın denetlediği girdi (yüklenen imzalı PDF'in
   CMS'i, zaman damgası, sertifika): derinlik ve düğüm sayısı sınırlı, tek geçiş, uzunluk dosyayı aşamaz. Okuyucu kısa / uzun / belirsiz (BER)
   uzunluğu açar; yazıcı yalnız DER üretir (zaman damgası isteği, CMS kurulumu — ES2). Kriptografi yok. */

export interface Dugum { tag: number; bas: number; ic: number; icSon: number; son: number }
export class BozukDer extends Error {}

const DERINLIK = 40, DUGUM = 50_000;

export interface Okuyucu {
  b: Uint8Array;
  /** düğüm sayacı — bir çözümlemede paylaşılır */
  sayac: { n: number };
  /** en çok düğüm (iptal listesi büyük olabilir) */
  sinir: number;
}
export const okuyucu = (b: Uint8Array, sinir = DUGUM): Okuyucu => ({ b, sayac: { n: 0 }, sinir });

/** i'deki düğüm; sınır dışı / bozuk → BozukDer */
export function dugum(o: Okuyucu, i: number, derinlik = 0): Dugum {
  const b = o.b;
  if (derinlik > DERINLIK || ++o.sayac.n > o.sinir || i < 0 || i + 2 > b.length) throw new BozukDer();
  const tag = b[i];
  if ((tag & 0x1f) === 0x1f) throw new BozukDer();
  let j = i + 1, len = b[j++];
  if (len === 0x80) {
    if (!(tag & 0x20)) throw new BozukDer();
    let k = j;
    for (;;) {
      if (k + 2 > b.length) throw new BozukDer();
      if (b[k] === 0 && b[k + 1] === 0) break;
      k = dugum(o, k, derinlik + 1).son;
    }
    return { tag, bas: i, ic: j, icSon: k, son: k + 2 };
  }
  if (len & 0x80) {
    const n = len & 0x7f;
    if (n < 1 || n > 4 || j + n > b.length) throw new BozukDer();
    len = 0;
    for (let x = 0; x < n; x++) len = len * 256 + b[j++];
  }
  if (j + len > b.length) throw new BozukDer();
  return { tag, bas: i, ic: j, icSon: j + len, son: j + len };
}

/** yapılı düğümün çocukları */
export function cocuklar(o: Okuyucu, d: Dugum | undefined): Dugum[] {
  if (!d || !(d.tag & 0x20)) throw new BozukDer();
  const l: Dugum[] = [];
  for (let k = d.ic; k < d.icSon;) { const c = dugum(o, k); l.push(c); k = c.son; }
  return l;
}

/* eksik düğüm (yapıda olmayan alan) TypeError değil BozukDer — saldırganın girdisinde her yol "okunamadı"ya iner (inceleme 2026-10-17) */
const var_ = (d: Dugum | undefined): Dugum => { if (!d) throw new BozukDer(); return d; };
export const ic = (o: Okuyucu, d: Dugum | undefined) => { const x = var_(d); return o.b.subarray(x.ic, x.icSon); };
export const tum = (o: Okuyucu, d: Dugum | undefined) => { const x = var_(d); return o.b.subarray(x.bas, x.son); };

/** beklenen etiketli düğüm; değilse BozukDer */
export function bekle(d: Dugum | undefined, tag: number): Dugum {
  if (!d || d.tag !== tag) throw new BozukDer();
  return d;
}

/** OBJECT IDENTIFIER düğümü → "1.2.840…" */
export function oidOku(o: Okuyucu, d: Dugum | undefined): string {
  bekle(d, 0x06);
  const b = ic(o, d);
  if (!b.length || b.length > 64) throw new BozukDer();
  const l: number[] = [];
  let v = 0;
  for (let i = 0; i < b.length; i++) {
    v = v * 128 + (b[i] & 0x7f);
    if (v > Number.MAX_SAFE_INTEGER / 128) throw new BozukDer();
    if (!(b[i] & 0x80)) {
      if (!l.length) { const ilk = v < 80 ? Math.floor(v / 40) : 2; l.push(ilk, v - ilk * 40); } else l.push(v);
      v = 0;
    }
  }
  if (b[b.length - 1] & 0x80) throw new BozukDer();
  return l.join(".");
}

/** INTEGER → büyük harfli onaltılık, baştaki sıfırlar atılmış (seri numarası karşılaştırması) */
export function tamsayiHex(o: Okuyucu, d: Dugum | undefined): string {
  bekle(d, 0x02);
  return Buffer.from(ic(o, d)).toString("hex").toUpperCase().replace(/^0+(?=.)/, "");
}

/** UTCTime (0x17) / GeneralizedTime (0x18) → ISO; okunamazsa null */
export function zamanOku(o: Okuyucu, dd: Dugum | undefined): string | null {
  const d = var_(dd);
  if (d.tag !== 0x17 && d.tag !== 0x18) return null;
  const s = Buffer.from(ic(o, d)).toString("latin1");
  const m = d.tag === 0x17
    ? /^(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})?Z$/.exec(s)
    : /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})?(?:\.(\d{1,9}))?Z$/.exec(s);
  if (!m) return null;
  let yil = Number(m[1]);
  if (d.tag === 0x17) yil += yil < 50 ? 2000 : 1900;
  const ms = d.tag === 0x18 && m[7] ? Number(m[7].slice(0, 3).padEnd(3, "0")) : 0;
  const t = Date.UTC(yil, Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]), Number(m[6] ?? 0), ms);
  return Number.isNaN(t) ? null : new Date(t).toISOString();
}

/* ── YAZICI (yalnız DER) ── */
const uzunluk = (n: number): number[] => {
  if (n < 0x80) return [n];
  const l: number[] = [];
  for (let x = n; x > 0; x = Math.floor(x / 256)) l.unshift(x & 0xff);
  return [0x80 | l.length, ...l];
};
export const tlv = (tag: number, ...icler: Uint8Array[]) => {
  const g = Buffer.concat(icler);
  return Buffer.concat([Buffer.from([tag, ...uzunluk(g.length)]), g]);
};
export const sira = (...icler: Uint8Array[]) => tlv(0x30, ...icler);
/** SET OF — DER: öğeler kodlanmış hâlleriyle sıralanır */
export const kume = (...icler: Uint8Array[]) => tlv(0x31, ...[...icler].map((x) => Buffer.from(x)).sort(Buffer.compare));
export const oktet = (b: Uint8Array) => tlv(0x04, b);
export const bos = () => Buffer.from([0x05, 0x00]);
export const mantiksal = (v: boolean) => Buffer.from([0x01, 0x01, v ? 0xff : 0x00]);
export function oid(s: string): Buffer {
  const p = s.split(".").map(Number);
  if (p.length < 2 || p.some((x) => !Number.isSafeInteger(x) || x < 0)) throw new Error(`geçersiz OID ${s}`);
  const l = [40 * p[0] + p[1]];
  for (const x of p.slice(2)) { const b = [x & 0x7f]; for (let y = Math.floor(x / 128); y; y = Math.floor(y / 128)) b.unshift((y & 0x7f) | 0x80); l.push(...b); }
  return tlv(0x06, Buffer.from(l));
}
/** negatif olmayan tamsayı (sayı ya da büyük-endian bayt) */
export function tamsayi(v: number | bigint | Uint8Array): Buffer {
  let b: Buffer;
  if (v instanceof Uint8Array) b = Buffer.from(v);
  else { let h = BigInt(v).toString(16); if (h.length % 2) h = `0${h}`; b = Buffer.from(h, "hex"); }
  let i = 0;
  while (i < b.length - 1 && b[i] === 0 && !(b[i + 1] & 0x80)) i++;
  b = b.subarray(i);
  return tlv(0x02, b[0] & 0x80 ? Buffer.concat([Buffer.from([0]), b]) : b);
}
/** GeneralizedTime (saniye, Z) */
export const genelZaman = (t: Date) => tlv(0x18, Buffer.from(t.toISOString().replace(/[-:T]/g, "").replace(/\.\d{3}Z$/, "Z"), "latin1"));
/** UTCTime (2049'a kadar) */
export const utcZaman = (t: Date) => tlv(0x17, Buffer.from(t.toISOString().slice(2).replace(/[-:T]/g, "").replace(/\.\d{3}Z$/, "Z"), "latin1"));
/** [n] açık (EXPLICIT) etiket */
export const acik = (n: number, ...icler: Uint8Array[]) => tlv(0xa0 | n, ...icler);
