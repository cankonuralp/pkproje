/* S.A.Y CHAT — saf kurallar (523–525; pkproje §3.10, maket 521 maket-saychat.js / maket-turler.js ekran 12 — reisim 2026-10-13: "onayılıyorum, yap
   bitir"). Sunucu ve ekran aynı işlevleri kullanır:
   · AYAR (tür başına): mesaj satırları — telefonda yazan ad, rapordaki alan, hazır değer (isteğe bağlı), sırayla — ve okunacak fotoğraf başlıkları
     (formatın fotoğraftan doldurması açık bölümleri, aç / kapa). Kayıtlı ayar yoksa formattan HAZIR gelir: satırlar formatın ekipman bilgisi
     alanlarından (+ "Not" → Muayene uzmanı yorumu), başlıklar fotoğraftan doldurması açık bölümlerden.
   · Rapordaki alan anahtarı: "e:<ekipman alanı>" (raporun ekipman bilgisi — marka, model …), "a:<alan kimliği>" (formatın bilgi alanı),
     "d:<değer kimliği>" (test değeri), "yorum" (Muayene uzmanı yorumu). Formülle hesaplanan ve kayıttan gelen (künye) alanlar seçilmez.
   · DAĞILIM (kural, yapay zekâ yok): mesajın n. satırı yönergenin n. maddesi; "-" ya da boş = bilinmiyor (alan boş); yönergeden fazla satırlar nota
     eklenir; not → Muayene uzmanı yorumu. */
import { z } from "zod";
import { DOLDURULUR, doldurma, EKIPMAN_ALAN_ADI, EKIPMAN_ALANLARI, type Bolum, type EkipmanAlani, type FormatTanimi } from "../../format/tanim.ts";

export const SATIR_EN_COK = 30;
export const AD_EN_COK = 60;
export const HAZIR_EN_COK = 40;
export const BASLIK_EN_COK = 40;

export interface ChatSatiri { ad: string; alan: string; hazir: string }
export interface ChatOkunacak { k: string; acik: boolean }
export interface ChatTanimi { satirlar: ChatSatiri[]; okunacak: ChatOkunacak[] }
/** [anahtar, ekranda görünen ad] */
export type AlanSecenegi = readonly [anahtar: string, ad: string];
/** [bölüm kimliği, bölüm adı, ne] */
export type BaslikSecenegi = readonly [k: string, ad: string, ne: string];

const ekipmanBolumu = (t: FormatTanimi): Extract<Bolum, { blok: "bilgi" }> | null =>
  (t.bolumler.find((b) => b.blok === "bilgi" && b.tam) as Extract<Bolum, { blok: "bilgi" }> | undefined) ?? null;

/** rapordaki alan seçenekleri (formatsız türde yalnız ekipman bilgileri ve yorum) */
export function chatAlanlari(t: FormatTanimi | null): AlanSecenegi[] {
  const l: AlanSecenegi[] = [];
  const tam = t ? ekipmanBolumu(t) : null;
  const ekipAd = (e: EkipmanAlani) => tam?.alanlar.find((a) => a.ekipman === e)?.ad ?? EKIPMAN_ALAN_ADI[e];
  for (const e of EKIPMAN_ALANLARI) l.push([`e:${e}`, `Ekipman bilgileri › ${ekipAd(e)}`]);
  for (const b of t?.bolumler ?? []) {
    if (b.blok === "bilgi") {
      for (const a of b.alanlar) if (!a.ekipman && !a.kaynak && !a.formul && a.tur !== "coklu") l.push([`a:${a.id}`, `${b.ad} › ${a.ad}`]);
    } else if (b.blok === "test") {
      for (const d of b.degerler) if (!d.formul) l.push([`d:${d.id}`, `${b.ad} › ${d.ad}`]);
    }
  }
  l.push(["yorum", "Muayene uzmanı yorumu"]);
  return l;
}

/** okunacak fotoğraf başlıkları: fotoğraftan doldurması açık bölümler (ekipman bölümü hariç — etiket fotoğrafı ayrı); test değerleri bölümü
    kâğıtta kapatılmadıkça her zaman (maket: "Fonksiyon testleri" — ölçüm ekranının fotoğrafı; okuma raporlar/server/alan-oku.ts ile) */
export function chatBasliklari(t: FormatTanimi | null): BaslikSecenegi[] {
  const l: BaslikSecenegi[] = [];
  for (const b of t?.bolumler ?? []) {
    if (!DOLDURULUR.includes(b.blok) || (b.blok === "bilgi" && b.tam)) continue;
    if (!(b.blok === "test" ? (b.doldur ? b.doldur.foto : true) : doldurma(b).foto)) continue;
    l.push([b.id, b.ad, b.blok === "olcum" ? "ölçüm tablosu" : b.blok === "test" ? "test değerleri" : "bilgi alanları"]);
  }
  return l;
}

