/* ÇALIŞMA MODELİ (2026-11-12; pkproje.md §11 K1–K12 — reisim: "türkaklı ve türkaksız firmalar için 2 ayrı model oluşturup ona göre yapmalıyız"):
   firma ya TÜRKAK'lı (kontrol saati ölçülür, sapma gerekçeyle geçer) ya TÜRKAK'sız (saat elle yazılır, kurallar uyarıdır) çalışır. Model firma
   açılırken Yönetim'de seçilir, sonra yalnız Yönetim değiştirir (göç 0127 — firma_ayar 'calisma', uygulama rolü yazamaz). Saf: ekran ve sunucu
   aynı adları kullanır. Kayıt yoksa "siz". */
export const CALISMA_MODELLERI = ["siz", "turkak"] as const;
export type CalismaModeli = (typeof CALISMA_MODELLERI)[number];
export const MODEL_ADI: Record<CalismaModeli, string> = { turkak: "TÜRKAK'lı", siz: "TÜRKAK'sız" };
/** bilinmeyen / boş değer TÜRKAK'sız sayılır (eski kayıt, bozuk değer firmayı sıkı kurala sokmaz) */
export const modelCoz = (v: unknown): CalismaModeli => (v === "turkak" ? "turkak" : "siz");
