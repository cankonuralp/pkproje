/* GECE İŞLERİ UCU (378) — zamanlayıcı (Vercel Cron, vercel.json "crons") günde bir çağırır. Yalnız CRON_SECRET'i taşıyan istek (Vercel kendisi
   "Authorization: Bearer <sır>" ekler); sır yoksa / yanlışsa 401, iş koşmaz. Oturum ve kiracı yok: iş her firmayı kendi işleminde dolaşır
   (src/server/is/gece.ts). Sırayla: çöp temizliği, saklama süresi (387; Raporlar modülü — süresi dolan imzalı rapor PDF'leri; kalan süreyle),
   bekleyen e-postalar (432; yeniden deneme).
   Yanıt yalnız sayılar (firma adı / kimliği yok); çöp sayıları üst düzeyde, saklamanınkiler "saklama"da. Önbellek yok. */
import { havuz } from "../../../../server/db/havuz";
import { depo } from "../../../../server/dosya/depo";
import { saklamaIsi } from "../../../../modules/raporlar/server/saklama";
import { epostaIsi, GECE_SURE, geceIsleri } from "../../../../server/is/gece";
import { zamanliYetkili } from "../../../../server/is/yetki";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BASLIK = { "Cache-Control": "no-store" };

export async function GET(istek: Request) {
  if (!zamanliYetkili(istek.headers.get("authorization"), process.env.CRON_SECRET)) {
    return Response.json({ hata: "Yetkisiz." }, { status: 401, headers: BASLIK });
  }
  const bas = Date.now();
  const o = await geceIsleri(havuz(), depo());
  /* saklama süresi işi kalan sürede (en az 5 sn); ayrı iş kaydı, ayrı kilit */
  const saklama = await saklamaIsi(havuz(), depo(), Math.max(5_000, GECE_SURE - (Date.now() - bas)));
  const eposta = await epostaIsi(havuz(), Math.max(5_000, GECE_SURE - (Date.now() - bas)));
  return Response.json({ ...o, saklama, eposta }, { status: o.durum === "hata" || saklama.durum === "hata" || eposta.durum === "hata" ? 500 : 200, headers: BASLIK });
}
