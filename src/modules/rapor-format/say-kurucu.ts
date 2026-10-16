/* S.A.Y FORMAT YAPICIDA (553; reisim 2026-10-14: "elektrikte hesaplamalarda olsun bu vb hesaplamalar için format yapıcıda formül kısmı olsun mesela
   (RCa=480/RCd) … konuşarak ilgili formatı yapabiliyo olalım, işin bitince direk yayınla sunuma gerek yok") — saf. Format yapıcı açıkken S.A.Y
   (Claude Haiku 5.5) taslağı görür ve "formati_duzenle" aracıyla değiştirir:
   · formatHaritasi: bölümler (kimlik, tür, ad), öğeler (kimlik, ad, tür, birim, formül, sınır), kontrol listesinin grupları ve maddeleri;
   · formatIslemleri: işlem listesi — bölüm ekle / sil / adını değiştir, öğe (alan, madde, sütun, test değeri) ekle / değiştir / çıkar, grup ekle.
     Bölüm ve öğe kimlikle ya da ADIYLA bulunur (aynı istekte yeni eklenen bölüme adıyla öğe eklenir). Öğe değişikliği kurucu.ts ogeYaz ile
     (formül formulDuzelt'le köşeli parantezli biçime; adı değişen öğe formüllerde de değişir) — format yapıcının kendi tuşlarıyla aynı yol.
   Değişiklik ekranda TASLAKTA olur (geri al / Kaydet / Yayınla kişide); yapılamayan işlem nedeniyle döner.
   2026-10-16 (pkproje §9 "SONUÇ KURALI FORMAT YAPICIDA"): ölçüm tablosunun sonuç kuralı haritada ve "sonuc_kurali" işlemiyle (yaz / kaldır / Bakanlık
   kuralına dön) — kurucunun tuşlarıyla aynı yol (kurucu.ts sonucKuraliYaz, bakanlikKuralinaDon).
   595 (sunum 595 madde 1): imza bölümünün satırları haritada ve "imza_satiri" işlemiyle (ekle — kişinin bilgisi ya da serbest satır —, değiştir:
   ad / sabit yazı / tam satır, çıkar, yukarı, aşağı) — kurucunun tuşlarıyla aynı yol (kurucu.ts imzaSatiri*); e-imzanın yeri haritada ve
   "eimza_yeri" işlemiyle (hücre / son sayfada kutu — mm — / görünmez; kurucu.ts eimzaYaz). 1. bölümün (Firma bilgileri) satırları haritada ve
   "firma_satiri" işlemiyle (ekle — kayıt bilgisi ya da serbest —, değiştir, çıkar, yukarı, aşağı; kurucu.ts firmaSatiri*). Sabit başlıklar ve
   sözcükler "baslik" (tablo başlıkları, sonuç sözcükleri, yönlendirme, başlık tablosu etiketleri, sayfa altı, ekipman satır adları), Sonuç sütununun
   belgedeki yeri "sonuc_yeri", yorumun satır sayısı "not_satiri", öğelerin sırası "oge_tasi" (kurucu.ts bolumBasligiYaz, gorunumBasligiYaz,
   sonucYeriYaz, notSatiriYaz, ogeTasi). Ölçüm cihazları ve uygunsuzluk tablosunun sütunları "tablo_sutunu" (ekle — cihaz / uygunsuzluk bilgisi —,
   değiştir, çıkar, sola / sağa; uygunsuzlukta tablo / liste), bilgi bölümünün dizilişi "dizilis" (1 · 2 · 3), alanın tam satırı oge_degistir "tam"
   (kurucu.ts tabloSutunu*, kusurTablosuYaz, bilgiDizilisiYaz; sunum 595 madde 2, 9, 10). */
import { SINIR_ISARETI } from "../../format/hesap.ts";
import {
  basEtiketleri, cihazSutunlari, ekipmanEtiketleri, firmaSatirlari, imzaSatirlari, listeBasliklari, olcumBasliklari, sonucMetinleri, testBasliklari,
} from "../../format/duzen.ts";
import { etkinKurallar } from "../../format/sonuc.ts";
import { CIHAZ_ALANLARI, FIRMA_KAYNAK_ADI, FIRMA_KAYNAKLARI, KUSUR_ALANLARI, type CihazAlani, type KusurAlani, IMZA_ALAN_ADI, IMZA_ALANLARI, IMZA_KISI_ADI, KURAL_EN_COK, type Blok, type Bolum, type FormatTanimi, type ImzaAlani, type SonucKurali } from "../../format/tanim.ts";
import {
  bakanlikKuralinaDon, bilgiDizilisiYaz, bolumAdi, eksikTabloAlanlari, kusurTablosuYaz, tabloSutunuEkle, tabloSutunuSil, tabloSutunuTasi, tabloSutunuYaz, bolumBasligiYaz, bolumSil, eimzaYaz, gorunumBasligiYaz, notSatiriYaz, ogeTasi, sonucYeriYaz, type BolumBasligi,
  type GorunumBasligi, firmaSatiriEkle, firmaSatiriSil, firmaSatiriTasi, firmaSatiriYaz, grupEkle, imzaSatiriEkle, imzaSatiriSil, imzaSatiriTasi, imzaSatiriYaz, maddeEkle, ogeEkle, ogeSil, ogeYaz,
  sonucKuraliYaz, yeniBolum, yeniKimlik, type OgeTuru, type OgeYamasi,
} from "./kurucu.ts";

