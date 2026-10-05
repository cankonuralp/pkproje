/* PERSONEL ↔ MUHASEBE BAĞLANTISI (modül 18 → 2; 328 — maket muhasebe.html MV.ayMaliyet, MV.gunlukMaliyet: denetçi maliyeti ve genel gider payı).
   Muhasebe personel ve bordro tablolarına dokunmaz; buradan okur: kişiler (ad, başlama / ayrılma, denetçi mi — hesabında denetçi rolü) ve geçerli
   (kaldırılmamış) bordroların işverene maliyeti (KURUŞ). Maaşın kendisi (brüt / net) dönmez. Yetki ÇAĞIRANDA (muhasebe). */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";

export interface MaliyetKisisi { id: string; ad: string; basla: string; ayrildi: string | null; denetci: boolean }
export interface MaliyetBordrosu { personelId: string; ay: string; maliyet: number }

export async function personelMaliyetleri(db: Sorgulayici): Promise<{ kisiler: MaliyetKisisi[]; bordrolar: MaliyetBordrosu[] }> {
  const kisiler = (await db.sorgu<{ id: string; ad: string; basla: string; ayrildi: string | null; denetci: boolean }>(
    `SELECT p.id::text, p.ad, p.basla::text, p.ayrildi::text,
        EXISTS (SELECT 1 FROM hesap h WHERE h.firma_id = p.firma_id AND h.personel_id = p.id AND 'denetci' = ANY (h.roller)) AS denetci
     FROM personel p ORDER BY p.ad`)).rows;
  const bordrolar = (await db.sorgu<{ personel_id: string; ay: string; maliyet: string }>(
    "SELECT personel_id::text, ay, maliyet::text FROM bordro WHERE kaldirildi IS NULL")).rows
    .map((b) => ({ personelId: b.personel_id, ay: b.ay, maliyet: Math.round(Number(b.maliyet) * 100) }));
  return { kisiler, bordrolar };
}
