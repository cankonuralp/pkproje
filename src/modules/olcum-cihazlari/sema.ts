/* ÖLÇÜM CİHAZI GİRDİSİ — pencerenin ve sunucunun TEK şeması (maket olcum-cihazlari.html; T7 cihaz türü ekle). Cihaz kodu firmanın etiketi
   (ortak şema cihazKodu). Tür listeden ya da "yeni tür" adıyla (sunucu ekler). Kalibrasyon: bitiş tarihten önce olamaz. */
import { cihazKodu, tarih, z } from "../../sema/ortak.ts";

const bos = (s: unknown) => (typeof s === "string" ? (s.trim() === "" ? null : s.trim().replace(/\s+/g, " ")) : s);
const metin = (enCok: number) => z.preprocess(bos, z.string().max(enCok, `En çok ${enCok} karakter.`).nullable());
export const YENI_TUR = "yeni";

export const CihazGirdisi = z.object({
  kod: cihazKodu,
  tur: z.string({ error: "Cihaz türü seçilmeli." }).refine((t) => t === YENI_TUR || /^[0-9a-f-]{36}$/.test(t), "Cihaz türü seçilmeli."),
  yeniTur: z.preprocess(bos, z.string().min(2, "Tür adı yazılmalı.").max(60, "En çok 60 karakter.").nullable()),
  marka: metin(40), model: metin(40), seri: metin(40), aralik: metin(60),
}).superRefine((c, bag) => {
  if (c.tur === YENI_TUR && !c.yeniTur) bag.addIssue({ code: "custom", path: ["yeniTur"], message: "Tür adı yazılmalı." });
});
export type CihazGirdisi = z.output<typeof CihazGirdisi>;

export const KalibrasyonGirdisi = z.object({
  tarih, bitis: tarih,
  lab: z.preprocess(bos, z.string({ error: "Laboratuvar yazılmalı." }).min(2, "Laboratuvar yazılmalı.").max(80, "En çok 80 karakter.")),
  sertifika: z.preprocess(bos, z.string({ error: "Sertifika no yazılmalı." }).min(1, "Sertifika no yazılmalı.").max(40, "En çok 40 karakter.")),
  sonuc: z.enum(["uygun", "uygun_degil"], { error: "Sonuç seçilmeli." }),
}).superRefine((k, bag) => {
  if (k.bitis < k.tarih) bag.addIssue({ code: "custom", path: ["bitis"], message: "Geçerlilik bitişi kalibrasyon tarihinden önce olamaz." });
});
export type KalibrasyonGirdisi = z.output<typeof KalibrasyonGirdisi>;

export type KalDurum = "gecerli" | "yakin" | "gecti" | "lab";
const gunFarki = (a: string, b: string) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 864e5);
/** kalibrasyon durumu (maket MV.kalDurum): kalibrasyondaysa "lab"; geçerli bitiş yoksa ya da geçtiyse "gecti"; eşik içindeyse "yakin" */
export function kalDurum(bitis: string | null, konum: string, bugun: string, esik: number): KalDurum {
  if (konum === "lab") return "lab";
  if (!bitis || bitis < bugun) return "gecti";
  return gunFarki(bugun, bitis) <= esik ? "yakin" : "gecerli";
}
export const kalanGun = (bitis: string, bugun: string) => gunFarki(bugun, bitis);

/** cihaz türü ekle / adını düzenle (359; maket T7 "Cihaz türleri" — yalnız ad, N3: hangi ekipman türünde kullanılacağı Ekipman türleri'nde seçilir) */
export const CihazTuruGirdisi = z.object({
  ad: z.preprocess((s) => (typeof s === "string" ? s.trim() : s), z.string({ error: "Tür adı yazılmalı." }).min(2, "Tür adı yazılmalı.").max(60, "En çok 60 karakter.")),
});
