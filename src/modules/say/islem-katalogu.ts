/* S.A.Y İŞLEM KATALOĞU — TEK KAYIT (2026-10-16; pkproje §9 "S.A.Y CLAUDE GİBİ" 2. adım a + b). Modüllerin say-islemleri.ts dosyalarındaki işlemler
   burada birleşir (modül kaydı src/modules/moduller.ts gibi tek kaynak): yürütücü (src/server/yz/islem.ts) bunu çalıştırır, dizini S.A.Y'ın önbellekli
   talimatına girer. Adlar tekil, tarifler tek satır (katalogKur — bozuksa uygulama açılmaz; kilit tests/say-islem-katalog.test.ts). Yalnız sunucuda
   (modüllerin sunucu işlevlerini içe aktarır); ekran bunu içe aktarmaz. 2. adım b: bütün modüller (sır yazan işlem yok — Firma ayarları'nın anahtarları
   ekrandan); dosya isteyen yüklemeler (PDF, fotoğraf) ekrandan. */
import { katalogDizini, katalogKur, type Islem, type SayfaTanimi } from "../../server/yz/islem.ts";
import { ANA_SAYFA, MODULLER } from "../moduller.ts";
import { ANA_SAYFA_MODULU, SAY_ISLEMLERI as ANASAYFA } from "../anasayfa/say-islemleri.ts";
import { SAY_ISLEMLERI as ARACLAR, SAY_SAYFALARI as ARACLAR_SAYFALARI } from "../araclar/say-islemleri.ts";
import { SAY_ISLEMLERI as DOKUMANLAR, SAY_SAYFALARI as DOKUMANLAR_SAYFALARI } from "../dokumanlar/say-islemleri.ts";
import { SAY_ISLEMLERI as EGITIMLER } from "../egitimler/say-islemleri.ts";
import { SAY_ISLEMLERI as EKIPMAN_TURLERI, SAY_SAYFALARI as EKIPMAN_TURLERI_SAYFALARI } from "../ekipman-turleri/say-islemleri.ts";
import { SAY_ISLEMLERI as FIRMA_AYARLARI } from "../firma-ayarlari/say-islemleri.ts";
import { SAY_ISLEMLERI as MUHASEBE, SAY_SAYFALARI as MUHASEBE_SAYFALARI } from "../muhasebe/say-islemleri.ts";
import { SAY_ISLEMLERI as MUSTERILER, SAY_SAYFALARI as MUSTERILER_SAYFALARI } from "../musteriler/say-islemleri.ts";
import { SAY_ISLEMLERI as OLCUM_CIHAZLARI, SAY_SAYFALARI as OLCUM_CIHAZLARI_SAYFALARI } from "../olcum-cihazlari/say-islemleri.ts";
import { SAY_ISLEMLERI as ONAYLAR } from "../onaylar/say-islemleri.ts";
import { SAY_ISLEMLERI as PERFORMANS, SAY_SAYFALARI as PERFORMANS_SAYFALARI } from "../performans/say-islemleri.ts";
import { SAY_ISLEMLERI as PERSONEL, SAY_SAYFALARI as PERSONEL_SAYFALARI } from "../personel/say-islemleri.ts";
import { SAY_ISLEMLERI as PLANLAR, SAY_SAYFALARI as PLANLAR_SAYFALARI } from "../planlar/say-islemleri.ts";
import { SAY_ISLEMLERI as RAPOR_FORMAT, SAY_SAYFALARI as RAPOR_FORMAT_SAYFALARI } from "../rapor-format/say-islemleri.ts";
import { SAY_ISLEMLERI as RAPORLAR } from "../raporlar/say-islemleri.ts";
import { SAY_ISLEMLERI as SAY_CHAT } from "../say-chat/say-islemleri.ts";
import { SAY_ISLEMLERI as SOZLESMELER, SAY_SAYFALARI as SOZLESMELER_SAYFALARI } from "../sozlesmeler/say-islemleri.ts";
import { SAY_ISLEMLERI as TALEPLER } from "../talepler/say-islemleri.ts";
import { SAY_ISLEMLERI as TEKLIFLER, SAY_SAYFALARI as TEKLIFLER_SAYFALARI } from "../teklifler/say-islemleri.ts";
import { SAY_ISLEMLERI as UYARILAR } from "../uyarilar/say-islemleri.ts";
import { SAY_ISLEMLERI as ZIMMETLER, SAY_SAYFALARI as ZIMMETLER_SAYFALARI } from "../zimmetler/say-islemleri.ts";

/** katalogdaki modüller ve dosyaları (kilit testi her dosyanın modül işlevlerini denetler); sıra dizindeki sıra */
export const KATALOG_MODULLERI = [
  { modul: "anasayfa", islemler: ANASAYFA },
  { modul: "planlar", islemler: PLANLAR }, { modul: "raporlar", islemler: RAPORLAR }, { modul: "onaylar", islemler: ONAYLAR }, { modul: "uyarilar", islemler: UYARILAR },
  { modul: "musteriler", islemler: MUSTERILER }, { modul: "teklifler", islemler: TEKLIFLER }, { modul: "sozlesmeler", islemler: SOZLESMELER },
  { modul: "olcum-cihazlari", islemler: OLCUM_CIHAZLARI }, { modul: "zimmetler", islemler: ZIMMETLER }, { modul: "araclar", islemler: ARACLAR },
  { modul: "personel", islemler: PERSONEL }, { modul: "talepler", islemler: TALEPLER },
  { modul: "muhasebe", islemler: MUHASEBE }, { modul: "performans", islemler: PERFORMANS },
  { modul: "ekipman-turleri", islemler: EKIPMAN_TURLERI }, { modul: "rapor-format", islemler: RAPOR_FORMAT }, { modul: "say-chat", islemler: SAY_CHAT },
  { modul: "dokumanlar", islemler: DOKUMANLAR }, { modul: "egitimler", islemler: EGITIMLER }, { modul: "firma-ayarlari", islemler: FIRMA_AYARLARI },
] as const;
/** 2026-10-31 (kalem 6b — onay kapısı; sunum "S.A.Y'a tam yetenek", kural: "onaya, imzaya ya da dışarıya gönderme, silme, yayınlama ve plan kabulü
    ikinci onay ister"): S.A.Y'ın yolunda bu işlemler kullanıcının ekrandaki onayı olmadan çalışmaz (src/server/yz/islem.ts islemYurut). Metin pencerede.
    Silme: adı _sil ile biten her işlem. Kilit tests/say-onay.test.ts */
