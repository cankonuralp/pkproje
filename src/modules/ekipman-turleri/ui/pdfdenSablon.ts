/* PDF'TEN ŞABLON — TEK ADIM (2026-10-26, S.A.Y Faz 2 — reisim: "pdf i el ile formata eklemeye çalışıyor tek tek çizmeye çalışıyor halbuki format
   pdf i ekle tuşu var bu yolu bilmeli ve oraya pdf i yüklemeli çok kısa ve kolay bi işlem"): tür sayfasındaki "Format PDF'i yükle · Rapor şablonunu
   bu PDF'e göre kur" ile AYNI yol, pencere olmadan — PDF türün format PDF'i olarak yüklenir (formatYukleEylemi), baytları tarayıcıda okunur
   (rapor-format/ui/pdfOku.ts — yapay zekâsız), okunan ızgaradan şablon taslak olarak kurulur (basilidanKurEylemi). Kurucuya geçmek çağıranda.
   Yalnız tarayıcıda. */
import { basilidanKurEylemi } from "../../rapor-format/ui/eylemler";
import { pdfdenHam, pdfOkumaHatasi } from "../../rapor-format/ui/pdfOku";
import { formatYukleEylemi } from "./eylemler";

export type PdfdenSablonSonucu =
  | { tamam: true; sira: number; taslak: string; uyarilar: string[] }
  | { tamam: false; neden: string; sira?: number };

export async function pdfdenSablonKur(turId: string, dosya: File, taslakSurumu: number | null): Promise<PdfdenSablonSonucu> {
  const f = new FormData();
  f.set("tur", turId);
  f.set("dosya", dosya);
  f.set("not", "");
  let y: Awaited<ReturnType<typeof formatYukleEylemi>>;
  try { y = await formatYukleEylemi(f); } catch { return { tamam: false, neden: "PDF yüklenemedi; bağlantıyı kontrol edip yeniden deneyin." }; }
  if (!y.tamam || !y.sira) return { tamam: false, neden: y.genel ?? (Object.values(y.hatalar ?? {}).join(" ") || "PDF yüklenemedi.") };
  const sira = y.sira;
  let ham: Awaited<ReturnType<typeof pdfdenHam>>;
  try { ham = await pdfdenHam(await dosya.arrayBuffer()); } catch (e) { return { tamam: false, sira, neden: `PDF yüklendi (sürüm ${sira}), okunamadı: ${pdfOkumaHatasi(e)}` }; }
  let r: Awaited<ReturnType<typeof basilidanKurEylemi>>;
  try { r = await basilidanKurEylemi(turId, sira, ham, taslakSurumu); } catch { return { tamam: false, sira, neden: `PDF yüklendi (sürüm ${sira}), şablon kurulamadı.` }; }
  if (!r.tamam || !r.id) return { tamam: false, sira, neden: `PDF yüklendi (sürüm ${sira}), şablon kurulamadı: ${r.genel ?? "bilinmeyen neden"}` };
  return { tamam: true, sira, taslak: r.id, uyarilar: r.uyarilar ?? [] };
}
