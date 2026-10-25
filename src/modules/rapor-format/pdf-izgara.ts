/* BASILI FORMDAN ŞABLON — IZGARA KURALLARI, saf (2026-10-24; reisim: "ben şablon yükledim bu şablondan başlat dedim neden yapay zeka çalışıyor ?",
   "en baştan beri bunu istedim"). PDF'in kendi içeriği (pdf-sayfa.ts → PdfSayfasi[]) KURALLARLA BASILI ham'a (basili.ts basilidanTanim'in girdisi)
   çevrilir; yapay zekâ yok, ağ yok, tarayıcıda koşar. Sayfalar alt alta birleştirilir (y sayfa yüksekliğiyle kayar).
   1. çizgiler: ince dolgular (kısa kenar ≤ 2,5 pt, uzun kenar ≥ 4 pt) ve çizilen çizgiler yatay / dikey parçalara; kalınlık > 1,2 pt kalın.
      Öteki dolgular zemin adayıdır (beyaza yakın zemin yok sayılır).
   2. tablolar: birbirine değen / kesişen parçaların bağlı bileşenleri; en az 2 yatay + 2 dikey parçalı bileşen bir tablo.
   3. ızgara: dikey çizgi x'leri, yatay çizgi y'leri kümelenir (2,5 pt'ten dar sütun / satır yok); iki komşu hücre arasındaki kenarın %60'ını örten
      çizgi yoksa hücreler birleşiktir; birleşik bölge dikdörtgen değilse hücreler tek tek kalır (üst üste binme yok, her konum tek hücrenin).
   4. yazılar: merkezi hücrenin içinde kalan yazı o hücrenin; görünüm (kalın, eğik, boy, hiza, zemin) çoğunluktan; resimli hücre logo.
   5. tablo dışı: sayfa altı satırları altYazi (250 karaktere sığmazsa kesilmez, yerinde yazı kalır); öteki yazılar paragraf paragraf kenarsız
      1×1 tablo; resimler logo; başlık en büyük yazı; form kodu kalıptan.
   6. yan yana: dikey aralığı öncekiyle ≥ %50 örtüşen ve onun sağındaki blok yan, oran satırdaki genişlik payı.
   7. yazı tipi: en sık aile → tinos / arimo / carlito.
   8. hücre türü: sıra no, sonuç cümlesi, imza, kontrol cevabı, kayıttan (KAYIT_ETIKETLERI), sahada doldurulan alan — eşleştirme Türkçe katlanarak.
   2026-10-24 (denetim düzeltmeleri):
   · çerçeve: içinde başka tablo olan, iç çizgisi olmayan dış kutu (sayfa kenarlığı, çift dış kenarın dış çizgisi) atılır; iç çizgili dış tablo
     içindekilerin çizgilerini kendi ızgarasına katar. Aralığı ≤ 5 pt, arasında yazı olmayan iki komşu çizgi tek çizgi (çift çizgi kalın kenar).
   · bantlar: tek parça çizilmiş form (Word'ün bitişik tabloları) bütün genişlikteki başlık şeritlerinden ve sütun düzeninin değiştiği hatlardan
     ayrı tablolara bölünür; bandı ikiye bölen, iki yanında başlık şeridi olan dikey hat yan yana iki tablo. Bitişik bantlar ortak çizgiyi bir kez
     çizer, bölümler arası aralık 0 (yazi.ara).
   · yazı: hücre çizgisini aşan, pdf.js'in araya boşlukla birleştirdiği iki yazı çizginin yanındaki boşluktan bölünür; komşu boş hücreye taşan yazı
     o hücreyi alan yapmaz.
   · imza bilgisi yalnız imza başlığının altındaki hücrede (madde / cevap satırındaki yazı başlık sayılmaz); çok satırlı listenin sütun başlığından
     kayıt verilmez (alan); aynı kayıt bir satırda bir kez; iki bilgi soran etiket hücreyi ikiye böler; başlıklı kutudaki tek kısa cümle sahada
     değiştirilen alanın hazır yazısı.
   · sayfa altı satır satır (kısa tek satırlar altYazi, paragraf yerinde), form kodu sayfa altındaki önceksiz koddan da; iki sayfaya bölünen
     tablo tek tablo (sonraki sayfada tekrarlanan başlık satırı atılır); bölüm sayısı çevirinin ekleyeceklerine yer bırakır. */
import { PDF_SINIR, type BasiliHam, type HamBolum, type HamHucre, type HamKenar, type HamSatir, type PdfSayfasi, type PdfYazi } from "./pdf-tipler.ts";
import type { HucreAlanTuru, TabloKaynagi, YaziTipi } from "../../format/tanim.ts";

/** değme / kesişme yakınlığı (pt) */
const YAKIN = 2;
/** çizgi sayılan dolgunun en kalın kenarı; en dar sütun / satır (pt) */
const INCE = 2.5;
/** çizgi sayılan dolgunun en kısa uzun kenarı (pt) */
const KISA = 4;
/** bundan kalın çizgi kalın kenar (pt) */
const KALIN = 1.2;
/** kenarı / hücreyi örtme oranı */
const ORTU = 0.6;
/** tablonun açık yanı: çizgisiz kenar bu kadar uzaksa ayrı sütun / satır (pt) */
const ACIK_YAN = 6;
/** çift çizgi / kayık sınır: bu kadar yakın, arasında yazı olmayan iki komşu çizgi tek çizgi (pt) */
const CIFT = 5;
/** dış çerçeve tek tabloyu bu kadar yakından sarıyorsa çift dış kenardır (pt) */
const SIKI = 8;
const MM = 0.3528;
const SUTUN_EN_COK = 40, SATIR_EN_COK = 200;
/** bölüm hedefi: tanımın sınırı (40) − çevirinin formda yoksa ekleyeceği bölümler (sonuç, uzmanın imzası, fotoğraflar) */
const BOLUM_HEDEF = 37;
const KENARSIZ = { u: 0, a: 0, s: 0, g: 0 } as const;

interface Kutu { x0: number; y0: number; x1: number; y1: number }
interface Yazi extends PdfYazi { p: number }
interface Zemin extends Kutu { renk: string; /** çizim sırası */ n: number }
interface Resim extends Kutu { p: number }
/** çizgi parçası: c sabit koordinat (yatayda y, dikeyde x), a–b boyunca, k kalınlık */
interface Parca { c: number; a: number; b: number; k: number }
/** aynı doğrultuda birbirine değen parçaların birleşimi */
interface Hat { c: number; a: number; b: number; parca: Parca[] }
interface Sayfa { ust: number; en: number; boy: number }
interface YaziSatiri extends Kutu { yazilar: Yazi[]; taban: number; boy: number; metin: string; p: number }
interface Bolge {
  r: number; c: number; rs: number; cs: number; kutu: Kutu;
  yazilar: Yazi[]; resim: boolean; satirlar: YaziSatiri[]; metin: string;
  /** yazi: okunur yazı · isaret: yalnız iki nokta (etiket sayılmaz) · bos */
  durum: "bos" | "isaret" | "yazi";
  /** sira: sıra no · secenek: yan yana cevap sütunlarının birleşik cevap hücresi · secenekBasligi: o sütunların başlığı (U | UD | X) */
  sira: boolean; secenek: boolean; secenekBasligi: boolean;
  /** komşu hücreden taşan yazının üstünden geçtiği boş hücre (alan yapılmaz) */
  kapli: boolean;
}
interface Tablo {
  kutu: Kutu; p: number; xs: number[]; ys: number[]; yp: Parca[][]; dp: Parca[][]; bolgeler: Bolge[]; sahip: number[][];
  /** bitişik bandın altında (üst çizgiyi üstteki çizer) · yan yana yarının sağdakisi (sol çizgiyi soldaki çizer) */
  ustBitisik: boolean; solBitisik: boolean;
  /** iki bilgi soran etiket için bölünen sütunlar (bölünmeden önceki koordinatlar · bölünen sütunlar, büyükten küçüğe) — sayfa devamı aynı bölünür */
  xs0?: number[]; bolunen?: number[];
}
interface Paragraf { satirlar: YaziSatiri[]; kutu: Kutu; p: number; boy: number; sonTaban: number }
type Blok = { kutu: Kutu; p: number } & ({ tur: "tablo"; t: Tablo } | { tur: "metin"; par: Paragraf; zemin: string } | { tur: "resim" });

const sonlu = (...l: unknown[]) => l.every((x) => typeof x === "number" && Number.isFinite(x));
const enAz = (l: number[]) => l.reduce((a, x) => Math.min(a, x), Infinity);
const enCok = (l: number[]) => l.reduce((a, x) => Math.max(a, x), -Infinity);
const yarim = (x: number) => Math.round(x * 2) / 2;
const mm = (pt: number) => yarim(pt * MM);
const RENK = /^#[0-9a-fA-F]{6}$/;
/** beyaza yakın renk (zemin sayılmaz, ince beyaz dolgu çizgi sayılmaz) */
const acikRenk = (renk: string) => [1, 3, 5].every((i) => parseInt(renk.slice(i, i + 2), 16) >= 0xf8);
const kontrolsuz = (s: string) => s.replace(/[\u0000-\u001f\u007f\u00ad\u200b-\u200f\u2028\u2029\ufeff]/g, " ");

/* ── TÜRKÇE KATLAMA ── */
const HARF: Record<string, string> = { "ı": "i", "ş": "s", "ğ": "g", "ü": "u", "ö": "o", "ç": "c", "â": "a", "î": "i", "û": "u" };
/* katlama sonuçları saklanır (2026-10-24: büyük formda toLocaleLowerCase her harfte ölçülür derecede yavaş) */
const harfler = new Map<string, string>(), katlananlar = new Map<string, string>();
/** tek harfin katlanmışı (küçük harf "tr", Türkçe harfler ASCII'ye) */
const harf = (ch: string) => {
  let h = harfler.get(ch);
  if (h === undefined) { const k = ch.toLocaleLowerCase("tr")[0] ?? ""; h = HARF[k] ?? k; if (harfler.size < 4096) harfler.set(ch, h); }
  return h;
};
/** eşleştirmenin katlaması: küçük harf (tr), ı / İ → i, ş → s, ğ → g, ü → u, ö → o, ç → c; nokta ve kesme atılır, öteki noktalama (iki nokta,
    yıldız, tire, eğik çizgi, parantez …) boşluk olur; boşluklar teke iner */
