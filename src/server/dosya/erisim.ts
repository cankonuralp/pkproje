/* DOSYA ERİŞİM KAYDI — modül başına "bu kişi bu kaydı görebilir mi" denetimi (09-A2). Modül dosya bağladığında kendi denetimini buraya ekler
   (ör. personel: özlük belgesi yalnız kendisi + yönetici; rapor: canDo + kendi / branş). Kaydı olmayan modülün dosyası KİMSEYE açılmaz.
   2026-10-04 (K2): ekipman türünün rapor formatı PDF'i — türü görebilen açar · ölçüm cihazının kalibrasyon sertifikası — cihazı görebilen açar ·
   zimmet teslim fotoğrafı (araç tutanağı açıları dahil) — hareketi görebilen açar · imzalı iş sözleşmesi — sözleşmeyi gören (gör / yaz) açar ·
   İSG-KATİP PDF'i — ID'yi gören (denetçi yalnız kendi ID'sininkini) · sözleşme şablonu — yalnız değiştirebilen · standart ve döküman PDF'i — Dökümanlar'ı gören. */
import { DOSYA as DOK_DOSYA, dokumanDosyasiGorulur, standartDosyasiGorulur } from "../../modules/dokumanlar/server/dokumanlar.ts";
import { DOSYA_MODULU as TUR_DOSYASI, turDosyasiGorulur } from "../../modules/ekipman-turleri/server/turler.ts";
import { DOSYA_MODULU as CIHAZ_DOSYASI, cihazDosyasiGorulur } from "../../modules/olcum-cihazlari/server/cihazlar.ts";
import { DOSYA as SOZ_DOSYA, isgDosyasiGorulur, sablonDosyasiGorulur, sozlesmeDosyasiGorulur } from "../../modules/sozlesmeler/server/sozlesmeler.ts";
import { DOSYA_MODULU as ZIMMET_DOSYASI, zimmetDosyasiGorulur } from "../../modules/zimmetler/server/zimmet.ts";
import type { YetkiHesabi } from "../yetki/canDo.ts";
import type { ErisimKaydi } from "./dosya.ts";

export const DOSYA_ERISIMI: ErisimKaydi = Object.freeze({
  [TUR_DOSYASI]: (db, kisi, kayitId) => turDosyasiGorulur(db, kisi as YetkiHesabi, kayitId),
  [CIHAZ_DOSYASI]: (db, kisi, kayitId) => cihazDosyasiGorulur(db, kisi as YetkiHesabi, kayitId),
  [ZIMMET_DOSYASI]: (db, kisi, kayitId) => zimmetDosyasiGorulur(db, kisi as YetkiHesabi, kayitId),
  [SOZ_DOSYA.sozlesme]: (db, kisi, kayitId) => sozlesmeDosyasiGorulur(db, kisi as YetkiHesabi, kayitId),
  [SOZ_DOSYA.isg]: (db, kisi, kayitId) => isgDosyasiGorulur(db, kisi as YetkiHesabi, kayitId),
  [SOZ_DOSYA.sablon]: (db, kisi) => sablonDosyasiGorulur(db, kisi as YetkiHesabi),
  [DOK_DOSYA.standart]: (db, kisi, kayitId) => standartDosyasiGorulur(db, kisi as YetkiHesabi, kayitId),
  [DOK_DOSYA.dokuman]: (db, kisi, kayitId) => dokumanDosyasiGorulur(db, kisi as YetkiHesabi, kayitId),
});
