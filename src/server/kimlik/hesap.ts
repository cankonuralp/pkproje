/* GİRİŞ HESABI — personele bağlı (karar 33). Modüller hesap tablosuna doğrudan dokunmaz; buradan okur / yazar (modül sınırı, CLAUDE.md §2).
   Yazmalar denetim izine düşer; rol / durum / parola değişince açık oturumlar 0002 tetiğiyle düşer. */
import type { Sorgulayici } from "../db/kiraci.ts";
import { izYaz } from "../db/yazici.ts";
import type { Rol } from "../yetki/tanim.ts";

export interface HesapOzeti { id: string; personelId: string; eposta: string; durum: "ilk" | "etkin" | "pasif"; roller: Rol[]; sonGiris: Date | null; olustu: Date }

/** personellerin hesapları (liste ve kart için; parola özeti ve kilit bilgisi DÖNMEZ) */
export async function personelHesaplari(db: Sorgulayici, personelIdleri: readonly string[]): Promise<Map<string, HesapOzeti>> {
  if (!personelIdleri.length) return new Map();
  const r = await db.sorgu<{ id: string; personel_id: string; eposta: string; durum: HesapOzeti["durum"]; roller: Rol[]; son: Date | null; olustu: Date }>(
    `SELECT h.id::text, h.personel_id::text, h.eposta, h.durum, h.roller, h.olustu,
            (SELECT max(d.zaman) FROM denetim_izi d WHERE d.ne = 'giris.yapildi' AND d.nesne = 'hesap' AND d.nesne_id = h.id::text) AS son
     FROM hesap h WHERE h.personel_id = ANY($1::uuid[])`, [personelIdleri]);
  return new Map(r.rows.map((x) => [x.personel_id, { id: x.id, personelId: x.personel_id, eposta: x.eposta, durum: x.durum, roller: x.roller, sonGiris: x.son, olustu: x.olustu }]));
}

/** belli roldeki AÇIK (ilk / etkin) hesaplar, personeliyle — Planlar'ın denetçi adayları için (Personel üzerinden; yetki ÇAĞIRANDA) */
export async function roldekiHesaplar(db: Sorgulayici, rol: Rol): Promise<{ id: string; personelId: string; durum: "ilk" | "etkin" }[]> {
  return (await db.sorgu<{ id: string; personel_id: string; durum: "ilk" | "etkin" }>(
    "SELECT id::text, personel_id::text, durum FROM hesap WHERE personel_id IS NOT NULL AND durum <> 'pasif' AND $1 = ANY (roller)", [rol])).rows
    .map((x) => ({ id: x.id, personelId: x.personel_id, durum: x.durum }));
}

/** belli roldeki ETKİN hesapların adları — Raporlar'ın "Onaya gönderildi: <yönetici>" bildirimi için (yetki ÇAĞIRANDA) */
export async function roldekiHesapAdlari(db: Sorgulayici, rol: Rol): Promise<string[]> {
  return (await db.sorgu<{ ad: string }>("SELECT ad FROM hesap WHERE durum = 'etkin' AND $1 = ANY (roller) ORDER BY ad", [rol])).rows.map((x) => x.ad);
}

/** hesapların görünen adları (kimlik → ad) — hareket kaydındaki "kim" için (Raporlar: geri gönderen, onaylayan). Yetki ÇAĞIRANDA. */
export async function hesapAdlari(db: Sorgulayici, idler: readonly (string | null)[]): Promise<Map<string, string>> {
  const l = [...new Set(idler.filter((x): x is string => !!x && /^[0-9a-f-]{36}$/.test(x)))];
  if (!l.length) return new Map();
  return new Map((await db.sorgu<{ id: string; ad: string }>("SELECT id::text, ad FROM hesap WHERE id = ANY ($1::uuid[])", [l])).rows.map((x) => [x.id, x.ad]));
}

/** 432: firmanın açık (ilk / etkin) hesaplarının adı ve e-postası — plan açarken bilgilendirme listesi önerisi (yetki ÇAĞIRANDA) */
export async function epostaRehberi(db: Sorgulayici): Promise<{ ad: string; eposta: string }[]> {
  return (await db.sorgu<{ ad: string; eposta: string }>("SELECT ad, eposta FROM hesap WHERE durum <> 'pasif' ORDER BY ad, eposta")).rows;
}

/** oturumdaki hesabın personel kaydı (yoksa null) — "kendi" düzeyi için */
export async function hesabinPersoneli(db: Sorgulayici, hesapId: string): Promise<string | null> {
  return (await db.sorgu<{ p: string | null }>("SELECT personel_id::text AS p FROM hesap WHERE id = $1", [hesapId])).rows[0]?.p ?? null;
}

/** personelin iş e-postası değişince giriş e-postası da değişir (aynı işlemde; çakışma hata olarak yukarı) */
export async function hesapEpostaEsitle(db: Sorgulayici, personelId: string, eposta: string, iz: { kim: string }): Promise<void> {
  const r = await db.sorgu<{ id: string; eski: string }>(
    "UPDATE hesap h SET eposta = $2, surum = surum + 1 FROM (SELECT id, eposta AS eski FROM hesap WHERE personel_id = $1) e WHERE h.id = e.id AND h.eposta <> $2 RETURNING h.id::text, e.eski",
    [personelId, eposta]);
  for (const x of r.rows) await izYaz(db, { ...iz, ne: "hesap.eposta", nesne: "hesap", nesneId: x.id, eski: { eposta: x.eski }, yeni: { eposta } });
}
