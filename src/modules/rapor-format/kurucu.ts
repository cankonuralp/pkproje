/* FORMAT KURUCU — saf düzenleme işlemleri (RAPOR-FORMAT.md §6; maket maket-kurucu.js kb-ekle / kb-yukari / kb-asagi / kb-sil / kb-alan-ekle /
   kb-madde-ekle / kb-sutun-ekle / kb-oge-sil / kurallar). Tanım her adımda şemadan geçer (src/format/tanim.ts); yeni öğenin kimliği BÜTÜN tanımda
   tekildir (cevaplar kimlikle saklanır). Kilitli (Bakanlık) bölüm silinmez, adı değişmez; kilitli öğe silinmez; kilitli ölçüm tablosunun ŞABLON
   sütunu silinmez — kurucuda eklenen (kimliği "k_" ile başlayan) sütun çıkarılır (337–339 incelemesi) — sunucu yayında aynı kuralı kaynak
   şablondan yeniden denetler (ENGEL), burası yalnız ekranın kolaylığı. */
import { SINIR_ISARETI } from "../../format/hesap.ts";
import { kilitliKimlikler } from "../../format/motor.ts";
import { Bolum, EKIPMAN_ALAN_ADI, kurucudan, type Blok, type BolumOf, type EkipmanAlani, type FormatTanimi, type Sinir } from "../../format/tanim.ts";

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
  if (b.blok === "bilgi") return b.alanlar.map((a) => ({ id: a.id, ad: a.ad, alt: a.ekipman ? "ekipman kaydından" : a.kaynak ? `${a.tur} · kayıttan` : a.tur, kilit: a.kilit }));
  if (b.blok === "liste") return b.gruplar.flatMap((g) => g.maddeler.map((m) => ({ id: m.id, ad: m.metin, alt: [g.ad, m.std].filter(Boolean).join(" · "), kilit: m.kilit })));
  if (b.blok === "olcum") return b.sutunlar.map((c) => ({ id: c.id, ad: c.ad, alt: c.op && c.sinir !== undefined ? `sınır ${SINIR_ISARETI[c.op]} ${c.sinir}` : c.olumsuz?.length ? `uygun değil: ${c.olumsuz.join(" / ")}` : "sınır yok", kilit: b.kilit && !kurucudan(c.id) }));
  if (b.blok === "test") return b.degerler.map((d) => ({ id: d.id, ad: d.ad, alt: d.op && d.sinir !== undefined ? `sınır ${SINIR_ISARETI[d.op]} ${d.sinir}` : d.olumsuz?.length ? `uygun değil: ${d.olumsuz.join(" / ")}` : "sınır yok", kilit: d.kilit }));
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
  } else if (b.blok === "olcum") y = { ...b, sutunlar: [...b.sutunlar, { id: yeniKimlik(t, "s"), ad: a, giris: "sayi", zorunlu: false, agir: false }] };
  else if (b.blok === "test") y = { ...b, degerler: [...b.degerler, { id: yeniKimlik(t, "d"), ad: a, metin: false, zorunlu: true, kilit: false, agir: false }] };
  return { ...t, bolumler: t.bolumler.map((x, j) => (j === i ? y : x)) };
}

