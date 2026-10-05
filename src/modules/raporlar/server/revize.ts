/* REVİZE İSTEĞİ (318; göç 0029 rapor_revize_istegi — Raporlar modülünün tablosu; maket raporlar.html "Revize iste", onaylar.html "Revize
   istekleri"). Okuma ve yazma burada; yetki ÇAĞIRANDA (yazan: rapor_revize_iste · teknik yönetici: rapor_revizeye_gonder). Kim ve ne zaman,
   "yalnız yazan açar / geri çeker", "revize yalnız rapor revizeye gönderilince" kuralları veritabanında (tetik). */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { ekle, guncelle, tablo, type GuncelleSonucu, type Iz } from "../../../server/db/yazici.ts";

export const ISTEK = tablo({ ad: "rapor_revize_istegi", sutunlar: ["rapor_id", "revizyon", "gerekce", "durum", "kapanis_gerekce"] });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export interface RevizeIstegi { id: string; raporId: string; surum: number; zaman: string; gerekce: string; hesapId: string | null }
export interface RevizeRed { hesapId: string | null; zaman: string; gerekce: string | null }

interface Satir { id: string; rapor_id: string; surum: number; durum: string; olustu: Date; gerekce: string; hesap_id: string | null; kapatan_hesap: string | null; kapanis_gerekce: string | null; kapandi: Date | null }
const istek = (x: Satir): RevizeIstegi => ({ id: x.id, raporId: x.rapor_id, surum: x.surum, zaman: x.olustu.toISOString(), gerekce: x.gerekce, hesapId: x.hesap_id });
const SUTUN = "id::text, rapor_id::text, surum, durum, olustu, gerekce, hesap_id::text, kapatan_hesap::text, kapanis_gerekce, kapandi";

/** raporun bu revizyondaki son isteği: bekliyorsa istek, reddedildiyse ret (yazan raporunda görür); geri çekilen ya da yerine gelen iz bırakmaz */
export async function revizeDurumu(db: Sorgulayici, raporId: string, revizyon: number): Promise<{ bekleyen: RevizeIstegi | null; red: RevizeRed | null }> {
  if (!UUID.test(raporId)) return { bekleyen: null, red: null };
  const x = (await db.sorgu<Satir>(`SELECT ${SUTUN} FROM rapor_revize_istegi WHERE rapor_id = $1 AND revizyon = $2 ORDER BY olustu DESC LIMIT 1`, [raporId, revizyon])).rows[0];
  if (!x) return { bekleyen: null, red: null };
  return {
    bekleyen: x.durum === "bekliyor" ? istek(x) : null,
    red: x.durum === "reddedildi" ? { hesapId: x.kapatan_hesap, zaman: x.kapandi!.toISOString(), gerekce: x.kapanis_gerekce } : null,
  };
}

/** bekleyen bütün istekler (Onaylar "Revize istekleri"; Onaylar her raporu kendi görme kuralıyla süzer), en yeni üstte */
export async function bekleyenIstekler(db: Sorgulayici): Promise<RevizeIstegi[]> {
  return (await db.sorgu<Satir>(`SELECT ${SUTUN} FROM rapor_revize_istegi WHERE durum = 'bekliyor' ORDER BY olustu DESC`)).rows.map(istek);
}

/** istek açar (yazan; veritabanı da ister). Çağıran raporu kilitleyip bekleyen istek olmadığına bakar (rapor başına tek bekleyen — dizin de ister) */
export async function istekAc(db: Sorgulayici, iz: Iz, raporId: string, revizyon: number, gerekce: string): Promise<void> {
  await ekle(db, ISTEK, { rapor_id: raporId, revizyon, gerekce, durum: "bekliyor" }, iz);
}

/** isteği kapatır: yazan geri çeker · teknik yönetici reddeder (gerekçe isteğe bağlı). Yetki ÇAĞIRANDA; kim veritabanında damgalanır. */
export function istekKapat(db: Sorgulayici, iz: Iz, x: RevizeIstegi, durum: "geri_cekildi" | "reddedildi", gerekce: string | null): Promise<GuncelleSonucu> {
  return guncelle(db, ISTEK, x.id, x.surum, { durum, ...(durum === "reddedildi" ? { kapanis_gerekce: gerekce || null } : {}) }, iz);
}
