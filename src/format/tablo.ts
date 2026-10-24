/* SERBEST TABLO — format tanımının "tablo" bölümü üzerinde SAF işlemler (2026-10-24; reisim: "hangi firmanın hangi PDF formunu yüklersem
   yükleyeyim şablon o forma dönüşsün ve format kurucuda istediğim gibi düzenleyebileyim"; maket docs/maket/format-serbest.html onaylı).
   · Izgara: hücreler sol üst köşesi (r, c) ve kapladığı satır / sütunla (rs, cs) saklanır; kapsama() her konumun hangi hücreye ait olduğunu verir.
     Birleştir, ayır, satır / sütun ekle ve sil, sütun genişliği, kenar — kurucu (rapor-format/ui/TabloDuzenleyici.tsx) bunlarla değiştirir.
   · Sanal bölümler: tablonun cevapları mevcut cevaplardır — sahada doldurulan hücre bilgi alanı (Cevaplar.alan), kontrol cevabı hücresi
     kontrol maddesi (Cevaplar.madde), sahada çoğalan satır ölçüm tablosu (Cevaplar.tablo[satır kimliği]), fotoğraf hücresi fotoğraf kutusu,
     imza hücresi imza yeri, sonuç hücresi raporun sonucu. sahaTanimi() tablo bölümlerini bu sanal bölümlere açar: motor (değerlendirme, kusur,
     eksik), formül, saha ekranı ve sunucu denetimleri tabloyu ayrıca bilmeden çalışır; belge ızgarayı kendisi çizer (src/belge/belge.ts).
   Bu dosya yalnız ./tanim.ts'i içe aktarır. */
import { type Bolum, type BolumOf, type FormatTanimi, type Hucre, type HucreStili, type ImzaSatiri, type TabloSatiri, type YaziTipi } from "./tanim.ts";

export type TabloBolumu = BolumOf<"tablo">;
/** seçim: iki köşe (sıralı olmak zorunda değil) */
export interface Secim { r1: number; c1: number; r2: number; c2: number }
/** sıralı ve birleşik hücreleri kapsayacak kadar büyütülmüş seçim */
export interface Alan { r1: number; c1: number; r2: number; c2: number }

const bos = (s?: HucreStili): Hucre => ({ r: 0, c: 0, tur: "yazi", m: "", ...(s ? { s: { ...s } } : {}) });
const kopya = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;

/** her konumun hücresi (hucreler dizisindeki sıra) ya da boş */
export function kapsama(b: Pick<TabloBolumu, "satirlar" | "sutun" | "hucreler">): (number | null)[][] {
  const g = b.satirlar.map(() => b.sutun.map((): number | null => null));
  b.hucreler.forEach((h, n) => {
    for (let a = 0; a < (h.rs ?? 1); a++) for (let e = 0; e < (h.cs ?? 1); e++) {
      const s = g[h.r + a];
      if (s && h.c + e < s.length && s[h.c + e] === null) s[h.c + e] = n;
    }
  });
  return g;
}

/** sütun oranları yüzdeye (toplam 100) */
export function sutunYuzdeleri(b: Pick<TabloBolumu, "sutun">): number[] {
  const t = b.sutun.reduce((x, y) => x + y, 0) || 1;
  return b.sutun.map((x) => Math.round((x / t) * 10000) / 100);
}

/** seçimi sıralar, tabloya sığdırır ve içine giren birleşik hücreleri tam kapsayacak kadar büyütür */
export function genislet(b: TabloBolumu, s: Secim): Alan {
  const R = b.satirlar.length - 1, C = b.sutun.length - 1, sinir = (x: number, m: number) => Math.max(0, Math.min(m, x));
  const a: Alan = { r1: sinir(Math.min(s.r1, s.r2), R), r2: sinir(Math.max(s.r1, s.r2), R), c1: sinir(Math.min(s.c1, s.c2), C), c2: sinir(Math.max(s.c1, s.c2), C) };
  const g = kapsama(b);
  for (let degisti = true; degisti;) {
    degisti = false;
    for (let r = a.r1; r <= a.r2; r++) for (let c = a.c1; c <= a.c2; c++) {
      const n = g[r]?.[c];
      if (n === null || n === undefined) continue;
      const h = b.hucreler[n], r2 = h.r + (h.rs ?? 1) - 1, c2 = h.c + (h.cs ?? 1) - 1;
      if (h.r < a.r1) { a.r1 = h.r; degisti = true; }
      if (h.c < a.c1) { a.c1 = h.c; degisti = true; }
      if (r2 > a.r2) { a.r2 = r2; degisti = true; }
      if (c2 > a.c2) { a.c2 = c2; degisti = true; }
    }
  }
  return a;
}

