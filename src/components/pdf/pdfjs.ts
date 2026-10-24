/* PDF.JS YÜKLEYİCİ (2026-10-24) — pdf.js tek yerden: dinamik içe aktarma (yalnız gereken ekranda iner), işçi kendi kökenimizden (CSP worker-src
   'self'), sayfa başına bir kez kurulur. Belge her zaman aynı güvenli seçeneklerle açılır: dizgi değerlendirme (eval) kapalı, XFA kapalı, günlük
   kapalı. Kullananlar: PDF görünümü (PdfGorunumu — müşteri paneli raporu) ve basılı formun okunması (rapor-format/ui/pdfOku.ts). Yalnız tarayıcıda. */

export type Pdfjs = typeof import("pdfjs-dist/legacy/build/pdf.mjs");

/** belge açılırken her zaman */
export const PDF_ACMA = { isEvalSupported: false, enableXfa: false, verbosity: 0 } as const;

/** pdf.js modülü; işçi ilk çağrıda kurulur */
export async function pdfjsYukle(): Promise<Pdfjs> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  if (!pdfjs.GlobalWorkerOptions.workerPort) {
    pdfjs.GlobalWorkerOptions.workerPort = new Worker(new URL("pdfjs-dist/legacy/build/pdf.worker.min.mjs", import.meta.url), { type: "module" });
  }
  return pdfjs;
}
