/* EKİPMAN ↔ ANA SAYFA BAĞLANTISI (332 — maket anasayfa.html "Kontrolü N gün içinde gelen tesisler": tesisin etkin ekipmanı ve sistem öncesi son
   kontrolü). Ana sayfa ekipman tablosuna dokunmaz; buradan okur. Yetki ÇAĞIRANDA. */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";

export async function etkinEkipmanlar(db: Sorgulayici): Promise<{ id: string; tesisId: string; turId: string; disKontrol: string | null }[]> {
  return (await db.sorgu<{ id: string; tesis_id: string; tur_id: string; dis_kontrol: string | null }>(
    "SELECT id::text, tesis_id::text, tur_id::text, dis_kontrol::text FROM ekipman WHERE pasif IS NULL")).rows
    .map((x) => ({ id: x.id, tesisId: x.tesis_id, turId: x.tur_id, disKontrol: x.dis_kontrol }));
}
