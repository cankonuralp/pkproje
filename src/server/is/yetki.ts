/* ZAMANLI UÇ YETKİSİ (378) — /api/is/* yalnız zamanlayıcının (Vercel Cron) isteği: "Authorization: Bearer <CRON_SECRET>". Sır ortam değişkeninde
   (koda yazılmaz); yoksa ya da 32 karakterden kısaysa hiçbir istek geçmez (yanlış kurulum açık kapı olmaz). Karşılaştırma sabit sürede (özetler). */
import { createHash, timingSafeEqual } from "node:crypto";

const ozet = (s: string) => createHash("sha256").update(s).digest();

export function zamanliYetkili(baslik: string | null, sir: string | undefined): boolean {
  if (!sir || sir.length < 32 || !baslik) return false;
  return timingSafeEqual(ozet(baslik), ozet(`Bearer ${sir}`));
}
