/* RAPORLAR ↔ MUHASEBE BAĞLANTISI (modül 18 → 14; 327; maket muhasebe.html iş sayfası "Raporlar": rapor no, ekipman, birim fiyat, fatura, rapor
   durumu). Muhasebe rapor tablolarına dokunmaz; planların silinmemiş raporlarını buradan okur: görünen numara, ekipman, tür, durum, açılış günü,
   imzalı mı ve İLK imza günü (fatura tarihi bundan önce olamaz — veritabanı da denetler, 0039). planlar boşsa (null) bütün raporlar. Yetki ÇAĞIRANDA. */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { gorunenNo, type RaporDurumu } from "../sema.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export interface MuhasebeRaporu {
  id: string; no: string; planId: string; ekipmanId: string; turId: string; personelId: string; durum: RaporDurumu;
  /** açılış günü (Türkiye takvimi) */
  gun: string;
  /** ilk imzalı sürümün imza günü; imzasızsa null */
  imzaGunu: string | null;
}

export async function muhasebeRaporlari(db: Sorgulayici, planlar: readonly string[] | null): Promise<MuhasebeRaporu[]> {
  const l = planlar === null ? null : [...new Set(planlar.filter((x) => UUID.test(x)))];
  if (l !== null && !l.length) return [];
  return (await db.sorgu<{ id: string; no: string; revizyon: number; plan_id: string; ekipman_id: string; tur_id: string; personel_id: string; durum: RaporDurumu;
    gun: string; imza_gunu: string | null }>(
    `SELECT r.id::text, r.no, r.revizyon, r.plan_id::text, r.ekipman_id::text, r.tur_id::text, r.personel_id::text, r.durum,
        (r.olustu AT TIME ZONE 'Europe/Istanbul')::date::text AS gun,
        (SELECT min((s.imzalandi AT TIME ZONE 'Europe/Istanbul')::date)::text FROM rapor_surumu s WHERE s.firma_id = r.firma_id AND s.rapor_id = r.id) AS imza_gunu
     FROM rapor r WHERE r.silindi IS NULL${l ? " AND r.plan_id = ANY ($1::uuid[])" : ""} ORDER BY r.olustu, r.no`, l ? [l] : [])).rows
    .map((x) => ({ id: x.id, no: gorunenNo(x.no, x.revizyon), planId: x.plan_id, ekipmanId: x.ekipman_id, turId: x.tur_id, personelId: x.personel_id, durum: x.durum,
      gun: x.gun, imzaGunu: x.imza_gunu }));
}
