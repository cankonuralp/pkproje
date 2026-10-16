/* OTURUMSUZ SALT OKUNUR KİRACI İŞLEMİ (595 K8 — raporun doğrulama sayfası; karekodu okutan kişi oturum açmaz): kiracı ADRESTEN (istekKiracisi),
   hesap bağlamı yok, işlem READ ONLY (yazma veritabanında reddedilir). Kapı çağıranda (doğrulama kodu HMAC'li — src/server/dogrulama.ts). */
import { kiraciHavuzu } from "../db/firma-havuzu.ts";
import { kiraciIcinde, type Sorgulayici } from "../db/kiraci.ts";
import type { IstekKiracisi } from "./coz.ts";

export function acikOkuma<T>(kiraci: IstekKiracisi, is: (db: Sorgulayici) => Promise<T>): Promise<T> {
  return kiraciIcinde(kiraciHavuzu(kiraci), kiraci.firmaId, async (db) => {
    await db.sorgu("SET TRANSACTION READ ONLY");
    return is(db);
  });
}
