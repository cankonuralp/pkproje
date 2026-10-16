/* FORMAT KURUCU — saf düzenleme işlemleri (RAPOR-FORMAT.md §6; maket maket-kurucu.js kb-ekle / kb-yukari / kb-asagi / kb-sil / kb-alan-ekle /
   kb-madde-ekle / kb-sutun-ekle / kb-oge-sil / kurallar). Tanım her adımda şemadan geçer (src/format/tanim.ts); yeni öğenin kimliği BÜTÜN tanımda
   tekildir (cevaplar kimlikle saklanır). 470 (reisim 2026-10-10, hata listesi 38: "başlık komple silmek vb hala imkansız biraz daha serbestlik
   lütfen"; genel ilke "kural uyarıdır, engel değil"): Bakanlık (kilitli) bölüm ve öğe de silinir, adı ve özellikleri değişir — ekran önce sorar,
   sunucu yayında kaynak şablondan ayrılan yerleri UYARI olarak listeler (src/format/motor.ts kilitDenetimi; yayını durdurmaz). "kilit" bayrağı
   yalnız "Bakanlık formatının parçası" işaretidir. Sabit kalanlar reisim'in kararı: ölçüm cihazları bölümü (459; firma bilgileri kâğıtta sabit). */
import { SINIR_ISARETI } from "../../format/hesap.ts";
import { kilitliKimlikler } from "../../format/motor.ts";
import {
  basEtiketleri, basSatirlari, basSirasi, cihazSutunlari, ekipmanEtiketleri, ekipmanTamYap, firmaSatirlari, imzaSatirlari, imzaVarsayilani, listeBasliklari, olcumBasliklari, sonucMetinleri, testBasliklari,
} from "../../format/duzen.ts";
import { BAS_HUCRELERI, BAS_KAYNAK_ADI, BAS_KAYNAKLARI, type BasHucresi, type BasKaynagi, type BasSatiri, Bolum, EK_SUTUN_EN_COK, LISTE_SUTUN_ADI, LISTE_SUTUN_ALANLARI, TEST_SUTUN_ADI, TEST_SUTUN_TURLERI, type ListeSutunAlani, type TestSutunTuru, CIHAZ_ALAN_ADI, CIHAZ_ALANLARI, EIMZA_KUTU, EKIPMAN_ALAN_ADI, KUSUR_ALAN_ADI, KUSUR_ALANLARI, type CihazAlani, type KusurAlani, FIRMA_KAYNAK_ADI, FIRMA_KAYNAKLARI, FIRMA_ZORUNLU, IMZA_ALAN_ADI, IMZA_KISI_ADI, type ImzaYeri, imzaAlanlari, KUNYE_ALANLARI, KURAL_EN_COK, kurucudan, type Blok, type BolumOf, type EkipmanAlani, type FormatTanimi,
  type FirmaKaynagi, type FirmaSatiri, type ImzaAlani, type ImzaKisisi, type ImzaSatiri, type KunyeAlani, type Sinir, type SonucKurali } from "../../format/tanim.ts";
import { kilitliKunye } from "../../format/kunye.ts";
import { FORMUL_EN_UZUN, formulAdDegistir, formulDuzelt } from "../../format/formul.ts";
import { varsayilanKurallar } from "../../format/sonuc.ts";

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
    if (b.blok === "imza") for (const x of b.satirlar ?? []) s.add(x.id);
    if (b.blok === "cihaz" || b.blok === "kusur") for (const x of b.sutunlar ?? []) s.add(x.id);
    if (b.blok === "liste" || b.blok === "test") for (const x of b.ekSutunlar ?? []) s.add(x.id);
    if (b.blok === "foto") for (const x of b.kutular ?? []) s.add(x.id);
  }
  for (const x of t.gorunum.firma?.satirlar ?? []) s.add(x.id);
  for (const x of t.gorunum.basSatirlar ?? []) s.add(x.id);
  return s;
}

/** önek + en küçük kullanılmayan sayı (ör. "k_a3"): şablonların kimlikleriyle çakışmaz, tanımda tekil */
export function yeniKimlik(t: FormatTanimi, onek: "b" | "a" | "g" | "m" | "s" | "d" | "i" | "f" | "t" | "k" | "h", ek: ReadonlySet<string> = new Set()): string {
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
    not: { zorunlu: false }, imza: { imzalar: ["uzman"] }, metin: { metin: "" },
  };
  return Bolum.parse({ id, ad, blok, ...ek[blok] });
}

/** 469 (reisim 2026-10-10, hata listesi 40: "alt başlık ekle dediğin gibi alt başlık oluşturacak bunu anlamanın nesi zor"): ana bölümün altına
    DOĞRUDAN alt başlık — tür sordurmaz: ana bölümün türünde (kontrol listesi cevap setiyle; ölçüm tablosu sütunlarıyla, yeni kimliklerle; test
    değeri, bilgi alanı), içinde bir boş satır; ana bölüm başka türdeyse kontrol listesi. p: yeni bölümün t.bolumler'deki yeri. Bölümün kimliği de
    döner (adı yazma kipinde açılsın).
    486 (reisim 2026-10-10, hata listesi 40: "alt başlık ekleyince seçenekler çıksın illa üst başlıktaki formatta olması gerekmiyor tabloda olabilir
    başka bir şey de"): tur verilirse alt başlık O türde açılır (ALT_TURLER: kontrol listesi, ölçüm tablosu, test değerleri, bilgi alanları,
    fotoğraf, not) — içinde bir boş satır / sütun / madde; tur ana bölümün türüyse ana bölümün yapısıyla (cevap seti, sütunlar). Verilmezse 469 gibi. */
