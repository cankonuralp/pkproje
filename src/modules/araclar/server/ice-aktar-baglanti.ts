/* ARAÇLAR ↔ FİRMA AYARLARI (TOPLU İÇE AKTARMA) BAĞLANTISI (337; maket "Toplu içe aktarma (ilk kurulum)" — araçlar). Kayıtlı plakalar (boşluksuz)
   ve yeni araç buradan. Yetki ÇAĞIRANDA (Firma ayarları "değiştirir"). */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { ekle, tablo, type Iz } from "../../../server/db/yazici.ts";

const ARAC = tablo({ ad: "arac", sutunlar: ["plaka", "tur", "marka", "model", "yil", "yakit", "ilk_km", "muayene", "sigorta", "kasko"] });

export async function aracPlakalari(db: Sorgulayici): Promise<string[]> {
  return (await db.sorgu<{ p: string }>("SELECT plaka_duz AS p FROM arac")).rows.map((x) => x.p);
}

export async function aracIceAktar(db: Sorgulayici, iz: Iz, a: { plaka: string; tur: string; marka: string; model: string; yil: number; yakit: string; ilkKm: number | null;
  muayene: string | null; sigorta: string | null; kasko: string | null }): Promise<string> {
  return (await ekle(db, ARAC, { plaka: a.plaka, tur: a.tur, marka: a.marka, model: a.model, yil: a.yil, yakit: a.yakit, ilk_km: a.ilkKm, muayene: a.muayene,
    sigorta: a.sigorta, kasko: a.kasko }, iz)).id;
}
