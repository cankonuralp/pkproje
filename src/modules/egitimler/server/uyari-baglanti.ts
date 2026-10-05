/* EĞİTİMLER ↔ UYARILAR BAĞLANTISI (modül 20 → 10; 331 — maket MV.uyarilar "egt": tekrarı geçen ya da eşik içinde gelen GÜNCEL eğitim kaydı; önceki
   kayıt sayılmaz). Uyarılar eğitim tablolarına dokunmaz; buradan okur. Eşik firma ayarı (uyari_esikleri.egitim). Yetki ÇAĞIRANDA. */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { ayarOku } from "../../../server/ayar/ayar.ts";
import { egitimDurumu } from "../sema.ts";

export interface EgitimUyarisi { id: string; personelId: string; tur: string; tekrar: string; durum: "gecti" | "yakin" }
export async function egitimUyarilari(db: Sorgulayici, bugun: string): Promise<{ l: EgitimUyarisi[]; esik: number }> {
  const esik = (await ayarOku(db, "uyari_esikleri")).deger.egitim;
  const l = (await db.sorgu<{ id: string; personel_id: string; tur: string; tekrar: string }>(
    `SELECT k.id::text, k.personel_id::text, t.ad AS tur, k.tekrar::text FROM egitim_kaydi k JOIN egitim_turu t ON t.id = k.tur_id AND t.firma_id = k.firma_id
     WHERE NOT k.onceki`)).rows;
  return { esik, l: l.flatMap((x) => { const d = egitimDurumu(x.tekrar, bugun, esik); return d === "gecti" || d === "yakin" ? [{ id: x.id, personelId: x.personel_id, tur: x.tur, tekrar: x.tekrar, durum: d }] : []; }) };
}
