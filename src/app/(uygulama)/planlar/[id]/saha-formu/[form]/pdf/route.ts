/* SAHA FORMU PDF'İ (2026-10-12; reisim: "görselde saha takip formu üretme işi yok ? neden ? geri gelsin." — maket MB.sahaFormu, "PDF indir"):
   tamamlanan planın oluşturulmuş formu, temel formatla (src/belge/saha.ts), öteki belgelerle aynı motorla (src/belge/pdf.ts) — yazdırılıp
   müşteriye imzalatılır, kaşelenir. Oturum yoksa 403; planı göremeyene ya da başka planın formuna 404 (yetki sahaFormuVerisi'nde). İndirilir
   (öteki PDF uçları gibi); önbelleğe alınmaz. */
import { sahaPdf } from "../../../../../../../belge/pdf";
import { sahaFormuVerisi } from "../../../../../../../modules/planlar/server/plan-ici";
import { depo } from "../../../../../../../server/dosya/depo";
import { istekOturumu, oturumIslemi } from "../../../../../../../server/kimlik/istek";

export const runtime = "nodejs";
export const maxDuration = 60;
const DUZ = { "Cache-Control": "no-store", "Content-Type": "text/plain; charset=utf-8" };

export async function GET(_istek: Request, { params }: { params: Promise<{ id: string; form: string }> }) {
  const o = await istekOturumu();
  if (!o) return new Response("Oturum gerekli", { status: 403, headers: DUZ });
  const { id, form } = await params;
  const v = await oturumIslemi(o, (db) => sahaFormuVerisi(db, o, id, form, depo()));
  if (!v) return new Response("Bulunamadı", { status: 404, headers: DUZ });
  const pdf = await sahaPdf(v);
  const ad = `${v.no}-saha-formu.pdf`;
  return new Response(Buffer.from(pdf), { status: 200, headers: {
    "Content-Type": "application/pdf", "Content-Length": String(pdf.length), "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff",
    "Content-Disposition": `attachment; filename="${ad.replace(/[^\x20-\x7e]/g, "_")}"; filename*=UTF-8''${encodeURIComponent(ad)}`,
  } });
}
