/* YAPAY ZEKÂ KULLANIMI (351; 0052) — kişi başı aylık maliyet (sınır firma ayarı "kişi başı aylık $"), okuma kaydı, firmada açık mı. Çekirdek: ham
   yazma burada (modül buradan çağırır). Hesap veritabanında işlemin bağlamından damgalanır (yz_koru); kullanım yalnız artar. */
import { ayarOku } from "../ayar/ayar.ts";
import { sirDurumu } from "../ayar/sir.ts";
import type { Sorgulayici } from "../db/kiraci.ts";
import type { OkunanSatir, YzModel } from "./okuma.ts";

const AY = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit" });
/** Türkiye saatiyle "YYYY-AA" */
export const yzAyi = (t = new Date()) => AY.format(t).slice(0, 7);

/** fotoğraftan okuma bu firmada kullanılabilir mi: firma ayarında açık VE API anahtarı girilmiş */
export async function yzHazirMi(db: Sorgulayici): Promise<boolean> {
  return (await ayarOku(db, "yapay_zeka")).deger.acik && (await sirDurumu(db, "yapay_zeka_anahtari")).tanimli;
}

/** kişinin bu ayki maliyeti (milyonda bir dolar) */
export async function yzAyMaliyeti(db: Sorgulayici, hesapId: string, ay: string): Promise<number> {
  return Number((await db.sorgu<{ m: string }>("SELECT maliyet::text AS m FROM yz_kullanim WHERE hesap_id = $1 AND ay = $2", [hesapId, ay])).rows[0]?.m ?? 0);
}

/** bir okuma: kişinin aylık kullanımı artar, okuma kaydedilir (aynı işlemde) */
export async function yzOkumaYaz(db: Sorgulayici, o: { ay: string; raporId: string; bolum: string; model: YzModel; oneri: OkunanSatir[]; giris: number; cikis: number; maliyet: number }): Promise<void> {
  await db.sorgu(
    `INSERT INTO yz_kullanim (ay, okuma, maliyet) VALUES ($1, 1, $2)
     ON CONFLICT (firma_id, hesap_id, ay) DO UPDATE SET okuma = yz_kullanim.okuma + 1, maliyet = yz_kullanim.maliyet + EXCLUDED.maliyet`, [o.ay, o.maliyet]);
  await db.sorgu("INSERT INTO yz_okuma (rapor_id, bolum, model, oneri, giris, cikis, maliyet) VALUES ($1, $2, $3, $4, $5, $6, $7)",
    [o.raporId, o.bolum, o.model, JSON.stringify(o.oneri), o.giris, o.cikis, o.maliyet]);
}
