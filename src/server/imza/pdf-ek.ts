/* PDF ARTIMLI EK YAZICISI (IMZA-SERVISI.md ES2 — imza motoru, 2026-10-17). Saf. İmzalı belgenin özgün baytlarına DOKUNMADAN sonuna yeni nesneler, yeni
   çapraz başvuru (özgündeki türde: klasik tablo ya da xref akışı) ve trailer ekler — PAdES'in uzun süreli doğrulama eki (DSS, belge zaman damgası)
   ve kendi imzamızın yer tutucusu bununla yazılır. Sözlük cerrahisi: üst düzey anahtarın değeri ayrıştırılarak bulunur (metin araması değil);
   nesnenin son tanımı düz metinden ya da sıkıştırılmış nesne akışından (ObjStm) okunur. Şifreli PDF desteklenmez. */
import { inflateSync } from "node:zlib";

export class PdfHatasi extends Error {}
const B = /[\x00\t\n\f\r ]/, AYRAC = /[()<>[\]{}/%]/;

/* ── sözlük ayrıştırma (yalnız yer bulma) ── */
function bosAt(s: string, i: number): number {
  for (;;) {
    while (i < s.length && B.test(s[i])) i++;
    if (s[i] === "%") { while (i < s.length && s[i] !== "\n" && s[i] !== "\r") i++; continue; }
    return i;
  }
}
/** i'deki değerin sonu (özyinelemeli; derinlik sınırlı) */
function degerSonu(s: string, i: number, derinlik = 0): number {
  if (derinlik > 64) throw new PdfHatasi("derin");
  i = bosAt(s, i);
  if (s.startsWith("<<", i)) {
    i += 2;
    for (;;) {
      i = bosAt(s, i);
      if (s.startsWith(">>", i)) return i + 2;
      if (s[i] !== "/") throw new PdfHatasi("sözlük anahtarı");
      i = adSonu(s, i);
      i = degerSonu(s, i, derinlik + 1);
    }
  }
  if (s[i] === "[") {
    i++;
    for (;;) { i = bosAt(s, i); if (s[i] === "]") return i + 1; if (i >= s.length) throw new PdfHatasi("dizi"); i = degerSonu(s, i, derinlik + 1); }
  }
  if (s[i] === "(") {
    let d = 0;
    for (; i < s.length; i++) { if (s[i] === "\\") { i++; continue; } if (s[i] === "(") d++; else if (s[i] === ")" && --d === 0) return i + 1; }
    throw new PdfHatasi("dize");
  }
  if (s[i] === "<") { const e = s.indexOf(">", i); if (e < 0) throw new PdfHatasi("onaltılık"); return e + 1; }
  if (s[i] === "/") return adSonu(s, i);
  const b = i;
  while (i < s.length && !B.test(s[i]) && !AYRAC.test(s[i])) i++;
  if (i === b) throw new PdfHatasi("değer");
  /* başvuru "n g R" */
  const m = /^[\x00\t\n\f\r ]+(\d{1,5})[\x00\t\n\f\r ]+R(?![^\x00\t\n\f\r ()<>[\]{}/%])/.exec(s.slice(i, i + 24));
  return /^\d+$/.test(s.slice(b, i)) && m ? i + m[0].length : i;
}
const adSonu = (s: string, i: number) => { i++; while (i < s.length && !B.test(s[i]) && !AYRAC.test(s[i])) i++; return i; };

