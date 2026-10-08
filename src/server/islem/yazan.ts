/* İŞİ YAZANIN ETİKETİ (392; 09-D2 "kuyruk işlenirken oturumdaki hesap değiştiyse gönderilmez") — cihaz kuyruğundaki her iş, yazıldığı andaki
   oturumun etiketini taşır; sunucu oturumdaki kişinin etiketiyle karşılaştırır, değilse işlemez (cihaz saklar, o kişi girince gider). Tarayıcıya
   hesap kimliği GİTMEZ (uygulama düzeni: yalnız ad ve rol adı) — etiket kimlikten türetilen, geri çözülemeyen sabit bir özettir. */
import { createHash } from "node:crypto";

export const YAZAN_BICIMI = /^[A-Za-z0-9_-]{22}$/;

export function yazanEtiketi(hesapId: string): string {
  return createHash("sha256").update(`probata-islem-yazan:${hesapId}`, "utf8").digest("base64url").slice(0, 22);
}
