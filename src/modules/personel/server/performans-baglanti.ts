/* PERSONEL ↔ PERFORMANS BAĞLANTISI (modül 19 → 2; 329 — maket performans.html KISILER: denetçi rolündeki personel; meslek ve branş). Performans
   personel ve hesap tablolarına dokunmaz; buradan okur: ad, meslek (görünen ad), mesleğin branşı, çalışıyor mu, hesabında denetçi rolü var mı.
   E-posta, telefon, mesleki numaralar DÖNMEZ. Yetki ÇAĞIRANDA (Performans). */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { meslek } from "../sema.ts";

export interface PerformansKisisi { id: string; ad: string; meslek: string; brans: "m" | "e" | null; etkin: boolean; denetci: boolean }

export async function performansKisileri(db: Sorgulayici): Promise<PerformansKisisi[]> {
  return (await db.sorgu<{ id: string; ad: string; meslek: string; meslek_metin: string | null; durum: string; denetci: boolean }>(
    `SELECT p.id::text, p.ad, p.meslek, p.meslek_metin, p.durum,
        EXISTS (SELECT 1 FROM hesap h WHERE h.firma_id = p.firma_id AND h.personel_id = p.id AND 'denetci' = ANY (h.roller)) AS denetci
     FROM personel p`)).rows
    .map((p) => {
      const m = meslek(p.meslek);
      return { id: p.id, ad: p.ad, meslek: p.meslek === "diger" ? p.meslek_metin ?? "Diğer meslek" : m?.ad ?? "—", brans: (m?.b as "m" | "e" | null | undefined) ?? null,
        etkin: p.durum === "etkin", denetci: p.denetci };
    })
    .sort((a, b) => a.ad.localeCompare(b.ad, "tr"));
}
