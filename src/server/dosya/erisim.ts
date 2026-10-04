/* DOSYA ERİŞİM KAYDI — modül başına "bu kişi bu kaydı görebilir mi" denetimi (09-A2). Modül dosya bağladığında kendi denetimini buraya ekler
   (ör. personel: özlük belgesi yalnız kendisi + yönetici; rapor: canDo + kendi / branş). Kaydı olmayan modülün dosyası KİMSEYE açılmaz.
   K1 (2026-10-04): henüz dosya bağlayan modül yok → boş. */
import type { ErisimKaydi } from "./dosya.ts";

export const DOSYA_ERISIMI: ErisimKaydi = Object.freeze({});
