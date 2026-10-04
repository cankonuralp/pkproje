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
