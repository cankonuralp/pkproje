/* RAPORLAR ↔ ANA SAYFA BAĞLANTISI (332 — maket anasayfa.html "Sonraki kontrol": ekipmanın SON imzalı muayenesinin sonraki kontrol tarihi). Ana
   sayfa rapor tablolarına dokunmaz; buradan okur: ekipman → son imzalı sürümün (en yeni kontrol tarihi) sonraki kontrolü. Yetki ÇAĞIRANDA. */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";

export async function sonrakiKontroller(db: Sorgulayici): Promise<Map<string, string>> {
  return new Map((await db.sorgu<{ e: string; sonraki: string }>(
    `SELECT DISTINCT ON (ekipman_id) ekipman_id::text AS e, sonraki::text FROM rapor_surumu WHERE sonraki IS NOT NULL
     ORDER BY ekipman_id, kontrol_tarihi DESC NULLS LAST, imzalandi DESC`)).rows.map((x) => [x.e, x.sonraki]));
}

/** branş yöneticisinin "Geri gönderdiğin" yüzü (maket r.geri.kim === yönetici; 329–332 incelemesi): şu an Yeni'de bekleyen ve şimdiki
    revizyonundaki son geri gönderimi bu hesabın yaptığı raporlar */
export async function geriGonderdiklerim(db: Sorgulayici, hesapId: string): Promise<number> {
  return Number((await db.sorgu<{ n: string }>(
    `SELECT count(*)::text AS n FROM rapor r WHERE r.durum = 'taslak' AND r.silindi IS NULL AND (
       SELECT h.hesap_id FROM rapor_hareket h WHERE h.firma_id = r.firma_id AND h.rapor_id = r.id AND h.revizyon = r.revizyon AND h.ne = 'geri'
       ORDER BY h.zaman DESC LIMIT 1) = $1::uuid`, [hesapId])).rows[0].n);
}
