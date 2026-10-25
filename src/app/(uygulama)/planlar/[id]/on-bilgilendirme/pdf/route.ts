/* ÖN BİLGİLENDİRME FORMU PDF'İ (2026-10-25, belge formatları; reisim: "herhangi bir form ekleme mekaniği bu şekilde çalışmalı aynı araca
   bağlamalıyız"; N1 — "ön bilgilendirme formu her firmanın kendi formatına göre değişir"): planın bilgisiyle. Firmanın yayınladığı format
   (Rapor formatı › Belgeler) önce, öteki belgelerle aynı motorla (src/belge/pdf.ts); format yoksa Firma ayarları'na yüklenen PDF'in kendisi; o da
   yoksa temel format (src/belge/onbilgi.ts). Oturum yoksa 403; planı göremeyene 404 (yetki onBilgiVerisi'nde). İndirilir; önbelleğe alınmaz. */
import { onBilgiPdf } from "../../../../../../belge/pdf";
import { onBilgiVerisi } from "../../../../../../modules/planlar/server/plan-ici";
import { depo } from "../../../../../../server/dosya/depo";
import { istekOturumu, oturumIslemi } from "../../../../../../server/kimlik/istek";

export const runtime = "nodejs";
export const maxDuration = 60;
const DUZ = { "Cache-Control": "no-store", "Content-Type": "text/plain; charset=utf-8" };

export async function GET(_istek: Request, { params }: { params: Promise<{ id: string }> }) {
  const o = await istekOturumu();
  if (!o) return new Response("Oturum gerekli", { status: 403, headers: DUZ });
  const { id } = await params;
  const v = await oturumIslemi(o, (db) => onBilgiVerisi(db, o, id, depo()));
  if (!v) return new Response("Bulunamadı", { status: 404, headers: DUZ });
  const pdf = !v.format && v.yuklu ? await depo().oku(v.yuklu.anahtar) : await onBilgiPdf(v);
  const ad = `${v.projeNo}-on-bilgilendirme-formu.pdf`;
  return new Response(Buffer.from(pdf), { status: 200, headers: {
    "Content-Type": "application/pdf", "Content-Length": String(pdf.length), "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff",
    "Content-Disposition": `attachment; filename="${ad.replace(/[^\x20-\x7e]/g, "_")}"; filename*=UTF-8''${encodeURIComponent(ad)}`,
  } });
}
