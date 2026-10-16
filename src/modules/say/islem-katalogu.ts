/* S.A.Y İŞLEM KATALOĞU — TEK KAYIT (2026-10-16; pkproje §9 "S.A.Y CLAUDE GİBİ" 2. adım a + b). Modüllerin say-islemleri.ts dosyalarındaki işlemler
   burada birleşir (modül kaydı src/modules/moduller.ts gibi tek kaynak): yürütücü (src/server/yz/islem.ts) bunu çalıştırır, dizini S.A.Y'ın önbellekli
   talimatına girer. Adlar tekil, tarifler tek satır (katalogKur — bozuksa uygulama açılmaz; kilit tests/say-islem-katalog.test.ts). Yalnız sunucuda
   (modüllerin sunucu işlevlerini içe aktarır); ekran bunu içe aktarmaz. 2. adım b: bütün modüller (sır yazan işlem yok — Firma ayarları'nın anahtarları
   ekrandan); dosya isteyen yüklemeler (PDF, fotoğraf) ekrandan. */
import { katalogDizini, katalogKur, type Islem } from "../../server/yz/islem.ts";
import { ANA_SAYFA, MODULLER } from "../moduller.ts";
import { ANA_SAYFA_MODULU, SAY_ISLEMLERI as ANASAYFA } from "../anasayfa/say-islemleri.ts";
import { SAY_ISLEMLERI as ARACLAR } from "../araclar/say-islemleri.ts";
import { SAY_ISLEMLERI as DOKUMANLAR } from "../dokumanlar/say-islemleri.ts";
import { SAY_ISLEMLERI as EGITIMLER } from "../egitimler/say-islemleri.ts";
import { SAY_ISLEMLERI as EKIPMAN_TURLERI } from "../ekipman-turleri/say-islemleri.ts";
import { SAY_ISLEMLERI as FIRMA_AYARLARI } from "../firma-ayarlari/say-islemleri.ts";
import { SAY_ISLEMLERI as MUHASEBE } from "../muhasebe/say-islemleri.ts";
import { SAY_ISLEMLERI as MUSTERILER } from "../musteriler/say-islemleri.ts";
import { SAY_ISLEMLERI as OLCUM_CIHAZLARI } from "../olcum-cihazlari/say-islemleri.ts";
import { SAY_ISLEMLERI as ONAYLAR } from "../onaylar/say-islemleri.ts";
import { SAY_ISLEMLERI as PERFORMANS } from "../performans/say-islemleri.ts";
import { SAY_ISLEMLERI as PERSONEL } from "../personel/say-islemleri.ts";
import { SAY_ISLEMLERI as PLANLAR } from "../planlar/say-islemleri.ts";
import { SAY_ISLEMLERI as RAPOR_FORMAT } from "../rapor-format/say-islemleri.ts";
import { SAY_ISLEMLERI as RAPORLAR } from "../raporlar/say-islemleri.ts";
import { SAY_ISLEMLERI as SOZLESMELER } from "../sozlesmeler/say-islemleri.ts";
import { SAY_ISLEMLERI as TALEPLER } from "../talepler/say-islemleri.ts";
import { SAY_ISLEMLERI as TEKLIFLER } from "../teklifler/say-islemleri.ts";
import { SAY_ISLEMLERI as UYARILAR } from "../uyarilar/say-islemleri.ts";
import { SAY_ISLEMLERI as ZIMMETLER } from "../zimmetler/say-islemleri.ts";

/** katalogdaki modüller ve dosyaları (kilit testi her dosyanın modül işlevlerini denetler); sıra dizindeki sıra */
export const KATALOG_MODULLERI = [
  { modul: "anasayfa", islemler: ANASAYFA },
  { modul: "planlar", islemler: PLANLAR }, { modul: "raporlar", islemler: RAPORLAR }, { modul: "onaylar", islemler: ONAYLAR }, { modul: "uyarilar", islemler: UYARILAR },
  { modul: "musteriler", islemler: MUSTERILER }, { modul: "teklifler", islemler: TEKLIFLER }, { modul: "sozlesmeler", islemler: SOZLESMELER },
  { modul: "olcum-cihazlari", islemler: OLCUM_CIHAZLARI }, { modul: "zimmetler", islemler: ZIMMETLER }, { modul: "araclar", islemler: ARACLAR },
  { modul: "personel", islemler: PERSONEL }, { modul: "talepler", islemler: TALEPLER },
  { modul: "muhasebe", islemler: MUHASEBE }, { modul: "performans", islemler: PERFORMANS },
  { modul: "ekipman-turleri", islemler: EKIPMAN_TURLERI }, { modul: "rapor-format", islemler: RAPOR_FORMAT },
  { modul: "dokumanlar", islemler: DOKUMANLAR }, { modul: "egitimler", islemler: EGITIMLER }, { modul: "firma-ayarlari", islemler: FIRMA_AYARLARI },
] as const;
export const ISLEM_KATALOGU: readonly Islem[] = katalogKur(KATALOG_MODULLERI.flatMap((m) => m.islemler));
/** modülün menüdeki adı (dizin ve "islemler" sonucu); 0 = Ana sayfa */
export const modulAdi = (no: number): string => (no === ANA_SAYFA_MODULU ? ANA_SAYFA.ad : MODULLER.find((m) => m.no === no)?.ad ?? `Modül ${no}`);
/** önbellekli talimattaki dizin (her istekte aynı metin) */
export const ISLEM_DIZINI = katalogDizini(ISLEM_KATALOGU, modulAdi);
