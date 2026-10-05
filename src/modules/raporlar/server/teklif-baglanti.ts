/* RAPORLAR ↔ TEKLİFLER BAĞLANTISI (modül 11 → 14; pkproje §3.2 madde 5: "her rapor teklif kalemine bağlanır"; maket teklifler.html "Raporlanan").
   Teklifler rapor tablolarına dokunmaz; yalnız bu işlevi çağırır: verilen tesislerde verilen günden (dahil) sonra imzalanan raporlar — tesis, tür
   ve imza günü (Türkiye takvimi; raporun İLK imzalı sürümü: revizyon yeni rapor sayılmaz). Hangi raporun hangi teklife bağlandığına Teklifler
   karar verir (her rapor tek teklife — 324 incelemesi). Yetki ÇAĞIRANDA. */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export interface TeklifRaporu { raporId: string; tesisId: string; turId: string; gun: string }

/** tesislerde verilen günden (dahil) sonra imzalanan raporlar */
export async function imzaliRaporlar(db: Sorgulayici, tesisler: readonly string[], gun: string): Promise<TeklifRaporu[]> {
  const l = tesisler.filter((x) => UUID.test(x));
  if (!l.length || !/^\d{4}-\d{2}-\d{2}$/.test(gun)) return [];
  return (await db.sorgu<{ rapor_id: string; tesis_id: string; tur_id: string; gun: string }>(
    `SELECT rapor_id::text, tesis_id::text, tur_id::text, (imzalandi AT TIME ZONE 'Europe/Istanbul')::date::text AS gun FROM rapor_surumu
     WHERE tesis_id = ANY ($1::uuid[]) AND revizyon = 0 AND (imzalandi AT TIME ZONE 'Europe/Istanbul')::date >= $2::date`, [l, gun])).rows
    .map((x) => ({ raporId: x.rapor_id, tesisId: x.tesis_id, turId: x.tur_id, gun: x.gun }));
}
