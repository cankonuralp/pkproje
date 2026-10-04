/* API sürümü: cihaz uygulaması açılışta sorar (oturum gerekmez; firma ya da kişi bilgisi içermez). */
import { API_SURUMU, EN_AZ_ISTEMCI } from "../../../server/api-surum";

export function GET() {
  return Response.json({ api: API_SURUMU, enAzIstemci: EN_AZ_ISTEMCI }, { headers: { "Cache-Control": "no-store" } });
}
