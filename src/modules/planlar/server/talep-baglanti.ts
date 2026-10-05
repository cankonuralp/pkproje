/* PLANLAR ↔ TALEPLER BAĞLANTISI (modül 21 → 13; 330 — maket talepler.html "işlerim: ekibinde olduğum planlar, en yeni üstte"; masraf bir işe
   bağlanabilir, bağlanmazsa genel). Talepler plan tablolarına dokunmaz; kişinin ekibinde olduğu, başlamış (bugün ya da önce), reddedilmemiş
   planları buradan okur: proje no, tesis, başlangıç. Yetki ÇAĞIRANDA. */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";

export interface TalepPlani { id: string; no: string; tesisId: string; baslangic: string }

export async function personelinPlanlari(db: Sorgulayici, personelId: string, bugun: string, enCok = 12): Promise<TalepPlani[]> {
  if (!/^[0-9a-f-]{36}$/.test(personelId) || !/^\d{4}-\d{2}-\d{2}$/.test(bugun)) return [];
  return (await db.sorgu<{ id: string; no: string; tesis_id: string; baslangic: string }>(
    `SELECT p.id::text, p.no, p.tesis_id::text, p.baslangic::text FROM plan p
     WHERE p.durum <> 'reddedildi' AND p.baslangic <= $2::date
       AND EXISTS (SELECT 1 FROM plan_ekip k WHERE k.firma_id = p.firma_id AND k.plan_id = p.id AND k.personel_id = $1)
     ORDER BY p.baslangic DESC, p.no DESC LIMIT $3`, [personelId, bugun, Math.min(Math.max(enCok, 1), 50)])).rows
    .map((x) => ({ id: x.id, no: x.no, tesisId: x.tesis_id, baslangic: x.baslangic }));
}