/** haritanın en çok uzunluğu (karakter) */
export const FORMAT_HARITA_SINIRI = 40_000;
/** tek istekte en çok işlem */
export const FORMAT_ISLEM_EN_COK = 100;
/** S.A.Y'ın ekleyebildiği bölüm türleri (ölçüm cihazları, imza, kusur bölümleri formatta tektir — kurucu kendi ekler) */
export const EKLENIR_BLOK = ["olcum", "test", "bilgi", "liste", "foto", "not", "metin", "sonuc"] as const;
const BLOK_TR: Record<Blok, string> = {
  bilgi: "bilgi alanları", liste: "kontrol listesi", olcum: "ölçüm tablosu", test: "test değerleri", cihaz: "ölçüm cihazları", foto: "fotoğraflar",
  kusur: "kusur açıklamaları", sonuc: "sonuç", not: "not / yorum", imza: "imza", metin: "serbest metin",
};
const sinirMetni = (o: { op?: string; sinir?: number }) => (o.op && o.sinir !== undefined ? `, sınır ${SINIR_ISARETI[o.op as keyof typeof SINIR_ISARETI] ?? o.op} ${o.sinir}` : "");

export function formatHaritasi(t: FormatTanimi): string {
  const l: string[] = ["Format taslağının bölümleri (bölüm kimliği · tür · ad) ve öğeleri (öğe kimliği · ad · tür; formül = kendiliğinden hesaplanan):"];
  l.push("## firma · 1. bölüm · Firma bilgileri (satırlar — kimlik · ad · bilgi):");
  for (const s of firmaSatirlari(t)) l.push(`- ${s.id} · ${s.ad} · ${s.kaynak === "serbest" ? `serbest${s.metin ? `, yazı: ${s.metin.slice(0, 80)}` : ""}` : FIRMA_KAYNAK_ADI[s.kaynak]}${s.tam ? " · tam satır" : ""}`);
  const be = basEtiketleri(t), ee = ekipmanEtiketleri(t);
  l.push(`Başlık tablosu etiketleri: doküman kodu “${be.kod}”, format sürümü “${be.surum}”, rapor no “${be.no}”, rapor tarihi “${be.tarih}” · ekipman satırları: `
    + `“${ee.kod}”, “${ee.tur}” · sayfa altı: “${t.gorunum.altYazi ?? "{firma} · {kod}"}”`);
  const e = t.gorunum.eimza;
  l.push(`E-imzanın yeri: ${!e || e.yer === "hucre" ? "imza bölümündeki İmza hücresi" : e.yer === "gorunmez" ? "görünmez imza"
    : `son sayfada kutu (soldan ${e.x ?? "?"} mm, üstten ${e.y ?? "?"} mm, ${e.en ?? "?"} × ${e.boy ?? "?"} mm)`}`);
  for (const b of t.bolumler) {
    l.push(`## ${b.id} · ${BLOK_TR[b.blok]} · ${b.ad}${b.kilit ? " (Bakanlık bölümü)" : ""}`);
    if (b.blok === "bilgi") {
      if (b.dizilis && b.dizilis !== 2) l.push(`  belgede bir satırda ${b.dizilis} bilgi`);
      for (const a of b.alanlar) {
        l.push(`- ${a.id} · ${a.ad} · ${a.ekipman ? "ekipman kaydından" : a.kaynak ? "kayıttan" : a.tur}${a.birim ? ` (${a.birim})` : ""}${a.formul ? ` · formül ${a.formul}` : ""}${a.secenekler?.length ? ` · seçenekler: ${a.secenekler.join(" / ")}` : ""}${a.tam !== undefined ? ` · ${a.tam ? "tam satır" : "yarım satır"}` : ""}`);
      }
    } else if (b.blok === "cihaz" || b.blok === "kusur") {
      const s = b.blok === "cihaz" ? cihazSutunlari(b) : b.sutunlar ?? [];
      l.push(s.length ? `  sütunlar (kimlik · ad · bilgi): ${s.map((x) => `${x.id} · ${x.ad} · ${x.alan}`).join("; ")}` : "  madde listesi (tablo değil)");
      const e = eksikTabloAlanlari(b);
      if (e.length && s.length) l.push(`  eklenebilecek sütunlar: ${e.join(", ")}`);
    } else if (b.blok === "olcum") {
      for (const s of b.sutunlar) {
        l.push(`- ${s.id} · ${s.ad} · sütun, ${s.giris === "sayi" ? "sayı" : s.giris === "secim" ? `seçim: ${(s.secenekler ?? []).join(" / ")}` : s.giris === "evet" ? "evet / hayır" : "yazı"}${s.birim ? ` (${s.birim})` : ""}${s.formul ? ` · formül ${s.formul}` : ""}${sinirMetni(s)}`);
      }
      const ob = olcumBasliklari(b);
      l.push(`  başlıklar: sıra “${ob.sira}”, uygunluk notu “${ob.not}”, sonuç “${ob.sonuc}” (belgede ${b.sonucYeri === "bas" ? "başta" : b.sonucYeri === "gizli" ? "gizli" : "sonda"})`);
      const k = etkinKurallar(t, b);
      l.push(k.length ? `  sonuç kuralı${b.hesap ? " (Bakanlık tablosu)" : ""}:` : "  sonuç kuralı yok (Sonuç'u denetçi seçer)");
      k.forEach((x, j) => l.push(`  ${j + 1}) ${x.kosul || "(boş)"}${x.neden ? ` · neden ${x.neden}` : ""}${x.agir ? " · ağır kusur" : ""}`));
    } else if (b.blok === "test") {
      const tb = testBasliklari(b);
      l.push(`  başlıklar: ölçüm “${tb.olcum}”, değer “${tb.deger}”, sınır “${tb.sinir}”, sonuç “${tb.sonuc}”`);
    }
    if (b.blok === "sonuc") { const m = sonucMetinleri(b); l.push(`  sözcükler: uygun “${m.uygun}”, uygun değil “${m.uygunDegil}”`); }
    if (b.blok === "not") l.push(`  yönlendirme: ${b.yonlendirme ? `“${b.yonlendirme.slice(0, 120)}”` : "yok"}${b.satir ? ` · belgede en az ${b.satir} satır` : ""}`);
    if (b.blok === "test") for (const d of b.degerler) {
      l.push(`- ${d.id} · ${d.ad} · test değeri, ${d.secenekler?.length ? `seçim: ${d.secenekler.join(" / ")}` : d.metin ? "yazı" : "sayı"}${d.birim ? ` (${d.birim})` : ""}${d.formul ? ` · formül ${d.formul}` : ""}${sinirMetni(d)}`);
    } else if (b.blok === "imza") {
      for (const s of imzaSatirlari(b)) {
        l.push(`- ${s.id} · ${s.ad} · imza satırı, ${IMZA_KISI_ADI[s.kim]}${s.alan ? ` · ${IMZA_ALAN_ADI[s.alan]}` : ""}${s.metin ? ` · yazı: ${s.metin.slice(0, 80)}` : ""}${s.tam ? " · tam satır" : ""}`);
      }
    } else if (b.blok === "liste") {
      l.push(`  cevaplar: ${b.cevaplar.join(" / ")}`);
      const lb = listeBasliklari(b);
      l.push(`  başlıklar: no “${lb.no}”, madde “${lb.madde}”, sonuç “${lb.sonuc}”`);
      for (const g of b.gruplar) {
        l.push(`  grup ${g.id} · ${g.ad || "(adsız)"}`);
        for (const m of g.maddeler) l.push(`- ${m.id} · ${m.metin.slice(0, 160)}${m.formul ? ` · formül ${m.formul}` : ""}`);
      }
    }
  }
  const m = l.join("\n");
  return m.length > FORMAT_HARITA_SINIRI ? `${m.slice(0, FORMAT_HARITA_SINIRI)}\n… (format uzun; geri kalanı kısaltıldı)` : m;
}

