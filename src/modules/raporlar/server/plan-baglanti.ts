/* RAPORLAR ↔ PLANLAR BAĞLANTISI — Planlar modülünün rapor tablosundan istediği her şey yalnız buradan (modül 14; göç 0025). Bu dosya Planlar'ı
   İÇE AKTARMAZ (raporlar.ts Planlar'ı aktarır; döngü olmasın). Yetki ÇAĞIRANDA (plan içi: planı görebilen). */
import { gorunenNo } from "../sema.ts";
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { guncelle, tablo, type Iz } from "../../../server/db/yazici.ts";
import { ayarOku } from "../../../server/ayar/ayar.ts";
import { turSureleri } from "../../ekipman-turleri/server/turler.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const KUNYE = tablo({ ad: "rapor", sutunlar: ["kunye", "kunye_surum"] });

export type RaporDurumu = "taslak" | "onayda" | "onaylandi" | "imzada" | "imzali";
export interface PlanRaporu {
  /** no: görünen numara (revizyonda "-R1" ekiyle — 193) */
  id: string; no: string; revizyon: number; ekipmanId: string; turId: string; durum: RaporDurumu; sonuc: "uygun" | "uygun_degil" | null; olustu: string; personelId: string; hesapId: string | null;
  /** satır sürümü (plan içinden Sil, sürüm kilidiyle) */
  surum: number;
}

/** planın etkin raporları (silinen görünmez), en yeni üstte */
export async function planRaporlari(db: Sorgulayici, planId: string): Promise<PlanRaporu[]> {
  if (!UUID.test(planId)) return [];
  return (await db.sorgu<{ id: string; no: string; revizyon: number; ekipman_id: string; tur_id: string; durum: RaporDurumu; sonuc: "uygun" | "uygun_degil" | null; olustu: Date; personel_id: string; hesap_id: string | null; surum: number }>(
    `SELECT id::text, no, revizyon, ekipman_id::text, tur_id::text, durum, sonuc, olustu, personel_id::text, hesap_id::text, surum FROM rapor
     WHERE plan_id = $1 AND silindi IS NULL ORDER BY olustu DESC, no DESC`, [planId])).rows
    .map((r) => ({ id: r.id, no: gorunenNo(r.no, r.revizyon), revizyon: r.revizyon, ekipmanId: r.ekipman_id, turId: r.tur_id, durum: r.durum, sonuc: r.sonuc, olustu: r.olustu.toISOString(), personelId: r.personel_id, hesapId: r.hesap_id, surum: r.surum }));
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

/* ── MESAİ (212, AA2; KOD-GECIS ENGEL 3; maket MV.gunlukSure) ─────────────────────────────────────────────────────────
   Günlük süre = o gün (Türkiye) denetçinin silinmemiş raporlarının tür süreleri toplamı; rapor KONTROL GÜNÜNE sayılır (başlangıç tarihi — 429,
   reisim 2026-10-09: "Hangi güne rapor yazılırsa süreler o günden gitsin (480dk+mesai)"; önce açıldığı güne sayılıyordu). Hak = günlük mesai ile yıllık kalan fazla
   çalışmanın (yasal en çok 270 saat; firma ayarı) küçüğü, günlük üst sınırı (660 dk) aşmadan. Ayar açıkken toplam ≥ normal + hak olunca yeni
   rapor ve kopya açılmaz (reisim'in açık kararı: engel). Yıllık kullanılan: bu yılın önceki günlerinde normalin üstünde kalan süre (günlük
   mesai sınırıyla). Süresi tanımsız tür mesaiye sayılmaz. Raporlar ve Planlar buradan sorar (Planlar'ı içe aktarmaz). Yetki ÇAĞIRANDA. */
export interface MesaiDurumu { acik: boolean; normal: number; mesai: number; hak: number; toplam: number; dolu: boolean }
/** gun: hesaplanan gün (YYYY-AA-GG; yeni rapor için bugün, kontrol günü değişen rapor için yeni gün) · haric: sayılmayacak rapor (günü
    değişen raporun kendisi) */
export async function mesaiDurumu(db: Sorgulayici, personelId: string, gun: string, haric: string | null = null): Promise<MesaiDurumu> {
  const bugun = gun;
  const m = (await ayarOku(db, "mesai")).deger;
  if (!m.acik || !UUID.test(personelId)) return { acik: m.acik, normal: m.normal_dk, mesai: m.mesai_dk, hak: 0, toplam: 0, dolu: false };
  const yil = bugun.slice(0, 4);
  const l = (await db.sorgu<{ gun: string; tur_id: string }>(
    `SELECT (bas AT TIME ZONE 'Europe/Istanbul')::date::text AS gun, tur_id::text FROM rapor
     WHERE personel_id = $1 AND silindi IS NULL AND bas >= ($2 || '-01-01')::date - interval '1 day' AND ($3::uuid IS NULL OR id <> $3::uuid)`,
    [personelId, yil, haric && UUID.test(haric) ? haric : null])).rows;
  const sure = await turSureleri(db);
  const gunler = new Map<string, number>();
  for (const x of l) if (x.gun.startsWith(yil)) gunler.set(x.gun, (gunler.get(x.gun) ?? 0) + (sure.get(x.tur_id) ?? 0));
  let kullanilan = 0;
  for (const [g, t] of gunler) if (g < bugun) kullanilan += Math.min(Math.max(t - m.normal_dk, 0), m.mesai_dk);
  const hak = Math.max(0, Math.min(m.mesai_dk, m.yillik_fazla_saat * 60 - kullanilan, m.gunluk_ust_dk - m.normal_dk));
  const toplam = gunler.get(bugun) ?? 0;
  return { acik: true, normal: m.normal_dk, mesai: m.mesai_dk, hak, toplam, dolu: toplam >= m.normal_dk + hak };
}
