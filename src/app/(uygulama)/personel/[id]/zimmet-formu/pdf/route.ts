/* ZİMMET TESLİM FORMU PDF'İ (344; maket personel.html zimmet formu "PDF indir" → MB.zimmetFormu): kişinin şimdiki zimmetiyle, temel formatla
   (src/belge/zimmet.ts), öteki belgelerle aynı motorla (src/belge/pdf.ts) — ıslak imza için; numara imzaya gönderilince verilir. Oturum yoksa 403;
   Personel "değiştirir" değilse ya da kişinin zimmeti yoksa 404 (yetki zimmetFormuVerisi'nde). Önbelleğe alınmaz. */
import { zimmetPdf } from "../../../../../../belge/pdf";
import { zimmetFormuVerisi } from "../../../../../../modules/personel/server/dosyalar";
import { depo } from "../../../../../../server/dosya/depo";
import { istekOturumu, oturumIslemi } from "../../../../../../server/kimlik/istek";

export const runtime = "nodejs";
export const maxDuration = 60;
const DUZ = { "Cache-Control": "no-store", "Content-Type": "text/plain; charset=utf-8" };

export async function GET(_istek: Request, { params }: { params: Promise<{ id: string }> }) {
  const o = await istekOturumu();
  if (!o) return new Response("Oturum gerekli", { status: 403, headers: DUZ });
  const { id } = await params;
  const v = await oturumIslemi(o, (db) => zimmetFormuVerisi(db, o, id, depo()));
  if (!v) return new Response("Bulunamadı", { status: 404, headers: DUZ });
  const pdf = await zimmetPdf(v);
  const ad = `zimmet-teslim-formu-${v.tarih}.pdf`;
  return new Response(Buffer.from(pdf), { status: 200, headers: {
    "Content-Type": "application/pdf", "Content-Length": String(pdf.length), "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff",
    "Content-Disposition": `attachment; filename="${ad}"; filename*=UTF-8''${encodeURIComponent(ad)}`,
  } });
}