const HAZIR_EKIPMAN: readonly EkipmanAlani[] = ["marka", "model", "seri", "imal", "konum"];
const kisalt = (ad: string) => (ad.length > AD_EN_COK ? `${ad.slice(0, AD_EN_COK - 1).trimEnd()}…` : ad);
/** kayıtlı ayar yoksa: satırlar formatın ekipman bilgisi alanlarından (sırasıyla; ekipman bölümü yoksa marka, model, seri, imal, konum) + Not */
export function hazirTanim(t: FormatTanimi | null): ChatTanimi {
  const tam = t ? ekipmanBolumu(t) : null;
  const satirlar: ChatSatiri[] = [];
  if (tam) {
    for (const a of tam.alanlar) {
      if (satirlar.length >= SATIR_EN_COK - 1) break;
      if (a.ekipman) satirlar.push({ ad: kisalt(a.ad), alan: `e:${a.ekipman}`, hazir: "" });
      else if (!a.kaynak && !a.formul && a.tur !== "coklu") satirlar.push({ ad: kisalt(a.ad), alan: `a:${a.id}`, hazir: "" });
    }
  }
  if (!satirlar.length) for (const e of HAZIR_EKIPMAN) satirlar.push({ ad: EKIPMAN_ALAN_ADI[e], alan: `e:${e}`, hazir: "" });
  satirlar.push({ ad: "Not", alan: "yorum", hazir: "" });
  return { satirlar, okunacak: chatBasliklari(t).map(([k]) => ({ k, acik: true })) };
}

const Girdi = z.object({
  satirlar: z.array(z.object({ ad: z.string().max(200), alan: z.string().max(80), hazir: z.string().max(200).default("") })).max(100),
  okunacak: z.array(z.object({ k: z.string().max(80), acik: z.boolean() })).max(100).default([]),
});
export type TanimHatasi = { i: number; ne: "ad" | "alan" | "hazir"; neden: string } | { i: -1; ne: "satirlar" | "okunacak"; neden: string };

export type TanimDenetimi = { durum: "tamam"; tanim: ChatTanimi } | { durum: "hata"; hata: TanimHatasi };
/** kaydetmeden önce (sunucu): adlar dolu ve kısa, alan formatta ve tekil, hazır değer kısa; başlıklar formatta, tekil */
export function tanimDenetle(t: FormatTanimi | null, girdi: unknown): TanimDenetimi {
  return secenekleDenetle(chatAlanlari(t).map(([k]) => k), chatBasliklari(t).map(([k]) => k), girdi);
}
/** aynı denetim seçenek listeleriyle (ekran: sunucunun verdiği seçeneklerle ön denetim — karar yine sunucuda) */
export function secenekleDenetle(alanListesi: readonly string[], baslikListesi: readonly string[], girdi: unknown): TanimDenetimi {
  const g = Girdi.safeParse(girdi);
  if (!g.success) return { durum: "hata", hata: { i: -1, ne: "satirlar", neden: "Ayar okunamadı; sayfayı yenileyip yeniden deneyin." } };
  const { satirlar, okunacak } = g.data;
  if (!satirlar.length) return { durum: "hata", hata: { i: -1, ne: "satirlar", neden: "En az bir mesaj satırı olmalı." } };
  if (satirlar.length > SATIR_EN_COK) return { durum: "hata", hata: { i: -1, ne: "satirlar", neden: `En çok ${SATIR_EN_COK} mesaj satırı olur.` } };
  const alanlar = new Set(alanListesi), gorulen = new Set<string>();
  const temiz: ChatSatiri[] = [];
  for (const [i, s] of satirlar.entries()) {
    const ad = s.ad.replace(/\s+/g, " ").trim(), hazir = s.hazir.replace(/\s+/g, " ").trim();
    if (!ad) return { durum: "hata", hata: { i, ne: "ad", neden: `${i + 1}. satırın telefonda yazan adı boş.` } };
    if (ad.length > AD_EN_COK) return { durum: "hata", hata: { i, ne: "ad", neden: `${i + 1}. satırın adı en çok ${AD_EN_COK} karakter.` } };
    if (!s.alan) return { durum: "hata", hata: { i, ne: "alan", neden: `${i + 1}. satırın rapordaki alanı seçilmedi.` } };
    if (!alanlar.has(s.alan)) return { durum: "hata", hata: { i, ne: "alan", neden: `${i + 1}. satırın alanı formatta yok; yeniden seçin.` } };
    if (gorulen.has(s.alan)) return { durum: "hata", hata: { i, ne: "alan", neden: `${i + 1}. satırın alanı başka bir satırda da seçili.` } };
    if (hazir.length > HAZIR_EN_COK) return { durum: "hata", hata: { i, ne: "hazir", neden: `${i + 1}. satırın hazır değeri en çok ${HAZIR_EN_COK} karakter.` } };
    gorulen.add(s.alan);
    temiz.push({ ad, alan: s.alan, hazir });
  }
  const basliklar = new Set(baslikListesi), ok: ChatOkunacak[] = [];
  for (const o of okunacak) {
    if (!basliklar.has(o.k) || ok.some((x) => x.k === o.k)) return { durum: "hata", hata: { i: -1, ne: "okunacak", neden: "Okunacak fotoğraf başlığı formatta yok; sayfayı yenileyin." } };
    ok.push({ k: o.k, acik: o.acik });
  }
  return { durum: "tamam", tanim: { satirlar: temiz, okunacak: ok } };
}

