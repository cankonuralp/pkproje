/* GECE YEDEK İŞİ UCU (2026-11-03; firmanın kendi yedeği) — zamanlayıcı (Vercel Cron, vercel.json "crons") günde bir çağırır; /api/is/gece'den AYRI
   (gönderim uzun sürer: 300 sn). Yalnız CRON_SECRET'i taşıyan istek (src/server/is/yetki.ts); yoksa / yanlışsa 401. Her firma kendi havuzunda
   (firmaHavuzuKimlikle): probata'nın aylık arşivi + bağlıysa Drive / OneDrive'a yeni dosyalar (src/server/yedek/calis.ts). Yanıt yalnız sayılar. */
import { firmaHavuzuKimlikle } from "../../../../server/db/firma-havuzu";
import { merkezHavuzu } from "../../../../server/db/havuz";
import { depo } from "../../../../server/dosya/depo";
import { zamanliYetkili } from "../../../../server/is/yetki";
import { yedekIsi } from "../../../../server/yedek/calis";

export const dynamic = "force-dynamic";
export const maxDuration = 300;
const YEDEK_SURE = 270_000;

const BASLIK = { "Cache-Control": "no-store" };

export async function GET(istek: Request) {
  if (!zamanliYetkili(istek.headers.get("authorization"), process.env.CRON_SECRET)) {
    return Response.json({ hata: "Yetkisiz." }, { status: 401, headers: BASLIK });
  }
  const o = await yedekIsi(merkezHavuzu(), depo(), YEDEK_SURE, firmaHavuzuKimlikle);
  return Response.json(o, { status: o.durum === "hata" ? 500 : 200, headers: BASLIK });
}
