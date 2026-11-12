/* KONTROL KAYDI (2026-11-12, göç 0128; pkproje.md §11 K2, K3, K11 — reisim: "yazılan süre ile ekipman başında geçirilen süre uymalı log kayıtları
   düzgün olmalı", "ara verme olmasın"): TÜRKAK'lı firmada kontrol saati yazılmaz, ÖLÇÜLÜR. Süre rapora değil sahadaki kayda bağlı (plan + ekipman +
   kişi; takip muayenesi ayrı kayıt) — rapor saatini buradan alır. Saat veritabanından (kontrol_koru: now()), ölçülen değer bir kez yazılır ve değişmez;
   elle düzeltme ayrı alanlarda, gerekçeyle (ölçülen kayıtta kalır). Hiç ölçülmemiş kontrolün saati de gerekçeyle yazılır (kaynak "elle").
   Bu dosya yalnız kontrol tablosunu yazar / okur; yetki ve raporun saati çağıranda (raporlar.ts). */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { ekle, guncelle, tablo, type Iz } from "../../../server/db/yazici.ts";

const KONTROL = tablo({ ad: "kontrol", sutunlar: ["plan_id", "ekipman_id", "personel_id", "takip", "kaynak", "bitti", "duz_bas", "duz_bit", "duz_gerekce", "duz_kim"] });

export type KontrolKaynagi = "sunucu" | "cihaz" | "elle";
export interface KontrolSatiri {
  id: string; kaynak: KontrolKaynagi; basladi: Date | null; bitti: Date | null;
  duz_bas: Date | null; duz_bit: Date | null; duz_gerekce: string | null; duz_zaman: Date | null; duz_kim: string | null; surum: number;
}
/** kontrolün bağlı olduğu kayıtlar (raporun aynı alanları) */
export interface KontrolAnahtari { plan_id: string; ekipman_id: string; personel_id: string; takip: boolean }
export type KontrolDurumu = "yok" | "suruyor" | "bitti";

/** elle yazılmış ya da bitirilmiş kontrol "bitti"; ölçülüp bitirilmemiş "sürüyor" */
export const kontrolDurumu = (k: KontrolSatiri | null): KontrolDurumu => (!k ? "yok" : k.kaynak === "elle" || k.bitti ? "bitti" : "suruyor");
/** rapora yazılan saat: düzeltme varsa o, yoksa ölçülen */
export const etkinSaat = (k: KontrolSatiri): { bas: Date; bit: Date | null } => (k.duz_bas ? { bas: k.duz_bas, bit: k.duz_bit } : { bas: k.basladi!, bit: k.bitti });

export async function kontrolOku(db: Sorgulayici, a: KontrolAnahtari, kilitle = false): Promise<KontrolSatiri | null> {
  return (await db.sorgu<KontrolSatiri>(
    `SELECT id::text, kaynak, basladi, bitti, duz_bas, duz_bit, duz_gerekce, duz_zaman, duz_kim, surum FROM kontrol
     WHERE plan_id = $1 AND ekipman_id = $2 AND personel_id = $3 AND takip = $4${kilitle ? " FOR UPDATE" : ""}`, [a.plan_id, a.ekipman_id, a.personel_id, a.takip])).rows[0] ?? null;
}

/** kişinin süren (bitirilmemiş) kontrolü — aynı anda tek kontrol (K3; veritabanında kontrol_acik) */
export async function acikKontrol(db: Sorgulayici, personelId: string): Promise<{ plan_id: string; ekipman_id: string } | null> {
  return (await db.sorgu<{ plan_id: string; ekipman_id: string }>(
    "SELECT plan_id::text, ekipman_id::text FROM kontrol WHERE personel_id = $1 AND basladi IS NOT NULL AND bitti IS NULL", [personelId])).rows[0] ?? null;
}

/** kontrolü başlatır: başlangıç saatini veritabanı yazar */
export async function kontrolBaslat(db: Sorgulayici, a: KontrolAnahtari, iz: Iz): Promise<KontrolSatiri> {
  await ekle(db, KONTROL, { plan_id: a.plan_id, ekipman_id: a.ekipman_id, personel_id: a.personel_id, takip: a.takip, kaynak: "sunucu" }, iz);
  return (await kontrolOku(db, a))!;
}

/** süren kontrolü bitirir: bitiş saatini veritabanı yazar */
export async function kontrolBitirYaz(db: Sorgulayici, a: KontrolAnahtari, k: KontrolSatiri, iz: Iz): Promise<KontrolSatiri> {
  await guncelle(db, KONTROL, k.id, k.surum, { bitti: new Date() }, iz);
  return (await kontrolOku(db, a))!;
}

/** saati gerekçeyle yazar / düzeltir: ölçülmüş kontrolde ölçülen değer kalır (duz_*); hiç ölçülmemişte "elle" kayıt açılır */
export async function kontrolDuzeltYaz(db: Sorgulayici, a: KontrolAnahtari, k: KontrolSatiri | null,
  d: { bas: string; bit: string; gerekce: string; kim: string }, iz: Iz): Promise<KontrolSatiri> {
  const alan = { duz_bas: d.bas, duz_bit: d.bit, duz_gerekce: d.gerekce, duz_kim: d.kim };
  if (k) await guncelle(db, KONTROL, k.id, k.surum, alan, iz);
  else await ekle(db, KONTROL, { plan_id: a.plan_id, ekipman_id: a.ekipman_id, personel_id: a.personel_id, takip: a.takip, kaynak: "elle", ...alan }, iz);
  return (await kontrolOku(db, a))!;
}
