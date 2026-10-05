/* RAPORLAR ↔ TEKLİFLER BAĞLANTISI (modül 11 → 14; pkproje §3.2 madde 5: "her rapor teklif kalemine bağlanır"; maket teklifler.html "Raporlanan",
   muhasebe.html MV.raporFiyat). Teklifler rapor tablolarına dokunmaz; yalnız bu işlevi çağırır: verilen tesislerde verilen günden (dahil) sonra
   AÇILAN (silinmemiş) raporlar — tesis, tür, açılış günü (Türkiye takvimi; maket r.olustu) ve imzalı mı (imzalı sürümü var mı). Hangi raporun
   hangi teklife bağlandığına ve birim fiyatına Teklifler karar verir (her rapor tek teklife — 324 incelemesi; 327 muhasebe). Yetki ÇAĞIRANDA. */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** olustu: sıralama için açılış zamanı (ISO) */
export interface TeklifRaporu { raporId: string; tesisId: string; turId: string; gun: string; olustu: string; imzali: boolean }

/** tesislerde verilen günden (dahil) sonra açılan raporlar */
export async function teklifRaporlari(db: Sorgulayici, tesisler: readonly string[], gun: string): Promise<TeklifRaporu[]> {
  const l = [...new Set(tesisler.filter((x) => UUID.test(x)))];
  if (!l.length || !/^\d{4}-\d{2}-\d{2}$/.test(gun)) return [];
  return (await db.sorgu<{ id: string; tesis_id: string; tur_id: string; gun: string; olustu: Date; imzali: boolean }>(
    `SELECT r.id::text, p.tesis_id::text, r.tur_id::text, (r.olustu AT TIME ZONE 'Europe/Istanbul')::date::text AS gun, r.olustu,
        EXISTS (SELECT 1 FROM rapor_surumu s WHERE s.firma_id = r.firma_id AND s.rapor_id = r.id) AS imzali
     FROM rapor r JOIN plan p ON p.firma_id = r.firma_id AND p.id = r.plan_id
     WHERE r.silindi IS NULL AND p.tesis_id = ANY ($1::uuid[]) AND (r.olustu AT TIME ZONE 'Europe/Istanbul')::date >= $2::date`, [l, gun])).rows
    .map((x) => ({ raporId: x.id, tesisId: x.tesis_id, turId: x.tur_id, gun: x.gun, olustu: x.olustu.toISOString(), imzali: x.imzali }));
}
