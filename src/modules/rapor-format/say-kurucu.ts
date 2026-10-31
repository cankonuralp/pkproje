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
   (kurucu.ts tabloSutunu*, kusurTablosuYaz, bilgiDizilisiYaz; sunum 595 madde 2, 9, 10). Başlık tablosunun doküman bilgisi satırları "bas_satiri"
   (ekle — kayıt bilgisi ya da serbest —, değiştir, çıkar, yukarı, aşağı), hücrelerin yeri "bas_hucre" (sola / sağa; kurucu.ts basSatiri*, basHucreTasi;
   madde 13). */
import { SINIR_ISARETI } from "../../format/hesap.ts";
import { ayir, birlestir, hucreleriYaz, kapsama, satirEkle, satirSil, sutunEkle, sutunGenisligi, sutunSil, type TabloBolumu } from "../../format/tablo.ts";
import { Hucre, HUCRE_ALAN_TURLERI, HUCRE_TURLERI, TABLO_KAYNAK_ADI, TABLO_KAYNAKLARI } from "../../format/tanim.ts";
import {
  basSatirlari, basSirasi, cihazSutunlari, ekipmanEtiketleri, firmaSatirlari, imzaSatirlari, listeBasliklari, olcumBasliklari, sonucMetinleri, testBasliklari,
} from "../../format/duzen.ts";
import { etkinKurallar } from "../../format/sonuc.ts";
import { BAS_HUCRELERI, BAS_KAYNAK_ADI, BAS_KAYNAKLARI, type BasHucresi, type BasKaynagi, CIHAZ_ALANLARI, FIRMA_KAYNAK_ADI, FIRMA_KAYNAKLARI, KUSUR_ALANLARI, type CihazAlani, type KusurAlani, IMZA_ALAN_ADI, IMZA_ALANLARI, IMZA_KISI_ADI, KURAL_EN_COK, type Blok, type Bolum, type FormatTanimi, type ImzaAlani, type SonucKurali } from "../../format/tanim.ts";
import {
  bakanlikKuralinaDon, basHucreTasi, basSatiriEkle, basSatiriSil, basSatiriTasi, basSatiriYaz, bilgiDizilisiYaz, sartliYaz, fotoKutusuEkle, fotoKutusuSil, fotoKutusuTasi, fotoKutusuYaz, ekSutunAdi, ekSutunEkle, ekSutunSil, ekSutunTasi, ekSutunYaz, eksikEkSutunlar, hazirSatirEkle, hazirSatirSil, hazirSatirTasi, hazirSatirYaz, bolumAdi, eksikTabloAlanlari, kusurTablosuYaz, tabloSutunuEkle, tabloSutunuSil, tabloSutunuTasi, tabloSutunuYaz, bolumBasligiYaz, bolumSil, eimzaYaz, gorunumBasligiYaz, notSatiriYaz, ogeTasi, sonucYeriYaz, type BolumBasligi,
  type GorunumBasligi, firmaSatiriEkle, firmaSatiriSil, firmaSatiriTasi, firmaSatiriYaz, grupEkle, imzaSatiriEkle, imzaSatiriSil, imzaSatiriTasi, imzaSatiriYaz, maddeEkle, ogeEkle, ogeSil, ogeYaz,
  sonucKuraliYaz, yeniBolum, yeniKimlik, type OgeTuru, type OgeYamasi,
} from "./kurucu.ts";

/* 2026-10-23 (S.A.Y baştan — reisim: "hiç bir kısıtı olmasın"): haritanın 40 000 karakter sınırı, metinlerin kısaltılması ve tek istekteki 100
   işlem sınırı kalktı — harita formatın tamamı, işlemler olduğu gibi */
/** S.A.Y'ın ekleyebildiği bölüm türleri (ölçüm cihazları, imza, kusur bölümleri formatta tektir — kurucu kendi ekler) */
export const EKLENIR_BLOK = ["olcum", "test", "bilgi", "liste", "foto", "not", "metin", "sonuc", "tablo"] as const;
const BLOK_TR: Record<Blok, string> = {
  bilgi: "bilgi alanları", liste: "kontrol listesi", olcum: "ölçüm tablosu", test: "test değerleri", cihaz: "ölçüm cihazları", foto: "fotoğraflar",
  kusur: "kusur açıklamaları", sonuc: "sonuç", not: "not / yorum", imza: "imza", metin: "serbest metin", tablo: "serbest tablo",
};
const sinirMetni = (o: { op?: string; sinir?: number }) => (o.op && o.sinir !== undefined ? `, sınır ${SINIR_ISARETI[o.op as keyof typeof SINIR_ISARETI] ?? o.op} ${o.sinir}` : "");

/** serbest tablo hücresinin haritadaki satırı */
function hucreOzeti(h: Hucre): string {
  const ad = h.ad ? ` · ad “${h.ad}”` : "";
  if (h.tur === "yazi") return (h.m ?? "").trim() ? `yazı “${h.m}”` : "boş";
  if (h.tur === "alan") {
    return `elle doldurulan (${h.alan ?? "metin"}${h.secenekler?.length ? `: ${h.secenekler.join(" / ")}` : ""})${h.birim ? ` (${h.birim})` : ""}${h.zorunlu ? " · zorunlu" : ""}${h.formul ? ` · formül ${h.formul}` : ""}${ad}`;
  }
  if (h.tur === "kayit") return `kayıttan: ${h.veri ?? (h.kaynak ? `${h.kaynak} (${TABLO_KAYNAK_ADI[h.kaynak]})` : "—")}${ad}`;
  return `${h.tur}${h.gorsel ? ` (${h.gorsel})` : ""}${h.kim ? ` (${h.kim})` : ""}${ad}`;
}

