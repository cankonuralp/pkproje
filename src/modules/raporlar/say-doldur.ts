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
   (say/rapor-haritasi.ts), değer alanın türüne göre denetlenir; kişi istediği için DOLU ALANA DA yazılır; işaret ve Geri al aynı. */
import { alanDegeri, type OkunacakAlan } from "../../format/deger.ts";
import { doldurma, type BolumOf, type Cevaplar, type FormatTanimi } from "../../format/tanim.ts";
import { doluSatir, okunanHedefleri, type Satir } from "./foto-eslestir.ts";
import { bilgiAlanlari, ekipmanAlanlari, ekipmanAnahtari, testAlanlari } from "./doldur.ts";

export type Guven = "emin" | "belirsiz";
/** ekrandaki yeri: ekipman bilgisi · bilgi alanı · test değeri · tablo hücresi · madde · sonuç */
export type Yer =
  | { tur: "ekipman"; id: string } | { tur: "alan"; id: string } | { tur: "deger"; id: string }
  | { tur: "hucre"; bolum: string; satir: number; sutun: string } | { tur: "madde"; id: string } | { tur: "sonuc" }
  /* 550: maddenin kusur açıklaması ve derecesi, uzman yorumu */
  | { tur: "madde_not"; id: string } | { tur: "derece"; id: string } | { tur: "yorum" };
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
  if (y.tur === "yorum") return d.cevaplar.yorum;
  if (y.tur === "madde_not") return d.cevaplar.madde[y.id]?.not ?? "";
  if (y.tur === "derece") return d.cevaplar.madde[y.id]?.derece ?? "";
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

/* ── 550 S.A.Y'IN İSTENEN GİRİŞLERİ ("rapora_yaz" aracı) ── */
/** Haiku'nun verdiği giriş: yer kimliği (raporun haritasındaki) + değer */
export interface RaporGirisi { yer: string; deger: string }
/** tek istekte en çok giriş ve tabloda en çok yeni satır */
export const GIRIS_EN_COK = 300;
const YENI_SATIR_EN_COK = 100;
const kucukTr = (s: string) => s.toLocaleLowerCase("tr").replace(/\s+/g, " ").trim();
const sutunAlani = (s: BolumOf<"olcum">["sutunlar"][number]): Pick<OkunacakAlan, "tur" | "uzun" | "secenekler"> =>
  s.giris === "sayi" ? { tur: "sayi" } : s.giris === "secim" ? { tur: "secim", secenekler: s.secenekler ?? [] } : s.giris === "evet" ? { tur: "evet" } : { tur: "metin", uzun: 200 };