/** sözlüğün üst düzey anahtarları → değerin [başı, sonu] */
export function anahtarlar(sozluk: string): Map<string, [number, number]> {
  const m = new Map<string, [number, number]>();
  let i = bosAt(sozluk, 0);
  if (!sozluk.startsWith("<<", i)) throw new PdfHatasi("sözlük değil");
  i += 2;
  for (;;) {
    i = bosAt(sozluk, i);
    if (sozluk.startsWith(">>", i)) return m;
    if (sozluk[i] !== "/") throw new PdfHatasi("sözlük anahtarı");
    const a = adSonu(sozluk, i), ad = sozluk.slice(i + 1, a);
    const bas = bosAt(sozluk, a), son = degerSonu(sozluk, bas);
    m.set(ad, [bas, son]);
    i = son;
  }
}
/** sözlükteki anahtarın değer metni */
export function degerOku(sozluk: string, ad: string): string | null {
  const y = anahtarlar(sozluk).get(ad);
  return y ? sozluk.slice(y[0], y[1]) : null;
}
/** sözlükte anahtarı yaz (varsa değiştir, yoksa sona ekle) */
export function degerYaz(sozluk: string, ad: string, deger: string): string {
  const y = anahtarlar(sozluk).get(ad);
  if (y) return `${sozluk.slice(0, y[0])}${deger}${sozluk.slice(y[1])}`;
  const son = sozluk.lastIndexOf(">>");
  return `${sozluk.slice(0, son).replace(/[\x00\t\n\f\r ]*$/, "")} /${ad} ${deger} >>`;
}
/** sözlüğün değerinin kapsadığı ilk dolaylı başvuru "n g" (değer başvuruysa) */
export const basvuru = (deger: string | null): [number, number] | null => {
  const m = deger ? /^(\d{1,10})[\x00\t\n\f\r ]+(\d{1,5})[\x00\t\n\f\r ]+R$/.exec(deger.trim()) : null;
  return m ? [Number(m[1]), Number(m[2])] : null;
};

/* ── belgenin son durumu ── */
export interface SonDurum {
  /** son çapraz başvurunun konumu (yeni ekin /Prev'i) */
  xref: number;
  akis: boolean;
  kok: string;
  boyut: number;
  bilgi: string | null;
  kimlik: string | null;
}

/** son trailer / xref akışı: kök, boyut, belge bilgisi, kimlik */
export function sonDurum(pdf: Uint8Array | string): SonDurum {
  const s = typeof pdf === "string" ? pdf : latin1(pdf);
  const k = s.lastIndexOf("startxref");
  const m = k >= 0 ? /^startxref[\x00\t\n\f\r ]+(\d{1,10})/.exec(s.slice(k, k + 40)) : null;
  if (!m) throw new PdfHatasi("startxref yok");
  const xref = Number(m[1]);
  if (xref >= s.length) throw new PdfHatasi("startxref dosya dışında");
  let sozluk: string, akis: boolean;
  if (s.startsWith("xref", xref)) {
    const t = s.indexOf("trailer", xref);
    if (t < 0) throw new PdfHatasi("trailer yok");
    const bas = bosAt(s, t + 7);
    sozluk = s.slice(bas, degerSonu(s, bas));
    akis = false;
  } else {
    const n = /^\d{1,10}[\x00\t\n\f\r ]+\d{1,5}[\x00\t\n\f\r ]+obj/.exec(s.slice(xref, xref + 40));
    if (!n) throw new PdfHatasi("xref bulunamadı");
    const bas = bosAt(s, xref + n[0].length);
    sozluk = s.slice(bas, degerSonu(s, bas));
    if (!/\/Type[\x00\t\n\f\r ]*\/XRef\b/.test(sozluk)) throw new PdfHatasi("xref akışı değil");
    akis = true;
  }
  if (degerOku(sozluk, "Encrypt")) throw new PdfHatasi("şifreli PDF");
  const kok = degerOku(sozluk, "Root"), boyut = Number(degerOku(sozluk, "Size"));
  if (!basvuru(kok) || !Number.isSafeInteger(boyut) || boyut < 1) throw new PdfHatasi("trailer eksik");
  return { xref, akis, kok: kok!.trim(), boyut, bilgi: degerOku(sozluk, "Info")?.trim() ?? null, kimlik: degerOku(sozluk, "ID")?.trim() ?? null };
}

export const latin1 = (b: Uint8Array) => Buffer.from(b.buffer, b.byteOffset, b.byteLength).toString("latin1");

/* ── nesne çözümü: çapraz başvuru zinciri (en yeni bölüm önce; klasik tablo, xref akışı, karma dosyada /XRefStm) ── */
export type Yer = { tur: "duz"; konum: number } | { tur: "akis"; akis: number; sira: number } | { tur: "bos" };
const BOLUM_SINIR = 256, GIRDI_SINIR = 2_000_000, AKIS_SINIR = 64 * 1024 * 1024;