/** seçimin içindeki hücrelerin sırası (her biri bir kez; okuma sırasıyla) */
export function secimHucreleri(b: TabloBolumu, a: Alan): number[] {
  const g = kapsama(b), l: number[] = [];
  for (let r = a.r1; r <= a.r2; r++) for (let c = a.c1; c <= a.c2; c++) { const n = g[r]?.[c]; if (n !== null && n !== undefined && !l.includes(n)) l.push(n); }
  return l;
}

/** boş kalan konumlar boş yazı hücresiyle dolar (sıra: satır, sütun) */
export function onar(b: TabloBolumu): TabloBolumu {
  const g = kapsama(b), ek: Hucre[] = [];
  g.forEach((s, r) => s.forEach((n, c) => { if (n === null) ek.push({ ...bos(), r, c }); }));
  const hucreler = [...b.hucreler, ...ek].sort((x, y) => x.r - y.r || x.c - y.c);
  return ek.length ? { ...b, hucreler } : b;
}

/** yeni tablo: R satır × C sütun, eşit sütunlar, boş hücreler */
export function yeniTablo(id: string, ad: string, R: number, C: number): TabloBolumu {
  const sutun = Array.from({ length: C }, () => Math.round((100 / C) * 100) / 100);
  return onar({ id, ad, blok: "tablo", kilit: false, sutun, satirlar: Array.from({ length: R }, () => ({})), hucreler: [], cevaplar: ["U", "UD", "X"] });
}

/** seçimdeki hücreler tek hücre olur — içerik sol üstteki (boşsa seçimdeki ilk dolu hücre) */
export function birlestir(b: TabloBolumu, s: Secim): TabloBolumu {
  const a = genislet(b, s), l = secimHucreleri(b, a);
  if (l.length < 2) return b;
  const doluMu = (h: Hucre) => !(h.tur === "yazi" && !(h.m ?? "").trim());
  const kaynak = b.hucreler[l.find((n) => b.hucreler[n].r === a.r1 && b.hucreler[n].c === a.c1 && doluMu(b.hucreler[n])) ?? l.find((n) => doluMu(b.hucreler[n])) ?? l[0]];
  const yeni: Hucre = { ...kopya(kaynak), r: a.r1, c: a.c1 };
  delete yeni.rs; delete yeni.cs;
  if (a.r2 > a.r1) yeni.rs = a.r2 - a.r1 + 1;
  if (a.c2 > a.c1) yeni.cs = a.c2 - a.c1 + 1;
  return { ...b, hucreler: [...b.hucreler.filter((_, n) => !l.includes(n)), yeni].sort((x, y) => x.r - y.r || x.c - y.c) };
}

/** seçimdeki birleşik hücreler ayrılır — içerik sol üstte kalır, açılan yerler aynı görünümde boş */
export function ayir(b: TabloBolumu, s: Secim): TabloBolumu {
  const a = genislet(b, s), l = new Set(secimHucreleri(b, a));
  const hucreler: Hucre[] = [];
  b.hucreler.forEach((h, n) => {
    if (!l.has(n) || ((h.rs ?? 1) === 1 && (h.cs ?? 1) === 1)) { hucreler.push(h); return; }
    const { rs = 1, cs = 1, ...ana } = h;
    hucreler.push(ana);
    for (let x = 0; x < rs; x++) for (let y = 0; y < cs; y++) if (x || y) hucreler.push({ ...bos(h.s), r: h.r + x, c: h.c + y });
  });
  return { ...b, hucreler: hucreler.sort((x, y) => x.r - y.r || x.c - y.c) };
}

