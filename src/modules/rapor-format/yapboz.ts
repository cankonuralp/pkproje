/* YAPBOZ — format kurucunun GELİŞMİŞ görünümü (494; hata listesi 29 + 46 maketi https://claude.ai/artifact/TgA7oTqRojdEe7qAfjqAfJ onaylandı — reisim
   2026-10-11: "maketi onaylıyorum ama bu da çok karmaşık olmuş, şöyle yapalım mevcuttaki sistemi koruyalım gelişmiş seçenekler tuşu olsun ve tıklayınca
   buraya gitsin"; 46: "rapor tasarımcısını da kullanacak kullanıcılar tam bir yapboz gibi olmalı ve kolay kullanışlı olmalı") — saf. Parça kutusu:
   bölümler (her blok, içinde bir başlangıç öğesiyle), tek alanlar (bir bilgi bölümüne) ve kayıttan gelen alanlar. Parça kâğıda iki bölüm arasına
   bırakılır (bölüm; tek alan bırakılırsa içinde o alanla yeni bilgi bölümü) ya da bir bilgi bölümünün üstüne (alan o bölüme). Bölümler tutamaktan
   taşınır, kopyalanır. Basit görünüm (kâğıt) ile aynı taslak — kimlikler tanımda tekil (kurucu.ts yeniKimlik).
   496 PARÇA KİTAPLIĞI: Bakanlık formatlarının (ve kompresör şablonunun) bölümleri tek tek — şablon başına katlanır grup; FİRMANIZIN PARÇALARI
   ("Parça olarak kaydet" — sunucuda format_parca, göç 0080). Parça formata KOPYALANIR (parcaKopyasi: iç kimlikler yeni, tablo sütunları tablo içinde
   tekil olduğundan aynı; Bakanlık işareti, üst / alt başlık ve numarasızlık kalkar) — format parçaya bağlanmaz. Şablon bölümleri sunucuda
   seçilir (kitaplik.ts hazirParcalar — şablon dosyası tarayıcıya gitmez) ve sayfadan gelir. */
import { ekipmanBolumuMu, kayittanBolumMu } from "../../format/duzen.ts";
import { ALAN_TURLERI, Bolum, KAYNAKLAR, type Blok, type BolumOf, type FormatTanimi } from "../../format/tanim.ts";
import { kimlikler, yeniBolum, yeniKimlik } from "./kurucu.ts";
import { BLOK_ADI } from "./ui/ortak.ts";

export type ParcaTuru = "bolum" | "alan";
export interface Parca {
  /** "b:<blok>" bölüm · "a:<alan türü>" tek alan · "k:<kaynak>" kayıttan gelen alan */
  k: string; ad: string; acik: string; tur: ParcaTuru;
}
/** katlanir: şablon başına grup (kapalı açılır); firma: firmanın parçaları (boşsa ipucu) */
export interface ParcaGrubu { ad: string; parcalar: Parca[]; katlanir?: boolean; firma?: boolean }
/** firmanın kaydettiği parça (sunucu: rapor-format/server/parcalar.ts) */
export interface FirmaParcasi { id: string; ad: string; bolum: Bolum }
/** şablonun parça olabilen bölümleri (kitaplik.ts hazirParcalar) */
export interface HazirParca { anahtar: string; ad: string; bolumler: Bolum[] }
/** parça kitaplığı: firmanın parçaları + şablon bölümleri */
export interface Kitaplik { firma: readonly FirmaParcasi[]; hazir: readonly HazirParca[] }
const BOS: Kitaplik = { firma: [], hazir: [] };

type AlanTuru = (typeof ALAN_TURLERI)[number];
type Kaynak = (typeof KAYNAKLAR)[number];
export const ALAN_PARCA_ADI: Record<AlanTuru, readonly [string, string]> = {
  metin: ["Metin", "kısa yazı"], sayi: ["Sayı", "birimli sayı"], tarih: ["Tarih", "takvimden"], secim: ["Seçim", "seçeneklerden biri"],
  coklu: ["Çoklu seçim", "seçeneklerden birkaçı"], evet: ["Evet / Hayır", "iki seçenek"],
};
/** kâğıda bırakılan alanın başlangıç adı (yerinde değişir) */
const ALAN_YENI_AD: Record<AlanTuru, string> = { metin: "Yeni alan", sayi: "Yeni sayı", tarih: "Tarih", secim: "Seçim", coklu: "Çoklu seçim", evet: "Var mı?" };
export const KAYNAK_ADI: Record<Kaynak, string> = {
  firma_adi: "Firma adı", tesis_adresi: "Periyodik kontrol adresi", sgk: "SGK DETSİS NO", isg_id: "İSG-KATİP SÖZLEŞME ID", kontrol_tarihi: "Kontrol tarihi",
  rapor_no: "Rapor no", ekipman_kodu: "Ekipman kodu", ekipman_adi: "Ekipman türü", seri_no: "Seri no", kullanim_yeri: "Kullanım yeri",
};
const BOLUM_ACIK: Record<Blok, string> = {
  bilgi: "etiket + değer", liste: "maddeler · Uygun / Uygun değil", olcum: "satır × sütun, sınır", test: "tek tek değer, sınır", cihaz: "kullanılan cihazlar",
  foto: "fotoğraf kutuları", kusur: "kendiliğinden dolar", sonuc: "uygundur / değildir", not: "uzmanın yorumu", imza: "belgede imza yerleri",
  metin: "belgeye basılan sabit yazı", tablo: "satır, sütun, birleşik hücre",
};
const BOLUM_SIRASI: readonly Blok[] = ["tablo", "bilgi", "liste", "olcum", "test", "foto", "metin", "not", "kusur", "sonuc", "imza", "cihaz"];

