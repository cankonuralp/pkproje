/* HATA KAYDET (567; 06-HATA-TAKIBI) — tarayıcı ucu (/api/hata) ve sunucunun istek hatası (instrumentation.ts onRequestError) BURADAN yazar.
   Kayıt yolu hiçbir zaman hata FIRLATMAZ (hata yazılamazsa günlüğe bir satır; asıl işi bozmaz). Maske ve kırpma maske.ts'te. */
import { merkezHavuzu } from "../db/havuz.ts";
import { hataYazDb } from "../db/hata.ts";
import { hataHazirla, type HataGirdisi } from "./maske.ts";

/** derlemenin kısa sürümü (sağlık ucuyla aynı) */
export const yayinSurumu = () => (process.env.VERCEL_GIT_COMMIT_SHA ?? "yerel").slice(0, 7);

export async function hataKaydet(g: HataGirdisi): Promise<boolean> {
  try {
    const h = hataHazirla({ surum: yayinSurumu(), ...g });
    return h ? await hataYazDb(merkezHavuzu(), h) : false;
  } catch (e) {
    console.error("[hata kaydı] yazılamadı:", e instanceof Error ? e.message : String(e));
    return false;
  }
}
