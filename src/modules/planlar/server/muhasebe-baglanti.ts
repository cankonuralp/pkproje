/* PLANLAR ↔ MUHASEBE BAĞLANTISI (modül 18 → 13; 327; maket muhasebe.html: "İŞ = plan (proje no)"). Muhasebe plan tablolarına dokunmaz;
   işlerin plan bilgisini buradan okur: proje no, tesis, başlangıç (denetim günü), durum, ekibin personeli. Yetki ÇAĞIRANDA. */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import type { PlanDurumu } from "../sema.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export interface MuhasebePlani { id: string; no: string; tesisId: string; baslangic: string; durum: PlanDurumu; ekip: string[] }

export async function muhasebePlanlari(db: Sorgulayici, idler: readonly string[]): Promise<MuhasebePlani[]> {
  const l = [...new Set(idler.filter((x) => UUID.test(x)))];
  if (!l.length) return [];
  return (await db.sorgu<{ id: string; no: string; tesis_id: string; baslangic: string; durum: PlanDurumu; ekip: string[] | null }>(
    `SELECT p.id::text, p.no, p.tesis_id::text, p.baslangic::text, p.durum,
        (SELECT array_agg(k.personel_id::text) FROM plan_ekip k WHERE k.firma_id = p.firma_id AND k.plan_id = p.id) AS ekip
     FROM plan p WHERE p.id = ANY ($1::uuid[])`, [l])).rows
    .map((x) => ({ id: x.id, no: x.no, tesisId: x.tesis_id, baslangic: x.baslangic, durum: x.durum, ekip: x.ekip ?? [] }));
}