export function formatHaritasi(t: FormatTanimi): string {
  const l: string[] = ["Format taslağının bölümleri (bölüm kimliği · tür · ad) ve öğeleri (öğe kimliği · ad · tür; formül = kendiliğinden hesaplanan):"];
  /* serbest düzende (belge formatları, basılı formdan şablon) sabit firma / başlık / ekipman satırı yok — yalnız bölümler */
  if (!t.gorunum.serbest) {
    l.push("## firma · 1. bölüm · Firma bilgileri (satırlar — kimlik · ad · bilgi):");
    for (const s of firmaSatirlari(t)) l.push(`- ${s.id} · ${s.ad} · ${s.kaynak === "serbest" ? `serbest${s.metin ? `, yazı: ${s.metin}` : ""}` : FIRMA_KAYNAK_ADI[s.kaynak]}${s.tam ? " · tam satır" : ""}`);
    const ee = ekipmanEtiketleri(t);
    /* 595 (madde 13): başlık tablosu — hücrelerin sırası ve doküman bilgisi satırları */
    l.push(`## Başlık tablosu (sayfa başı) · hücreler soldan sağa: ${basSirasi(t).join(" · ")} (logo · firma · akr = akreditasyon · ad = belge adı · dok = doküman bilgisi)`);
    l.push("Doküman bilgisi satırları (kimlik · ad · bilgi):");
    for (const s of basSatirlari(t)) l.push(`- ${s.id} · ${s.ad} · ${s.kaynak === "serbest" ? `serbest${s.metin ? `, yazı: ${s.metin}` : ""}` : BAS_KAYNAK_ADI[s.kaynak]}`);
    l.push(`Ekipman satırları: “${ee.kod}”, “${ee.tur}” · sayfa altı: “${t.gorunum.altYazi ?? "{firma} · {kod}"}”`);
  }
  const e = t.gorunum.eimza;
  const e2 = t.gorunum.eimza2;
  if (e2) l.push(`Onaylayanın e-imza yeri: ${e2.yer === "hucre" ? "teknik yöneticinin İmza hücresi"
    : `${e2.sayfa === "her" ? "her" : "son"} sayfada kutu (soldan ${e2.x ?? "?"} mm, üstten ${e2.y ?? "?"} mm, ${e2.en ?? "?"} × ${e2.boy ?? "?"} mm)`}`);
  l.push(`E-imzanın yeri: ${!e || e.yer === "hucre" ? "imza bölümündeki İmza hücresi" : e.yer === "gorunmez" ? "görünmez imza"
    : `${e.sayfa === "her" ? "her" : "son"} sayfada kutu (soldan ${e.x ?? "?"} mm, üstten ${e.y ?? "?"} mm, ${e.en ?? "?"} × ${e.boy ?? "?"} mm)`}`);
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
      if (b.hazir?.length) l.push(`  hazır satırlar (${b.satir === "sabit" ? "sabit — denetçi eklemez" : "denetçi de ekler"}): ${b.hazir.map((x, j) => `${j + 1}) ${x}`).join(" · ")}`);
      const ob = olcumBasliklari(b);
      l.push(`  başlıklar: sıra “${ob.sira}”, uygunluk notu “${ob.not}”, sonuç “${ob.sonuc}” (belgede ${b.sonucYeri === "bas" ? "başta" : b.sonucYeri === "gizli" ? "gizli" : "sonda"})`);
      const k = etkinKurallar(t, b);
      l.push(k.length ? `  sonuç kuralı${b.hesap ? " (Bakanlık tablosu)" : ""}:` : "  sonuç kuralı yok (Sonuç'u denetçi seçer)");
      k.forEach((x, j) => l.push(`  ${j + 1}) ${x.kosul || "(boş)"}${x.neden ? ` · neden ${x.neden}` : ""}${x.agir ? " · ağır kusur" : ""}`));
    } else if (b.blok === "test") {
      const tb = testBasliklari(b);
      l.push(`  başlıklar: ölçüm “${tb.olcum}”, değer “${tb.deger}”, sınır “${tb.sinir}”, sonuç “${tb.sonuc}”`);
      if (b.ekSutunlar?.length) l.push(`  ek sütunlar (kimlik · ad · tür): ${b.ekSutunlar.map((s) => `${s.id} · ${s.ad} · ${s.alan}${s.secenekler?.length ? ` (${s.secenekler.join(" / ")})` : ""}`).join("; ")}`);
    }
    if (b.blok === "tablo") {
      l.push(`  ${b.satirlar.length} satır × ${b.sutun.length} sütun (sütun genişliği %: ${b.sutun.join(" / ")})${b.satirlar.some((x) => x.tekrar) ? ` · çoğalan satır: ${b.satirlar.flatMap((x, r) => (x.tekrar ? [r] : [])).join(", ")}` : ""}`);
      l.push("  hücreler ([satır,sütun] 0'dan · birleşikse satır×sütun kapsamı · içerik):");
      for (const h of b.hucreler) l.push(`- [${h.r},${h.c}]${(h.rs ?? 1) > 1 || (h.cs ?? 1) > 1 ? ` ${h.rs ?? 1}×${h.cs ?? 1}` : ""} · ${hucreOzeti(h)}`);
    }
    if (b.blok === "foto") l.push(`  en az ${b.enAz}, en çok ${b.enCok} fotoğraf${b.kutular?.length ? ` · kutular: ${b.kutular.map((x) => `${x.id} · ${x.ad}`).join("; ")}` : " · adlı kutu yok"}`);
    if (b.blok === "sonuc") {
      const m = sonucMetinleri(b);
      l.push(`  sözcükler: uygun “${m.uygun}”, uygun değil “${m.uygunDegil}”${b.sartli ? `, şartlı uygun “${m.sartli}”` : " · şartlı uygun seçeneği kapalı"}`);
    }
    if (b.blok === "not") l.push(`  yönlendirme: ${b.yonlendirme ? `“${b.yonlendirme}”` : "yok"}${b.satir ? ` · belgede en az ${b.satir} satır` : ""}`);
    if (b.blok === "test") for (const d of b.degerler) {
      l.push(`- ${d.id} · ${d.ad} · test değeri, ${d.secenekler?.length ? `seçim: ${d.secenekler.join(" / ")}` : d.metin ? "yazı" : "sayı"}${d.birim ? ` (${d.birim})` : ""}${d.formul ? ` · formül ${d.formul}` : ""}${sinirMetni(d)}`);
    } else if (b.blok === "imza") {
      for (const s of imzaSatirlari(b)) {
        l.push(`- ${s.id} · ${s.ad} · imza satırı, ${IMZA_KISI_ADI[s.kim]}${s.alan ? ` · ${IMZA_ALAN_ADI[s.alan]}` : ""}${s.metin ? ` · yazı: ${s.metin}` : ""}${s.tam ? " · tam satır" : ""}`);
      }
    } else if (b.blok === "liste") {
      l.push(`  cevaplar: ${b.cevaplar.join(" / ")}`);
      const lb = listeBasliklari(b);
      l.push(`  başlıklar: no “${lb.no}”, madde “${lb.madde}”, sonuç “${lb.sonuc}”`);
      if (b.ekSutunlar?.length) l.push(`  ek sütunlar (kimlik · ad · bilgi): ${b.ekSutunlar.map((s) => `${s.id} · ${s.ad} · ${s.alan}`).join("; ")}`);
      for (const g of b.gruplar) {
        l.push(`  grup ${g.id} · ${g.ad || "(adsız)"}`);
        for (const m of g.maddeler) l.push(`- ${m.id} · ${m.metin}${m.formul ? ` · formül ${m.formul}` : ""}`);
      }
    }
  }
  const m = l.join("\n");
  return m;
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
  /** eimza_yeri (595): yer (hucre | kutu | gorunmez; onaylayanda yok | hucre | kutu); kutuda mm — x soldan, y üstten, en, boy; sayfa son | her;
      kisi teknik → onaylayanın yeri (İ5, 2026-10-17) */
  yer?: unknown; x?: unknown; y?: unknown; en?: unknown; boy?: unknown; sayfa?: unknown;
  /** firma_satiri (595): eylem; ekle'de kaynak (FIRMA_KAYNAKLARI), ad, serbestte yazi; öteki eylemlerde oge (satırın kimliği ya da adı) */
  kaynak?: unknown;
  /** baslik (595): alan (hangi başlık / sözcük) + ad (yeni yazı; boş: bugünkü yazı); not_satiri: satir */
  alan?: unknown; satir?: unknown;
  /** dizilis (595): bilgi bölümünde bir satırda kaç bilgi (1 · 2 · 3) */
  dizilis?: unknown;
  /** sartli_secenek (595 madde 12): acik true / false */
  acik?: unknown;
  /** tablo (2026-10-31, serbest tablo — belge formatları ve serbest düzenli rapor): eylem hucre | satir_ekle | satir_sil | sutun_ekle | sutun_sil |
      birlestir | ayir | genislik; r, c (0'dan; ekle'de yeni satır / sütunun yeri), r2, c2 (birleştir / ayır alanının karşı köşesi), yuzde (genislik),
      hucre (hucre eyleminde içerik: tur, yazi, deger, secenekler, zorunlu, birim, kaynak, veri, ad) */
  r?: unknown; c?: unknown; r2?: unknown; c2?: unknown; yuzde?: unknown; hucre?: unknown;
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

