/* MÜŞTERİ VE TESİS GİRDİSİ — pencerenin ve sunucunun TEK şeması (maket musteriler.html denetle(); karar 45–47, 50). İletiler maketle aynı.
   Kaydı DURDURAN yalnız ad ve biçim; aynı vergi / SGK no başka kayıtta olması UYARI (sunucu söyler, "Yine de kaydet" ile kaydedilir). */
import { eposta, z } from "../../sema/ortak.ts";
import { IL_ILCE } from "../../tanim/iller.ts";

const kirp = (s: unknown) => (typeof s === "string" ? s.trim().replace(/\s+/g, " ") : s);
const bos = (s: unknown) => (typeof s === "string" ? (s.trim() === "" ? null : s.trim().replace(/\s+/g, " ")) : s);
const rakam = (s: unknown) => (typeof s === "string" ? (s.replace(/\s+/g, "") === "" ? null : s.replace(/\s+/g, "")) : s);

export const MusteriGirdisi = z.object({
  unvan: z.preprocess(kirp, z.string({ error: "Ünvan yazılmalı." }).min(3, "Ünvan yazılmalı.").max(160, "En çok 160 karakter.")),
  kisa: z.preprocess(bos, z.string().max(40, "En çok 40 karakter.").nullable()),
  vd: z.preprocess(bos, z.string().max(40, "En çok 40 karakter.").nullable()),
  vno: z.preprocess(rakam, z.string().regex(/^\d{10,11}$/, "Vergi no 10 hane (şahıs şirketinde 11 hane); boş bırakılabilir.").nullable()),
  eposta: z.preprocess((s) => (typeof s === "string" ? (s.trim() === "" ? null : s.trim().toLowerCase()) : s),
    z.email({ error: "E-posta biçimi geçersiz." }).max(254).nullable()),
  tel: z.preprocess(bos, z.string().max(20, "En çok 20 karakter.").regex(/^[0-9+() -]*$/, "Telefon yalnız rakam, boşluk, +, ( ) içerir.").nullable()),
  ilgili: z.preprocess(bos, z.string().max(80, "En çok 80 karakter.").nullable()),
});
export type MusteriGirdisi = z.output<typeof MusteriGirdisi>;

export const TesisGirdisi = z.object({
  ad: z.preprocess(kirp, z.string({ error: "Tesis adı yazılmalı." }).min(2, "Tesis adı yazılmalı.").max(80, "En çok 80 karakter.")),
  adres: z.preprocess(bos, z.string().max(160, "En çok 160 karakter.").nullable()),
  il: z.preprocess(bos, z.string().refine((v) => v in IL_ILCE, "İl listeden seçilmeli.").nullable()),
  ilce: z.preprocess(bos, z.string().nullable()),
  sgk: z.preprocess(rakam, z.string().regex(/^\d{26}$/, "SGK DETSİS NO 26 hane rakam.").nullable()),
}).superRefine((t, bag) => {
  if (t.ilce && (!t.il || !IL_ILCE[t.il]?.includes(t.ilce))) bag.addIssue({ code: "custom", path: ["ilce"], message: "İlçe listeden seçilmeli." });
});
export type TesisGirdisi = z.output<typeof TesisGirdisi>;

/** kısa ad boşsa ünvanın ilk iki sözcüğü (maket) */
export const kisaAd = (g: Pick<MusteriGirdisi, "unvan" | "kisa">) => g.kisa ?? g.unvan.split(" ").slice(0, 2).join(" ").slice(0, 40);

/** eksik bilgi — UYARI, engel değil (karar 45, 46; maket eksikMusteri / eksikTesis) */
export const eksikMusteri = (m: { vno: string | null; eposta: string | null }) => [!m.vno && "vergi no", !m.eposta && "e-posta"].filter(Boolean) as string[];
export const eksikTesis = (t: { sgk: string | null; adres: string | null; il: string | null; ilce: string | null }) =>
  [!t.sgk && "SGK DETSİS NO", !t.adres && "adres", !t.il && "il", !t.ilce && "ilçe"].filter(Boolean) as string[];

/** müşteri girişi · ek giriş (0030; karar 44): ad, e-posta (kullanıcı adı), tesis kapsamı — "hepsi" ya da seçili tesis kimlikleri (en az bir) */
export const EkGirisGirdisi = z.object({
  ad: z.preprocess((s) => (typeof s === "string" ? s.trim().replace(/\s+/g, " ") : s), z.string({ error: "Ad yazılmalı." }).min(1, "Ad yazılmalı.").max(200, "En çok 200 karakter.")),
  eposta,
  tesisler: z.union([z.literal("hepsi").transform(() => null), z.array(z.string().uuid()).min(1, "En az bir tesis seçilmeli.").max(500)
    .transform((l) => [...new Set(l)])], { error: "Tesis kapsamı seçilmeli." }),
});
