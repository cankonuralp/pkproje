/* RAPORLAR ↔ PLANLAR BAĞLANTISI — Planlar modülünün rapor tablosundan istediği her şey yalnız buradan (modül 14; göç 0025). Bu dosya Planlar'ı
   İÇE AKTARMAZ (raporlar.ts Planlar'ı aktarır; döngü olmasın). Yetki ÇAĞIRANDA (plan içi: planı görebilen). */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { guncelle, tablo, type Iz } from "../../../server/db/yazici.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const KUNYE = tablo({ ad: "rapor", sutunlar: ["kunye", "kunye_surum"] });

export type RaporDurumu = "taslak" | "onayda" | "onaylandi" | "imzada" | "imzali";
export interface PlanRaporu {
  id: string; no: string; ekipmanId: string; turId: string; durum: RaporDurumu; sonuc: "uygun" | "uygun_degil" | null; olustu: string; personelId: string; hesapId: string | null;
  /** satır sürümü (plan içinden Sil, sürüm kilidiyle) */
  surum: number;
}

/** planın etkin raporları (silinen görünmez), en yeni üstte */
export async function planRaporlari(db: Sorgulayici, planId: string): Promise<PlanRaporu[]> {
  if (!UUID.test(planId)) return [];
  return (await db.sorgu<{ id: string; no: string; ekipman_id: string; tur_id: string; durum: RaporDurumu; sonuc: "uygun" | "uygun_degil" | null; olustu: Date; personel_id: string; hesap_id: string | null; surum: number }>(
    `SELECT id::text, no, ekipman_id::text, tur_id::text, durum, sonuc, olustu, personel_id::text, hesap_id::text, surum FROM rapor
     WHERE plan_id = $1 AND silindi IS NULL ORDER BY olustu DESC, no DESC`, [planId])).rows
    .map((r) => ({ id: r.id, no: r.no, ekipmanId: r.ekipman_id, turId: r.tur_id, durum: r.durum, sonuc: r.sonuc, olustu: r.olustu.toISOString(), personelId: r.personel_id, hesapId: r.hesap_id, surum: r.surum }));
}

/** ekipmanın bu planda etkin raporu var mı (raporu olan ekipman pasife alınmaz — 203) */
export async function ekipmanRaporuVar(db: Sorgulayici, planId: string, ekipmanId: string): Promise<boolean> {
  if (!UUID.test(planId) || !UUID.test(ekipmanId)) return false;
  return !!(await db.sorgu("SELECT 1 FROM rapor WHERE plan_id = $1 AND ekipman_id = $2 AND silindi IS NULL", [planId, ekipmanId])).rowCount;
}

/** denetçi plan künyesinde Güncelle'ye basınca yeni künye YALNIZ kendi Yeni raporlarına geçer (§3.4); onaydaki / imzalı rapor ve başkasının raporu
    değişmez. E-posta ve telefon raporun kendi kopyasında kalır. */
export async function raporKunyeleriniYaz(db: Sorgulayici, iz: Iz, planId: string, personelId: string,
  kunye: { firma_adi: string; adres: string | null; sgk: string | null; isg_no: string | null }, kunyeSurum: number): Promise<number> {
  const l = (await db.sorgu<{ id: string; surum: number; kunye: Record<string, unknown> }>(
    "SELECT id::text, surum, kunye FROM rapor WHERE plan_id = $1 AND personel_id = $2 AND durum = 'taslak' AND silindi IS NULL FOR UPDATE", [planId, personelId])).rows;
  for (const r of l) {
    const x = await guncelle(db, KUNYE, r.id, r.surum, { kunye: { ...r.kunye, ...kunye }, kunye_surum: kunyeSurum }, iz);
    if (x.durum === "cakisma" || x.durum === "yok") throw new Error(`rapor künyesi yazılamadı: ${x.durum}`);
  }
  return l.length;
}
