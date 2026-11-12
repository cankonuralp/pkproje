/* PERSONEL ↔ TALEPLER BAĞLANTISI (modül 21 → 2; 330). Talepler personel tablosuna dokunmaz; buradan okur: kişinin adı. Yetki ÇAĞIRANDA.
   2026-11-12 (reisim: "kısıtlamaları kaldır … onun hesabını o yapsın"): yıllık izin hakkı (personel.izin_hak, herkese 14 gün) artık OKUNMUYOR —
   hak / kalan hesabı kalktı; sütun veritabanında duruyor, kullanılmıyor. */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";

export async function izinKisileri(db: Sorgulayici, idler: readonly string[]): Promise<Map<string, string>> {
  const l = [...new Set(idler)];
  if (!l.length) return new Map();
  return new Map((await db.sorgu<{ id: string; ad: string }>("SELECT id::text, ad FROM personel WHERE id = ANY ($1::uuid[])", [l])).rows.map((x) => [x.id, x.ad]));
}
