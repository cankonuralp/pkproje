/* RAPORLAR ↔ TEKLİFLER BAĞLANTISI (modül 11 → 14; pkproje §3.2 madde 5: "her rapor teklif kalemine bağlanır"; maket teklifler.html "Raporlanan").
   Kabul edilmiş teklifin tesislerinde, kabulden sonra imzalanan raporlar kaleme TÜRÜYLE bağlanır: tür başına imzalı rapor sayısı (raporun son
   imzalı sürümü; revizyon yeni rapor sayılmaz). Teklifler rapor tablolarına dokunmaz; yalnız bu işlevi çağırır. Yetki ÇAĞIRANDA. */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** tesislerde verilen günden (dahil) sonra imzalanan raporların tür başına sayısı */
export async function turBasinaImzaliRapor(db: Sorgulayici, tesisler: readonly string[], gun: string): Promise<Map<string, number>> {
  const l = tesisler.filter((x) => UUID.test(x));
  if (!l.length || !/^\d{4}-\d{2}-\d{2}$/.test(gun)) return new Map();
  const r = await db.sorgu<{ tur_id: string; n: number }>(
    `SELECT tur_id::text, count(DISTINCT rapor_id)::int AS n FROM rapor_surumu
     WHERE tesis_id = ANY ($1::uuid[]) AND revizyon = 0 AND (imzalandi AT TIME ZONE 'Europe/Istanbul')::date >= $2::date GROUP BY 1`, [l, gun]);
  return new Map(r.rows.map((x) => [x.tur_id, x.n]));
}