/** akış nesnesi: sözlük metni + ham veri (/Length doğrudan ya da başvuru — çözücüyle) */
function akisOku(s: string, konum: number, uzunlukCoz: (r: [number, number]) => number | null): { sozluk: string; veri: Buffer } {
  const n = /^\d{1,10}[\x00\t\n\f\r ]+\d{1,5}[\x00\t\n\f\r ]+obj/.exec(s.slice(konum, konum + 40));
  if (!n) throw new PdfHatasi("nesne başlığı yok");
  const bas = bosAt(s, konum + n[0].length);
  const sozluk = s.slice(bas, degerSonu(s, bas));
  let i = bosAt(s, bas + sozluk.length);
  if (!s.startsWith("stream", i)) throw new PdfHatasi("akış değil");
  i += 6;
  if (s[i] === "\r") i++;
  if (s[i] === "\n") i++;
  const ud = degerOku(sozluk, "Length");
  const ur = basvuru(ud);
  const uzunluk = ur ? uzunlukCoz(ur) : Number(ud);
  const son = uzunluk !== null && Number.isSafeInteger(uzunluk) && uzunluk >= 0 && i + uzunluk <= s.length ? i + uzunluk : s.indexOf("endstream", i);
  if (son < 0 || son - i > AKIS_SINIR) throw new PdfHatasi("akış sonu");
  return { sozluk, veri: Buffer.from(s.slice(i, son), "latin1") };
}

/** /FlateDecode + PNG öngörücüsü (xref akışlarında yaygın: /Predictor 12) — başka süzgeç desteklenmez */
function akisCoz(sozluk: string, veri: Buffer): Buffer {
  const f = degerOku(sozluk, "Filter")?.trim() ?? "";
  if (f && !/^(?:\/FlateDecode|\[[\x00\t\n\f\r ]*\/FlateDecode[\x00\t\n\f\r ]*\])$/.test(f)) throw new PdfHatasi("desteklenmeyen süzgeç");
  let v = f ? inflateSync(veri, { maxOutputLength: AKIS_SINIR }) : veri;
  const dp = degerOku(sozluk, "DecodeParms");
  const ongoru = dp?.trim().startsWith("<<") ? Number(degerOku(dp, "Predictor") ?? 1) : 1;
  if (ongoru >= 10) {
    const sutun = Number(degerOku(dp!, "Columns") ?? 1);
    if (!Number.isSafeInteger(sutun) || sutun < 1 || sutun > 4096) throw new PdfHatasi("öngörücü");
    const satir = sutun + 1, cikti = Buffer.alloc(Math.floor(v.length / satir) * sutun);
    for (let r = 0; r * satir + satir <= v.length; r++) {
      const tur = v[r * satir];
      for (let k = 0; k < sutun; k++) {
        const x = v[r * satir + 1 + k], sol = k ? cikti[r * sutun + k - 1] : 0, ust = r ? cikti[(r - 1) * sutun + k] : 0, sk = r && k ? cikti[(r - 1) * sutun + k - 1] : 0;
        const p = sol + ust - sk, ps = Math.abs(p - sol), pu = Math.abs(p - ust), pk = Math.abs(p - sk);
        const tah = tur === 1 ? sol : tur === 2 ? ust : tur === 3 ? (sol + ust) >> 1 : tur === 4 ? (ps <= pu && ps <= pk ? sol : pu <= pk ? ust : sk) : 0;
        cikti[r * sutun + k] = (x + tah) & 0xff;
      }
    }
    v = cikti;
  } else if (ongoru !== 1) throw new PdfHatasi("öngörücü");
  return v;
}