export const IKINCI_ONAY: Readonly<Record<string, (v: Record<string, unknown>) => string>> = {
  rapor_onaya_gonder: () => "Rapor teknik yöneticinin onayına gönderilecek",
  raporlari_onaya_gonder: (v) => `${Array.isArray(v.raporlar) ? v.raporlar.length : 0} rapor onaya gönderilecek (denetimden geçmeyen gönderilmez)`,
  rapor_onayla: () => "Rapor onaylanacak", revizeye_gonder: () => "Rapor revizeye gönderilecek",
  plan_kabul: () => "Plan kabul edilecek (tarafsızlık beyanı onaylanır)",
  format_yayinla: () => "Format yayınlanacak", belge_yayinla: () => "Belge formatı yayınlanacak",
  belge_temele_don: () => "Belgenin yayındaki formatı kaldırılacak (temel formata dönülür)", surume_geri_don: () => "Eski format sürümü yeniden yayınlanacak",
  teklif_gonder: () => "Teklif müşteriye gönderilecek", teklif_kabul: () => "Teklif kabul edildi olarak işaretlenecek",
  izin_gonder: () => "İzin talebi onaya gönderilecek", masraf_gonder: () => "Masraf formu onaya gönderilecek",
  deneme_epostasi: () => "Deneme e-postası gönderilecek", bordro_onaya_gonder: () => "Bordro kişinin imzasına gönderilecek",
  standart_kaldir: () => "Standart sürümü kütüphaneden kaldırılacak", ice_aktar: (v) => `${Array.isArray(v.satirlar) ? Math.max(0, v.satirlar.length - 1) : 0} satır içe aktarılacak (geçersizler atlanır)`,
  ice_aktarim_geri_al: () => "İçe aktarmanın eklediği kullanılmamış kayıtlar silinecek", gider_excel_yukle: (v) => `${Array.isArray(v.satirlar) ? Math.max(0, v.satirlar.length - 1) : 0} satırlık gider Excel'i yüklenecek`,
  rapor_imzali_yukle: () => "İmzalı rapor PDF'i yüklenecek (rapor imzalı olur; müşteriye açılır)", diger_belge_imzali_yukle: () => "İmzalı belge yüklenecek",
  sozlesme_sablon_kaldir: () => "Sözleşme şablonu kaldırılacak", personel_belge_kaldir: () => "Personelin belge satırı kaldırılacak", dokuman_kaldir: () => "Döküman kaldırılacak", isg_katip_kaldir: () => "İSG-KATİP kaydı kaldırılacak",
};
const onayli = (t: Islem): Islem => {
  const m = IKINCI_ONAY[t.ad] ?? (t.ad.endsWith("_sil") ? () => "Kayıt kalıcı olarak silinecek" : null);
  return m ? { ...t, ikinciOnay: m as (v: never) => string } : t;
};
export const ISLEM_KATALOGU: readonly Islem[] = katalogKur(KATALOG_MODULLERI.flatMap((m) => m.islemler).map(onayli));
/** modülün menüdeki adı (dizin ve "islemler" sonucu); 0 = Ana sayfa */
export const modulAdi = (no: number): string => (no === ANA_SAYFA_MODULU ? ANA_SAYFA.ad : MODULLER.find((m) => m.no === no)?.ad ?? `Modül ${no}`);
/** önbellekli talimattaki dizin (her istekte aynı metin) */
export const ISLEM_DIZINI = katalogDizini(ISLEM_KATALOGU, modulAdi);

/** 2026-10-31 (K2 + M4): açık kaydı tanınan ayrıntı sayfaları — ilk eşleşen geçerli (dar desen önce: format sürümü türden, tesis müşteriden önce);
    kilit tests/say-sayfa.test.ts (uygulamanın her kayıt sayfası burada ya da bilerek dışarıda) */
export const SAYFA_KATALOGU: readonly SayfaTanimi[] = [
  ...PLANLAR_SAYFALARI, ...MUSTERILER_SAYFALARI, ...TEKLIFLER_SAYFALARI, ...SOZLESMELER_SAYFALARI, ...PERSONEL_SAYFALARI, ...OLCUM_CIHAZLARI_SAYFALARI,
  ...ZIMMETLER_SAYFALARI, ...ARACLAR_SAYFALARI, ...DOKUMANLAR_SAYFALARI, ...RAPOR_FORMAT_SAYFALARI, ...EKIPMAN_TURLERI_SAYFALARI, ...MUHASEBE_SAYFALARI,
  ...PERFORMANS_SAYFALARI,
];
