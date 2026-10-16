/* S.A.Y İŞLEM KATALOĞU — TEK KAYIT (2026-10-16; pkproje §9 "S.A.Y CLAUDE GİBİ" 2. adım a). Modüllerin say-islemleri.ts dosyalarındaki işlemler
   burada birleşir (modül kaydı src/modules/moduller.ts gibi tek kaynak): yürütücü (src/server/yz/islem.ts) bunu çalıştırır, dizini S.A.Y'ın önbellekli
   talimatına girer. Adlar tekil, tarifler tek satır (katalogKur — bozuksa uygulama açılmaz; kilit tests/say-islem-katalog.test.ts). Yalnız sunucuda
   (modüllerin sunucu işlevlerini içe aktarır); ekran bunu içe aktarmaz. Sonraki modüller buraya eklenir. */
import { katalogDizini, katalogKur, type Islem } from "../../server/yz/islem.ts";
import { MODULLER } from "../moduller.ts";
import { SAY_ISLEMLERI as MUSTERILER } from "../musteriler/say-islemleri.ts";
import { SAY_ISLEMLERI as ONAYLAR } from "../onaylar/say-islemleri.ts";
import { SAY_ISLEMLERI as PLANLAR } from "../planlar/say-islemleri.ts";
import { SAY_ISLEMLERI as RAPORLAR } from "../raporlar/say-islemleri.ts";
import { SAY_ISLEMLERI as TEKLIFLER } from "../teklifler/say-islemleri.ts";

/** katalogdaki modüller ve dosyaları (kilit testi her dosyanın modül işlevlerini denetler) */
export const KATALOG_MODULLERI = [
  { modul: "planlar", islemler: PLANLAR }, { modul: "raporlar", islemler: RAPORLAR }, { modul: "musteriler", islemler: MUSTERILER },
  { modul: "teklifler", islemler: TEKLIFLER }, { modul: "onaylar", islemler: ONAYLAR },
] as const;
export const ISLEM_KATALOGU: readonly Islem[] = katalogKur(KATALOG_MODULLERI.flatMap((m) => m.islemler));
/** modülün menüdeki adı (dizin ve "islemler" sonucu) */
export const modulAdi = (no: number): string => MODULLER.find((m) => m.no === no)?.ad ?? `Modül ${no}`;
/** önbellekli talimattaki dizin (her istekte aynı metin) */
export const ISLEM_DIZINI = katalogDizini(ISLEM_KATALOGU, modulAdi);
