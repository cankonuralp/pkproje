/* S.A.Y RAPORA GİRER — saf kurallar (542; sunum 541 onaylı — reisim 2026-10-14: "oku tuşu olmayacak say asistandan gir ve fotoğrafı okuyup ilgili
   yerlere girişleri yap diyeceğim ve yapacak", "maketleri falan da onaylıyorum"). Ekran (SahaRaporu) ve S.A.Y aynı işlevleri kullanır:
   · K1 emin olunmayan değer de girilir, SARI işaretlenir (emin olunan yeşil); kişi o alana yazınca işaret kalkar.
   · K2 dolu alanın üstüne yazılmaz: dolu kalanlar sayılır, S.A.Y "dolu alanları da değiştireyim mi?" der; "üstüne yaz" aynı okunanları yazar.
     Tablo satırları boş satıra / tablonun sonuna (foto-eslestir.ts ile aynı yer) — elle yazılan hücre ezilmez.
   · K3 raporun OKUNMAMIŞ okuma fotoğrafları, her biri eklendiği bölüme (okunan fotoğraf okuma kaydından bilinir — göç 0089).
   · K4 "bütün maddeleri uygun işaretle" (boş maddeler, cevap setinin ilk seçeneği) ve "sonucu uygun / uygun değil yap".
   · Geri al: S.A.Y'ın girdiği her değer önceki hâline döner (sonradan kişinin değiştirdiği alana dokunulmaz).
   · S.A.Y Chat'ten açılan raporun bekleyen okumaları (rapor_oneri) da aynı yoldan, açılışta boş alanlara girer (öneri kartı kalktı).
   Kaydetmek kişide: girilenler ekranda kalır, Kaydet'le rapora yazılır.
   550 (sunum 546 K6 — reisim 2026-10-14: "S.A.Y. de herhangi bir kısıt kural vb olmasını istemiyorum oradan direk haiku ile konuşmak aynı claude
   kullanır gibi"): S.A.Y (Haiku) "rapora_yaz" aracıyla İSTEDİĞİNİZ cümleden girişleri verir — komutlariUygula: yer kimliği raporun haritasından
   (say/rapor-haritasi.ts), değer alanın türüne göre denetlenir; kişi istediği için DOLU ALANA DA yazılır; işaret ve Geri al aynı.
   557 (sunum 557 · 2. tur — reisim 2026-10-14: "el ile girebildiğim değerleri say asistan ile giremiyor", "komut gelsin, yapılsın, doğruluğunu teyit
   et, yapıldıysa yapıldı de, yapılamadıysa sebebi ile yaz"): S.A.Y ELLE NE GİRİLİYORSA onu girer, ekrandaki denetimle (fotoğraf okumanın sıkı
   denetimiyle değil) — sayı kutusuna sayı olmayan yazı ("-"), künye (kilitli olmayan), kontrol tarihleri, çoklu seçim, uygunluk notu, satır sonucu
   ve gerekçesi, satır silme, ölçüm cihazı; her giriş için sonuç (yazıldı · zaten öyleydi · yazılamadı + neden) — S.A.Y cevabını bununla yazar.
   2026-10-15 (pkproje §9 "S.A.Y CLAUDE GİBİ" — reisim: "saçma sapan sınırlar koyma"; "aynı tabloya 50 satır ekle" 17'de kalıyordu): (B) tek çağrıda
   giriş ve tabloda yeni satır sınırı işe engel olmayacak kadar büyük; (C) satir_ekle — bir tabloya tek komutla N satır: her satıra aynı değerler,
   artan sıra sütunu (No: 1, 2, 3 …; başlangıç verilmezse sütundaki son sayıdan), her hücre elle yazılır gibi denetlenir; sonuç "N satır eklendi"
   + yazılamayanlar sütun başına nedeniyle; bütün iş tablonun tek geri alması.
   2026-10-16 (S.A.Y 1. adım incelemesi): tablonun satırı raporun kendi sınırında (format/tanim.ts TABLO_SATIR_EN_COK — 300'ün üstündeki rapor
   kaydedilemiyordu); toplu Geri al tablo için geri dönen hücreleri sayar. */
import type { SatirEkle } from "../../server/yz/say.ts";
import { alanDegeri, type OkunacakAlan } from "../../format/deger.ts";
import { ELLE_GEREKCE, ELLE_SONUC } from "../../format/motor.ts";
import { KUNYE_ALAN_ADI, KUNYE_ALANLARI, KUNYE_EN_COK, TABLO_SATIR_EN_COK, doldurma, ekAnahtari, type RaporSonucu, type BolumOf, type Cevaplar, type FormatTanimi, type KunyeAlani } from "../../format/tanim.ts";
import { doluSatir, okunanHedefleri, type Satir } from "./foto-eslestir.ts";
import { bilgiAlanlari, ekipmanAlanlari, ekipmanAnahtari, testAlanlari } from "./doldur.ts";

export type Guven = "emin" | "belirsiz";
/** ekrandaki yeri: ekipman bilgisi · bilgi alanı · test değeri · tablo hücresi · madde · sonuç */
export type Yer =
  | { tur: "ekipman"; id: string } | { tur: "alan"; id: string } | { tur: "deger"; id: string }
  | { tur: "hucre"; bolum: string; satir: number; sutun: string } | { tur: "madde"; id: string } | { tur: "sonuc" }
  /* 550: maddenin kusur açıklaması ve derecesi, uzman yorumu */
  | { tur: "madde_not"; id: string } | { tur: "derece"; id: string } | { tur: "yorum" }
  /* 557: künye bilgisi, kontrol tarihi, çoklu seçim alanı (değerleri satır satır) */
  | { tur: "kunye"; id: KunyeAlani } | { tur: "tarih"; id: TarihAnahtari } | { tur: "coklu"; id: string }
  /* 595 (madde 6, 7): kontrol listesi / test bölümünün ek sütunu (id = ekAnahtari(öğe, sütun)) */
  | { tur: "ek"; id: string };
/** 557: raporun kontrol tarihleri (başlangıç / bitiş YYYY-AA-GGTSS:DD; ötekiler YYYY-AA-GG; boş "") */
export const TARIH_ANAHTARLARI = ["bas", "bit", "sonraki", "takip", "rapor"] as const;
export type TarihAnahtari = (typeof TARIH_ANAHTARLARI)[number];
export const TARIH_ADI: Record<TarihAnahtari, string> = {
  bas: "Periyodik kontrol başlangıç tarihi ve saati", bit: "Bitiş tarihi ve saati", sonraki: "Bir sonraki periyodik kontrol tarihi",
  takip: "Takip kontrol tarihi", rapor: "Rapor tarihi",
};
export interface Isaret { yer: Yer; guven: Guven }
/** ekranın doldurulan hâli: ekipman bilgisi (2. bölümün kayda bağlı alanları) ve cevaplar */
export interface Durum { ekipman: Readonly<Record<string, string>>; cevaplar: Cevaplar; tarih?: Readonly<Partial<Record<TarihAnahtari, string>>> }
/** okunan değer (alanlı bölüm) — server/yz/alanlar.ts AlanOkunan ile aynı biçim */
export interface OkunanAlan { alan: string; deger: string; guven: "yuksek" | "dusuk" | string }
/** okunan satır (tablo) — server/yz/okuma.ts OkunanSatir ile aynı biçim */
export interface OkunanTabloSatiri { degerler: Record<string, string>; guven: "yuksek" | "dusuk" | string }

