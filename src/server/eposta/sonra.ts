/* E-POSTAYI YANITTAN SONRA GÖNDER (432) — kullanıcı sağlayıcıyı beklemez (Next after: yanıt gittikten sonra, sayfanın süre sınırı içinde). Firma
   kendi işleminde (kiracı bağlamı, RLS); düşerse kuyrukta "bekliyor" kalır, gece işi yeniden dener. */
import { after } from "next/server";
import { havuz } from "../db/havuz.ts";
import { kiraciIcinde } from "../db/kiraci.ts";
import { bekleyenleriGonder } from "./gonder.ts";
import { epostaSaglayicisi } from "./saglayici.ts";

export function epostalariSonraGonder(firmaId: string, kaynak: string, kaynakId: string): void {
  after(async () => {
    try { await kiraciIcinde(havuz(), firmaId, (db) => bekleyenleriGonder(db, epostaSaglayicisi(), { kaynak, kaynakId })); }
    catch (h) { console.error("[eposta] gönderim düştü:", (h as Error).message); }
  });
}
