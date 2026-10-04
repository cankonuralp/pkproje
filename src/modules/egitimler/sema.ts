/* EĞİTİM GİRDİLERİ — pencerelerin ve sunucunun TEK şeması (maket egitimler.html denetle / tur-kaydet). Tarih ileri olamaz (sunucu bugünle
   karşılaştırır); tekrar tarihi = tarih + türün tekrar süresi (ay; ay sonu taşmaz). */
import { tarih, z } from "../../sema/ortak.ts";

const bos = (s: unknown) => (typeof s === "string" ? (s.trim() === "" ? null : s.trim().replace(/\s+/g, " ")) : s);
const UUID = /^[0-9a-f-]{36}$/;
export const KURUMLAR = ["Firma içi", "Dış eğitim kurumu"] as const;

export const EgitimTuruGirdisi = z.object({
  ad: z.preprocess(bos, z.string({ error: "Eğitim adı yazılmalı." }).min(2, "Eğitim adı yazılmalı.").max(60, "En çok 60 karakter.")),
  tekrar: z.preprocess((s) => (typeof s === "string" ? s.trim() : s), z.string({ error: "1–120 ay." }).regex(/^\d{1,3}$/, "1–120 ay.").transform(Number))
    .refine((n) => n >= 1 && n <= 120, { message: "1–120 ay." }),
});

export const EgitimKaydiGirdisi = z.object({
  personel: z.string({ error: "Personel seçilmeli." }).regex(UUID, "Personel seçilmeli."),
  tur: z.string({ error: "Eğitim seçilmeli." }).regex(UUID, "Eğitim seçilmeli."),
  tarih,
  kurum: z.enum(KURUMLAR, { error: "Veren seçilmeli." }),
});
export type EgitimKaydiGirdisi = z.output<typeof EgitimKaydiGirdisi>;

/** ay ekle (ay sonu taşmaz: 31 Ocak + 1 ay = 28/29 Şubat) */
export function ayEkle(iso: string, ay: number): string {
  const [y, m, g] = iso.split("-").map(Number);
  const hedef = m - 1 + ay, son = new Date(Date.UTC(y, hedef + 1, 0)).getUTCDate();
  return new Date(Date.UTC(y, hedef, Math.min(g, son))).toISOString().slice(0, 10);
}
export type EgitimDurumu = "gecti" | "yakin" | "gecerli";
const gunFarki = (a: string, b: string) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 864e5);
export function egitimDurumu(tekrar: string, bugun: string, esik: number): EgitimDurumu {
  const k = gunFarki(bugun, tekrar);
  return k < 0 ? "gecti" : k <= esik ? "yakin" : "gecerli";
}
export const kalanGun = (tekrar: string, bugun: string) => gunFarki(bugun, tekrar);
