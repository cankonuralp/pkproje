"use server";
/* S.A.Y CHAT SUNUCU EYLEMLERİ (2026-11-07 yeniden) — kişi ve kiracı oturumdan (istemciden kimlik alınmaz); başka kökenden gelen istek ve oturumsuz çağrı
   reddedilir. Mesaj yazma ve silme çevrimdışı kuyrukla (/api/islem "chat.mesaj" / "chat.sil"); burada yalnız okuma ve işaretin geri alınması. */
import { ayniKoken } from "../../../server/kimlik/koken";
import { istekOturumu, oturumIslemi } from "../../../server/kimlik/istek";
import { isaretGeriAl, sohbet } from "../server/mesajlar";
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

/** 2026-11-08 bant (K6): kişinin rapor açabileceği planları; oturum yoksa null */
export async function sahaPlanlariEylemi(): Promise<SahaPlani[] | null> {
  const o = await oturum(); if (typeof o === "string") return null;
  return oturumIslemi(o, (db) => sahaPlanlari(db, o, istanbulGunu(new Date().toISOString())));
}

/** "işlendi" etiketinde Geri al — aynı işaretle işaretlenen bütün mesajlar */
export async function isaretGeriAlEylemi(mesaj: unknown): Promise<{ durum: "tamam"; adet: number } | { durum: "red"; neden: string }> {
  const o = await oturum(); if (typeof o === "string") return { durum: "red", neden: o };
  if (typeof mesaj !== "string") return { durum: "red", neden: "Mesaj bulunamadı." };
  return { durum: "tamam", adet: await oturumIslemi(o, (db) => isaretGeriAl(db, o, mesaj)) };
}
