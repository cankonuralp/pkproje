/* FORMAT TANIMI — firmanın tür başına kurduğu rapor formatının ŞEMASI (RAPOR-FORMAT.md §1–3, §7; §8.3 onaylı 2026-10-02). Saha ekranı ve PDF bu
   tanımdan çizilir; çizen ve değerlendiren motor kodda tektir (motor.ts). Tanım veritabanında JSON olarak saklanır (rapor_format.tanim), her okuma
   ve yazmada bu şemadan geçer — istemciden ya da yapay zekâ taslağından gelen tanım şemaya uymazsa yazılmaz.
   Kimlikler (bölüm, alan, madde, sütun, değer) BÜTÜN tanımda tekildir: cevaplar kimlikle saklanır, sıra değişse de bozulmaz. Şema sürümü 1. */
import { z } from "zod";

export const SEMA_SURUMU = 1;
/** Format kurucusunda eklenen öğe mi (kimliği "k_" ile başlar; hazır şablonların kimliklerinde bu önek yok — 343, 340–345 incelemesi) */
export const kurucudan = (id: string) => id.startsWith("k_");
const kimlik = z.string().regex(/^[a-z][a-z0-9_]{0,23}$/, "Kimlik küçük harf, rakam, alt çizgi (en çok 24).");
const ad = z.string().trim().min(1, "Ad yazılmalı.").max(200, "En çok 200 karakter.");
const kisa = z.string().max(40);
const metin = z.string().max(2000);

export const ALAN_TURLERI = ["metin", "sayi", "tarih", "secim", "coklu", "evet"] as const;
/** kayıttan gelen alanlar (raporda salt okunur): plan, tesis, müşteri, sözleşme ve ekipmandan */
export const KAYNAKLAR = ["firma_adi", "tesis_adresi", "sgk", "isg_id", "kontrol_tarihi", "rapor_no", "ekipman_kodu", "ekipman_adi", "seri_no", "kullanim_yeri"] as const;
/** ölçüm tablosunun adıyla seçilen hesabı (hesap.ts) */
export const HESAPLAR = ["nokta", "selektivite", "linye", "pd", "zi"] as const;
export const BLOKLAR = ["bilgi", "liste", "olcum", "test", "cihaz", "foto", "kusur", "sonuc", "not", "imza"] as const;
/** sınır kuralı (426: kesin küçük / büyük eklendi — ZPKR05 "RB < 2 Ω"): en çok · en az · küçük · büyük */
export const SINIRLAR = ["<=", ">=", "<", ">"] as const;
export type Sinir = (typeof SINIRLAR)[number];
/** talimat (430): maddenin / grubun / genel muayenenin NASIL yapılacağı — saha ekranında ünlemle açılır, PDF'e basılmaz */
const talimat = z.string().max(4000);
export type Blok = (typeof BLOKLAR)[number];

const Alan = z.object({
  id: kimlik, ad, tur: z.enum(ALAN_TURLERI), zorunlu: z.boolean().default(false), kilit: z.boolean().default(false),
  secenekler: z.array(z.string().trim().min(1).max(200)).max(40).optional(), birim: kisa.optional(), kaynak: z.enum(KAYNAKLAR).optional(),
});
const Madde = z.object({ id: kimlik, metin: ad, aciklama: metin.optional(), std: z.string().max(200).optional(), talimat: talimat.optional(), kilit: z.boolean().default(false) });
const Grup = z.object({ id: kimlik, ad: z.string().max(200), talimat: talimat.optional(), maddeler: z.array(Madde).max(200) });
/** seçmeli hücre / değerde "uygun değil" sayılan seçenekler (426; ör. ZPKR04 "UD", ZPKR05 "Not 2: Yetersiz") ve kusurun ağırlığı */
const secenekListesi = z.array(z.string().trim().min(1).max(60)).max(20);
const Sutun = z.object({
  id: kimlik, ad, birim: kisa.optional(), giris: z.enum(["sayi", "metin", "secim", "evet"]).default("sayi"),
  secenekler: secenekListesi.optional(), olumsuz: secenekListesi.optional(), agir: z.boolean().default(false), zorunlu: z.boolean().default(false),
  op: z.enum(SINIRLAR).optional(), sinir: z.number().finite().optional(),
});
const Deger = z.object({
  id: kimlik, ad, birim: kisa.optional(), metin: z.boolean().default(false), zorunlu: z.boolean().default(true), kilit: z.boolean().default(false),
  /** seçmeli değer (426): değer bu seçeneklerden biri; olumsuz olanı kusur */
  secenekler: secenekListesi.optional(), olumsuz: secenekListesi.optional(), agir: z.boolean().default(false),
  op: z.enum(SINIRLAR).optional(), sinir: z.number().finite().optional(), not: z.string().max(120).optional(),
});
/** seçmeli uygunluk notu (ZPKR01 Not-1 … Not-11): kusur mu, ağır mı */
const Not = z.object({ metin: z.string().trim().min(1).max(400), kusur: z.boolean(), agir: z.boolean().default(false) });