export const ALT_TURLER = ["liste", "olcum", "test", "bilgi", "foto", "not"] as const satisfies readonly Blok[];
export function altBaslikEkle(t: FormatTanimi, p: number, ana: Bolum, ad = "Yeni alt başlık", tur?: (typeof ALT_TURLER)[number]): { t: FormatTanimi; id: string } {
  const al = new Set<string>();
  const yeni = (onek: "b" | "a" | "g" | "m" | "s" | "d") => { const k = yeniKimlik(t, onek, al); al.add(k); return k; };
  const id = yeni("b");
  const anaTuru = ana.blok === "olcum" || ana.blok === "test" || (ana.blok === "bilgi" && !ana.tam) ? ana.blok : "liste";
  const blok = tur ?? anaTuru;
  const liste = () => ({ cevaplar: ana.blok === "liste" ? ana.cevaplar : ["Uygun", "Uygun değil", "Uygulanamaz"],
    gruplar: [{ id: yeni("g"), ad: "", maddeler: [{ id: yeni("m"), metin: "Yeni madde", kilit: false }] }] });
  const govde: Record<string, unknown> =
    blok === "olcum" ? (ana.blok === "olcum" ? { satir: ana.satir, sutunlar: ana.sutunlar.map((c) => ({ ...c, id: yeni("s") })) }
      : { satir: "ekle", sutunlar: [{ id: yeni("s"), ad: "Yeni sütun", giris: "metin" }] })
      : blok === "test" ? { degerler: [{ id: yeni("d"), ad: "Yeni değer", metin: false, zorunlu: true, kilit: false, agir: false }] }
        : blok === "bilgi" ? { alanlar: [{ id: yeni("a"), ad: "Yeni alan", tur: "metin", zorunlu: false, kilit: false }] }
          : blok === "foto" ? { enAz: 0, enCok: 20 } : blok === "not" ? { zorunlu: false } : liste();
  const b = Bolum.parse({ id, ad: kirp(ad, 200) || "Yeni alt başlık", blok, alt: true, ...govde });
  const l = [...t.bolumler];
  l.splice(Math.max(0, Math.min(p, l.length)), 0, b);
  return { t: { ...t, bolumler: l }, id };
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

/** bölümden öğe çıkarır (470: Bakanlık öğesi de çıkar — ekran önce sorar, yayında uyarı) */
export function ogeSil(t: FormatTanimi, i: number, id: string): FormatTanimi {
  const b = t.bolumler[i];
  if (!b) return t;
  let y: Bolum = b;
  if (b.blok === "bilgi") y = { ...b, alanlar: b.alanlar.filter((a) => a.id !== id) };
  else if (b.blok === "liste") y = { ...b, gruplar: b.gruplar.map((g) => ({ ...g, maddeler: g.maddeler.filter((m) => m.id !== id) })) };
  else if (b.blok === "olcum") y = { ...b, sutunlar: b.sutunlar.filter((c) => c.id !== id) };
  else if (b.blok === "test") y = { ...b, degerler: b.degerler.filter((d) => d.id !== id) };
  return { ...t, bolumler: t.bolumler.map((x, j) => (j === i ? y : x)) };
}

/** 486 (reisim 2026-10-10, hata listesi 38: "silinemiyor hala ekipman bilgileri tablosu"): 2. bölümü (ekipman bilgileri) kaldırır — tam ekipman
    bölümü çıkar, görünümde ekipman: false (kod ve tür 1. bölümde yazar; Bakanlık bölümüyse yayında uyarı). Geri ekleme: ekipman kaydına bağlı
    varsayılan alanlarla yeni bölüm (duzen.ts ekipmanTamYap). */
export function ekipmanBolumuKaldir(t: FormatTanimi): FormatTanimi {
  return { ...t, bolumler: t.bolumler.filter((b) => !(b.blok === "bilgi" && b.tam)), gorunum: { ...t.gorunum, ekipman: false } };
}
export function ekipmanBolumuGeriEkle(t: FormatTanimi): FormatTanimi {
  const g = { ...t.gorunum };
  delete g.ekipman;
  return ekipmanTamYap({ ...t, gorunum: g });
}

/** bölüm sil (470: Bakanlık bölümü de — ekran önce sorar; 459: ölçüm cihazları bölümü sabit — silinmez) */
export const bolumSil = (t: FormatTanimi, i: number): FormatTanimi => (t.bolumler[i]?.blok === "cihaz" ? t
  : { ...t, bolumler: t.bolumler.filter((_, j) => j !== i) });
/** bölüm adı (470: Bakanlık bölümünün de) */
export const bolumAdi = (t: FormatTanimi, i: number, ad: string): FormatTanimi =>
  ({ ...t, bolumler: t.bolumler.map((b, j) => (j === i ? { ...b, ad: ad.slice(0, 200) } : b)) });

/** 427: bölümün belgedeki düzeni — üst başlık (aynı üst başlıklı ardışık bölümler N.1, N.2 olur) ve numarasızlık (470: Bakanlık bölümünde de) */
export function bolumDuzeni(t: FormatTanimi, i: number, y: { ust?: string; numarasiz?: boolean; alt?: boolean }): FormatTanimi {
  const b = t.bolumler[i];
  if (!b) return t;
  const alt = y.alt === undefined ? b.alt : y.alt || undefined;
  /* 461: alt başlık üst başlıklı gruba girmez, numarasız olmaz (ikisi aynı anda anlamsız) */
  const ust = alt ? undefined : y.ust === undefined ? b.ust : y.ust.slice(0, 200) || undefined;
  const numarasiz = alt ? undefined : y.numarasiz === undefined ? b.numarasiz : y.numarasiz || undefined;
  return { ...t, bolumler: t.bolumler.map((x, j) => (j === i ? { ...x, ust, numarasiz, alt } : x)) };
}

/* ── ÖĞE DÜZENLEME (426; reisim 2026-10-09: "kullanıcı bu ve benzeri rapor formatlarını isterse kendi eli ile format yapıcıdan yapabilsin") ──
   Öğenin bütün özellikleri: alan türü ve seçenekleri, madde standardı / açıklaması / talimatı / grubu, sütun ve değer türü, seçenekleri, uygun
   değil sayılan seçenekleri, ağırlığı, sınırı, birimi, zorunluluğu. 470: Bakanlık öğesi de değişir — sunucu yayında kaynaktan ayrılanları
   UYARI olarak listeler. Kayıttan gelen ve ekipman kaydına bağlı alanın yalnız adı değişir. */
export type OgeTuru = "metin" | "sayi" | "tarih" | "secim" | "coklu" | "evet";
export interface OgeYamasi {
  ad?: string; tur?: OgeTuru; secenekler?: string[]; olumsuz?: string[]; agir?: boolean; birim?: string; zorunlu?: boolean;
  op?: Sinir | ""; sinir?: number | null; std?: string; aciklama?: string; talimat?: string; not?: string; grup?: string;
  /** 495 → 556: formül (her türde — kayıttan gelen ve ekipman bilgisi dahil; boş = formül yok) */
  formul?: string;
  /** 595 (madde 9): bilgi alanı belgede tam satır (null: kendiliğinden) */
  tam?: boolean | null;
}
const kirp = (s: string, n: number) => s.trim().replace(/\s+/g, " ").slice(0, n);
/** çok satırlı metinden seçenekler: kırpılmış, boşsuz, tekil, en çok `adet` tane, her biri en çok `uzun` karakter */
export const satirlar = (s: string, adet = 20, uzun = 60): string[] => [...new Set(s.split(/\r?\n/).map((x) => kirp(x, uzun)).filter(Boolean))].slice(0, adet);
const istege = (s: string | undefined) => (s && s.trim() ? s.trim() : undefined);

/** 495 düzeltmesi (deneme makinesi b51af0f: "[Iz] −[Ib]"): formül alanında ada / işarete basınca imlecin yerine eklenir — parçalar tek boşlukla
    birleşir (saklanan formülün sonundaki boşluk istege'de kırpıldığından "−"den sonraki boşluk eklenecek adda yeniden konur); parantezin içine
    boşluk konmaz. Yeni değer ve imlecin yeri döner. */
export function formuleEkle(metin: string, a: number, b: number, s: string): { formul: string; imlec: number } {
  const ara = (x: string, y: string) => (!x || !y || x.endsWith("(") || y.startsWith(")") ? "" : " ");
  const once = metin.slice(0, a).trimEnd(), sonra = metin.slice(b).trimStart(), p = s.trim();
  const bas = once + ara(once, p) + p;
  const formul = (bas + ara(p, sonra) + sonra).slice(0, FORMUL_EN_UZUN);
  return { formul, imlec: Math.min(bas.length, formul.length) };
}
function sinirli<T extends { op?: Sinir; sinir?: number }>(o: T, y: { op?: Sinir | ""; sinir?: number | null }): T {
  if (y.op === undefined && y.sinir === undefined) return o;
  const op = y.op === undefined ? o.op : y.op || undefined;
  const sinir = y.sinir === undefined ? o.sinir : (y.sinir ?? undefined);
  return { ...o, op, sinir: op ? sinir : undefined };
}

/** 495 → 556 (reisim: "hesaplama tuşu her kutucukta olmalı"): öğenin formülü — her türde; yazılmadıysa eskisi; boşsa anahtar hiç yok */
function formulYaz<O extends { formul?: string }>(o: O, y: OgeYamasi): O {
  /* 552: "RCa = 480 / RCd" gibi yazılan formül köşeli parantezli biçime (formulDuzelt) */
  const f = y.formul !== undefined ? istege(formulDuzelt(y.formul).slice(0, FORMUL_EN_UZUN)) : o.formul;
  const r = { ...o };
  delete r.formul;
  if (f) r.formul = f;
  return r;
}

export function ogeYaz(t: FormatTanimi, i: number, id: string, y: OgeYamasi): FormatTanimi {
  const b = t.bolumler[i];
  if (!b) return t;
  let n: Bolum = b;
  if (b.blok === "bilgi") {
    n = { ...b, alanlar: b.alanlar.map((a) => {
      if (a.id !== id) return a;
      /* 595 (madde 9): tam satır her alanda */
      const tamli = <A extends { tam?: boolean }>(x: A): A => { if (y.tam === undefined) return x; const z = { ...x }; if (y.tam === null) delete z.tam; else z.tam = y.tam; return z; };
      /* kayıttan gelen ve ekipman bilgisine bağlı alanın adı ve (556) formülü değişir */
      if (a.kaynak || a.ekipman) return tamli(formulYaz(y.ad !== undefined ? { ...a, ad: kirp(y.ad, 200) || a.ad } : a, y));
      const tur = y.tur ?? a.tur, secmeli = tur === "secim" || tur === "coklu";
      return tamli(formulYaz({
        ...a, ad: y.ad !== undefined ? kirp(y.ad, 200) || a.ad : a.ad, tur,
        secenekler: secmeli ? (y.secenekler ? y.secenekler.slice(0, 40).map((x) => kirp(x, 200)).filter(Boolean) : a.secenekler) : undefined,
        birim: y.birim !== undefined ? istege(kirp(y.birim, 40)) : a.birim, zorunlu: y.zorunlu ?? a.zorunlu,
      }, y));
    }) };
  } else if (b.blok === "liste") {
    const m = b.gruplar.flatMap((g) => g.maddeler).find((x) => x.id === id);
    if (!m) return t;
    const yeni = formulYaz({
      ...m, metin: y.ad !== undefined ? kirp(y.ad, 200) || m.metin : m.metin, std: y.std !== undefined ? istege(kirp(y.std, 200)) : m.std,
      aciklama: y.aciklama !== undefined ? istege(y.aciklama.slice(0, 2000)) : m.aciklama, talimat: y.talimat !== undefined ? istege(y.talimat.slice(0, 4000)) : m.talimat,
    }, y);
    const hedef = y.grup && b.gruplar.some((g) => g.id === y.grup) ? y.grup : null;
    n = { ...b, gruplar: b.gruplar.map((g) => {
      const icinde = g.maddeler.some((x) => x.id === id);
      if (hedef && hedef !== g.id && icinde) return { ...g, maddeler: g.maddeler.filter((x) => x.id !== id) };
      if (hedef === g.id && !icinde) return { ...g, maddeler: [...g.maddeler, yeni] };
      return icinde ? { ...g, maddeler: g.maddeler.map((x) => (x.id === id ? yeni : x)) } : g;
    }) };
  } else if (b.blok === "olcum") {
    n = { ...b, sutunlar: b.sutunlar.map((c) => {
      if (c.id !== id) return c;
      const giris = y.tur === "metin" || y.tur === "sayi" || y.tur === "secim" || y.tur === "evet" ? y.tur : c.giris;
      const secenekler = giris === "secim" ? (y.secenekler ?? c.secenekler) : undefined;
      const gecerli = giris === "evet" ? ["evet", "hayir"] : secenekler ?? [];
      const olumsuz = (y.olumsuz ?? c.olumsuz)?.filter((o) => gecerli.includes(o));
      return sinirli(formulYaz({
        ...c, ad: y.ad !== undefined ? kirp(y.ad, 200) || c.ad : c.ad, giris, secenekler, olumsuz: olumsuz?.length ? olumsuz : undefined,
        agir: y.agir ?? c.agir, birim: y.birim !== undefined ? istege(kirp(y.birim, 40)) : c.birim, zorunlu: y.zorunlu ?? c.zorunlu,
      }, y), giris === "sayi" ? y : { op: "", sinir: null });
    }) };
  } else if (b.blok === "test") {
    n = { ...b, degerler: b.degerler.map((d) => {
      if (d.id !== id) return d;
      const tur = y.tur ?? (d.secenekler?.length ? "secim" : d.metin ? "metin" : "sayi");
      const secenekler = tur === "secim" ? (y.secenekler ?? d.secenekler) : undefined;
      const olumsuz = (y.olumsuz ?? d.olumsuz)?.filter((o) => (secenekler ?? []).includes(o));
      return sinirli(formulYaz({
        ...d, ad: y.ad !== undefined ? kirp(y.ad, 200) || d.ad : d.ad, metin: tur === "metin", secenekler, olumsuz: olumsuz?.length ? olumsuz : undefined,
        agir: y.agir ?? d.agir, birim: y.birim !== undefined ? istege(kirp(y.birim, 40)) : d.birim, zorunlu: y.zorunlu ?? d.zorunlu,
        not: y.not !== undefined ? istege(kirp(y.not, 120)) : d.not,
      }, y), tur === "sayi" ? y : { op: "", sinir: null });
    }) };
  }
  if (n === b) return t;
  const y2 = { ...t, bolumler: t.bolumler.map((x, j) => (j === i ? n : x)) };
  return y.ad !== undefined ? formulAdlariniDegistir(y2, t, i, id) : y2;
}

/** 495 → 556: öğenin adı değişince onu anan formüllerde de değişir — formatın BÜTÜN formüllerinde (alan, sütun, değer, madde; 556'da tablo dışından
    da sütun adı anılır) — format/formul.ts formulAdDegistir */
function formulAdlariniDegistir(y: FormatTanimi, once: FormatTanimi, i: number, id: string): FormatTanimi {
  const ad = (t: FormatTanimi) => {
    const b = t.bolumler[i];
    if (b?.blok === "bilgi") return b.alanlar.find((a) => a.id === id)?.ad;
    if (b?.blok === "test") return b.degerler.find((d) => d.id === id)?.ad;
    if (b?.blok === "olcum") return b.sutunlar.find((s) => s.id === id)?.ad;
    if (b?.blok === "liste") return b.gruplar.flatMap((g) => g.maddeler).find((x) => x.id === id)?.metin;
    return undefined;
  };
  const eski = ad(once), yeni = ad(y), b = y.bolumler[i];
  if (!eski || !yeni || eski === yeni) return y;
  /* formülü olmayan öğeye dokunulmaz (anahtar eklenmez) */
  const f = <O extends { formul?: string }>(o: O): O => (o.formul ? { ...o, formul: formulAdDegistir(o.formul, eski, yeni) } : o);
  /* 2026-10-16: tablonun sonuç kuralları da (koşul ve "=" ile başlayan neden) */
  const k = (r: SonucKurali): SonucKurali => ({ ...r, kosul: formulAdDegistir(r.kosul, eski, yeni),
    ...(r.neden?.trim().startsWith("=") ? { neden: formulAdDegistir(r.neden, eski, yeni) } : {}) });
  void b;
  return { ...y, bolumler: y.bolumler.map((x) => x.blok === "bilgi" ? { ...x, alanlar: x.alanlar.map(f) } : x.blok === "test" ? { ...x, degerler: x.degerler.map(f) }
    : x.blok === "olcum" ? { ...x, sutunlar: x.sutunlar.map(f), ...(x.sonucKurali ? { sonucKurali: x.sonucKurali.map(k) } : {}) }
    : x.blok === "liste" ? { ...x, gruplar: x.gruplar.map((g) => ({ ...g, maddeler: g.maddeler.map(f) })) } : x) };
}

/* ── SONUÇ KURALI (2026-10-16; pkproje §9 "SONUÇ KURALI FORMAT YAPICIDA" — reisim: "kurala göre otomatik uygun uygun değil diyor, ama ilgili ayar
   buradan yapılamıyor … format yapıcıya koyalım") — tablonun ayarında; değerlendirme src/format/sonuc.ts ── */
/** kuralın kaydedilecek biçimi: koşul ve "=" ile başlayan neden köşeli parantezli formül biçimine (formulDuzelt), boş alan anahtarsız */
export function kuralDuzelt(k: SonucKurali): SonucKurali {
  const kosul = k.kosul.trim() ? formulDuzelt(k.kosul).slice(0, FORMUL_EN_UZUN) : "";
  const n = (k.neden ?? "").trim();
  const neden = (n.startsWith("=") ? `=${formulDuzelt(n.slice(1))}` : n.replace(/\s+/g, " ")).slice(0, 2000);
  const aciklama = kirp(k.aciklama ?? "", 400);
  return { kosul, ...(neden && neden !== "=" ? { neden } : {}), ...(aciklama ? { aciklama } : {}), ...(k.agir ? { agir: true } : {}) };
}
/** tablonun sonuç kuralları (boş liste: kendiliğinden sonuç yok — denetçi seçer; en çok KURAL_EN_COK) */
export function sonucKuraliYaz(t: FormatTanimi, i: number, l: readonly SonucKurali[]): FormatTanimi {
  const b = t.bolumler[i];
  if (b?.blok !== "olcum") return t;
  return { ...t, bolumler: t.bolumler.map((x, j) => (j === i ? { ...b, sonucKurali: l.slice(0, KURAL_EN_COK).map(kuralDuzelt) } : x)) };
}
/** hesaplı (Bakanlık) tabloda Bakanlık kurallarına dön */
export function bakanlikKuralinaDon(t: FormatTanimi, i: number): FormatTanimi {
  const b = t.bolumler[i];
  return b?.blok === "olcum" && b.hesap ? sonucKuraliYaz(t, i, varsayilanKurallar(t, b)) : t;
}

/* ── FORMÜL PANELİNİN ADLARI (2026-10-16 — reisim: "hesaplama tuşuna basınca bir sürü değer çıkıyor … her birimin kendi tablosundaki değerler
   çıksın, diğer değerler diğer olarak gözüksün tıklayıp açılan listeden seçilebilsin") ── */
export interface AdGruplari { kendi: string[]; diger: { bolum: string; adlar: string[] }[] }
const anahtarAd = (s: string) => s.trim().toLocaleLowerCase("tr");
/** öğenin bölümünün (tabloda tablonun sütunları) adları önce; formatın öteki kutuları bölüm bölüm "Diğer"de. kendi: öğenin kendi adı (listede yok);
    adlar tekil (aynı ad bir kez — formül ilk bulduğunu kullanır) */
export function formulAdGruplari(t: FormatTanimi, b: Bolum, kendi = ""): AdGruplari {
  const gor = new Set<string>([anahtarAd(kendi)].filter(Boolean));
  const temiz = (l: readonly string[]) => l.filter((a) => { const k = anahtarAd(a); if (!k || gor.has(k)) return false; gor.add(k); return true; });
  const adlar = (x: Bolum): string[] => (x.blok === "bilgi" ? x.alanlar.map((a) => a.ad) : x.blok === "test" ? x.degerler.map((d) => d.ad)
    : x.blok === "liste" ? x.gruplar.flatMap((g) => g.maddeler.map((m) => m.metin)) : x.blok === "olcum" ? (x === b ? x.sutunlar.map((s) => s.ad) : [x.ad, ...x.sutunlar.map((s) => s.ad)]) : []);
  const kendiAdlari = temiz(adlar(b));
  const diger = [
    ...(b.blok === "olcum" ? [{ bolum: `${b.ad} (bütün tablo)`, adlar: temiz([b.ad]) }] : []),
    ...t.bolumler.filter((x) => x !== b).map((x) => ({ bolum: x.ad, adlar: temiz(adlar(x)) })),
  ].filter((g) => g.adlar.length);
  return { kendi: kendiAdlari, diger };
}

/* ── GRUPLAR (kontrol listesi) ── ad ve talimat her grupta yazılır (470: Bakanlık grubunda da) */
export function grupEkle(t: FormatTanimi, i: number, ad: string): FormatTanimi {
  const b = t.bolumler[i];
  if (b?.blok !== "liste") return t;
  return { ...t, bolumler: t.bolumler.map((x, j) => (j === i ? { ...b, gruplar: [...b.gruplar, { id: yeniKimlik(t, "g"), ad: kirp(ad, 200), maddeler: [] }] } : x)) };
}
export function grupYaz(t: FormatTanimi, i: number, gid: string, y: { ad?: string; talimat?: string }): FormatTanimi {
  const b = t.bolumler[i];
  if (b?.blok !== "liste") return t;
  return { ...t, bolumler: t.bolumler.map((x, j) => (j !== i ? x : { ...b, gruplar: b.gruplar.map((g) => (g.id !== gid ? g : {
    ...g, ad: y.ad !== undefined ? kirp(y.ad, 200) : g.ad, talimat: y.talimat !== undefined ? istege(y.talimat.slice(0, 4000)) : g.talimat,
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

/** cevap seti (2–6; 2. seçenek olumsuz sayılır) */
export function cevaplarYaz(t: FormatTanimi, i: number, l: readonly string[]): FormatTanimi {
  const b = t.bolumler[i], c = [...new Set(l.map((x) => kirp(x, 40)).filter(Boolean))].slice(0, 6);
  if (b?.blok !== "liste" || c.length < 2) return t;
  return { ...t, bolumler: t.bolumler.map((x, j) => (j === i ? { ...b, cevaplar: c } : x)) };
}
/** ölçüm tablosunun uygunluk notları (Not-1 …) */
export type NotGirdisi = { metin: string; kusur: boolean; agir: boolean };
export function notlarYaz(t: FormatTanimi, i: number, l: readonly NotGirdisi[]): FormatTanimi {
  const b = t.bolumler[i];
  if (b?.blok !== "olcum") return t;
  const notlar = l.map((x) => ({ metin: kirp(x.metin, 400), kusur: x.kusur, agir: x.kusur && x.agir })).filter((x) => x.metin).slice(0, 20);
  return { ...t, bolumler: t.bolumler.map((x, j) => (j === i ? { ...b, notlar: notlar.length ? notlar : undefined } : x)) };
}
/** görünüm: form kodu, başlık, metot ve kapsam (dayanak), genel muayene talimatı. resmiFormat: Bakanlık formatı mı (kilitli öğesi ve form kodu
    var) — 470'ten beri yalnız işaret: kod ve başlık da değişir, yayın denetimi uyarır */
export const resmiFormat = (t: FormatTanimi) => kilitliKimlikler(t).size > 0 && !!t.gorunum.formKodu;
export function gorunumYaz(t: FormatTanimi, y: { formKodu?: string; baslik?: string; dayanak?: string[]; talimat?: string; cevap?: "acilir" | "tus" }): FormatTanimi {
  return { ...t, gorunum: {
    ...t.gorunum,
    formKodu: y.formKodu !== undefined ? kirp(y.formKodu, 20) : t.gorunum.formKodu,
    baslik: y.baslik !== undefined ? kirp(y.baslik, 200) : t.gorunum.baslik,
    dayanak: y.dayanak ? y.dayanak.map((x) => kirp(x, 300)).filter(Boolean).slice(0, 20) : t.gorunum.dayanak,
    talimat: y.talimat !== undefined ? y.talimat.slice(0, 8000) : t.gorunum.talimat,
    /* 472: madde cevabının saha ekranındaki biçimi (açılır liste / yan yana tuşlar) */
    cevap: y.cevap === "acilir" || y.cevap === "tus" ? y.cevap : t.gorunum.cevap,
  } };
}

/** 492 (reisim 2026-10-11, hata listesi 9: "sadece sgk no ve isg katip no değiştirilemez olsun ve format yapıcıda bu belirlenebilir olsun"): künye
    bilgisinin sahada kilidi — kilitli: denetçi değiştiremez; açık: raporun kendi kopyasında değiştirir (başlangıç SGK ve İSG-KATİP kilitli) */
export function kunyeKilitYaz(t: FormatTanimi, a: KunyeAlani, kilitli: boolean): FormatTanimi {
  const k = new Set(kilitliKunye(t));
  if (kilitli) k.add(a); else k.delete(a);
  return { ...t, gorunum: { ...t.gorunum, kilitli: KUNYE_ALANLARI.filter((x) => k.has(x)) } };
}

/* ── İMZA BÖLÜMÜNÜN SATIRLARI (595; sunum 595 madde 1 — reisim: "mesela teknik yönetici için unvan diploma no gibi satırlar eklemek istedim
   ekleyemedim"): satırın adı, sırası, varlığı formatın; değeri kişinin kaydından. Eski bölüm (satırsız) ilk değişiklikte bugünkü satırlarıyla
   tanıma yazılır (yeni kimliklerle) — dokunulmayan format aynı kalır. imzalar satırlardaki kişilerin özeti (en az biri; hiç kişi satırı yoksa
   uzman — şemanın en az bir kuralı, çizimde satırlar geçerli). ── */
type ImzaB = BolumOf<"imza">;
const imzaBolumu = (t: FormatTanimi, i: number): ImzaB | null => { const b = t.bolumler[i]; return b?.blok === "imza" ? b : null; };
/** satırları yazar: kimliksiz (varsayılandan gelen) satıra yeni kimlik; imzalar özeti */
function imzaYaz(t: FormatTanimi, i: number, l: readonly (Omit<ImzaSatiri, "id"> & { id?: string })[]): FormatTanimi {
  const b = imzaBolumu(t, i);
  if (!b) return t;
  const ek = new Set<string>(), var_ = kimlikler({ ...t, bolumler: t.bolumler.map((x, j) => (j === i ? { ...b, satirlar: [] } : x)) });
  const satirlar = l.slice(0, 40).map((x): ImzaSatiri => {
    const id = x.id && !var_.has(x.id) && !ek.has(x.id) && !x.id.startsWith("imz_") ? x.id : yeniKimlik({ ...t, bolumler: [] }, "i", new Set([...var_, ...ek]));
    ek.add(id);
    return { ...x, id };
  });
  const kisiler = (["uzman", "teknik"] as const).filter((k) => satirlar.some((x) => x.kim === k));   // eski alan imzalar: yalnız uzman / teknik
  return { ...t, bolumler: t.bolumler.map((x, j) => (j === i ? { ...b, satirlar, imzalar: kisiler.length ? kisiler : ["uzman"] } : x)) };
}
/** kişinin henüz eklenmemiş bilgileri ("+ Satır ekle" seçenekleri) */
export function eksikImzaAlanlari(b: ImzaB, kim: ImzaYeri): ImzaAlani[] {
  const l = imzaSatirlari(b);
  return imzaAlanlari(kim).filter((a) => !l.some((x) => x.kim === kim && x.alan === a));
}
/** satır ekler (kişi bilgisi ya da serbest satır) — sona; kimliği döner (adı yazma kipinde açılsın) */
export function imzaSatiriEkle(t: FormatTanimi, i: number, kim: ImzaKisisi, alan?: ImzaAlani, ad?: string): { t: FormatTanimi; id: string | null } {
  const b = imzaBolumu(t, i);
  if (!b) return { t, id: null };
  if (kim !== "diger" && (!alan || !imzaAlanlari(kim).includes(alan))) return { t, id: null };
  const varsayilan = kim === "diger" ? "Yeni satır" : alan === "ad" && kim !== "uzman" ? (kim === "teknik" ? "Onaylayan teknik yönetici" : IMZA_KISI_ADI[kim]) : IMZA_ALAN_ADI[alan!];
  const y = imzaYaz(t, i, [...imzaSatirlari(b), { kim, ...(kim === "diger" ? {} : { alan }), ad: (ad ?? varsayilan).trim().slice(0, 200) || varsayilan, ...(alan === "imza" ? { tam: true } : {}) }]);
  return { t: y, id: (imzaBolumu(y, i)?.satirlar ?? []).at(-1)?.id ?? null };
}
/** satırın adı, sabit yazısı (serbest satır), tam satırlığı */
export function imzaSatiriYaz(t: FormatTanimi, i: number, id: string, y: { ad?: string; metin?: string; tam?: boolean }): FormatTanimi {
  const b = imzaBolumu(t, i);
  if (!b) return t;
  const l = imzaSatirlari(b);
  if (!l.some((x) => x.id === id)) return t;
  return imzaYaz(t, i, l.map((x) => {
    if (x.id !== id) return x;
    const ad = y.ad === undefined ? x.ad : y.ad.trim().replace(/\s+/g, " ").slice(0, 200) || x.ad;
    const metin = x.kim !== "diger" ? undefined : y.metin === undefined ? x.metin : y.metin.trim().slice(0, 400) || undefined;
    const tam = y.tam === undefined ? x.tam : y.tam || undefined;
    return { ...x, ad, metin, tam };
  }));
}
export function imzaSatiriSil(t: FormatTanimi, i: number, id: string): FormatTanimi {
  const b = imzaBolumu(t, i);
  return b ? imzaYaz(t, i, imzaSatirlari(b).filter((x) => x.id !== id)) : t;
}
/** satırı bir yukarı (-1) ya da aşağı (1) taşır */
export function imzaSatiriTasi(t: FormatTanimi, i: number, id: string, yon: -1 | 1): FormatTanimi {
  const b = imzaBolumu(t, i);
  if (!b) return t;
  const l = imzaSatirlari(b), j = l.findIndex((x) => x.id === id);
  return j < 0 || j + yon < 0 || j + yon >= l.length ? t : imzaYaz(t, i, tasi(l, j, j + yon));
}
/** kişiyi ekler (varsayılan satırlarıyla, sona) ya da bütün satırlarıyla çıkarır */
export function imzaKisisiYaz(t: FormatTanimi, i: number, kim: ImzaYeri, var_: boolean): FormatTanimi {
  const b = imzaBolumu(t, i);
  if (!b) return t;
  const l = imzaSatirlari(b), simdi = l.some((x) => x.kim === kim);
  if (var_ === simdi) return t;
  return imzaYaz(t, i, var_ ? [...l, ...imzaVarsayilani(kim).map((x) => ({ ad: x.ad, kim: x.kim, alan: x.alan, tam: x.tam }))] : l.filter((x) => x.kim !== kim));
}

/* ── E-İMZANIN YERİ (595 madde 25): hücre (varsayılan — görünümden kalkar), kutu (son sayfada; ölçüler sınır içinde, şerit bandına girmez),
   görünmez ── */
/** her sayfanın altında şeride ayrılan bant (mm) — PDF motorunun alt kenar boşluğuyla aynı (src/belge/pdf.ts RAPOR_SAYFA) */
export const EIMZA_SERIT_MM = 20;
export function eimzaYaz(t: FormatTanimi, y: { yer: "hucre" | "kutu" | "gorunmez"; x?: number; y?: number; en?: number; boy?: number }): FormatTanimi {
  const g = { ...t.gorunum };
  delete g.eimza;
  if (y.yer === "hucre") return { ...t, gorunum: g };
  if (y.yer === "gorunmez") return { ...t, gorunum: { ...g, eimza: { yer: "gorunmez" } } };
  const e = t.gorunum.eimza;
  const sinir = (n: number, en: number, cok: number) => Math.round(Math.min(Math.max(Number.isFinite(n) ? n : en, en), cok));
  const en = sinir(y.en ?? e?.en ?? EIMZA_KUTU.en, 20, 210), boy = sinir(y.boy ?? e?.boy ?? EIMZA_KUTU.boy, 10, 100);
  const x = sinir(y.x ?? e?.x ?? EIMZA_KUTU.x, 0, 210 - en), ust = sinir(y.y ?? e?.y ?? EIMZA_KUTU.y, 0, 297 - EIMZA_SERIT_MM - boy);
  return { ...t, gorunum: { ...g, eimza: { yer: "kutu", x, y: ust, en, boy } } };
}

/* ── FİRMA BİLGİLERİ (595 madde 3, K2 — reisim: "firma bilgileri kısmında da [satır eklemek istedim ekleyemedim]"): 1. bölümün satırları
   formatın (adı, sırası, tam satırlığı, varlığı); SGK, İSG-KATİP ve başlangıç çıkarılmaz (FIRMA_ZORUNLU), SGK ve İSG-KATİP'in adı da değişmez
   (Bakanlık / kayıt). Eski format (satırsız) ilk değişiklikte bugünkü satırlarıyla tanıma yazılır (yeni kimliklerle). ── */
/** adı değişmeyen satırlar (SGK, İSG-KATİP — sahada da kilitli bilgiler) */
export const FIRMA_ADI_SABIT: readonly FirmaKaynagi[] = ["isg", "sgk"];
function firmaYaz(t: FormatTanimi, l: readonly (Omit<FirmaSatiri, "id"> & { id?: string })[]): FormatTanimi {
  const g = { ...t.gorunum };
  delete g.firma;
  const var_ = kimlikler({ ...t, gorunum: g }), ek = new Set<string>();
  const satirlar = l.slice(0, 40).map((x): FirmaSatiri => {
    const id = x.id && !var_.has(x.id) && !ek.has(x.id) && !x.id.startsWith("fb_") ? x.id : yeniKimlik({ ...t, bolumler: [], gorunum: g }, "f", new Set([...var_, ...ek]));
    ek.add(id);
    return { ...x, id };
  });
  return { ...t, gorunum: { ...g, firma: { satirlar } } };
}
/** eklenebilecek kayıt bilgileri (listede olmayanlar; serbest satır her zaman) */
export const eksikFirmaKaynaklari = (t: FormatTanimi): FirmaKaynagi[] =>
  FIRMA_KAYNAKLARI.filter((k) => k !== "serbest" && !firmaSatirlari(t).some((s) => s.kaynak === k));
/** satır ekler (sona); kimliği döner (adı yazma kipinde açılsın) — aynı kayıt bilgisi ikinci kez eklenmez */
export function firmaSatiriEkle(t: FormatTanimi, kaynak: FirmaKaynagi, ad?: string): { t: FormatTanimi; id: string | null } {
  const l = firmaSatirlari(t);
  if (kaynak !== "serbest" && l.some((s) => s.kaynak === kaynak)) return { t, id: null };
  const y = firmaYaz(t, [...l, { kaynak, ad: (ad ?? FIRMA_KAYNAK_ADI[kaynak]).trim().replace(/\s+/g, " ").slice(0, 200) || FIRMA_KAYNAK_ADI[kaynak],
    ...(kaynak === "metot" || kaynak === "adres" ? { tam: true } : {}) }]);
  return { t: y, id: y.gorunum.firma?.satirlar.at(-1)?.id ?? null };
}
export function firmaSatiriYaz(t: FormatTanimi, id: string, y: { ad?: string; metin?: string; tam?: boolean }): FormatTanimi {
  const l = firmaSatirlari(t);
  if (!l.some((x) => x.id === id)) return t;
  return firmaYaz(t, l.map((x) => {
    if (x.id !== id) return x;
    const ad = y.ad === undefined || FIRMA_ADI_SABIT.includes(x.kaynak) ? x.ad : y.ad.trim().replace(/\s+/g, " ").slice(0, 200) || x.ad;
    const metin = x.kaynak !== "serbest" ? undefined : y.metin === undefined ? x.metin : y.metin.trim().slice(0, 400) || undefined;
    const tam = y.tam === undefined ? x.tam : y.tam || undefined;
    return { ...x, ad, metin, tam };
  }));
}
/** satırı çıkarır (zorunlu satır çıkmaz — aynı tanım döner) */
export function firmaSatiriSil(t: FormatTanimi, id: string): FormatTanimi {
  const l = firmaSatirlari(t), s = l.find((x) => x.id === id);
  return !s || FIRMA_ZORUNLU.includes(s.kaynak) ? t : firmaYaz(t, l.filter((x) => x.id !== id));
}
export function firmaSatiriTasi(t: FormatTanimi, id: string, yon: -1 | 1): FormatTanimi {
  const l = firmaSatirlari(t), j = l.findIndex((x) => x.id === id);
  return j < 0 || j + yon < 0 || j + yon >= l.length ? t : firmaYaz(t, tasi(l, j, j + yon));
}

/* ── BAŞLIKLAR VE SABİT SÖZCÜKLER (595 madde 4, 6, 7, 11–15) — boş ya da bugünkü yazıyla aynı yazılan kalkar (görünümde hep bugünkü yazı) ── */
export type BolumBasligi = "sira" | "not" | "sonuc" | "olcum" | "deger" | "sinir" | "no" | "madde" | "uygun" | "uygun_degil" | "sartli" | "yonlendirme";
const temiz = (s: string, n: number) => s.trim().replace(/\s+/g, " ").slice(0, n);
/** bölümün sabit başlığını / sözcüğünü yazar (yanlış bölüm türü → aynı tanım) */
export function bolumBasligiYaz(t: FormatTanimi, i: number, a: BolumBasligi, metin: string): FormatTanimi {
  const b = t.bolumler[i];
  if (!b) return t;
  const yaz = (y: Bolum) => ({ ...t, bolumler: t.bolumler.map((x, j) => (j === i ? y : x)) });
  const kume = <K extends string>(eski: Partial<Record<K, string | undefined>> | undefined, k: K, varsayilan: string) => {
    const v = temiz(metin, 60), y = { ...(eski ?? {}) } as Partial<Record<K, string>>;
    if (!v || v === varsayilan) delete y[k]; else y[k] = v;
    return Object.keys(y).length ? y : undefined;
  };
  if (b.blok === "olcum" && (a === "sira" || a === "not" || a === "sonuc")) {
    const d = olcumBasliklari({ ...b, basliklar: undefined });
    return yaz({ ...b, basliklar: kume(b.basliklar, a, d[a]) });
  }
  if (b.blok === "test" && (a === "olcum" || a === "deger" || a === "sinir" || a === "sonuc")) {
    const d = testBasliklari({ ...b, basliklar: undefined });
    return yaz({ ...b, basliklar: kume(b.basliklar, a, d[a]) });
  }
  if (b.blok === "liste" && (a === "no" || a === "madde" || a === "sonuc")) {
    const d = listeBasliklari({ ...b, basliklar: undefined });
    return yaz({ ...b, basliklar: kume(b.basliklar, a, d[a]) });
  }
  if (b.blok === "sonuc" && (a === "uygun" || a === "uygun_degil" || a === "sartli")) {
    const v = temiz(metin, 120), d = sonucMetinleri({ ...b, uygunMetin: undefined, uygunDegilMetin: undefined, sartliMetin: undefined });
    const k = a === "uygun" ? "uygunMetin" : a === "uygun_degil" ? "uygunDegilMetin" : "sartliMetin", y = { ...b };
    if (!v || v === (a === "uygun" ? d.uygun : a === "uygun_degil" ? d.uygunDegil : d.sartli)) delete y[k]; else y[k] = v;
    return yaz(y);
  }
  if (b.blok === "not" && a === "yonlendirme") {
    const v = metin.trim().slice(0, 400), y = { ...b };
    if (v) y.yonlendirme = v; else delete y.yonlendirme;
    return yaz(y);
  }
  return t;
}
/** ölçüm tablosunda Sonuç sütununun belgedeki yeri (son varsayılan — görünümden kalkar) */
export function sonucYeriYaz(t: FormatTanimi, i: number, yer: "son" | "bas" | "gizli"): FormatTanimi {
  const b = t.bolumler[i];
  if (b?.blok !== "olcum") return t;
  const y = { ...b };
  if (yer === "son") delete y.sonucYeri; else y.sonucYeri = yer;
  return { ...t, bolumler: t.bolumler.map((x, j) => (j === i ? y : x)) };
}
/** yorum bölümünün belgedeki en az satırı (boş: kendiliğinden) */
export function notSatiriYaz(t: FormatTanimi, i: number, n: number | null): FormatTanimi {
  const b = t.bolumler[i];
  if (b?.blok !== "not") return t;
  const y = { ...b };
  if (n === null || !Number.isFinite(n) || n < 1) delete y.satir; else y.satir = Math.min(30, Math.round(n));
  return { ...t, bolumler: t.bolumler.map((x, j) => (j === i ? y : x)) };
}
export type GorunumBasligi = "bas_kod" | "bas_surum" | "bas_no" | "bas_tarih" | "alt_yazi" | "ekipman_kod" | "ekipman_tur";
/** başlık tablosunun etiketleri, sayfa altı yazısı, ekipman kodu / türü satırlarının adı */
export function gorunumBasligiYaz(t: FormatTanimi, a: GorunumBasligi, metin: string): FormatTanimi {
  const g = { ...t.gorunum };
  if (a === "alt_yazi") {
    const v = metin.trim().slice(0, 300);
    if (v && v !== "{firma} · {kod}") g.altYazi = v; else delete g.altYazi;
    return { ...t, gorunum: g };
  }
  const [grup, k] = a.split("_") as ["bas" | "ekipman", string];
  /* 595 (madde 13): satırları tanımlı başlık tablosunda etiket satırın adıdır */
  if (grup === "bas" && t.gorunum.basSatirlar) {
    const s = t.gorunum.basSatirlar.find((x) => x.kaynak === k);
    return s ? basSatiriYaz(t, s.id, { ad: metin.trim() || BAS_KAYNAK_ADI[k as BasKaynagi] }) : t;
  }
  const d = grup === "bas" ? basEtiketleri({ gorunum: { ...g, bas: undefined } }) : ekipmanEtiketleri({ gorunum: { ...g, ekipmanAd: undefined } });
  const v = temiz(metin, 60), eski = { ...((grup === "bas" ? g.bas : g.ekipmanAd) ?? {}) } as Record<string, string>;
  if (!v || v === (d as Record<string, string>)[k]) delete eski[k]; else eski[k] = v;
  const yeni = Object.keys(eski).length ? eski : undefined;
  if (grup === "bas") { if (yeni) g.bas = yeni; else delete g.bas; } else { if (yeni) g.ekipmanAd = yeni; else delete g.ekipmanAd; }
  return { ...t, gorunum: g };
}

/* ── ÖĞELERİN SIRASI (595 madde 8): alan, madde, sütun, değer bir yukarı / aşağı; madde grubun ucundan komşu gruba geçer ── */
export function ogeTasi(t: FormatTanimi, i: number, id: string, yon: -1 | 1): FormatTanimi {
  const b = t.bolumler[i];
  if (!b) return t;
  const yaz = (y: Bolum) => ({ ...t, bolumler: t.bolumler.map((x, j) => (j === i ? y : x)) });
  const kaydir = <T extends { id: string }>(l: readonly T[]) => { const j = l.findIndex((x) => x.id === id); return j < 0 || j + yon < 0 || j + yon >= l.length ? null : tasi(l, j, j + yon); };
  if (b.blok === "bilgi") { const l = kaydir(b.alanlar); return l ? yaz({ ...b, alanlar: l }) : t; }
  if (b.blok === "olcum") { const l = kaydir(b.sutunlar); return l ? yaz({ ...b, sutunlar: l }) : t; }
  if (b.blok === "test") { const l = kaydir(b.degerler); return l ? yaz({ ...b, degerler: l }) : t; }
  if (b.blok === "liste") {
    const gi = b.gruplar.findIndex((g) => g.maddeler.some((m) => m.id === id));
    if (gi < 0) return t;
    const g = b.gruplar[gi], mi = g.maddeler.findIndex((m) => m.id === id), m = g.maddeler[mi];
    const gruplar = b.gruplar.map((x) => ({ ...x, maddeler: [...x.maddeler] }));
    if (mi + yon >= 0 && mi + yon < g.maddeler.length) gruplar[gi].maddeler = tasi(g.maddeler, mi, mi + yon);
    else {
      const hedef = gi + yon;
      if (hedef < 0 || hedef >= gruplar.length) return t;
      gruplar[gi].maddeler.splice(mi, 1);
      if (yon < 0) gruplar[hedef].maddeler.push(m); else gruplar[hedef].maddeler.unshift(m);
    }
    return yaz({ ...b, gruplar });
  }
  return t;
}

/* ── TABLO SÜTUNLARI (595): ölçüm cihazları (madde 2, K3 — cihaz kaydından seçilir, adı yazılır, sırası değişir; en az bir sütun) ve
   uygunsuzluklar (madde 10 — tablo olarak; son sütun çıkınca bugünkü madde listesine döner) · bilgi bölümünün dizilişi (madde 9) ── */
type TabloAlani = CihazAlani | KusurAlani;
const tabloSutunlari = (b: Bolum): readonly { id: string; ad: string; alan: TabloAlani }[] =>
  b.blok === "cihaz" ? cihazSutunlari(b) : b.blok === "kusur" ? b.sutunlar ?? [] : [];
function tabloYaz(t: FormatTanimi, i: number, l: readonly { id?: string; ad: string; alan: TabloAlani }[]): FormatTanimi {
  const b = t.bolumler[i];
  if (!b || (b.blok !== "cihaz" && b.blok !== "kusur")) return t;
  const bos = { ...t, bolumler: t.bolumler.map((x, j) => (j === i ? { ...b, sutunlar: [] } : x)) } as FormatTanimi;
  const var_ = kimlikler(bos), ek = new Set<string>();
  const sutunlar = l.slice(0, b.blok === "cihaz" ? 10 : 6).map((x) => {
    const id = x.id && !var_.has(x.id) && !ek.has(x.id) && !x.id.startsWith("cs_") ? x.id : yeniKimlik({ ...t, bolumler: [] }, "t", new Set([...var_, ...ek]));
    ek.add(id);
    return { id, ad: x.ad, alan: x.alan };
  });
  const y = { ...b } as Record<string, unknown>;
  if (b.blok === "kusur" && !sutunlar.length) delete y.sutunlar; else y.sutunlar = sutunlar;
  return { ...t, bolumler: t.bolumler.map((x, j) => (j === i ? (y as Bolum) : x)) };
}
/** eklenebilecek sütunlar (bölümde olmayan bilgiler) */
export function eksikTabloAlanlari(b: Bolum): TabloAlani[] {
  const var_ = new Set(tabloSutunlari(b).map((s) => s.alan));
  return (b.blok === "cihaz" ? [...CIHAZ_ALANLARI] : b.blok === "kusur" ? [...KUSUR_ALANLARI] : []).filter((a) => !var_.has(a));
}
export function tabloSutunuEkle(t: FormatTanimi, i: number, alan: TabloAlani, ad?: string): { t: FormatTanimi; id: string | null } {
  const b = t.bolumler[i];
  if (!b || !eksikTabloAlanlari(b).includes(alan)) return { t, id: null };
  const varsayilan = b.blok === "cihaz" ? CIHAZ_ALAN_ADI[alan as CihazAlani] : KUSUR_ALAN_ADI[alan as KusurAlani];
  const y = tabloYaz(t, i, [...tabloSutunlari(b), { ad: (ad ?? varsayilan).trim().slice(0, 200) || varsayilan, alan }]);
  return { t: y, id: tabloSutunlari(y.bolumler[i]).at(-1)?.id ?? null };
}
export function tabloSutunuYaz(t: FormatTanimi, i: number, id: string, ad: string): FormatTanimi {
  const b = t.bolumler[i];
  if (!b) return t;
  const l = tabloSutunlari(b), v = ad.trim().replace(/\s+/g, " ").slice(0, 200);
  return !v || !l.some((s) => s.id === id) ? t : tabloYaz(t, i, l.map((s) => (s.id === id ? { ...s, ad: v } : s)));
}
export function tabloSutunuSil(t: FormatTanimi, i: number, id: string): FormatTanimi {
  const b = t.bolumler[i];
  if (!b) return t;
  const l = tabloSutunlari(b).filter((s) => s.id !== id);
  return b.blok === "cihaz" && !l.length ? t : tabloYaz(t, i, l);
}
export function tabloSutunuTasi(t: FormatTanimi, i: number, id: string, yon: -1 | 1): FormatTanimi {
  const b = t.bolumler[i];
  if (!b) return t;
  const l = tabloSutunlari(b), j = l.findIndex((s) => s.id === id);
  return j < 0 || j + yon < 0 || j + yon >= l.length ? t : tabloYaz(t, i, tasi(l, j, j + yon));
}
/** uygunsuzluklar tablo olarak (No · Uygunsuzluk · Ağırlık) ya da bugünkü madde listesi */
export function kusurTablosuYaz(t: FormatTanimi, i: number, tablo: boolean): FormatTanimi {
  const b = t.bolumler[i];
  if (b?.blok !== "kusur" || tablo === !!b.sutunlar?.length) return t;
  return tabloYaz(t, i, tablo ? (["sira", "metin", "agir"] as const).map((a) => ({ ad: KUSUR_ALAN_ADI[a], alan: a })) : []);
}
/** bilgi bölümünde bir satırda kaç bilgi (2 varsayılan — görünümden kalkar) */
export function bilgiDizilisiYaz(t: FormatTanimi, i: number, n: 1 | 2 | 3): FormatTanimi {
  const b = t.bolumler[i];
  if (b?.blok !== "bilgi") return t;
  const y = { ...b };
  if (n === 2) delete y.dizilis; else y.dizilis = n;
  return { ...t, bolumler: t.bolumler.map((x, j) => (j === i ? y : x)) };
}

/* ── HAZIR SATIRLAR (595 madde 5): ölçüm tablosunun satırları formatta — adı (ilk hücre) yazılır, sırası değişir, çıkarılır; yeni raporda
   satır olarak gelir. Son satır çıkınca liste kalkar (bugünkü boş tablo). ── */
function hazirYaz(t: FormatTanimi, i: number, l: readonly string[]): FormatTanimi {
  const b = t.bolumler[i];
  if (b?.blok !== "olcum") return t;
  const v = l.map((x) => x.trim().replace(/\s+/g, " ").slice(0, 120)).filter(Boolean).slice(0, 100), y = { ...b };
  if (v.length) y.hazir = v; else delete y.hazir;
  return { ...t, bolumler: t.bolumler.map((x, j) => (j === i ? y : x)) };
}
const hazirOf = (t: FormatTanimi, i: number): readonly string[] => { const b = t.bolumler[i]; return b?.blok === "olcum" ? b.hazir ?? [] : []; };
export function hazirSatirEkle(t: FormatTanimi, i: number, ad = "Yeni satır"): FormatTanimi {
  return hazirOf(t, i).length >= 100 ? t : hazirYaz(t, i, [...hazirOf(t, i), ad.trim() || "Yeni satır"]);
}
export function hazirSatirYaz(t: FormatTanimi, i: number, j: number, ad: string): FormatTanimi {
  const l = hazirOf(t, i);
  return !ad.trim() || j < 0 || j >= l.length ? t : hazirYaz(t, i, l.map((x, k) => (k === j ? ad : x)));
}
export function hazirSatirSil(t: FormatTanimi, i: number, j: number): FormatTanimi {
  const l = hazirOf(t, i);
  return j < 0 || j >= l.length ? t : hazirYaz(t, i, l.filter((_, k) => k !== j));
}
export function hazirSatirTasi(t: FormatTanimi, i: number, j: number, yon: -1 | 1): FormatTanimi {
  const l = hazirOf(t, i);
  return j < 0 || j + yon < 0 || j + yon >= l.length ? t : hazirYaz(t, i, tasi(l, j, j + yon));
}

/* ── EK SÜTUNLAR (595 madde 6, 7): kontrol listesine (açıklama, standart maddesi, fotoğraf, serbest yazı) ve test bölümüne (yazı / sayı / seçim)
   sütun — adı yazılır, sola / sağa, çıkar; sahada her madde / değerde doldurulur. Son sütun çıkınca liste kalkar (eski format aynı). ── */
type EkAlani = ListeSutunAlani | TestSutunTuru;
interface EkSutun { id: string; ad: string; alan: EkAlani; secenekler?: string[] }
const ekSutunlari = (b: Bolum): readonly EkSutun[] => (b.blok === "liste" || b.blok === "test" ? b.ekSutunlar ?? [] : []);
function ekYaz(t: FormatTanimi, i: number, l: readonly (Omit<EkSutun, "id"> & { id?: string })[]): FormatTanimi {
  const b = t.bolumler[i];
  if (!b || (b.blok !== "liste" && b.blok !== "test")) return t;
  const bos = { ...t, bolumler: t.bolumler.map((x, j) => (j === i ? { ...b, ekSutunlar: [] } : x)) } as FormatTanimi;
  const var_ = kimlikler(bos), ek = new Set<string>();
  const sutunlar = l.slice(0, EK_SUTUN_EN_COK).map((x) => {
    const id = x.id && !var_.has(x.id) && !ek.has(x.id) ? x.id : yeniKimlik({ ...t, bolumler: [] }, "t", new Set([...var_, ...ek]));
    ek.add(id);
    return { id, ad: x.ad, alan: x.alan, ...(x.secenekler?.length ? { secenekler: x.secenekler } : {}) };
  });
  const y = { ...b } as Record<string, unknown>;
  if (sutunlar.length) y.ekSutunlar = sutunlar; else delete y.ekSutunlar;
  return { ...t, bolumler: t.bolumler.map((x, j) => (j === i ? (y as Bolum) : x)) };
}
/** eklenebilecek ek sütunlar: kontrol listesinde olmayanlar (serbest yazı her zaman), testte üç tür; doluysa boş */
export function eksikEkSutunlar(b: Bolum): EkAlani[] {
  const l = ekSutunlari(b);
  if (l.length >= EK_SUTUN_EN_COK) return [];
  if (b.blok === "liste") return LISTE_SUTUN_ALANLARI.filter((a) => a === "yazi" || !l.some((s) => s.alan === a));
  return b.blok === "test" ? [...TEST_SUTUN_TURLERI] : [];
}
export const ekSutunAdi = (b: Bolum, a: EkAlani) => (b.blok === "liste" ? LISTE_SUTUN_ADI[a as ListeSutunAlani] : TEST_SUTUN_ADI[a as TestSutunTuru]);
export function ekSutunEkle(t: FormatTanimi, i: number, alan: EkAlani, ad?: string): { t: FormatTanimi; id: string | null } {
  const b = t.bolumler[i];
  if (!b || !eksikEkSutunlar(b).includes(alan)) return { t, id: null };
  const v = ekSutunAdi(b, alan);
  const y = ekYaz(t, i, [...ekSutunlari(b), { ad: (ad ?? v).trim().replace(/\s+/g, " ").slice(0, 200) || v, alan, ...(alan === "secim" ? { secenekler: ["Var", "Yok"] } : {}) }]);
  return { t: y, id: ekSutunlari(y.bolumler[i]).at(-1)?.id ?? null };
}
export function ekSutunYaz(t: FormatTanimi, i: number, id: string, y: { ad?: string; secenekler?: string[] }): FormatTanimi {
  const b = t.bolumler[i];
  if (!b) return t;
  const l = ekSutunlari(b), s = l.find((x) => x.id === id);
  if (!s) return t;
  const ad = y.ad !== undefined ? y.ad.trim().replace(/\s+/g, " ").slice(0, 200) : s.ad;
  const sec = y.secenekler !== undefined && s.alan === "secim"
    ? [...new Set(y.secenekler.map((x) => x.trim().slice(0, 60)).filter(Boolean))].slice(0, 20) : s.secenekler;
  return !ad ? t : ekYaz(t, i, l.map((x) => (x.id === id ? { ...x, ad, secenekler: sec } : x)));
}
export function ekSutunSil(t: FormatTanimi, i: number, id: string): FormatTanimi {
  const b = t.bolumler[i];
  return b ? ekYaz(t, i, ekSutunlari(b).filter((x) => x.id !== id)) : t;
}
export function ekSutunTasi(t: FormatTanimi, i: number, id: string, yon: -1 | 1): FormatTanimi {
  const b = t.bolumler[i];
  if (!b) return t;
  const l = ekSutunlari(b), j = l.findIndex((x) => x.id === id);
  return j < 0 || j + yon < 0 || j + yon >= l.length ? t : ekYaz(t, i, tasi(l, j, j + yon));
}

/* ── FOTOĞRAF KUTULARI (595 madde 16): adlı kutular — adı yazılır, sırası değişir, çıkarılır; sahada fotoğraf o kutuya çekilir. Son kutu çıkınca
   liste kalkar (eski format aynı). Kimlik tanımda tekil (fotoğrafın yeri olarak saklanır). ── */
function kutuYaz(t: FormatTanimi, i: number, l: readonly { id?: string; ad: string }[]): FormatTanimi {
  const b = t.bolumler[i];
  if (b?.blok !== "foto") return t;
  const var_ = kimlikler({ ...t, bolumler: t.bolumler.map((x, j) => (j === i ? { ...b, kutular: [] } : x)) }), ek = new Set<string>();
  const kutular = l.slice(0, 20).map((x) => {
    const id = x.id && !var_.has(x.id) && !ek.has(x.id) ? x.id : yeniKimlik({ ...t, bolumler: [] }, "k", new Set([...var_, ...ek]));
    ek.add(id);
    return { id, ad: x.ad.trim().replace(/\s+/g, " ").slice(0, 200) || "Fotoğraf" };
  });
  const y = { ...b };
  if (kutular.length) y.kutular = kutular; else delete y.kutular;
  return { ...t, bolumler: t.bolumler.map((x, j) => (j === i ? y : x)) };
}
const kutulari = (t: FormatTanimi, i: number) => { const b = t.bolumler[i]; return b?.blok === "foto" ? b.kutular ?? [] : []; };
export function fotoKutusuEkle(t: FormatTanimi, i: number, ad = "Yeni fotoğraf"): { t: FormatTanimi; id: string | null } {
  if (t.bolumler[i]?.blok !== "foto" || kutulari(t, i).length >= 20) return { t, id: null };
  const y = kutuYaz(t, i, [...kutulari(t, i), { ad }]);
  return { t: y, id: kutulari(y, i).at(-1)?.id ?? null };
}
export function fotoKutusuYaz(t: FormatTanimi, i: number, id: string, ad: string): FormatTanimi {
  const l = kutulari(t, i);
  return !ad.trim() || !l.some((k) => k.id === id) ? t : kutuYaz(t, i, l.map((k) => (k.id === id ? { ...k, ad } : k)));
}
export function fotoKutusuSil(t: FormatTanimi, i: number, id: string): FormatTanimi {
  return kutuYaz(t, i, kutulari(t, i).filter((k) => k.id !== id));
}
export function fotoKutusuTasi(t: FormatTanimi, i: number, id: string, yon: -1 | 1): FormatTanimi {
  const l = kutulari(t, i), j = l.findIndex((k) => k.id === id);
  return j < 0 || j + yon < 0 || j + yon >= l.length ? t : kutuYaz(t, i, tasi(l, j, j + yon));
}

/* ── ŞARTLI UYGUN (595 madde 12): sonuç bölümünde üçüncü seçenek — açılır / kapanır; kapanınca sözcüğü de kalkar (eski format aynı) ── */
export function sartliYaz(t: FormatTanimi, i: number, acik: boolean): FormatTanimi {
  const b = t.bolumler[i];
  if (b?.blok !== "sonuc" || acik === !!b.sartli) return t;
  const y = { ...b };
  if (acik) y.sartli = true; else { delete y.sartli; delete y.sartliMetin; }
  return { ...t, bolumler: t.bolumler.map((x, j) => (j === i ? y : x)) };
}

/* ── BAŞLIK TABLOSU (595 madde 13): doküman bilgisi satırları (ad, sıra, varlık; değer kayıttan ya da serbest yazı) ve hücrelerin yeri. İlk
   değişiklikte bugünkü dört satır yeni kimlikle tanıma yazılır (adları bas etiketlerinden; bas kalkar) — dokunulmayan format aynı. ── */
function basYaz(t: FormatTanimi, l: readonly (Omit<BasSatiri, "id"> & { id?: string })[]): FormatTanimi {
  const g = { ...t.gorunum };
  delete g.basSatirlar; delete g.bas;
  const var_ = kimlikler({ ...t, gorunum: g }), ek = new Set<string>();
  g.basSatirlar = l.slice(0, 10).map((x) => {
    const id = x.id && !var_.has(x.id) && !ek.has(x.id) && !x.id.startsWith("bs_") ? x.id : yeniKimlik({ ...t, bolumler: [], gorunum: g }, "h", new Set([...var_, ...ek]));
    ek.add(id);
    const y: BasSatiri = { id, ad: x.ad.trim().replace(/\s+/g, " ").slice(0, 200) || BAS_KAYNAK_ADI[x.kaynak], kaynak: x.kaynak };
    if (x.kaynak === "serbest" && x.metin?.trim()) y.metin = x.metin.trim().slice(0, 200);
    return y;
  });
  return { ...t, gorunum: g };
}
/** eklenebilecek bilgiler (başlık tablosunda olmayanlar; serbest satır her zaman) */
export function eksikBasKaynaklari(t: FormatTanimi): BasKaynagi[] {
  const l = basSatirlari(t);
  return l.length >= 10 ? [] : BAS_KAYNAKLARI.filter((k) => k === "serbest" || !l.some((s) => s.kaynak === k));
}
export function basSatiriEkle(t: FormatTanimi, kaynak: BasKaynagi, ad?: string): { t: FormatTanimi; id: string | null } {
  if (!eksikBasKaynaklari(t).includes(kaynak)) return { t, id: null };
  const y = basYaz(t, [...basSatirlari(t), { ad: (ad ?? BAS_KAYNAK_ADI[kaynak]).trim() || BAS_KAYNAK_ADI[kaynak], kaynak }]);
  return { t: y, id: y.gorunum.basSatirlar?.at(-1)?.id ?? null };
}
export function basSatiriYaz(t: FormatTanimi, id: string, y: { ad?: string; metin?: string }): FormatTanimi {
  const l = basSatirlari(t);
  if (!l.some((s) => s.id === id)) return t;
  return basYaz(t, l.map((s) => (s.id === id ? { ...s, ...(y.ad !== undefined && y.ad.trim() ? { ad: y.ad } : {}), ...(y.metin !== undefined ? { metin: y.metin } : {}) } : s)));
}
export function basSatiriSil(t: FormatTanimi, id: string): FormatTanimi {
  const l = basSatirlari(t);
  return l.length <= 1 || !l.some((s) => s.id === id) ? t : basYaz(t, l.filter((s) => s.id !== id));
}
export function basSatiriTasi(t: FormatTanimi, id: string, yon: -1 | 1): FormatTanimi {
  const l = basSatirlari(t), j = l.findIndex((s) => s.id === id);
  return j < 0 || j + yon < 0 || j + yon >= l.length ? t : basYaz(t, tasi(l, j, j + yon));
}
/** hücrenin yeri: bir sola / sağa (bugünkü sıra yazılmaz) */
export function basHucreTasi(t: FormatTanimi, h: BasHucresi, yon: -1 | 1): FormatTanimi {
  const l = basSirasi(t), j = l.indexOf(h);
  if (j < 0 || j + yon < 0 || j + yon >= l.length) return t;
  const yeni = tasi(l, j, j + yon), g = { ...t.gorunum };
  if (yeni.every((x, k) => x === BAS_HUCRELERI[k])) delete g.basSira; else g.basSira = yeni;
  return { ...t, gorunum: g };
}
