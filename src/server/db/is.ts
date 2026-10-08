/* ARKA PLAN İŞİ KAYDI (378; 0069 is_calisma) — kiracı bağlamı gerekmeyen üç çağrı: iş başlat / bitir, gece işinin firma listesi. Uygulama rolüyle;
   tabloya doğrudan erişim yok, tanımlayıcı-yetkili işlevlerle. Firma verisi yok (liste yalnız kimlik). pg yalnız src/server/db'de. */
import type { Havuz } from "./kiraci.ts";

/** işi başlatır; aynı iş zaten çalışıyorsa null (ikinci koşu yok) */
export async function isBasla(havuz: Havuz, ad: string): Promise<string | null> {
  return (await havuz.query<{ i: string | null }>("SELECT is_basla($1)::text AS i", [ad])).rows[0].i;
}

/** işi bitirir; özet sayılar ve kodlar (390: okunamayan duyuru kaynaklarının kodu) — kişi / firma verisi yazılmaz */
export async function isBitir(havuz: Havuz, id: string, durum: "tamam" | "hata", ozet: Record<string, number | string | readonly string[]>): Promise<void> {
  await havuz.query("SELECT is_bitir($1, $2, $3::jsonb)", [id, durum, JSON.stringify(ozet)]);
}

/** gece işinin firmaları: yalnız etkin firmaların kimliği (dondurulmuşa iş dokunmaz — 09-E6) */
export async function geceFirmalari(havuz: Havuz): Promise<string[]> {
  return (await havuz.query<{ id: string }>("SELECT id::text AS id FROM gece_firmalari() AS id")).rows.map((r) => r.id);
}
