/* ONAYLAR ŞEMALARI (form + sunucu tek şema; maket onaylar pencereCiz / geri-gonder / durum-kaydet). Gerekçe her geçişte İSTEĞE BAĞLI (2026-10-17,
   reisim: "En az 10 harflik gerekçe zorunlu … zorunlu açıklamayı kaldır"; göç 0101) — yazılırsa denetçi raporun üstünde görür. Önceden Yeni'ye
   dönen raporda en az 10 karakterdi (0026). Revizeye göndermede gerekçe zorunluluğu aynen (RevizeGirdisi, veritabanı 0101). */
import { z } from "zod";

/** karakter sayısı veritabanıyla aynı ölçüde (kod noktası; PostgreSQL length) — "📷" bir karakter, UTF-16'da iki birim */
export const uzunluk = (s: string) => [...s].length;
const gerekce = z.preprocess((s) => (typeof s === "string" ? s.trim().replace(/\s+/g, " ") : ""), z.string().refine((g) => uzunluk(g) <= 400, "En çok 400 karakter."));
export const GeriGirdisi = z.object({ gerekce });

/** Durumu değiştir: Yeni · onayda · onaylandı (Tamamlandı'ya yalnız imzayla — 190) */
export const DURUM_HEDEF = ["taslak", "onayda", "onaylandi"] as const;
export const DurumGirdisi = z.object({
  hedef: z.enum(DURUM_HEDEF, { error: "Yeni durumu seçin." }),
  gerekce,
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
