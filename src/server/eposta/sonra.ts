/* E-POSTAYI YANITTAN SONRA GÖNDER (432) — kullanıcı sağlayıcıyı beklemez (Next after: yanıt gittikten sonra, sayfanın süre sınırı içinde). Firma
   kendi işleminde (kiracı bağlamı, RLS); düşerse kuyrukta "bekliyor" kalır, gece işi yeniden dener. 536: firmanın kendi gönderim ayarıyla (firma.ts).
   FIRMA-VT FV3 (2026-10-15): iş isteğin kiracısının veritabanında (kiraciHavuzu — kendi projeli firmada kendi veritabanı); kiracı istekten verilir,
   kimlikten yeniden çözülmez.
   2026-10-25 (belge doldurma): epostalariGonder — aynı gönderim, beklenerek (yanıttan sonraki başka bir işin içinden: ön bilgilendirme formu önce
   PDF'i basıp kuyruğa yazar, sonra gönderir). Hata fırlatmaz; e-posta kuyrukta kalır. */
import { after } from "next/server";
import { kiraciHavuzu, type KiraciYeri } from "../db/firma-havuzu.ts";
import { kiraciIcinde } from "../db/kiraci.ts";
import { firmaGonderimi } from "./firma.ts";
import { bekleyenleriGonder } from "./gonder.ts";

/** kaydın bekleyen e-postalarını şimdi gönderir (beklenir; düşerse günlüğe yazılır, e-posta kuyrukta kalır) */
export async function epostalariGonder(kiraci: KiraciYeri, kaynak: string, kaynakId: string): Promise<void> {
  try { await kiraciIcinde(kiraciHavuzu(kiraci), kiraci.firmaId, async (db) => bekleyenleriGonder(db, await firmaGonderimi(db), { kaynak, kaynakId })); }
  catch (h) { console.error("[eposta] gönderim düştü:", (h as Error).message); }
}

export function epostalariSonraGonder(kiraci: KiraciYeri, kaynak: string, kaynakId: string): void {
  after(() => epostalariGonder(kiraci, kaynak, kaynakId));
}