export function katla(s: string): string {
  const v = katlananlar.get(s);
  if (v !== undefined) return v;
  const k = katlaHesapla(s);
  if (katlananlar.size >= 20_000) katlananlar.clear();
  katlananlar.set(s, k);
  return k;
}
function katlaHesapla(s: string): string {
  let o = "";
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (/['’‘`´.]/.test(ch)) continue;
    const h = harf(ch);
    o += /[a-z0-9]/.test(h) ? h : " ";
  }
  return o.replace(/\s+/g, " ").trim();
}
/** konumu koruyan katlama (her karakter tek karakter; harf / rakam dışı boşluk) — sonuç sözcüğünün özgün yazıdaki yeri için */
function katlaKonumlu(s: string): string {
  let o = "";
  for (let i = 0; i < s.length; i++) { const h = harf(s[i]); o += h.length === 1 && /[a-z0-9]/.test(h) ? h : " "; }
  return o;
}
/** sözcük kökü eşleşmesi: kelime anahtarla başlar, eki en çok 3 harf (iki harflik anahtarda 1) — "unvanı", "markası", "tarihi" */
const kelimeUyar = (w: string | undefined, k: string) => !!w && w.startsWith(k) && w.length - k.length <= (k.length < 3 ? 1 : 3);
/** katlanmış etiket anahtarı içeriyor mu: anahtarın kelimeleri etikette art arda (kök eşleşmesi); "=" ile başlayan anahtar etiketin tamamı */
function etiketEslesir(etiket: string, anahtar: string): boolean {
  if (anahtar.startsWith("=")) return etiket === anahtar.slice(1);
  const e = etiket.split(" "), a = anahtar.split(" ");
  for (let i = 0; i + a.length <= e.length; i++) if (a.every((k, j) => kelimeUyar(e[i + j], k))) return true;
  return false;
}

/* ── ETİKET SÖZLÜKLERİ (katlanmış anahtar → kayıt bilgisi; sıra önemli — ilk eşleşen) ── */
export const KAYIT_ETIKETLERI: readonly (readonly [string, TabloKaynagi])[] = [
  ["muayene firma", "muayene_firmasi"],
  ["e posta", "eposta"], ["eposta", "eposta"], ["e mail", "eposta"], ["email", "eposta"],
  ["telefon", "tel"], ["tel no", "tel"], ["=tel", "tel"],
  ["isg katip", "isg"], ["sozl id", "isg"], ["sozlesme id", "isg"],
  ["sgk", "sgk"], ["oda sicil", "uzman_oda"], ["sicil", "sgk"],
  ["rapor no", "rapor_no"], ["rapor numara", "rapor_no"], ["rapor tarih", "rapor_tarihi"],
  ["sonraki kontrol", "sonraki"], ["bir sonraki", "sonraki"], ["gecerlili", "sonraki"],
  ["kontrol tarih", "bas"], ["muayene tarih", "bas"], ["kontrol baslangic", "bas"], ["kontrol bitis", "bit"],
  ["makine kod", "ekipman_kod"], ["ekipman kod", "ekipman_kod"], ["ekipman no", "ekipman_kod"], ["ekipman numara", "ekipman_kod"], ["makine no", "ekipman_kod"],
  ["marka", "marka"], ["model", "model"], ["seri", "seri"], ["imal", "imal"], ["uretim yil", "imal"],
  ["kullanim yer", "konum"], ["bulundugu yer", "konum"], ["=yeri", "konum"], ["=yer", "konum"], ["kullanim amac", "amac"],
  ["referans standart", "metot"], ["metot", "metot"], ["metod", "metot"],
  ["adres", "adres"],
  ["firma unvan", "firma"], ["firma adi", "firma"], ["unvan", "firma"], ["isveren", "firma"],
];
type Kim = "uzman" | "teknik" | "tesis";
/** imza tablosunda (kontrolü yapan / onaylayan / tesis sütunları): etiket → sütunun kişisine göre kayıt bilgisi */
export const IMZA_ETIKETLERI: readonly (readonly [string, Partial<Record<Kim, TabloKaynagi>>])[] = [
  ["ad soyad", { uzman: "uzman_ad", teknik: "teknik_ad", tesis: "tesis_ad" }],
  ["=adi", { uzman: "uzman_ad", teknik: "teknik_ad", tesis: "tesis_ad" }],
  ["=ad", { uzman: "uzman_ad", teknik: "teknik_ad", tesis: "tesis_ad" }],
  ["isim", { uzman: "uzman_ad", teknik: "teknik_ad", tesis: "tesis_ad" }],
  ["unvan", { uzman: "uzman_meslek", teknik: "teknik_meslek", tesis: "tesis_unvan" }],
  ["meslek", { uzman: "uzman_meslek", teknik: "teknik_meslek", tesis: "tesis_unvan" }],
  ["gorev", { uzman: "uzman_meslek", teknik: "teknik_meslek", tesis: "tesis_unvan" }],
  ["diploma", { uzman: "uzman_diploma" }],
  ["oda", { uzman: "uzman_oda" }],
  ["ekipnet", { uzman: "uzman_ekipnet" }], ["bakanlik kayit", { uzman: "uzman_ekipnet" }],
];
/** etiketin kayıt bilgisi (sözlükten; etiket katlanarak eşleşir) */
export function kayitKaynagi(etiket: string): TabloKaynagi | null {
  const k = katla(etiket);
  return KAYIT_ETIKETLERI.find(([a]) => etiketEslesir(k, a))?.[1] ?? null;
}
function imzaKaynagi(etiket: string, kim: Kim): { kaynak: TabloKaynagi | null; bulundu: boolean } {
  const k = katla(etiket), e = IMZA_ETIKETLERI.find(([a]) => etiketEslesir(k, a));
  return { kaynak: e?.[1][kim] ?? null, bulundu: !!e };
}
const kimBul = (katli: string): Kim | null => (/onay|teknik|yonetici|mudur/.test(katli) ? "teknik" : /tesis|isveren|musteri/.test(katli) ? "tesis" : null);
const IMZA_TABLOSU = /kontrolu yapan|kontrol eden|kontrolu gerceklestiren|muhendis|uzman|onay|tesis (yetkili|sorumlu|temsilci)|^tesis$|isveren (yetkili|vekil|temsilci)/;
const CEVAP_BASLIGI = /^(sonuc|durum|degerlendirme|u\s*ud|uygun)/;
const SIRA_BASLIGI = /^(no|sira|sira no|s no|sn|madde no)$/;
/** kontrol cevabı sütunlarının başlıkları (yan yana ayrı sütunlar: U | UD | X) */
const SECENEK = /^(u|ud|uy|x|na|e|h|evet|hayir|var|yok|uygun|uygun degil|uygundur|uygun degildir|uygunsuz|uymaz|kusurlu|kusursuz|ok|nok|gecer|gecmez)$/;
const OLUMLU = /^(u|uygun|uygundur|evet|e|ok|kusursuz|gecer)$/, OLUMSUZ = /^(ud|uygun degil|uygun degildir|uygunsuz|uymaz|kusurlu|nok|hayir|h|gecmez)$/;
const BIRIM = /\(\s*(kg|gr|g|ton|t|mm²|mm2|cm²|cm2|m²|m2|m³|m3|mm|cm|km|m|adet|kn|dan|nm|n|bar|mpa|kpa|psi|°\s?c|℃|%|kv|kva|kw|w|v|ma|a|hz|ohm|mω|kω|ω|lt|l|sn|s|dk|rpm|d\/dk|m\/s|m\/dk|lux|lx|db)\s*\)/i;
const SAYI_KOKLERI = ["kapasite", "yuk", "cap", "uzunlu", "yuksekli", "mesafe", "sayi", "acikli", "agirli", "genisli", "basinc"];

/* ── 1. DÜZLEME: sayfalar alt alta, parçalar ── */
interface Duz { sayfalar: Sayfa[]; yazilar: Yazi[]; yatay: Parca[]; dikey: Parca[]; zeminler: Zemin[]; resimler: Resim[] }
function duzle(girdi: readonly PdfSayfasi[]): Duz {
  const d: Duz = { sayfalar: [], yazilar: [], yatay: [], dikey: [], zeminler: [], resimler: [] };
  let ust = 0, yol = 0, sira = 0;
  for (const [p, s] of girdi.slice(0, PDF_SINIR.sayfa).entries()) {
    /* beyaz ince dolgu (Word'ün koyu ızgara stillerinde hücre ayracı): renkli zeminin üstündeyse çizgi */
    const beyaz: { yatay: boolean; p: Parca; n: number }[] = [], zemin0 = d.zeminler.length;
    if (!s || typeof s !== "object") continue;
    const en = sonlu(s.en) && s.en > 0 ? s.en : 595, boy = sonlu(s.boy) && s.boy > 0 ? s.boy : 842;
    d.sayfalar.push({ ust, en, boy });
    for (const y of Array.isArray(s.yazilar) ? s.yazilar : []) {
      if (d.yazilar.length >= PDF_SINIR.yazi) break;
      if (!y || typeof y.s !== "string" || !sonlu(y.x, y.y, y.g, y.h, y.boy)) continue;
      const metin = kontrolsuz(y.s);
      if (!metin.trim()) continue;
      const kb = y.boy > 0 ? y.boy : Math.abs(y.h) || 1;
      d.yazilar.push({ s: metin, x: y.x, y: y.y + ust, g: Math.max(0, y.g), h: y.h > 0 ? y.h : kb, boy: kb, kalin: y.kalin === true, egik: y.egik === true,
        aile: typeof y.aile === "string" ? y.aile : "", p });
    }
    for (const f of Array.isArray(s.dolgular) ? s.dolgular : []) {
      if (yol++ >= PDF_SINIR.yol) break;
      if (!f || !sonlu(f.x, f.y, f.g, f.h)) continue;
      const x = Math.min(f.x, f.x + f.g), y = Math.min(f.y, f.y + f.h) + ust, g = Math.abs(f.g), h = Math.abs(f.h);
      const renk = typeof f.renk === "string" && RENK.test(f.renk) ? f.renk.toUpperCase() : "#000000";
      if (Math.min(g, h) <= INCE) {
        if (Math.max(g, h) < KISA) continue;
        const parca = g >= h ? { c: y + h / 2, a: x, b: x + g, k: h } : { c: x + g / 2, a: y, b: y + h, k: g };
        if (acikRenk(renk)) beyaz.push({ yatay: g >= h, p: parca, n: sira++ }); else (g >= h ? d.yatay : d.dikey).push(parca);
      } else d.zeminler.push({ x0: x, y0: y, x1: x + g, y1: y + h, renk, n: sira++ });
    }
    const renkli = d.zeminler.slice(zemin0).filter((z) => !acikRenk(z.renk));
    if (beyaz.length && renkli.length && beyaz.length * renkli.length <= 4_000_000) {
      for (const w of beyaz) if (zeminUstunde(w.yatay, w.p, renkli.filter((z) => z.n < w.n))) (w.yatay ? d.yatay : d.dikey).push(w.p);
    }
    for (const c of Array.isArray(s.cizgiler) ? s.cizgiler : []) {
      if (yol++ >= PDF_SINIR.yol) break;
      if (!c || !sonlu(c.x1, c.y1, c.x2, c.y2)) continue;
      const k = sonlu(c.kalinlik) && c.kalinlik > 0 ? c.kalinlik : 0.5, y1 = c.y1 + ust, y2 = c.y2 + ust;
      if (Math.abs(y1 - y2) <= 1 && Math.abs(c.x2 - c.x1) >= 1) d.yatay.push({ c: (y1 + y2) / 2, a: Math.min(c.x1, c.x2), b: Math.max(c.x1, c.x2), k });
      else if (Math.abs(c.x1 - c.x2) <= 1 && Math.abs(y2 - y1) >= 1) d.dikey.push({ c: (c.x1 + c.x2) / 2, a: Math.min(y1, y2), b: Math.max(y1, y2), k });
    }
    for (const r of Array.isArray(s.resimler) ? s.resimler : []) {
      if (d.resimler.length >= PDF_SINIR.resim) break;
      if (!r || !sonlu(r.x, r.y, r.g, r.h)) continue;
      const x = Math.min(r.x, r.x + r.g), y = Math.min(r.y, r.y + r.h), g = Math.abs(r.g), h = Math.abs(r.h);
      /* sayfanın büyük kısmını örten resim (taranmış sayfa, filigran) logo değildir */
      if (g < KISA || h < KISA || g * h > 0.4 * en * boy) continue;
      d.resimler.push({ x0: x, y0: y + ust, x1: x + g, y1: y + h + ust, p });
    }
    ust += boy;
  }
  return d;
}
/** çizginin bir yanını (1,5 pt'lik şerit) uzunluğunun yarısından çoğu boyunca renkli zemin örtüyor mu */
function zeminUstunde(yatay: boolean, p: Parca, l: Zemin[]): boolean {
  const yan = (bas: number, son: number) => {
    const ar = l.filter((z) => (yatay ? z.y0 < son && z.y1 > bas : z.x0 < son && z.x1 > bas))
      .map((z) => (yatay ? [Math.max(p.a, z.x0), Math.min(p.b, z.x1)] : [Math.max(p.a, z.y0), Math.min(p.b, z.y1)])).filter(([u, v]) => v > u).sort((x, y) => x[0] - y[0]);
    let t = 0, e = -Infinity;
    for (const [u, v] of ar) { const b = Math.max(u, e); if (v > b) t += v - b; e = Math.max(e, v); }
    return t / Math.max(0.1, p.b - p.a);
  };
  const c0 = p.c - p.k / 2, c1 = p.c + p.k / 2;
  return yan(c0 - 1.5, c0 + 0.01) >= 0.5 || yan(c1 - 0.01, c1 + 1.5) >= 0.5;
}
const sayfaBul = (l: Sayfa[], y: number) => { let p = 0; for (let i = 0; i < l.length; i++) if (y >= l[i].ust) p = i; return p; };

/* ── 2. HATLAR ve TABLOLAR ── */
/** aynı doğrultuda (c farkı ≤ 1,5) birbirine değen parçalar tek hatta */
function hatlar(l: Parca[]): Hat[] {
  const s = [...l].sort((p, q) => p.c - q.c), out: Hat[] = [];
  for (let i = 0; i < s.length;) {
    let j = i + 1;
    while (j < s.length && s[j].c - s[j - 1].c <= 1.5) j++;
    const grup = s.slice(i, j).sort((p, q) => p.a - q.a);
    let cur: Parca[] = [], b = -Infinity;
    const kapat = () => {
      if (!cur.length) return;
      const ag = cur.reduce((t, x) => t + Math.max(x.b - x.a, 0.1), 0);
      out.push({ c: cur.reduce((t, x) => t + x.c * Math.max(x.b - x.a, 0.1), 0) / ag, a: enAz(cur.map((x) => x.a)), b, parca: cur });
    };
    for (const x of grup) {
      if (cur.length && x.a <= b + YAKIN) { cur.push(x); b = Math.max(b, x.b); } else { kapat(); cur = [x]; b = x.b; }
    }
    kapat();
    i = j;
  }
  return out;
}
/** küçük kapalı kutular (çizilmiş onay kutusu, kenarlı form alanı — iki dikey kenarı ≤ 20 pt, aralarında ≤ 20 pt, iki ucunda yatay hat, içi
    yazısız) ızgaraya katılmaz: kutunun dikey kenarları hücre çizgisine değince sütun sınırı oluyordu (2026-10-24, ikinci denetim). Kutunun üstü
    hücre çizgisine yapışıp onunla tek hatta birleşmişse o hat kalır; yalnız kutunun kendi kısa hatları atılır */
function kutulariAyikla(H: Hat[], V: Hat[], yazilar: readonly Yazi[]): [Hat[], Hat[]] {
  const K = 20, T = 1.2;
  const kv = V.filter((v) => v.b - v.a <= K && v.b - v.a >= 3).sort((x, y) => x.a - y.a || x.c - y.c);
  if (kv.length < 2 || kv.length > 20_000) return [H, V];
  const hs = [...H].sort((x, y) => x.c - y.c);
  /* kutunun kendi kısa kenarı; ya da kenarı yapıştığı hücre çizgisiyle tek hatta birleşmiş (hattın yeri ≤ 2 pt kayar) — ama dikey kenarın ucu uzun
     hatta tam değiyorsa o bir hücredir (dar sütunlu tek satırlık tablo), kutu değil */
  const yatay = (y: number, x0: number, x1: number) => {
    for (let j = altSinir(hs, y - YAKIN); j < hs.length && hs[j].c <= y + YAKIN; j++) {
      const h = hs[j], kisa = h.b - h.a <= x1 - x0 + 2 * T + 0.5;
      if (h.a <= x0 + T && h.b >= x1 - T && (kisa ? Math.abs(h.c - y) <= T : Math.abs(h.c - y) >= 0.5)) return h;
    }
    return null;
  };
  const atH = new Set<Hat>(), atV = new Set<Hat>();
  for (let i = 0; i < kv.length; i++) {
    for (let j = i + 1; j < kv.length && kv[j].a - kv[i].a <= T; j++) {
      const [sol, sag] = kv[j].c > kv[i].c ? [kv[i], kv[j]] : [kv[j], kv[i]];
      const en = sag.c - sol.c;
      if (en < 3 || en > K || Math.abs(sag.b - sol.b) > T || atV.has(sol) || atV.has(sag)) continue;
      const ust = yatay(sol.a, sol.c, sag.c), alt = yatay(sol.b, sol.c, sag.c);
      if (!ust || !alt || yazilar.some((y) => { const cx = y.x + y.g / 2, cy = y.y + y.h / 2; return cx > sol.c && cx < sag.c && cy > sol.a && cy < sol.b; })) continue;
      atV.add(sol); atV.add(sag);
      for (const h of [ust, alt]) if (h.b - h.a <= en + 2 * T) atH.add(h);
    }
  }
  return atV.size ? [H.filter((h) => !atH.has(h)), V.filter((v) => !atV.has(v))] : [H, V];
}
function birlesim(n: number) {
  const ana = Array.from({ length: n }, (_, i) => i);
  const bul = (x: number): number => { while (ana[x] !== x) { ana[x] = ana[ana[x]]; x = ana[x]; } return x; };
  return { bul, bir: (a: number, b: number) => { const x = bul(a), y = bul(b); if (x !== y) ana[y] = x; } };
}
/** sıralı listede c ≥ x olan ilk öğe */
function altSinir(l: Hat[], x: number): number {
  let a = 0, b = l.length;
  while (a < b) { const m = (a + b) >> 1; if (l[m].c < x) a = m + 1; else b = m; }
  return a;
}
const icinde = (d: Kutu, i: Kutu, t: number) => i.x0 >= d.x0 - t && i.x1 <= d.x1 + t && i.y0 >= d.y0 - t && i.y1 <= d.y1 + t;
interface TabloAday { yatay: Hat[]; dikey: Hat[]; kutu: Kutu }
/** tablonun dış çizgileri kalın (çift dış kenarın içteki tablosu) */
function disKalin(a: TabloAday): void {
  const kal = (h: Hat) => { h.parca = h.parca.map((p) => ({ ...p, k: Math.max(p.k, KALIN + 0.3) })); };
  for (const h of a.yatay) if (Math.abs(h.c - a.kutu.y0) <= YAKIN || Math.abs(h.c - a.kutu.y1) <= YAKIN) kal(h);
  for (const v of a.dikey) if (Math.abs(v.c - a.kutu.x0) <= YAKIN || Math.abs(v.c - a.kutu.x1) <= YAKIN) kal(v);
}
/** değen / kesişen hatların bağlı bileşenleri; en az 2 yatay + 2 dikey hatlı, onay kutusundan büyük bileşen tablo. İçinde başka tablo olan dış
    kutu: iç çizgisi yoksa çerçevedir, atılır (tek tabloyu sıkıca sarıyorsa — çift dış kenar — o tablonun dış kenarı kalın); iç çizgisi varsa
    içindekilerin çizgileri kendi ızgarasına katılır */
function tablolariBul(H: Hat[], dikey: Hat[]): TabloAday[] {
  const V = [...dikey].sort((a, b) => a.c - b.c), uf = birlesim(H.length + V.length);
  H.forEach((h, i) => {
    for (let j = altSinir(V, h.a - YAKIN); j < V.length && V[j].c <= h.b + YAKIN; j++) {
      if (h.c >= V[j].a - YAKIN && h.c <= V[j].b + YAKIN) uf.bir(i, H.length + j);
    }
  });
  const gruplar = new Map<number, { yatay: Hat[]; dikey: Hat[] }>();
  const grup = (i: number) => { const k = uf.bul(i); let g = gruplar.get(k); if (!g) { g = { yatay: [], dikey: [] }; gruplar.set(k, g); } return g; };
  H.forEach((h, i) => grup(i).yatay.push(h));
  V.forEach((v, j) => grup(H.length + j).dikey.push(v));
  const adaylar: TabloAday[] = [];
  for (const g of gruplar.values()) {
    if (g.yatay.length < 2 || g.dikey.length < 2) continue;
    const kutu = {
      x0: Math.min(enAz(g.yatay.map((h) => h.a)), enAz(g.dikey.map((v) => v.c))), x1: Math.max(enCok(g.yatay.map((h) => h.b)), enCok(g.dikey.map((v) => v.c))),
      y0: Math.min(enAz(g.dikey.map((v) => v.a)), enAz(g.yatay.map((h) => h.c))), y1: Math.max(enCok(g.dikey.map((v) => v.b)), enCok(g.yatay.map((h) => h.c))),
    };
    if (kutu.x1 - kutu.x0 >= 20 && kutu.y1 - kutu.y0 >= 10) adaylar.push({ ...g, kutu });
  }
  const alan = (k: Kutu) => (k.x1 - k.x0) * (k.y1 - k.y0), atilan = new Set<TabloAday>();
  const sirali = adaylar.sort((p, q) => alan(q.kutu) - alan(p.kutu));
  for (const a of sirali) {
    if (atilan.has(a)) continue;
    const ic = sirali.filter((b) => b !== a && !atilan.has(b) && icinde(a.kutu, b.kutu, YAKIN));
    if (!ic.length) continue;
    if (a.yatay.length <= 2 && a.dikey.length <= 2) {
      atilan.add(a);
      const b = ic.length === 1 ? ic[0].kutu : null;
      if (b && b.x0 - a.kutu.x0 <= SIKI && a.kutu.x1 - b.x1 <= SIKI && b.y0 - a.kutu.y0 <= SIKI && a.kutu.y1 - b.y1 <= SIKI) disKalin(ic[0]);
    } else {
      /* iç çizgileri yalnız bir doğrultuda ve hiçbiri içteki tablolara değmiyorsa (sayfa kenarlığı + başlık ayırma çizgisi) yine çerçeve */
      const icY = a.yatay.filter((h) => Math.abs(h.c - a.kutu.y0) > YAKIN && Math.abs(h.c - a.kutu.y1) > YAKIN);
      const icD = a.dikey.filter((v) => Math.abs(v.c - a.kutu.x0) > YAKIN && Math.abs(v.c - a.kutu.x1) > YAKIN);
      const deger = (b: TabloAday) => icY.some((h) => h.c >= b.kutu.y0 - YAKIN && h.c <= b.kutu.y1 + YAKIN && h.a <= b.kutu.x1 + YAKIN && h.b >= b.kutu.x0 - YAKIN)
        || icD.some((v) => v.c >= b.kutu.x0 - YAKIN && v.c <= b.kutu.x1 + YAKIN && v.a <= b.kutu.y1 + YAKIN && v.b >= b.kutu.y0 - YAKIN);
      if ((!icY.length || !icD.length) && !ic.some(deger)) { atilan.add(a); continue; }
      for (const b of ic) { a.yatay.push(...b.yatay); a.dikey.push(...b.dikey); atilan.add(b); }
    }
  }
  return sirali.filter((a) => !atilan.has(a)).sort((p, q) => p.kutu.y0 - q.kutu.y0 || p.kutu.x0 - q.kutu.x0);
}

/* ── 3. IZGARA ── */
/** sıralı değerler eşikten yakınsa tek çizgi (uzunlukla ağırlıklı ortalama) */
function kumele(l: { v: number; w: number }[], esik: number): number[] {
  const s = [...l].sort((a, b) => a.v - b.v), out: number[] = [];
  let top = 0, ag = 0, son = -Infinity;
  for (const x of s) {
    if (ag && x.v - son > esik) { out.push(top / ag); top = 0; ag = 0; }
    const w = Math.max(x.w, 0.1);
    top += x.v * w; ag += w; son = x.v;
  }
  if (ag) out.push(top / ag);
  return out;
}
/** çizgi koordinatları; tablonun çizgisiz (açık) yanı da bir çizgi; sınırı aşarsa eşik büyür */
function koordinatlar(l: Hat[], uc0: number, uc1: number, sinir: number): number[] {
  for (let esik = INCE; ; esik *= 1.5) {
    const k = kumele(l.map((h) => ({ v: h.c, w: h.b - h.a })), esik);
    if (k.length && uc0 < k[0] - ACIK_YAN) k.unshift(uc0);
    if (k.length && uc1 > k[k.length - 1] + ACIK_YAN) k.push(uc1);
    if (k.length - 1 <= sinir || esik > 60) return k;
  }
}
/** çift çizgi ve kayık sınır: aralığı ≤ CIFT olan, arasına yazı merkezi düşmeyen komşu koordinatlar tek çizgi (ortası); birlesen — birleşen
    koordinatların yeni sırası */
function ciftBirlestir(k: number[], merkezler: number[]): { k: number[]; birlesen: Set<number> } {
  const out: number[] = [], birlesen = new Set<number>();
  for (const v of k) {
    const o = out[out.length - 1];
    if (out.length && v - o <= CIFT && !merkezler.some((m) => m > o && m < v)) { out[out.length - 1] = (o + v) / 2; birlesen.add(out.length - 1); } else out.push(v);
  }
  return { k: out, birlesen };
}
/** birleşen koordinattaki parçalar: aynı uzanımda başka çizgiyle (aralığı INCE'den geniş) örtüşen parça çift çizgidir — kalın kenar */
const ciftKalin = (l: Parca[]) => l.map((p) => {
  const o = l.filter((q) => Math.abs(q.c - p.c) > INCE);
  return o.length && ortu(o, p.a, p.b).oran >= ORTU ? { ...p, k: Math.max(p.k, KALIN + 0.3) } : p;
});
const yakinIndeks = (l: number[], v: number) => l.reduce((e, x, i) => (Math.abs(x - v) < Math.abs(l[e] - v) ? i : e), 0);
/** değerin aralığı: l[i] ≤ v < l[i + 1] (uçlarda sığdırılır) */
function aralik(l: number[], v: number): number {
  let i = 0;
  while (i < l.length - 2 && v >= l[i + 1]) i++;
  return i;
}
interface Ortu { oran: number; kalin: number }
/** parçaların a–b aralığını örtme oranı (birleşim) ve kalın parçaların örttüğü */
function ortu(l: Parca[], a: number, b: number): Ortu {
  if (b - a <= 0) return { oran: 1, kalin: 0 };
  const ic = l.map((p) => ({ x: Math.max(a, p.a), y: Math.min(b, p.b), k: p.k })).filter((p) => p.y > p.x).sort((p, q) => p.x - q.x);
  const uzunluk = (s: typeof ic) => { let t = 0, son = -Infinity; for (const p of s) { const bas = Math.max(p.x, son); if (p.y > bas) t += p.y - bas; son = Math.max(son, p.y); } return t; };
  return { oran: uzunluk(ic) / (b - a), kalin: uzunluk(ic.filter((p) => p.k > KALIN)) / (b - a) };
}
/** kenarın %60'ını örten çizgi yoksa iki hücre arası açık (birleşik) */
const acik = (o: Ortu) => o.oran < ORTU;
const kenarDegeri = (o: Ortu): HamKenar => (acik(o) ? 0 : o.kalin >= o.oran / 2 ? 2 : 1);

function sahipKur(l: Bolge[], R: number, C: number): number[][] {
  const s = Array.from({ length: R }, () => new Array<number>(C).fill(-1));
  l.forEach((b, i) => { for (let r = b.r; r < b.r + b.rs; r++) for (let c = b.c; c < b.c + b.cs; c++) s[r][c] = i; });
  return s;
}
const yeniBolge = (xs: number[], ys: number[], r: number, c: number, rs: number, cs: number): Bolge => ({
  r, c, rs, cs, kutu: { x0: xs[c], x1: xs[c + cs], y0: ys[r], y1: ys[r + rs] }, yazilar: [], resim: false, satirlar: [], metin: "", durum: "bos", sira: false, secenek: false,
  secenekBasligi: false, kapli: false,
});
function tabloKur(a: TabloAday, sayfalar: Sayfa[], yazilar: readonly Yazi[]): Tablo | null {
  const ic = yazilar.filter((y) => { const cx = y.x + y.g / 2, cy = y.y + y.h / 2; return cx >= a.kutu.x0 && cx <= a.kutu.x1 && cy >= a.kutu.y0 && cy <= a.kutu.y1; });
  const xb = ciftBirlestir(koordinatlar(a.dikey, enAz(a.yatay.map((h) => h.a)), enCok(a.yatay.map((h) => h.b)), SUTUN_EN_COK), ic.map((y) => y.x + y.g / 2));
  const yb = ciftBirlestir(koordinatlar(a.yatay, enAz(a.dikey.map((v) => v.a)), enCok(a.dikey.map((v) => v.b)), SATIR_EN_COK), ic.map((y) => y.y + y.h / 2));
  const xs = xb.k, ys = yb.k;
  if (xs.length < 2 || ys.length < 2) return null;
  const R = ys.length - 1, C = xs.length - 1;
  const yp: Parca[][] = ys.map(() => []), dp: Parca[][] = xs.map(() => []);
  for (const h of a.yatay) yp[yakinIndeks(ys, h.c)].push(...h.parca);
  for (const v of a.dikey) dp[yakinIndeks(xs, v.c)].push(...v.parca);
  for (const i of yb.birlesen) yp[i] = ciftKalin(yp[i]);
  for (const i of xb.birlesen) dp[i] = ciftKalin(dp[i]);
  const uf = birlesim(R * C);
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
    if (c + 1 < C && acik(ortu(dp[c + 1], ys[r], ys[r + 1]))) uf.bir(r * C + c, r * C + c + 1);
    if (r + 1 < R && acik(ortu(yp[r + 1], xs[c], xs[c + 1]))) uf.bir(r * C + c, (r + 1) * C + c);
  }
  const kumeler = new Map<number, number[]>();
  for (let i = 0; i < R * C; i++) { const k = uf.bul(i), l = kumeler.get(k); if (l) l.push(i); else kumeler.set(k, [i]); }
  const bolgeler: Bolge[] = [];
  for (const l of kumeler.values()) {
    const rr = l.map((i) => Math.floor(i / C)), cc = l.map((i) => i % C);
    const r0 = enAz(rr), r1 = enCok(rr), c0 = enAz(cc), c1 = enCok(cc);
    /* birleşik bölge dikdörtgense tek hücre; değilse hücreler tek tek (üst üste binme olmaz) */
    if (l.length === (r1 - r0 + 1) * (c1 - c0 + 1)) bolgeler.push(yeniBolge(xs, ys, r0, c0, r1 - r0 + 1, c1 - c0 + 1));
    else for (const i of l) bolgeler.push(yeniBolge(xs, ys, Math.floor(i / C), i % C, 1, 1));
  }
  bolgeler.sort((p, q) => p.r - q.r || p.c - q.c);
  const kutu = { x0: xs[0], x1: xs[C], y0: ys[0], y1: ys[R] };
  return { kutu, p: sayfaBul(sayfalar, kutu.y0), xs, ys, yp, dp, bolgeler, sahip: sahipKur(bolgeler, R, C), ustBitisik: false, solBitisik: false };
}
/** hücrenin kenarları; bitişik bandın üst / yarının sol kenarı 0 (ortak çizgiyi komşu çizer — belgede çift çizgi olmasın) */
const kenarlar = (t: Tablo, b: Bolge) => ({
  u: t.ustBitisik && b.r === 0 ? 0 : kenarDegeri(ortu(t.yp[b.r], t.xs[b.c], t.xs[b.c + b.cs])), a: kenarDegeri(ortu(t.yp[b.r + b.rs], t.xs[b.c], t.xs[b.c + b.cs])),
  s: t.solBitisik && b.c === 0 ? 0 : kenarDegeri(ortu(t.dp[b.c], t.ys[b.r], t.ys[b.r + b.rs])), g: kenarDegeri(ortu(t.dp[b.c + b.cs], t.ys[b.r], t.ys[b.r + b.rs])),
}) as { u: HamKenar; a: HamKenar; s: HamKenar; g: HamKenar };