/* ust (427): ardışık bölümlerin ortak üst başlığı — belgede ve ekranda N.1, N.2 numarasıyla tek başlık altında (ZPKR04 "5. Tespit ve
   değerlendirmeler" › 5.1 / 5.2); numarasiz: bölüm numara almaz (ZPKR04 "Fotoğraflar") — src/format/duzen.ts */
const ortak = { id: kimlik, ad, kilit: z.boolean().default(false), ust: z.string().max(200).optional(), numarasiz: z.boolean().optional() };
export const Bolum = z.discriminatedUnion("blok", [
  z.object({ ...ortak, blok: z.literal("bilgi"), alanlar: z.array(Alan).max(60) }),
  z.object({ ...ortak, blok: z.literal("liste"), cevaplar: z.array(z.string().trim().min(1).max(40)).min(2).max(6), gruplar: z.array(Grup).max(40) }),
  z.object({
    ...ortak, blok: z.literal("olcum"), satir: z.enum(["sabit", "ekle"]).default("ekle"), sutunlar: z.array(Sutun).max(20),
    hesap: z.enum(HESAPLAR).optional(), notlar: z.array(Not).max(20).optional(), enAz: z.number().int().min(0).max(200).default(0),
  }),
  z.object({ ...ortak, blok: z.literal("test"), degerler: z.array(Deger).max(40) }),
  z.object({ ...ortak, blok: z.literal("cihaz") }),
  z.object({ ...ortak, blok: z.literal("foto"), enAz: z.number().int().min(0).max(50).default(0), enCok: z.number().int().min(1).max(50).default(20) }),
  z.object({ ...ortak, blok: z.literal("kusur") }),
  /* aciklama (426): sonuç bölümünün sabit metni — Bakanlık formatlarındaki "Ağır kusurlar tanımı", "Açıklamalar" (PDF'e basılır) */
  z.object({ ...ortak, blok: z.literal("sonuc"), cumle: z.string().max(400).default(""), aciklama: z.string().max(4000).default("") }),
  z.object({ ...ortak, blok: z.literal("not"), zorunlu: z.boolean().default(false) }),
  z.object({ ...ortak, blok: z.literal("imza"), imzalar: z.array(z.enum(["uzman", "teknik"])).min(1).max(2).default(["uzman"]) }),
]);
export type Bolum = z.output<typeof Bolum>;
export type BolumOf<B extends Blok> = Extract<Bolum, { blok: B }>;

export const Kurallar = z.object({
  /** "Uygun değil" maddede fotoğraf zorunlu (AA9: başlangıçta kapalı) */
  foto: z.boolean().default(false),
  /** kusur derecesi (hafif / ağır) sorulur (AA9: başlangıçta kapalı) */
  derece: z.boolean().default(false),
  /** herhangi Uygun değil / sınır dışı → sonuç önerisi "Uygun değil" */
  oneri: z.boolean().default(true),
});

export const Gorunum = z.object({
  formKodu: z.string().max(20).default(""), baslik: z.string().max(200).default(""), dayanak: z.array(z.string().max(300)).max(20).default([]),
  /** genel muayene talimatı (431): rapor ekranının sağ üstündeki ünlemden açılır; PDF'e basılmaz */
  talimat: z.string().max(8000).default(""),
});