/** eksen boyunca i'ye yeni satır / sütun; i'yi aşan birleşik hücre büyür; yeni yerler komşunun görünümünde boş */
function ekle(b: TabloBolumu, eksen: "r" | "c", i: number): TabloBolumu {
  const R = eksen === "r";
  const hucreler = b.hucreler.map((h0) => {
    const h = { ...h0 }, v = R ? h.r : h.c, uz = R ? (h.rs ?? 1) : (h.cs ?? 1);
    if (v >= i) { if (R) h.r++; else h.c++; }
    else if (v + uz - 1 >= i) { if (R) h.rs = uz + 1; else h.cs = uz + 1; }
    return h;
  });
  const satirlar: TabloSatiri[] = R ? [...b.satirlar.slice(0, i), {}, ...b.satirlar.slice(i)] : b.satirlar;
  let sutun = b.sutun;
  if (!R) {
    /* yeni sütun komşusunun (i'deki, sondaysa öncekinin) yarısını alır */
    const k = i < b.sutun.length ? i : i - 1, pay = b.sutun[k] / 2;
    sutun = [...b.sutun]; sutun[k] = pay; sutun.splice(i, 0, pay);
  }
  const y: TabloBolumu = { ...b, satirlar, sutun, hucreler };
  /* açılan konumlar: komşu hücrenin görünümüyle */
  const g = kapsama(y), ek: Hucre[] = [];
  const n = R ? sutun.length : satirlar.length;
  for (let x = 0; x < n; x++) {
    const r = R ? i : x, c = R ? x : i;
    if (g[r]?.[c] !== null) continue;
    const kn = R ? (g[i - 1]?.[c] ?? g[i + 1]?.[c]) : (g[r]?.[i - 1] ?? g[r]?.[i + 1]);
    ek.push({ ...bos(kn !== null && kn !== undefined ? hucreler[kn].s : undefined), r, c });
  }
  return { ...y, hucreler: [...hucreler, ...ek].sort((x, z) => x.r - z.r || x.c - z.c) };
}
export const satirEkle = (b: TabloBolumu, i: number) => ekle(b, "r", Math.max(0, Math.min(i, b.satirlar.length)));
export const sutunEkle = (b: TabloBolumu, i: number) => ekle(b, "c", Math.max(0, Math.min(i, b.sutun.length)));

/** eksen boyunca i'yi siler; i'den geçen birleşik hücre küçülür (sol üstü i'deyse içeriği bir sonraki satıra / sütuna iner); son satır / sütun
    silinmez */
function sil(b: TabloBolumu, eksen: "r" | "c", i: number): TabloBolumu {
  const R = eksen === "r";
  if ((R ? b.satirlar.length : b.sutun.length) <= 1) return b;
  const hucreler: Hucre[] = [];
  for (const h0 of b.hucreler) {
    const h = { ...h0 }, v = R ? h.r : h.c, uz = R ? (h.rs ?? 1) : (h.cs ?? 1);
    if (v > i) { if (R) h.r--; else h.c--; hucreler.push(h); continue; }
    if (v + uz - 1 < i) { hucreler.push(h); continue; }
    /* i'den geçiyor */
    if (uz === 1) continue;
    if (R) { h.rs = uz - 1; if (h.rs === 1) delete h.rs; } else { h.cs = uz - 1; if (h.cs === 1) delete h.cs; }
    hucreler.push(h);
  }
  const satirlar = R ? b.satirlar.filter((_, j) => j !== i) : b.satirlar;
  let sutun = b.sutun;
  if (!R) { const pay = b.sutun[i]; sutun = b.sutun.filter((_, j) => j !== i); const k = Math.min(i, sutun.length - 1); sutun[k] += pay; }
  return onar({ ...b, satirlar, sutun, hucreler: hucreler.sort((x, y) => x.r - y.r || x.c - y.c) });
}
export const satirSil = (b: TabloBolumu, i: number) => sil(b, "r", i);
export const sutunSil = (b: TabloBolumu, i: number) => sil(b, "c", i);