/** nesne numarası → son tanımın yeri (startxref'ten /Prev zinciriyle) */
function nesneHaritasi(s: string): Map<number, Yer> {
  const harita = new Map<number, Yer>();
  const k = s.lastIndexOf("startxref");
  const m = k >= 0 ? /^startxref[\x00\t\n\f\r ]+(\d{1,10})/.exec(s.slice(k, k + 40)) : null;
  if (!m) throw new PdfHatasi("startxref yok");
  const sira: number[] = [Number(m[1])], gorulen = new Set<number>();
  let girdi = 0;
  const koy = (no: number, y: Yer) => { if (++girdi > GIRDI_SINIR) throw new PdfHatasi("xref çok büyük"); if (!harita.has(no)) harita.set(no, y); };
  const akisBolumu = (konum: number): string => {
    const { sozluk, veri } = akisOku(s, konum, () => null);
    if (!/\/Type[\x00\t\n\f\r ]*\/XRef\b/.test(sozluk)) throw new PdfHatasi("xref akışı değil");
    const v = akisCoz(sozluk, veri);
    const w = (degerOku(sozluk, "W") ?? "").replace(/[[\]]/g, " ").trim().split(/[\x00\t\n\f\r ]+/).map(Number);
    if (w.length !== 3 || w.some((x) => !Number.isSafeInteger(x) || x < 0 || x > 8)) throw new PdfHatasi("/W");
    const boyut = Number(degerOku(sozluk, "Size"));
    const ix = (degerOku(sozluk, "Index") ?? `[0 ${boyut}]`).replace(/[[\]]/g, " ").trim().split(/[\x00\t\n\f\r ]+/).map(Number);
    const g = w[0] + w[1] + w[2];
    const oku = (o: number, n: number) => { let x = 0; for (let j = 0; j < n; j++) x = x * 256 + v[o + j]; return x; };
    let o = 0;
    for (let j = 0; j + 1 < ix.length; j += 2) {
      for (let t = 0; t < ix[j + 1]; t++, o += g) {
        if (o + g > v.length) throw new PdfHatasi("xref akışı kısa");
        const tur = w[0] ? oku(o, w[0]) : 1, a = oku(o + w[0], w[1]), b = oku(o + w[0] + w[1], w[2]);
        koy(ix[j] + t, tur === 1 ? { tur: "duz", konum: a } : tur === 2 ? { tur: "akis", akis: a, sira: b } : { tur: "bos" });
      }
    }
    return sozluk;
  };
  while (sira.length) {
    const x = sira.shift()!;
    if (gorulen.has(x) || gorulen.size >= BOLUM_SINIR) continue;
    gorulen.add(x);
    try { bolumOku(x); } catch (e) {
      /* en yeni bölüm okunamazsa harita yok (onarım); daha eski bir bölüm okunamazsa okunanlarla yetinilir — o bölümün nesneleri onarımla */
      if (gorulen.size === 1 || !okumaHatasi(e)) throw e;
      break;
    }
  }
  return harita;

  function bolumOku(x: number) {
    if (x >= s.length) throw new PdfHatasi("xref dosya dışında");
    let trailer: string;
    if (s.startsWith("xref", x)) {
      let i = bosAt(s, x + 4);
      for (;;) {
        const b = /^(\d{1,10})[\x00\t\n\f\r ]+(\d{1,10})/.exec(s.slice(i, i + 24));
        if (!b) break;
        const ilk = Number(b[1]), adet = Number(b[2]);
        i = bosAt(s, i + b[0].length);
        for (let t = 0; t < adet; t++) {
          const e = /^(\d{10}) (\d{5}) ([nf])/.exec(s.slice(i, i + 18));
          if (!e) throw new PdfHatasi("xref girdisi");
          koy(ilk + t, e[3] === "n" ? { tur: "duz", konum: Number(e[1]) } : { tur: "bos" });
          i = bosAt(s, i + 18);
        }
      }
      if (!s.startsWith("trailer", i)) throw new PdfHatasi("trailer yok");
      const tb = bosAt(s, i + 7);
      trailer = s.slice(tb, degerSonu(s, tb));
      const karma = degerOku(trailer, "XRefStm")?.trim();
      if (karma && /^\d{1,10}$/.test(karma) && !gorulen.has(Number(karma))) { gorulen.add(Number(karma)); akisBolumu(Number(karma)); }
    } else trailer = akisBolumu(x);
    const onceki = degerOku(trailer, "Prev")?.trim();
    if (onceki && /^\d{1,10}$/.test(onceki)) sira.push(Number(onceki));
  }
}

