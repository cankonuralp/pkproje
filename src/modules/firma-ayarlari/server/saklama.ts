/* SAKLAMA SÜRESİ DOLACAK RAPORLAR (387; KOD-GECIS ENGEL 11 "süre dolunca depodan siler (30 gün önce firma yöneticisine liste)"; maket
   firma-ayarlari "silinecekler 30 gün önce size listelenir"). Yalnız Firma ayarları "yaz" (firma yöneticisi — SABIT); liste Raporlar'dan. */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { SAKLAMA_ONCE_GUN, saklamaListesi, type SaklamaSatiri } from "../../raporlar/server/ayar-baglanti.ts";
import { ayarlarYazar, type Kisi } from "./ayarlar.ts";

export interface SaklamaSayfasi { yil: number; onceGun: number; liste: SaklamaSatiri[]; fazla: boolean }

/** göremeyene null */
export async function saklamaSayfasi(db: Sorgulayici, kim: Kisi): Promise<SaklamaSayfasi | null> {
  if (!ayarlarYazar(kim)) return null;
  return { ...(await saklamaListesi(db)), onceGun: SAKLAMA_ONCE_GUN };
}