/** c. sütunun payı yüzde olur; fark sağdaki (son sütunda soldaki) komşudan */
export function sutunGenisligi(b: TabloBolumu, c: number, yuzde: number): TabloBolumu {
  if (b.sutun.length < 2) return b;
  const y = sutunYuzdeleri(b), k = c < y.length - 1 ? c + 1 : c - 1, toplam = y[c] + y[k];
  const v = Math.max(2, Math.min(toplam - 2, yuzde));
  const sutun = [...y]; sutun[c] = Math.round(v * 100) / 100; sutun[k] = Math.round((toplam - v) * 100) / 100;
  return { ...b, sutun };
}

/** seçimdeki hücrelere işlem (sırasıyla) */
export function hucreleriYaz(b: TabloBolumu, s: Secim, fn: (h: Hucre) => Hucre): TabloBolumu {
  const l = new Set(secimHucreleri(b, genislet(b, s)));
  return { ...b, hucreler: b.hucreler.map((h, n) => (l.has(n) ? fn(h) : h)) };
}
/** seçimdeki hücrelerin görünümünden bir özellik (undefined / "" / false: kaldırılır) */
export function stilYaz<K extends keyof HucreStili>(b: TabloBolumu, s: Secim, k: K, v: HucreStili[K] | "" | false): TabloBolumu {
  return hucreleriYaz(b, s, (h) => {
    const st: HucreStili = { ...(h.s ?? {}) };
    if (v === undefined || v === "" || v === false) delete st[k]; else st[k] = v as HucreStili[K];
    const y: Hucre = { ...h };
    delete y.s;
    return Object.keys(st).length ? { ...y, s: st } : y;
  });
}

export const KENAR_TURLERI = ["hepsi", "dis", "ic", "yok", "u", "a", "s", "g"] as const;
export type KenarTuru = (typeof KENAR_TURLERI)[number];
/** seçimin kenarları: hepsi · dış · iç · yok · tek kenar (üst / alt / sol / sağ — seçimin o kenarındaki hücrelerde; yeniden basılınca kalkar).
    kal: 1 ince · 2 kalın; v: belgenin varsayılan kalınlığı (hücrede kn yoksa) */
export function kenarYaz(b: TabloBolumu, s: Secim, tur: KenarTuru, kal: 1 | 2, v: 0 | 1 | 2 = 1): TabloBolumu {
  const a = genislet(b, s);
  return hucreleriYaz(b, a, (h) => {
    const kn = { ...(h.s?.kn ?? { u: v, a: v, s: v, g: v }) };
    const r2 = h.r + (h.rs ?? 1) - 1, c2 = h.c + (h.cs ?? 1) - 1;
    const dis = { u: h.r === a.r1, a: r2 === a.r2, s: h.c === a.c1, g: c2 === a.c2 };
    for (const y of ["u", "a", "s", "g"] as const) {
      if (tur === "hepsi") kn[y] = kal;
      else if (tur === "yok") kn[y] = 0;
      else if (tur === "dis") { if (dis[y]) kn[y] = kal; }
      else if (tur === "ic") { if (!dis[y]) kn[y] = kal; }
      else if (tur === y && dis[y]) kn[y] = kn[y] ? 0 : kal;
    }
    return { ...h, s: { ...(h.s ?? {}), kn } };
  });
}

