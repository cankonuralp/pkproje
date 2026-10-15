/* TEK İNDİRME UCU (09-A2): GET /api/dosya/{id}[?indir=1]. Oturum yoksa 403 (anonim erişim yok); başka firmanın, çöpteki ya da görme yetkisi
   olmayan kaydın dosyası 404 (varlığı söylenmez). İş mantığı src/server/dosya/ içinde. Müşteri kullanıcısı (0030) aynı uçtan yalnız kendi imzalı
   raporlarının PDF'ini indirir — müşteri rolünde, kısıtlayıcı politikayla.
   568: depo Supabase Storage ise SAYFA AÇILIŞI (yeni sekme, indirme bağlantısı — Sec-Fetch-Dest: document) yetki denetlendikten SONRA Storage'ın 5
   dakikalık imzalı adresine yönlenir (dosya işlevden akmaz); görsel (GizliResim), PDF penceresi ve toplu indirme (fetch / çerçeve) kendi kökenimizden
   akar — CSP ve CORS değişmez. Nesne henüz Storage'da değilse (taşınmamış) içerik buradan akar. */
import { indirmeBasliklari, dosyaIndirilebilir, IMZA_SURESI, musteriDosyasi, sayfaAcilisi } from "../../../../server/dosya/dosya";
import { depo } from "../../../../server/dosya/depo";
import { DOSYA_ERISIMI } from "../../../../server/dosya/erisim";
import { istekOturumu, musteriIslemi, musteriIstekOturumu, oturumIslemi } from "../../../../server/kimlik/istek";

const YOK = () => new Response("Bulunamadı", { status: 404, headers: { "Cache-Control": "no-store", "Content-Type": "text/plain; charset=utf-8" } });

export async function GET(istek: Request, { params }: { params: Promise<{ id: string }> }) {
  const o = await istekOturumu();
  const m = o ? null : await musteriIstekOturumu();
  if (!o && !m) return new Response("Oturum gerekli", { status: 403, headers: { "Cache-Control": "no-store", "Content-Type": "text/plain; charset=utf-8" } });
  const { id } = await params;
  const d = o ? await oturumIslemi(o, (db) => dosyaIndirilebilir(db, o, id, DOSYA_ERISIMI)) : await musteriIslemi(m!, (db) => musteriDosyasi(db, id));
  if (!d) return YOK();
  const kip = new URL(istek.url).searchParams.get("indir") === "1" ? "indir" : "ac";
  const dp = depo();
  if (dp.imzaliAdres && sayfaAcilisi(istek.headers)) {
    const adres = await dp.imzaliAdres(d.anahtar, IMZA_SURESI, kip === "indir" ? d.ad : null);
    if (adres) return new Response(null, { status: 302, headers: { Location: adres, "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" } });
  }
  const bayt = await dp.oku(d.anahtar);
  return new Response(Buffer.from(bayt), { status: 200, headers: indirmeBasliklari({ ...d, boyut: bayt.length }, kip) });
}
