/* YEDEĞİ YANITTAN SONRA ÇALIŞTIR (2026-11-03) — rapor imzalanınca (sunum: "son imza atıldıktan birkaç dakika sonra"), "Şimdi yedekle"de ve hesap
   bağlanınca (ilk kopya). Next after: kullanıcı beklemez; sayfanın süre sınırı içinde. Firmanın kendi havuzunda (kiraciHavuzu); arşiv adımı gece
   işinde kalır. Bağlantı yoksa / başka koşu sürüyorsa hemen biter. Düşerse günlüğe yazılır; kuyruk yerinde kalır, gece işi sürdürür. */
import { after } from "next/server";
import { kiraciHavuzu, type KiraciYeri } from "../db/firma-havuzu.ts";
import { depo } from "../dosya/depo.ts";
import { firmaYedegi } from "./calis.ts";

export const SONRA_SURE = 45_000;

export function yedekSonraCalistir(kiraci: KiraciYeri, sure = SONRA_SURE): void {
  after(async () => {
    try { await firmaYedegi(kiraciHavuzu(kiraci), kiraci.firmaId, depo(), { sure, arsiv: false }); }
    catch (h) { console.error("[yedek] yanıttan sonra düştü:", (h as Error).message); }
  });
}