/* ── sahada: etiket, madde metni, sıra numaraları ── */
const yaziMi = (h: Hucre | undefined): boolean => !!h && h.tur === "yazi" && !!(h.m ?? "").trim();
/** sahada doldurulan hücrenin adı: kendi adı; yoksa aynı satırda solundaki, yoksa aynı sütunda üstündeki yazı */
export function hucreEtiketi(b: TabloBolumu, h: Hucre, g: (number | null)[][] = kapsama(b)): string {
  if (h.ad?.trim()) return h.ad.trim();
  for (let c = h.c - 1; c >= 0; c--) {
    const n = g[h.r]?.[c]; if (n === null || n === undefined) continue;
    const x = b.hucreler[n]; if (yaziMi(x)) return x.m!.trim(); if (x.tur !== "yazi" && x.tur !== "sira") break;
  }
  for (let r = h.r - 1; r >= 0; r--) {
    const n = g[r]?.[h.c]; if (n === null || n === undefined) continue;
    const x = b.hucreler[n]; if (yaziMi(x)) return x.m!.trim(); if (x.tur !== "yazi") break;
  }
  return "";
}
/** kontrol cevabı hücresinin maddesi: kendi metni; yoksa satırındaki yazılar (sıra no hariç) */
export function maddeMetni(b: TabloBolumu, h: Hucre): string {
  if (h.m?.trim()) return h.m.trim();
  return b.hucreler.filter((x) => x.r === h.r && x !== h && yaziMi(x)).sort((x, y) => x.c - y.c).map((x) => x.m!.trim()).join(" · ");
}
/** sıra no hücrelerinin numarası — okuma sırasıyla (satır, sütun); siraDevam'lı tablo öncekinden sürer. Anahtar "<bölüm>:<r>,<c>" */
export function siraNumaralari(t: Pick<FormatTanimi, "bolumler">): ReadonlyMap<string, number> {
  const m = new Map<string, number>();
  let n = 0;
  for (const b of t.bolumler) {
    if (b.blok !== "tablo") continue;
    if (!b.siraDevam) n = 0;
    /* çoğalan satırın sırası kendi kopyalarında (1, 2, 3 …) — sayıma girmez */
    const tekrar = new Set(b.satirlar.flatMap((s, r) => (s.tekrar ? [r] : [])));
    for (const h of [...b.hucreler].sort((x, y) => x.r - y.r || x.c - y.c)) if (h.tur === "sira" && !tekrar.has(h.r)) m.set(`${b.id}:${h.r},${h.c}`, ++n);
  }
  return m;
}
/** sahada çoğalan satırın sütun adları — üstündeki satırın yazıları (yoksa hücrenin adı) */
function sutunAdi(b: TabloBolumu, h: Hucre, g: (number | null)[][]): string {
  if (h.ad?.trim()) return h.ad.trim();
  const n = h.r > 0 ? g[h.r - 1]?.[h.c] : null;
  const x = n !== null && n !== undefined ? b.hucreler[n] : undefined;
  return x && yaziMi(x) ? x.m!.trim() : "Değer";
}

/* ── SANAL BÖLÜMLER ── */
/** sanal bölümün kimliği: tablonun kimliği + ek (sahada bölümün yeri; çoğalan satırın ölçüm tablosu satırın kendi kimliğini taşır) */
export const sanalKimlik = (b: Pick<Bolum, "id">, ek: "a" | "l" | "f" | "i" | "s") => `${b.id}_v${ek}`;
/** sanal kimlikten tablonun kimliği (sanal değilse kendisi) */
export const tabloKimligi = (t: Pick<FormatTanimi, "bolumler">, id: string): string => {
  for (const b of t.bolumler) {
    if (b.blok !== "tablo") continue;
    if (id.startsWith(`${b.id}_v`) || b.satirlar.some((s) => s.id === id)) return b.id;
  }
  return id;
};

/** tablonun sanal bölümleri (sahada bu sırayla): bilgi alanları · kontrol maddeleri · çoğalan satır başına ölçüm tablosu · fotoğraf kutuları ·
    imza yerleri · sonuç */