/* ── BANTLAR: tek parça çizilmiş formun ayrı tablolara bölünmesi ── */
/** tablonun r0–r1 satırları × c0–c1 sütunları (bu aralığı kesen hücre yok); yalnız içinde kullanılan sütun / satır sınırları kalır */
function altTablo(t: Tablo, r0: number, r1: number, c0: number, c1: number): Tablo {
  const s = t.sahip, U = [c0], V = [r0], secilen = new Set<number>();
  for (let c = c0 + 1; c < c1; c++) { let k = false; for (let r = r0; r < r1 && !k; r++) k = s[r][c] !== s[r][c - 1]; if (k) U.push(c); }
  for (let r = r0 + 1; r < r1; r++) { let k = false; for (let c = c0; c < c1 && !k; c++) k = s[r][c] !== s[r - 1][c]; if (k) V.push(r); }
  U.push(c1); V.push(r1);
  for (let r = r0; r < r1; r++) for (let c = c0; c < c1; c++) secilen.add(s[r][c]);
  const iu = new Map(U.map((c, i) => [c, i])), iv = new Map(V.map((r, i) => [r, i]));
  const bolgeler = [...secilen].map((i) => t.bolgeler[i]).map((b): Bolge => ({
    ...b, r: iv.get(b.r)!, c: iu.get(b.c)!, rs: iv.get(b.r + b.rs)! - iv.get(b.r)!, cs: iu.get(b.c + b.cs)! - iu.get(b.c)!,
  })).sort((p, q) => p.r - q.r || p.c - q.c);
  const xs = U.map((c) => t.xs[c]), ys = V.map((r) => t.ys[r]);
  return {
    kutu: { x0: xs[0], x1: xs[xs.length - 1], y0: ys[0], y1: ys[ys.length - 1] }, p: t.p, xs, ys, yp: V.map((r) => t.yp[r]), dp: U.map((c) => t.dp[c]),
    bolgeler, sahip: sahipKur(bolgeler, V.length - 1, U.length - 1), ustBitisik: r0 > 0 || t.ustBitisik, solBitisik: c0 > 0 || t.solBitisik,
  };
}
/** yazının çoğu kalın mı */
const kalinMi = (b: Bolge) => {
  const y = b.satirlar.flatMap((s) => s.yazilar), top = y.reduce((t, x) => t + x.s.length, 0);
  return top > 0 && y.reduce((t, x) => t + (x.kalin ? x.s.length : 0), 0) / top > 0.5;
};
/** satırlara bölme — kesen hücre olmayan, iki yanında da yazı olan hatta: bütün genişlikteki başlık şeridinden önce, ya da sütun düzeninin değiştiği
    yerde başlayan başlık satırından (bütün hücreleri kalın / zeminli yazı) önce (üstteki satır başlık değilse); başlığın ardından içerik gelmeli
    (şerit değil). Bandı ikiye bölen, iki yanında başlık şeridi olan dikey hat yan yana iki tablo. */
