"use server";
/* S.A.Y SUNUCU EYLEMLERİ (380) — kişi ve kiracı oturumdan (istemciden kimlik alınmaz); başka kökenden gelen istek ve oturumsuz çağrı reddedilir.
   2026-10-23 (S.A.Y baştan): soru, ekranın sonucu ve devam artık akışlı uçta (src/app/api/say → server/dongu.ts); ek parça parça src/app/api/say/ek.
   Burada kalan: durum, görünen geçmiş, ekranın kuralla yaptığı işin cevabı, eski öneri kartı, Sohbeti temizle (konuşma ve ekler de silinir; eklerin
   dosyaları yapay zekâ hizmetinden de). */
import { ayniKoken } from "../../../server/kimlik/koken";
import { istekOturumu, oturumIslemi } from "../../../server/kimlik/istek";
import { anthropicDosyaSil } from "../../../server/yz/akis";
import type { SohbetIletisi } from "../../../server/yz/sohbet";
import { kosulKabulEt } from "../../../server/yz/kosul";
import { sayDurumu, sayGecmisi, sayOneri, sayRaporCevabi, sayTemizle, type SayDurum } from "../server/say";

async function oturum() {
  if (!(await ayniKoken())) return null;
  return istekOturumu();
}

export async function sayDurumEylemi(): Promise<SayDurum | null> {
  const o = await oturum();
  if (!o) return null;
  const d = await oturumIslemi(o, (db) => sayDurumu(db));
  return { ...d, roller: [...o.roller], ...(d.kosul ? { kosul: { ...d.kosul, yonetici: o.roller.includes("firma_yoneticisi") } } : {}) };
}

/** 2026-10-31 (kalem 7 — M6): kullanım koşullarının Yapay zekâ (S.A.Y) maddesini kabul — firma adına (yalnız firma yöneticisi) ya da kendi adına */
export async function kosulKabulEylemi(tur: "firma" | "kullanici"): Promise<{ tamam: boolean; neden?: string }> {
  const o = await oturum();
  if (!o) return { tamam: false, neden: "Oturum yok; yeniden giriş yapın." };
  const n = await oturumIslemi(o, (db) => kosulKabulEt(db, o, tur === "firma" ? "firma" : "kullanici"));
  return n ? { tamam: false, neden: n } : { tamam: true };
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
  const t = await oturumIslemi(o, (db) => sayTemizle(db, o.ad));
  if (t.anahtar) for (const d of t.dosyalar) await anthropicDosyaSil(d, t.anahtar);
  return { durum: "tamam", silinen: t.silinen };
}
