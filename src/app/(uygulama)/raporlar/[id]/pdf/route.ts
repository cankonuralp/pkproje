/* İMZASIZ PDF İNDİR (reisim 2026-09-28: "ön izle halinde PDF halini indirebilmeliyim"): raporun belgesi, kesin PDF'le aynı motorla (src/belge/pdf.ts).
   Oturum yoksa 403; raporu göremeyene 404 (varlığı söylenmez) — yetki raporBelgesiVerisi'nde (Raporlar düzeyi). Önbelleğe alınmaz. İmzalı PDF
   imza kalemiyle dosya deposundan iner; tamamlanan raporda burası 409 (imzasız kopya imzalı gibi dolaşmasın — 315–317 incelemesi). */
import { belgePdf } from "../../../../../belge/pdf";
import { raporBelgesiVerisi } from "../../../../../modules/raporlar/server/raporlar";
import { depo } from "../../../../../server/dosya/depo";
import { istekOturumu, oturumIslemi } from "../../../../../server/kimlik/istek";

export const runtime = "nodejs";
export const maxDuration = 60;
const DUZ = { "Cache-Control": "no-store", "Content-Type": "text/plain; charset=utf-8" };

export async function GET(_istek: Request, { params }: { params: Promise<{ id: string }> }) {
  const o = await istekOturumu();
  if (!o) return new Response("Oturum gerekli", { status: 403, headers: DUZ });
  const { id } = await params;
  const v = await oturumIslemi(o, (db) => raporBelgesiVerisi(db, depo(), o, id));
  if (!v) return new Response("Bulunamadı", { status: 404, headers: DUZ });
  if (v.imzaliDosya) return new Response("Rapor imzalı; imzalı PDF rapor ekranından iner.", { status: 409, headers: DUZ });
  const pdf = await belgePdf(v.belge);
  const ad = `${v.no}-imzasiz.pdf`;
  return new Response(Buffer.from(pdf), { status: 200, headers: {
    "Content-Type": "application/pdf", "Content-Length": String(pdf.length), "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff",
    "Content-Disposition": `attachment; filename="${ad.replace(/[^\x20-\x7e]/g, "_")}"; filename*=UTF-8''${encodeURIComponent(ad)}`,
  } });
}
