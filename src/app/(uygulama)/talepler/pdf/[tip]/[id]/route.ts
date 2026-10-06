/* TALEP FORMU PDF'İ (341; maket MB.talepPdfAc — 35. tur 162, T8: talebin formu temel formatla PDF olur, indirilir): izin talep formu ya da masraf
   formu (src/belge/talep.ts), rapor / teklif / fatura özetiyle aynı motorla (src/belge/pdf.ts). Oturum yoksa 403; formu göremeyene 404 (varlığı
   söylenmez) — yetki talepFormuVerisi'nde (talep eden; izinde firma yöneticisi; masrafta Muhasebe'yi gören). Önbelleğe alınmaz. E-posta K5. */
import { talepPdf } from "../../../../../../belge/pdf";
import { talepFormuVerisi } from "../../../../../../modules/talepler/server/talepler";
import { depo } from "../../../../../../server/dosya/depo";
import { istekOturumu, oturumIslemi } from "../../../../../../server/kimlik/istek";

export const runtime = "nodejs";
export const maxDuration = 60;
const DUZ = { "Cache-Control": "no-store", "Content-Type": "text/plain; charset=utf-8" };

export async function GET(_istek: Request, { params }: { params: Promise<{ tip: string; id: string }> }) {
  const o = await istekOturumu();
  if (!o) return new Response("Oturum gerekli", { status: 403, headers: DUZ });
  const { tip, id } = await params;
  const v = await oturumIslemi(o, (db) => talepFormuVerisi(db, o, tip, id, depo()));
  if (!v) return new Response("Bulunamadı", { status: 404, headers: DUZ });
  const pdf = await talepPdf(v);
  const ad = `${v.no}.pdf`;
  return new Response(Buffer.from(pdf), { status: 200, headers: {
    "Content-Type": "application/pdf", "Content-Length": String(pdf.length), "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff",
    "Content-Disposition": `attachment; filename="${ad.replace(/[^\x20-\x7e]/g, "_")}"; filename*=UTF-8''${encodeURIComponent(ad)}`,
  } });
}
