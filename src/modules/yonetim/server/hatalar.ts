/* YÖNETİM › HATA KAYDI (567; 06-HATA-TAKIBI "defter sınırlıdır ve yalnız yetkili okur") — yalnız yönetim işleminde (veritabanında yönetim rolü
   okur; firmalar ve uygulama rolü okuyamaz — göç 0093). En son görülen üstte, en çok 300. */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { hataListesiDb, type HataSatiri } from "../../../server/db/hata.ts";

export type { HataSatiri };
export const hatalar = (db: Sorgulayici): Promise<HataSatiri[]> => hataListesiDb(db, 300);
