/* S.A.Y RAPORA GİRER — saf kurallar (542; sunum 541 onaylı — reisim 2026-10-14: "oku tuşu olmayacak say asistandan gir ve fotoğrafı okuyup ilgili
   yerlere girişleri yap diyeceğim ve yapacak", "maketleri falan da onaylıyorum"). Ekran (SahaRaporu) ve S.A.Y aynı işlevleri kullanır:
   · K1 emin olunmayan değer de girilir, SARI işaretlenir (emin olunan yeşil); kişi o alana yazınca işaret kalkar.
   · K2 dolu alanın üstüne yazılmaz: dolu kalanlar sayılır, S.A.Y "dolu alanları da değiştireyim mi?" der; "üstüne yaz" aynı okunanları yazar.
     Tablo satırları boş satıra / tablonun sonuna (foto-eslestir.ts ile aynı yer) — elle yazılan hücre ezilmez.
   · K3 raporun OKUNMAMIŞ okuma fotoğrafları, her biri eklendiği bölüme (okunan fotoğraf okuma kaydından bilinir — göç 0089).
   · K4 "bütün maddeleri uygun işaretle" (boş maddeler, cevap setinin ilk seçeneği) ve "sonucu uygun / uygun değil yap".
   · Geri al: S.A.Y'ın girdiği her değer önceki hâline döner (sonradan kişinin değiştirdiği alana dokunulmaz).
   · S.A.Y Chat'ten açılan raporun bekleyen okumaları (rapor_oneri) da aynı yoldan, açılışta boş alanlara girer (öneri kartı kalktı).
   Kaydetmek kişide: girilenler ekranda kalır, Kaydet'le rapora yazılır. */
import { doldurma, type BolumOf, type Cevaplar, type FormatTanimi } from "../../format/tanim.ts";
import { doluSatir, okunanHedefleri, type Satir } from "./foto-eslestir.ts";
import { bilgiAlanlari, ekipmanAlanlari, ekipmanAnahtari, testAlanlari } from "./doldur.ts";

export type Guven = "emin" | "belirsiz";
/** ekrandaki yeri: ekipman bilgisi · bilgi alanı · test değeri · tablo hücresi · madde · sonuç */
export type Yer =
  | { tur: "ekipman"; id: string } | { tur: "alan"; id: string } | { tur: "deger"; id: string }
  | { tur: "hucre"; bolum: string; satir: number; sutun: string } | { tur: "madde"; id: string } | { tur: "sonuc" };
export interface Isaret { yer: Yer; guven: Guven }
/** ekranın doldurulan hâli: ekipman bilgisi (2. bölümün kayda bağlı alanları) ve cevaplar */
export interface Durum { ekipman: Readonly<Record<string, string>>; cevaplar: Cevaplar }
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
export function sonucuYap(d: Durum, x: "uygun" | "uygun_degil"): Uygulama {
  const yer = { tur: "sonuc" as const }, onceki = d.cevaplar.sonuc;
  if (onceki === x) return { durum: d, isaretler: [], dolu: [], geri: [] };
  return { durum: yaz(d, yer, x), isaretler: [{ yer, guven: "emin" }], dolu: [], geri: [{ yer, onceki, yeni: x }] };
}

/** geri al: S.A.Y'ın girdiği değer hâlâ duruyorsa önceki hâline döner (kişi sonradan değiştirdiyse dokunulmaz); dönen: geri alınan sayısı */
export function geriAl(d: Durum, l: readonly Geri[]): { durum: Durum; sayi: number } {
  let durum = d, sayi = 0;
  for (const g of [...l].reverse()) {
    if ("tablo" in g) {
      const simdi = durum.cevaplar.tablo[g.tablo] ?? [];
      if (JSON.stringify(simdi) !== JSON.stringify(g.yeni)) continue;
      durum = { ...durum, cevaplar: { ...durum.cevaplar, tablo: { ...durum.cevaplar.tablo, [g.tablo]: g.onceki } } };
      sayi++;
      continue;
    }
    if (oku(durum, g.yer) !== g.yeni) continue;
    durum = yaz(durum, g.yer, g.onceki);
    sayi++;
  }
  return { durum, sayi };
}
