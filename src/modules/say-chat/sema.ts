/* S.A.Y CHAT — ŞEMA VE SABİTLER (2026-11-07 yeniden; reisim: "S.A.Y Chat revizesini yapacağız", sunum claude.ai 2PiEskE9jDqF5kSefutRBC — "Evet, önerilerle").
   Kişisel sohbet: yazı · fotoğraf (isteğe bağlı altyazı) · belge (PDF, Word, Excel). Mesaj cihazda yazılır, çevrimdışı kuyrukla SIRAYLA gider;
   saat cihazdaki yazılış anıdır, sunucu değiştirmez. SAF — ekran ve sunucu aynı şemayı kullanır. Kararlar (sunum):
   · karar 1: "chatten oku"nun varsayılan bloğu gün değişimi ya da 2 saatten uzun boşlukta biter (BLOK_BOSLUK_DK);
   · karar 2: işlenmiş mesajın dosyası 30 gün sonra silinir, yazısı kalır (ISLENMIS_DOSYA_GUN);
   · karar 3: fotoğraf uzun kenar 2400 px, JPEG %85 (etiket okunurluğu — FOTO_EN_UZUN, FOTO_KALITE). */
import { z } from "zod";
import { kimlik } from "../../sema/ortak.ts";

/** küçültülmüş fotoğraf ve belge — kuyruğun tek işi (base64 ≈ 2,7 MB; /api/islem gövde sınırı 3 MB) */
export const CHAT_FOTO_BAYT = 2 * 1024 * 1024;
export const CHAT_BELGE_BAYT = 2 * 1024 * 1024;
export const CHAT_METIN_EN_COK = 4000;
export const FOTO_EN_UZUN = 2400;
export const FOTO_KALITE = 0.85;
/** karar 1 */
export const BLOK_BOSLUK_DK = 120;
/** karar 2 */
export const ISLENMIS_DOSYA_GUN = 30;
/** ekrana gelen son mesaj sayısı */
export const CHAT_SAYFA = 300;
/** bir seferde seçilen fotoğraf */
export const SECIM_EN_COK = 30;

export const MESAJ_TURLERI = ["yazi", "foto", "belge"] as const;
export type MesajTuru = (typeof MESAJ_TURLERI)[number];
const CEKIM = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/;

/** kuyruğun "chat.mesaj" girdisi (kimlik kuyruğun kaydı — cihazın ürettiği) */
export const MesajGirdisi = z.object({
  tur: z.enum(MESAJ_TURLERI),
  zaman: z.iso.datetime({ offset: true }),
  sira: z.number().int().min(0).max(1000),
  metin: z.string().max(CHAT_METIN_EN_COK).nullable(),
  cekim: z.string().regex(CEKIM).max(19).nullable(),
  ad: z.string().max(200).nullable(),
  veri: z.string().max(Math.ceil(Math.max(CHAT_FOTO_BAYT, CHAT_BELGE_BAYT) / 3) * 4).nullable(),
}).refine((m) => (m.tur === "yazi" ? !!m.metin?.trim() && !m.veri : !!m.veri), { message: "Mesaj boş." });
export type MesajGirdisi = z.output<typeof MesajGirdisi>;

/** ekranın mesajı (sunucudan; bekleyenler cihazdan aynı biçimde) */
export interface ChatMesaji {
  /** cihazın ürettiği kimlik */
  id: string;
  zaman: string; sira: number; tur: MesajTuru; metin: string | null; ad: string | null; cekim: string | null;
  /** sunucudaki dosya (yoksa ya da silindiyse null) */
  dosya: string | null;
  islendi: { plan: string; no: string; rapor: number } | null;
}

/** İstanbul günü "YYYY-AA-GG" */
const GUN = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" });
export const istanbulGunu = (iso: string): string => GUN.format(new Date(iso));

/** S.A.Y "chatten oku" (chat_oku — beceri B02 §8): aralık verilmezse işlenmemiş mesajların son kesintisiz bloğu (kapsam.ts) */
export const ChatOkuGirdisi = z.object({
  /** ISO zaman (dahil) */
  bas: z.iso.datetime({ offset: true }).optional(),
  bit: z.iso.datetime({ offset: true }).optional(),
  /** İstanbul günü YYYY-AA-GG ("dünkü") */
  gun: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  /** "kazan dairesinden sonrası": sözcüğün son geçtiği mesajdan o bloğun sonuna */
  sozcuk: z.string().trim().min(2).max(100).optional(),
  /** işlenmiş mesajları da al */
  islenmis: z.boolean().optional(),
});
export type ChatOkuGirdisi = z.output<typeof ChatOkuGirdisi>;

/** chat_isle: okunan aralık (chat_oku'nun döndürdüğü bas / bit; verilmezse varsayılan blok) plana işlendi — rapor: yazılan rapor sayısı */
export const ChatIsleGirdisi = z.object({
  plan: kimlik,
  bas: z.iso.datetime({ offset: true }).optional(),
  bit: z.iso.datetime({ offset: true }).optional(),
  rapor: z.number().int().min(0).max(1000),
  /** yanlış işaretin geri alınması (aralıktaki, bu plana işlenmiş mesajlar) */
  geri_al: z.boolean().optional(),
});
export type ChatIsleGirdisi = z.output<typeof ChatIsleGirdisi>;

/** dosya modülü: sohbet ve Rapor modu fotoğrafları (yalnız sahibi açar) */
export const DOSYA_SAY_CHAT = "say_chat";