export function sanalBolumler(b: TabloBolumu): Bolum[] {
  const g = kapsama(b), tekrar = new Set(b.satirlar.flatMap((s, r) => (s.tekrar ? [r] : [])));
  const sirali = [...b.hucreler].sort((x, y) => x.r - y.r || x.c - y.c);
  const duz = sirali.filter((h) => !tekrar.has(h.r));
  const l: Bolum[] = [];
  const ortak = { kilit: false as const };
  const alanlar = duz.filter((h) => h.tur === "alan" && h.id).map((h) => ({
    id: h.id!, ad: hucreEtiketi(b, h, g) || "Alan", tur: h.alan ?? "metin", zorunlu: !!h.zorunlu, kilit: false,
    ...(h.secenekler?.length ? { secenekler: h.secenekler } : {}), ...(h.birim ? { birim: h.birim } : {}), ...(h.formul ? { formul: h.formul } : {}),
  }));
  if (alanlar.length) l.push({ id: sanalKimlik(b, "a"), ad: b.ad, blok: "bilgi", ...ortak, alanlar, dizilis: 2 });
  const maddeler = duz.filter((h) => h.tur === "cevap" && h.id).map((h) => ({ id: h.id!, metin: maddeMetni(b, h) || "Madde", kilit: false, ...(h.formul ? { formul: h.formul } : {}) }));
  if (maddeler.length) l.push({ id: sanalKimlik(b, "l"), ad: b.ad, blok: "liste", ...ortak, cevaplar: b.cevaplar, numara: "surekli",
    gruplar: [{ id: `${b.id}_vg`, ad: "", maddeler }] });
  b.satirlar.forEach((s, r) => {
    if (!s.tekrar || !s.id) return;
    const sutunlar = sirali.filter((h) => h.r === r && h.id && (h.tur === "alan" || h.tur === "cevap")).map((h) => h.tur === "cevap"
      ? { id: h.id!, ad: sutunAdi(b, h, g), giris: "secim" as const, secenekler: b.cevaplar, olumsuz: [b.cevaplar[1]], agir: false, zorunlu: !!h.zorunlu }
      : {
        id: h.id!, ad: sutunAdi(b, h, g), giris: h.alan === "sayi" ? "sayi" as const : h.alan === "secim" ? "secim" as const : h.alan === "evet" ? "evet" as const : "metin" as const,
        agir: false, zorunlu: !!h.zorunlu, ...(h.secenekler?.length ? { secenekler: h.secenekler } : {}), ...(h.birim ? { birim: h.birim } : {}), ...(h.formul ? { formul: h.formul } : {}),
      });
    if (sutunlar.length) l.push({ id: s.id, ad: b.ad, blok: "olcum", ...ortak, satir: "ekle", sutunlar, enAz: 0, sonucKurali: [] });
  });
  const kutular = sirali.filter((h) => h.tur === "foto" && h.id).map((h) => ({ id: h.id!, ad: h.ad?.trim() || hucreEtiketi(b, h, g) || "Fotoğraf" }));
  if (kutular.length) l.push({ id: sanalKimlik(b, "f"), ad: b.ad, blok: "foto", ...ortak, enAz: 0, enCok: 50, kutular });
  /* imza yerleri ve sahada seçilen / yazılan kişiler (ikinci uzman, tesis yetkilisinin adı / unvanı kayıttan hücrede de istenir) */
  const imzaKisileri = [...new Set(sirali.flatMap((h) => h.tur === "imza" && h.kim ? [h.kim]
    : h.tur === "kayit" && (h.kaynak === "tesis_ad" || h.kaynak === "tesis_unvan") ? ["tesis" as const] : h.tur === "kayit" && h.kaynak === "uzman2_ad" ? ["uzman2" as const] : []))];
  if (imzaKisileri.length) {
    const satirlar: ImzaSatiri[] = imzaKisileri.flatMap((kim): ImzaSatiri[] => kim === "tesis"
      ? [{ id: `${b.id}_vit_ad`, ad: "Tesis yetkilisi", kim, alan: "ad" }, { id: `${b.id}_vit_un`, ad: "Unvanı", kim, alan: "unvan" }, { id: `${b.id}_vit_im`, ad: "İmzası", kim, alan: "imza" }]
      : [{ id: `${b.id}_vi_${kim}`, ad: "İmzası", kim, alan: "imza" }]);
    const ozet = imzaKisileri.filter((k): k is "uzman" | "teknik" => k === "uzman" || k === "teknik");
    l.push({ id: sanalKimlik(b, "i"), ad: b.ad, blok: "imza", ...ortak, imzalar: ozet.length ? ozet : ["uzman"], satirlar });
  }
  const sonuc = sirali.find((h) => h.tur === "sonuc");
  if (sonuc) {
    const [u, ud, sa] = sonuc.secenekler ?? [];
    l.push({ id: sanalKimlik(b, "s"), ad: b.ad, blok: "sonuc", ...ortak, cumle: "", aciklama: "",
      ...(u ? { uygunMetin: u } : {}), ...(ud ? { uygunDegilMetin: ud } : {}), ...(sa ? { sartli: true, sartliMetin: sa } : {}) });
  }
  return l;
}

