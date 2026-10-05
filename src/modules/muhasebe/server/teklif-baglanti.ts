/* MUHASEBE ↔ TEKLİFLER BAĞLANTISI (modül 11 → 18; 324–327 incelemesi). Teklifler fatura tablolarına dokunmaz; faturalanmış raporların kayıt
   anında yazılan bağını (teklif, birim fiyat, kaynak) buradan okur — faturalı raporun bağı sonradan kabul edilen teklife kaymaz, kalem adedini
   faturadaki "teklif" satırları tüketir. Yetki ÇAĞIRANDA. */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
export interface FaturaliRapor { teklifId: string | null; fiyat: number; kaynak: "teklif" | "disi" | "liste" }

/** rapor kimliği → faturadaki bağ (yalnız faturalanmış raporlar) */
export async function faturaliRaporlar(db: Sorgulayici, raporlar: readonly string[]): Promise<Map<string, FaturaliRapor>> {
  const l = [...new Set(raporlar.filter((x) => UUID.test(x)))];
  if (!l.length) return new Map();
  return new Map((await db.sorgu<{ rapor_id: string; teklif_id: string | null; fiyat: string; kaynak: FaturaliRapor["kaynak"] }>(
    "SELECT rapor_id::text, teklif_id::text, fiyat::text, kaynak FROM fatura_rapor WHERE rapor_id = ANY ($1::uuid[])", [l])).rows
    .map((x) => [x.rapor_id, { teklifId: x.teklif_id, fiyat: Number(x.fiyat), kaynak: x.kaynak }]));
}
