/* TEKLİFLER — formun ve sunucunun TEK şeması (maket teklifler.html formu; pkproje §3.1 modül 11; §9 yirmi birinci tur 119–124; 2026-09-27
   kayıtlı olmayan müşteri). İletiler maketle aynı. Tutarlar KURUŞ (src/sema/ortak.ts tutar), KDV hariç. Alan adları formdaki kimliklerle
   aynı: musteri · tesis · aday.<alan> · gecerlilik · kdv · notlar · kalemler.<i>.<alan> · kalem. */
import { kimlik, metin, tutar, z } from "../../sema/ortak.ts";
import { IL_ILCE } from "../../tanim/iller.ts";
import { MusteriGirdisi } from "../musteriler/sema.ts";

const kirp = (s: unknown) => (typeof s === "string" ? s.trim() : s);
const bosNull = (s: unknown) => (typeof s === "string" ? (s.trim() === "" ? null : s.trim()) : s ?? null);
const tamSayi = (en: number, cok: number, ileti: string) =>
  z.preprocess(kirp, z.string({ error: ileti }).regex(/^\d{1,3}$/, ileti).transform(Number)).refine((n) => n >= en && n <= cok, { message: ileti });

/** kayıtlı olmayan müşteri (2026-09-27 reisim: "el ile müşteri girişinde ilgili bilgiler istensin, adres vb"). Ünvan, vergi, e-posta ve telefon
    Müşteriler'in alan kurallarıyla AYNI (kabul edilen teklif "Müşteri olarak kaydet"te o şemadan geçer; gevşek kalırsa hiç kaydedilemezdi — 324
    incelemesi) */
export const AdayGirdisi = z.object({
  unvan: MusteriGirdisi.shape.unvan,
  vd: MusteriGirdisi.shape.vd,
  vno: MusteriGirdisi.shape.vno,
  adres: z.preprocess(kirp, z.string({ error: "Adres yazılmalı." }).min(5, "Adres yazılmalı.").max(160, "En çok 160 karakter.")),
  /* il / ilçe listeden (müşteri olarak kaydedilince tesise geçer — Müşteriler'in kuralıyla aynı) */
  il: z.preprocess(kirp, z.string({ error: "İl seçilmeli." }).refine((v) => v in IL_ILCE, "İl listeden seçilmeli.")),
  ilce: z.preprocess(bosNull, z.string().max(40, "En çok 40 karakter.").nullable()),
  eposta: MusteriGirdisi.shape.eposta,
  tel: MusteriGirdisi.shape.tel,
  yetkili: MusteriGirdisi.shape.ilgili,
}).superRefine((a, bag) => {
  if (a.ilce && !IL_ILCE[a.il]?.includes(a.ilce)) bag.addIssue({ code: "custom", path: ["ilce"], message: "İlçe listeden seçilmeli." });
});
export type Aday = z.output<typeof AdayGirdisi>;

export const FIYAT_UST = 100_000_000_000;
export const KalemGirdisi = z.object({
  tur: z.string({ error: "Tür seçilmeli." }).regex(/^[0-9a-f-]{36}$/, "Tür seçilmeli."),
  adet: tamSayi(1, 999, "1–999."),
  /* üst sınır veritabanıyla aynı (teklif_kalem.fiyat ≤ 1 milyar TL) — aşan değer alan iletisi alsın, işlem hatası değil */
  fiyat: tutar.refine((n) => n > 0, { message: "Tutar, ör. 1.250,00." }).refine((n) => n <= FIYAT_UST, { message: "Tutar çok büyük." }),
});

export const TeklifGirdisi = z.discriminatedUnion("tip", [
  z.object({ tip: z.literal("kayitli"), musteri: z.string({ error: "Müşteri seçilmeli." }).regex(/^[0-9a-f-]{36}$/, "Müşteri seçilmeli."),
    tesis: z.string({ error: "Tesis seçilmeli." }).regex(/^[0-9a-f-]{36}$/, "Tesis seçilmeli."),
    ekTesisler: z.array(kimlik).max(200).default([]) }),
  z.object({ tip: z.literal("aday"), aday: AdayGirdisi }),
], { error: "Müşteri seçilmeli." }).and(z.object({
  gecerlilik: tamSayi(1, 999, "Gün, 1–999."),
  kdv: z.preprocess(kirp, z.string({ error: "0–99." }).regex(/^\d{1,2}$/, "0–99.").transform(Number)),
  notlar: z.preprocess(bosNull, z.string().max(300, "En çok 300 karakter.").nullable()),
  kalemler: z.array(KalemGirdisi, { error: "En az bir kalem." }).min(1, "En az bir kalem.").max(100, "En çok 100 kalem."),
  ekipmanlar: z.array(z.object({ kod: z.string().max(20), tur: z.string().regex(/^[0-9a-f-]{36}$/), konum: z.string().max(80), seri: z.string().max(40) }))
    .max(2000).default([]),
})).superRefine((v, bag) => {
  /* aynı tür iki kalemde olmaz (maket: "Bu tür yukarıda var; adedini artırın.") */
  const gor = new Set<string>();
  v.kalemler.forEach((k, i) => {
    if (gor.has(k.tur)) bag.addIssue({ code: "custom", path: ["kalemler", i, "tur"], message: "Bu tür yukarıda var; adedini artırın." });
    gor.add(k.tur);
  });
});
export type TeklifGirdisi = z.output<typeof TeklifGirdisi>;

/** reddedildi (maket red penceresi): müşterinin gerekçesi zorunlu */
export const RedGirdisi = z.object({ gerekce: metin("Gerekçe", 300).refine((s) => s.length >= 5, { message: "Gerekçe yazılmalı." }) });

/** durum adı ve rozeti (maket DURUM); "suresi" okurken hesaplanır (124) */
export const TEKLIF_DURUM = {
  taslak: ["Taslak", "notr"], gonderildi: ["Gönderildi", "kabul"], kabul: ["Kabul edildi", "tamam"], red: ["Reddedildi", "red"], suresi: ["Süresi doldu", "bekliyor"],
} as const;
export type TeklifDurumu = keyof typeof TEKLIF_DURUM;

/** KDV dahil tutar (kuruş, yuvarlanır) */
export const kdvli = (kurus: number, oran: number) => Math.round((kurus * (100 + oran)) / 100);
/** kuruş → "1.250,00 TL" */
export const para = (kurus: number) => `${(kurus / 100).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`;
/** kuruş → form girdisi "1.250,00" */
export const paraGirdi = (kurus: number) => (kurus / 100).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** gönderilmiş teklifin geçerliliğinin bittiği gün (gönderilişten sayılır) */
export function bitisGunu(gonderildi: string, gecerlilik: number): string {
  const d = new Date(`${gonderildi}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + gecerlilik);
  return d.toISOString().slice(0, 10);
}
