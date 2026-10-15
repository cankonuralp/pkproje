/* GECE İŞLERİ UCU (378) — zamanlayıcı (Vercel Cron, vercel.json "crons") günde bir çağırır. Yalnız CRON_SECRET'i taşıyan istek (Vercel kendisi
   "Authorization: Bearer <sır>" ekler); sır yoksa / yanlışsa 401, iş koşmaz. Oturum ve kiracı yok: iş her firmayı kendi işleminde dolaşır
   (src/server/is/gece.ts). Sırayla: çöp temizliği, saklama süresi (387; Raporlar modülü — süresi dolan imzalı rapor PDF'leri; kalan süreyle),
   bekleyen e-postalar (432; yeniden deneme), depo taşıması (568; Supabase Storage'a — yalnız PROBATA_DEPO=supabase).
   Yanıt yalnız sayılar (firma adı / kimliği yok); çöp sayıları üst düzeyde, saklamanınkiler "saklama"da. Önbellek yok.
   FIRMA-VT FV3 (2026-10-15): firma listesi ve işlemler merkez havuzunda (merkezHavuzu — eski adı havuz); kendi projeli firmanın havuzu FV6'da. */
import { merkezHavuzu } from "../../../../server/db/havuz";
import { depo } from "../../../../server/dosya/depo";
import { saklamaIsi } from "../../../../modules/raporlar/server/saklama";
import { depoTasimaIsi, epostaIsi, GECE_SURE, geceIsleri } from "../../../../server/is/gece";
import { zamanliYetkili } from "../../../../server/is/yetki";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BASLIK = { "Cache-Control": "no-store" };

export async function GET(istek: Request) {
  if (!zamanliYetkili(istek.headers.get("authorization"), process.env.CRON_SECRET)) {
    return Response.json({ hata: "Yetkisiz." }, { status: 401, headers: BASLIK });
  }
  const bas = Date.now();
  const o = await geceIsleri(merkezHavuzu(), depo());
  /* saklama süresi işi kalan sürede (en az 5 sn); ayrı iş kaydı, ayrı kilit */
  const saklama = await saklamaIsi(merkezHavuzu(), depo(), Math.max(5_000, GECE_SURE - (Date.now() - bas)));
  const eposta = await epostaIsi(merkezHavuzu(), Math.max(5_000, GECE_SURE - (Date.now() - bas)));
  const tasima = await depoTasimaIsi(merkezHavuzu(), depo(), Math.max(5_000, GECE_SURE - (Date.now() - bas)));
  const hata = o.durum === "hata" || saklama.durum === "hata" || eposta.durum === "hata" || tasima?.durum === "hata";
  return Response.json({ ...o, saklama, eposta, ...(tasima ? { tasima } : {}) }, { status: hata ? 500 : 200, headers: BASLIK });
}
