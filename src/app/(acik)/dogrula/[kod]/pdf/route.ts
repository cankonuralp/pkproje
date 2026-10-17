/* RAPOR DOĞRULAMA › İMZALI PDF (2026-10-17; reisim: "rapor doğrulama ekranında raporun kendisi de gözüksün"): doğrulama sayfasının içinde çizilen
   imzalı rapor. Oturum istemez; kapı doğrulama kodu + sayfanın verdiği KISA ÖMÜRLÜ jeton (src/server/dogrulama.ts pdfJetonu — kalıcı herkese açık
   dosya bağlantısı yok, anayasa 5.1). Kod / jeton tutmazsa, rapor imzasızsa, PDF saklama süresi dolup silindiyse 404 (neden söylenmez).
   Önbelleğe yazılmaz, arama motoruna kapalı. */
import { dogrulamaPdfi } from "../../../../../modules/raporlar/server/dogrula-sayfa";
import { istekKiracisi } from "../../../../../server/kiraci/istek";

export const runtime = "nodejs";
const KAPALI = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };

export async function GET(istek: Request, { params }: { params: Promise<{ kod: string }> }) {
  const { kod } = await params;
  const jeton = new URL(istek.url).searchParams.get("t") ?? "";
  let pdf: Uint8Array | null = null;
  try { pdf = await dogrulamaPdfi(await istekKiracisi(), decodeURIComponent(kod), jeton); } catch { pdf = null; }
  if (!pdf) return new Response("Bulunamadı", { status: 404, headers: { ...KAPALI, "Content-Type": "text/plain; charset=utf-8" } });
  return new Response(Buffer.from(pdf), { status: 200, headers: {
    ...KAPALI, "Content-Type": "application/pdf", "Content-Length": String(pdf.length), "Content-Disposition": "inline", "X-Content-Type-Options": "nosniff",
  } });
}