/** bozuk / saldırgan girdinin hatası (ayrıştırma, zlib, sınır) — öteki hatalar yukarı */
const okumaHatasi = (e: unknown) => e instanceof PdfHatasi || e instanceof RangeError ||
  (e instanceof Error && /^(?:Z_|ERR_BUFFER_TOO_LARGE)/.test(String((e as { code?: unknown }).code ?? "")));

/** nesne okuyucu: numara → son tanımın gövdesi (sözlük ya da değer; akışsa yalnız sözlüğü). Önce çapraz başvuru zinciri; zincir bozuksa ya da
    konumda o nesne yoksa düz metindeki son tanım ve nesne akışları (onarım — okuyucuların yaptığı gibi). */
export interface NesneOkuyucu {
  (no: number): string | null;
  /** akış nesnesinin çözülmüş verisi (düz tanımlı akış; FlateDecode ya da süzgeçsiz) — yoksa null */
  akis(no: number): Buffer | null;
  /** akış nesnesinin ham (çözülmemiş) verisi — yoksa null */
  ham(no: number): Buffer | null;
  /** düz tanımın dosyadaki yeri ("n g obj"un başı); akıştaki nesnede akışın yeri; yoksa null */
  konum(no: number): number | null;
  /** çapraz başvuru zinciri (okunamadıysa null — okuyucu onarımla çalışır) */
  yerler: ReadonlyMap<number, Yer> | null;
}
/** belge (bayt ya da latin1 metin — imzalı sürümün öneki için) */
export function nesneOkuyucu(pdf: Uint8Array | string): NesneOkuyucu {
  const s = typeof pdf === "string" ? pdf : latin1(pdf);
  let harita: Map<number, Yer> | null = null;
  try { harita = nesneHaritasi(s); } catch (e) { if (!okumaHatasi(e)) throw e; }
  const akislar = new Map<number, { v: string; ofs: [number, number][]; ilk: number } | null>();
  const duzOku = (no: number, konum: number): string | null => {
    const n = new RegExp(`^${no}[\\x00\\t\\n\\f\\r ]+\\d{1,5}[\\x00\\t\\n\\f\\r ]+obj\\b`).exec(s.slice(konum, konum + 40));
    if (!n) return null;
    const bas = bosAt(s, konum + n[0].length);
    try { return s.slice(bas, degerSonu(s, bas)); } catch (e) { if (e instanceof PdfHatasi) return null; throw e; }
  };
  const uzunlukCoz = (r: [number, number]) => { const y = harita?.get(r[0]); const g = y?.tur === "duz" ? duzOku(r[0], y.konum) : null; return g && /^\d{1,10}$/.test(g.trim()) ? Number(g) : null; };
  const akisAc = (akisNo: number) => {
    if (akislar.has(akisNo)) return akislar.get(akisNo)!;
    let sonuc: { v: string; ofs: [number, number][]; ilk: number } | null = null;
    const y = harita?.get(akisNo);
    const konum = y?.tur === "duz" ? y.konum : sonTanim(s, akisNo);
    if (konum !== null) {
      try {
        const { sozluk, veri } = akisOku(s, konum, uzunlukCoz);
        if (/\/Type[\x00\t\n\f\r ]*\/ObjStm\b/.test(sozluk)) {
          const v = akisCoz(sozluk, veri).toString("latin1");
          const n = Number(degerOku(sozluk, "N")), ilk = Number(degerOku(sozluk, "First"));
          if (Number.isSafeInteger(n) && Number.isSafeInteger(ilk) && n <= 100_000 && ilk <= v.length) {
            const l = v.slice(0, ilk).trim().split(/[\x00\t\n\f\r ]+/).map(Number);
            sonuc = { v, ilk, ofs: Array.from({ length: n }, (_, k) => [l[2 * k], l[2 * k + 1]] as [number, number]) };
          }
        }
      } catch (e) { if (!okumaHatasi(e)) throw e; }
    }
    akislar.set(akisNo, sonuc);
    return sonuc;
  };
  const akistan = (no: number, akisNo: number, sira: number): string | null => {
    const a = akisAc(akisNo);
    const g = a?.ofs[sira];
    if (!a || !g || g[0] !== no || !Number.isSafeInteger(g[1])) return null;
    const b2 = bosAt(a.v, a.ilk + g[1]);
    try { return a.v.slice(b2, degerSonu(a.v, b2)); } catch (e) { if (e instanceof PdfHatasi) return null; throw e; }
  };
  const oku = (no: number) => {
    const y = harita?.get(no);
    if (y?.tur === "duz") { const g = duzOku(no, y.konum); if (g !== null) return g; }
    else if (y?.tur === "akis") { const g = akistan(no, y.akis, y.sira); if (g !== null) return g; }
    else if (y?.tur === "bos") return null;
    return onarimOku(s, no, akisAc, harita);
  };
  const konum = (no: number): number | null => {
    const y = harita?.get(no);
    if (y?.tur === "duz") return y.konum;
    if (y?.tur === "akis") return konum(y.akis);
    if (y?.tur === "bos") return null;
    return sonTanim(s, no);
  };
  const hamAkis = (no: number) => {
    const k = harita?.get(no)?.tur === "akis" ? null : konum(no);
    if (k === null) return null;
    try { return akisOku(s, k, uzunlukCoz); } catch (e) { if (okumaHatasi(e)) return null; throw e; }
  };
  const akis = (no: number): Buffer | null => {
    const a = hamAkis(no);
    if (!a) return null;
    try { return akisCoz(a.sozluk, a.veri); } catch (e) { if (okumaHatasi(e)) return null; throw e; }
  };
  return Object.assign(oku, { akis, ham: (no: number) => hamAkis(no)?.veri ?? null, konum, yerler: harita });
}