/** Haiku'nun verdiği işlem (biçimi gevşek — her alan denetlenir) */
export interface FormatIslemi {
  islem?: unknown; bolum?: unknown; oge?: unknown; tur?: unknown; ad?: unknown; birim?: unknown; formul?: unknown; secenekler?: unknown;
  op?: unknown; sinir?: unknown; zorunlu?: unknown; grup?: unknown; sonra?: unknown;
  /** sonuc_kurali: kurallar (boş liste kaldırır) ya da bakanlik: true (Bakanlık kuralına dön) */
  kurallar?: unknown; bakanlik?: unknown;
  /** imza_satiri (595): eylem (ekle | degistir | cikar | yukari | asagi), kisi (uzman | teknik | diger), bilgi (kişinin bilgisi), yazi (serbest
      satırın sabit yazısı), tam (tam satır) */
  eylem?: unknown; kisi?: unknown; bilgi?: unknown; yazi?: unknown; tam?: unknown;
  /** eimza_yeri (595): yer (hucre | kutu | gorunmez); kutuda mm — x soldan, y üstten, en, boy */
  yer?: unknown; x?: unknown; y?: unknown; en?: unknown; boy?: unknown;
  /** firma_satiri (595): eylem; ekle'de kaynak (FIRMA_KAYNAKLARI), ad, serbestte yazi; öteki eylemlerde oge (satırın kimliği ya da adı) */
  kaynak?: unknown;
  /** baslik (595): alan (hangi başlık / sözcük) + ad (yeni yazı; boş: bugünkü yazı); not_satiri: satir */
  alan?: unknown; satir?: unknown;
  /** dizilis (595): bilgi bölümünde bir satırda kaç bilgi (1 · 2 · 3) */
  dizilis?: unknown;
}
const metin = (x: unknown, n = 200) => (typeof x === "string" ? x.trim().replace(/\s+/g, " ").slice(0, n) : "");
const tr = (s: string) => s.trim().toLocaleLowerCase("tr");
const OGE_TURU: Record<string, OgeTuru> = { sayi: "sayi", "sayı": "sayi", metin: "metin", "yazı": "metin", yazi: "metin", secim: "secim", "seçim": "secim",
  evet: "evet", "evet/hayır": "evet", tarih: "tarih", coklu: "coklu" };
const OP: Record<string, "<=" | ">=" | "<" | ">"> = { "<=": "<=", "≤": "<=", ">=": ">=", "≥": ">=", "<": "<", ">": ">" };

/** bölüm: kimlikle ya da adıyla (büyük / küçük harf önemsiz) */
function bolumBul(t: FormatTanimi, x: unknown): number {
  const k = metin(x);
  if (!k) return -1;
  const i = t.bolumler.findIndex((b) => b.id === k);
  return i >= 0 ? i : t.bolumler.findIndex((b) => tr(b.ad) === tr(k));
}
type Ogesi = { id: string; ad: string };
const ogeler = (b: Bolum): Ogesi[] => (b.blok === "bilgi" ? b.alanlar.map((a) => ({ id: a.id, ad: a.ad }))
  : b.blok === "olcum" ? b.sutunlar.map((s) => ({ id: s.id, ad: s.ad })) : b.blok === "test" ? b.degerler.map((d) => ({ id: d.id, ad: d.ad }))
  : b.blok === "liste" ? b.gruplar.flatMap((g) => g.maddeler.map((m) => ({ id: m.id, ad: m.metin }))) : []);
