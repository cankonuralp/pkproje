/* GECE İŞLERİ UCU (378) — zamanlayıcı (Vercel Cron, vercel.json "crons") günde bir çağırır. Yalnız CRON_SECRET'i taşıyan istek (Vercel kendisi
   "Authorization: Bearer <sır>" ekler); sır yoksa / yanlışsa 401, iş koşmaz. Oturum ve kiracı yok: iş her firmayı kendi işleminde dolaşır
   (src/server/is/gece.ts). Yanıt yalnız sayılar (firma adı / kimliği yok). Önbellek yok. */
import { havuz } from "../../../../server/db/havuz";
import { depo } from "../../../../server/dosya/depo";
import { geceIsleri } from "../../../../server/is/gece";
import { zamanliYetkili } from "../../../../server/is/yetki";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BASLIK = { "Cache-Control": "no-store" };

export async function GET(istek: Request) {
  if (!zamanliYetkili(istek.headers.get("authorization"), process.env.CRON_SECRET)) {
    return Response.json({ hata: "Yetkisiz." }, { status: 401, headers: BASLIK });
  }
  const o = await geceIsleri(havuz(), depo());
  return Response.json(o, { status: o.durum === "hata" ? 500 : 200, headers: BASLIK });
}
