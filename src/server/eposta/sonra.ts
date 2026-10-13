/* E-POSTAYI YANITTAN SONRA GÖNDER (432) — kullanıcı sağlayıcıyı beklemez (Next after: yanıt gittikten sonra, sayfanın süre sınırı içinde). Firma
   kendi işleminde (kiracı bağlamı, RLS); düşerse kuyrukta "bekliyor" kalır, gece işi yeniden dener. 536: firmanın kendi gönderim ayarıyla (firma.ts). */
import { after } from "next/server";
import { havuz } from "../db/havuz.ts";
import { kiraciIcinde } from "../db/kiraci.ts";
import { firmaGonderimi } from "./firma.ts";
import { bekleyenleriGonder } from "./gonder.ts";

export function epostalariSonraGonder(firmaId: string, kaynak: string, kaynakId: string): void {
  after(async () => {
    try { await kiraciIcinde(havuz(), firmaId, async (db) => bekleyenleriGonder(db, await firmaGonderimi(db), { kaynak, kaynakId })); }
    catch (h) { console.error("[eposta] gönderim düştü:", (h as Error).message); }
  });
}
