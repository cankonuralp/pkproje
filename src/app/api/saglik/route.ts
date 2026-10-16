/* SAĞLIK UCU (350; 09-G5) — oturum gerekmez; firma ya da kişi bilgisi içermez (yalnız evet / hayır denetimleri ve sürüm). Biri düşerse 503:
   duman testi (tools/duman.mjs) ve dış izleme çıkış durumunu buradan okur. HTTP önbelleği yok (no-store).
   FIRMA-VT FV7 (2026-10-15): firma adresinde merkezle birlikte O FİRMANIN veritabanı da denetlenir ("firma_vt" — kiracı yalnız Host'tan,
   istekKiracisi); kökte, yönetim adresinde (ara katman orada /api'yi zaten 404 yapar) ve bilinmeyen adreste yalnız merkez. Yanıtın biçimi (anahtarlar)
   adrese göre değişmez; firma listesi / sayısı bu uçtan okunmaz. Firma veritabanı sorunluyken firma_vt=false o adresin kendi veritabanlı firma
   olduğunu ele verebilir (2026-10-15 FV7 incelemesi — iddia daraltıldı; src/server/saglik.ts). Firma sonucu sunucuda örnek başına kısa süre
   önbellekte (sağlam 10 sn, sorunlu 30 sn): oturumsuz istek firmanın veritabanına her seferinde gitmez. Yazmaz. */
import { istekKiracisi } from "../../../server/kiraci/istek";
import { saglik } from "../../../server/saglik";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await saglik(istekKiracisi);
  return Response.json(s, { status: s.durum === "tamam" ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
