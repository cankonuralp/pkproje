/* İSTEĞİN KİRACISI (09-E2) — Host başlığındaki alt alan adından firma. İstemcinin gövdesinden, sorgu dizesinden ya da başka bir başlıktan
   (X-Forwarded-Host dahil) kiracı ALINMAZ: yalnız tarayıcının bağlandığı adres. Ana alan ortam değişkeninden (yayında probata.com.tr;
   yerelde localhost → <firma>.localhost). İstek başına bir kez çözülür (React cache).
   FIRMA-VT FV3 (2026-10-15): kısa ad → merkezdeki kayıt (önbellekli firma_coz — src/server/db/firma-havuzu.ts firmaKaydi; olumlu 15 sn, olumsuz
   5 sn). Kendi projeli firmada kiracı merkezdeki bağlantı kaydını ŞİFRELİ taşır (vt); hangi havuzun kullanılacağı kiraciHavuzu'nda. Başlıktan
   YALNIZ "host" okunur (kilit tests/firma-vt.test.ts). */
import "server-only";
import { headers } from "next/headers";
import { cache } from "react";
import { firmaKaydi } from "../db/firma-havuzu.ts";
import { yonetimAdresiMi } from "../yonetim/adres.ts";
import { hosttanKiraci, type IstekKiracisi } from "./coz.ts";

export type { IstekKiracisi } from "./coz.ts";

export const anaAlan = () => process.env.PROBATA_ANA_ALAN || "localhost";
/** 432: firmanın adresi (e-postadaki bağlantılar) — istek başlığından değil, kısa ad + ana alandan (başlıkla sahte bağlantı üretilemez) */
export const firmaAdresi = (kisaAd: string) => {
  const a = anaAlan();
  return `${a === "localhost" || a.endsWith(".localhost") ? "http" : "https"}://${kisaAd}.${a}`;
};

export const istekKiracisi = cache(async (): Promise<IstekKiracisi | null> => {
  const host = (await headers()).get("host") ?? "";
  /* yönetim adresi firma değildir (348) */
  if (yonetimAdresiMi(host)) return null;
  return hosttanKiraci(host, anaAlan(), firmaKaydi);
});
