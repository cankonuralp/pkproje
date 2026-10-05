/* PDF MOTORU ÖLÇÜMÜ — YALNIZ Vercel önizleme dağıtımında (VERCEL_ENV=preview; yayında ve yerelde 404). Araştırma C: "Vercel'de soğuk açılış,
   boyut ve süre ölçülmedi; ilk iş bu ölçüm" (KOD-GECIS §? HTML'den PDF'e başsız Chromium). Uydurma veriyle (src/belge/ornek.ts) Bakanlık
   formatlı bir belge basılır; süre yanıt başlığında. Veritabanına ve oturuma dokunmaz; önizleme dağıtımı Vercel kimlik doğrulamasının arkasındadır. */
import { ornekBelge } from "../../../../belge/ornek";
import { belgePdf } from "../../../../belge/pdf";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET() {
  if (process.env.VERCEL_ENV !== "preview") return new Response("Bulunamadı", { status: 404, headers: { "Cache-Control": "no-store" } });
  const bas = Date.now();
  const pdf = await belgePdf(ornekBelge("ZPKR02"));
  return new Response(Buffer.from(pdf), { status: 200, headers: {
    "Content-Type": "application/pdf", "Cache-Control": "no-store", "X-Olcum-Sure-Ms": String(Date.now() - bas), "X-Olcum-Bayt": String(pdf.length),
  } });
}