/** kayıtlı ayarı formata göre süzer (format sonradan değiştiyse olmayan alan / başlık düşer — sessiz kalmaz: düşen sayısı döner) */
export function tanimiSuz(t: FormatTanimi | null, a: ChatTanimi): { tanim: ChatTanimi; dusen: number } {
  const alanlar = new Set(chatAlanlari(t).map(([k]) => k)), basliklar = new Set(chatBasliklari(t).map(([k]) => k));
  const satirlar = a.satirlar.filter((s) => alanlar.has(s.alan)), okunacak = a.okunacak.filter((o) => basliklar.has(o.k));
  return { tanim: { satirlar, okunacak }, dusen: a.satirlar.length - satirlar.length + a.okunacak.length - okunacak.length };
}

/* ── DAĞILIM (524; maket maket-saychat.js dagit) ── */
export interface ChatDagilim {
  /** satır başına: hangi alana, ne yazıldı ("" = bilinmiyor) */
  satirlar: { ad: string; alan: string; deger: string; bilinmiyor: boolean }[];
  /** yönergeden fazla yazılan satırlar (nota eklenir) */
  fazla: string[];
  /** alan → değer (rapora yazılacak; "yorum" not ve fazla satırlarla birleşir) */
  degerler: Record<string, string>;
}
/** mesajın n. satırı yönergenin n. maddesi; "-" ya da boş satır = bilinmiyor; fazlası nota; not → yorum */
export function dagit(tanim: ChatTanimi, mesaj: readonly string[]): ChatDagilim {
  const satirlar: ChatDagilim["satirlar"] = [], degerler: Record<string, string> = {};
  tanim.satirlar.forEach((s, i) => {
    const ham = (mesaj[i] ?? "").replace(/\s+/g, " ").trim();
    const bilinmiyor = !ham || /^[-–—]+$/.test(ham);
    satirlar.push({ ad: s.ad, alan: s.alan, deger: bilinmiyor ? "" : ham, bilinmiyor });
    if (!bilinmiyor) degerler[s.alan] = ham;
  });
  const fazla = mesaj.slice(tanim.satirlar.length).map((x) => x.replace(/\s+/g, " ").trim()).filter((x) => x && !/^[-–—]+$/.test(x));
  if (fazla.length) degerler.yorum = [degerler.yorum, ...fazla].filter(Boolean).join("\n");
  return { satirlar, fazla, degerler };
}

/* ── KAYIT (524; maket maket-saychat.js) — ekran ve sunucu aynı şemayı kullanır ── */
export const MESAJ_EN_COK = 60;
export const MESAJ_SATIR_EN_COK = 200;
/** kayıt başına ekipman fotoğrafı, başlık başına okunacak fotoğraf (en çok) */
export const EKIPMAN_FOTO_EN_COK = 12;
export const OKUNACAK_FOTO_EN_COK = 6;
/** kuyruktaki fotoğraf (cihazda küçültülmüş; raporlar/sema.ts FotoIslemGirdisi ile aynı sınır) */
export const CHAT_FOTO_BAYT = 2 * 1024 * 1024;
export const FOTO_ROLLERI = ["ekipman", "etiket", "okunacak"] as const;
export type FotoRolu = (typeof FOTO_ROLLERI)[number];
export interface ChatFoto { dosya: string; ad: string; rol: FotoRolu; k: string | null }
export type ChatEkipman = { tip: "plan"; id: string } | { tip: "yeni"; tur: string };

const kimlik = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
/** "saychat.kaydet": ekipman (plandan ya da yeni tür), mesaj satırları, kaydın tanımı, çıkarılan (sunucudaki) fotoğraflar */
export const KayitGirdisi = z.object({
  plan: kimlik,
  ekipman: z.union([z.object({ tip: z.literal("plan"), id: kimlik }), z.object({ tip: z.literal("yeni"), tur: kimlik })]).nullable(),
  mesaj: z.array(z.string().max(MESAJ_SATIR_EN_COK)).max(MESAJ_EN_COK),
  tanim: z.unknown(),
  tanimSurum: z.number().int().min(0).max(1_000_000),
  kaldir: z.array(kimlik).max(60).default([]),
});
export type KayitGirdisi = z.input<typeof KayitGirdisi>;
/** "saychat.foto": fotoğraf (base64), rolü, okunacakta bölümü; plan (kayıt henüz yoksa fotoğrafla açılır) */
export const ChatFotoGirdisi = z.object({
  plan: kimlik,
  rol: z.enum(FOTO_ROLLERI),
  k: z.string().regex(/^[A-Za-z0-9_-]{1,60}$/).nullable(),
  ad: z.string().min(1).max(200),
  veri: z.string().min(1).max(Math.ceil(CHAT_FOTO_BAYT / 3) * 4),
});
export type ChatFotoGirdisi = z.input<typeof ChatFotoGirdisi>;
