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
   ad / sabit yazı / tam satır, çıkar, yukarı, aşağı) — kurucunun tuşlarıyla aynı yol (kurucu.ts imzaSatiri*). */
import { SINIR_ISARETI } from "../../format/hesap.ts";
import { imzaSatirlari } from "../../format/duzen.ts";
import { etkinKurallar } from "../../format/sonuc.ts";
import { IMZA_ALAN_ADI, IMZA_ALANLARI, IMZA_KISI_ADI, KURAL_EN_COK, type Blok, type Bolum, type FormatTanimi, type ImzaAlani, type SonucKurali } from "../../format/tanim.ts";
import {
  bakanlikKuralinaDon, bolumAdi, bolumSil, grupEkle, imzaSatiriEkle, imzaSatiriSil, imzaSatiriTasi, imzaSatiriYaz, maddeEkle, ogeEkle, ogeSil, ogeYaz,
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
  for (const b of t.bolumler) {
    l.push(`## ${b.id} · ${BLOK_TR[b.blok]} · ${b.ad}${b.kilit ? " (Bakanlık bölümü)" : ""}`);
    if (b.blok === "bilgi") for (const a of b.alanlar) {
      l.push(`- ${a.id} · ${a.ad} · ${a.ekipman ? "ekipman kaydından" : a.kaynak ? "kayıttan" : a.tur}${a.birim ? ` (${a.birim})` : ""}${a.formul ? ` · formül ${a.formul}` : ""}${a.secenekler?.length ? ` · seçenekler: ${a.secenekler.join(" / ")}` : ""}`);
    } else if (b.blok === "olcum") {
      for (const s of b.sutunlar) {
        l.push(`- ${s.id} · ${s.ad} · sütun, ${s.giris === "sayi" ? "sayı" : s.giris === "secim" ? `seçim: ${(s.secenekler ?? []).join(" / ")}` : s.giris === "evet" ? "evet / hayır" : "yazı"}${s.birim ? ` (${s.birim})` : ""}${s.formul ? ` · formül ${s.formul}` : ""}${sinirMetni(s)}`);
      }
      const k = etkinKurallar(t, b);
      l.push(k.length ? `  sonuç kuralı${b.hesap ? " (Bakanlık tablosu)" : ""}:` : "  sonuç kuralı yok (Sonuç'u denetçi seçer)");
      k.forEach((x, j) => l.push(`  ${j + 1}) ${x.kosul || "(boş)"}${x.neden ? ` · neden ${x.neden}` : ""}${x.agir ? " · ağır kusur" : ""}`));
    } else if (b.blok === "test") for (const d of b.degerler) {
      l.push(`- ${d.id} · ${d.ad} · test değeri, ${d.secenekler?.length ? `seçim: ${d.secenekler.join(" / ")}` : d.metin ? "yazı" : "sayı"}${d.birim ? ` (${d.birim})` : ""}${d.formul ? ` · formül ${d.formul}` : ""}${sinirMetni(d)}`);
    } else if (b.blok === "imza") {
      for (const s of imzaSatirlari(b)) {
        l.push(`- ${s.id} · ${s.ad} · imza satırı, ${IMZA_KISI_ADI[s.kim]}${s.alan ? ` · ${IMZA_ALAN_ADI[s.alan]}` : ""}${s.metin ? ` · yazı: ${s.metin.slice(0, 80)}` : ""}${s.tam ? " · tam satır" : ""}`);
      }
    } else if (b.blok === "liste") {
      l.push(`  cevaplar: ${b.cevaplar.join(" / ")}`);
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
    red("bilinmeyen işlem (bolum_ekle, bolum_sil, bolum_adi, grup_ekle, oge_ekle, oge_degistir, oge_sil, sonuc_kurali, imza_satiri)");
  }
  return { t, yapilan, gecersiz };
}

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
    + "Değişiklik taslakta olur; kullanıcı Kaydet ve Yayınla der.",
  input_schema: {
    type: "object",
    properties: {
      islemler: {
        type: "array", maxItems: FORMAT_ISLEM_EN_COK,
        items: {
          type: "object",
          properties: {
            islem: { type: "string", enum: ["bolum_ekle", "bolum_sil", "bolum_adi", "grup_ekle", "oge_ekle", "oge_degistir", "oge_sil", "sonuc_kurali", "imza_satiri"] },
            bolum: { type: "string" }, oge: { type: "string" }, tur: { type: "string" }, ad: { type: "string" }, birim: { type: "string" },
            formul: { type: "string" }, secenekler: { type: "array", items: { type: "string" } }, op: { type: "string" }, sinir: { type: "number" },
            zorunlu: { type: "boolean" }, grup: { type: "string" }, sonra: { type: "string" },
            kurallar: { type: "array", maxItems: KURAL_EN_COK, items: { type: "object", properties: {
              kosul: { type: "string" }, neden: { type: "string" }, aciklama: { type: "string" }, agir: { type: "boolean" } }, required: ["kosul"] } },
            bakanlik: { type: "boolean" },
            eylem: { type: "string", enum: ["ekle", "degistir", "cikar", "yukari", "asagi"] }, kisi: { type: "string", enum: ["uzman", "teknik", "diger"] },
            bilgi: { type: "string", enum: [...IMZA_ALANLARI] }, yazi: { type: "string" }, tam: { type: "boolean" },
          },
          required: ["islem"],
        },
      },
    },
    required: ["islemler"],
  },
} as const;

