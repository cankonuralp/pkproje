/* FORMAT KURUCU — saf düzenleme işlemleri (RAPOR-FORMAT.md §6; maket maket-kurucu.js kb-ekle / kb-yukari / kb-asagi / kb-sil / kb-alan-ekle /
   kb-madde-ekle / kb-sutun-ekle / kb-oge-sil / kurallar). Tanım her adımda şemadan geçer (src/format/tanim.ts); yeni öğenin kimliği BÜTÜN tanımda
   tekildir (cevaplar kimlikle saklanır). Kilitli (Bakanlık) bölüm silinmez, adı değişmez; kilitli öğe silinmez; kilitli ölçüm tablosunun ŞABLON
   sütunu silinmez — kurucuda eklenen (kimliği "k_" ile başlayan) sütun çıkarılır (337–339 incelemesi) — sunucu yayında aynı kuralı kaynak
   şablondan yeniden denetler (ENGEL), burası yalnız ekranın kolaylığı. */
import { Bolum, kurucudan, type Blok, type FormatTanimi } from "../../format/tanim.ts";

export { kurucudan };

/** tanımdaki bütün kimlikler (bölüm, alan, grup, madde, sütun, değer) */
export function kimlikler(t: FormatTanimi): Set<string> {
  const s = new Set<string>();
  for (const b of t.bolumler) {
    s.add(b.id);
    if (b.blok === "bilgi") for (const a of b.alanlar) s.add(a.id);
    if (b.blok === "liste") for (const g of b.gruplar) { s.add(g.id); for (const m of g.maddeler) s.add(m.id); }
    if (b.blok === "olcum") for (const c of b.sutunlar) s.add(c.id);
    if (b.blok === "test") for (const d of b.degerler) s.add(d.id);
  }
  return s;
}

/** önek + en küçük kullanılmayan sayı (ör. "k_a3"): şablonların kimlikleriyle çakışmaz, tanımda tekil */
export function yeniKimlik(t: FormatTanimi, onek: "b" | "a" | "g" | "m" | "s" | "d", ek: ReadonlySet<string> = new Set()): string {
  const var_ = kimlikler(t);
  let n = 1;
  while (var_.has(`k_${onek}${n}`) || ek.has(`k_${onek}${n}`)) n++;
  return `k_${onek}${n}`;
}

/** blok başına boş bölüm (başlangıç değerleri şemadan) */
export function yeniBolum(t: FormatTanimi, blok: Blok, ad: string): Bolum {
  const id = yeniKimlik(t, "b");
  const ek: Record<Blok, Record<string, unknown>> = {
    bilgi: { alanlar: [] },
    liste: { cevaplar: ["Uygun", "Uygun değil", "Uygulanamaz"], gruplar: [{ id: yeniKimlik(t, "g", new Set([id])), ad: "", maddeler: [] }] },
    olcum: { satir: "ekle", sutunlar: [] }, test: { degerler: [] }, cihaz: {}, foto: { enAz: 0, enCok: 20 }, kusur: {}, sonuc: { cumle: "" },
    not: { zorunlu: false }, imza: { imzalar: ["uzman"] },
  };
  return Bolum.parse({ id, ad, blok, ...ek[blok] });
}

/** listede i'yi j'ye taşır (yeni dizi) */
export function tasi<T>(l: readonly T[], i: number, j: number): T[] {
  if (i < 0 || j < 0 || i >= l.length || j >= l.length) return [...l];
  const y = [...l];
  y.splice(j, 0, y.splice(i, 1)[0]);
  return y;
}