/** çapraz başvuru zincirinden nesne yerleri (denetim ve test için: düz nesnenin konumu, akıştaki nesnenin akışı ve sırası) */
export const nesneYerleri = (pdf: Uint8Array) => nesneHaritasi(latin1(pdf));

/** düz metinde nesnenin son tanımının başı ("n g obj"); yoksa null */
function sonTanim(s: string, no: number): number | null {
  const r = new RegExp(`(?:^|[^0-9])${no}[\\x00\\t\\n\\f\\r ]{1,20}\\d{1,5}[\\x00\\t\\n\\f\\r ]{1,20}obj\\b`, "g");
  let son: RegExpExecArray | null = null;
  for (let m = r.exec(s); m; m = r.exec(s)) son = m;
  return son ? son.index + son[0].search(/\d/) : null;
}

/** zincirde bulunamayan nesne: düz metindeki son tanım, yoksa nesne akışlarının birinde (akışlar zincirden; zincir yoksa düz metindeki ObjStm'ler) */
function onarimOku(s: string, no: number, akisAc: (n: number) => { v: string; ofs: [number, number][]; ilk: number } | null, harita: Map<number, Yer> | null): string | null {
  const son = sonTanim(s, no);
  if (son !== null) {
    const n = /^\d{1,10}[\x00\t\n\f\r ]+\d{1,5}[\x00\t\n\f\r ]+obj/.exec(s.slice(son, son + 40))!;
    const bas = bosAt(s, son + n[0].length);
    try { return s.slice(bas, degerSonu(s, bas)); } catch (e) { if (e instanceof PdfHatasi) return null; throw e; }
  }
  const akisNolari = new Set<number>();
  if (harita) { for (const y of harita.values()) if (y.tur === "akis") akisNolari.add(y.akis); }
  else {
    const r = /(\d{1,10})[\x00\t\n\f\r ]+\d{1,5}[\x00\t\n\f\r ]+obj[\x00\t\n\f\r ]*<<[^]{0,512}?\/Type[\x00\t\n\f\r ]*\/ObjStm\b/g;
    for (let m = r.exec(s); m && akisNolari.size < 10_000; m = r.exec(s)) akisNolari.add(Number(m[1]));
  }
  for (const akisNo of akisNolari) {
    const a = akisAc(akisNo);
    const k = a?.ofs.findIndex((g) => g[0] === no) ?? -1;
    if (a && k >= 0) { const b2 = bosAt(a.v, a.ilk + a.ofs[k][1]); try { return a.v.slice(b2, degerSonu(a.v, b2)); } catch { return null; } }
  }
  return null;
}