function ogeBul(b: Bolum, x: unknown): string | null {
  const k = metin(x);
  if (!k) return null;
  const l = ogeler(b);
  return (l.find((o) => o.id === k) ?? l.find((o) => tr(o.ad) === tr(k)))?.id ?? null;
}
/** öğenin (kaydedilmiş biçimdeki) formülü */
const formulOf = (b: Bolum, id: string): string | undefined => (b.blok === "olcum" ? b.sutunlar.find((x) => x.id === id)?.formul
  : b.blok === "test" ? b.degerler.find((x) => x.id === id)?.formul : b.blok === "bilgi" ? b.alanlar.find((x) => x.id === id)?.formul
  : b.blok === "liste" ? b.gruplar.flatMap((g) => g.maddeler).find((x) => x.id === id)?.formul : undefined);
/** işlemin öğe yaması (yalnız verilen alanlar) */
function yama(x: FormatIslemi): OgeYamasi {
  const y: OgeYamasi = {};
  if (typeof x.ad === "string" && x.ad.trim()) y.ad = metin(x.ad);
  const tur = typeof x.tur === "string" ? OGE_TURU[tr(x.tur)] : undefined;
  if (tur) y.tur = tur;
  if (typeof x.birim === "string") y.birim = metin(x.birim, 40);
  if (typeof x.formul === "string") y.formul = x.formul.slice(0, 400);
  if (Array.isArray(x.secenekler)) y.secenekler = x.secenekler.filter((s): s is string => typeof s === "string").map((s) => metin(s, 60)).filter(Boolean).slice(0, 40);
  if (typeof x.op === "string") y.op = OP[x.op.trim()] ?? "";
  if (typeof x.sinir === "number" && Number.isFinite(x.sinir)) y.sinir = x.sinir;
  else if (typeof x.sinir === "string" && Number.isFinite(Number.parseFloat(x.sinir.replace(",", ".")))) y.sinir = Number.parseFloat(x.sinir.replace(",", "."));
  if (typeof x.zorunlu === "boolean") y.zorunlu = x.zorunlu;
  if (typeof x.tam === "boolean") y.tam = x.tam;
  /* türü verilmeyen formüllü öğe sayı açılır (556: formül her türde; tür verilirse o) */
  if (y.formul && !y.tur) y.tur = "sayi";
  return y;
}

export interface FormatIslemSonucu { t: FormatTanimi; yapilan: string[]; gecersiz: string[] }

