"use server";
/* SAHA LİSTESİ SUNUCU EYLEMİ (2026-11-08): "Yeni ekipman" — plana aynı türden ekipman ekler (yetki Planlar'da). Raporlar kuyruktan açılır (/api/islem "rapor.saha"), burada değil. */
import { ayniKoken } from "../../../server/kimlik/koken";
import { istekOturumu, oturumIslemi } from "../../../server/kimlik/istek";
import { sahaEkipmanEkle } from "../../planlar/server/plan-ici";
import type { PlanYazma } from "../../planlar/server/plan-ici";

export async function sahaEkipmanEylemi(plan: unknown, girdi: unknown): Promise<PlanYazma> {
  if (!(await ayniKoken())) return { durum: "red", neden: "İstek reddedildi. Sayfayı yenileyip yeniden deneyin." };
  const o = await istekOturumu();
  if (!o) return { durum: "red", neden: "Oturumunuz kapandı. Yeniden giriş yapın." };
  if (typeof plan !== "string") return { durum: "yok" };
  return oturumIslemi(o, (db) => sahaEkipmanEkle(db, o, plan, girdi));
}
