/* EKİPMAN — tesisin KALICI ekipman kaydı (modül 7; ayrı ekran değil, planın içinde — reisim 2026-09-26; göç 0023). Kod firmada eşsiz, eski kod
   başkasına verilmez (veritabanı). Bu modül öteki modüllere OKUMA açar: Plan aç özeti (tür başına sayı, "kontrolü geliyor"), plan içi listesi.
   Ekle / pasife al / kod değiştir planın içinde (Planlar kalemi) bu modülün işlevleriyle yazılır. */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export interface EkipmanOzeti {
  id: string; kod: string; turId: string; konum: string | null; seri: string | null;
  /** sistem öncesi son kontrol (Excel'den); sistemdeki son rapor Raporlar kalemiyle eklenir */
  disKontrol: string | null; disSonuc: string | null; pasif: boolean;
}

/** tesisin ekipmanları (pasifler dahil, işaretli). Yetki ÇAĞIRANDA. */
export async function tesisEkipmanlari(db: Sorgulayici, tesisId: string): Promise<EkipmanOzeti[]> {
  if (!UUID.test(tesisId)) return [];
  return (await db.sorgu<{ id: string; kod: string; tur_id: string; konum: string | null; seri: string | null; dis_kontrol: string | null; dis_sonuc: string | null; pasif: Date | null }>(
    "SELECT id::text, kod, tur_id::text, konum, seri, dis_kontrol::text, dis_sonuc, pasif FROM ekipman WHERE tesis_id = $1 ORDER BY kod", [tesisId])).rows
    .map((x) => ({ id: x.id, kod: x.kod, turId: x.tur_id, konum: x.konum, seri: x.seri, disKontrol: x.dis_kontrol, disSonuc: x.dis_sonuc, pasif: !!x.pasif }));
}
