/* TEK SEFERLİK İŞLEM (392; 09-D2, ARKA-UC §4.3, göç 0076) — çevrimdışı kuyruktan gelen iş, cihazın ürettiği kimlikle BİR KEZ uygulanır: işin
   kendisi ve sonucu aynı veritabanı işleminde yazılır (iş düşerse sonuç da yazılmaz, cihaz yeniden dener). Aynı kimlik yeniden gelirse saklanan
   sonuç döner, iş tekrar yapılmaz. Aynı kimlik aynı anda iki istekte gelirse ikincisi birincinin bitmesini bekler (kimliğe danışma kilidi),
   sonra saklanan sonucu görür. Kimlik bu firmada başka kişinin işleminde kullanılmışsa ya da aynı kimlikle başka iş gelirse iş yapılmaz. */
import type { Sorgulayici } from "../db/kiraci.ts";

export interface IslemKimligi {
  /** cihazın ürettiği kimlik (uuid) */
  id: string;
  /** "rapor.kaydet" gibi */
  tur: string;
  /** işin kaydı (ör. rapor kimliği) */
  kayit: string;
  /** işin cihazda yapıldığı an (ISO; cihaz saati — yalnız kayıt için, resmî alanlar sunucu saatinden) */
  zaman: string | null;
}

export type TekSeferlikSonuc<S> =
  | { durum: "yeni"; sonuc: S }
  | { durum: "tekrar"; sonuc: S }
  /** kimlik başka kişinin ya da başka işin — iş yapılmadı */
  | { durum: "kimlik_kullanildi" };

/** oturumdaki firma + hesap işleminde (oturumIslemi) çağrılır */
export async function tekSeferlik<S extends object>(db: Sorgulayici, k: IslemKimligi, uygula: () => Promise<S>): Promise<TekSeferlikSonuc<S>> {
  await db.sorgu("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", [`islem:${k.id}`]);
  if ((await db.sorgu<{ v: boolean }>("SELECT islem_kimlik_baskasinda($1) AS v", [k.id])).rows[0].v) return { durum: "kimlik_kullanildi" };
  const once = (await db.sorgu<{ sonuc: S; tur: string; kayit_id: string }>("SELECT sonuc, tur, kayit_id::text FROM islem WHERE id = $1", [k.id])).rows[0];
  if (once) return once.tur === k.tur && once.kayit_id === k.kayit ? { durum: "tekrar", sonuc: once.sonuc } : { durum: "kimlik_kullanildi" };
  const sonuc = await uygula();
  await db.sorgu("INSERT INTO islem (id, tur, kayit_id, cihaz_zamani, sonuc) VALUES ($1, $2, $3, $4, $5::jsonb)",
    [k.id, k.tur, k.kayit, k.zaman, JSON.stringify(sonuc)]);
  return { durum: "yeni", sonuc };
}
