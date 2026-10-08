/* S.A.Y SOHBET GEÇMİŞİ (380; göç 0071 yz_sohbet) — kişinin kendi geçmişi (RLS: firma + hesap), kalıcı (reisim 2026-10-03: "geçmiş silinmez, geçmiş
   olayı önemli"). Yazma ve temizleme tanımlayıcı-yetkili işlevlerle (uygulama rolünün tabloya yazma / silme hakkı yok; kişi işlemin bağlamından);
   kişi başı en yeni 200 ileti. Çekirdek: modül (src/modules/say) buradan çağırır. */
import type { Sorgulayici } from "../db/kiraci.ts";

/** kuralla cevaplanan "Beni ne bekliyor?" satırı (yalnız modül adı ve sayılar — kişi / müşteri bilgisi yok) */
export interface SohbetBekleyen { ad: string; href: string; kirmizi: number; sari: number; kirmiziAd: string; sariAd: string }
export interface SohbetEki { bekleyen?: SohbetBekleyen[] }
export interface SohbetIletisi { id: string; kim: "ben" | "say"; metin: string; yer: string; ek: SohbetEki | null; zaman: string }

export const GECMIS_ADET = 100;

/** son `adet` ileti, eskiden yeniye */
export async function sohbetGecmisi(db: Sorgulayici, adet = GECMIS_ADET): Promise<SohbetIletisi[]> {
  return (await db.sorgu<SohbetIletisi>(
    `SELECT id::text, kim, metin, yer, ek, to_char(zaman AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS zaman FROM (
       SELECT * FROM yz_sohbet ORDER BY zaman DESC, id DESC LIMIT $1) x ORDER BY zaman, id`, [adet])).rows;
}

export async function sohbetYaz(db: Sorgulayici, m: { kim: "ben" | "say"; metin: string; yer: string; ek?: SohbetEki | null }): Promise<string> {
  return (await db.sorgu<{ i: string }>("SELECT yz_sohbet_yaz($1, $2, $3, $4::jsonb)::text AS i",
    [m.kim, m.metin, m.yer, m.ek ? JSON.stringify(m.ek) : null])).rows[0].i;
}

/** yalnız oturumdaki kişinin geçmişi; dönen: silinen ileti sayısı */
export async function sohbetTemizle(db: Sorgulayici): Promise<number> {
  return (await db.sorgu<{ n: number }>("SELECT yz_sohbet_temizle() AS n")).rows[0].n;
}
