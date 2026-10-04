/* ZİMMET GİRDİSİ — pencerenin ve sunucunun TEK şeması (maket zimmetler.html denetle(); M4 2. tur). Varlık "c:<id>" (ölçüm cihazı) ya da
   "d:<id>" (diğer demirbaş); teslim alan bir personel kimliği ya da "depo". Zaman "YYYY-AA-GGTSS:DD" (Türkiye saati). Not isteğe bağlı. */
import { zaman, z } from "../../sema/ortak.ts";

const bos = (s: unknown) => (typeof s === "string" ? (s.trim() === "" ? null : s.trim().replace(/\s+/g, " ")) : s);

export const TeslimGirdisi = z.object({
  varlik: z.string({ error: "Varlık seçilmeli." }).regex(/^[cd]:[0-9a-f-]{36}$/, "Varlık seçilmeli."),
  alan: z.string({ error: "Teslim alan seçilmeli." }).refine((a) => a === "depo" || /^[0-9a-f-]{36}$/.test(a), "Teslim alan seçilmeli."),
  zaman,
  notu: z.preprocess(bos, z.string().max(300, "En çok 300 karakter.").nullable()),
});
export type TeslimGirdisi = z.output<typeof TeslimGirdisi>;

export const DemirbasGirdisi = z.object({
  kod: z.preprocess((s) => (typeof s === "string" ? s.trim().toUpperCase() : s),
    z.string({ error: "Kod 3–12 hane (A–Z, 0–9, tire)." }).regex(/^[A-Z0-9-]{3,12}$/, "Kod 3–12 hane (A–Z, 0–9, tire).")),
  ad: z.preprocess(bos, z.string({ error: "Ad yazılmalı." }).min(2, "Ad yazılmalı.").max(80, "En çok 80 karakter.")),
});