function bantlaraBol(t: Tablo, zeminler: Zemin[]): Tablo[] {
  const R = t.ys.length - 1, C = t.xs.length - 1, s = t.sahip;
  const baslik = (b: Bolge) => b.durum === "yazi" && !b.resim && (kalinMi(b) || !!zeminBul(b.kutu, zeminler));
  const hucreleri = (r: number) => [...new Set(s[r])].map((i) => t.bolgeler[i]);
  const baslikSatiri = (r: number) => hucreleri(r).every((b) => b.r === r && baslik(b));
  const serit = (r: number) => { const l = hucreleri(r); return l.length === 1 && l[0].r === r && l[0].rs === 1 && baslik(l[0]); };
  const sinirlar = (r: number) => s[r].flatMap((i, c) => (c > 0 && i !== s[r][c - 1] ? [c] : [])).join(",");
  const tamCizgi = (k: number) => s[k].every((i, c) => i !== s[k - 1][c]);
  const yaziVar = (r0: number, r1: number) => { for (let r = r0; r < r1; r++) if (s[r].some((i) => t.bolgeler[i].durum === "yazi")) return true; return false; };
  /* numaralı listenin grup alt başlığı ("A. MEKANİK AKSAM"): şeridin üstü ve altı aynı sütun düzeninde, aynı sütunda sıra numaralı — liste bölünmez */
  const numara = (r: number) => s[r].findIndex((i) => { const b = t.bolgeler[i]; return b.durum === "yazi" && tamSayiMi(b.metin); });
  const listeIci = (k: number) => k > 0 && k + 1 < R && sinirlar(k - 1) === sinirlar(k + 1) && numara(k + 1) >= 0
    && (numara(k - 1) === numara(k + 1) || baslikSatiri(k - 1));
  const kesim = [0];
  for (let k = 1; k + 1 < R; k++) {
    if (!tamCizgi(k) || serit(k + 1) || (serit(k) && listeIci(k))) continue;
    if (!serit(k) && !(baslikSatiri(k) && !baslikSatiri(k - 1) && sinirlar(k) !== sinirlar(k - 1))) continue;
    if (yaziVar(kesim[kesim.length - 1], k) && yaziVar(k, R)) kesim.push(k);
  }
  kesim.push(R);
  const bantlar = kesim.length > 2 ? kesim.slice(0, -1).map((r0, i) => altTablo(t, r0, kesim[i + 1], 0, C)) : [t];
  return bantlar.flatMap((b) => {
    const BR = b.ys.length - 1, BC = b.xs.length - 1, ilk = (c: number) => b.bolgeler[b.sahip[0][c]];
    /* yarıların her biri en az iki sütunlu (şerit sütunları birleştirir) — iki sütunlu tablonun başlık satırı yarı değildir */
    for (let c = 2; c < BC - 1; c++) {
      if (!b.sahip.every((x) => x[c] !== x[c - 1])) continue;
      const sol = ilk(0), sag = ilk(c);
      if (sol.c !== 0 || sol.cs !== c || sol.rs !== 1 || sag.c !== c || sag.cs !== BC - c || sag.rs !== 1 || !baslik(sol) || !baslik(sag)) continue;
      return [altTablo(b, 0, BR, 0, c), altTablo(b, 0, BR, c, BC)];
    }
    return [b];
  });
}

/* ── 4. YAZILAR ── */
/** satır içi parçalar soldan sağa: araları açıksa boşlukla (aynı yere iki kez basılan yazı — kalın taklidi — bir kez, kalın) */
function satirYap(l: Yazi[]): YaziSatiri {
  const s = [...l].sort((a, b) => a.x - b.x), tek: Yazi[] = [];
  for (const y of s) {
    const o = tek[tek.length - 1];
    if (o && o.s === y.s && Math.abs(o.x - y.x) < 1.5) { tek[tek.length - 1] = { ...o, kalin: true }; continue; }
    tek.push(y);
  }
  let metin = "", son = -Infinity;
  for (const y of tek) {
    if (metin && !/\s$/.test(metin) && !/^\s/.test(y.s) && y.x - son > 0.15 * y.boy) metin += " ";
    metin += y.s; son = Math.max(son, y.x + y.g);
  }
  return {
    yazilar: tek, x0: enAz(tek.map((y) => y.x)), x1: enCok(tek.map((y) => y.x + y.g)), y0: enAz(tek.map((y) => y.y)), y1: enCok(tek.map((y) => y.y + y.h)),
    taban: enCok(tek.map((y) => y.y + y.h)), boy: enCok(tek.map((y) => y.boy)), metin: metin.replace(/\s+/g, " ").trim(), p: tek[0].p,
  };
}
/** yazılar satırlara: taban farkı yarım boydan azsa aynı satır */
function satirlar(l: Yazi[]): YaziSatiri[] {
  const s = [...l].sort((a, b) => a.p - b.p || a.y + a.h - (b.y + b.h) || a.x - b.x), gruplar: { taban: number; boy: number; l: Yazi[] }[] = [];
  for (const y of s) {
    const g = gruplar[gruplar.length - 1], taban = y.y + y.h;
    if (g && g.l[0].p === y.p && Math.abs(taban - g.taban) < Math.max(y.boy, g.boy) / 2) { g.l.push(y); g.boy = Math.max(g.boy, y.boy); } else gruplar.push({ taban, boy: y.boy, l: [y] });
  }
  return gruplar.map((g) => satirYap(g.l)).filter((x) => x.metin);
}
/** ağırlıklı en sık değer */
function enSik<T>(l: [T, number][]): T | undefined {
  const m = new Map<T, number>();
  for (const [x, w] of l) m.set(x, (m.get(x) ?? 0) + w);
  let en: T | undefined, ag = -1;
  for (const [x, w] of m) if (w > ag) { en = x; ag = w; }
  return en;
}
/** yazının hücredeki yeri: satır satır sol / sağ boşluk karşılaştırılır (hücreyi dolduran satır oy vermez) */
function hizaBul(l: YaziSatiri[], x0: number, x1: number): "sol" | "orta" | "sag" {
  const oy = { sol: 0, orta: 0, sag: 0 };
  for (const s of l) {
    const sol = s.x0 - x0, sag = x1 - s.x1, w = s.metin.length || 1;
    if (sol + sag < 6 || s.x1 - s.x0 > 0.8 * (x1 - x0)) continue;
    if (Math.abs(sol - sag) <= Math.max(2.5, 0.2 * (sol + sag))) oy.orta += w; else if (sag < sol) oy.sag += w; else oy.sol += w;
  }
  return oy.orta > oy.sol && oy.orta >= oy.sag ? "orta" : oy.sag > oy.sol ? "sag" : "sol";
}
const kesisim = (a: Kutu, b: Kutu) => Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)) * Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0));
/** kutunun %60'ını örten son (üstte kalan) dolgunun rengi; beyaza yakınsa zemin yok */
function zeminBul(k: Kutu, l: Zemin[]): string {
  const alan = (k.x1 - k.x0) * (k.y1 - k.y0);
  if (alan <= 0) return "";
  for (let i = l.length - 1; i >= 0; i--) if (kesisim(k, l[i]) >= ORTU * alan) return acikRenk(l[i].renk) ? "" : l[i].renk;
  return "";
}
interface Gorunum { kalin: boolean; egik: boolean; hiza: "sol" | "orta" | "sag"; boy: number }
function gorunum(l: YaziSatiri[], x0: number, x1: number, belgeBoy: number): Gorunum {
  const y = l.flatMap((s) => s.yazilar), top = y.reduce((t, x) => t + x.s.length, 0) || 1;
  const boy = enSik(y.map((x): [number, number] => [yarim(x.boy), x.s.length])) ?? 0;
  return {
    kalin: y.reduce((t, x) => t + (x.kalin ? x.s.length : 0), 0) / top > 0.5, egik: y.reduce((t, x) => t + (x.egik ? x.s.length : 0), 0) / top > 0.5,
    hiza: hizaBul(l, x0, x1), boy: boy === belgeBoy ? 0 : boy,
  };
}
/** yazı tipi ailesi → belgenin yazı tipi */
export function yaziTipi(aile: string): YaziTipi {
  const a = aile.toLowerCase().replace(/[\s_-]/g, "");
  if (/arial|helvetica|liberationsans|verdana|tahoma|arimo/.test(a)) return "arimo";
  if (/times|georgia|garamond|tinos/.test(a) || (/serif/.test(a) && !/sans/.test(a))) return "tinos";
  return "carlito";
}

/* ── 8. HÜCRE TÜRÜ ── */
const SONUC_SOZCUGU = /(sartli\s+uygundur|uygun\s+degildir|uygundur)/g;
/** "… UYGUNDUR / UYGUN DEĞİLDİR" ile biten yazı: sözcükten önceki kısım ve seçenekler (formun yazımıyla) */
function sonucAyir(metin: string): { onceki: string; secenekler: string[] } | null {
  const k = katlaKonumlu(metin), l: { i: number; n: number; tur: "u" | "ud" | "s" }[] = [];
  for (const m of k.matchAll(SONUC_SOZCUGU)) {
    const i = m.index ?? 0, n = m[0].length;
    if ((i > 0 && k[i - 1] !== " ") || (i + n < k.length && k[i + n] !== " ")) continue;
    l.push({ i, n, tur: m[0].startsWith("sartli") ? "s" : m[0].startsWith("uygundur") ? "u" : "ud" });
  }
  for (let j = 0; j < l.length; j++) {
    const kuyruk = k.slice(l[j].i).replace(SONUC_SOZCUGU, " ").replace(/\b(veya|ya da|ve|ile)\b/g, " ");
    if (kuyruk.trim()) continue;
    const onceki = metin.slice(0, l[j].i).replace(/[\s:/\\|\-–—☐□■▢()[\]]+$/u, "").trim();
    const ozgun = (t: "u" | "ud" | "s") => { const x = l.slice(j).find((y) => y.tur === t); return x ? metin.slice(x.i, x.i + x.n).replace(/\s+/g, " ") : ""; };
    const u = ozgun("u"), ud = ozgun("ud"), s = ozgun("s"), ornek = u || ud || s;
    const buyuk = ornek === ornek.toLocaleUpperCase("tr"), bas = /^\p{Lu}/u.test(ornek);
    const yaz = (b: string, kucuk: string, baslik: string) => b || (buyuk ? kucuk.toLocaleUpperCase("tr") : bas ? baslik : kucuk);
    const secenekler = [yaz(u, "uygundur", "Uygundur"), yaz(ud, "uygun değildir", "Uygun Değildir"), ...(s ? [s] : [])];
    return { onceki, secenekler };
  }
  return null;
}
/** etiketten alanın adı ve değer türü: birim parantezi atılır; birimli ya da ölçü sözcüklü → sayı, tarih → tarih */
function alanBilgisi(et: string): { metin: string; alan: HucreAlanTuru; birim: string } {
  const tek = et.replace(/\s+/g, " ").trim(), m = tek.match(BIRIM);
  const birim = m ? m[1].replace(/\s+/g, "") : "";
  const metin = (m ? tek.replace(m[0], " ") : tek).replace(/\s+/g, " ").replace(/[\s:]+$/, "").trim();
  const k = katla(metin), kelimeler = k.split(" ");
  if (birim || SAYI_KOKLERI.some((kok) => kelimeler.some((w) => kelimeUyar(w, kok)))) return { metin, alan: "sayi", birim };
  if (kelimeler.some((w) => w.startsWith("tarih"))) return { metin, alan: "tarih", birim: "" };
  return { metin, alan: "metin", birim: "" };
}
/** kontrol cevabı açıklaması ("U: Uygun  UD: Uygun Değil  X: …"): kodlar (olumlu, olumsuz, ötekiler) ve sınıfları */
interface Aciklama { kodlar: string[]; sinif: Map<string, "olumlu" | "olumsuz" | "oteki"> }
function aciklamaBul(metinler: string[]): Aciklama | null {
  const sinifi = (a: string) => { const k = katla(a); return /^(uygun degil|uygunsuz|kusurlu|uymaz|olumsuz)/.test(k) ? "olumsuz" : /^(uygun|olumlu|kusursuz)/.test(k) ? "olumlu" : "oteki"; };
  for (const m of metinler) {
    const l = [...m.matchAll(/(^|[\s(,;/|])([A-ZÇĞİÖŞÜ]{1,3}|N\/A)\s*[:=]\s*/g)].map((x) => ({ kod: x[2], bas: (x.index ?? 0) + x[1].length, son: (x.index ?? 0) + x[0].length }));
    if (l.length < 2) continue;
    const ciftler = l.map((x, i) => {
      const ack = m.slice(x.son, i + 1 < l.length ? l[i + 1].bas : m.length).replace(/[\s,;/|)\-–]+$/, "").trim();
      return { kod: x.kod, sinif: sinifi(ack) as "olumlu" | "olumsuz" | "oteki" };
    });
    const olumlu = ciftler.find((x) => x.sinif === "olumlu"), olumsuz = ciftler.find((x) => x.sinif === "olumsuz");
    if (!olumlu || !olumsuz) continue;
    const kodlar = [...new Set([olumlu.kod, olumsuz.kod, ...ciftler.map((x) => x.kod)])].slice(0, 6);
    return { kodlar, sinif: new Map(ciftler.map((x) => [x.kod, x.sinif])) };
  }
  return null;
}
/** kodları olumlu, olumsuz, ötekiler diye sıralar (sınıflar açıklamadan, yoksa bilinen kısaltmalardan; ikisi birden yoksa sıra aynen) */
function kodSirala(kodlar: string[], ack: Aciklama | null): string[] {
  const sinif = (x: string) => ack?.sinif.get(x) ?? (OLUMLU.test(katla(x)) ? "olumlu" : OLUMSUZ.test(katla(x)) ? "olumsuz" : "oteki");
  const u = kodlar.find((x) => sinif(x) === "olumlu"), ud = kodlar.find((x) => sinif(x) === "olumsuz");
  return (u && ud ? [u, ud, ...kodlar.filter((x) => x !== u && x !== ud)] : kodlar).slice(0, 6);
}
const bosHucre = (): HamHucre => ({
  metin: "", tur: "yazi", sutunBirlesim: 1, satirBirlesim: 1, kaynak: "yok", alan: "metin", birim: "", secenekler: [], formul: "", kim: "yok", gorsel: "logo",
  kalin: false, egik: false, hiza: "sol", zemin: "", boy: 0,
});
const tamSayiMi = (m: string) => /^\d{1,3}[.)]?$/.test(m.trim());
/** bölümün adı: ilk satır, 60 karakteri aşarsa sözcük sınırından kısalır */
function ilkSatir(m: string): string {
  const s = (m.split("\n").find((x) => x.trim()) ?? "").replace(/\s+/g, " ").trim();
  if (s.length <= 60) return s;
  const k = s.slice(0, 61), son = k.lastIndexOf(" ");
  return (son > 20 ? k.slice(0, son) : s.slice(0, 60)).replace(/[\s/\\|:;,.\-–—]+$/, "").trim();
}

