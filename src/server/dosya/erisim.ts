/* DOSYA ERİŞİM KAYDI — modül başına "bu kişi bu kaydı görebilir mi" denetimi (09-A2). Modül dosya bağladığında kendi denetimini buraya ekler
   (ör. personel: özlük belgesi yalnız kendisi + yönetici; rapor: canDo + kendi / branş). Kaydı olmayan modülün dosyası KİMSEYE açılmaz.
   2026-10-04 (K2): ekipman türünün rapor formatı PDF'i — türü görebilen açar · ölçüm cihazının kalibrasyon sertifikası — cihazı görebilen açar ·
   zimmet teslim fotoğrafı (araç tutanağı açıları dahil) — hareketi görebilen açar · imzalı iş sözleşmesi — sözleşmeyi gören (gör / yaz) açar ·
   İSG-KATİP PDF'i — ID'yi gören (denetçi yalnız kendi ID'sininkini) · sözleşme şablonu — yalnız değiştirebilen · standart ve döküman PDF'i — Dökümanlar'ı gören ·
   eğitim sertifikası — kaydı gören (denetçi yalnız kendisininkini) · özlük belgesi ve bordro — yalnız Personel'de "yaz" · ekipman atama belgesi ve
   imzalı zimmet formu — kişinin kartını gören (denetçi yalnız kendisininkini). 2026-10-05 (312): rapor fotoğrafı — raporu gören (Raporlar düzeyi:
   denetçi kendi, branş yöneticisi branşı). 328: gider belgesi (fiş / fatura) — Muhasebe'yi gören (gör / yaz); 330: masraf formunun fişini gönderen
   de · izin talebinin belgesi — talep eden ve firma yöneticisi. */
import { DOSYA as DOK_DOSYA, dokumanDosyasiGorulur, standartDosyasiGorulur } from "../../modules/dokumanlar/server/dokumanlar.ts";
import { DOSYA_MODULU as EGITIM_DOSYASI, egitimDosyasiGorulur } from "../../modules/egitimler/server/egitimler.ts";
import { GIDER_DOSYA, giderDosyasiGorulur } from "../../modules/muhasebe/server/giderler.ts";
import { IZIN_DOSYA, izinDosyasiGorulur } from "../../modules/talepler/server/talepler.ts";
import { DOSYA as PER_DOSYA, gizliDosyaGorulur, kartDosyasiGorulur } from "../../modules/personel/server/dosyalar.ts";
import { DOSYA_MODULU as TUR_DOSYASI, turDosyasiGorulur } from "../../modules/ekipman-turleri/server/turler.ts";
import { DOSYA_MODULU as CIHAZ_DOSYASI, cihazDosyasiGorulur } from "../../modules/olcum-cihazlari/server/cihazlar.ts";
import { DOSYA as SOZ_DOSYA, isgDosyasiGorulur, sablonDosyasiGorulur, sozlesmeDosyasiGorulur } from "../../modules/sozlesmeler/server/sozlesmeler.ts";
import { DOSYA_MODULU as ZIMMET_DOSYASI, zimmetDosyasiGorulur } from "../../modules/zimmetler/server/zimmet.ts";
import { DOSYA_MODULU as RAPOR_DOSYASI, IMZALI_MODULU, PDF_MODULU, raporDosyasiGorulur } from "../../modules/raporlar/server/raporlar.ts";
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
  [EGITIM_DOSYASI]: (db, kisi, kayitId) => egitimDosyasiGorulur(db, kisi as YetkiHesabi, kayitId),
  [PER_DOSYA.ozluk]: (db, kisi, kayitId) => gizliDosyaGorulur(db, kisi as YetkiHesabi, "ozluk_belgesi", kayitId),
  [PER_DOSYA.bordro]: (db, kisi, kayitId) => gizliDosyaGorulur(db, kisi as YetkiHesabi, "bordro", kayitId),
  [PER_DOSYA.atama]: (db, kisi, kayitId) => kartDosyasiGorulur(db, kisi as YetkiHesabi, "ekipman_atamasi", kayitId),
  [PER_DOSYA.zimmetFormu]: (db, kisi, kayitId) => kartDosyasiGorulur(db, kisi as YetkiHesabi, "zimmet_formu", kayitId),
  [RAPOR_DOSYASI]: (db, kisi, kayitId) => raporDosyasiGorulur(db, kisi as YetkiHesabi, kayitId),
  /* 317: imzaya hazırlanan ve imzalı PDF — raporu gören (müşteri erişimi müşteri paneli kalemiyle) */
  [PDF_MODULU]: (db, kisi, kayitId) => raporDosyasiGorulur(db, kisi as YetkiHesabi, kayitId),
  [IMZALI_MODULU]: (db, kisi, kayitId) => raporDosyasiGorulur(db, kisi as YetkiHesabi, kayitId),
  [GIDER_DOSYA]: (db, kisi, kayitId) => giderDosyasiGorulur(db, kisi as YetkiHesabi, kayitId),
  [IZIN_DOSYA]: (db, kisi, kayitId) => izinDosyasiGorulur(db, kisi as YetkiHesabi, kayitId),
});