/** bir girişin geri alma bilgisi: yer + önceki değer (tablo: girişten önceki bütün tablo) */
export type Geri = { yer: Exclude<Yer, { tur: "hucre" }>; onceki: string; yeni: string } | { tablo: string; onceki: Satir[]; yeni: Satir[] };

export interface Uygulama {
  durum: Durum;
  /** girilen değerler (işaret için) */
  isaretler: Isaret[];
  /** dolu olduğu için yazılmayan alanlar (adlarıyla — S.A.Y söyler) */
  dolu: { alan: string; deger: string; guven: string }[];
  geri: Geri[];
}

const bos = (x: unknown) => (typeof x === "string" ? !x.trim() : Array.isArray(x) ? !x.length : x === undefined || x === null);
const guvenOf = (g: string): Guven => (g === "dusuk" ? "belirsiz" : "emin");

/** okunan değerin raporda nereye yazıldığı: 2. bölümün ekipman alanı, test değeri (bölüm test ise) ya da bilgi alanı */
export type AlanHedefi = "ekipman" | "bilgi" | "test";
function alanYeri(hedef: AlanHedefi, id: string): Exclude<Yer, { tur: "hucre" }> {
  if (hedef === "test") return { tur: "deger", id };
  if (hedef === "ekipman" && ekipmanAnahtari(id)) return { tur: "ekipman", id };
  return { tur: "alan", id };
}
function oku(d: Durum, y: Exclude<Yer, { tur: "hucre" }>): string {
  if (y.tur === "ekipman") return d.ekipman[y.id] ?? "";
  if (y.tur === "deger") return d.cevaplar.deger[y.id] ?? "";
  if (y.tur === "madde") return d.cevaplar.madde[y.id]?.c ?? "";
  if (y.tur === "sonuc") return d.cevaplar.sonuc;
  if (y.tur === "yorum") return d.cevaplar.yorum;
  if (y.tur === "madde_not") return d.cevaplar.madde[y.id]?.not ?? "";
  if (y.tur === "derece") return d.cevaplar.madde[y.id]?.derece ?? "";
  if (y.tur === "kunye") return d.cevaplar.kunye[y.id] ?? "\u0000";                  // anahtar yok: kayıttaki (geri alınca anahtar silinir)
  if (y.tur === "tarih") return d.tarih?.[y.id] ?? "";
  if (y.tur === "coklu") { const c = d.cevaplar.alan[y.id]; return Array.isArray(c) ? c.join("\n") : typeof c === "string" ? c : ""; }
  if (y.tur === "ek") return d.cevaplar.ek[y.id] ?? "";
  const v = d.cevaplar.alan[y.id];
  return typeof v === "string" ? v : "";
}
function yaz(d: Durum, y: Exclude<Yer, { tur: "hucre" }>, x: string): Durum {
  if (y.tur === "ekipman") return { ...d, ekipman: { ...d.ekipman, [y.id]: x } };
  if (y.tur === "deger") return { ...d, cevaplar: { ...d.cevaplar, deger: { ...d.cevaplar.deger, [y.id]: x } } };
  if (y.tur === "madde") {
    const m = { ...d.cevaplar.madde };
    if (x) m[y.id] = { ...(m[y.id] ?? {}), c: x }; else delete m[y.id];
    return { ...d, cevaplar: { ...d.cevaplar, madde: m } };
  }
  if (y.tur === "sonuc") return { ...d, cevaplar: { ...d.cevaplar, sonuc: x as Cevaplar["sonuc"] } };
  if (y.tur === "yorum") return { ...d, cevaplar: { ...d.cevaplar, yorum: x } };
  if (y.tur === "madde_not" || y.tur === "derece") {
    const m = { ...d.cevaplar.madde }, o = m[y.id];
    if (!o) return d;                                                     // cevapsız maddeye açıklama / derece yazılmaz (önce cevap)
    const yeni = { ...o };
    if (y.tur === "madde_not") { if (x) yeni.not = x; else delete yeni.not; }
    else if (x === "hafif" || x === "agir") yeni.derece = x;
    else delete yeni.derece;
    m[y.id] = yeni;
    return { ...d, cevaplar: { ...d.cevaplar, madde: m } };
  }
  /* 557: künyede boş anahtar "kayıttaki" demek (ekrandaki kunyeYaz) — kayıtla aynısı komutlariUygula'da düşer */
  if (y.tur === "kunye") {
    const k = { ...d.cevaplar.kunye };
    if (x === "\u0000") delete k[y.id]; else k[y.id] = x;
    return { ...d, cevaplar: { ...d.cevaplar, kunye: k } };
  }
  if (y.tur === "tarih") return { ...d, tarih: { ...(d.tarih ?? {}), [y.id]: x } };
  if (y.tur === "coklu") return { ...d, cevaplar: { ...d.cevaplar, alan: { ...d.cevaplar.alan, [y.id]: x ? x.split("\n") : [] } } };
  if (y.tur === "ek") { const e = { ...d.cevaplar.ek }; if (x) e[y.id] = x; else delete e[y.id]; return { ...d, cevaplar: { ...d.cevaplar, ek: e } }; }
  return { ...d, cevaplar: { ...d.cevaplar, alan: { ...d.cevaplar.alan, [y.id]: x } } };
}

/** yerin ŞU ANKİ değeri (işaret, değer kişi tarafından değişince kalkar) */
export function yerDegeri(d: Durum, y: Yer): string {
  return y.tur === "hucre" ? d.cevaplar.tablo[y.bolum]?.[y.satir]?.[y.sutun] ?? "" : oku(d, y);
}

/** okunacak bölüm: alanlı (ekipman bilgileri "ekipman", bilgi, test) ya da tablo; adlar: okunan alanın ekrandaki adı (izinli alanlar da bunlar) */
export interface OkumaHedefi { bolum: string; ad: string; tur: "alan" | "tablo"; hedef: AlanHedefi; adlar: ReadonlyMap<string, string>; tablo: BolumOf<"olcum"> | null }
/** formatta fotoğraftan doldurması açık bölümler — sunucunun okuyabildiği bölümlerle aynı (alanOkunabilir / okunabilirOlcum) */
export function okumaHedefleri(t: FormatTanimi): Map<string, OkumaHedefi> {
  const m = new Map<string, OkumaHedefi>();
  const e = ekipmanAlanlari(t);
  if (e.alanlar.length && (!e.tam || doldurma(e.tam).foto)) {
    m.set("ekipman", { bolum: "ekipman", ad: e.baslik, tur: "alan", hedef: "ekipman", adlar: new Map(e.alanlar.map((a) => [a.id, a.ad])), tablo: null });
  }
  for (const b of t.bolumler) {
    if (!doldurma(b).foto) continue;
    if (b.blok === "olcum") m.set(b.id, { bolum: b.id, ad: b.ad, tur: "tablo", hedef: "bilgi", adlar: new Map(b.sutunlar.map((c) => [c.id, c.ad])), tablo: b });
    else if (b.blok === "test") m.set(b.id, { bolum: b.id, ad: b.ad, tur: "alan", hedef: "test", adlar: new Map(testAlanlari(b).map((a) => [a.id, a.ad])), tablo: null });
    else if (b.blok === "bilgi" && !b.tam) m.set(b.id, { bolum: b.id, ad: b.ad, tur: "alan", hedef: "bilgi", adlar: new Map(bilgiAlanlari(b).map((a) => [a.id, a.ad])), tablo: null });
  }
  return m;
}

