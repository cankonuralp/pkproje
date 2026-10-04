/* DOSYA ERİŞİM KAYDI — modül başına "bu kişi bu kaydı görebilir mi" denetimi (09-A2). Modül dosya bağladığında kendi denetimini buraya ekler
   (ör. personel: özlük belgesi yalnız kendisi + yönetici; rapor: canDo + kendi / branş). Kaydı olmayan modülün dosyası KİMSEYE açılmaz.
   2026-10-04 (K2): ekipman türünün rapor formatı PDF'i — türü görebilen açar · ölçüm cihazının kalibrasyon sertifikası — cihazı görebilen açar ·
   zimmet teslim fotoğrafı — hareketi görebilen açar. */
import { DOSYA_MODULU as TUR_DOSYASI, turDosyasiGorulur } from "../../modules/ekipman-turleri/server/turler.ts";
import { DOSYA_MODULU as CIHAZ_DOSYASI, cihazDosyasiGorulur } from "../../modules/olcum-cihazlari/server/cihazlar.ts";
import { DOSYA_MODULU as ZIMMET_DOSYASI, zimmetDosyasiGorulur } from "../../modules/zimmetler/server/zimmet.ts";
import type { YetkiHesabi } from "../yetki/canDo.ts";
import type { ErisimKaydi } from "./dosya.ts";

export const DOSYA_ERISIMI: ErisimKaydi = Object.freeze({
  [TUR_DOSYASI]: (db, kisi, kayitId) => turDosyasiGorulur(db, kisi as YetkiHesabi, kayitId),
  [CIHAZ_DOSYASI]: (db, kisi, kayitId) => cihazDosyasiGorulur(db, kisi as YetkiHesabi, kayitId),
  [ZIMMET_DOSYASI]: (db, kisi, kayitId) => zimmetDosyasiGorulur(db, kisi as YetkiHesabi, kayitId),
});