/** 460: tam ekipman bölümüne ekipman kaydına bağlı alan ekler (marka, model …; bölümde yoksa) — adı hazır, sonra değişir */
export function ekipmanAlaniEkle(t: FormatTanimi, i: number, k: EkipmanAlani): FormatTanimi {
  const b = t.bolumler[i];
  if (!b || b.blok !== "bilgi" || !b.tam || t.bolumler.some((x) => x.blok === "bilgi" && x.alanlar.some((a) => a.ekipman === k))) return t;
  const y = { ...b, alanlar: [...b.alanlar, { id: yeniKimlik(t, "a"), ad: EKIPMAN_ALAN_ADI[k], tur: "metin" as const, zorunlu: false, kilit: false, ekipman: k }] };
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

/** bölüm sil (kilitli silinmez; 459: ölçüm cihazları bölümü sabit — silinmez) */
export const bolumSil = (t: FormatTanimi, i: number): FormatTanimi => (t.bolumler[i]?.blok === "cihaz" ? t
  : (t.bolumler[i]?.kilit ? t : { ...t, bolumler: t.bolumler.filter((_, j) => j !== i) }));
/** bölüm adı (kilitli bölümün adı değişmez) */
export const bolumAdi = (t: FormatTanimi, i: number, ad: string): FormatTanimi =>
  (t.bolumler[i]?.kilit ? t : { ...t, bolumler: t.bolumler.map((b, j) => (j === i ? { ...b, ad: ad.slice(0, 200) } : b)) });

/** 427: bölümün belgedeki düzeni — üst başlık (aynı üst başlıklı ardışık bölümler N.1, N.2 olur) ve numarasızlık; Bakanlık bölümünde değişmez */
export function bolumDuzeni(t: FormatTanimi, i: number, y: { ust?: string; numarasiz?: boolean; alt?: boolean }): FormatTanimi {
  const b = t.bolumler[i];
  if (!b || b.kilit) return t;
  const alt = y.alt === undefined ? b.alt : y.alt || undefined;
  /* 461: alt başlık üst başlıklı gruba girmez, numarasız olmaz (ikisi aynı anda anlamsız) */
  const ust = alt ? undefined : y.ust === undefined ? b.ust : y.ust.slice(0, 200) || undefined;
  const numarasiz = alt ? undefined : y.numarasiz === undefined ? b.numarasiz : y.numarasiz || undefined;
  return { ...t, bolumler: t.bolumler.map((x, j) => (j === i ? { ...x, ust, numarasiz, alt } : x)) };
}

/* ── ÖĞE DÜZENLEME (426; reisim 2026-10-09: "kullanıcı bu ve benzeri rapor formatlarını isterse kendi eli ile format yapıcıdan yapabilsin") ──
   Öğenin bütün özellikleri: alan türü ve seçenekleri, madde standardı / açıklaması / talimatı / grubu, sütun ve değer türü, seçenekleri, uygun
   değil sayılan seçenekleri, ağırlığı, sınırı, birimi, zorunluluğu. Kilitli (Bakanlık) öğede YALNIZ talimat değişir (resmî formatın içeriği
   değişmez); kilitli ölçüm tablosunun şablon sütunu hiç değişmez. Sunucu yayında aynı kuralı kaynaktan yeniden denetler (ENGEL). */
export type OgeTuru = "metin" | "sayi" | "tarih" | "secim" | "coklu" | "evet";
export interface OgeYamasi {
  ad?: string; tur?: OgeTuru; secenekler?: string[]; olumsuz?: string[]; agir?: boolean; birim?: string; zorunlu?: boolean;
  op?: Sinir | ""; sinir?: number | null; std?: string; aciklama?: string; talimat?: string; not?: string; grup?: string;
}
const kirp = (s: string, n: number) => s.trim().replace(/\s+/g, " ").slice(0, n);
/** çok satırlı metinden seçenekler: kırpılmış, boşsuz, tekil, en çok `adet` tane, her biri en çok `uzun` karakter */
export const satirlar = (s: string, adet = 20, uzun = 60): string[] => [...new Set(s.split(/\r?\n/).map((x) => kirp(x, uzun)).filter(Boolean))].slice(0, adet);
const istege = (s: string | undefined) => (s && s.trim() ? s.trim() : undefined);
function sinirli<T extends { op?: Sinir; sinir?: number }>(o: T, y: { op?: Sinir | ""; sinir?: number | null }): T {
  if (y.op === undefined && y.sinir === undefined) return o;
  const op = y.op === undefined ? o.op : y.op || undefined;
  const sinir = y.sinir === undefined ? o.sinir : (y.sinir ?? undefined);
  return { ...o, op, sinir: op ? sinir : undefined };
}

export function ogeYaz(t: FormatTanimi, i: number, id: string, y: OgeYamasi): FormatTanimi {
  const b = t.bolumler[i];
  if (!b) return t;
  let n: Bolum = b;
  if (b.blok === "bilgi") {
    n = { ...b, alanlar: b.alanlar.map((a) => {
      if (a.id !== id || a.kilit) return a;
      if (a.kaynak || a.ekipman) return y.ad !== undefined ? { ...a, ad: kirp(y.ad, 200) || a.ad } : a;
      const tur = y.tur ?? a.tur, secmeli = tur === "secim" || tur === "coklu";
      return {
        ...a, ad: y.ad !== undefined ? kirp(y.ad, 200) || a.ad : a.ad, tur,
        secenekler: secmeli ? (y.secenekler ? y.secenekler.slice(0, 40).map((x) => kirp(x, 200)).filter(Boolean) : a.secenekler) : undefined,
        birim: y.birim !== undefined ? istege(kirp(y.birim, 40)) : a.birim, zorunlu: y.zorunlu ?? a.zorunlu,
      };
    }) };
  } else if (b.blok === "liste") {
    const m = b.gruplar.flatMap((g) => g.maddeler).find((x) => x.id === id);
    if (!m) return t;
    const yeni = m.kilit ? { ...m, talimat: y.talimat !== undefined ? istege(y.talimat.slice(0, 4000)) : m.talimat } : {
      ...m, metin: y.ad !== undefined ? kirp(y.ad, 200) || m.metin : m.metin, std: y.std !== undefined ? istege(kirp(y.std, 200)) : m.std,
      aciklama: y.aciklama !== undefined ? istege(y.aciklama.slice(0, 2000)) : m.aciklama, talimat: y.talimat !== undefined ? istege(y.talimat.slice(0, 4000)) : m.talimat,
    };
    const hedef = !m.kilit && y.grup && b.gruplar.some((g) => g.id === y.grup) ? y.grup : null;
    n = { ...b, gruplar: b.gruplar.map((g) => {
      const icinde = g.maddeler.some((x) => x.id === id);
      if (hedef && hedef !== g.id && icinde) return { ...g, maddeler: g.maddeler.filter((x) => x.id !== id) };
      if (hedef === g.id && !icinde) return { ...g, maddeler: [...g.maddeler, yeni] };
      return icinde ? { ...g, maddeler: g.maddeler.map((x) => (x.id === id ? yeni : x)) } : g;
    }) };
  } else if (b.blok === "olcum") {
    n = { ...b, sutunlar: b.sutunlar.map((c) => {
      if (c.id !== id || (b.kilit && !kurucudan(c.id))) return c;
      const giris = y.tur === "metin" || y.tur === "sayi" || y.tur === "secim" || y.tur === "evet" ? y.tur : c.giris;
      const secenekler = giris === "secim" ? (y.secenekler ?? c.secenekler) : undefined;
      const gecerli = giris === "evet" ? ["evet", "hayir"] : secenekler ?? [];
      const olumsuz = (y.olumsuz ?? c.olumsuz)?.filter((o) => gecerli.includes(o));
      return sinirli({
        ...c, ad: y.ad !== undefined ? kirp(y.ad, 200) || c.ad : c.ad, giris, secenekler, olumsuz: olumsuz?.length ? olumsuz : undefined,
        agir: y.agir ?? c.agir, birim: y.birim !== undefined ? istege(kirp(y.birim, 40)) : c.birim, zorunlu: y.zorunlu ?? c.zorunlu,
      }, giris === "sayi" ? y : { op: "", sinir: null });
    }) };
  } else if (b.blok === "test") {
    n = { ...b, degerler: b.degerler.map((d) => {
      if (d.id !== id || d.kilit) return d;
      const tur = y.tur ?? (d.secenekler?.length ? "secim" : d.metin ? "metin" : "sayi");
      const secenekler = tur === "secim" ? (y.secenekler ?? d.secenekler) : undefined;
      const olumsuz = (y.olumsuz ?? d.olumsuz)?.filter((o) => (secenekler ?? []).includes(o));
      return sinirli({
        ...d, ad: y.ad !== undefined ? kirp(y.ad, 200) || d.ad : d.ad, metin: tur === "metin", secenekler, olumsuz: olumsuz?.length ? olumsuz : undefined,
        agir: y.agir ?? d.agir, birim: y.birim !== undefined ? istege(kirp(y.birim, 40)) : d.birim, zorunlu: y.zorunlu ?? d.zorunlu,
        not: y.not !== undefined ? istege(kirp(y.not, 120)) : d.not,
      }, tur === "sayi" ? y : { op: "", sinir: null });
    }) };
  }
  return n === b ? t : { ...t, bolumler: t.bolumler.map((x, j) => (j === i ? n : x)) };
}

/* ── GRUPLAR (kontrol listesi) ── kilitli bölümde Bakanlık grubunun adı değişmez; talimat her grupta yazılır */
const kilitliGrup = (b: BolumOf<"liste">, g: BolumOf<"liste">["gruplar"][number]) => b.kilit && g.maddeler.some((m) => m.kilit);
export function grupEkle(t: FormatTanimi, i: number, ad: string): FormatTanimi {
  const b = t.bolumler[i];
  if (b?.blok !== "liste") return t;
  return { ...t, bolumler: t.bolumler.map((x, j) => (j === i ? { ...b, gruplar: [...b.gruplar, { id: yeniKimlik(t, "g"), ad: kirp(ad, 200), maddeler: [] }] } : x)) };
}
export function grupYaz(t: FormatTanimi, i: number, gid: string, y: { ad?: string; talimat?: string }): FormatTanimi {
  const b = t.bolumler[i];
  if (b?.blok !== "liste") return t;
  return { ...t, bolumler: t.bolumler.map((x, j) => (j !== i ? x : { ...b, gruplar: b.gruplar.map((g) => (g.id !== gid ? g : {
    ...g, ad: y.ad !== undefined && !kilitliGrup(b, g) ? kirp(y.ad, 200) : g.ad, talimat: y.talimat !== undefined ? istege(y.talimat.slice(0, 4000)) : g.talimat,
  })) })) };
}
/** boş grup silinir (maddesi olan grup silinmez — önce maddeleri taşınır ya da çıkarılır); tek grup kalır */
export function grupSil(t: FormatTanimi, i: number, gid: string): FormatTanimi {
  const b = t.bolumler[i];
  if (b?.blok !== "liste" || b.gruplar.length < 2 || b.gruplar.find((g) => g.id === gid)?.maddeler.length !== 0) return t;
  return { ...t, bolumler: t.bolumler.map((x, j) => (j === i ? { ...b, gruplar: b.gruplar.filter((g) => g.id !== gid) } : x)) };
}
/** maddeyi seçilen gruba ekler (ogeEkle son gruba ekler) */
export function maddeEkle(t: FormatTanimi, i: number, gid: string, ad: string): FormatTanimi {
  const b = t.bolumler[i], a = kirp(ad, 200);
  if (b?.blok !== "liste" || !a || !b.gruplar.some((g) => g.id === gid)) return t;
  const id = yeniKimlik(t, "m");
  return { ...t, bolumler: t.bolumler.map((x, j) => (j === i ? { ...b, gruplar: b.gruplar.map((g) => (g.id === gid ? { ...g, maddeler: [...g.maddeler, { id, metin: a, kilit: false }] } : g)) } : x)) };
}

/** cevap seti (2–6; 2. seçenek olumsuz sayılır) — kilitli bölümde değişmez */
export function cevaplarYaz(t: FormatTanimi, i: number, l: readonly string[]): FormatTanimi {
  const b = t.bolumler[i], c = [...new Set(l.map((x) => kirp(x, 40)).filter(Boolean))].slice(0, 6);
  if (b?.blok !== "liste" || b.kilit || c.length < 2) return t;
  return { ...t, bolumler: t.bolumler.map((x, j) => (j === i ? { ...b, cevaplar: c } : x)) };
}
/** ölçüm tablosunun uygunluk notları (Not-1 …) — kilitli bölümde değişmez */
export type NotGirdisi = { metin: string; kusur: boolean; agir: boolean };
export function notlarYaz(t: FormatTanimi, i: number, l: readonly NotGirdisi[]): FormatTanimi {
  const b = t.bolumler[i];
  if (b?.blok !== "olcum" || b.kilit) return t;
  const notlar = l.map((x) => ({ metin: kirp(x.metin, 400), kusur: x.kusur, agir: x.kusur && x.agir })).filter((x) => x.metin).slice(0, 20);
  return { ...t, bolumler: t.bolumler.map((x, j) => (j === i ? { ...b, notlar: notlar.length ? notlar : undefined } : x)) };
}
/** görünüm: form kodu, başlık, metot ve kapsam (dayanak), genel muayene talimatı. Kilitli öğesi olan (Bakanlık) formatta form kodu ve başlık
    değişmez (yayın denetimi aynısını ENGEL sayar); dayanak ve talimat her formatta yazılır */
export const resmiFormat = (t: FormatTanimi) => kilitliKimlikler(t).size > 0 && !!t.gorunum.formKodu;
export function gorunumYaz(t: FormatTanimi, y: { formKodu?: string; baslik?: string; dayanak?: string[]; talimat?: string }): FormatTanimi {
  const resmi = resmiFormat(t);
  return { ...t, gorunum: {
    ...t.gorunum,
    formKodu: y.formKodu !== undefined && !resmi ? kirp(y.formKodu, 20) : t.gorunum.formKodu,
    baslik: y.baslik !== undefined && !resmi ? kirp(y.baslik, 200) : t.gorunum.baslik,
    dayanak: y.dayanak ? y.dayanak.map((x) => kirp(x, 300)).filter(Boolean).slice(0, 20) : t.gorunum.dayanak,
    talimat: y.talimat !== undefined ? y.talimat.slice(0, 8000) : t.gorunum.talimat,
  } };
}
