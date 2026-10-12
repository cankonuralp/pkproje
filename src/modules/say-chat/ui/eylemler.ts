"use server";
/* S.A.Y CHAT SUNUCU EYLEMLERİ (523–525) — kişi ve kiracı oturumdan (istemciden kimlik alınmaz); başka kökenden gelen istek ve oturumsuz çağrı reddedilir.
   Yetki, doğrulama ve sürüm denetimi modül işlevlerinde (server/). İstemcinin gönderdiği sürüm yalnız "hangi hâli gördüm" bilgisidir. */
import { ayniKoken } from "../../../server/kimlik/koken";
import { istekOturumu, oturumIslemi } from "../../../server/kimlik/istek";
import { sayChatAyarKaydet } from "../server/ayar";
import type { TanimHatasi } from "../sema";

export type AyarKaydetSonucu = { durum: "tamam"; surum: number; ayni: boolean } | { durum: "hata"; hata: TanimHatasi } | { durum: "red"; neden: string };

const SONUC = {
  yetkisiz: "Bu işlem için yetkiniz yok.",
  cakisma: "S.A.Y Chat ayarları siz açtıktan sonra başkası tarafından değiştirildi. Sayfayı yenileyip yeniden deneyin.",
  yok: "Ekipman türü bulunamadı.",
} as const;

async function oturum() {
  if (!(await ayniKoken())) return "İstek reddedildi. Sayfayı yenileyip yeniden deneyin.";
  return (await istekOturumu()) ?? "Oturumunuz kapandı. Yeniden giriş yapın.";
}

/** 523: Ekipman türleri › tür sayfası › S.A.Y Chat ayarları › Kaydet */
export async function chatAyarKaydetEylemi(turId: unknown, surum: unknown, girdi: unknown): Promise<AyarKaydetSonucu> {
  const o = await oturum(); if (typeof o === "string") return { durum: "red", neden: o };
  if (typeof turId !== "string" || (surum !== null && !Number.isSafeInteger(surum))) return { durum: "red", neden: SONUC.yok };
  const r = await oturumIslemi(o, (db) => sayChatAyarKaydet(db, o, turId, surum as number | null, girdi));
  if (r.durum === "tamam" || r.durum === "degisiklik_yok") return { durum: "tamam", surum: r.surum, ayni: r.durum === "degisiklik_yok" };
  if (r.durum === "hata") return r;
  return { durum: "red", neden: SONUC[r.durum] };
}
