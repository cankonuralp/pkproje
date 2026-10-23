"use server";
/* S.A.Y SUNUCU EYLEMLERİ (380) — kişi ve kiracı oturumdan (istemciden kimlik alınmaz); başka kökenden gelen istek ve oturumsuz çağrı reddedilir.
   2026-10-23 (S.A.Y baştan): soru, ekranın sonucu ve devam artık akışlı uçta (src/app/api/say → server/dongu.ts); ek parça parça src/app/api/say/ek.
   Burada kalan: durum, görünen geçmiş, ekranın kuralla yaptığı işin cevabı, eski öneri kartı, Sohbeti temizle (konuşma ve ekler de silinir; eklerin
   dosyaları yapay zekâ hizmetinden de). */
import { ayniKoken } from "../../../server/kimlik/koken";
import { istekOturumu, oturumIslemi } from "../../../server/kimlik/istek";
import { anthropicDosyaSil } from "../../../server/yz/akis";
import type { SohbetIletisi } from "../../../server/yz/sohbet";
import { sayDurumu, sayGecmisi, sayOneri, sayRaporCevabi, sayTemizle, type SayDurum } from "../server/say";

async function oturum() {
  if (!(await ayniKoken())) return null;
  return istekOturumu();
}

export async function sayDurumEylemi(): Promise<SayDurum | null> {
  const o = await oturum();
  return o ? oturumIslemi(o, (db) => sayDurumu(db)) : null;
}

export async function sayGecmisEylemi(): Promise<SohbetIletisi[]> {
  const o = await oturum();
  return o ? oturumIslemi(o, (db) => sayGecmisi(db)) : [];
}

/** rapor ekranının kuralla yaptığı iş (542): ekran işin sayılarını gönderir, metni sunucu kurar */
export async function sayRaporEylemi(girdi: unknown): Promise<{ durum: "tamam"; iletiler: SohbetIletisi[] } | { durum: "red"; neden: string }> {
  const o = await oturum();
  if (!o) return { durum: "red", neden: "Oturumunuz kapandı. Sayfayı yenileyip yeniden giriş yapın." };
  return oturumIslemi(o, (db) => sayRaporCevabi(db, girdi));
}

/** öneri kartı: Uygula / Vazgeç (yalnız kişinin kendi iletisinde, bir kez) */
export async function sayOneriEylemi(id: unknown, durum: unknown): Promise<boolean> {
  const o = await oturum();
  if (!o || typeof id !== "string" || (durum !== "uygulandi" && durum !== "vazgecildi")) return false;
  return oturumIslemi(o, (db) => sayOneri(db, id, durum));
}

export async function sayTemizleEylemi(): Promise<{ durum: "tamam"; silinen: number } | { durum: "red"; neden: string }> {
  const o = await oturum();
  if (!o) return { durum: "red", neden: "Oturumunuz kapandı." };
  const t = await oturumIslemi(o, (db) => sayTemizle(db));
  if (t.anahtar) for (const d of t.dosyalar) await anthropicDosyaSil(d, t.anahtar);
  return { durum: "tamam", silinen: t.silinen };
}
