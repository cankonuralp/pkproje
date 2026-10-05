/* RAPORLAR ↔ ANA SAYFA BAĞLANTISI (332 — maket anasayfa.html "Sonraki kontrol": ekipmanın SON imzalı muayenesinin sonraki kontrol tarihi). Ana
   sayfa rapor tablolarına dokunmaz; buradan okur: ekipman → son imzalı sürümün (en yeni kontrol tarihi) sonraki kontrolü. Yetki ÇAĞIRANDA. */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";

export async function sonrakiKontroller(db: Sorgulayici): Promise<Map<string, string>> {
  return new Map((await db.sorgu<{ e: string; sonraki: string }>(
    `SELECT DISTINCT ON (ekipman_id) ekipman_id::text AS e, sonraki::text FROM rapor_surumu WHERE sonraki IS NOT NULL
     ORDER BY ekipman_id, kontrol_tarihi DESC NULLS LAST, imzalandi DESC`)).rows.map((x) => [x.e, x.sonraki]));
}