/** parça olabilen bölüm mü: ölçüm cihazları (tektir, türden), kayıttan gelen alanlı bilgi bölümü (1. bölümün kopyası) ve ekipman bilgileri
    (formatta tek; şablonun "Ekipman bilgileri"si kurucuda tam bölüm olur — duzen.ts ekipmanBolumuMu; ekipman kaydına bağlı alanlar yalnız
    orada) parça olmaz */
export function parcaOlur(b: Bolum): boolean {
  if (b.blok === "cihaz") return false;
  if (b.blok === "bilgi") { const bagli = b.alanlar.some((a) => a.ekipman); return !bagli && !ekipmanBolumuMu(b) && !kayittanBolumMu(b); }
  return true;
}
/** parçanın saklanacak / kopyalanacak hâli: Bakanlık işareti, üst / alt başlık ve numarasızlık kalkar (yeni yerinde ana bölüm) */
export function parcaHazirla(b: Bolum): Bolum | null {
  if (!parcaOlur(b)) return null;
  const y: Record<string, unknown> = { ...b, kilit: false };
  delete y.ust; delete y.alt; delete y.numarasiz;
  if (b.blok === "bilgi") y.alanlar = b.alanlar.map((a) => ({ ...a, kilit: false }));
  if (b.blok === "liste") y.gruplar = b.gruplar.map((g) => ({ ...g, maddeler: g.maddeler.map((m) => ({ ...m, kilit: false })) }));
  if (b.blok === "test") y.degerler = b.degerler.map((d) => ({ ...d, kilit: false }));
  const r = Bolum.safeParse(y);
  return r.success ? r.data : null;
}

/** parça kutusu (ölçüm cihazları bölümü tektir — varsa listede yok); kitaplık: firmanın parçaları + şablon bölümleri */
export function parcaGruplari(t: FormatTanimi, kt: Kitaplik = BOS): ParcaGrubu[] {
  const cihazVar = t.bolumler.some((b) => b.blok === "cihaz");
  return [
    { ad: "Bölümler", parcalar: BOLUM_SIRASI.filter((b) => !(b === "cihaz" && cihazVar)).map((b) => ({ k: `b:${b}`, ad: BLOK_ADI[b], acik: BOLUM_ACIK[b], tur: "bolum" })) },
    { ad: "Tek alan · bir bilgi bölümüne", parcalar: ALAN_TURLERI.map((a) => ({ k: `a:${a}`, ad: ALAN_PARCA_ADI[a][0], acik: ALAN_PARCA_ADI[a][1], tur: "alan" })) },
    { ad: "Kayıttan gelen · bilgi bölümüne", parcalar: KAYNAKLAR.map((x) => ({ k: `k:${x}`, ad: KAYNAK_ADI[x], acik: "plandan / kayıttan, sahada gösterilir", tur: "alan" })) },
    { ad: "Firmanızın parçaları", firma: true, parcalar: kt.firma.map((f) => ({ k: `f:${f.id}`, ad: f.ad, acik: BLOK_ADI[f.bolum.blok], tur: "bolum" })) },
    ...kt.hazir.map((h) => ({ ad: h.ad, katlanir: true, parcalar: h.bolumler.map((b) => ({ k: `h:${h.anahtar}:${b.id}`, ad: b.ad, acik: BLOK_ADI[b.blok], tur: "bolum" as const })) })),
  ];
}
export function parcaBul(t: FormatTanimi, k: string, kt: Kitaplik = BOS): Parca | null {
  for (const g of parcaGruplari(t, kt)) for (const p of g.parcalar) if (p.k === k) return p;
  return null;
}
/** kitaplık parçasının bölümü (h:<şablon>:<bölüm> · f:<firma parçası>) */
function kitaplikBolumu(k: string, kt: Kitaplik): Bolum | null {
  if (k.startsWith("f:")) return kt.firma.find((f) => f.id === k.slice(2))?.bolum ?? null;
  const m = /^h:([A-Z0-9]+):(.+)$/.exec(k);
  if (!m) return null;
  return kt.hazir.find((h) => h.anahtar === m[1])?.bolumler.find((b) => b.id === m[2]) ?? null;
}

