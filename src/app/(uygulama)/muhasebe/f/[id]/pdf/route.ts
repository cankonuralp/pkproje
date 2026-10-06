/* FATURA ÖZETİ PDF'İ (340; maket muhasebe.html "Fatura özeti (PDF)" — fatura e-Fatura programında kesilir, bu belge özettir): fatura özeti belgesi
   (src/belge/fatura.ts), rapor ve teklif belgesiyle aynı motorla (src/belge/pdf.ts). Oturum yoksa 403; faturayı göremeyene 404 (varlığı söylenmez) —
   yetki faturaBelgesiVerisi'nde (Muhasebe "gör" düzeyi). Önbelleğe alınmaz; kalıcı bağlantı yok (her istekte oturumla üretilir). */
import { faturaPdf } from "../../../../../../belge/pdf";
import { faturaBelgesiVerisi } from "../../../../../../modules/muhasebe/server/muhasebe";
import { depo } from "../../../../../../server/dosya/depo";
import { istekOturumu, oturumIslemi } from "../../../../../../server/kimlik/istek";

export const runtime = "nodejs";
export const maxDuration = 60;
const DUZ = { "Cache-Control": "no-store", "Content-Type": "text/plain; charset=utf-8" };

export async function GET(_istek: Request, { params }: { params: Promise<{ id: string }> }) {
  const o = await istekOturumu();
  if (!o) return new Response("Oturum gerekli", { status: 403, headers: DUZ });
  const { id } = await params;
  const v = await oturumIslemi(o, (db) => faturaBelgesiVerisi(db, o, id, depo()));
  if (!v) return new Response("Bulunamadı", { status: 404, headers: DUZ });
  const pdf = await faturaPdf(v);
  const ad = `${v.no}-fatura-ozeti.pdf`;
  return new Response(Buffer.from(pdf), { status: 200, headers: {
    "Content-Type": "application/pdf", "Content-Length": String(pdf.length), "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff",
    "Content-Disposition": `attachment; filename="${ad.replace(/[^\x20-\x7e]/g, "_")}"; filename*=UTF-8''${encodeURIComponent(ad)}`,
  } });
}