/** işlemleri sırayla uygular; her biri bir öncekinin sonucuna (aynı istekte eklenen bölüme / öğeye adıyla ulaşılır) */
export function formatIslemleri(t0: FormatTanimi, islemler: readonly FormatIslemi[]): FormatIslemSonucu {
  let t = t0;
  const yapilan: string[] = [], gecersiz: string[] = [];
  for (const x of islemler.slice(0, FORMAT_ISLEM_EN_COK)) {
    const islem = metin(x?.islem, 40);
    const red = (neden: string) => { gecersiz.push(`${islem || "işlem"}: ${neden}`); };
    if (islem === "bolum_ekle") {
      const tur = metin(x.tur, 20) as Blok;
      if (!(EKLENIR_BLOK as readonly string[]).includes(tur)) { red(`bölüm türü şunlardan biri olmalı: ${EKLENIR_BLOK.join(", ")}`); continue; }
      const ad = metin(x.ad) || BLOK_TR[tur];
      const b = yeniBolum(t, tur, ad);
      /* yer: verilen bölümün ardı; yoksa sonuç / not / imza bölümlerinden önce; yoksa sona */
      const sonra = bolumBul(t, x.sonra);
      const son = t.bolumler.findIndex((y) => y.blok === "sonuc" || y.blok === "not" || y.blok === "imza");
      const p = sonra >= 0 ? sonra + 1 : son >= 0 ? son : t.bolumler.length;
      const l = [...t.bolumler]; l.splice(p, 0, b);
      t = { ...t, bolumler: l };
      yapilan.push(`“${ad}” bölümü eklendi`);
      continue;
    }
    if (islem === "firma_satiri") {
      const eylem = metin(x.eylem, 20);
      if (eylem === "ekle") {
        const k = metin(x.kaynak, 20);
        if (!(FIRMA_KAYNAKLARI as readonly string[]).includes(k)) { red(`kaynak şunlardan biri olmalı: ${FIRMA_KAYNAKLARI.join(", ")}`); continue; }
        const y = firmaSatiriEkle(t, k as (typeof FIRMA_KAYNAKLARI)[number], metin(x.ad) || undefined);
        if (!y.id) { red(`“${FIRMA_KAYNAK_ADI[k as (typeof FIRMA_KAYNAKLARI)[number]]}” zaten var`); continue; }
        t = k === "serbest" && typeof x.yazi === "string" ? firmaSatiriYaz(y.t, y.id, { metin: x.yazi }) : y.t;
        yapilan.push(`Firma bilgilerine satır eklendi: ${metin(x.ad) || FIRMA_KAYNAK_ADI[k as (typeof FIRMA_KAYNAKLARI)[number]]}`);
        continue;
      }
      const k = metin(x.oge), l = firmaSatirlari(t);
      const s = l.find((o) => o.id === k) ?? l.find((o) => tr(o.ad) === tr(k));
      if (!s) { red(`firma bilgisi satırı bulunamadı (${metin(x.oge, 60) || "—"})`); continue; }
      const once = t;
      if (eylem === "cikar") t = firmaSatiriSil(t, s.id);
      else if (eylem === "yukari" || eylem === "asagi") t = firmaSatiriTasi(t, s.id, eylem === "yukari" ? -1 : 1);
      else if (eylem === "degistir") {
        const y: { ad?: string; metin?: string; tam?: boolean } = {};
        if (metin(x.ad)) y.ad = metin(x.ad);
        if (typeof x.yazi === "string") y.metin = x.yazi;
        if (typeof x.tam === "boolean") y.tam = x.tam;
        t = firmaSatiriYaz(t, s.id, y);
      } else { red("eylem: ekle, degistir, cikar, yukari ya da asagi"); continue; }
      if (t === once || JSON.stringify(t) === JSON.stringify(once)) { red(`“${s.ad}” değişmedi (SGK, İSG-KATİP ve başlangıç çıkarılmaz; SGK / İSG-KATİP'in adı değişmez)`); continue; }
      yapilan.push(`Firma bilgileri: “${s.ad}” ${eylem === "cikar" ? "çıkarıldı" : eylem === "degistir" ? "değişti" : "taşındı"}`);
      continue;
    }
    if (islem === "baslik" && typeof x.alan === "string" && GORUNUM_BASLIKLARI.includes(x.alan as GorunumBasligi)) {
      const once = t;
      t = gorunumBasligiYaz(t, x.alan as GorunumBasligi, typeof x.ad === "string" ? x.ad : "");
      if (JSON.stringify(t) === JSON.stringify(once)) { red("değişmedi"); continue; }
      yapilan.push(`Başlık değişti: ${x.alan}`);
      continue;
    }
    if (islem === "eimza_yeri") {
      const yer = metin(x.yer, 20);
      if (yer !== "hucre" && yer !== "kutu" && yer !== "gorunmez") { red("yer: hucre, kutu ya da gorunmez"); continue; }
      const sayi = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v
        : typeof v === "string" && v.trim() && Number.isFinite(Number(v.replace(",", "."))) ? Number(v.replace(",", ".")) : undefined);
      t = eimzaYaz(t, { yer, x: sayi(x.x), y: sayi(x.y), en: sayi(x.en), boy: sayi(x.boy) });
      const g = t.gorunum.eimza;
      yapilan.push(yer === "hucre" ? "E-imzanın yeri: İmza hücresi" : yer === "gorunmez" ? "E-imza görünmez atılır"
        : `E-imzanın yeri: son sayfada kutu (soldan ${g?.x} mm, üstten ${g?.y} mm, ${g?.en} × ${g?.boy} mm)`);
      continue;
    }
    const i = bolumBul(t, x.bolum);
    if (i < 0) { red(`bölüm bulunamadı (${metin(x.bolum, 60) || "—"})`); continue; }
    const b = t.bolumler[i];
    if (islem === "bolum_sil") {
      if (b.blok === "cihaz") { red("ölçüm cihazları bölümü çıkarılmaz"); continue; }
      t = bolumSil(t, i); yapilan.push(`“${b.ad}” bölümü çıkarıldı`); continue;
    }
    if (islem === "bolum_adi") {
      const ad = metin(x.ad);
      if (!ad) { red("yeni ad yok"); continue; }
      t = bolumAdi(t, i, ad); yapilan.push(`“${b.ad}” bölümünün adı “${ad}” oldu`); continue;
    }
    if (islem === "sonuc_kurali") {
      if (b.blok !== "olcum") { red(`sonuç kuralı yalnız ölçüm tablosunda olur (“${b.ad}”)`); continue; }
      if (x.bakanlik === true) {
        if (!b.hesap) { red(`“${b.ad}” tablosunun Bakanlık kuralı yok`); continue; }
        t = bakanlikKuralinaDon(t, i); yapilan.push(`“${b.ad}” tablosunun sonuç kuralı Bakanlık kuralına döndü`); continue;
      }
      if (!Array.isArray(x.kurallar)) { red("kurallar listesi yok (boş liste kuralları kaldırır)"); continue; }
      const l: SonucKurali[] = (x.kurallar as unknown[]).slice(0, KURAL_EN_COK).flatMap((k) => {
        const o = k && typeof k === "object" && !Array.isArray(k) ? k as Record<string, unknown> : null;
        if (!o || typeof o.kosul !== "string" || !o.kosul.trim()) return [];
        const yazi = (v: unknown, n: number) => (typeof v === "string" && v.trim() ? v.slice(0, n) : undefined);
        return [{ kosul: o.kosul.slice(0, 2000), neden: yazi(o.neden, 2000), aciklama: yazi(o.aciklama, 400), agir: o.agir === true }];
      });
      if (x.kurallar.length && !l.length) { red("kuralların koşulu (formül) yok"); continue; }
      t = sonucKuraliYaz(t, i, l);
      yapilan.push(l.length ? `“${b.ad}” tablosunun sonuç kuralı yazıldı (${l.length} kural)` : `“${b.ad}” tablosunun sonuç kuralları kaldırıldı (Sonuç'u denetçi seçer)`);
      continue;
    }
    if (islem === "imza_satiri") {
      if (b.blok !== "imza") { red(`imza satırı yalnız imza bölümünde olur (“${b.ad}”)`); continue; }
      const eylem = metin(x.eylem, 20);
      if (eylem === "ekle") {
        const kim = metin(x.kisi, 20);
        if (kim !== "uzman" && kim !== "teknik" && kim !== "diger") { red("kisi: uzman, teknik ya da diger"); continue; }
        const bilgi = metin(x.bilgi, 20) as ImzaAlani;
        if (kim !== "diger" && !(IMZA_ALANLARI as readonly string[]).includes(bilgi)) { red(`bilgi şunlardan biri olmalı: ${IMZA_ALANLARI.join(", ")}`); continue; }
        const y = imzaSatiriEkle(t, i, kim, kim === "diger" ? undefined : bilgi, metin(x.ad) || undefined);
        if (!y.id) { red("bu kişinin bu bilgisi olmaz (onay zamanı yalnız teknik yöneticide)"); continue; }
        t = y.t;
        if (kim === "diger" && typeof x.yazi === "string") t = imzaSatiriYaz(t, i, y.id, { metin: x.yazi });
        yapilan.push(`“${b.ad}” bölümüne imza satırı eklendi: ${metin(x.ad) || (kim === "diger" ? "Yeni satır" : IMZA_ALAN_ADI[bilgi])}`);
        continue;
      }
      const k = metin(x.oge), l = imzaSatirlari(b);
      const s = l.find((o) => o.id === k) ?? l.find((o) => tr(o.ad) === tr(k));
      if (!s) { red(`imza satırı bulunamadı (${metin(x.oge, 60) || "—"})`); continue; }
      if (eylem === "cikar") { t = imzaSatiriSil(t, i, s.id); yapilan.push(`“${s.ad}” imza satırı çıkarıldı`); continue; }
      if (eylem === "yukari" || eylem === "asagi") {
        const once = t;
        t = imzaSatiriTasi(t, i, s.id, eylem === "yukari" ? -1 : 1);
        if (t === once) { red(`“${s.ad}” ${eylem === "yukari" ? "en üstte" : "en altta"}`); continue; }
        yapilan.push(`“${s.ad}” ${eylem === "yukari" ? "yukarı" : "aşağı"} taşındı`); continue;
      }
      if (eylem === "degistir") {
        const y: { ad?: string; metin?: string; tam?: boolean } = {};
        if (metin(x.ad)) y.ad = metin(x.ad);
        if (typeof x.yazi === "string") y.metin = x.yazi;
        if (typeof x.tam === "boolean") y.tam = x.tam;
        if (!Object.keys(y).length) { red("değişecek bir şey yok"); continue; }
        t = imzaSatiriYaz(t, i, s.id, y); yapilan.push(`“${s.ad}” imza satırı değişti`); continue;
      }
      red("eylem: ekle, degistir, cikar, yukari ya da asagi");
      continue;
    }
    if (islem === "baslik") {
      const a = metin(x.alan, 20) as BolumBasligi, once = t;
      t = bolumBasligiYaz(t, i, a, typeof x.ad === "string" ? x.ad : "");
      if (JSON.stringify(t) === JSON.stringify(once)) { red(`“${b.ad}” bölümünde “${a}” başlığı yok ya da değişmedi`); continue; }
      yapilan.push(`“${b.ad}” bölümünün ${a} başlığı değişti`);
      continue;
    }
    if (islem === "tablo_sutunu") {
      if (b.blok !== "cihaz" && b.blok !== "kusur") { red("sütunlar yalnız ölçüm cihazları ve uygunsuzluk bölümünde"); continue; }
      const eylem = metin(x.eylem, 20);
      if (b.blok === "kusur" && (eylem === "tablo" || eylem === "liste")) {
        t = kusurTablosuYaz(t, i, eylem === "tablo");
        yapilan.push(`“${b.ad}” ${eylem === "tablo" ? "tablo olarak" : "madde listesi olarak"} basılır`);
        continue;
      }
      if (eylem === "ekle") {
        const a = metin(x.alan, 20), izinli: readonly string[] = b.blok === "cihaz" ? CIHAZ_ALANLARI : KUSUR_ALANLARI;
        if (!izinli.includes(a)) { red(`alan şunlardan biri olmalı: ${izinli.join(", ")}`); continue; }
        const y = tabloSutunuEkle(b.blok === "kusur" && !b.sutunlar?.length ? kusurTablosuYaz(t, i, true) : t, i, a as CihazAlani | KusurAlani, metin(x.ad) || undefined);
        if (!y.id) { red(`“${a}” sütunu zaten var`); continue; }
        t = y.t; yapilan.push(`“${b.ad}” tablosuna sütun eklendi: ${a}`); continue;
      }
      const l = b.blok === "cihaz" ? cihazSutunlari(b) : b.sutunlar ?? [], k = metin(x.oge);
      const s = l.find((o) => o.id === k) ?? l.find((o) => tr(o.ad) === tr(k)) ?? l.find((o) => o.alan === k);
      if (!s) { red(`sütun bulunamadı (${metin(x.oge, 60) || "—"})`); continue; }
      const once = t;
      if (eylem === "cikar") t = tabloSutunuSil(t, i, s.id);
      else if (eylem === "yukari" || eylem === "asagi") t = tabloSutunuTasi(t, i, s.id, eylem === "yukari" ? -1 : 1);
      else if (eylem === "degistir") t = tabloSutunuYaz(t, i, s.id, metin(x.ad));
      else { red("eylem: ekle, degistir, cikar, yukari (sola), asagi (sağa); uygunsuzlukta tablo ya da liste"); continue; }
      if (JSON.stringify(t) === JSON.stringify(once)) { red(`“${s.ad}” değişmedi (cihaz tablosunda en az bir sütun kalır)`); continue; }
      yapilan.push(`“${b.ad}” tablosunda “${s.ad}” ${eylem === "cikar" ? "çıkarıldı" : eylem === "degistir" ? "değişti" : "taşındı"}`);
      continue;
    }
    if (islem === "dizilis") {
      const n = typeof x.dizilis === "number" ? x.dizilis : Number(x.dizilis);
      if (b.blok !== "bilgi" || (n !== 1 && n !== 2 && n !== 3)) { red("yalnız bilgi bölümünde; dizilis 1, 2 ya da 3"); continue; }
      t = bilgiDizilisiYaz(t, i, n); yapilan.push(`“${b.ad}” belgede bir satırda ${n} bilgi`);
      continue;
    }
    if (islem === "sonuc_yeri") {
      const yer = metin(x.yer, 10);
      if (b.blok !== "olcum" || (yer !== "son" && yer !== "bas" && yer !== "gizli")) { red("yalnız ölçüm tablosunda; yer son, bas ya da gizli"); continue; }
      t = sonucYeriYaz(t, i, yer); yapilan.push(`“${b.ad}” tablosunda Sonuç sütunu belgede ${yer === "bas" ? "başta" : yer === "gizli" ? "gizli" : "sonda"}`);
      continue;
    }
    if (islem === "not_satiri") {
      if (b.blok !== "not") { red("yalnız yorum (not) bölümünde"); continue; }
      const n = typeof x.satir === "number" ? x.satir : Number(x.satir);
      t = notSatiriYaz(t, i, Number.isFinite(n) && n > 0 ? n : null); yapilan.push(`“${b.ad}” belgede en az ${Number.isFinite(n) && n > 0 ? Math.min(30, Math.round(n)) : "—"} satır`);
      continue;
    }
    if (islem === "oge_tasi") {
      const id = ogeBul(b, x.oge), eylem = metin(x.eylem, 10);
      if (!id) { red(`öğe bulunamadı (${metin(x.oge, 60) || "—"})`); continue; }
      if (eylem !== "yukari" && eylem !== "asagi") { red("eylem: yukari ya da asagi (sütunda sola / sağa)"); continue; }
      const once = t;
      t = ogeTasi(t, i, id, eylem === "yukari" ? -1 : 1);
      if (t === once) { red("öğe zaten uçta"); continue; }
      yapilan.push(`“${ogeler(b).find((o) => o.id === id)!.ad}” ${eylem === "yukari" ? "yukarı" : "aşağı"} taşındı`);
      continue;
    }
    if (islem === "grup_ekle") {
      if (b.blok !== "liste") { red("grup yalnız kontrol listesine eklenir"); continue; }
      const ad = metin(x.ad);
      t = grupEkle(t, i, ad); yapilan.push(`“${b.ad}” listesine “${ad || "adsız"}” grubu eklendi`); continue;
    }
    if (islem === "oge_ekle") {
      if (b.blok !== "bilgi" && b.blok !== "olcum" && b.blok !== "test" && b.blok !== "liste") { red(`“${b.ad}” bölümüne öğe eklenmez`); continue; }
      const ad = metin(x.ad);
      if (!ad) { red("öğenin adı yok"); continue; }
      if (b.blok === "liste") {
        const gid = metin(x.grup) ? (b.gruplar.find((g) => g.id === metin(x.grup) || tr(g.ad) === tr(metin(x.grup)))?.id ?? null) : null;
        if (metin(x.grup) && !gid) { red(`grup bulunamadı (${metin(x.grup, 60)})`); continue; }
        t = gid ? maddeEkle(t, i, gid, ad) : ogeEkle(t, i, ad);
        yapilan.push(`“${b.ad}” listesine madde eklendi: ${ad}`);
        continue;
      }
      const onek = b.blok === "bilgi" ? "a" : b.blok === "olcum" ? "s" : "d";
      const id = yeniKimlik(t, onek);
      t = ogeEkle(t, i, ad);
      const y = yama(x);
      delete y.ad;
      /* bilgi alanı ogeEkle'de yazı açılır — sayı / seçim istenirse türü; formül varsa sayı */
      if (Object.keys(y).length) t = ogeYaz(t, i, id, y);
      const f = formulOf(t.bolumler[i], id);
      yapilan.push(`“${b.ad}” bölümüne ${b.blok === "olcum" ? "sütun" : b.blok === "test" ? "test değeri" : "alan"} eklendi: ${ad}${f ? ` (formül ${f})` : ""}`);
      continue;
    }
    if (islem === "oge_degistir" || islem === "oge_sil") {
      const id = ogeBul(b, x.oge);
      if (!id) { red(`öğe bulunamadı (${metin(x.oge, 60) || "—"})`); continue; }
      const ad = ogeler(b).find((o) => o.id === id)!.ad;
      if (islem === "oge_sil") { t = ogeSil(t, i, id); yapilan.push(`“${ad}” çıkarıldı`); continue; }
      const y = yama(x);
      if (!Object.keys(y).length) { red("değişecek bir şey yok"); continue; }
      const once = t;
      t = ogeYaz(t, i, id, y);
      if (t === once) { red(`“${ad}” değişmedi`); continue; }
      yapilan.push(`“${ad}” değişti`);
      continue;
    }
    red("bilinmeyen işlem (bolum_ekle, bolum_sil, bolum_adi, grup_ekle, oge_ekle, oge_degistir, oge_sil, oge_tasi, sonuc_kurali, imza_satiri, eimza_yeri, firma_satiri, "
      + "baslik, sonuc_yeri, not_satiri, tablo_sutunu, dizilis)");
  }
  return { t, yapilan, gecersiz };
}

