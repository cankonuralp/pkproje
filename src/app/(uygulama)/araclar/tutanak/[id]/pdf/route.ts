/* ARAÇ TESLİM TUTANAĞI PDF'İ (342; maket araclar.html tutanak-goster → MB.aracTutanak): tutanağın temel formatlı belgesi (src/belge/arac.ts),
   rapor / teklif / fatura özeti / talep formuyla aynı motorla (src/belge/pdf.ts). id: tutanağın zimmet hareketi. Oturum yoksa 403; tutanağı
   göremeyene 404 (varlığı söylenmez) — yetki tutanakBelgesiVerisi'nde (Araçlar "gör" her tutanak; sürücü yalnız taraf olduğu). Önbelleğe alınmaz.
   Teslim alanın imzaladığı PDF Onaylar › Diğer belgeler'de (gönderilen belgenin kendi dosyası). */
import { aracTutanagiPdf } from "../../../../../../belge/pdf";
import { tutanakBelgesiVerisi } from "../../../../../../modules/araclar/server/araclar";
import { depo } from "../../../../../../server/dosya/depo";
import { istekOturumu, oturumIslemi } from "../../../../../../server/kimlik/istek";

export const runtime = "nodejs";
export const maxDuration = 60;
const DUZ = { "Cache-Control": "no-store", "Content-Type": "text/plain; charset=utf-8" };

export async function GET(_istek: Request, { params }: { params: Promise<{ id: string }> }) {
  const o = await istekOturumu();
  if (!o) return new Response("Oturum gerekli", { status: 403, headers: DUZ });
  const { id } = await params;
  const v = await oturumIslemi(o, (db) => tutanakBelgesiVerisi(db, o, id, depo()));
  if (!v) return new Response("Bulunamadı", { status: 404, headers: DUZ });
  const pdf = await aracTutanagiPdf(v);
  const ad = `${v.no}.pdf`;
  return new Response(Buffer.from(pdf), { status: 200, headers: {
    "Content-Type": "application/pdf", "Content-Length": String(pdf.length), "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff",
    "Content-Disposition": `attachment; filename="${ad.replace(/[^\x20-\x7e]/g, "_")}"; filename*=UTF-8''${encodeURIComponent(ad)}`,
  } });
}
