/* SÖZLEŞME PDF'İ (2026-10-25, belge doldurma; reisim: "sözleşme vb işleri de yüklediğimde, el ile değiştirilebilir ve doldurulabilir olmalı, bir müşteri
   için sözleşme açtığımda el ile girilmesi gereken yerleri girip öyle gönderebilmeliyim"): firmanın yayınladığı sözleşme formatı (Rapor formatı ›
   Belgeler) elle doldurulan yerleriyle, öteki belgelerle aynı motorla (src/belge/pdf.ts); format yoksa en son yüklenen sözleşme şablonu PDF'inin
   kendisi; o da yoksa temel format (src/belge/sozlesme.ts). Oturum yoksa 403; belgeyi göremeyene 404 (yetki sozlesmeBelgesiVerisi'nde — "gör" / "yaz").
   İndirilir; önbelleğe alınmaz. */
import { sozlesmePdf } from "../../../../../belge/pdf";
import { sozlesmeBelgesiVerisi } from "../../../../../modules/sozlesmeler/server/sozlesmeler";
import { depo } from "../../../../../server/dosya/depo";
import { istekOturumu, oturumIslemi } from "../../../../../server/kimlik/istek";

export const runtime = "nodejs";
export const maxDuration = 60;
const DUZ = { "Cache-Control": "no-store", "Content-Type": "text/plain; charset=utf-8" };

export async function GET(_istek: Request, { params }: { params: Promise<{ id: string }> }) {
  const o = await istekOturumu();
  if (!o) return new Response("Oturum gerekli", { status: 403, headers: DUZ });
  const { id } = await params;
  /* şablonun baytları kiracı işleminde okunur; PDF basımı işlemin dışında */
  const r = await oturumIslemi(o, async (db) => {
    const v = await sozlesmeBelgesiVerisi(db, o, id, depo());
    return v && { v, sablon: v.sablon ? await depo().oku(v.sablon.anahtar, db) : null };
  });
  if (!r) return new Response("Bulunamadı", { status: 404, headers: DUZ });
  const pdf = r.sablon ?? await sozlesmePdf(r.v);
  const ad = `${r.v.no}.pdf`;
  return new Response(Buffer.from(pdf), { status: 200, headers: {
    "Content-Type": "application/pdf", "Content-Length": String(pdf.length), "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff",
    "Content-Disposition": `attachment; filename="${ad.replace(/[^\x20-\x7e]/g, "_")}"; filename*=UTF-8''${encodeURIComponent(ad)}`,
  } });
}