/** parçanın bölümü: içinde bir başlangıç öğesiyle (boş bölüm yayında uyarı verirdi) */
function parcaBolumu(t: FormatTanimi, blok: Blok): Bolum {
  const b = yeniBolum(t, blok, BLOK_ADI[blok]);
  const ek = new Set([b.id, ...(b.blok === "liste" ? b.gruplar.map((g) => g.id) : [])]);
  const id = (onek: "a" | "m" | "s" | "d") => { const x = yeniKimlik(t, onek, ek); ek.add(x); return x; };
  if (b.blok === "bilgi") return { ...b, alanlar: [{ id: id("a"), ad: "Yeni alan", tur: "metin", zorunlu: false, kilit: false }] };
  if (b.blok === "liste") return { ...b, gruplar: b.gruplar.map((g) => ({ ...g, maddeler: [{ id: id("m"), metin: "Yeni madde", kilit: false }] })) };
  if (b.blok === "olcum") return { ...b, sutunlar: [
    { id: id("s"), ad: "Ölçüm yeri", giris: "metin", zorunlu: false, agir: false }, { id: id("s"), ad: "Ölçülen", giris: "sayi", zorunlu: false, agir: false }] };
  if (b.blok === "test") return { ...b, degerler: [{ id: id("d"), ad: "Yeni değer", metin: false, zorunlu: true, kilit: false, agir: false }] };
  if (b.blok === "metin") return { ...b, ad: "Açıklama", metin: "Belgeye basılacak yazıyı buraya yazın." };
  return b;
}

/** alan parçasının alanı */
function parcaAlani(t: FormatTanimi, k: string, ek: ReadonlySet<string> = new Set()): BolumOf<"bilgi">["alanlar"][number] | null {
  const id = yeniKimlik(t, "a", ek);
  if (k.startsWith("a:")) {
    const tur = k.slice(2) as AlanTuru;
    if (!ALAN_TURLERI.includes(tur)) return null;
    return { id, ad: ALAN_YENI_AD[tur], tur, zorunlu: false, kilit: false,
      ...(tur === "secim" || tur === "coklu" ? { secenekler: ["Seçenek 1", "Seçenek 2"] } : {}) };
  }
  if (k.startsWith("k:")) {
    const x = k.slice(2) as Kaynak;
    if (!KAYNAKLAR.includes(x)) return null;
    return { id, ad: KAYNAK_ADI[x], tur: x === "kontrol_tarihi" ? "tarih" : "metin", zorunlu: false, kilit: false, kaynak: x };
  }
  return null;
}

const yerlestirIc = (t: FormatTanimi, b: Bolum, p: number): FormatTanimi => {
  const l = [...t.bolumler]; l.splice(Math.max(0, Math.min(p, l.length)), 0, b);
  return { ...t, bolumler: l };
};

/** parçayı p. yere (yeni bölümün t.bolumler'deki yeri) bırakır: bölüm parçası o bölüm; alan parçası içinde o alanla yeni bilgi bölümü. Yeni
    bölümün (alan parçasında alanın) kimliği döner; parça tanınmazsa null */
export function parcaYerlestir(t: FormatTanimi, k: string, p: number, kt: Kitaplik = BOS): { t: FormatTanimi; id: string; bolum: string } | null {
  if (k.startsWith("h:") || k.startsWith("f:")) {
    const kaynak = kitaplikBolumu(k, kt);
    const b = kaynak ? parcaKopyasi(t, kaynak) : null;
    return b ? { t: yerlestirIc(t, b, p), id: b.id, bolum: b.id } : null;
  }
  if (k.startsWith("b:")) {
    const blok = k.slice(2) as Blok;
    if (!BOLUM_SIRASI.includes(blok) || (blok === "cihaz" && t.bolumler.some((b) => b.blok === "cihaz"))) return null;
    const b = parcaBolumu(t, blok);
    return { t: yerlestirIc(t, b, p), id: b.id, bolum: b.id };
  }
  const bos = yeniBolum(t, "bilgi", BLOK_ADI.bilgi);
  const a = parcaAlani(t, k, new Set([bos.id]));
  if (!a || bos.blok !== "bilgi") return null;
  const b: Bolum = { ...bos, alanlar: [a] };
  return { t: yerlestirIc(t, b, p), id: a.id, bolum: b.id };
}