const tamsayi = (x: unknown): number | null => (typeof x === "number" && Number.isInteger(x) ? x
  : typeof x === "string" && /^\d+$/.test(x.trim()) ? Number(x.trim()) : null);
const HUCRE_TUR: Record<string, Hucre["tur"]> = { ...Object.fromEntries(HUCRE_TURLERI.map((k) => [k, k])), "yazı": "yazi", elle: "alan", "kayıt": "kayit", "sıra": "sira",
  "görsel": "gorsel", "fotoğraf": "foto", "sonuç": "sonuc" };
const DEGER_TURU: Record<string, NonNullable<Hucre["alan"]>> = { ...Object.fromEntries(HUCRE_ALAN_TURLERI.map((k) => [k, k])), "sayı": "sayi", yazi: "metin", "yazı": "metin",
  "seçim": "secim", "evet/hayır": "evet" };
/** hucre eyleminin yeni içeriği (görünüm s, konum ve birleşim korunur); geçersizse neden */
function yeniHucre(t: FormatTanimi, eski: Hucre, g: Record<string, unknown>): Hucre | string {
  const tur = HUCRE_TUR[tr(metin(g.tur, 20) || eski.tur)];
  if (!tur) return `hücre türü şunlardan biri olmalı: ${HUCRE_TURLERI.join(", ")}`;
  const y: Hucre = { r: eski.r, c: eski.c, ...(eski.rs ? { rs: eski.rs } : {}), ...(eski.cs ? { cs: eski.cs } : {}), ...(eski.s ? { s: eski.s } : {}), tur };
  const ad = metin(g.ad);
  if (ad) y.ad = ad;
  if (tur === "yazi") y.m = typeof g.yazi === "string" ? g.yazi.slice(0, 2000) : eski.tur === "yazi" ? eski.m ?? "" : "";
  if (tur === "alan") {
    y.id = eski.tur === "alan" && eski.id ? eski.id : yeniKimlik(t, "h");
    const d = DEGER_TURU[tr(metin(g.deger, 20) || (eski.tur === "alan" ? eski.alan ?? "metin" : "metin"))];
    if (!d) return `değer türü şunlardan biri olmalı: ${HUCRE_ALAN_TURLERI.join(", ")}`;
    y.alan = d;
    const sec = Array.isArray(g.secenekler) ? g.secenekler.filter((v): v is string => typeof v === "string").map((v) => metin(v)).filter(Boolean).slice(0, 40)
      : eski.tur === "alan" ? eski.secenekler : undefined;
    if (d === "secim") { if (!sec?.length) return "seçimli yerin seçenekleri verilmeli"; y.secenekler = sec; }
    const birim = typeof g.birim === "string" ? metin(g.birim, 40) : eski.tur === "alan" ? eski.birim : undefined;
    if (birim) y.birim = birim;
    const z = typeof g.zorunlu === "boolean" ? g.zorunlu : eski.tur === "alan" ? eski.zorunlu : undefined;
    if (z) y.zorunlu = true;
  }
  if (tur === "kayit") {
    const k = metin(g.kaynak, 40), v = metin(g.veri, 81);
    if (k && (TABLO_KAYNAKLARI as readonly string[]).includes(k)) y.kaynak = k as Hucre["kaynak"];
    else if (v) y.veri = v;
    else if (eski.tur === "kayit" && (eski.kaynak || eski.veri)) Object.assign(y, eski.kaynak ? { kaynak: eski.kaynak } : { veri: eski.veri });
    else return "kayıt hücresine kaynak (raporun bilgisi) ya da veri (belgenin bilgisi — belge_format_getir'deki adlar) verilmeli";
  }
  if (tur === "gorsel") y.gorsel = metin(g.veri, 10) === "akr" ? "akr" : "logo";
  const p = Hucre.safeParse(y);
  return p.success ? p.data : `hücre geçersiz: ${p.error.issues[0]?.message ?? "biçim"}`;
}
/** serbest tablonun tek işlemi — tablo.ts'in kâğıttaki tuşlarla aynı işlevleri */
function tabloIslemi(t: FormatTanimi, b: TabloBolumu, eylem: string, r: number | null, c: number | null, r2: number | null, c2: number | null, x: FormatIslemi):
  { b: TabloBolumu; ne: string } | string {
  const R = b.satirlar.length, C = b.sutun.length;
  const icinde = (rr: number | null, cc: number | null) => rr !== null && cc !== null && rr >= 0 && rr < R && cc >= 0 && cc < C;
  if (eylem === "satir_ekle") { const k = r ?? R; if (R >= 200) return "en çok 200 satır"; return { b: satirEkle(b, k), ne: `${Math.min(k, R)}. sıraya satır eklendi` }; }
  if (eylem === "sutun_ekle") { const k = c ?? C; if (C >= 40) return "en çok 40 sütun"; return { b: sutunEkle(b, k), ne: `${Math.min(k, C)}. sıraya sütun eklendi` }; }
  if (eylem === "satir_sil") { if (r === null || r < 0 || r >= R || R <= 1) return "silinecek satır yok (r)"; return { b: satirSil(b, r), ne: `${r}. satır silindi` }; }
  if (eylem === "sutun_sil") { if (c === null || c < 0 || c >= C || C <= 1) return "silinecek sütun yok (c)"; return { b: sutunSil(b, c), ne: `${c}. sütun silindi` }; }
  if (eylem === "genislik") {
    const yz = typeof x.yuzde === "number" ? x.yuzde : Number.NaN;
    if (c === null || c < 0 || c >= C || !(yz > 0 && yz < 100)) return "genislik için c ve yuzde (0–100) verilmeli";
    return { b: sutunGenisligi(b, c, yz), ne: `${c}. sütun %${yz}` };
  }
  if (!icinde(r, c)) return `hücre tabloda yok (r 0–${R - 1}, c 0–${C - 1})`;
  if (eylem === "birlestir" || eylem === "ayir") {
    const s = { r1: Math.min(r!, r2 ?? r!), c1: Math.min(c!, c2 ?? c!), r2: Math.max(r!, r2 ?? r!), c2: Math.max(c!, c2 ?? c!) };
    if (!icinde(s.r2, s.c2)) return "alanın karşı köşesi tabloda yok";
    const y = eylem === "birlestir" ? birlestir(b, s) : ayir(b, s);
    return y === b ? "değişmedi" : { b: y, ne: `[${s.r1},${s.c1}]–[${s.r2},${s.c2}] ${eylem === "birlestir" ? "birleştirildi" : "ayrıldı"}` };
  }
  if (eylem === "hucre") {
    const n = kapsama(b)[r!]?.[c!];
    if (n === null || n === undefined) return "hücre bulunamadı";
    const g = x.hucre && typeof x.hucre === "object" && !Array.isArray(x.hucre) ? x.hucre as Record<string, unknown> : {};
    const h = yeniHucre(t, b.hucreler[n], g);
    if (typeof h === "string") return h;
    const e = b.hucreler[n];
    return { b: hucreleriYaz(b, { r1: e.r, c1: e.c, r2: e.r, c2: e.c }, () => h), ne: `[${e.r},${e.c}] ${hucreOzeti(h)}` };
  }
  return "eylem şunlardan biri olmalı: hucre, satir_ekle, satir_sil, sutun_ekle, sutun_sil, birlestir, ayir, genislik";
}

