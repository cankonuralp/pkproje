/* ÇEVRİMDIŞI KUYRUKTAN GELEN PLAN İŞLERİ (400; ARKA-UC §4.1 "plan kabul / red (kuyruğa)", maket Z4) — /api/islem buradan çağırır. İş modülün kendi
   işlevidir (yetki: plan ekibinde olmak, durum "kabul bekliyor", sürüm kilidi, denetim izi aynen; bağlantılıyken düğmenin yaptığıyla aynı):
   · kabul: tarafsızlık beyanı CİHAZDA okunup onaylanmış olmalı (onay istemciden "evet" olarak gelmezse kabul yok) ve beyanın metni okunduğundan
     beri değişmemiş olmalı (değiştiyse red — yeni metin okunur);
   · red: gerekçe zorunlu (değişmez);
   · cihazın gördüğü sürüm eskiyse "cakisma" (sessiz ezme yok — 09-D1). */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { z } from "../../../sema/ortak.ts";
import { planKabul, planReddet, type PlanYazma } from "./plan-ici.ts";
import type { Kisi } from "./planlar.ts";

export const PLAN_ISLEM_TURLERI = ["plan.kabul", "plan.red"] as const;
export type PlanIslemTuru = (typeof PLAN_ISLEM_TURLERI)[number];
export const planIslemTuruMu = (t: string): t is PlanIslemTuru => (PLAN_ISLEM_TURLERI as readonly string[]).includes(t);

const KabulGirdisi = z.object({ beyanOnay: z.literal(true), beyanOzet: z.string().min(1).max(64) });

/** çakışmada cihaza planın güncel sürümü ("benimkini yaz" seçilirse iş bununla YENİ kimlikle gider); silinmiş planda null */
export async function planGuncelSurum(db: Sorgulayici, plan: string): Promise<number | null> {
  return (await db.sorgu<{ surum: number }>("SELECT surum FROM plan WHERE id = $1", [plan])).rows[0]?.surum ?? null;
}

export async function planIslemi(db: Sorgulayici, kim: Kisi, tur: PlanIslemTuru, plan: string, surum: number, girdi: unknown): Promise<PlanYazma> {
  if (tur === "plan.red") return planReddet(db, kim, plan, surum, girdi);
  const g = KabulGirdisi.safeParse(girdi);
  if (!g.success) return { durum: "gecersiz", hatalar: { beyan: "Tarafsızlık beyanı okunup onaylanmadan plan kabul edilemez." } };
  return planKabul(db, kim, plan, surum, g.data.beyanOnay, g.data.beyanOzet);
}
