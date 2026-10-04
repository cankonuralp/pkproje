"use server";
/* PLANLAR SUNUCU EYLEMLERİ — kişi ve kiracı oturumdan; yetki, doğrulama ve uyarılar modül işlevinde (planlar.ts). İstemciden gelen kimlikler yalnız
   "hangi tesis, hangi denetçi" bilgisidir; tesisin, denetçinin ve İSG-KATİP kaydının bu firmada olduğu sunucuda denetlenir. */
import { depo } from "../../../server/dosya/depo";
import { ayniKoken } from "../../../server/kimlik/koken";
import { istekOturumu, oturumIslemi } from "../../../server/kimlik/istek";
import { planAc, tesisPlanBilgisi, type TesisPlanBilgisi } from "../server/planlar";

export interface PlanAcYaniti { tamam?: boolean; id?: string; no?: string; hatalar?: Record<string, string>; genel?: string }

async function oturum() {
  if (!(await ayniKoken())) return "İstek reddedildi. Sayfayı yenileyip yeniden deneyin.";
  return (await istekOturumu()) ?? "Oturumunuz kapandı. Yeniden giriş yapın.";
}

export async function tesisPlanBilgisiEylemi(tesisId: string): Promise<TesisPlanBilgisi | null> {
  const o = await oturum(); if (typeof o === "string") return null;
  return oturumIslemi(o, (db) => tesisPlanBilgisi(db, o, typeof tesisId === "string" ? tesisId : ""));
}

export async function planAcEylemi(girdi: unknown): Promise<PlanAcYaniti> {
  const o = await oturum(); if (typeof o === "string") return { genel: o };
  const r = await oturumIslemi(o, (db) => planAc(db, depo(), o, o.kiraci.firmaId, girdi));
  if (r.durum === "tamam") return { tamam: true, id: r.id, no: r.no };
  if (r.durum === "gecersiz") return { hatalar: r.hatalar };
  return { genel: "Plan açma yetkiniz yok." };
}