/** işlemleri sırayla uygular; her biri bir öncekinin sonucuna (aynı istekte eklenen bölüme / öğeye adıyla ulaşılır) */
export function formatIslemleri(t0: FormatTanimi, islemler: readonly FormatIslemi[]): FormatIslemSonucu {
  let t = t0;
  const yapilan: string[] = [], gecersiz: string[] = [];
  for (const x of islemler) {
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
    /* 595 (madde 13): başlık tablosu */
    if (islem === "bas_satiri") {
      const eylem = metin(x.eylem, 20);
      if (eylem === "ekle") {
        const k = metin(x.kaynak, 20);
        if (!(BAS_KAYNAKLARI as readonly string[]).includes(k)) { red(`kaynak şunlardan biri olmalı: ${BAS_KAYNAKLARI.join(", ")}`); continue; }
        const y = basSatiriEkle(t, k as BasKaynagi, metin(x.ad) || undefined);
        if (!y.id) { red(`“${BAS_KAYNAK_ADI[k as BasKaynagi]}” zaten var ya da başlık tablosu dolu (en çok 10 satır)`); continue; }
        t = k === "serbest" && typeof x.yazi === "string" ? basSatiriYaz(y.t, y.id, { metin: x.yazi }) : y.t;
        yapilan.push(`Başlık tablosuna satır eklendi: ${metin(x.ad) || BAS_KAYNAK_ADI[k as BasKaynagi]}`);
        continue;
      }
      const k = metin(x.oge), l = basSatirlari(t);
      const s = l.find((o) => o.id === k) ?? l.find((o) => tr(o.ad) === tr(k)) ?? l.find((o) => o.kaynak === k);
      if (!s) { red(`başlık tablosu satırı bulunamadı (${metin(x.oge, 60) || "—"})`); continue; }
      const once = t;
      if (eylem === "cikar") t = basSatiriSil(t, s.id);
      else if (eylem === "yukari" || eylem === "asagi") t = basSatiriTasi(t, s.id, eylem === "yukari" ? -1 : 1);
      else if (eylem === "degistir") {
        const y: { ad?: string; metin?: string } = {};
        if (metin(x.ad)) y.ad = metin(x.ad);
        if (typeof x.yazi === "string") y.metin = x.yazi;
        t = basSatiriYaz(t, s.id, y);
      } else { red("eylem: ekle, degistir, cikar, yukari ya da asagi"); continue; }
      if (JSON.stringify(basSatirlari(t)) === JSON.stringify(basSatirlari(once))) { red(`“${s.ad}” değişmedi (son satır çıkarılmaz)`); t = once; continue; }
      yapilan.push(`Başlık tablosu: “${s.ad}” ${eylem === "cikar" ? "çıkarıldı" : eylem === "degistir" ? "değişti" : "taşındı"}`);
      continue;
    }
    if (islem === "bas_hucre") {
      const h = metin(x.alan, 20), eylem = metin(x.eylem, 20);
      if (!(BAS_HUCRELERI as readonly string[]).includes(h)) { red(`alan şunlardan biri olmalı: ${BAS_HUCRELERI.join(", ")}`); continue; }
      if (eylem !== "yukari" && eylem !== "asagi") { red("eylem: yukari (sola) ya da asagi (sağa)"); continue; }
      const once = t;
      t = basHucreTasi(t, h as BasHucresi, eylem === "yukari" ? -1 : 1);
      if (t === once) { red(`“${h}” hücresi zaten ${eylem === "yukari" ? "en solda" : "en sağda"}`); continue; }
      yapilan.push(`Başlık tablosu: ${h} hücresi ${eylem === "yukari" ? "sola" : "sağa"} taşındı (${basSirasi(t).join(" · ")})`);
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
      /* İ5 (2026-10-17): kisi teknik → onaylayanın yeri (yok · hucre · kutu); sayfa her → kutu her sayfada */
      const kim = metin(x.kisi, 20) === "teknik" ? "onaylayan" as const : "onaylanan" as const;
      if (kim === "onaylanan" ? yer !== "hucre" && yer !== "kutu" && yer !== "gorunmez" : yer !== "hucre" && yer !== "kutu" && yer !== "yok") {
        red(kim === "onaylanan" ? "yer: hucre, kutu ya da gorunmez" : "onaylayan (kisi teknik) için yer: yok, hucre ya da kutu"); continue;
      }
      const sayi = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v
        : typeof v === "string" && v.trim() && Number.isFinite(Number(v.replace(",", "."))) ? Number(v.replace(",", ".")) : undefined);
      const sayfa = metin(x.sayfa, 10) === "her" ? "her" as const : metin(x.sayfa, 10) === "son" ? "son" as const : undefined;
      t = eimzaYaz(t, { yer: yer as "hucre" | "kutu" | "gorunmez" | "yok", x: sayi(x.x), y: sayi(x.y), en: sayi(x.en), boy: sayi(x.boy), sayfa }, kim);
      const g = kim === "onaylanan" ? t.gorunum.eimza : t.gorunum.eimza2, ad = kim === "onaylanan" ? "E-imzanın yeri" : "Onaylayanın e-imza yeri";
      yapilan.push(yer === "yok" ? "Onaylayanın e-imza yeri kaldırıldı" : yer === "hucre" ? `${ad}: İmza hücresi` : yer === "gorunmez" ? "E-imza görünmez atılır"
        : `${ad}: ${g?.yer === "kutu" && g.sayfa === "her" ? "her" : "son"} sayfada kutu (soldan ${g?.x} mm, üstten ${g?.y} mm, ${g?.en} × ${g?.boy} mm)`);
      continue;
    }
    const i = bolumBul(t, x.bolum);
    if (i < 0) { red(`bölüm bulunamadı (${metin(x.bolum, 60) || "—"})`); continue; }
    const b = t.bolumler[i];
    if (islem === "tablo") {
      if (b.blok !== "tablo") { red(`“${b.ad}” serbest tablo değil`); continue; }
      const r = tamsayi(x.r), c = tamsayi(x.c), eylem = metin(x.eylem, 20);
      const sonuc = tabloIslemi(t, b, eylem, r, c, tamsayi(x.r2), tamsayi(x.c2), x);
      if (typeof sonuc === "string") { red(sonuc); continue; }
      const l = [...t.bolumler]; l[i] = sonuc.b; t = { ...t, bolumler: l };
      yapilan.push(`“${b.ad}”: ${sonuc.ne}`);
      continue;
    }
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
        if (kim !== "uzman" && kim !== "teknik" && kim !== "uzman2" && kim !== "tesis" && kim !== "diger") { red("kisi: uzman, teknik, uzman2, tesis ya da diger"); continue; }
        const bilgi = metin(x.bilgi, 20) as ImzaAlani;
        if (kim !== "diger" && !(IMZA_ALANLARI as readonly string[]).includes(bilgi)) { red(`bilgi şunlardan biri olmalı: ${IMZA_ALANLARI.join(", ")}`); continue; }
        const y = imzaSatiriEkle(t, i, kim, kim === "diger" ? undefined : bilgi, metin(x.ad) || undefined);
        if (!y.id) { red("bu kişinin bu bilgisi olmaz (onay zamanı yalnız teknik yöneticide; tesis yetkilisinde ad, unvan, imza)"); continue; }
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
    /* 595 (madde 6, 7): kontrol listesi ve test bölümünün ek sütunları aynı işlemle */
    if (islem === "tablo_sutunu" && (b.blok === "liste" || b.blok === "test")) {
      const eylem = metin(x.eylem, 20);
      if (eylem === "ekle") {
        const a = metin(x.alan, 20), izinli = eksikEkSutunlar(b) as string[];
        if (!izinli.includes(a)) { red(`alan şunlardan biri olmalı: ${izinli.join(", ") || "— (en çok 4 sütun)"}`); continue; }
        const y = ekSutunEkle(t, i, a as Parameters<typeof ekSutunEkle>[2], metin(x.ad) || undefined);
        if (!y.id) { red("sütun eklenemedi"); continue; }
        t = Array.isArray(x.secenekler) && a === "secim" ? ekSutunYaz(y.t, i, y.id, { secenekler: x.secenekler.filter((o): o is string => typeof o === "string") }) : y.t;
        yapilan.push(`“${b.ad}” bölümüne sütun eklendi: ${metin(x.ad) || ekSutunAdi(b, a as Parameters<typeof ekSutunAdi>[1])}`); continue;
      }
      const l = b.ekSutunlar ?? [], k = metin(x.oge);
      const s = l.find((o) => o.id === k) ?? l.find((o) => tr(o.ad) === tr(k));
      if (!s) { red(`sütun bulunamadı (${metin(x.oge, 60) || "—"})`); continue; }
      const once = t;
      if (eylem === "cikar") t = ekSutunSil(t, i, s.id);
      else if (eylem === "yukari" || eylem === "asagi") t = ekSutunTasi(t, i, s.id, eylem === "yukari" ? -1 : 1);
      else if (eylem === "degistir") t = ekSutunYaz(t, i, s.id, { ...(metin(x.ad) ? { ad: metin(x.ad) } : {}),
        ...(Array.isArray(x.secenekler) ? { secenekler: x.secenekler.filter((o): o is string => typeof o === "string") } : {}) });
      else { red("eylem: ekle, degistir, cikar, yukari (sola), asagi (sağa)"); continue; }
      if (JSON.stringify(t) === JSON.stringify(once)) { red(`“${s.ad}” değişmedi`); continue; }
      yapilan.push(`“${b.ad}” bölümünde “${s.ad}” sütunu ${eylem === "cikar" ? "çıkarıldı" : eylem === "degistir" ? "değişti" : "taşındı"}`);
      continue;
    }
    if (islem === "tablo_sutunu") {
      if (b.blok !== "cihaz" && b.blok !== "kusur") { red("sütunlar ölçüm cihazları, uygunsuzluk, kontrol listesi ve test bölümünde"); continue; }
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
    /* 595 (madde 16): adlı fotoğraf kutuları */
    if (islem === "foto_kutusu") {
      if (b.blok !== "foto") { red("fotoğraf kutusu yalnız fotoğraf bölümünde"); continue; }
      const eylem = metin(x.eylem, 20);
      if (eylem === "ekle") {
        const ad = metin(x.ad, 120);
        if (!ad) { red("kutunun adı yok"); continue; }
        const y = fotoKutusuEkle(t, i, ad);
        if (!y.id) { red("en çok 20 kutu"); continue; }
        t = y.t; yapilan.push(`“${b.ad}” bölümüne fotoğraf kutusu eklendi: ${ad}`); continue;
      }
      const l = b.kutular ?? [], k = metin(x.oge, 120);
      const s = l.find((o) => o.id === k) ?? l.find((o) => tr(o.ad) === tr(k));
      if (!s) { red(`fotoğraf kutusu bulunamadı (${k || "—"})`); continue; }
      const once = t;
      if (eylem === "cikar") t = fotoKutusuSil(t, i, s.id);
      else if (eylem === "yukari" || eylem === "asagi") t = fotoKutusuTasi(t, i, s.id, eylem === "yukari" ? -1 : 1);
      else if (eylem === "degistir") t = fotoKutusuYaz(t, i, s.id, metin(x.ad, 120));
      else { red("eylem: ekle, degistir, cikar, yukari ya da asagi"); continue; }
      if (JSON.stringify(t) === JSON.stringify(once)) { red(`“${s.ad}” değişmedi`); continue; }
      yapilan.push(`“${s.ad}” fotoğraf kutusu ${eylem === "cikar" ? "çıkarıldı" : eylem === "degistir" ? "değişti" : "taşındı"}`);
      continue;
    }
    if (islem === "hazir_satir") {
      if (b.blok !== "olcum") { red("hazır satır yalnız ölçüm tablosunda"); continue; }
      const eylem = metin(x.eylem, 20), l = b.hazir ?? [];
      if (eylem === "ekle") {
        const ad = metin(x.ad, 120);
        if (!ad) { red("satırın adı yok"); continue; }
        const once = t;
        t = hazirSatirEkle(t, i, ad);
        if (t === once) { red("en çok 100 hazır satır"); continue; }
        yapilan.push(`“${b.ad}” tablosuna hazır satır eklendi: ${ad}`); continue;
      }
      const k = metin(x.oge, 120), n = Number(k);
      const j = l.findIndex((y) => tr(y) === tr(k)) >= 0 ? l.findIndex((y) => tr(y) === tr(k)) : Number.isInteger(n) && n >= 1 && n <= l.length ? n - 1 : -1;
      if (j < 0) { red(`hazır satır bulunamadı (${k || "—"})`); continue; }
      const once = t;
      if (eylem === "cikar") t = hazirSatirSil(t, i, j);
      else if (eylem === "yukari" || eylem === "asagi") t = hazirSatirTasi(t, i, j, eylem === "yukari" ? -1 : 1);
      else if (eylem === "degistir") t = hazirSatirYaz(t, i, j, metin(x.ad, 120));
      else { red("eylem: ekle, degistir, cikar, yukari ya da asagi"); continue; }
      if (JSON.stringify(t) === JSON.stringify(once)) { red(`“${l[j]}” değişmedi`); continue; }
      yapilan.push(`“${b.ad}” tablosunda “${l[j]}” hazır satırı ${eylem === "cikar" ? "çıkarıldı" : eylem === "degistir" ? "değişti" : "taşındı"}`);
      continue;
    }
    /* 595 (madde 12): sonuç bölümünde üçüncü seçenek (şartlı uygun) */
    if (islem === "sartli_secenek") {
      if (b.blok !== "sonuc" || typeof x.acik !== "boolean") { red("yalnız sonuç bölümünde; acik true ya da false"); continue; }
      const once = t;
      t = sartliYaz(t, i, x.acik);
      if (t === once) { red(`şartlı uygun seçeneği zaten ${x.acik ? "açık" : "kapalı"}`); continue; }
      yapilan.push(`“${b.ad}” bölümünde şartlı uygun seçeneği ${x.acik ? "açıldı" : "kapandı"}`);
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
      + "baslik, sonuc_yeri, not_satiri, tablo_sutunu, dizilis, hazir_satir, foto_kutusu, sartli_secenek, bas_satiri, bas_hucre, tablo)");
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
    + "boşluklu ad köşeli parantezle. imza_satiri (imza bölümünün satırları: eylem ekle — kisi uzman | teknik | uzman2 (ikinci muayene uzmanı, sahada plan "
    + "ekibinden seçilir) | tesis (tesis yetkilisi: ad, unvan, imza — sahada yazılır) | diger, bilgi ad | meslek | ekipnet | diploma | "
    + "oda | eposta | tel | imza | zaman | unvan (zaman yalnız teknikte, unvan yalnız teside), ad, serbest satırda yazi —, degistir (oge + ad / yazi / tam), "
    + "cikar, yukari, asagi). "
    + "eimza_yeri (e-imzanın imzaya hazırlanan PDF'teki yeri: yer hucre — İmza hücresi — | kutu — x soldan, y üstten, en, boy mm; sayfa son | her — | "
    + "gorunmez; ikinci yer ONAYLAYAN için kisi teknik ile yer yok | hucre | kutu — PDF'te ikinci boş imza alanı, imza sırası yok). "
    + "firma_satiri (1. bölüm Firma bilgileri: eylem ekle — kaynak firma | adres | rapor_no | rapor_tarihi | isg | sgk | bas | bit | sonraki | takip | metot | "
    + "eposta | tel | plan_no | serbest, ad, serbestte yazi —, degistir (oge + ad / yazi / tam), cikar, yukari, asagi; SGK, İSG-KATİP, başlangıç çıkmaz). "
    + "baslik (sabit başlık / sözcük: bolum + alan sira | not | sonuc (ölçüm), olcum | deger | sinir | sonuc (test), no | madde | sonuc (kontrol listesi), "
    + "uygun | uygun_degil | sartli (sonuç bölümü), yonlendirme (yorum); bölümsüz alan bas_kod | bas_surum | bas_no | bas_tarih | alt_yazi ({firma}, {kod}, {adres}, {tel}, {eposta}; PDF'te her sayfanın altında — ör. gizlilik notu) | ekipman_kod | "
    + "ekipman_tur; ad: yeni yazı, boş bugünküne döner), sonuc_yeri (ölçüm tablosu: yer son | bas | gizli — belgede), not_satiri (yorum: satir), "
    + "oge_tasi (bolum + oge + eylem yukari | asagi; sütunda sola / sağa; madde grubun ucundan komşu gruba). "
    + "tablo_sutunu (ölçüm cihazları, uygunsuzluk, kontrol listesi ya da test bölümünün sütunları: eylem ekle — alan cihaz | tur | kod_seri | kod | seri | "
    + "marka | model | kal_tarih | kal_bitis | sertifika (cihaz); sira | bolum | metin | agir | foto (uygunsuzluk); aciklama | std | foto | yazi (kontrol listesi, "
    + "en çok 4); yazi | sayi | secim + secenekler (test, en çok 4); ad —, degistir (oge + ad / secenekler), cikar, yukari (sola), asagi (sağa); "
    + "uygunsuzlukta eylem tablo | liste). dizilis (bilgi bölümü: dizilis 1 | 2 | 3 — belgede bir satırda kaç bilgi). Alanın belgede tam satırı oge_degistir tam. "
    + "hazir_satir (ölçüm tablosunun hazır satırları — yeni raporda adlarıyla gelir: eylem ekle (ad, ör. L1-N), degistir (oge: adı ya da sırası + ad), cikar, "
    + "yukari, asagi). foto_kutusu (fotoğraf bölümünün adlı kutuları — sahada fotoğraf o kutuya çekilir: eylem ekle (ad, ör. Etiket), degistir (oge + ad), "
    + "cikar, yukari, asagi). sartli_secenek (sonuç bölümünde üçüncü seçenek “şartlı uygun” — hafif kusurla kullanılabilir, uygunsuzluk açılır: "
    + "bolum + acik true | false; sözcüğü baslik alan sartli). "
    + "bas_satiri (sayfa başındaki başlık tablosunun doküman bilgisi satırları: eylem ekle — kaynak kod | surum | no | tarih | revizyon | nusha | sonraki | "
    + "serbest, ad, serbestte yazi —, degistir (oge + ad / yazi), cikar, yukari, asagi). bas_hucre (başlık tablosu hücresinin yeri: alan logo | firma | akr | "
    + "ad | dok, eylem yukari — sola — | asagi — sağa). "
    + "tablo (serbest tablo bölümü — bolum_ekle tur tablo 3 × 4 boş açar; hücreler haritada [satır,sütun], 0'dan: eylem hucre (r, c + hucre: tur yazi | alan "
    + "(elle doldurulan yer: deger metin | sayi | tarih | secim + secenekler | evet, zorunlu, birim) | kayit (kaynak: raporun bilgisi ya da veri: belgenin bilgisi) "
    + "| sira | imza | gorsel (veri logo | akr), yazi, ad), satir_ekle (r: yeri; yoksa sona), satir_sil (r), sutun_ekle (c), sutun_sil (c), birlestir / ayir (r, c, "
    + "r2, c2: alanın köşeleri), genislik (c, yuzde)). "
    + "Değişiklik taslakta olur; kullanıcı Kaydet ve Yayınla der.",
  input_schema: {
    type: "object",
    properties: {
      islemler: {
        type: "array",
        items: {
          type: "object",
          properties: {
            islem: { type: "string", enum: ["bolum_ekle", "bolum_sil", "bolum_adi", "grup_ekle", "oge_ekle", "oge_degistir", "oge_sil", "oge_tasi", "sonuc_kurali", "imza_satiri", "eimza_yeri", "firma_satiri",
              "baslik", "sonuc_yeri", "not_satiri", "tablo_sutunu", "dizilis", "hazir_satir", "foto_kutusu", "sartli_secenek", "bas_satiri", "bas_hucre", "tablo"] },
            bolum: { type: "string" }, oge: { type: "string" }, tur: { type: "string" }, ad: { type: "string" }, birim: { type: "string" },
            formul: { type: "string" }, secenekler: { type: "array", items: { type: "string" } }, op: { type: "string" }, sinir: { type: "number" },
            zorunlu: { type: "boolean" }, grup: { type: "string" }, sonra: { type: "string" },
            kurallar: { type: "array", maxItems: KURAL_EN_COK, items: { type: "object", properties: {
              kosul: { type: "string" }, neden: { type: "string" }, aciklama: { type: "string" }, agir: { type: "boolean" } }, required: ["kosul"] } },
            bakanlik: { type: "boolean" },
            eylem: { type: "string", enum: ["ekle", "degistir", "cikar", "yukari", "asagi", "tablo", "liste", "hucre", "satir_ekle", "satir_sil", "sutun_ekle", "sutun_sil", "birlestir", "ayir", "genislik"] }, dizilis: { type: "number" }, acik: { type: "boolean" }, kisi: { type: "string", enum: ["uzman", "teknik", "uzman2", "tesis", "diger"] },
            bilgi: { type: "string", enum: [...IMZA_ALANLARI] }, yazi: { type: "string" }, tam: { type: "boolean" },
            kaynak: { type: "string", enum: [...new Set<string>([...FIRMA_KAYNAKLARI, ...BAS_KAYNAKLARI])] },
            yer: { type: "string", enum: ["hucre", "kutu", "gorunmez", "yok", "son", "bas", "gizli"] }, sayfa: { type: "string", enum: ["son", "her"] }, alan: { type: "string" }, satir: { type: "number" }, x: { type: "number" }, y: { type: "number" }, en: { type: "number" }, boy: { type: "number" },
            r: { type: "integer" }, c: { type: "integer" }, r2: { type: "integer" }, c2: { type: "integer" }, yuzde: { type: "number" },
            hucre: { type: "object", properties: { tur: { type: "string" }, yazi: { type: "string" }, deger: { type: "string" }, secenekler: { type: "array", items: { type: "string" } },
              zorunlu: { type: "boolean" }, birim: { type: "string" }, kaynak: { type: "string" }, veri: { type: "string" }, ad: { type: "string" } } },
          },
          required: ["islem"],
        },
      },
    },
    required: ["islemler"],
  },
} as const;

