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

/* ── DİĞER BELGELER (333; maket MV.BELGE_ONAY_TUR, onaylar.html BDURUM) — istemciye de gider (ad ve rozet) ── */
export const BELGE_TUR = { bordro: "Maaş bordrosu", egitim: "Eğitim formu", zimmet: "Zimmet formu", arac: "Araç teslim tutanağı" } as const;
export type BelgeTuru = keyof typeof BELGE_TUR;
export const BELGE_DURUM = {
  bekliyor: ["Onay bekliyor", "bekliyor"], imzali: ["İmzalandı", "tamam"], geri: ["Geri gönderildi", "red"],
  /* 333 incelemesi: kaynağı (bordro) değişen bekleyen belge — kişi eski PDF'i imzalamaz */
  iptal: ["İptal edildi", "notr"],
} as const satisfies Record<string, readonly [string, "bekliyor" | "tamam" | "red" | "notr"]>;
/** etkin belge: bekliyor ya da imzalı (geri gönderilen ve iptal edilen yeniden gönderilebilir) */
export const belgeEtkin = (d: BelgeDurumu | null | undefined) => d === "bekliyor" || d === "imzali";
export type BelgeDurumu = keyof typeof BELGE_DURUM;
const AYLAR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
/** "2026-09" → "Eylül 2026" */
export const donemAd = (ay: string) => `${AYLAR[Number(ay.slice(5, 7)) - 1]} ${ay.slice(0, 4)}`;
/** bordro belgesinin adı (maket "Eylül 2026 maaş bordrosu") */
export const bordroBelgeAdi = (ay: string) => `${donemAd(ay)} maaş bordrosu`;
