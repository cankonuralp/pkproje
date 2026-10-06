/* EĞİTİMLER ↔ FİRMA AYARLARI BAĞLANTISI (335; maket "Müşteriye açık personel belgeleri": eğitim türlerinin sertifikaları tür başına açılır).
   Firma ayarları eğitim tablolarına dokunmaz; buradan okur. Yetki ÇAĞIRANDA. */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";

export async function egitimTurAdlari(db: Sorgulayici): Promise<{ id: string; ad: string }[]> {
  return (await db.sorgu<{ id: string; ad: string }>("SELECT id::text, ad FROM egitim_turu")).rows.sort((a, b) => a.ad.localeCompare(b.ad, "tr"));
}
