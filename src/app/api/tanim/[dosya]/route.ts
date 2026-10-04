/* SABİT TANIMLAR (ARKA-UC §2.1): GET /api/tanim/dizin → { ad: karma adlı adres } (kısa ömürlü); GET /api/tanim/<ad>.<karma>.json → gövde, sonsuz
   önbellek (içerik değişince ad değişir). Eski karma 404 (cihaz dizini yeniden okur). Oturum gerekir (anonim erişim yok, 09-A1 ilkesi). */
import { TANIM_DOSYALARI, tanimDizini } from "../../../../tanim/tanimlar";
import { istekOturumu } from "../../../../server/kimlik/istek";

const json = (govde: string, onbellek: string, durum = 200) =>
  new Response(govde, { status: durum, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": onbellek, "X-Content-Type-Options": "nosniff" } });

export async function GET(_istek: Request, { params }: { params: Promise<{ dosya: string }> }) {
  if (!(await istekOturumu())) return json('{"hata":"Oturum gerekli"}', "no-store", 403);
  const { dosya } = await params;
  if (dosya === "dizin") return json(JSON.stringify(tanimDizini()), "private, no-cache");
  const t = TANIM_DOSYALARI.find((x) => x.dosya === dosya);
  return t ? json(t.govde, "private, max-age=31536000, immutable") : json('{"hata":"Bulunamadı"}', "no-store", 404);
}
