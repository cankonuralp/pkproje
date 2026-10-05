/* PLANLAR ↔ ANA SAYFA BAĞLANTISI (332 — maket anasayfa.html: denetçinin açık planları, planlamanın kabul bekleyen / reddedilen / bugün başlayan
   planları ve İSG-KATİP eksiği, kontrolü yaklaşan tesislerde açık plan yok mu). Ana sayfa plan tablolarına dokunmaz; buradan okur. Yetki ÇAĞIRANDA
   (Ana sayfa bölümleri rol ve modül düzeyiyle). */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { tesisIsgKayitlari } from "../../sozlesmeler/server/sozlesmeler.ts";
import { isgDurumu, type PlanDurumu } from "../sema.ts";

export interface AnaPlan { id: string; no: string; durum: PlanDurumu; tesisId: string; baslangic: string; ekip: string[] }
const ACIK: PlanDurumu[] = ["bekliyor", "kabul", "denetimde"];

/** planlar: açık olanlar (bekliyor, kabul, denetimde) ve reddedilenler; ekip personel kimlikleri */
export async function anaPlanlar(db: Sorgulayici): Promise<AnaPlan[]> {
  const p = (await db.sorgu<{ id: string; no: string; durum: PlanDurumu; tesis_id: string; baslangic: string }>(
    "SELECT id::text, no, durum, tesis_id::text, baslangic::text FROM plan WHERE durum = ANY ($1) ORDER BY baslangic, no", [[...ACIK, "reddedildi"]])).rows;
  const e = (await db.sorgu<{ plan_id: string; personel_id: string }>(
    "SELECT e.plan_id::text, e.personel_id::text FROM plan_ekip e JOIN plan p ON p.id = e.plan_id AND p.firma_id = e.firma_id WHERE p.durum = ANY ($1)", [ACIK])).rows;
  return p.map((x) => ({ id: x.id, no: x.no, durum: x.durum, tesisId: x.tesis_id, baslangic: x.baslangic, ekip: e.filter((y) => y.plan_id === x.id).map((y) => y.personel_id) }));
}
export const acikMi = (p: { durum: PlanDurumu }) => ACIK.includes(p.durum);

/** açık planlarda İSG-KATİP ID'si eksik (yok), geç onaylı ya da bitmiş ekip üyesi sayısı (el ile yazılan ID eksik sayılmaz) */
export async function isgEksikSayisi(db: Sorgulayici, planlar: readonly AnaPlan[]): Promise<number> {
  let n = 0;
  const acik = planlar.filter(acikMi);
  const ekip = new Map((await db.sorgu<{ plan_id: string; personel_id: string; isg_no: string | null; isg_id: string | null }>(
    "SELECT plan_id::text, personel_id::text, isg_no, isg_id::text FROM plan_ekip WHERE plan_id = ANY ($1::uuid[])", [acik.map((p) => p.id)])).rows
    .map((x) => [`${x.plan_id}|${x.personel_id}`, x]));
  const kayit = new Map<string, Awaited<ReturnType<typeof tesisIsgKayitlari>>>();
  for (const p of acik) {
    if (!kayit.has(p.tesisId)) kayit.set(p.tesisId, await tesisIsgKayitlari(db, p.tesisId));
    for (const k of p.ekip) {
      const e = ekip.get(`${p.id}|${k}`);
      const d = isgDurumu(e?.isg_id ? kayit.get(p.tesisId)!.find((x) => x.id === e.isg_id) : undefined, e?.isg_no ?? null, p.baslangic);
      if (d.tur === "yok" || d.tur === "gec" || d.tur === "bitti") n++;
    }
  }
  return n;
}
