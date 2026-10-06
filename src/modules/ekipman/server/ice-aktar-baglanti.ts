/* EKİPMAN ↔ FİRMA AYARLARI (TOPLU İÇE AKTARMA) BAĞLANTISI (337; maket "Toplu içe aktarma (ilk kurulum)" — ekipmanlar). Verilmiş bütün kodlar
   (eski kodlar dahil — ekipman_kodu: eski kod başkasına verilmez) ve yeni ekipman buradan. Değerler çağıranda doğrulanmış (firma-ayarlari/
   ice-aktar.ts; kod biçimi veritabanında da). Yetki ÇAĞIRANDA (Firma ayarları "değiştirir"). */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { ekle, tablo, type Iz } from "../../../server/db/yazici.ts";

const EKIPMAN = tablo({ ad: "ekipman", sutunlar: ["tesis_id", "tur_id", "kod", "konum", "marka", "model", "seri", "imal", "ekleyen"] });

/** firmada verilmiş bütün ekipman kodları (şimdiki ve eski) */
export async function ekipmanKodlari(db: Sorgulayici): Promise<string[]> {
  return (await db.sorgu<{ kod: string }>("SELECT kod FROM ekipman_kodu UNION SELECT kod FROM ekipman")).rows.map((x) => x.kod);
}

export async function ekipmanIceAktar(db: Sorgulayici, iz: Iz, e: { tesisId: string; turId: string; kod: string; konum: string | null; marka: string | null;
  model: string | null; seri: string | null; imal: number | null }): Promise<string> {
  return (await ekle(db, EKIPMAN, { tesis_id: e.tesisId, tur_id: e.turId, kod: e.kod, konum: e.konum, marka: e.marka, model: e.model, seri: e.seri, imal: e.imal, ekleyen: iz.kim }, iz)).id;
}