/** tek nesne (birden çok okumada nesneOkuyucu) */
export const nesneOku = (pdf: Uint8Array, no: number): string | null => nesneOkuyucu(pdf)(no);

/* ── ek yazımı ── */
export interface YeniNesne { no: number; govde: string | Buffer }

/** akış nesnesi gövdesi (sıkıştırmasız) */
export const akisGovdesi = (veri: Buffer, sozluk = "") => Buffer.concat([Buffer.from(`<< ${sozluk}/Length ${veri.length} >>\nstream\n`, "latin1"), veri, Buffer.from("\nendstream", "latin1")]);

/** nesneleri sona ekler, özgündeki türde çapraz başvuru + trailer yazar; dönen: yeni dosya ve her nesnenin konumu */
export function ekle(pdf: Uint8Array, nesneler: readonly YeniNesne[], d: SonDurum = sonDurum(pdf)): { pdf: Buffer; konum: Map<number, number> } {
  const parcalar: Buffer[] = [Buffer.from(pdf)];
  let uzunluk = pdf.length;
  const yaz = (b: Buffer | string) => { const x = typeof b === "string" ? Buffer.from(b, "latin1") : b; parcalar.push(x); uzunluk += x.length; };
  if (pdf[pdf.length - 1] !== 0x0a && pdf[pdf.length - 1] !== 0x0d) yaz("\n");
  const konum = new Map<number, number>();
  for (const x of nesneler) {
    if (!Number.isSafeInteger(x.no) || x.no < 1) throw new PdfHatasi("nesne no");
    konum.set(x.no, uzunluk);
    yaz(`${x.no} 0 obj\n`); yaz(x.govde); yaz("\nendobj\n");
  }
  let boyut = Math.max(d.boyut, ...[...konum.keys()].map((n) => n + 1));
  const ekler = [`/Root ${d.kok}`, `/Prev ${d.xref}`, ...(d.bilgi ? [`/Info ${d.bilgi}`] : []), ...(d.kimlik ? [`/ID ${d.kimlik}`] : [])].join(" ");
  if (!d.akis) {
    const xref = uzunluk;
    yaz(`xref\n0 1\n0000000000 65535 f\r\n${altBolumler([...konum]).map((g) => `${g[0][0]} ${g.length}\n${g.map(([, o]) => `${String(o).padStart(10, "0")} 00000 n\r\n`).join("")}`).join("")}`);
    yaz(`trailer\n<< /Size ${boyut} ${ekler} >>\nstartxref\n${xref}\n%%EOF\n`);
  } else {
    const no = boyut++, xref = uzunluk;
    const girdiler = [...konum, [no, xref] as [number, number]];
    const gruplar = altBolumler(girdiler);
    const veri = Buffer.concat(gruplar.flat().map(([, o]) => { const b = Buffer.alloc(7); b[0] = 1; b.writeUInt32BE(o, 1); b.writeUInt16BE(0, 5); return b; }));
    yaz(`${no} 0 obj\n`);
    yaz(akisGovdesi(veri, `/Type /XRef /Size ${boyut} /W [1 4 2] /Index [${gruplar.map((g) => `${g[0][0]} ${g.length}`).join(" ")}] ${ekler} `));
    yaz(`\nendobj\nstartxref\n${xref}\n%%EOF\n`);
  }
  return { pdf: Buffer.concat(parcalar), konum };
}

/** ardışık numaralı alt bölümler */
function altBolumler(l: [number, number][]): [number, number][][] {
  const s = [...l].sort((a, b) => a[0] - b[0]);
  const g: [number, number][][] = [];
  for (const x of s) { const son = g[g.length - 1]; if (son && son[son.length - 1][0] + 1 === x[0]) son.push(x); else g.push([x]); }
  return g;
}
