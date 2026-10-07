/* DUYURU OKUMASINI YANITTAN SONRA BAŞLAT (379) — Ana sayfa yanıtı beklemez (Next after: yanıt gittikten sonra, sayfanın süre sınırı içinde).
   Okuma düşerse kayda geçer (is_calisma "hata"), sayfa etkilenmez. */
import { after } from "next/server";
import { havuz } from "../db/havuz.ts";
import { duyurulariOku } from "./okuma.ts";

export function duyuruTazeleSonra(): void {
  after(async () => {
    try { await duyurulariOku(havuz()); } catch (h) { console.error("[duyuru] okuma düştü:", (h as Error).message); }
  });
}