/** alanlı bölümün okunanları: boş alana yazılır (ustune: dolu alana da — değeri aynıysa dokunulmaz); izinli: bölümün ekranda satırı olan alanları */
export function alanlariUygula(d: Durum, hedef: AlanHedefi, okunan: readonly OkunanAlan[], izinli: { has: (id: string) => boolean }, ustune = false): Uygulama {
  let durum = d;
  const isaretler: Isaret[] = [], dolu: Uygulama["dolu"] = [], geri: Geri[] = [];
  for (const o of okunan) {
    if (!o || typeof o.alan !== "string" || typeof o.deger !== "string" || !o.deger.trim() || !izinli.has(o.alan)) continue;
    const yer = alanYeri(hedef, o.alan), onceki = oku(durum, yer);
    if (onceki === o.deger) continue;
    if (!bos(onceki) && !ustune) { dolu.push({ alan: o.alan, deger: o.deger, guven: o.guven }); continue; }
    durum = yaz(durum, yer, o.deger);
    isaretler.push({ yer, guven: guvenOf(o.guven) });
    geri.push({ yer, onceki, yeni: o.deger });
  }
  return { durum, isaretler, dolu, geri };
}

/** tablonun okunanları: değeri boş var olan satıra (yalnız boş hücrelerine) ya da tablonun sonuna — foto-eslestir.ts ile aynı yer; elle yazılan
    hücre ezilmez, dolu sayılmaz (tabloda "üstüne yaz" yok) */
export function tabloyaUygula(d: Durum, b: Pick<BolumOf<"olcum">, "id" | "sutunlar">, okunan: readonly OkunanTabloSatiri[]): Uygulama {
  const sutun = new Set(b.sutunlar.map((s) => s.id));
  const temiz = okunan.map((o) => ({ degerler: Object.fromEntries(Object.entries(o?.degerler ?? {}).filter(([k, v]) => sutun.has(k) && typeof v === "string" && v.trim())),
    guven: guvenOf(o?.guven ?? "") })).filter((o) => Object.keys(o.degerler).length);
  const onceki = (d.cevaplar.tablo[b.id] ?? []).map((s) => ({ ...s }));
  if (!temiz.length) return { durum: d, isaretler: [], dolu: [], geri: [] };
  const hedef = okunanHedefleri(onceki, temiz);
  const tablo = onceki.map((s) => ({ ...s })), yazilan = tablo.map(() => [] as { sutun: string; guven: Guven }[]);
  const yeni: { s: Satir; g: Guven }[] = [];
  temiz.forEach((o, i) => {
    const h = hedef[i], t = h === null || h === undefined ? undefined : tablo[h];
    if (!t || h === null || h === undefined) { yeni.push({ s: { ...o.degerler }, g: o.guven }); return; }
    for (const [c, v] of Object.entries(o.degerler)) if (bos(t[c])) { t[c] = v; yazilan[h].push({ sutun: c, guven: o.guven }); }
  });
  /* boş satırlar düşer (foto-eslestir okunanlariUygula ile aynı); işaretlerin satır sırası son tabloya göre */
  const kalan: Satir[] = [], isaretler: Isaret[] = [];
  tablo.forEach((s, j) => {
    if (!doluSatir(s)) return;
    for (const w of yazilan[j]) isaretler.push({ yer: { tur: "hucre", bolum: b.id, satir: kalan.length, sutun: w.sutun }, guven: w.guven });
    kalan.push(s);
  });
  for (const y of yeni) {
    for (const c of Object.keys(y.s)) isaretler.push({ yer: { tur: "hucre", bolum: b.id, satir: kalan.length, sutun: c }, guven: y.g });
    kalan.push(y.s);
  }
  if (!isaretler.length) return { durum: d, isaretler: [], dolu: [], geri: [] };
  return { durum: { ...d, cevaplar: { ...d.cevaplar, tablo: { ...d.cevaplar.tablo, [b.id]: kalan } } }, isaretler, dolu: [], geri: [{ tablo: b.id, onceki, yeni: kalan }] };
}

/** K4: formatın kontrol listelerinde CEVAPSIZ maddeler cevap setinin ilk seçeneğiyle ("Uygun") işaretlenir; cevaplanmış madde değişmez */
export function maddeleriIsaretle(d: Durum, t: Pick<FormatTanimi, "bolumler">): Uygulama {
  let durum = d;
  const isaretler: Isaret[] = [], geri: Geri[] = [];
  for (const b of t.bolumler) {
    if (b.blok !== "liste" || !b.cevaplar.length) continue;
    for (const g of b.gruplar) for (const m of g.maddeler) {
      const yer = { tur: "madde" as const, id: m.id }, onceki = oku(durum, yer);
      if (onceki) continue;
      durum = yaz(durum, yer, b.cevaplar[0]);
      isaretler.push({ yer, guven: "emin" });
      geri.push({ yer, onceki, yeni: b.cevaplar[0] });
    }
  }
  return { durum, isaretler, dolu: [], geri };
}

/** K4: sonuç (formatta sonuç bölümü varsa) */
export function sonucuYap(d: Durum, x: RaporSonucu): Uygulama {
  const yer = { tur: "sonuc" as const }, onceki = d.cevaplar.sonuc;
  if (onceki === x) return { durum: d, isaretler: [], dolu: [], geri: [] };
  return { durum: yaz(d, yer, x), isaretler: [{ yer, guven: "emin" }], dolu: [], geri: [{ yer, onceki, yeni: x }] };
}

/** tablonun iki hâli arasındaki giriş farkı (2026-10-16 — toplu Geri al 50 satırı "1 giriş" sayıyordu): ortak satırlarda değişen hücreler, eklenen /
    çıkan satırda dolu hücreler (boş satır 1) */
function tabloFarki(a: readonly Satir[], b: readonly Satir[]): number {
  let n = 0;
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const x = a[i], y = b[i];
    if (!x || !y) { const s = x ?? y ?? {}; n += Math.max(1, Object.values(s).filter((v) => v !== "").length); continue; }
    for (const k of new Set([...Object.keys(x), ...Object.keys(y)])) if ((x[k] ?? "") !== (y[k] ?? "")) n++;
  }
  return n;
}
/** geri al: S.A.Y'ın girdiği değer hâlâ duruyorsa önceki hâline döner (kişi sonradan değiştirdiyse dokunulmaz); dönen: geri alınan giriş sayısı
    (tablo: geri dönen hücreler — tabloFarki; tablo farklıysa en az 1) */
export function geriAl(d: Durum, l: readonly Geri[]): { durum: Durum; sayi: number } {
  let durum = d, sayi = 0;
  for (const g of [...l].reverse()) {
    if ("tablo" in g) {
      const simdi = durum.cevaplar.tablo[g.tablo] ?? [];
      if (JSON.stringify(simdi) !== JSON.stringify(g.yeni)) continue;
      durum = { ...durum, cevaplar: { ...durum.cevaplar, tablo: { ...durum.cevaplar.tablo, [g.tablo]: g.onceki } } };
      sayi += Math.max(1, tabloFarki(g.yeni, g.onceki));
      continue;
    }
    if (oku(durum, g.yer) !== g.yeni) continue;
    durum = yaz(durum, g.yer, g.onceki);
    sayi++;
  }
  return { durum, sayi };
}