interface Belge { boy: number; aciklama: Aciklama | null; zeminler: Zemin[] }
/** hücrelerin yazıları: satırlar, metin, durum */
function yaziHazirla(t: Tablo): void {
  for (const b of t.bolgeler) {
    b.satirlar = satirlar(b.yazilar);
    b.metin = b.satirlar.map((s) => s.metin).join("\n");
    /* yalnız nokta / alt çizgi (doldurma çizgisi) boş; yalnız iki nokta işaret */
    b.durum = !b.metin.trim() || /^[\s._…\-–—]+$/.test(b.metin) ? "bos" : /^[\s:]+$/.test(b.metin) ? "isaret" : "yazi";
    if (b.durum === "bos") b.metin = "";
  }
}
/** tablonun hücre bilgisi: sıra numaraları, yan yana kontrol cevabı sütunları */
function tabloHazirla(t: Tablo): string[] {
  const R = t.ys.length - 1, C = t.xs.length - 1;
  const bosMu = (b: Bolge) => b.durum === "bos" && !b.resim;
  const maddeli = (r: number, haric: (c: number) => boolean) => t.sahip[r].some((i, c) => !haric(c) && t.bolgeler[i].durum === "yazi" && !tamSayiMi(t.bolgeler[i].metin));
  /* yan yana kontrol cevabı sütunları (U | UD | X): altlarındaki boş hücreler, satırda madde varsa, tek cevap hücresi */
  let kodlar: string[] = [];
  for (let n = 0; n < t.bolgeler.length; n++) {
    const h = t.bolgeler[n];
    if (h.cs !== 1 || h.durum !== "yazi" || !SECENEK.test(katla(h.metin))) continue;
    const dizi = [h];
    for (let c = h.c + 1; c < C; c++) {
      const x = t.bolgeler[t.sahip[h.r][c]];
      if (x.r !== h.r || x.rs !== h.rs || x.cs !== 1 || x.durum !== "yazi" || !SECENEK.test(katla(x.metin))) break;
      dizi.push(x);
    }
    if (dizi.length < 2) continue;
    /* başlıklar ("UYGUNDUR" | "UYGUN DEĞİLDİR" de olabilir) sonuç cümlesi değildir */
    dizi.forEach((x) => { x.secenekBasligi = true; });
    const k = dizi.length, birlesen = new Set<Bolge>(), yeni: Bolge[] = [];
    for (let r = h.r + h.rs; r < R;) {
      const l = Array.from({ length: k }, (_, e) => t.bolgeler[t.sahip[r][h.c + e]]);
      /* grup alt başlığı (seçenek sütunlarını da kaplayan şerit) atlanır */
      if (l.every((x) => x === l[0]) && l[0].cs > 1 && l[0].r === r && l[0].durum === "yazi") { r += l[0].rs; continue; }
      if (l.every((x) => x.r === r && x.cs === 1 && x.rs === l[0].rs && bosMu(x))) {
        if (maddeli(r, (c) => c >= h.c && c < h.c + k)) {
          l.forEach((x) => birlesen.add(x));
          yeni.push({ ...yeniBolge(t.xs, t.ys, r, h.c, l[0].rs, k), secenek: true });
        }
        r += l[0].rs;
      } else if (l.some((x) => !bosMu(x))) break;
      else r++;
    }
    if (!yeni.length) continue;
    if (!kodlar.length) kodlar = dizi.map((x) => x.metin.replace(/\s+/g, " ").trim().slice(0, 40));
    t.bolgeler = [...t.bolgeler.filter((x) => !birlesen.has(x)), ...yeni].sort((p, q) => p.r - q.r || p.c - q.c);
    t.sahip = sahipKur(t.bolgeler, R, C);
    n = t.bolgeler.indexOf(h);
  }
  /* sütunda art arda tamsayılar (1, 2, 3 …) sıra numarası */
  for (let c = 0; c < C; c++) {
    let dizi: Bolge[] = [], son = -1;
    const bitir = () => { if (dizi.length >= 2) dizi.forEach((x) => { x.sira = true; }); dizi = []; };
    for (let r = 0; r < R;) {
      const x = t.bolgeler[t.sahip[r][c]];
      if (x.r === r && x.c === c && x.durum === "yazi" && tamSayiMi(x.metin)) {
        const v = parseInt(x.metin, 10);
        if (!dizi.length || v !== son + 1) { bitir(); }
        dizi.push(x); son = v;
      } else bitir();
      r = x.r + x.rs > r ? x.r + x.rs : r + 1;
    }
    bitir();
  }
  /* seçenekleri yazılı cevap hücresi ("☐ Uygun ☐ Uygun Değil", her satırda "UYGUNDUR / UYGUN DEĞİLDİR"): madde satırında (sıra no'lu ya da sütunda
     birden çok); altı boş olan başlıktır (altındaki cevap hücrelerinin) */
  const adaylar = t.bolgeler.flatMap((b) => { const l = b.durum === "yazi" && !b.sira && !b.secenekBasligi ? secenekYazisi(b.metin) : null; return l ? [{ b, l }] : []; });
  for (const { b, l } of adaylar) {
    const alt = b.r + b.rs < R ? t.bolgeler[t.sahip[b.r + b.rs][b.c]] : null;
    if (alt && bosMu(alt)) continue;
    const siraSatiri = t.sahip[b.r].some((i) => t.bolgeler[i].sira);
    if (!(siraSatiri || adaylar.filter((x) => x.b.c === b.c).length >= 2) || !maddeli(b.r, (c) => c >= b.c && c < b.c + b.cs)) continue;
    b.secenek = true;
    if (!kodlar.length) kodlar = l.map((x) => x.slice(0, 40));
  }
  return kodlar;
}
/** kutu işaretleri (çizilmiş kutunun yazı karşılığı: ☐ □ ❑, "[ ]", ZapfDingbats'ın "q" / "o" / "n", Wingdings'in özel alanı) */
const KUTU_ISARETI = /[☐☑☒□▢■◻◼❑❒○◯●✓✔✗✘\uf000-\uf0ff]|\[\s*[xX✓]?\s*\]|\(\s*\)/gu;
const SECENEK_IFADELERI = ["sartli uygundur", "uygun degildir", "uygun degil", "uygundur", "uygunsuz", "uygun", "kusursuz", "kusurlu", "uymaz", "gecmez", "gecer",
  "evet", "hayir", "var", "yok", "nok", "ok", "ud", "na", "u", "x", "e", "h"];
/** hücre yalnız kontrol seçeneklerinden oluşuyorsa (kutu işaretleri, ayraçlar, "veya" atılır) seçenekler — formun yazımıyla; en az iki farklı */
function secenekYazisi(metin: string): string[] | null {
  const temiz = metin.replace(/\n/g, " ").replace(KUTU_ISARETI, " ").replace(/(^|\s)[qon¨](?=\s|$)/g, "$1 ");
  const k = katlaKonumlu(temiz), l: string[] = [];
  for (let i = 0; i < k.length;) {
    if (k[i] === " ") { i++; continue; }
    const dolgu = ["veya", "ya da", "ile"].find((x) => k.startsWith(x, i) && (k[i + x.length] ?? " ") === " ");
    if (dolgu) { i += dolgu.length; continue; }
    const x = SECENEK_IFADELERI.find((f) => k.startsWith(f, i) && (k[i + f.length] ?? " ") === " ");
    if (!x) return null;
    l.push(temiz.slice(i, i + x.length).replace(/\s+/g, " "));
    i += x.length;
  }
  return l.length >= 2 && new Set(l.map(katla)).size === l.length ? l : null;
}
/** sonucu saklanan işlev (tablonun çevirisi boyunca aynı girdiye aynı sonuç — satır / sütun taramaları bir kez) */
function ezber<K, V>(f: (k: K) => V): (k: K) => V {
  const m = new Map<K, V>();
  return (k) => { if (!m.has(k)) m.set(k, f(k)); return m.get(k) as V; };
}
/** iki bilgi soran etiket ("Marka / Model", "Unvanı-Diploma No"): eğik çizgi ya da tireden iki parçanın ikisi de ayrı bir kayıt bilgisiyse ikisi
    ("E-posta" gibi tek bilgi bölünmez — parçası sözlükte yok) */
