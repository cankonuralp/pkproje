/* ÇÖP TEMİZLİĞİ (378; 09-A5, göç 0069) — gece işi, OTURUMDAKİ FİRMANIN işleminde (G1): çöpte 30 günü dolan dosya kalıcı silinir — önce satır
   (dosya_cop_sil: firma, çöp ve süre veritabanında denetlenir; bir kayıt hâlâ başvuruyorsa "bağlı", silinmez), sonra depodaki nesne (copSil).
   Çöpteki dosya zaten indirilemez (dosya.ts indirilebilir: cop IS NULL); silme ekranda bir şey değiştirmez, yer açar. Depoda kaydı olmayan nesne
   SAYILIR, silinmez (A5). En eski önce, koşu başına sınırlı; kalan sonraki gece. */
import type { Sorgulayici } from "../db/kiraci.ts";
import type { Depo } from "./depo.ts";

export interface CopSonucu {
  silinen: number;
  /** silinenlerin toplam boyutu */
  bayt: number;
  /** süresi dolmuş ama bir kayda hâlâ bağlı (silinmedi) */
  bagli: number;
  /** sınır yüzünden sonraki geceye kalan var mı */
  kalan: boolean;
  /** depoda kaydı olmayan nesne (listelenemeyen depoda null) */
  oksuz: number | null;
}

export const COP_ADET = 200;

export async function copTemizle(db: Sorgulayici, depo: Depo, adet = COP_ADET): Promise<CopSonucu> {
  const adaylar = (await db.sorgu<{ id: string; anahtar: string; boyut: string }>(
    "SELECT id::text, anahtar, boyut::text FROM dosya WHERE cop IS NOT NULL AND cop < now() - interval '30 days' ORDER BY cop, id LIMIT $1",
    [adet + 1])).rows;
  const s: CopSonucu = { silinen: 0, bayt: 0, bagli: 0, kalan: adaylar.length > adet, oksuz: null };
  for (const a of adaylar.slice(0, adet)) {
    const r = (await db.sorgu<{ s: "silindi" | "bagli" | "yok" }>("SELECT dosya_cop_sil($1) AS s", [a.id])).rows[0].s;
    if (r === "silindi") {
      await depo.copSil(a.anahtar, db);
      s.silinen++;
      s.bayt += Number(a.boyut);
    } else if (r === "bagli") s.bagli++;
  }
  s.oksuz = await depo.oksuzSay(db);
  return s;
}
