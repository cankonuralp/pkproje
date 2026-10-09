/* İSTEĞİN KİRACISI (09-E2) — Host başlığındaki alt alan adından firma. İstemcinin gövdesinden, sorgu dizesinden ya da başka bir başlıktan
   (X-Forwarded-Host dahil) kiracı ALINMAZ: yalnız tarayıcının bağlandığı adres. Ana alan ortam değişkeninden (yayında probata.com.tr;
   yerelde localhost → <firma>.localhost). İstek başına bir kez çözülür (React cache). */
import "server-only";
import { headers } from "next/headers";
import { cache } from "react";
import { havuz } from "../db/havuz.ts";
import { firmaKimligi } from "../db/kiraci.ts";
import { yonetimAdresiMi } from "../yonetim/adres.ts";
import { kiraciAdiCoz } from "./coz.ts";

export const anaAlan = () => process.env.PROBATA_ANA_ALAN || "localhost";
/** 432: firmanın adresi (e-postadaki bağlantılar) — istek başlığından değil, kısa ad + ana alandan (başlıkla sahte bağlantı üretilemez) */
export const firmaAdresi = (kisaAd: string) => {
  const a = anaAlan();
  return `${a === "localhost" || a.endsWith(".localhost") ? "http" : "https"}://${kisaAd}.${a}`;
};
export interface IstekKiracisi { firmaId: string; kisaAd: string }

export const istekKiracisi = cache(async (): Promise<IstekKiracisi | null> => {
  const host = (await headers()).get("host") ?? "";
  /* yönetim adresi firma değildir (348) */
  if (yonetimAdresiMi(host)) return null;
  const kisaAd = kiraciAdiCoz(host, anaAlan());
  if (!kisaAd) return null;
  const firmaId = await firmaKimligi(havuz(), kisaAd);
  return firmaId ? { firmaId, kisaAd } : null;
});
