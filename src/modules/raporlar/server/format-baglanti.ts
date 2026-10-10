/* RAPORLAR ↔ RAPOR FORMATI (471; reisim 2026-10-10, maket kararı k5): Rapor formatı ekranlarının rapora baktığı tek yer — sürüm başına bu sürümle
   açılmış (silinmemiş) rapor sayısı (sürüm sayfası: "Bu sürümle yazılan rapor", öteki sürümler tablosu). Yalnız sayı döner; kiracı süzgeci
   veritabanında (RLS). */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export async function formatRaporSayilari(db: Sorgulayici, formatlar: readonly string[]): Promise<Record<string, number>> {
  const l = [...new Set(formatlar.filter((x) => UUID.test(x)))];
  if (!l.length) return {};
  const r = await db.sorgu<{ id: string; n: string }>(
    "SELECT format_id::text AS id, count(*)::text AS n FROM rapor WHERE format_id = ANY($1::uuid[]) AND silindi IS NULL GROUP BY format_id", [l]);
  return Object.fromEntries(r.rows.map((x) => [x.id, Number(x.n)]));
}
