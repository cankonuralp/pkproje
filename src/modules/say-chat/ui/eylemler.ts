"use server";
/* S.A.Y CHAT SUNUCU EYLEMLERİ (2026-11-07 yeniden) — kişi ve kiracı oturumdan (istemciden kimlik alınmaz); başka kökenden gelen istek ve oturumsuz çağrı
   reddedilir. Mesaj yazma ve silme çevrimdışı kuyrukla (/api/islem "chat.mesaj" / "chat.sil"); burada yalnız okuma ve işaretin geri alınması. */
import { ayniKoken } from "../../../server/kimlik/koken";
import { istekOturumu, oturumIslemi } from "../../../server/kimlik/istek";
import { gecmisiSil, isaretGeriAl, sohbet } from "../server/mesajlar";
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
