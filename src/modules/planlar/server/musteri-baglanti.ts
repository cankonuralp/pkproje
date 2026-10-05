/* MÜŞTERİ PANELİNİN PLANA BAKTIĞI YER (modül 17 → 13; 0032). Müşteri paneli plan tablosuna dokunmaz: açık planları buradan okur.
   YALNIZ müşteri işleminde çağrılır (src/server/kimlik/istek.ts musteriIslemi → veritabanında probata_musteri): müşteri rolü planın yalnız tesis,
   tarih ve durum sütunlarını okuyabilir; hangi satırın döneceğine (kendi müşterisi, tesis kapsamı, açık plan) veritabanı politikası karar verir. */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";

export interface MusteriPlani { tesisId: string; baslangic: string; bitis: string; durum: "bekliyor" | "kabul" | "denetimde" }

/** müşterinin görebildiği açık planlar, en yakın başlangıç önce */
export async function musteriPlanlari(db: Sorgulayici): Promise<MusteriPlani[]> {
  return (await db.sorgu<{ tesis_id: string; baslangic: string; bitis: string; durum: MusteriPlani["durum"] }>(
    "SELECT tesis_id::text, baslangic::text, bitis::text, durum FROM plan ORDER BY baslangic, bitis")).rows
    .map((x) => ({ tesisId: x.tesis_id, baslangic: x.baslangic, bitis: x.bitis, durum: x.durum }));
}