/* ── 550 → 557 S.A.Y'IN İSTENEN GİRİŞLERİ ("rapora_yaz" aracı) — elle ne giriliyorsa, ekranın denetimiyle ── */
/** Haiku'nun verdiği giriş: yer kimliği (raporun haritasındaki) + değer */
export interface RaporGirisi { yer: string; deger: string }
/** tek istekte en çok giriş. 2026-10-15 (B — reisim "saçma sapan sınırlar koyma"): 300 → 5 000 — işe engel değil, yalnız bozuk girişe karşı
    koruma. GIRIS_EN_COK sunucudaki KOMUT_GIRIS_EN_COK ile aynı (src/server/yz/say.ts — testle kilitli) */
export const GIRIS_EN_COK = 5_000;
/** C: satir_ekle — tek kalemde en çok satır. 2026-10-16 (S.A.Y 1. adım incelemesi): tablonun satırı S.A.Y'a özgü bir sınırla değil, RAPORUN kendi
    sınırıyla (format/tanim.ts TABLO_SATIR_EN_COK — Cevaplar.tablo): 5 000'e kadar satır açılabiliyordu, 300'ün üstündeki rapor kaydedilemiyor ve
    S.A.Y'ın haritası kurulamıyordu. Hücre adresleri (t:<tablo>:<satır>) ve satir_ekle bu sınırın içinde kalır; aşan iş nedeniyle "yazılamadı"
    döner, tabloya yarım yazılmaz. Sunucudaki SATIR_EKLE_EN_COK aynı (testle kilitli) */
export const SATIR_EKLE_EN_COK = TABLO_SATIR_EN_COK;
const TABLO_DOLU = `tabloda en çok ${TABLO_SATIR_EN_COK} satır olur (raporun sınırı)`;
/** 557: sahadaki kutuların en çok uzunluğu — rapor ekranındakiyle aynı (ui/Bloklar.tsx, ui/SahaRaporu.tsx) */
export const ELLE_EN_COK = { bilgiSayi: 20, bilgiMetin: 500, hucreSayi: 12, hucreMetin: 120, degerSayi: 12, degerMetin: 60, gerekce: 200, maddeNot: 1000, yorum: 4000 } as const;
/** 557: girişin sonucu — S.A.Y cevabını bununla yazar (yazılmadan "yaptım" demez) */
export interface GirisSonucu { yer: string; ad: string; durum: "yazildi" | "ayni" | "yazilamadi" | "bekliyor"; neden?: string }
/** 557: ölçüm cihazı seçimi (sunucu işlemi — ekran yapar, sonucu sonra yazar) */
export interface CihazIstegi { yer: string; ad: string; turId: string; cihazId: string | null }
/** 557: elle yapılabilen ama tanımdan bilinmeyenler — künye kilidi ve kayıttaki künye, ölçüm cihazı satırları */
export interface KomutEki {
  kunyeKilit?: ReadonlySet<KunyeAlani>;
  kunyeKayit?: Readonly<Partial<Record<KunyeAlani, string | null>>>;
  cihazlar?: readonly { turId: string; turAd: string; secili: string | null; secenekler: readonly { id: string; kod: string; ad: string }[] }[];
}
const kucukTr = (s: string) => s.toLocaleLowerCase("tr").replace(/\s+/g, " ").trim();
const temizle = (s: string) => s.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").trim();
const sayiNormal = (s: string): string | null => {
  const n = Number(s.replace(/\s/g, "").replace(",", "."));
  return /^[-+]?\d+([.,]\d+)?$/.test(s.replace(/\s/g, "")) && Number.isFinite(n) ? String(Math.round(n * 1e6) / 1e6).replace(".", ",") : null;
};
/** 557: sayı kutusu — elle her yazı yazılır (ekranda sayı denetimi yok); sayıysa virgüllü biçime, değilse yazıldığı gibi ("-", "<0,1") */
const sayiKutusu = (ham: string, en: number): { v: string } | { neden: string } => {
  const d = temizle(ham);
  const n = sayiNormal(d);
  if (n !== null) return { v: n };
  return d.length <= en ? { v: d } : { neden: `bu kutuya en çok ${en} karakter yazılır` };
};
const metinKutusu = (ham: string, en: number): { v: string } | { neden: string } => {
  const d = temizle(ham).replace(/\s+/g, " ");
  return d.length <= en ? { v: d } : { neden: `bu kutuya en çok ${en} karakter yazılır` };
};
export const secimKutusu = (ham: string, secenekler: readonly string[]): { v: string } | { neden: string } => {
  const d = temizle(ham);
  /* 2026-10-31 (kalem 6 — E9): önce birebir; değilse boşluk ve Türkçe büyük-küçük harf eşitlenir ("Uygun" → "Uygun "); eşitlenince birden çok seçenek
     aynı oluyorsa hangisi olduğu belli değil — yazılmaz */
  const birebir = secenekler.find((x) => x === d);
  if (birebir !== undefined) return { v: birebir };
  const l = secenekler.filter((x) => kucukTr(x) === kucukTr(d));
  return l.length === 1 ? { v: l[0]! } : l.length > 1 ? { neden: `"${d}" birden çok seçeneğe uyuyor (${l.map((x) => `"${x}"`).join(", ")}); seçeneği listedeki gibi yaz` }
    : { neden: `yalnız şunlar seçilebilir: ${secenekler.join(", ")}` };
};
const EVET_HAYIR: readonly (readonly [string, string])[] = [["evet", "evet"], ["var", "evet"], ["hayır", "hayir"], ["hayir", "hayir"], ["yok", "hayir"]];
const evetKutusu = (ham: string): { v: string } | { neden: string } => {
  const x = EVET_HAYIR.find(([k]) => k === kucukTr(ham));
  return x ? { v: x[1] } : { neden: "yalnız evet ya da hayır seçilebilir" };
};
/** tarih: GG.AA.YYYY ya da YYYY-AA-GG (saatli: "GG.AA.YYYY SS:DD") → saklanan biçim */
function tarihOku(ham: string, saatli: boolean): string | null {
  const d = temizle(ham).replace("T", " ");
  const m = /^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/.exec(d) ?? null;
  const i = m ? null : /^(\d{4})-(\d{2})-(\d{2})(?:\s+(\d{1,2}):(\d{2}))?$/.exec(d);
  const p = m ? { y: m[3], a: m[2], g: m[1], s: m[4], dk: m[5] } : i ? { y: i[1], a: i[2], g: i[3], s: i[4], dk: i[5] } : null;
  if (!p) return null;
  const gun = new Date(Date.UTC(Number(p.y), Number(p.a) - 1, Number(p.g)));
  if (gun.getUTCFullYear() !== Number(p.y) || gun.getUTCMonth() !== Number(p.a) - 1 || gun.getUTCDate() !== Number(p.g)) return null;
  const iso = `${p.y}-${p.a.padStart(2, "0")}-${p.g.padStart(2, "0")}`;
  if (!saatli) return p.s ? null : iso;
  if (!p.s) return null;
  const s = Number(p.s), dk = Number(p.dk);
  return s <= 23 && dk <= 59 ? `${iso}T${String(s).padStart(2, "0")}:${p.dk}` : null;
}
const tarihYazimi = (x: string) => (x ? `${x.slice(8, 10)}.${x.slice(5, 7)}.${x.slice(0, 4)}${x.length > 10 ? ` ${x.slice(11, 16)}` : ""}` : "");

