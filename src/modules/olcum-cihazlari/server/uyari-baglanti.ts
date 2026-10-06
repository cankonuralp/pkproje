/* ÖLÇÜM CİHAZLARI ↔ UYARILAR BAĞLANTISI (modül 20 → 8; 331 — maket MV.uyarilar "kal": kalibrasyonu geçen ya da eşik içinde biten cihaz; kalibrasyondaki
   (lab) ve pasif cihaz sayılmaz). Uyarılar cihaz tablolarına dokunmaz; buradan okur. Eşik firma ayarı (uyari_esikleri.kalibrasyon). Yetki ÇAĞIRANDA. */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { ayarOku } from "../../../server/ayar/ayar.ts";
import { kalDurum } from "../sema.ts";
import { GECERLI_BITIS } from "./cihazlar.ts";

export interface CihazUyarisi { id: string; kod: string; tur: string; turId: string; bitis: string | null; durum: "gecti" | "yakin" }
export async function cihazUyarilari(db: Sorgulayici, bugun: string): Promise<{ l: CihazUyarisi[]; esik: number }> {
  const esik = (await ayarOku(db, "uyari_esikleri")).deger.kalibrasyon;
  const l = (await db.sorgu<{ id: string; kod: string; tur: string; tur_id: string; konum: string; bitis: string | null }>(
    `SELECT c.id::text, c.kod, t.ad AS tur, c.tur_id::text, c.konum, (${GECERLI_BITIS})::text AS bitis
     FROM olcum_cihazi c JOIN cihaz_turu t ON t.id = c.tur_id AND t.firma_id = c.firma_id WHERE c.pasif IS NULL`)).rows;
  return { esik, l: l.flatMap((x) => { const d = kalDurum(x.bitis, x.konum, bugun, esik); return d === "gecti" || d === "yakin" ? [{ id: x.id, kod: x.kod, tur: x.tur, turId: x.tur_id, bitis: x.bitis, durum: d }] : []; }) };
}
