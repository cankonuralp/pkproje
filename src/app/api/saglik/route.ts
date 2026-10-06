/* SAĞLIK UCU (350; 09-G5) — oturum gerekmez; firma ya da kişi bilgisi içermez (yalnız evet / hayır denetimleri ve sürüm). Biri düşerse 503:
   duman testi (tools/duman.mjs) ve dış izleme çıkış durumunu buradan okur. Önbellek yok. */
import { saglik } from "../../../server/saglik";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await saglik();
  return Response.json(s, { status: s.durum === "tamam" ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
