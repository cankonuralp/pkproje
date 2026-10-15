/* HATA KAYDI (567; göç 0093) — firma verisi değil: kaydeden yol havuzdan, kiracısız yazar (hata_yaz tanımlayıcı-yetkili; uygulama rolünün tabloya
   doğrudan hakkı yok). Okuyan yalnız yönetim (yonetimIcinde). pg yalnız src/server/db'de. */
import type { HazirHata } from "../hata/maske.ts";
import type { Havuz, Sorgulayici } from "./kiraci.ts";

/** yazıldıysa / aynı hatanın sayısı arttıysa true; sel sınırında false */
export async function hataYazDb(havuz: Havuz, h: HazirHata): Promise<boolean> {
  return (await havuz.query<{ y: boolean }>("SELECT hata_yaz($1, $2, $3, $4, $5, $6, $7::uuid, $8, $9) AS y",
    [h.kaynak, h.mesaj, h.yer, h.yigin, h.adres, h.alan, h.hesap, h.surum, h.cihaz])).rows[0].y;
}

export interface HataSatiri {
  id: string; kaynak: "istemci" | "sunucu"; mesaj: string; yer: string | null; yigin: string | null; adres: string | null; alan: string | null;
  oturumlu: boolean; surum: string | null; cihaz: string | null; sayi: number; ilk: string; son: string;
}
/** yönetim: en son görülen üstte, en çok `adet` (yönetim işleminde — yönetim rolü okur) */
export async function hataListesiDb(db: Sorgulayici, adet: number): Promise<HataSatiri[]> {
  return (await db.sorgu<Omit<HataSatiri, "ilk" | "son"> & { ilk: Date; son: Date }>(
    `SELECT id::text, kaynak, mesaj, yer, yigin, adres, alan, hesap IS NOT NULL AS oturumlu, surum, cihaz, sayi, ilk, son
     FROM hata_kaydi ORDER BY son DESC, id DESC LIMIT $1`, [Math.min(Math.max(1, adet), 500)])).rows
    .map((r) => ({ ...r, ilk: r.ilk.toISOString(), son: r.son.toISOString() }));
}
