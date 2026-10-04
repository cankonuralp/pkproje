/* TEK İNDİRME UCU (09-A2): GET /api/dosya/{id}[?indir=1]. Oturum yoksa 403 (anonim erişim yok); başka firmanın, çöpteki ya da görme yetkisi
   olmayan kaydın dosyası 404 (varlığı söylenmez). İş mantığı src/server/dosya/ içinde. */
import { indirmeBasliklari, dosyaIndirilebilir } from "../../../../server/dosya/dosya";
import { depo } from "../../../../server/dosya/depo";
import { DOSYA_ERISIMI } from "../../../../server/dosya/erisim";
import { istekOturumu, oturumIslemi } from "../../../../server/kimlik/istek";

const YOK = () => new Response("Bulunamadı", { status: 404, headers: { "Cache-Control": "no-store", "Content-Type": "text/plain; charset=utf-8" } });

export async function GET(istek: Request, { params }: { params: Promise<{ id: string }> }) {
  const o = await istekOturumu();
  if (!o) return new Response("Oturum gerekli", { status: 403, headers: { "Cache-Control": "no-store", "Content-Type": "text/plain; charset=utf-8" } });
  const { id } = await params;
  const d = await oturumIslemi(o, (db) => dosyaIndirilebilir(db, o, id, DOSYA_ERISIMI));
  if (!d) return YOK();
  const bayt = await depo().oku(d.anahtar);
  const kip = new URL(istek.url).searchParams.get("indir") === "1" ? "indir" : "ac";
  return new Response(Buffer.from(bayt), { status: 200, headers: indirmeBasliklari({ ...d, boyut: bayt.length }, kip) });
}
