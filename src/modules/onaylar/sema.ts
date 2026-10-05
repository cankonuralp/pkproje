/* ONAYLAR ŞEMALARI (form + sunucu tek şema; maket onaylar pencereCiz / geri-gonder / durum-kaydet). Gerekçe: Yeni'ye dönen rapor denetçiye
   döner — en az 10 karakter (denetçi neyi düzelteceğini bilmeli); öteki durum değişikliğinde isteğe bağlı. Veritabanı da ister (0026). */
import { z } from "zod";

/** karakter sayısı veritabanıyla aynı ölçüde (kod noktası; PostgreSQL length) — "📷" bir karakter, UTF-16'da iki birim */
export const uzunluk = (s: string) => [...s].length;
const gerekce = z.preprocess((s) => (typeof s === "string" ? s.trim().replace(/\s+/g, " ") : ""), z.string().refine((g) => uzunluk(g) <= 400, "En çok 400 karakter."));
export const GERI_GEREKCE = "Gerekçe en az 10 karakter olmalı: denetçi neyi düzelteceğini bilmeli.";

export const GeriGirdisi = z.object({ gerekce: gerekce.refine((g) => uzunluk(g) >= 10, GERI_GEREKCE) });

/** Durumu değiştir: Yeni · onayda · onaylandı (Tamamlandı'ya yalnız imzayla — 190) */
export const DURUM_HEDEF = ["taslak", "onayda", "onaylandi"] as const;
export const DurumGirdisi = z.object({
  hedef: z.enum(DURUM_HEDEF, { error: "Yeni durumu seçin." }),
  gerekce,
}).superRefine((v, bag) => {
  if (v.hedef === "taslak" && uzunluk(v.gerekce) < 10) {
    bag.addIssue({ code: "custom", path: ["gerekce"], message: "Yeni'ye alınan rapor denetçiye döner: gerekçe en az 10 karakter olmalı." });
  }
});