function ikiBilgi(et: string, bul: (s: string) => TabloKaynagi | null): [TabloKaynagi, TabloKaynagi, string, string] | null {
  const l = et.replace(/\s+/g, " ").split(/\s*[/\-–]\s*/).map((x) => x.trim()).filter(Boolean);
  if (l.length !== 2) return null;
  const a = bul(l[0]), b = bul(l[1]);
  return a && b && a !== b ? [a, b, l[0], l[1]] : null;
}
/** sütunu ortasından ikiye böler (çizgisiz sınır): sütunu kaplayan hücreler bir sütun genişler, sağındakiler kayar */
function sutunBol(t: Tablo, c: number): void {
  t.xs.splice(c + 1, 0, (t.xs[c] + t.xs[c + 1]) / 2);
  t.dp.splice(c + 1, 0, []);
  for (const b of t.bolgeler) { if (b.c > c) b.c++; else if (b.c + b.cs > c) b.cs++; }
  t.sahip = sahipKur(t.bolgeler, t.ys.length - 1, t.xs.length - 1);
}
function tabloyaCevir(t: Tablo, belge: Belge, ad: string, secenekKodlari: string[], bolundu = false): HamBolum {
  const R = t.ys.length - 1, C = t.xs.length - 1, bl = t.bolgeler, sahip = t.sahip;
  const yazili = (x: Bolge) => x.durum === "yazi" && !x.sira;
  /** sütunun başlık hücresi: yukarıdaki ilk yazılı hücre; tablonun bütün genişliğindeki şerit ve soldaki en az iki sütunu da kaplayan grup alt
      başlığı ("No | Madde"nin üstündeki "A. MEKANİK AKSAM") sütunun başlığı değildir — geçilir (2026-10-24, ikinci denetim); etiket + değer
      sütunlarını kaplayan başlık ("KONTROLÜ YAPAN" imza tablosunda) başlıktır */
  const baslikHucresi = ezber((b: Bolge): Bolge | null => {
    for (let r = b.r - 1; r >= 0;) {
      const x = bl[sahip[r][b.c]];
      if (yazili(x) && !((x.cs >= C && C > 1) || (x.cs > b.cs && b.c - x.c >= 2))) return x;
      r = x.r - 1;
    }
    return null;
  });
  const sutunBasligi = (b: Bolge) => baslikHucresi(b)?.metin ?? "";
  const satirEtiketi = (b: Bolge) => { for (let c = 0; c < C; c++) { const x = bl[sahip[b.r][c]]; if (yazili(x)) return x.metin; } return ""; };
  const soldakiEtiket = ezber((b: Bolge) => { for (let c = b.c - 1; c >= 0; c--) { const x = bl[sahip[b.r][c]]; if (yazili(x)) return x.metin; } return ""; });
  const maddeli = ezber((r: number) => sahip[r].some((i) => bl[i].durum === "yazi" && !bl[i].sira && !tamSayiMi(bl[i].metin)));
  /** kontrol cevabı sütununun başlığı ("Sonuç", "U / UD"): sütunda yukarı doğru, şeritler ve soldaki sütunları da kaplayan grup alt başlıkları
      geçilerek; başka bir başlıkta durulur */
  const cevapBasligiBul = ezber((b: Bolge): string => {
    for (let r = b.r - 1; r >= 0;) {
      const x = bl[sahip[r][b.c]], serit = (x.cs >= C && C > 1) || (x.cs > b.cs && x.c < b.c);
      if (yazili(x)) { if (!serit && CEVAP_BASLIGI.test(katla(x.metin))) return x.metin; if (!serit) return ""; }
      r = x.r - 1;
    }
    return "";
  });
  const cevapSutunu = ezber((b: Bolge) => b.durum === "bos" && maddeli(b.r) && !!cevapBasligiBul(b));
  /** madde / cevap satırı: sıra no ya da kontrol cevabı hücresi var — yazıları başlık sayılmaz (imza tablosu da sanılmaz) */
  const listeSatiri = ezber((r: number) => sahip[r].some((i) => bl[i].sira || bl[i].secenek || cevapSutunu(bl[i])));
  /** imza / kişi için sütun başlığı (katlanmış): madde satırındaki yazı başlık değildir */
  const kisiBasligi = (b: Bolge) => { const x = baslikHucresi(b); return x && !listeSatiri(x.r) ? katla(x.metin) : ""; };
  const listeTablosu = bl.some((b) => b.sira || b.secenek || cevapSutunu(b));
  const imzaTablosu = !listeTablosu && bl.some((b) => b.durum === "bos" && IMZA_TABLOSU.test(kisiBasligi(b)));
  /** sütun başlığının altında art arda boş, solunda etiketi olmayan hücreler (çok satırlı liste): sayısı ve kaçıncısı */
  const listeYeri = (b: Bolge) => {
    const uyar = (x: Bolge) => x.durum === "bos" && !x.resim && !x.secenek && x.c === b.c && x.cs === b.cs && !soldakiEtiket(x);
    let i = 1, n = 1;
    for (let r = b.r - 1; r >= 0;) { const x = bl[sahip[r][b.c]]; if (!uyar(x)) break; i++; n++; r = x.r - 1; }
    for (let r = b.r + b.rs; r < R;) { const x = bl[sahip[r][b.c]]; if (!uyar(x)) break; n++; r = x.r + x.rs; }
    return { n, i };
  };
  const zeminler = belge.zeminler.filter((z) => kesisim(z, t.kutu) > 0);
  const govde = belge.boy > 0 ? belge.boy : 9;
  /** başlıklı kutuda kutudan çok kısa tek yazı (hazır cümle): sahada değiştirilen alan, yazı alanın hazır değeri */
  const notKutusu = (b: Bolge) => {
    const ust = b.r > 0 ? bl[sahip[b.r - 1][b.c]] : null, yk = b.kutu.y1 - b.kutu.y0;
    const yaziYuk = enCok(b.satirlar.map((s) => s.y1)) - enAz(b.satirlar.map((s) => s.y0));
    return !!ust && yazili(ust) && (kalinMi(ust) || !!zeminBul(ust.kutu, zeminler)) && !kalinMi(b) && yk * MM >= 10 && yaziYuk < 0.4 * yk
      && b.metin.length >= 15 && !listeSatiri(b.r) && sahip[b.r].every((i) => bl[i] === b || bl[i].durum !== "yazi");
  };
  /** başlık satırı: hücreleri yazılı ya da boş, yazılılar en az iki ve boşlardan çok (sol üst köşe ya da grup sütunu boş olabilir) */
  const baslikSatiri = ezber((r: number) => {
    const l = [...new Set(sahip[r])].map((i) => bl[i]), y = l.filter(yazili).length;
    return y >= 2 && y > l.length - y && l.every((x) => x.r === r && (yazili(x) || (x.durum === "bos" && !x.resim)));
  });
  /** başlık satırındaki boş hücre (öteki en az üç hücre kalın / zeminli yazı): sahada doldurulmaz */
  const baslikBosu = (b: Bolge) => {
    const l = [...new Set(sahip[b.r])].map((i) => bl[i]).filter((x) => x !== b);
    return l.length >= 3 && l.every((x) => x.r === b.r && yazili(x) && (kalinMi(x) || !!zeminBul(x.kutu, zeminler)));
  };
  /* Excel'in "tüm kenarlıklar" ızgarası: etiketin hemen sağındaki art arda boş hücreler (sütun başlığı yok) tek değer hücresi — iki bilgi / saat
     isteyen etiket bugünkü gibi bölünür (2026-10-24, ikinci denetim) */
  const emilen = new Set<Bolge>(), uzat = new Map<Bolge, Bolge>();
  if (!imzaTablosu) for (const b of bl) {
    if (emilen.has(b) || b.c === 0 || b.durum !== "bos" || b.resim || b.secenek || b.kapli || listeSatiri(b.r) || baslikHucresi(b)) continue;
    const sol = bl[sahip[b.r][b.c - 1]];
    if (!yazili(sol) || /\bsaat/.test(katla(sol.metin)) || ikiBilgi(sol.metin, kayitKaynagi)) continue;
    let son = b;
    for (let c = b.c + b.cs; c < C;) {
      const x = bl[sahip[b.r][c]];
      if (x.r !== b.r || x.rs !== b.rs || x.durum !== "bos" || x.resim || x.secenek || baslikHucresi(x)) break;
      emilen.add(x); son = x; c = x.c + x.cs;
    }
    if (son !== b) uzat.set(b, son);
  }
  const kullanilan = new Map<number, Set<TabloKaynagi>>(), bolunecek = new Set<number>();
  let cevapBasligi = "";

  const satirlarOut: HamSatir[] = t.ys.slice(0, R).map((y, r) => ({ tekrar: false, yukseklik: mm(t.ys[r + 1] - y), hucreler: [] }));
  for (const b of bl) {
    if (emilen.has(b)) continue;
    const son = uzat.get(b);
    const h: HamHucre = { ...bosHucre(), sutunBirlesim: son ? son.c + son.cs - b.c : b.cs, satirBirlesim: b.rs,
      kenar: son ? { ...kenarlar(t, b), g: kenarlar(t, son).g } : kenarlar(t, b), zemin: zeminBul(b.kutu, zeminler) };
    if (b.satirlar.length) Object.assign(h, gorunum(b.satirlar, b.kutu.x0, b.kutu.x1, belge.boy));
    let ikinci: HamHucre | null = null;
    if (b.resim) Object.assign(h, { tur: "gorsel", gorsel: "logo" });
    else if (b.sira) h.tur = "sira";
    else if (b.secenek) h.tur = "cevap";
    else if (b.durum === "yazi") {
      /* madde / cevap satırındaki "… uygundur" maddedir, raporun sonucu değil (2026-10-24, ikinci denetim) */
      const s = b.secenekBasligi || listeSatiri(b.r) ? null : sonucAyir(b.metin);
      if (s) Object.assign(h, { tur: "sonuc", metin: s.onceki, secenekler: s.secenekler });
      else if (notKutusu(b)) Object.assign(h, { tur: "alan", alan: "metin", metin: "", formul: `"${b.metin.replace(/["“”„]/g, "'").replace(/\s+/g, " ").trim()}"` });
      else h.metin = b.metin;
    } else if (b.durum === "isaret") h.metin = b.metin.trim();
    else {
      const bas = sutunBasligi(b), kb = katla(bas), kis = kisiBasligi(b), kse = katla(satirEtiketi(b));
      /* gövde yazısından alçak / dar hücre (çift çizginin arası, kayık sınır şeridi) sahada doldurulmaz; taşan yazının üstünden geçtiği hücre de */
      const dar = b.kutu.y1 - b.kutu.y0 < 0.8 * govde || b.kutu.x1 - b.kutu.x0 < govde;
      /* imza tablosunda birkaç satırlık boş kutu (imza / kaşe yeri) da imza; kişi sütunun başlığından */
      const kutuImza = imzaTablosu && !!kis && (b.rs >= 3 || (b.kutu.y1 - b.kutu.y0) * MM >= 20);
      if (b.kapli || dar || baslikBosu(b)) { /* boş yazı */ }
      else if (/^((kase|muhur) )?imza/.test(kse) || /imza/.test(kis) || kutuImza) Object.assign(h, { tur: "imza", kim: kimBul(kis) ?? kimBul(kse) ?? "uzman" });
      else if (cevapSutunu(b)) { h.tur = "cevap"; cevapBasligi ||= cevapBasligiBul(b); }
      else if (maddeli(b.r) && SIRA_BASLIGI.test(kb)) h.tur = "sira";
      else {
        const sol = soldakiEtiket(b), et = sol || bas, bh = baslikHucresi(b);
        /* ölçüm çizelgesi (satır etiketi × birimli sütun başlığı): ad "satır · sütun", değer türü ve birim sütun başlığından (2026-10-24, ikinci
           denetim — satır etiketi öncelikliydi, bir satırın bütün değerleri aynı adı alıyordu) */
        const olcum = !!sol && !!bh && !imzaTablosu && !IMZA_TABLOSU.test(kis) && !listeSatiri(bh.r) && baslikSatiri(bh.r) && !kayitKaynagi(sol);
        if (olcum) {
          const as = alanBilgisi(sol), ab = alanBilgisi(bas), tur = ab.alan !== "metin" || ab.birim ? ab : as;
          Object.assign(h, { tur: "alan", metin: `${as.metin} · ${ab.metin}`, alan: tur.alan, birim: tur.birim });
        } else if (et) {
          /* imza bilgisi (adı, unvanı …) yalnız imza başlığının altındaki hücrede; kişi o başlıktan */
          const imzaAlti = IMZA_TABLOSU.test(kis);
          const bul = (e: string) => { const x = imzaAlti ? imzaKaynagi(e, kimBul(kis) ?? "uzman") : null; return x?.kaynak ?? (x?.bulundu ? null : kayitKaynagi(e)); };
          /* çok satırlı listenin sütun başlığı (ölçüm cihazları: marka, seri no …) ekipmanın kaydı değildir — her satır ayrı alan */
          const liste = !sol ? listeYeri(b) : { n: 1, i: 1 };
          const iki = liste.n === 1 ? ikiBilgi(et, bul) : null;
          /* tek sütunluk hücre ikiye bölünecekse önce sütunu bölünür, tablo yeniden çevrilir */
          if (iki && b.cs === 1 && !bolundu && !t.bolunen) bolunecek.add(b.c);
          const kul = kullanilan.get(b.r) ?? new Set<TabloKaynagi>();
          kullanilan.set(b.r, kul);
          const kaynak = liste.n > 1 ? null : bul(et);
          const a = alanBilgisi(et);
          if (iki && b.cs >= 2 && !kul.has(iki[0]) && !kul.has(iki[1])) {
            /* iki bilgi: hücre sütun sınırından ikiye bölünür, aradaki kenar çizilmez (formda tek hücre görünür) */
            const orta = (b.kutu.x0 + b.kutu.x1) / 2;
            let j = b.c + 1;
            for (let c = b.c + 2; c < b.c + b.cs; c++) if (Math.abs(t.xs[c] - orta) < Math.abs(t.xs[j] - orta)) j = c;
            const k = h.kenar!;
            Object.assign(h, { tur: "kayit", kaynak: iki[0], metin: alanBilgisi(iki[2]).metin, sutunBirlesim: j - b.c, kenar: { ...k, g: 0 } });
            ikinci = { ...h, kaynak: iki[1], metin: alanBilgisi(iki[3]).metin, sutunBirlesim: b.c + b.cs - j, kenar: { ...k, s: 0 } };
            kul.add(iki[0]); kul.add(iki[1]);
          } else if (kaynak && !kul.has(kaynak)) { Object.assign(h, { tur: "kayit", kaynak, metin: a.metin }); kul.add(kaynak); }
          else if (kaynak && /\bsaat/.test(katla(et))) Object.assign(h, { tur: "alan", metin: "Saat", alan: "metin", birim: "" });
          else Object.assign(h, { tur: "alan", metin: liste.n > 1 ? `${a.metin} ${liste.i}` : a.metin, alan: a.alan, birim: a.birim });
        }
      }
    }
    satirlarOut[b.r].hucreler.push(h, ...(ikinci ? [ikinci] : []));
  }
  if (bolunecek.size && C + bolunecek.size <= SUTUN_EN_COK) {
    t.xs0 ??= [...t.xs];
    t.bolunen = [...bolunecek].sort((a, b) => b - a);
    for (const c of t.bolunen) sutunBol(t, c);
    return tabloyaCevir(t, belge, ad, secenekKodlari, true);
  }
  const cevapVar = bl.some((b) => b.secenek) || satirlarOut.some((s) => s.hucreler.some((h) => h.tur === "cevap"));
  /* cevaplar: yan yana sütunların başlıkları · cevap sütununun başlığındaki kodlar (U/UD/X) · belgedeki açıklama · U, UD, X */
  const basliktaki = cevapBasligi.split(/[\s/,;|\-–]+/).filter(Boolean);
  const cevaplar = !cevapVar ? []
    : secenekKodlari.length ? kodSirala(secenekKodlari, belge.aciklama)
      : basliktaki.length >= 2 && basliktaki.every((x) => /^[A-ZÇĞİÖŞÜ]{1,3}$/.test(x)) ? kodSirala(basliktaki, belge.aciklama)
        : belge.aciklama?.kodlar ?? ["U", "UD", "X"];
  const en = t.xs[C] - t.xs[0] || 1;
  const bolum: HamBolum = {
    ad, tur: "tablo", yan: false, oran: 100, cevaplar,
    sutunlar: t.xs.slice(0, C).map((x, c) => Math.round(((t.xs[c + 1] - x) / en) * 10000) / 100), satirlar: satirlarOut,
    ...(t.ustBitisik || t.solBitisik ? { bitisik: true } : {}),
  };
  const sira = bl.filter((b) => b.sira).map((b) => parseInt(b.metin, 10)).filter(Number.isFinite);
  if (sira.length) siraDegeri.set(bolum, { ilk: enAz(sira), son: enCok(sira) });
  return bolum;
}
/** tablonun sıra numaralarının ilki ve sonu (sürekli numaralı listenin bölümleri — siraDevam) */
const siraDegeri = new WeakMap<HamBolum, { ilk: number; son: number }>();

/* ── 5. TABLO DIŞI: satır parçaları, sayfa altı, paragraflar ── */
/** satırın çok açık aralıkları (2,5 boydan geniş) ayrı parça: "Form No: …" solda, "Tarih: …" sağda */
function parcala(s: YaziSatiri): YaziSatiri[] {
  const l: Yazi[][] = [];
  let son = -Infinity;
  for (const y of s.yazilar) {
    if (!l.length || y.x - son > 2.5 * Math.max(y.boy, 1)) l.push([]);
    l[l.length - 1].push(y); son = Math.max(son, y.x + y.g);
  }
  return l.map(satirYap).filter((x) => x.metin);
}
function paragraflar(l: YaziSatiri[]): Paragraf[] {
  const s = [...l].sort((a, b) => a.p - b.p || a.y0 - b.y0 || a.x0 - b.x0), out: Paragraf[] = [];
  for (const x of s) {
    let p: Paragraf | undefined;
    for (let i = out.length - 1; i >= 0 && !p; i--) {
      const q = out[i];
      if (q.p === x.p && x.taban > q.sonTaban + 0.5 * x.boy && x.y0 - q.kutu.y1 <= 0.7 * Math.max(x.boy, q.boy) && Math.abs(x.boy - q.boy) <= 1
        && Math.min(x.x1, q.kutu.x1) - Math.max(x.x0, q.kutu.x0) > -YAKIN) p = q;
    }
    if (p) {
      p.satirlar.push(x); p.sonTaban = x.taban;
      p.kutu = { x0: Math.min(p.kutu.x0, x.x0), y0: Math.min(p.kutu.y0, x.y0), x1: Math.max(p.kutu.x1, x.x1), y1: Math.max(p.kutu.y1, x.y1) };
    } else out.push({ satirlar: [x], kutu: { x0: x.x0, y0: x.y0, x1: x.x1, y1: x.y1 }, p: x.p, boy: x.boy, sonTaban: x.taban });
  }
  return out;
}
/** sayfa numarası ("Sayfa No: 1/3", "Sayfa 2 / 3", "Page 1 of 2", "1/3") */
const SAYFA_NO = /(?:sayfa|page)?\s*(?:no)?\s*[:.]?\s*\d{1,3}\s*(?:\/|of)\s*\d{1,3}/gi;
/** blokların kimliği: sonraki sayfaların başında birinci sayfanın başındakilerin aynısı (tekrarlanan sayfa başlığı) atılır — sayfa numarası
    karşılaştırılmaz (2026-10-24, ikinci denetim: başlık kutusundaki "Sayfa n / N" başlığı her sayfada yeniden şablona sokuyordu) */
function blokIzi(b: Blok): string {
  if (b.tur === "resim") return `R${Math.round(b.kutu.x1 - b.kutu.x0)}x${Math.round(b.kutu.y1 - b.kutu.y0)}`;
  if (b.tur === "metin") return `M${b.par.satirlar.map((s) => s.metin).join("\n").replace(SAYFA_NO, "#")}`;
  const m = b.t.bolgeler.map((x) => x.metin.replace(SAYFA_NO, "#")).join("|");
  return m.replace(/\|/g, "").trim() ? `T${b.t.xs.length}x${b.t.ys.length}|${m}` : "";
}
/** sayfa altı parçasından sayfa numarası atılır ("FR-305 Rev.02 - Sayfa 1/2" → "FR-305 Rev.02"); kalan ayraçlar temizlenir */
const sayfaNosuz = (s: string) => s.replace(/(?:sayfa|page)\s*(?:no)?\s*[:.]?\s*\d{1,3}(?:\s*(?:\/|of|-)\s*\d{1,3})?/gi, " ")
  .replace(/(^|\s)\d{1,3}\s*\/\s*\d{1,3}(?=\s|$)/g, " ").replace(/\s+/g, " ").replace(/^[\s\-–—|·:,;]+|[\s\-–—|·:,;]+$/g, "").trim();