export const FormatTanimi = z.object({
  sema: z.literal(SEMA_SURUMU),
  bolumler: z.array(Bolum).max(40),
  kurallar: Kurallar.default({ foto: false, derece: false, oneri: true }),
  gorunum: Gorunum.default({ formKodu: "", baslik: "", dayanak: [], talimat: "" }),
}).superRefine((t, bag) => {
  const gorulen = new Set<string>();
  const tek = (id: string, yol: (string | number)[]) => {
    if (gorulen.has(id)) bag.addIssue({ code: "custom", path: yol, message: `Kimlik iki kez kullanılmış: ${id}` });
    gorulen.add(id);
  };
  t.bolumler.forEach((b, i) => {
    tek(b.id, ["bolumler", i, "id"]);
    if (b.blok === "bilgi") b.alanlar.forEach((a, j) => {
      tek(a.id, ["bolumler", i, "alanlar", j, "id"]);
      if ((a.tur === "secim" || a.tur === "coklu") && !a.secenekler?.length) bag.addIssue({ code: "custom", path: ["bolumler", i, "alanlar", j], message: "Seçim alanının seçenekleri yok." });
    });
    if (b.blok === "liste") b.gruplar.forEach((g, j) => { tek(g.id, ["bolumler", i, "gruplar", j, "id"]); g.maddeler.forEach((m, k) => tek(m.id, ["bolumler", i, "gruplar", j, "maddeler", k, "id"])); });
    if (b.blok === "olcum") {
      const s = new Set<string>();
      b.sutunlar.forEach((c, j) => {
        if (s.has(c.id)) bag.addIssue({ code: "custom", path: ["bolumler", i, "sutunlar", j, "id"], message: `Sütun iki kez: ${c.id}` }); s.add(c.id);
        if (c.giris === "secim" && !c.secenekler?.length) bag.addIssue({ code: "custom", path: ["bolumler", i, "sutunlar", j], message: `Seçmeli sütunun seçenekleri yok: ${c.ad}` });
        if (c.olumsuz?.some((o) => !(c.giris === "evet" ? ["evet", "hayir"] : c.secenekler ?? []).includes(o))) bag.addIssue({ code: "custom", path: ["bolumler", i, "sutunlar", j, "olumsuz"], message: `Olumsuz seçenek sütunun seçeneklerinde yok: ${c.ad}` });
      });
    }
    if (b.blok === "test") b.degerler.forEach((d, j) => {
      tek(d.id, ["bolumler", i, "degerler", j, "id"]);
      if (d.olumsuz?.some((o) => !(d.secenekler ?? []).includes(o))) bag.addIssue({ code: "custom", path: ["bolumler", i, "degerler", j, "olumsuz"], message: `Olumsuz seçenek değerin seçeneklerinde yok: ${d.ad}` });
    });
    if (b.blok === "foto" && b.enAz > b.enCok) bag.addIssue({ code: "custom", path: ["bolumler", i, "enAz"], message: "En az, en çoktan büyük olamaz." });
  });
});
export type FormatTanimi = z.output<typeof FormatTanimi>;
export type FormatGirdisi = z.input<typeof FormatTanimi>;

/* ── CEVAPLAR (raporun içeriği; kimliklerle) ── */
/** madde cevabı; foto: bu maddeye eklenen fotoğraf sayısı (sunucu raporun kendi listesinden sayar, istemciden alınmaz) */
export const MaddeCevabi = z.object({
  c: z.string().max(40), not: z.string().max(1000).optional(), derece: z.enum(["hafif", "agir"]).optional(), foto: z.number().int().min(0).max(50).optional(),
});
export const Cevaplar = z.object({
  alan: z.record(z.string(), z.union([z.string().max(2000), z.array(z.string().max(200)).max(40)])).default({}),
  madde: z.record(z.string(), MaddeCevabi).default({}),
  /** ölçüm tablosu → satırlar (sütun kimliği → değer; "not" seçilen uygunluk notunun sırası, 1'den) */
  tablo: z.record(z.string(), z.array(z.record(z.string(), z.string().max(200))).max(300)).default({}),
  deger: z.record(z.string(), z.string().max(200)).default({}),
  /** fotoğraf bölümü başına fotoğraf sayısı (2026-10-05, C18: tek sayı iki fotoğraf bölümünü — termal ve fotoğraflar — ayırt edemiyordu);
      sunucu raporun kendi listesinden sayar */
  /* 2026-10-05 (313-314 çapraz inceleme): 312'den önce açılan raporda tek sayı yazılıydı — sayı gelirse boş kayıt sayılır (sunucu sayıları
     raporun kendi fotoğraf listesinden yeniden hesaplar, bilgi kaybı yok); yoksa eski satır şemadan geçmez, cevaplar boş görünürdü */
  foto: z.preprocess((x) => (typeof x === "number" ? {} : x), z.record(z.string(), z.number().int().min(0).max(200))).default({}),
  cihaz: z.number().int().min(0).max(50).default(0),
  sonuc: z.enum(["", "uygun", "uygun_degil"]).default(""),
  yorum: z.string().max(4000).default(""),
});
export type Cevaplar = z.output<typeof Cevaplar>;