/** alan parçasını i. bölüme (bilgi bölümü; tam ekipman bölümü de) ekler; olmazsa null */
export function alanaParcaEkle(t: FormatTanimi, i: number, k: string): { t: FormatTanimi; id: string } | null {
  const b = t.bolumler[i];
  if (!b || b.blok !== "bilgi") return null;
  const a = parcaAlani(t, k);
  if (!a) return null;
  return { t: { ...t, bolumler: t.bolumler.map((x, j) => (j === i && x.blok === "bilgi" ? { ...x, alanlar: [...x.alanlar, a] } : x)) }, id: a.id };
}

/** bölümü p. yerin önüne taşır (p: taşımadan ÖNCEKİ dizilişte yer — bölümün kendi yeri ya da bir sonrası değişiklik yapmaz) */
export function bolumuTasi(t: FormatTanimi, id: string, p: number): FormatTanimi {
  const i = t.bolumler.findIndex((b) => b.id === id);
  if (i < 0) return t;
  let j = Math.max(0, Math.min(p, t.bolumler.length));
  if (j === i || j === i + 1) return t;
  if (j > i) j--;
  const l = [...t.bolumler]; const [b] = l.splice(i, 1); l.splice(j, 0, b);
  return { ...t, bolumler: l };
}

/** bölümün kopyası hemen altına: iç kimlikler yeni (tanımda tekil; ölçüm tablosunun sütunları tablo içinde tekil — aynı kalır), Bakanlık işareti
    kopyada yok (firmanın kendi bölümü), ad "(kopya)" */
export function bolumKopyala(t: FormatTanimi, i: number): { t: FormatTanimi; id: string } | null {
  const b = t.bolumler[i];
  if (!b || b.blok === "cihaz" || (b.blok === "bilgi" && b.tam)) return null;
  const kopya = kopyaIc(t, b, `${b.ad} (kopya)`.slice(0, 200));
  return { t: yerlestirIc(t, kopya, i + 1), id: kopya.id };
}

/** 497: hazır bir bölümü (yapay zekâ önerisi) p. yere — iç kimlikler şimdiki taslağa göre yeni (kopyaIc; Bakanlık işareti yok) */
export function bolumYerlestir(t: FormatTanimi, b: Bolum, p: number): { t: FormatTanimi; id: string } {
  const k = kopyaIc(t, b, b.ad);
  return { t: yerlestirIc(t, k, p), id: k.id };
}

/** 496: kitaplık parçasının (Bakanlık şablonu ya da firmanın parçası) bu formata kopyası — parcaHazirla'dan geçer, iç kimlikler yeni; olmazsa null */
export function parcaKopyasi(t: FormatTanimi, kaynak: Bolum): Bolum | null {
  const h = parcaHazirla(kaynak);
  return h ? kopyaIc(t, h, h.ad) : null;
}

function kopyaIc(t: FormatTanimi, b: Bolum, ad: string): Bolum {
  const ek = new Set(kimlikler(t));
  const yeni = (onek: "b" | "a" | "g" | "m" | "s" | "d" | "k") => { const x = yeniKimlik(t, onek, ek); ek.add(x); return x; };
  let k: Bolum;
  if (b.blok === "bilgi") k = { ...b, alanlar: b.alanlar.map((a) => ({ ...a, id: yeni("a"), kilit: false })) };
  else if (b.blok === "liste") k = { ...b, gruplar: b.gruplar.map((g) => ({ ...g, id: yeni("g"), maddeler: g.maddeler.map((m) => ({ ...m, id: yeni("m"), kilit: false })) })) };
  /* ölçüm tablosunun sütun kimlikleri TABLO İÇİNDE tekildir (cevaplar.tablo bölüm kimliğiyle) — kopya aynı kimlikleri taşır, tablonun hesabı (linye,
     PD …) sütunları kimlikle okuduğu için bozulmaz */
  else if (b.blok === "olcum") k = { ...b };
  else if (b.blok === "test") k = { ...b, degerler: b.degerler.map((d) => ({ ...d, id: yeni("d"), kilit: false })) };
  /* 595 (madde 16): fotoğraf kutularının kimliği tanımda tekil (fotoğrafın yeri) — kopyada yenisi */
  else if (b.blok === "foto") k = { ...b, ...(b.kutular ? { kutular: b.kutular.map((x) => ({ ...x, id: yeni("k") })) } : {}) };
  else k = { ...b };
  return Bolum.parse({ ...k, id: yeni("b"), ad, kilit: false });
}

/* ── sürükle-bırak taşıyıcısı (dataTransfer): tür sürüklerken okunabilsin diye tür MIME adında ── */
export const SURUKLE = { bolumParca: "application/x-probata-parca-bolum", alanParca: "application/x-probata-parca-alan", bolum: "application/x-probata-bolum" } as const;
export const surukleTuru = (p: Parca) => (p.tur === "alan" ? SURUKLE.alanParca : SURUKLE.bolumParca);
