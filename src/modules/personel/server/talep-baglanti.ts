/* PERSONEL ↔ TALEPLER BAĞLANTISI (modül 21 → 2; 330 — maket MV.IZIN_HAK: yıllık izin hakkı personel kaydında, başlangıç 14 gün). Talepler
   personel tablosuna dokunmaz; buradan okur: ad ve yıllık izin hakkı (gün). Yetki ÇAĞIRANDA. */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";

export async function izinHaklari(db: Sorgulayici, idler: readonly string[]): Promise<Map<string, { ad: string; hak: number }>> {
  const l = [...new Set(idler.filter((x) => /^[0-9a-f-]{36}$/.test(x)))];
  if (!l.length) return new Map();
  return new Map((await db.sorgu<{ id: string; ad: string; izin_hak: number }>("SELECT id::text, ad, izin_hak FROM personel WHERE id = ANY ($1::uuid[])", [l])).rows
    .map((x) => [x.id, { ad: x.ad, hak: x.izin_hak }]));
}
