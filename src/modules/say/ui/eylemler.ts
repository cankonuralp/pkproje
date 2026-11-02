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
import { hataKaydet } from "../../../server/hata/kaydet";
import { silinecekDosyaSil } from "../../../server/yz/konusma";
import { sayAcilisKapanisi, sayDurumu, sayGecmisi, sayOneri, sayRaporCevabi, sayTemizle, type SayDurum } from "../server/say";

async function oturum() {
  if (!(await ayniKoken())) return null;
  return istekOturumu();
}

/** 2026-11-02 (göç 0116 — reisim: "kullanıcı açsa da açmasa da 60 dakika geçince silinsin"): sayfa / panel açılışında kişinin 60 dakikayı geçmiş konuşması
    kapanır (süpürme veritabanında da var; burası aradaki dakikaları kapatır), hizmetteki ek dosyaları silinir. Düşerse açılış düşmez — hata kaydına */
async function acilisKapanisi(o: NonNullable<Awaited<ReturnType<typeof istekOturumu>>>): Promise<void> {
  try {
    const k = await oturumIslemi(o, (db) => sayAcilisKapanisi(db));
    if (!k.anahtar || !k.dosyalar.length) return;
    for (const d of k.dosyalar) await anthropicDosyaSil(d.dosya, k.anahtar);
    await oturumIslemi(o, (db) => silinecekDosyaSil(db, k.dosyalar.map((d) => d.id)));
  } catch (e) {
    void hataKaydet({ kaynak: "sunucu", mesaj: `S.A.Y açılış kapanışı: ${e instanceof Error ? e.message : String(e)}`, yer: "say.kapanis", alan: o.kiraci.kisaAd, hesap: o.id });
  }
}

export async function sayDurumEylemi(): Promise<SayDurum | null> {
  const o = await oturum();
  if (!o) return null;
  await acilisKapanisi(o);
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
  if (!o) return [];
  await acilisKapanisi(o);
  return oturumIslemi(o, (db) => sayGecmisi(db));
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
  /* 2026-11-02 (reisim: "sil tuşuna basıp temizle dediğimde bazen bug da kalıyor"): düşen temizleme sessiz kalmaz — nedeni ekrana, hata kaydına */
  try {
    const t = await oturumIslemi(o, (db) => sayTemizle(db, o.ad));
    if (t.anahtar) for (const d of t.dosyalar) await anthropicDosyaSil(d, t.anahtar);
    return { durum: "tamam", silinen: t.silinen };
  } catch (e) {
    void hataKaydet({ kaynak: "sunucu", mesaj: `S.A.Y temizleme: ${e instanceof Error ? e.message : String(e)}`, yer: "say.temizle", alan: o.kiraci.kisaAd, hesap: o.id });
    return { durum: "red", neden: "Sohbet temizlenemedi; yeniden deneyin." };
  }
}
