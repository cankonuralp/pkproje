/* TEKLİF PDF'İ (325; §3.7 satır 4 "teklif PDF'i firmanın formatıyla; indirilip elle gönderilir" — 161): teklif belgesi (src/belge/teklif.ts),
   rapor belgesiyle aynı motorla (src/belge/pdf.ts). Oturum yoksa 403; teklifi göremeyene 404 (varlığı söylenmez) — yetki teklifBelgesiVerisi'nde
   (Teklifler "gör" düzeyi). Önbelleğe alınmaz; kalıcı bağlantı yok (her istekte oturumla üretilir). */
import { teklifPdf } from "../../../../../belge/pdf";
import { teklifBelgesiVerisi } from "../../../../../modules/teklifler/server/teklifler";
import { depo } from "../../../../../server/dosya/depo";
import { istekOturumu, oturumIslemi } from "../../../../../server/kimlik/istek";

export const runtime = "nodejs";
export const maxDuration = 60;
const DUZ = { "Cache-Control": "no-store", "Content-Type": "text/plain; charset=utf-8" };

export async function GET(_istek: Request, { params }: { params: Promise<{ id: string }> }) {
  const o = await istekOturumu();
  if (!o) return new Response("Oturum gerekli", { status: 403, headers: DUZ });
  const { id } = await params;
  const v = await oturumIslemi(o, (db) => teklifBelgesiVerisi(db, o, id, depo()));
  if (!v) return new Response("Bulunamadı", { status: 404, headers: DUZ });
  const pdf = await teklifPdf(v);
  const ad = `${v.no}.pdf`;
  return new Response(Buffer.from(pdf), { status: 200, headers: {
    "Content-Type": "application/pdf", "Content-Length": String(pdf.length), "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff",
    "Content-Disposition": `attachment; filename="${ad.replace(/[^\x20-\x7e]/g, "_")}"; filename*=UTF-8''${encodeURIComponent(ad)}`,
  } });
}
