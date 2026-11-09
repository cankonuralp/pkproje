"use server";
/* S.A.Y CHAT SUNUCU EYLEMLERİ (2026-11-07 yeniden) — kişi ve kiracı oturumdan (istemciden kimlik alınmaz); başka kökenden gelen istek ve oturumsuz çağrı
   reddedilir. Mesaj yazma ve silme çevrimdışı kuyrukla (/api/islem "chat.mesaj" / "chat.sil"); burada yalnız okuma ve işaretin geri alınması. */
import { ayniKoken } from "../../../server/kimlik/koken";
import { istekOturumu, oturumIslemi } from "../../../server/kimlik/istek";
import { gecmisiSil, isaretGeriAl, sohbet } from "../server/mesajlar";
import { raporKaydiYaz, raporModuVerisi, type KayitRaporSonucu } from "../server/rapor-kayit";
import { alanOkuBirak, alanOkuHazirla, alanOkuKullanimYaz } from "../../raporlar/server/alan-oku";
import { raporOneriYaz } from "../../raporlar/server/oneri";
import { depo } from "../../../server/dosya/depo";
import { anthropicCagir } from "../../../server/yz/okuma";
import type { RaporModuVerisi } from "../rapor-modu";
import { sahaPlanlari, type SahaPlani } from "../../planlar/server/cevrimdisi";
import { istanbulGunu, type ChatMesaji } from "../sema";

async function oturum() {
  if (!(await ayniKoken())) return "İstek reddedildi. Sayfayı yenileyip yeniden deneyin.";
  return (await istekOturumu()) ?? "Oturumunuz kapandı. Yeniden giriş yapın.";
}

/** sohbet (panel açılınca, kuyruk boşalınca) */
export async function sohbetEylemi(): Promise<{ durum: "tamam"; mesajlar: ChatMesaji[] } | { durum: "red"; neden: string }> {
  const o = await oturum(); if (typeof o === "string") return { durum: "red", neden: o };
  return { durum: "tamam", mesajlar: await oturumIslemi(o, (db) => sohbet(db, o)) };
}

/** üst bant: kişinin planları; oturum yoksa null */
export async function sahaPlanlariEylemi(): Promise<SahaPlani[] | null> {
  const o = await oturum(); if (typeof o === "string") return null;
  return oturumIslemi(o, (db) => sahaPlanlari(db, o, istanbulGunu(new Date().toISOString())));
}

/** Geçmişi sil — kişinin kendi sohbeti, bütün mesajlar (2026-11-08) */
export async function gecmisiSilEylemi(): Promise<{ durum: "tamam"; adet: number } | { durum: "red"; neden: string }> {
  const o = await oturum(); if (typeof o === "string") return { durum: "red", neden: o };
  return { durum: "tamam", adet: await oturumIslemi(o, (db) => gecmisiSil(db, o)) };
}

/** mesajın menüsünde İşareti geri al — yalnız o mesaj (2026-11-08) */
export async function isaretGeriAlEylemi(mesaj: unknown): Promise<{ durum: "tamam"; adet: number } | { durum: "red"; neden: string }> {
  const o = await oturum(); if (typeof o === "string") return { durum: "red", neden: o };
  if (typeof mesaj !== "string") return { durum: "red", neden: "Mesaj bulunamadı." };
  return { durum: "tamam", adet: await oturumIslemi(o, (db) => isaretGeriAl(db, o, mesaj)) };
}

/** Rapor modu ekranı (plan seçilince, kuyruk boşalınca); kişi bu planda yazamıyorsa null */
export async function raporModuEylemi(plan: unknown): Promise<RaporModuVerisi | null> {
  const o = await oturum(); if (typeof o === "string" || typeof plan !== "string") return null;
  return oturumIslemi(o, (db) => raporModuVerisi(db, o, plan));
}

/** bekleyen bir kaydın rapor taslağı (kendi işleminde; ekran kayıtları SIRAYLA gönderir) */
export async function raporKaydiYazEylemi(plan: unknown, kayit: unknown): Promise<KayitRaporSonucu> {
  const k = typeof kayit === "string" ? kayit : "", o = await oturum();
  if (typeof o === "string") return { kayit: k, durum: "hata", neden: o };
  if (typeof plan !== "string") return { kayit: k, durum: "hata", neden: "Plan bulunamadı." };
  return oturumIslemi(o, (db) => raporKaydiYaz(db, depo(), o, o.kiraci.firmaId, plan, k));
}

/** K2: açılan raporun etiket fotoğrafını yapay zekâ okur — okunanlar raporda bekler, rapor açılınca boş alanlara girer; çağrı işlemin DIŞINDA. Dönen: okunan sayısı */
export async function raporKaydiOkuEylemi(rapor: unknown, okuma: unknown): Promise<number> {
  const o = await oturum();
  const x = (okuma ?? {}) as { bolum?: unknown; dosya?: unknown };
  if (typeof o === "string" || typeof rapor !== "string" || typeof x.bolum !== "string" || typeof x.dosya !== "string") return 0;
  const d = depo(), bolum = x.bolum, dosya = x.dosya;
  const h = await oturumIslemi(o, (db) => alanOkuHazirla(db, d, o, rapor, bolum, { dosya }));
  if (h.durum !== "hazir") return 0;
  const y = await anthropicCagir(h.istek, h.anahtar);
  if (y.durum === "hata") { await oturumIslemi(o, (db) => alanOkuBirak(db, h, y.ucret)); return 0; }
  const k = await oturumIslemi(o, (db) => alanOkuKullanimYaz(db, rapor, h, y.govde));
  if (!k.okunan.length) return 0;
  await oturumIslemi(o, (db) => raporOneriYaz(db, o, rapor, bolum, "alan", k.okunan));
  return k.okunan.length;
}