/** raporda kullanılan tanım: tablo bölümleri sanal bölümlerine açılır (tablosuz tanım aynen döner) */
export function sahaTanimi(t: FormatTanimi): FormatTanimi {
  if (!t.bolumler.some((b) => b.blok === "tablo")) return t;
  return { ...t, bolumler: t.bolumler.flatMap((b) => (b.blok === "tablo" ? sanalBolumler(b) : [b])) };
}

/* ── YERLEŞİM: yan yana bölümler ── */
/** belge / kâğıt satırları: her satır bir ya da daha çok bölüm (yan: öncekinin yanında); oranlar satırda yüzdeye çekilir */
export function yerlesimSatirlari<T extends { b: Pick<Bolum, "yan" | "oran"> }>(l: readonly T[]): { ogeler: T[]; oranlar: number[] }[] {
  const satirlar: T[][] = [];
  for (const x of l) { const son = satirlar.at(-1); if (son && x.b.yan) son.push(x); else satirlar.push([x]); }
  return satirlar.map((ogeler) => {
    const ham = ogeler.map((x) => x.b.oran ?? 100 / ogeler.length), t = ham.reduce((a, e) => a + e, 0) || 1;
    return { ogeler, oranlar: ham.map((x) => Math.round((x / t) * 10000) / 100) };
  });
}

/* ── GÖRÜNÜM: hücrenin biçemi (belge, kâğıt ortak) ── */
/** yazı tiplerinin aileleri (belge.css @font-face — kendi kökenimizden) */
export const YAZI_AILESI: Record<YaziTipi, string> = { carlito: "Carlito, Calibri, sans-serif", tinos: "Tinos, 'Times New Roman', serif", arimo: "Arimo, Arial, sans-serif" };
/** hücrenin satır içi biçemi (değerler yazı — React ve belge HTML yazıcısı aynı yazar): kenarlar hücrenin ya da belgenin çizgisi, iç boşluk,
    yazı tipi / boy (hücrenin, yoksa belgenin; yoksa Carlito 9 pt), kalın / eğik / altı çizili, hizalar, renkler */
export function hucreBicemi(x: Pick<Hucre, "s">, yazi: FormatTanimi["gorunum"]["yazi"] = {}): Record<string, string> {
  const s = x.s ?? {}, y = yazi ?? {}, kal = y.kalin ?? 1, renk = y.cizgi ?? "#000000", ic = y.ic ?? 0.6;
  const kenar = (k: "u" | "a" | "s" | "g") => { const n = s.kn ? s.kn[k] : kal; return n ? `${n}px solid ${renk}` : "0"; };
  return {
    borderTop: kenar("u"), borderBottom: kenar("a"), borderLeft: kenar("s"), borderRight: kenar("g"),
    padding: `${(ic * 0.6).toFixed(2)}mm ${ic.toFixed(2)}mm`, fontFamily: YAZI_AILESI[s.f ?? y.tip ?? "carlito"], fontSize: `${s.b ?? y.boy ?? 9}pt`,
    fontWeight: s.k ? "700" : "400", ...(s.i ? { fontStyle: "italic" } : {}), ...(s.u ? { textDecoration: "underline" } : {}),
    textAlign: ({ s: "left", o: "center", g: "right", y: "justify" } as const)[s.a ?? "s"],
    verticalAlign: ({ u: "top", o: "middle", a: "bottom" } as const)[s.d ?? "o"],
    ...(s.r ? { color: s.r } : {}), ...(s.z ? { backgroundColor: s.z } : {}),
  };
}
