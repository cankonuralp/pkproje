/* ÇEVRİMDIŞI KUYRUKTAN GELEN RAPOR İŞLERİ (392; ARKA-UC §4.3, maket Z4: kuyruğa girenler rapor Kaydet ve Onaya gönder) — /api/islem buradan
   çağırır. İş modülün kendi işlevidir (yetki, ENGEL'ler, sürüm kilidi, denetim izi aynen; bağlantılıyken düğmenin yaptığıyla aynı): cihazın
   gördüğü sürüm başka yerde değiştiyse "cakisma" döner, sessiz ezme yok (09-D1). Girdi: cihazın gördüğü sürüm + formun o anki hâli. */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { onayaGonder, raporKaydet, type Kisi, type RaporYazma } from "./raporlar.ts";

export const RAPOR_ISLEM_TURLERI = ["rapor.kaydet", "rapor.gonder"] as const;
export type RaporIslemTuru = (typeof RAPOR_ISLEM_TURLERI)[number];

/** çakışmada cihaza raporun güncel sürümü: kullanıcı "benimkini yaz" derse iş bununla YENİ kimlikle gider (açık seçim). Çakışma yalnız raporu
    yazabilene döner (yetki işten önce denetlendi); silinmiş raporda null */
export async function raporGuncelSurum(db: Sorgulayici, rapor: string): Promise<number | null> {
  return (await db.sorgu<{ surum: number }>("SELECT surum FROM rapor WHERE id = $1 AND silindi IS NULL", [rapor])).rows[0]?.surum ?? null;
}

export function raporIslemi(db: Sorgulayici, kim: Kisi, tur: RaporIslemTuru, rapor: string, surum: number, girdi: unknown): Promise<RaporYazma> {
  return tur === "rapor.kaydet" ? raporKaydet(db, kim, rapor, surum, girdi) : onayaGonder(db, kim, rapor, surum, girdi);
}
