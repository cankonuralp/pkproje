/* DUYURULAR (379; göç 0070) — firma verisi değil: okuma işi yazar (havuzdan, kiracısız), Ana sayfa okur (kiracı işleminin içinden de olur —
   işlevler tanımlayıcı-yetkili). Uygulama rolünün tabloya doğrudan hakkı yok. pg yalnız src/server/db'de. */
import type { Havuz, Sorgulayici } from "./kiraci.ts";

export type DuyuruKaynagi = "isggm" | "isgum" | "isekipman";
export interface DuyuruSatiri { url: string; kaynak: DuyuruKaynagi; baslik: string; tarih: string }
/** guncellendi: en az bir kaynağı okunan son koşunun bitişi · hata: son okuma düştü / takıldı · son: son denemenin başlangıcı (ISO) */
export interface DuyuruDurumu { guncellendi: string | null; hata: boolean; son: string | null }

/** bir kaynağın okunan listesi; dönen: yeni eklenen sayısı */
export async function duyuruYaz(havuz: Havuz, kaynak: DuyuruKaynagi, liste: readonly { url: string; baslik: string; tarih: string }[]): Promise<number> {
  return (await havuz.query<{ n: number }>("SELECT duyuru_yaz($1, $2::jsonb) AS n", [kaynak, JSON.stringify(liste)])).rows[0].n;
}

/** kaynak başına en yeni `adet`, hepsi en yeni üstte */
export async function duyuruListesi(db: Sorgulayici, adet: number): Promise<DuyuruSatiri[]> {
  return (await db.sorgu<DuyuruSatiri>("SELECT url, kaynak, baslik, to_char(tarih, 'YYYY-MM-DD') AS tarih FROM duyuru_listesi($1)", [adet])).rows;
}

export async function duyuruDurumu(db: Sorgulayici): Promise<DuyuruDurumu> {
  return (await db.sorgu<{ d: DuyuruDurumu }>("SELECT duyuru_durumu() AS d")).rows[0].d;
}