/** girişleri uygular; bilinmeyen yer ya da türüne uymayan değer yazılmaz, "yer: neden" olarak döner. Kişi istediği için dolu alana da yazılır. */
export function komutlariUygula(d: Durum, t: FormatTanimi, girisler: readonly RaporGirisi[], bugun = new Date()): Uygulama & { gecersiz: string[] } {
  /* yazılabilir yerler: ekipman / bilgi / test alanları (türleriyle), tablolar, maddeler (bölümün cevapları), sonuç, yorum */
  const alanlar = new Map<string, { a: Pick<OkunacakAlan, "tur" | "uzun" | "secenekler">; yer: Exclude<Yer, { tur: "hucre" }> }>();
  const ekipman = ekipmanAlanlari(t);
  for (const a of ekipman.alanlar) alanlar.set(`e:${a.id}`, { a, yer: ekipmanAnahtari(a.id) ? { tur: "ekipman", id: a.id } : { tur: "alan", id: a.id } });
  const tablolar = new Map<string, BolumOf<"olcum">>(), maddeler = new Map<string, readonly string[]>();
  let sonucVar = false, notVar = false;
  for (const b of t.bolumler) {
    if (b.blok === "bilgi" && b.id !== ekipman.tam?.id) for (const a of bilgiAlanlari(b)) alanlar.set(ekipmanAnahtari(a.id) ? `e:${a.id}` : `a:${a.id}`, { a, yer: ekipmanAnahtari(a.id) ? { tur: "ekipman", id: a.id } : { tur: "alan", id: a.id } });
    else if (b.blok === "test") for (const a of testAlanlari(b)) alanlar.set(`d:${a.id}`, { a, yer: { tur: "deger", id: a.id } });
    else if (b.blok === "olcum") tablolar.set(b.id, b);
    else if (b.blok === "liste") for (const g of b.gruplar) for (const m of g.maddeler) maddeler.set(m.id, b.cevaplar);
    else if (b.blok === "sonuc") sonucVar = true;
    else if (b.blok === "not") notVar = true;
  }
  let durum = d;
  const isaretler: Isaret[] = [], geri: Geri[] = [], gecersiz: string[] = [];
  const tabloOnce = new Map<string, Satir[]>(), tabloHucre = new Map<string, Set<string>>();
  const tekYaz = (yer: Exclude<Yer, { tur: "hucre" }>, x: string) => {
    const onceki = oku(durum, yer);
    if (onceki === x) return;
    durum = yaz(durum, yer, x);
    if (oku(durum, yer) !== x) return;                                    // yazılamadı (ör. cevapsız maddeye açıklama)
    isaretler.push({ yer, guven: "emin" });
    geri.push({ yer, onceki, yeni: x });
  };
  for (const g of girisler.slice(0, GIRIS_EN_COK)) {
    const yer = typeof g?.yer === "string" ? g.yer.trim() : "", ham = typeof g?.deger === "string" ? g.deger : "";
    if (!yer) continue;
    const red = (neden: string) => { gecersiz.push(`${yer.slice(0, 60)}: ${neden}`); };
    const alan = alanlar.get(yer);
    if (alan) {
      if (!ham.trim()) { tekYaz(alan.yer, ""); continue; }               // boş değer: alanı temizle
      const v = alanDegeri(alan.a, ham, bugun);
      if (v === null) { red("değer alanın türüne uymuyor"); continue; }
      tekYaz(alan.yer, v);
      continue;
    }
    const h = /^t:([^:]+):(\d{1,4}):(.+)$/.exec(yer);
    if (h) {
      const b = tablolar.get(h[1]), satir = Number(h[2]) - 1, sutun = b?.sutunlar.find((s) => s.id === h[3] && !s.formul);
      if (!b || !sutun || satir < 0) { red("tabloda böyle bir yer yok"); continue; }
      const v = ham.trim() ? alanDegeri(sutunAlani(sutun), ham, bugun) : "";
      if (v === null) { red("değer sütunun türüne uymuyor"); continue; }
      const l = (durum.cevaplar.tablo[b.id] ?? []).map((s) => ({ ...s }));
      if (satir >= l.length + YENI_SATIR_EN_COK) { red("satır çok ileride"); continue; }
      if (!tabloOnce.has(b.id)) tabloOnce.set(b.id, (durum.cevaplar.tablo[b.id] ?? []).map((s) => ({ ...s })));
      while (l.length <= satir) l.push({});
      if ((l[satir][sutun.id] ?? "") === v) continue;
      if (v) l[satir][sutun.id] = v; else delete l[satir][sutun.id];
      durum = { ...durum, cevaplar: { ...durum.cevaplar, tablo: { ...durum.cevaplar.tablo, [b.id]: l } } };
      const k = tabloHucre.get(b.id) ?? new Set<string>();
      k.add(`${satir}:${sutun.id}`); tabloHucre.set(b.id, k);
      continue;
    }
    const m = /^m:([^#]+)(?:#(not|derece))?$/.exec(yer);
    if (m) {
      const cevaplar = maddeler.get(m[1]);
      if (!cevaplar) { red("böyle bir madde yok"); continue; }
      if (!m[2]) {
        const c = ham.trim() ? cevaplar.find((x) => kucukTr(x) === kucukTr(ham)) : "";
        if (c === undefined) { red(`cevap şunlardan biri olmalı: ${cevaplar.join(", ")}`); continue; }
        tekYaz({ tur: "madde", id: m[1] }, c);
      } else if (m[2] === "derece") {
        const x = kucukTr(ham), v = !x ? "" : /^(ağır|agir)/.test(x) ? "agir" : /^hafif/.test(x) ? "hafif" : null;
        if (v === null) { red("derece hafif ya da ağır olmalı"); continue; }
        if (!durum.cevaplar.madde[m[1]]) { red("önce maddenin cevabı yazılmalı"); continue; }
        tekYaz({ tur: "derece", id: m[1] }, v);
      } else {
        if (!durum.cevaplar.madde[m[1]]) { red("önce maddenin cevabı yazılmalı"); continue; }
        tekYaz({ tur: "madde_not", id: m[1] }, ham.trim().slice(0, 1000));
      }
      continue;
    }
    if (yer === "sonuc") {
      const x = kucukTr(ham).replace(/[_-]/g, " ");
      const v = !x ? "" : /uygun ?(değil|degil)|uygunsuz|olumsuz/.test(x) ? "uygun_degil" : /^(uygun|olumlu)$/.test(x) ? "uygun" : null;
      if (!sonucVar || v === null) { red(sonucVar ? "sonuç uygun ya da uygun değil olmalı" : "formatta sonuç yok"); continue; }
      tekYaz({ tur: "sonuc" }, v);
      continue;
    }
    if (yer === "yorum" && notVar) { tekYaz({ tur: "yorum" }, ham.trim().slice(0, 4000)); continue; }
    red("raporda böyle bir yer yok");
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
  return { durum, isaretler, dolu: [], geri, gecersiz };
}
