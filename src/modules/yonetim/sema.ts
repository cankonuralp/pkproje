/* YÖNETİM › FİRMA AÇ ŞEMASI (348; maket yonetim.html denetle / oneri) — form ve sunucu aynı şemayı kullanır. Veritabanı işlevi (0050
   yonetim_firma_ac) biçimi ve ayrılmış adları AYRICA denetler; ayrılmış ad listesi ikisinde aynı (kilit testi). İletiler maketle aynı. */
import { z } from "../../sema/ortak.ts";

/** firma adresi olamayacak adlar (bize ayrılmış) — 0050'deki listeyle aynı */
export const AYRILMIS = ["www", "yonetim", "api", "mail", "destek", "probata", "test", "demo"] as const;
export const ALT_ALAN = /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$/;

const metin = (s: unknown) => (typeof s === "string" ? s.trim().replace(/\s+/g, " ") : s);

/** `ekAyrilmis`: ortamdan gelen ayrılmış ad (yönetim adresinin ilk etiketi, ana alanın altındaysa) */
export const firmaAcSemasi = (ekAyrilmis: readonly string[] = []) => z.object({
  unvan: z.preprocess(metin, z.string().min(1, "Ticari ünvan yazılmalı.").max(160, "En çok 160 karakter.")),
  alt: z.preprocess((s) => (typeof s === "string" ? s.trim().replace(/[A-Z]/g, (h) => h.toLowerCase()) : s),
    z.string().min(1, "Alt alan adı yazılmalı.")
      .regex(ALT_ALAN, "3–30 karakter; yalnız a–z, 0–9 ve tire (başta ve sonda tire olmaz).")
      .superRefine((a, bag) => {
        if ((AYRILMIS as readonly string[]).includes(a) || ekAyrilmis.includes(a)) bag.addIssue({ code: "custom", message: `“${a}” bize ayrılmış; başka bir ad seçin.` });
      })),
  kod: z.preprocess((s) => (typeof s === "string" ? s.trim().replace(/[a-z]/g, (h) => h.toUpperCase()) : s),
    z.string().min(1, "Kısa kod yazılmalı.").regex(/^[A-Z]{2}$/, "İki harf (A–Z).")),
  yon: z.preprocess(metin, z.string().min(1, "Ad soyad yazılmalı.").max(80, "En çok 80 karakter.")
    .refine((s) => s.length >= 3 && s.split(" ").length >= 2, "Ad ve soyad yazılmalı.")),
  eposta: z.preprocess((s) => (typeof s === "string" ? s.trim().toLowerCase() : s),
    z.string().min(1, "E-posta yazılmalı.").max(120, "En çok 120 karakter.").pipe(z.email({ error: "Geçerli bir e-posta değil." }))),
});
export type FirmaAcGirdisi = z.output<ReturnType<typeof firmaAcSemasi>>;

/* ünvandan öneri (maket oneri): alt alan adı ilk kelime (kısa ise ikinciyle), kısa kod ilk iki kelimenin baş harfleri. Türkçe harf → a–z
   tablodan (yerel ayara bağlı küçültme yok — anayasa 5.5) */
const TR: Record<string, string> = { ç: "c", ğ: "g", ı: "i", i: "i", ö: "o", ş: "s", ü: "u", Ç: "c", Ğ: "g", I: "i", İ: "i", Ö: "o", Ş: "s", Ü: "u" };
const ascii = (s: string) => s.replace(/[çğıiöşüÇĞIİÖŞÜ]/g, (h) => TR[h] ?? h).replace(/[A-Z]/g, (h) => h.toLowerCase());
export function oneri(unvan: string): { alt: string; kod: string } {
  const k = ascii(unvan).replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter(Boolean);
  const alt = (k[0] ?? "") + (k[0] && k[0].length < 4 && k[1] ? k[1] : "");
  const kod = ((k[0] ?? "").charAt(0) + (k[1] ?? k[0] ?? "").charAt(k[1] ? 0 : 1)).replace(/[a-z]/g, (h) => h.toUpperCase());
  return { alt: alt.slice(0, 30), kod: /^[A-Z]{2}$/.test(kod) ? kod : "" };
}

/** yönetim adresinin ilk etiketi ana alanın altındaysa firma adresi olamaz (ör. yönetim.localhost → "yonetim") */
export function yonetimEtiketi(yonetimAlani: string | null, anaAlan: string): string[] {
  if (!yonetimAlani || !yonetimAlani.endsWith(`.${anaAlan}`)) return [];
  const on = yonetimAlani.slice(0, -(anaAlan.length + 1));
  return on.includes(".") ? [] : [on];
}