const GORUNUM_BASLIKLARI: readonly GorunumBasligi[] = ["bas_kod", "bas_surum", "bas_no", "bas_tarih", "alt_yazi", "ekipman_kod", "ekipman_tur"];

/** Haiku'ya araç tanımı (src/server/yz/say.ts — format yapıcıdayken) */
export const FORMAT_ARACI = {
  name: "formati_duzenle",
  description: "Açık format taslağını değiştirir (format yapıcıdaki tuşlarla aynı). İşlemler sırayla uygulanır; bölüm ve öğe kimlikle ya da adıyla "
    + "bulunur (aynı istekte eklenen bölüme adıyla öğe eklenebilir). islem: bolum_ekle (tur: olcum | test | bilgi | liste | foto | not | metin | sonuc; ad; "
    + "sonra: hangi bölümün ardına), bolum_sil, bolum_adi (ad), grup_ekle (liste bölümüne; ad), oge_ekle (bölüme alan / sütun / test değeri / madde: ad, tur: "
    + "sayi | metin | secim | evet | tarih, birim, formul, secenekler, op: <= | >= | < | >, sinir, zorunlu; listeye madde için grup), oge_degistir (oge + "
    + "değişecek alanlar), oge_sil (oge), sonuc_kurali (ölçüm tablosunun satır sonucu: kurallar — her biri kosul: DOĞRU / YANLIŞ veren formül, ör. "
    + "[Direnç] > 50; neden: sağlanmazsa yazılan, \"=\" ile başlarsa formül; aciklama; agir — listenin tamamı yazılır, boş liste kuralları kaldırır; ya da "
    + "bakanlik: true Bakanlık kuralına döner; ZS([Açma eğrisi]; [In]) Zs'yi verir). Formül: aynı satırın / formatın sayılarıyla, örn. 480 / [RCd] — "
    + "boşluklu ad köşeli parantezle. imza_satiri (imza bölümünün satırları: eylem ekle — kisi uzman | teknik | diger, bilgi ad | meslek | ekipnet | diploma | "
    + "oda | eposta | tel | imza | zaman (zaman yalnız teknikte), ad, serbest satırda yazi —, degistir (oge + ad / yazi / tam), cikar, yukari, asagi). "
    + "eimza_yeri (e-imzanın imzaya hazırlanan PDF'teki yeri: yer hucre — İmza hücresi — | kutu — son sayfada; x soldan, y üstten, en, boy mm — | gorunmez). "
    + "firma_satiri (1. bölüm Firma bilgileri: eylem ekle — kaynak firma | adres | rapor_no | rapor_tarihi | isg | sgk | bas | bit | sonraki | takip | metot | "
    + "eposta | tel | plan_no | serbest, ad, serbestte yazi —, degistir (oge + ad / yazi / tam), cikar, yukari, asagi; SGK, İSG-KATİP, başlangıç çıkmaz). "
    + "baslik (sabit başlık / sözcük: bolum + alan sira | not | sonuc (ölçüm), olcum | deger | sinir | sonuc (test), no | madde | sonuc (kontrol listesi), "
    + "uygun | uygun_degil (sonuç bölümü), yonlendirme (yorum); bölümsüz alan bas_kod | bas_surum | bas_no | bas_tarih | alt_yazi ({firma}, {kod}) | ekipman_kod | "
    + "ekipman_tur; ad: yeni yazı, boş bugünküne döner), sonuc_yeri (ölçüm tablosu: yer son | bas | gizli — belgede), not_satiri (yorum: satir), "
    + "oge_tasi (bolum + oge + eylem yukari | asagi; sütunda sola / sağa; madde grubun ucundan komşu gruba). "
    + "tablo_sutunu (ölçüm cihazları ya da uygunsuzluk bölümünün sütunları: eylem ekle — alan cihaz | tur | kod_seri | kod | seri | marka | model | kal_tarih | "
    + "kal_bitis | sertifika (cihaz) ya da sira | bolum | metin | agir | foto (uygunsuzluk), ad —, degistir (oge + ad), cikar, yukari (sola), asagi (sağa); "
    + "uygunsuzlukta eylem tablo | liste). dizilis (bilgi bölümü: dizilis 1 | 2 | 3 — belgede bir satırda kaç bilgi). Alanın belgede tam satırı oge_degistir tam. "
    + "Değişiklik taslakta olur; kullanıcı Kaydet ve Yayınla der.",
  input_schema: {
    type: "object",
    properties: {
      islemler: {
        type: "array", maxItems: FORMAT_ISLEM_EN_COK,
        items: {
          type: "object",
          properties: {
            islem: { type: "string", enum: ["bolum_ekle", "bolum_sil", "bolum_adi", "grup_ekle", "oge_ekle", "oge_degistir", "oge_sil", "oge_tasi", "sonuc_kurali", "imza_satiri", "eimza_yeri", "firma_satiri",
              "baslik", "sonuc_yeri", "not_satiri", "tablo_sutunu", "dizilis"] },
            bolum: { type: "string" }, oge: { type: "string" }, tur: { type: "string" }, ad: { type: "string" }, birim: { type: "string" },
            formul: { type: "string" }, secenekler: { type: "array", items: { type: "string" } }, op: { type: "string" }, sinir: { type: "number" },
            zorunlu: { type: "boolean" }, grup: { type: "string" }, sonra: { type: "string" },
            kurallar: { type: "array", maxItems: KURAL_EN_COK, items: { type: "object", properties: {
              kosul: { type: "string" }, neden: { type: "string" }, aciklama: { type: "string" }, agir: { type: "boolean" } }, required: ["kosul"] } },
            bakanlik: { type: "boolean" },
            eylem: { type: "string", enum: ["ekle", "degistir", "cikar", "yukari", "asagi", "tablo", "liste"] }, dizilis: { type: "number" }, kisi: { type: "string", enum: ["uzman", "teknik", "diger"] },
            bilgi: { type: "string", enum: [...IMZA_ALANLARI] }, yazi: { type: "string" }, tam: { type: "boolean" },
            kaynak: { type: "string", enum: [...FIRMA_KAYNAKLARI] },
            yer: { type: "string", enum: ["hucre", "kutu", "gorunmez", "son", "bas", "gizli"] }, alan: { type: "string" }, satir: { type: "number" }, x: { type: "number" }, y: { type: "number" }, en: { type: "number" }, boy: { type: "number" },
          },
          required: ["islem"],
        },
      },
    },
    required: ["islemler"],
  },
} as const;