const KOD = /(?:^|[^A-Za-z0-9ÇĞİÖŞÜçğıöşü])((?:[A-ZÇĞİÖŞÜ]{2,6}[.-])*(?:FRM|FR|F)[.-] ?(?:[A-Z0-9]{1,8}[.-])*\d{1,5}(?:[.-][A-Z0-9]{1,6})*)/;
const KOD_ETIKETI = /(?<!\p{L})(?:form|d[oö]k[uü]man|dok)\.?\s*(?:no|kod[uü]?|numaras[ıi])\s*[:.]?\s*([^\s,;|]+)/iu;
/** sayfa altındaki önceksiz kod ("ABC.021", "SEM-12"); yalnız sayfa altının kısa parçalarında aranır (gövdedeki kısaltmalar yakalanmasın) */
const KOD_ALT = /^[A-ZÇĞİÖŞÜ]{2,6}[.-]\d{2,5}(?:[.-][A-Z0-9]{1,6})*$/;

/** tablonun dikey hücre çizgisini aşan yazı: pdf.js aynı yazı tipindeki iki yazıyı (sıra no + madde) araya boşluk koyup tek öğe yapmış olabilir —
    o satırda çizilmiş çizginin yanındaki boşluktan bölünür (karakterin yeri genişlikle orantılı tahmin); boşluk çizgiden uzaksa yazı bölünmez */
function kes(y: Yazi, t: Tablo): Yazi[] {
  const n = y.s.length;
  if (n < 3 || y.g <= 0) return [y];
  const r = aralik(t.ys, y.y + y.h / 2), w = y.g / n;
  for (let c = 1; c < t.xs.length - 1; c++) {
    const x = t.xs[c];
    if (x <= y.x + w || x >= y.x + y.g - w || acik(ortu(t.dp[c], t.ys[r], t.ys[r + 1]))) continue;
    let en = -1, fark = Infinity;
    for (let i = 1; i < n - 1; i++) if (y.s[i] === " ") { const f = Math.abs(y.x + (i + 0.5) * w - x); if (f < fark) { fark = f; en = i; } }
    if (en < 0 || fark > Math.max(1.2 * w, 2)) continue;
    const sol = y.s.slice(0, en), sag = y.s.slice(en + 1);
    if (!sol.trim() || !sag.trim()) continue;
    return [{ ...y, s: sol, g: en * w }, ...kes({ ...y, s: sag, x: y.x + (en + 1) * w, g: y.g - (en + 1) * w }, t)];
  }
  return [y];
}
/** yazının üstünden geçtiği komşu hücreler (genişliğinin %30'undan çoğu): boşsa sahada doldurulan alan yapılmaz */
function kaplananlar(y: Yazi, t: Tablo, sahibi: Bolge): void {
  const r = aralik(t.ys, y.y + y.h / 2);
  for (let c = aralik(t.xs, y.x); c <= aralik(t.xs, y.x + y.g); c++) {
    const b = t.bolgeler[t.sahip[r][c]];
    if (b !== sahibi && Math.min(y.x + y.g, b.kutu.x1) - Math.max(y.x, b.kutu.x0) > 0.3 * (b.kutu.x1 - b.kutu.x0)) b.kapli = true;
  }
}

/* ── bölüm sınırı: art arda kenarsız paragraf birimleri tek, çok satırlı, kenarsız tablo ── */
const kenarsiz = (h: HamHucre) => !!h.kenar && h.kenar.u === 0 && h.kenar.a === 0 && h.kenar.s === 0 && h.kenar.g === 0;
const paragrafMi = (b: HamBolum) => b.tur === "tablo" && !b.cevaplar.length && b.satirlar.every((s) => !s.tekrar && s.hucreler.every((h) => kenarsiz(h) && h.satirBirlesim === 1));
type ParSatiri = { yukseklik: number; hucreler: { h: HamHucre; w: number }[] };
/** birimin (tek bölüm ya da yan yana bölümler) satırları — hücre genişlikleri yüzde; birleşemezse null */
function birimSatirlari(u: HamBolum[]): ParSatiri[] | null {
  if (!u.every(paragrafMi)) return null;
  if (u.length === 1) {
    return u[0].satirlar.map((s) => {
      let c = 0;
      return { yukseklik: s.yukseklik, hucreler: s.hucreler.map((h) => { const w = u[0].sutunlar.slice(c, c + h.sutunBirlesim).reduce((t, x) => t + x, 0); c += h.sutunBirlesim; return { h, w }; }) };
    });
  }
  if (!u.every((b) => b.satirlar.length === 1 && b.satirlar[0].hucreler.length === 1)) return null;
  return [{ yukseklik: enCok(u.map((b) => b.satirlar[0].yukseklik)), hucreler: u.map((b) => ({ h: b.satirlar[0].hucreler[0], w: b.oran })) }];
}
/** satırlardan tek tablo: sütun sınırları satırların hücre sınırlarının birleşimi (yarım yüzdeye) */
function satirlardanBolum(ad: string, l: ParSatiri[]): HamBolum | null {
  const yuz = (s: ParSatiri) => s.hucreler.reduce((t, c) => t + c.w, 0) || 1;
  const kesim = new Set<number>([0, 100]);
  for (const s of l) { let x = 0; for (const c of s.hucreler) { x += (c.w / yuz(s)) * 100; kesim.add(yarim(x)); } }
  const k = [...kesim].sort((a, b) => a - b);
  if (k.length - 1 > SUTUN_EN_COK) return null;
  const satirlar: HamSatir[] = [];
  for (const s of l) {
    let x = 0;
    const hucreler: HamHucre[] = [];
    for (const c of s.hucreler) {
      const a = k.indexOf(yarim(x));
      x += (c.w / yuz(s)) * 100;
      const b = k.indexOf(yarim(x));
      if (b <= a) return null;
      hucreler.push({ ...c.h, sutunBirlesim: b - a, satirBirlesim: 1 });
    }
    satirlar.push({ tekrar: false, yukseklik: s.yukseklik, hucreler });
  }
  return { ad, tur: "tablo", yan: false, oran: 100, sutunlar: k.slice(1).map((x, i) => Math.round((x - k[i]) * 100) / 100), cevaplar: [], satirlar };
}
/** bölüm sayısı hedefi aşarsa art arda paragraf birimlerinin her dizisi tek tablo (hedefin altına inmese de — sonu çeviride atılır, adı söylenir) */
function paragraflariBirlestir(l: HamBolum[], hedef: number): HamBolum[] {
  if (l.length <= hedef) return l;
  const birimler: HamBolum[][] = [];
  for (const b of l) { if (b.yan && birimler.length) birimler[birimler.length - 1].push(b); else birimler.push([b]); }
  for (let i = 0; i + 1 < birimler.length;) {
    const a = birimSatirlari(birimler[i]), b = birimSatirlari(birimler[i + 1]);
    const m = a && b && a.length + b.length <= SATIR_EN_COK ? satirlardanBolum(birimler[i][0].ad, [...a, ...b]) : null;
    /* sürekli numaralı listenin arasındaki paragraf sayacı sıfırlamaz — bayrak birleşende kalır */
    if (m && [...birimler[i], ...birimler[i + 1]].some((x) => x.siraDevam)) m.siraDevam = true;
    if (m) birimler.splice(i, 2, [m]); else i++;
  }
  return birimler.flat();
}

/** iki sayfaya bölünen tablonun devamı öncekine eklenir: devamın başında öncekinin ilk satırlarının aynısı (tekrarlanan başlık) atılır. sayfaSonunda:
    önceki tablo sayfanın sonuna dek iniyor — değilse devam ancak tekrarlanan başlıkla anlaşılır */
function devamEkle(a: HamBolum, b: HamBolum, sayfaSonunda: boolean): boolean {
  const iz = (s: HamSatir) => s.hucreler.map((h) => `${h.sutunBirlesim}:${h.tur}:${h.metin}`).join("|");
  const bas = new Set(a.satirlar.slice(0, 3).filter((s) => s.hucreler.some((h) => h.metin.trim())).map(iz));
  let i = 0;
  while (i < 3 && i < b.satirlar.length - 1 && b.satirlar[i].hucreler.every((h) => h.satirBirlesim === 1) && bas.has(iz(b.satirlar[i]))) i++;
  if ((!sayfaSonunda && !i) || a.sutunlar.length !== b.sutunlar.length || a.satirlar.length + b.satirlar.length - i > SATIR_EN_COK) return false;
  a.satirlar.push(...b.satirlar.slice(i));
  if (!a.cevaplar.length) a.cevaplar = b.cevaplar;
  return true;
}

/** tablo dışı kısa etiket + hemen sağındaki boş tek hücreli kutu (doldurulabilir PDF'in kenarlı metin alanı, çizilmiş kutu) */
function etiketKutusu(m: Extract<Blok, { tur: "metin" }>, k: Extract<Blok, { tur: "tablo" }>): boolean {
  const l = k.t.bolgeler, metin = m.par.satirlar.map((s) => s.metin).join(" ").trim(), ara = k.kutu.x0 - m.kutu.x1;
  return m.par.satirlar.length === 1 && metin.length <= 60 && !sonucAyir(metin) && l.length === 1 && l[0].durum === "bos" && !l[0].resim && ara >= -YAKIN && ara <= 150;
}
function etiketliKutu(m: Extract<Blok, { tur: "metin" }>, k: Extract<Blok, { tur: "tablo" }>, belge: Belge): HamBolum {
  const et = m.par.satirlar.map((s) => s.metin).join(" ").trim(), kaynak = kayitKaynagi(et), a = alanBilgisi(et);
  const etiket: HamHucre = { ...bosHucre(), ...gorunum(m.par.satirlar, m.kutu.x0, k.kutu.x0, belge.boy), kenar: { ...KENARSIZ }, metin: et, zemin: m.zemin };
  const kutu: HamHucre = { ...bosHucre(), kenar: kenarlar(k.t, k.t.bolgeler[0]), zemin: zeminBul(k.kutu, belge.zeminler),
    ...(kaynak ? { tur: "kayit", kaynak, metin: a.metin } : { tur: "alan", metin: a.metin, alan: a.alan, birim: a.birim }) };
  const g1 = Math.max(1, k.kutu.x0 - m.kutu.x0), g2 = Math.max(1, k.kutu.x1 - k.kutu.x0), en = g1 + g2;
  const yuz = Math.round((g1 / en) * 10000) / 100;
  return { ad: a.metin || et, tur: "tablo", yan: false, oran: 100, sutunlar: [yuz, Math.round((100 - yuz) * 100) / 100], cevaplar: [],
    satirlar: [{ tekrar: false, yukseklik: mm(k.kutu.y1 - k.kutu.y0), hucreler: [etiket, kutu] }] };
}

/** okunan formdan şablon kurulmaz: PDF'te yazı yok ya da hiç bölüm çıkmadı (taranmış sayfa; yalnız sayfa altı yazısı) */
export function formBos(sayfalar: readonly PdfSayfasi[], ham: BasiliHam): boolean {
  return !sayfalar.some((x) => x.yazilar.some((y) => y.s.trim())) || !ham.bolumler.length;
}
/** sayfa sınırını aşan PDF'in notu (kurulunca kullanıcıya söylenir) */
export function sayfaNotu(toplam: number): string {
  const n = PDF_SINIR.sayfa;
  return toplam > n ? `Formun ilk ${n} sayfası okundu; ${n + 1}${toplam > n + 1 ? `–${toplam}.` : "."} sayfa${toplam > n + 1 ? "lar" : ""} şablona alınmadı.` : "";
}