type Kutu = { ad: string; yer: Exclude<Yer, { tur: "hucre" }>; denetle: (ham: string) => { v: string } | { neden: string } };

/** tablo hücresine yazılacak değer — elle yazılır gibi denetlenir (sütun türü, seçenek; uygunluk notu; satır sonucu ve gerekçesi). alan: sütun
    kimliği ya da not / sonuc / gerekce. Dönen: satırdaki anahtar + değer, ya da nedeni (adi: hücrenin okunur adı) */
function hucreDenetle(b: BolumOf<"olcum">, alan: string, ham: string): { anahtar: string; adi: string; sutun: boolean; v: string } | { adi: string; neden: string } {
  const notlar = b.notlar ?? [];
  const anahtar = alan === "sonuc" ? ELLE_SONUC : alan === "gerekce" ? ELLE_GEREKCE : alan;
  const sutun = b.sutunlar.find((s) => s.id === anahtar);
  const adi = sutun ? sutun.ad : anahtar === "not" ? "uygunluk notu" : anahtar === ELLE_SONUC ? "sonuç" : anahtar === ELLE_GEREKCE ? "sonucun gerekçesi" : alan;
  let r: { v: string } | { neden: string };
  if (sutun) {
    r = !temizle(ham) ? { v: "" } : sutun.giris === "sayi" ? sayiKutusu(ham, ELLE_EN_COK.hucreSayi) : sutun.giris === "secim" ? secimKutusu(ham, sutun.secenekler ?? [])
      : sutun.giris === "evet" ? evetKutusu(ham) : metinKutusu(ham, ELLE_EN_COK.hucreMetin);
  } else if (anahtar === "not") {
    if (!notlar.length) return { adi, neden: "bu tabloda uygunluk notu yok" };
    const n = Number(temizle(ham).replace(/^not\s*-?\s*/i, ""));
    r = !temizle(ham) ? { v: "" } : Number.isInteger(n) && n >= 1 && n <= notlar.length ? { v: String(n) } : { neden: `Not-1 ile Not-${notlar.length} arası olmalı` };
  } else if (anahtar === ELLE_SONUC) {
    if (notlar.length) return { adi, neden: "bu tabloda sonuç uygunluk notundan çıkar; elle de değiştirilemiyor" };
    const x = kucukTr(ham).replace(/[_-]/g, " ");
    r = !x || /kural/.test(x) ? { v: "" } : /uygun ?(değil|degil)|uygunsuz/.test(x) ? { v: "uygun_degil" } : /^uygun$/.test(x) ? { v: "uygun" } : { neden: "uygun, uygun değil ya da kurala göre olmalı" };
  } else if (anahtar === ELLE_GEREKCE) {
    if (notlar.length) return { adi, neden: "bu tabloda sonuç uygunluk notundan çıkar" };
    r = metinKutusu(ham, ELLE_EN_COK.gerekce);
  } else return { adi, neden: "tabloda böyle bir sütun yok" };
  return "neden" in r ? { adi, neden: r.neden } : { anahtar, adi, sutun: !!sutun, v: r.v };
}

/** girişleri uygular — elle yapılabilen her şey, ekranın denetimiyle; her giriş için sonuç (yazıldı · zaten öyleydi · yazılamadı + neden ·
    cihaz: ekranda bekliyor). Kişi istediği için dolu alana da yazılır. C: satirlar (satir_ekle) girişlerden sonra tablonun sonuna. Satır silme
    yazmalardan sonra (büyük satırdan küçüğe). satir: tablolara eklenen satır sayısı (net). */
