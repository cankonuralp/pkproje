/* EKİPMAN TÜRÜ GİRDİSİ — pencerenin ve sunucunun TEK şeması (maket ekipman-turleri.html denetle(); AA5). İletiler maketle aynı.
   Branş Ek-III grubundan gelir; "Ek-III dışı" grupta seçilir (onaylayan yönetici branştan). Kod yalnız eklerken (değişmez). */
import { z } from "../../sema/ortak.ts";
import { TANIMLAR } from "../../tanim/veri.ts";

export const GRUPLAR = TANIMLAR.ek3_gruplari;
export const grupBul = (k: string) => GRUPLAR.find((g) => g.k === k);
export const bransAd = (b: string | null | undefined) => (b === "m" ? "Mekanik" : b === "e" ? "Elektrik" : "—");

const kirp = (s: unknown) => (typeof s === "string" ? s.trim().replace(/\s+/g, " ") : s);
const sayi = (s: unknown) => (typeof s === "string" ? (s.trim() === "" ? null : s.trim()) : s);

export const TurGirdisi = z.object({
  ad: z.preprocess(kirp, z.string({ error: "Tür adı yazılmalı." }).min(3, "Tür adı yazılmalı.").max(60, "En çok 60 karakter.")),
  kod: z.preprocess((s) => (typeof s === "string" ? s.trim().toUpperCase() : s),
    z.string({ error: "Kod 2–3 büyük harf (A–Z); ekipman kodlarının öneki olur." }).regex(/^[A-Z]{2,3}$/, "Kod 2–3 büyük harf (A–Z); ekipman kodlarının öneki olur.")),
  grup: z.string({ error: "Ek-III grubu seçilmeli (branş buradan gelir)." }).refine((g) => !!grupBul(g), "Ek-III grubu seçilmeli (branş buradan gelir)."),
  brans: z.preprocess(sayi, z.enum(["m", "e"]).nullable()),
  periyot: z.preprocess(sayi, z.string({ error: "Periyot 1–120 ay." }).regex(/^\d{1,3}$/, "Periyot 1–120 ay.").transform(Number)
    .refine((n) => n >= 1 && n <= 120, "Periyot 1–120 ay.")),
  sure: z.preprocess(sayi, z.string().regex(/^\d{1,3}$/, "Dakika olarak; boş bırakılabilir.").transform(Number)
    .refine((n) => n >= 1, "Dakika olarak; boş bırakılabilir.").nullable()),
}).superRefine((t, bag) => {
  if (grupBul(t.grup)?.b === null && !t.brans) bag.addIssue({ code: "custom", path: ["brans"], message: "Ek-III dışı türde branş seçilmeli." });
});
export type TurGirdisi = z.output<typeof TurGirdisi>;

/** kaydedilecek branş: grubunki; Ek-III dışında seçilen */
export const turBransi = (t: Pick<TurGirdisi, "grup" | "brans">) => grupBul(t.grup)?.b ?? t.brans!;