/** bölümün öğeleri (bilgi: alanlar · liste: bütün gruplardaki maddeler · ölçüm: sütunlar · test: değerler) — ekranda tek liste */
export type Oge = { id: string; ad: string; alt: string; kilit: boolean };
export function bolumOgeleri(b: Bolum): Oge[] {
  if (b.blok === "bilgi") return b.alanlar.map((a) => ({ id: a.id, ad: a.ad, alt: a.kaynak ? `${a.tur} · kayıttan` : a.tur, kilit: a.kilit }));
  if (b.blok === "liste") return b.gruplar.flatMap((g) => g.maddeler.map((m) => ({ id: m.id, ad: m.metin, alt: [g.ad, m.std].filter(Boolean).join(" · "), kilit: m.kilit })));
  if (b.blok === "olcum") return b.sutunlar.map((c) => ({ id: c.id, ad: c.ad, alt: c.op && c.sinir !== undefined ? `sınır ${c.op === "<=" ? "≤" : "≥"} ${c.sinir}` : "sınır yok", kilit: b.kilit && !kurucudan(c.id) }));
  if (b.blok === "test") return b.degerler.map((d) => ({ id: d.id, ad: d.ad, alt: d.op && d.sinir !== undefined ? `sınır ${d.op === "<=" ? "≤" : "≥"} ${d.sinir}` : "sınır yok", kilit: d.kilit }));
  return [];
}
export const ogeliBlok = (b: Blok) => b === "bilgi" || b === "liste" || b === "olcum" || b === "test";

/** bölüme öğe ekler (bilgi: metin alanı · liste: son gruba madde · ölçüm: sayı sütunu · test: sayı değeri); ad kırpılır, boşsa değişmez */
export function ogeEkle(t: FormatTanimi, i: number, ad: string): FormatTanimi {
  const b = t.bolumler[i], a = ad.trim().replace(/\s+/g, " ").slice(0, 200);
  if (!b || !a) return t;
  let y: Bolum = b;
  if (b.blok === "bilgi") y = { ...b, alanlar: [...b.alanlar, { id: yeniKimlik(t, "a"), ad: a, tur: "metin", zorunlu: false, kilit: false }] };
  else if (b.blok === "liste") {
    const gruplar = b.gruplar.length ? b.gruplar : [{ id: yeniKimlik(t, "g"), ad: "", maddeler: [] }];
    const son = gruplar[gruplar.length - 1];
    const ek = new Set(gruplar.map((g) => g.id));
    y = { ...b, gruplar: [...gruplar.slice(0, -1), { ...son, maddeler: [...son.maddeler, { id: yeniKimlik(t, "m", ek), metin: a, kilit: false }] }] };
  } else if (b.blok === "olcum") y = { ...b, sutunlar: [...b.sutunlar, { id: yeniKimlik(t, "s"), ad: a, giris: "sayi", zorunlu: false }] };
  else if (b.blok === "test") y = { ...b, degerler: [...b.degerler, { id: yeniKimlik(t, "d"), ad: a, metin: false, zorunlu: true, kilit: false }] };
  return { ...t, bolumler: t.bolumler.map((x, j) => (j === i ? y : x)) };
}

/** bölümden öğe çıkarır (kilitli öğe ve kilitli ölçüm tablosunun şablon sütunu çıkmaz; kurucuda eklenen sütun çıkar) */
export function ogeSil(t: FormatTanimi, i: number, id: string): FormatTanimi {
  const b = t.bolumler[i];
  if (!b) return t;
  let y: Bolum = b;
  if (b.blok === "bilgi") y = { ...b, alanlar: b.alanlar.filter((a) => a.id !== id || a.kilit) };
  else if (b.blok === "liste") y = { ...b, gruplar: b.gruplar.map((g) => ({ ...g, maddeler: g.maddeler.filter((m) => m.id !== id || m.kilit) })) };
  else if (b.blok === "olcum") y = { ...b, sutunlar: b.sutunlar.filter((c) => c.id !== id || (b.kilit && !kurucudan(c.id))) };
  else if (b.blok === "test") y = { ...b, degerler: b.degerler.filter((d) => d.id !== id || d.kilit) };
  return { ...t, bolumler: t.bolumler.map((x, j) => (j === i ? y : x)) };
}

/** bölüm sil (kilitli silinmez) */
export const bolumSil = (t: FormatTanimi, i: number): FormatTanimi => (t.bolumler[i]?.kilit ? t : { ...t, bolumler: t.bolumler.filter((_, j) => j !== i) });
/** bölüm adı (kilitli bölümün adı değişmez) */
export const bolumAdi = (t: FormatTanimi, i: number, ad: string): FormatTanimi =>
  (t.bolumler[i]?.kilit ? t : { ...t, bolumler: t.bolumler.map((b, j) => (j === i ? { ...b, ad: ad.slice(0, 200) } : b)) });
