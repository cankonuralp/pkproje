/* E-POSTAYI YANITTAN SONRA GÖNDER (432) — kullanıcı sağlayıcıyı beklemez (Next after: yanıt gittikten sonra, sayfanın süre sınırı içinde). Firma
   kendi işleminde (kiracı bağlamı, RLS); düşerse kuyrukta "bekliyor" kalır, gece işi yeniden dener. 536: firmanın kendi gönderim ayarıyla (firma.ts).
   FIRMA-VT FV3 (2026-10-15): iş isteğin kiracısının veritabanında (kiraciHavuzu — kendi projeli firmada kendi veritabanı); kiracı istekten verilir,
   kimlikten yeniden çözülmez. */
import { after } from "next/server";
import { kiraciHavuzu, type KiraciYeri } from "../db/firma-havuzu.ts";
import { kiraciIcinde } from "../db/kiraci.ts";
import { firmaGonderimi } from "./firma.ts";
import { bekleyenleriGonder } from "./gonder.ts";

export function epostalariSonraGonder(kiraci: KiraciYeri, kaynak: string, kaynakId: string): void {
  after(async () => {
    try { await kiraciIcinde(kiraciHavuzu(kiraci), kiraci.firmaId, async (db) => bekleyenleriGonder(db, await firmaGonderimi(db), { kaynak, kaynakId })); }
    catch (h) { console.error("[eposta] gönderim düştü:", (h as Error).message); }
  });
}