export function komutlariUygula(d: Durum, t: FormatTanimi, girisler: readonly RaporGirisi[], ek: KomutEki = {}, satirlar: readonly SatirEkle[] = []):
  Uygulama & { gecersiz: string[]; sonuclar: GirisSonucu[]; cihaz: CihazIstegi[]; satir: number } {
  const kutular = new Map<string, Kutu>();
  const alanKutusu = (a: Pick<OkunacakAlan, "tur" | "uzun" | "secenekler">, en: { sayi: number; metin: number }): Kutu["denetle"] => (ham) =>
    a.tur === "sayi" ? sayiKutusu(ham, en.sayi) : a.tur === "secim" ? secimKutusu(ham, a.secenekler ?? []) : a.tur === "evet" ? evetKutusu(ham)
      : a.tur === "tarih" ? ((v) => (v ? { v } : { neden: "tarih GG.AA.YYYY biçiminde olmalı" }))(tarihOku(ham, false))
      : a.tur === "yil" ? ((v) => (v !== null ? { v } : { neden: "yıl 4 haneli olmalı (ör. 2019)" }))(alanDegeri(a, ham, new Date()))
      : metinKutusu(ham, a.uzun ?? en.metin);
  /* 556: formüllü kutular da (sahada elle yazılır — yazılan kalır, boşaltılınca formülden) */
  const ekipman = ekipmanAlanlari(t, true);
  for (const a of ekipman.alanlar) {
    kutular.set(`e:${a.id}`, { ad: `${ekipman.baslik} · ${a.ad}`, yer: ekipmanAnahtari(a.id) ? { tur: "ekipman", id: a.id } : { tur: "alan", id: a.id },
      denetle: alanKutusu(a, { sayi: ELLE_EN_COK.bilgiSayi, metin: ELLE_EN_COK.bilgiMetin }) });
  }
  const tablolar = new Map<string, BolumOf<"olcum">>(), maddeler = new Map<string, { cevaplar: readonly string[]; ad: string; formul: boolean }>();
  let sonucVar = false, notVar = false, sartliVar = false;
  for (const b of t.bolumler) {
    if (b.blok === "bilgi" && b.id !== ekipman.tam?.id) {
      for (const a of bilgiAlanlari(b, true)) {
        const k = ekipmanAnahtari(a.id) ? `e:${a.id}` : `a:${a.id}`;
        kutular.set(k, { ad: `${b.ad} · ${a.ad}`, yer: ekipmanAnahtari(a.id) ? { tur: "ekipman", id: a.id } : { tur: "alan", id: a.id },
          denetle: alanKutusu(a, { sayi: ELLE_EN_COK.bilgiSayi, metin: ELLE_EN_COK.bilgiMetin }) });
      }
      /* 557: çoklu seçim — değerler virgülle; her biri seçeneklerden */
      for (const a of b.alanlar) {
        if (a.tur !== "coklu" || a.kaynak) continue;
        const sec = a.secenekler ?? [];
        kutular.set(`a:${a.id}`, { ad: `${b.ad} · ${a.ad}`, yer: { tur: "coklu", id: a.id }, denetle: (ham) => {
          const l = temizle(ham).split(/[,;\n]/).map((x) => x.trim()).filter(Boolean);
          const yok = l.filter((x) => !sec.some((s) => kucukTr(s) === kucukTr(x)));
          if (yok.length) return { neden: `${yok.join(", ")} seçeneklerde yok (seçenekler: ${sec.join(", ")})` };
          return { v: sec.filter((s) => l.some((x) => kucukTr(x) === kucukTr(s))).join("\n") };
        } });
      }
    } else if (b.blok === "test") {
      for (const a of testAlanlari(b, true)) kutular.set(`d:${a.id}`, { ad: `${b.ad} · ${a.ad}`, yer: { tur: "deger", id: a.id }, denetle: alanKutusu(a, { sayi: ELLE_EN_COK.degerSayi, metin: ELLE_EN_COK.degerMetin }) });
      /* 595 (madde 6): ek sütunlar — x:<değer>:<sütun> */
      for (const dg of b.degerler) for (const s of b.ekSutunlar ?? []) {
        kutular.set(`x:${dg.id}:${s.id}`, { ad: `${dg.ad} · ${s.ad}`, yer: { tur: "ek", id: ekAnahtari(dg.id, s.id) },
          denetle: (ham) => (s.alan === "sayi" ? sayiKutusu(ham, ELLE_EN_COK.degerSayi) : s.alan === "secim" ? secimKutusu(ham, s.secenekler ?? []) : metinKutusu(ham, 200)) });
      }
    } else if (b.blok === "olcum") tablolar.set(b.id, b);
    else if (b.blok === "liste") for (const g of b.gruplar) for (const m of g.maddeler) {
      maddeler.set(m.id, { cevaplar: b.cevaplar, ad: m.metin.slice(0, 80), formul: !!m.formul?.trim() });
      /* 595 (madde 7): serbest yazı sütunları — x:<madde>:<sütun> (açıklama sütunu m:<madde>#not) */
      for (const s of b.ekSutunlar ?? []) if (s.alan === "yazi") {
        kutular.set(`x:${m.id}:${s.id}`, { ad: `${m.metin.slice(0, 60)} · ${s.ad}`, yer: { tur: "ek", id: ekAnahtari(m.id, s.id) }, denetle: (ham) => metinKutusu(ham, 1000) });
      }
    }
    else if (b.blok === "sonuc") { sonucVar = true; if (b.sartli) sartliVar = true; }
    else if (b.blok === "not") notVar = true;
  }
  /* 557: künye (kilitli olan elle de değişmez) ve kontrol tarihleri */
  for (const a of KUNYE_ALANLARI) {
    kutular.set(`k:${a}`, { ad: KUNYE_ALAN_ADI[a], yer: { tur: "kunye", id: a }, denetle: (ham) => {
      if (ek.kunyeKilit?.has(a)) return { neden: "bu formatta kilitli; elle de değiştirilemiyor" };
      const r = metinKutusu(ham, KUNYE_EN_COK[a]);
      if ("v" in r && a === "firma" && !r.v) return { neden: "firma adı boş olamaz" };
      return r;
    } });
  }
  if (d.tarih) {
    for (const k of TARIH_ANAHTARLARI) {
      const saatli = k === "bas" || k === "bit";
      kutular.set(`tarih:${k}`, { ad: TARIH_ADI[k], yer: { tur: "tarih", id: k }, denetle: (ham) => {
        const v = tarihOku(ham, saatli);
        return v ? { v } : { neden: saatli ? "tarih ve saat GG.AA.YYYY SS:DD biçiminde olmalı" : "tarih GG.AA.YYYY biçiminde olmalı" };
      } });
    }
  }
  const cihazlar = new Map((ek.cihazlar ?? []).map((c) => [c.turId, c] as const));

  let durum = d;
  const isaretler: Isaret[] = [], geri: Geri[] = [], sonuclar: GirisSonucu[] = [], cihaz: CihazIstegi[] = [];
  const tabloOnce = new Map<string, Satir[]>(), tabloHucre = new Map<string, Set<string>>(), silinecek = new Map<string, Set<number>>();
  const tekYaz = (yer: Exclude<Yer, { tur: "hucre" }>, x: string, k: string, ad: string) => {
    const onceki = oku(durum, yer);
    if (onceki === x) { sonuclar.push({ yer: k, ad, durum: "ayni" }); return; }
    durum = yaz(durum, yer, x);
    /* teyit: yazılan yerden geri okunur */
    if (oku(durum, yer) !== x) { sonuclar.push({ yer: k, ad, durum: "yazilamadi", neden: "yazıldıktan sonra okunan değer farklı" }); return; }
    sonuclar.push({ yer: k, ad, durum: "yazildi" });
    isaretler.push({ yer, guven: "emin" });
    geri.push({ yer, onceki, yeni: x });
  };
  for (const g of girisler.slice(0, GIRIS_EN_COK)) {
    const yer = typeof g?.yer === "string" ? g.yer.trim() : "", ham = typeof g?.deger === "string" ? g.deger : "";
    if (!yer) continue;
    const red = (neden: string, ad = yer.slice(0, 60)) => { sonuclar.push({ yer: yer.slice(0, 80), ad, durum: "yazilamadi", neden }); };
    const kutu = kutular.get(yer);
    if (kutu) {
      if (!temizle(ham)) {                                                // boş değer: kutuyu boşalt (künye: kayıttakine döner)
        if (kutu.yer.tur === "kunye" && ek.kunyeKilit?.has(kutu.yer.id)) { red("bu formatta kilitli; elle de değiştirilemiyor", kutu.ad); continue; }
        if (kutu.yer.tur === "kunye" && kutu.yer.id === "firma") { tekYaz(kutu.yer, "\u0000", yer, kutu.ad); continue; }
        tekYaz(kutu.yer, kutu.yer.tur === "kunye" ? "\u0000" : "", yer, kutu.ad);
        continue;
      }
      const r = kutu.denetle(ham);
      if ("neden" in r) { red(r.neden, kutu.ad); continue; }
      /* künye: kayıttakiyle aynısı değişiklik sayılmaz (ekrandaki kunyeYaz) */
      const v = kutu.yer.tur === "kunye" && r.v === (ek.kunyeKayit?.[kutu.yer.id] ?? "") ? "\u0000" : r.v;
      if (kutu.yer.tur === "tarih" && kutu.yer.id === "bit" && v && durum.tarih?.bas && v < durum.tarih.bas) { red("bitiş başlangıçtan önce olamaz", kutu.ad); continue; }
      tekYaz(kutu.yer, v, yer, kutu.ad);
      continue;
    }
    /* 557: ölçüm cihazı — "cihaz:<tür>" = cihazın kodu (boş: kaldır); seçimi ekran yapar */
    const c = /^cihaz:(.+)$/.exec(yer);
    if (c) {
      const x = cihazlar.get(c[1]);
      if (!x) { red("raporda böyle bir ölçüm cihazı satırı yok"); continue; }
      const ad = `Ölçüm cihazı · ${x.turAd}`, h = kucukTr(ham);
      if (!h) { if (!x.secili) { sonuclar.push({ yer, ad, durum: "ayni" }); continue; } cihaz.push({ yer, ad, turId: x.turId, cihazId: null }); sonuclar.push({ yer, ad, durum: "bekliyor" }); continue; }
      const s = x.secenekler.find((o) => kucukTr(o.kod) === h || kucukTr(o.ad) === h || kucukTr(`${o.kod} · ${o.ad}`) === h);
      if (!s) { red(x.secenekler.length ? `zimmetinizde böyle bir cihaz yok (seçilebilir: ${x.secenekler.map((o) => o.kod).join(", ")})` : "zimmetinizde bu türde cihaz yok", ad); continue; }
      if (x.secili === s.id) { sonuclar.push({ yer, ad, durum: "ayni" }); continue; }
      cihaz.push({ yer, ad, turId: x.turId, cihazId: s.id }); sonuclar.push({ yer, ad, durum: "bekliyor" });
      continue;
    }
    /* tablo: hücre, uygunluk notu, satır sonucu ve gerekçesi; "t:<tablo>:<satır>" + "sil" satırı siler */
    const sil = /^t:([^:]+):(\d{1,4})$/.exec(yer);
    if (sil) {
      const b = tablolar.get(sil[1]), satir = Number(sil[2]) - 1;
      if (!b) { red("raporda böyle bir tablo yok"); continue; }
      const ad = `${b.ad} · ${satir + 1}. satır`;
      if (kucukTr(ham) !== "sil") { red("satır için yalnız \"sil\" yazılır", ad); continue; }
      if (satir < 0 || satir >= (durum.cevaplar.tablo[b.id] ?? []).length) { red("tabloda bu satır yok", ad); continue; }
      const s = silinecek.get(b.id) ?? new Set<number>(); s.add(satir); silinecek.set(b.id, s);
      sonuclar.push({ yer, ad, durum: "yazildi" });
      continue;
    }
    const h = /^t:([^:]+):(\d{1,4}):(.+)$/.exec(yer);
    if (h) {
      const b = tablolar.get(h[1]), satir = Number(h[2]) - 1;
      if (!b || satir < 0) { red("tabloda böyle bir yer yok"); continue; }
      const r = hucreDenetle(b, h[3], ham), ad = `${b.ad} · ${satir + 1}. satır · ${r.adi}`;
      if ("neden" in r) { red(r.neden, ad); continue; }
      const { v, anahtar } = r;
      /* 2026-10-15: yalnız değişen satır kopyalanır (çok girişte tablo her girişte baştan kopyalanmasın); önceki hâl tabloOnce'ta */
      const l = [...(durum.cevaplar.tablo[b.id] ?? [])];
      if (satir >= TABLO_SATIR_EN_COK) { red(TABLO_DOLU, ad); continue; }
      if (!tabloOnce.has(b.id)) tabloOnce.set(b.id, (durum.cevaplar.tablo[b.id] ?? []).map((s) => ({ ...s })));
      while (l.length <= satir) l.push({});
      if ((l[satir][anahtar] ?? "") === v) { sonuclar.push({ yer, ad, durum: "ayni" }); continue; }
      const yeni = { ...l[satir] };
      if (v) yeni[anahtar] = v; else delete yeni[anahtar];
      /* sonuç "kurala göre"ye dönünce gerekçe de kalkar (ekrandaki gibi) */
      if (anahtar === ELLE_SONUC && !v) delete yeni[ELLE_GEREKCE];
      l[satir] = yeni;
      durum = { ...durum, cevaplar: { ...durum.cevaplar, tablo: { ...durum.cevaplar.tablo, [b.id]: l } } };
      /* teyit */
      if ((durum.cevaplar.tablo[b.id]?.[satir]?.[anahtar] ?? "") !== v) { red("yazıldıktan sonra okunan değer farklı", ad); continue; }
      sonuclar.push({ yer, ad, durum: "yazildi" });
      if (r.sutun) { const k = tabloHucre.get(b.id) ?? new Set<string>(); k.add(`${satir}:${anahtar}`); tabloHucre.set(b.id, k); }
      continue;
    }
    const m = /^m:([^#]+)(?:#(not|derece))?$/.exec(yer);
    if (m) {
      const md = maddeler.get(m[1]);
      if (!md) { red("böyle bir madde yok"); continue; }
      /* 556: formüllü maddenin cevabı formülden — açıklama / derece cevabı yazılmadan da yazılır (ekrandaki gibi) */
      if (m[2] && md.formul && !durum.cevaplar.madde[m[1]]) durum = { ...durum, cevaplar: { ...durum.cevaplar, madde: { ...durum.cevaplar.madde, [m[1]]: { c: "" } } } };
      if (!m[2]) {
        const cv = temizle(ham) ? md.cevaplar.find((x) => kucukTr(x) === kucukTr(ham)) : "";
        if (cv === undefined) { red(`cevap şunlardan biri olmalı: ${md.cevaplar.join(", ")}`, md.ad); continue; }
        tekYaz({ tur: "madde", id: m[1] }, cv, yer, md.ad);
      } else if (m[2] === "derece") {
        const ad = `${md.ad} · kusur derecesi`, x = kucukTr(ham), v = !x ? "" : /^(ağır|agir)/.test(x) ? "agir" : /^hafif/.test(x) ? "hafif" : null;
        if (v === null) { red("derece hafif ya da ağır olmalı", ad); continue; }
        if (!durum.cevaplar.madde[m[1]]) { red("önce maddenin cevabı yazılmalı", ad); continue; }
        tekYaz({ tur: "derece", id: m[1] }, v, yer, ad);
      } else {
        const ad = `${md.ad} · kusur açıklaması`;
        if (!durum.cevaplar.madde[m[1]]) { red("önce maddenin cevabı yazılmalı", ad); continue; }
        const r = metinKutusu(ham, ELLE_EN_COK.maddeNot);
        if ("neden" in r) { red(r.neden, ad); continue; }
        tekYaz({ tur: "madde_not", id: m[1] }, r.v, yer, ad);
      }
      continue;
    }
    if (yer === "sonuc") {
      const x = kucukTr(ham).replace(/[_-]/g, " ");
      const v = !x ? "" : /uygun ?(değil|degil)|uygunsuz|olumsuz/.test(x) ? "uygun_degil" : /şartlı|sartli|koşullu/.test(x) ? "sartli"
        : /^(uygun|olumlu)$/.test(x) ? "uygun" : null;
      if (v === "sartli" && sonucVar && !sartliVar) { red("bu formatta “şartlı uygun” seçeneği yok", "Sonuç"); continue; }
      if (!sonucVar || v === null) { red(sonucVar ? `sonuç uygun${sartliVar ? ", şartlı uygun" : ""} ya da uygun değil olmalı` : "formatta sonuç yok", "Sonuç"); continue; }
      tekYaz({ tur: "sonuc" }, v, yer, "Sonuç");
      continue;
    }
    if (yer === "yorum") {
      if (!notVar) { red("formatta uzman yorumu yok", "Muayene uzmanının yorumu"); continue; }
      const r = metinKutusu(ham, ELLE_EN_COK.yorum);
      if ("neden" in r) { red(r.neden, "Muayene uzmanının yorumu"); continue; }
      tekYaz({ tur: "yorum" }, r.v, yer, "Muayene uzmanının yorumu");
      continue;
    }
    red("raporda böyle bir yer yok");
  }
  /* C (2026-10-15 — "aynı tabloya 50 satır ekle"): satir_ekle — tablonun sonuna `adet` satır; degerler her satıra, sira sütununa artan değer
     (önek + sayı; başlangıç verilmezse sütundaki son sayıdan devam). Her hücre elle yazılır gibi denetlenir: uymayan hücre boş kalır, nedeni sütun
     başına bir kez döner; satırlar yine eklenir (elle "Satır ekle" gibi). Bütün iş tablonun tek geri alması (aşağıda) */
  for (const s of satirlar) {
    const tablo = typeof s?.tablo === "string" ? s.tablo : "", yer = `satir_ekle:${tablo}`.slice(0, 80);
    const b = tablolar.get(tablo);
    if (!b) { sonuclar.push({ yer, ad: tablo.slice(0, 60) || "satir_ekle", durum: "yazilamadi", neden: "raporda böyle bir tablo yok" }); continue; }
    const adet = Number(s.adet);
    if (!Number.isInteger(adet) || adet < 1 || adet > SATIR_EKLE_EN_COK) {
      sonuclar.push({ yer, ad: b.ad, durum: "yazilamadi", neden: `satır sayısı 1 ile ${SATIR_EKLE_EN_COK} arası olmalı` });
      continue;
    }
    const once = durum.cevaplar.tablo[b.id] ?? [];
    /* 2026-10-16: raporun sınırını aşacak kalem yazılmaz (yarım tablo da yok) — nedeniyle, kaç satır daha eklenebileceğiyle */
    if (once.length + adet > TABLO_SATIR_EN_COK) {
      sonuclar.push({ yer, ad: b.ad, durum: "yazilamadi", neden: `${TABLO_DOLU}; tabloda ${once.length} satır var, en çok ${Math.max(0, TABLO_SATIR_EN_COK - once.length)} satır daha eklenebilir` });
      continue;
    }
    if (!tabloOnce.has(b.id)) tabloOnce.set(b.id, once.map((x) => ({ ...x })));
    const hatalar: { ad: string; neden: string }[] = [], sabit: [string, string][] = [];
    for (const [alan, ham] of Object.entries(s.degerler ?? {})) {
      if (alan === s.sira?.sutun || typeof ham !== "string") continue;
      const r = hucreDenetle(b, alan, ham);
      if ("neden" in r) hatalar.push({ ad: `${b.ad} · ${r.adi} (${adet} satır)`, neden: r.neden });
      else if (r.v) sabit.push([r.anahtar, r.v]);
    }
    let sira: { anahtar: string; adi: string; onek: string; bas: number; artis: number } | null = null;
    if (s.sira) {
      const sutun = b.sutunlar.find((x) => x.id === s.sira?.sutun);
      if (!sutun) hatalar.push({ ad: `${b.ad} · ${String(s.sira.sutun).slice(0, 60)}`, neden: "sıra için tabloda böyle bir sütun yok" });
      else {
        const artis = Number.isInteger(s.sira.artis) ? s.sira.artis! : 1;
        let onek = s.sira.onek ?? "", bas = Number.isInteger(s.sira.baslangic) ? s.sira.baslangic! : null;
        if (bas === null) {
          const son = [...once].reverse().map((x) => /^(.*?)(\d+)$/.exec(String(x[sutun.id] ?? "").trim())).find((x) => !!x);
          if (son && s.sira.onek === undefined) onek = son[1];
          bas = son ? Number(son[2]) + artis : 1;
        }
        sira = { anahtar: sutun.id, adi: sutun.ad, onek, bas, artis };
      }
    }
    const l = [...once], siraHatasi = new Map<string, number>();
    for (let i = 0; i < adet; i++) {
      const satir: Satir = Object.fromEntries(sabit);
      if (sira) {
        const r = hucreDenetle(b, sira.anahtar, `${sira.onek}${sira.bas + i * sira.artis}`);
        if ("neden" in r) siraHatasi.set(r.neden, (siraHatasi.get(r.neden) ?? 0) + 1);
        else if (r.v) satir[sira.anahtar] = r.v;
      }
      l.push(satir);
    }
    for (const [neden, n] of siraHatasi) hatalar.push({ ad: `${b.ad} · ${sira?.adi ?? ""} (${n} satır)`, neden });
    durum = { ...durum, cevaplar: { ...durum.cevaplar, tablo: { ...durum.cevaplar.tablo, [b.id]: l } } };
    /* teyit: tablo geri okunur — eklenen satır sayısı ve her yeni satırın sabit değerleri */
    const sonra = durum.cevaplar.tablo[b.id] ?? [];
    const yeniler = sonra.slice(once.length);
    if (yeniler.length !== adet || !yeniler.every((x) => sabit.every(([k, v]) => x[k] === v))) {
      sonuclar.push({ yer, ad: b.ad, durum: "yazilamadi", neden: "yazıldıktan sonra okunan tablo farklı" });
      continue;
    }
    const ilk = once.length + 1, sonNo = once.length + adet;
    sonuclar.push({ yer, ad: `${b.ad} · ${adet} satır eklendi (${adet === 1 ? `${ilk}. satır` : `${ilk}–${sonNo}. satır`})`, durum: "yazildi" });
    for (const x of hatalar) sonuclar.push({ yer, ad: x.ad, durum: "yazilamadi", neden: x.neden });
    const k = tabloHucre.get(b.id) ?? new Set<string>();
    yeniler.forEach((x, i) => { for (const c of Object.keys(x)) if (b.sutunlar.some((y) => y.id === c)) k.add(`${once.length + i}:${c}`); });
    tabloHucre.set(b.id, k);
  }
  /* 557: satır silme — yazmalardan sonra, büyük satırdan küçüğe */
  for (const [b, l] of silinecek) {
    if (!tabloOnce.has(b)) tabloOnce.set(b, (durum.cevaplar.tablo[b] ?? []).map((s) => ({ ...s })));
    const kalan = (durum.cevaplar.tablo[b] ?? []).filter((_, i) => !l.has(i));
    durum = { ...durum, cevaplar: { ...durum.cevaplar, tablo: { ...durum.cevaplar.tablo, [b]: kalan } } };
    const k = tabloHucre.get(b);
    if (k) tabloHucre.set(b, new Set([...k].flatMap((x) => {
      const [s, ...c] = x.split(":"), n = Number(s);
      if (l.has(n)) return [];
      return [`${n - [...l].filter((i) => i < n).length}:${c.join(":")}`];
    })));
  }
  /* tablolar: bir tablonun bütün girişleri tek geri alma; yazılan hücreler işaretli */
  for (const [b, once] of tabloOnce) {
    const yeni = durum.cevaplar.tablo[b] ?? [];
    if (JSON.stringify(yeni) === JSON.stringify(once)) continue;
    geri.push({ tablo: b, onceki: once, yeni });
    for (const k of tabloHucre.get(b) ?? []) {
      const [s, ...c] = k.split(":");
      if (yeni[Number(s)]?.[c.join(":")]) isaretler.push({ yer: { tur: "hucre", bolum: b, satir: Number(s), sutun: c.join(":") }, guven: "emin" });
    }
  }
  const gecersiz = sonuclar.filter((s) => s.durum === "yazilamadi").map((s) => `${s.ad}: ${s.neden}`);
  /* C: eklenen satır (net — silinenler düşer); S.A.Y'a "eklenen_satir" olarak döner */
  const eklenen = [...tabloOnce].reduce((t, [b, once]) => t + Math.max(0, (durum.cevaplar.tablo[b]?.length ?? 0) - once.length), 0);
  return { durum, isaretler, dolu: [], geri, gecersiz, sonuclar, cihaz, satir: eklenen };
}
/** 557: sonucun okunur özeti (sayılar + yapılamayanlar nedeniyle) — S.A.Y'a ve geçmişe giden */
export function sonucOzeti(l: readonly GirisSonucu[]): { yazildi: number; ayni: number; yazilamadi: { ad: string; neden: string }[]; bekliyor: number } {
  return {
    yazildi: l.filter((s) => s.durum === "yazildi").length, ayni: l.filter((s) => s.durum === "ayni").length,
    yazilamadi: l.filter((s) => s.durum === "yazilamadi").map((s) => ({ ad: s.ad, neden: s.neden ?? "" })), bekliyor: l.filter((s) => s.durum === "bekliyor").length,
  };
}
export { tarihYazimi };