export function pdfIzgara(sayfalar: readonly PdfSayfasi[]): BasiliHam {
  const d = duzle(Array.isArray(sayfalar) ? sayfalar : []);
  const [yHat, dHat] = kutulariAyikla(hatlar(d.yatay), hatlar(d.dikey), d.yazilar);
  const tamlar = tablolariBul(yHat, dHat).map((a) => tabloKur(a, d.sayfalar, d.yazilar)).filter((t): t is Tablo => !!t);
  const tablosu = (x: number, y: number) => tamlar.find((t) => x >= t.kutu.x0 - 0.5 && x <= t.kutu.x1 + 0.5 && y >= t.kutu.y0 - 0.5 && y <= t.kutu.y1 + 0.5);
  const hucresi = (t: Tablo, x: number, y: number) => t.bolgeler[t.sahip[aralik(t.ys, y)][aralik(t.xs, x)]];
  /* yazılar ve resimler hücrelere (merkezi hücrenin içindeyse); hücre çizgisini aşan birleşik yazı bölünür, taşan yazı komşusunu kaplar */
  const disari: Yazi[] = [], disResim: Resim[] = [];
  for (const y0 of d.yazilar) {
    const t0 = tablosu(y0.x + y0.g / 2, y0.y + y0.h / 2);
    if (!t0) { disari.push(y0); continue; }
    for (const y of kes(y0, t0)) {
      const b = hucresi(t0, y.x + y.g / 2, y.y + y.h / 2);
      b.yazilar.push(y);
      kaplananlar(y, t0, b);
    }
  }
  for (const r of d.resimler) {
    const cx = (r.x0 + r.x1) / 2, cy = (r.y0 + r.y1) / 2, t = tablosu(cx, cy);
    if (t) hucresi(t, cx, cy).resim = true; else disResim.push(r);
  }
  for (const t of tamlar) yaziHazirla(t);
  /* tek parça çizilmiş form bantlara ve yan yana yarılara */
  const tablolar = tamlar.flatMap((t) => bantlaraBol(t, d.zeminler.filter((z) => kesisim(z, t.kutu) > 0)));
  const secenekler = new Map<Tablo, string[]>(tablolar.map((t) => [t, tabloHazirla(t)]));
  const boylar = d.yazilar.map((y): [number, number] => [yarim(y.boy), y.s.length]);
  const govdeBoy = enSik(boylar) ?? 9;
  const belgeBoy = govdeBoy >= 6 && govdeBoy <= 16 ? govdeBoy : -1;

  /* tablo dışı satırlar: sayfanın son %10'unda ve sayfanın tablolarının altındakiler sayfa altı; ötekiler paragraf */
  const altlar = new Map<number, YaziSatiri[]>(), govde: YaziSatiri[] = [];
  for (const s of satirlar(disari).flatMap(parcala)) {
    const sf = d.sayfalar[s.p], tabloAlti = enCok(tablolar.filter((t) => t.p === s.p).map((t) => t.kutu.y1));
    if (s.y0 - sf.ust >= 0.9 * sf.boy && s.y0 > tabloAlti) { const l = altlar.get(s.p) ?? []; l.push(s); altlar.set(s.p, l); } else govde.push(s);
  }
  /* sayfa altı satır satır: ilk sayfanın tek satırlık kısa parçaları (form kodu · tarih · revizyon) 250 karaktere kadar altYazi; çok satırlı paragraf
     ve sığmayan yerinde yazı kalır. Sonraki sayfaların tek satırlık kısa parçaları sayfa altının tekrarı (sayfa no) — atılır */
  const kisaMi = (p: Paragraf) => p.satirlar.length === 1 && p.satirlar[0].metin.length <= 120;
  const ilkAlt = [...altlar.keys()].sort((a, b) => a - b)[0];
  const altSatirlar: YaziSatiri[] = [];
  let toplam = -3;
  for (const [p, l] of altlar) {
    for (const par of paragraflar(l).sort((a, b) => a.kutu.y0 - b.kutu.y0 || a.kutu.x0 - b.kutu.x0)) {
      const m = par.satirlar[0].metin;
      if (kisaMi(par) && p !== ilkAlt) continue;
      if (kisaMi(par) && !sayfaNosuz(m)) continue;
      if (kisaMi(par) && toplam + 3 + m.length <= 250) { altSatirlar.push(par.satirlar[0]); toplam += 3 + m.length; continue; }
      govde.push(...par.satirlar);
    }
  }
  const zeminDis = d.zeminler.filter((z) => !tablosu((z.x0 + z.x1) / 2, (z.y0 + z.y1) / 2));

  /* bloklar: tablolar, paragraflar (içinde durduğu zeminle), tablo dışı resimler */
  let bloklar: Blok[] = [
    ...tablolar.map((t): Blok => ({ tur: "tablo", t, kutu: t.kutu, p: t.p })),
    ...paragraflar(govde).map((par): Blok => {
      const cx = (par.kutu.x0 + par.kutu.x1) / 2, cy = (par.kutu.y0 + par.kutu.y1) / 2;
      const z = [...zeminDis].reverse().find((x) => cx >= x.x0 && cx <= x.x1 && cy >= x.y0 && cy <= x.y1);
      const zemin = z && !acikRenk(z.renk) ? z.renk : "";
      const kutu = z && zemin ? { x0: Math.min(z.x0, par.kutu.x0), y0: Math.min(z.y0, par.kutu.y0), x1: Math.max(z.x1, par.kutu.x1), y1: Math.max(z.y1, par.kutu.y1) } : par.kutu;
      return { tur: "metin", par, zemin, kutu, p: par.p };
    }),
    ...disResim.map((r): Blok => ({ tur: "resim", kutu: r, p: r.p })),
  ].sort((a, b) => a.kutu.y0 - b.kutu.y0 || a.kutu.x0 - b.kutu.x0);
  /* tekrarlanan sayfa başlığı */
  const sayfaBloklari = (p: number) => bloklar.filter((b) => b.p === p && b.kutu.y0 - d.sayfalar[p].ust < 0.35 * d.sayfalar[p].boy);
  const ilk = sayfaBloklari(0), atilacak = new Set<Blok>();
  for (let p = 1; p < d.sayfalar.length; p++) {
    const l = sayfaBloklari(p);
    for (let i = 0; i < l.length && i < ilk.length; i++) { const k = blokIzi(l[i]); if (!k || k !== blokIzi(ilk[i])) break; atilacak.add(l[i]); }
  }
  bloklar = bloklar.filter((b) => !atilacak.has(b));

  /* 6. yan yana: dikey aralığı ≥ %50 örtüşen ve yatayda çakışmayan bloklar aynı satırda, soldan sağa */
  const gruplar: Blok[][] = [];
  const ortusme = (a: Kutu, b: Kutu) => (Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0)) / Math.max(0.1, Math.min(a.y1 - a.y0, b.y1 - b.y0));
  for (const b of bloklar) {
    const g = gruplar[gruplar.length - 1];
    const yanda = !!g && g[0].p === b.p && g.some((o) => ortusme(o.kutu, b.kutu) >= 0.5) && g.every((o) => b.kutu.x0 >= o.kutu.x1 - YAKIN || b.kutu.x1 <= o.kutu.x0 + YAKIN);
    if (g && yanda) g.push(b); else gruplar.push([b]);
  }
  const herkes = gruplar.flat(), fx0 = enAz(herkes.map((b) => b.kutu.x0)), fx1 = enCok(herkes.map((b) => b.kutu.x1)), fen = Math.max(1, fx1 - fx0);

  const aciklama = aciklamaBul([
    ...tablolar.flatMap((t) => [...t.bolgeler.map((b) => b.metin.replace(/\n/g, " ")),
      ...t.ys.slice(0, -1).map((_, r) => t.bolgeler.filter((b) => b.r === r).map((b) => b.metin.replace(/\n/g, " ")).join(" "))]),
    ...herkes.flatMap((b) => (b.tur === "metin" ? [b.par.satirlar.map((s) => s.metin).join(" ")] : [])), ...altSatirlar.map((s) => s.metin),
  ].filter(Boolean));
  const belge: Belge = { boy: belgeBoy, aciklama, zeminler: d.zeminler };

  /* iki sayfaya bölünen tablo: sayfanın son bloğu olan tablo ile sonraki sayfanın ilk bloğu olan aynı sütunlu tablo tek tablo */
  const sayfaBasi = new Map<number, number>(), sayfaSonu = new Map<number, number>();
  gruplar.forEach((g, i) => { if (!sayfaBasi.has(g[0].p)) sayfaBasi.set(g[0].p, i); sayfaSonu.set(g[0].p, i); });
  const tekTablo = (g: Blok[]) => (g.length === 1 && g[0].tur === "tablo" ? g[0].t : null);
  const sayfadaYer = (y: number, p: number) => (y - d.sayfalar[p].ust) / d.sayfalar[p].boy;
  const bolumler: HamBolum[] = [];
  type Onceki = { bolum: HamBolum; t: Tablo; p: number; i: number };
  let onceki = null as Onceki | null;
  for (const [gi, g] of gruplar.entries()) {
    g.sort((a, b) => a.kutu.x0 - b.kutu.x0);
    const tt = tekTablo(g), o = onceki;
    const oxs = o ? o.t.xs0 ?? o.t.xs : [];
    if (tt && o && sayfaBasi.get(g[0].p) === gi && o.p === g[0].p - 1 && sayfaSonu.get(o.p) === o.i && sayfadaYer(tt.kutu.y0, g[0].p) <= 0.35
      && oxs.length === tt.xs.length && oxs.every((x, i) => Math.abs(x - tt.xs[i]) <= 3)) {
      /* öncekinin iki bilgi için bölünen sütunları devamda da bölünür (sütun sayıları tutsun) */
      if (o.t.bolunen && !tt.bolunen) { tt.xs0 = [...tt.xs]; for (const c of o.t.bolunen) sutunBol(tt, c); tt.bolunen = o.t.bolunen; }
      const devam = tabloyaCevir(tt, belge, "", secenekler.get(tt) ?? []);
      if (devamEkle(o.bolum, devam, sayfadaYer(o.t.kutu.y1, o.p) >= 0.75)) {
        const v0 = siraDegeri.get(o.bolum), v1 = siraDegeri.get(devam);
        if (v1) siraDegeri.set(o.bolum, { ilk: v0?.ilk ?? v1.ilk, son: v1.son });
        onceki = { bolum: o.bolum, t: tt, p: g[0].p, i: gi };
        continue;
      }
    }
    onceki = null;
    const cikti: { bolum: HamBolum; yuva0: number; yuva1: number }[] = [];
    for (let i = 0; i < g.length; i++) {
      const b = g[i];
      /* yuva: komşu blokların arasının ortası; ilk / son çerçevenin ucu */
      const yuva0 = i === 0 ? fx0 : (g[i - 1].kutu.x1 + b.kutu.x0) / 2;
      const yuva = (k: number) => (k === g.length - 1 ? fx1 : (g[k].kutu.x1 + g[k + 1].kutu.x0) / 2);
      const n = bolumler.length + cikti.length + 1;
      let bolum: HamBolum;
      const sonraki = g[i + 1];
      if (b.tur === "metin" && sonraki?.tur === "tablo" && etiketKutusu(b, sonraki)) {
        /* tablo dışındaki "Etiket: [kutu]": iki hücreli tek satır — solda kenarsız etiket, sağda kutunun kaydı / alanı */
        bolum = etiketliKutu(b, sonraki, belge);
        cikti.push({ bolum, yuva0, yuva1: yuva(i + 1) });
        i++;
        continue;
      }
      if (b.tur === "tablo") {
        const ilkYazi = b.t.bolgeler.find((x) => x.durum === "yazi" && !x.sira);
        bolum = tabloyaCevir(b.t, belge, (ilkYazi && ilkSatir(ilkYazi.metin)) || `Tablo ${n}`, secenekler.get(b.t) ?? []);
        if (g.length === 1) onceki = { bolum, t: b.t, p: b.p, i: gi };
      } else {
        const h: HamHucre = { ...bosHucre(), kenar: { ...KENARSIZ } };
        let yukseklik = mm(b.kutu.y1 - b.kutu.y0), ad = `Tablo ${n}`;
        if (b.tur === "resim") Object.assign(h, { tur: "gorsel", gorsel: "logo" });
        else {
          const metin = b.par.satirlar.map((s) => s.metin).join("\n"), s = sonucAyir(metin);
          Object.assign(h, gorunum(b.par.satirlar, yuva0, yuva(i), belgeBoy), { zemin: b.zemin }, s ? { tur: "sonuc", metin: s.onceki, secenekler: s.secenekler } : { metin });
          ad = ilkSatir(metin) || ad;
          if (!b.zemin) yukseklik = 0;
        }
        bolum = { ad, tur: "tablo", yan: false, oran: 100, sutunlar: [100], cevaplar: [], satirlar: [{ tekrar: false, yukseklik, hucreler: [h] }] };
      }
      cikti.push({ bolum, yuva0, yuva1: yuva(i) });
    }
    if (cikti.length > 1) cikti.forEach((x, i) => Object.assign(x.bolum, { yan: i > 0, oran: Math.max(5, Math.min(100, Math.round(((x.yuva1 - x.yuva0) / fen) * 100))) }));
    bolumler.push(...cikti.map((x) => x.bolum));
  }
  /* sürekli numaralı liste ayrı tablolara bölündüyse (grup başlığı, sayfa başlığı, ara yazı): numarası öncekinin bir fazlasıyla başlayan bölüm ve
     arasındakiler siraDevam — sayaç sıfırlanmaz (2026-10-24, ikinci denetim) */
  let sonSira: number | null = null, sonIndeks = -1;
  bolumler.forEach((b, i) => {
    const v = siraDegeri.get(b);
    if (!v) return;
    if (sonSira !== null && v.ilk === sonSira + 1) for (let j = sonIndeks + 1; j <= i; j++) if (bolumler[j].tur === "tablo") bolumler[j].siraDevam = true;
    sonSira = v.son; sonIndeks = i;
  });

  /* başlık: en büyük boylu satır (gövde yazısından en az 1 pt büyükse; eşitse üstteki); aynı kapta hemen altındaki aynı boy satırlar da */
  const kaplar: YaziSatiri[][] = [...tablolar.flatMap((t) => t.bolgeler.map((b) => b.satirlar)), ...herkes.flatMap((b) => (b.tur === "metin" ? [b.par.satirlar] : []))];
  const satirBoyu = (s: YaziSatiri) => enCok(s.yazilar.map((y) => y.boy));
  let secilen: { k: YaziSatiri[]; i: number; boy: number; y: number } | null = null;
  for (const k of kaplar) k.forEach((s, i) => {
    const sb = satirBoyu(s);
    if (sb < govdeBoy + 1) return;
    if (!secilen || sb > secilen.boy + 0.25 || (Math.abs(sb - secilen.boy) <= 0.25 && s.y0 < secilen.y)) secilen = { k, i, boy: sb, y: s.y0 };
  });
  let baslik = "";
  if (secilen) {
    const { k, i, boy } = secilen as { k: YaziSatiri[]; i: number; boy: number };
    let j = i + 1;
    while (j < k.length && Math.abs(satirBoyu(k[j]) - boy) <= 0.5) j++;
    baslik = k.slice(i, j).map((x) => satirYap(x.yazilar.filter((y) => y.boy >= boy - 0.5)).metin).join(" ").replace(/\s+/g, " ").trim().slice(0, 200);
  }
  /* form kodu: "Form No" etiketinin değeri (aynı yazıda ya da sağdaki hücrede), yoksa kod kalıbı (FR.021, F-12, FRM-001 …), yoksa sayfa altının
     önceksiz kodu (ABC.021); değerde rakam olmalı */
  const kodTemiz = (x: string) => x.replace(/^[:.]+|[,;:.-]+$/g, "");
  let formKodu = "";
  for (const t of tablolar) for (const b of t.bolgeler) {
    if (formKodu || b.durum !== "yazi" || !/^(form|dokuman|dok) ?(no|kod|numara)/.test(katla(b.metin))) continue;
    const ayni = b.metin.replace(/\n/g, " ").match(KOD_ETIKETI)?.[1] ?? "";
    const sag = b.c + b.cs < t.xs.length - 1 ? t.bolgeler[t.sahip[b.r][b.c + b.cs]] : undefined;
    const deger = /\d/.test(ayni) ? ayni : sag?.durum === "yazi" ? (sag.metin.split("\n")[0].trim().split(/\s+/)[0] ?? "") : "";
    if (/\d/.test(deger)) formKodu = kodTemiz(deger);
  }
  const tumMetinler = [...bolumler.flatMap((b) => b.satirlar.flatMap((s) => s.hucreler.map((h) => h.metin))), ...altSatirlar.map((s) => s.metin)];
  if (!formKodu) for (const m of tumMetinler) { const x = m.replace(/\n/g, " ").match(KOD_ETIKETI); if (x && /\d/.test(x[1])) { formKodu = kodTemiz(x[1]); break; } }
  if (!formKodu) for (const m of tumMetinler) { const x = m.match(KOD); if (x) { formKodu = kodTemiz(x[1]); break; } }
  if (!formKodu) for (const s of altSatirlar) { const x = s.metin.trim(); if (KOD_ALT.test(x)) { formKodu = x; break; } }

  const aile = enSik(d.yazilar.map((y): [string, number] => [y.aile, y.s.length])) ?? "";
  return {
    cevap: "", baslik, formKodu: formKodu.slice(0, 20), altYazi: altSatirlar.map((s) => sayfaNosuz(s.metin)).filter(Boolean).join(" · "),
    yazi: { tip: yaziTipi(aile), boy: d.yazilar.length ? govdeBoy : 9 }, bolumler: paragraflariBirlestir(bolumler, BOLUM_HEDEF),
  };
}
