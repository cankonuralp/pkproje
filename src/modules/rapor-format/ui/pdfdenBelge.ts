/* BELGENİN PDF'İNDEN ŞABLON — TEK ADIM (2026-10-31, S.A.Y belge formatları; reisim: "önerdiklerini kabul ediyorum"): Firma ayarları › Belge formatları'ndaki
   "Basılı formdan kur" ile AYNI yol, pencere olmadan — PDF tarayıcıda okunur (pdfOku.ts — yapay zekâsız), okunan ızgaradan belgenin taslağı kurulur
   (belgeBasilidanKurEylemi; PDF saklanmaz — belgenin formatı tanımın kendisi). Kurucuya geçmek çağıranda. Yalnız tarayıcıda. */
import type { BelgeTuru } from "../../../belge/katalog";
import { belgeBasilidanKurEylemi } from "./belge-eylemler";
import { pdfdenHam, pdfOkumaHatasi } from "./pdfOku";

export type PdfdenBelgeSonucu = { tamam: true; taslak: string; uyarilar: string[] } | { tamam: false; neden: string };

export async function pdfdenBelgeKur(belge: BelgeTuru, dosya: File, taslakSurumu: number | null): Promise<PdfdenBelgeSonucu> {
  let ham: Awaited<ReturnType<typeof pdfdenHam>>;
  try { ham = await pdfdenHam(await dosya.arrayBuffer()); } catch (e) { return { tamam: false, neden: `PDF okunamadı: ${pdfOkumaHatasi(e)}` }; }
  let r: Awaited<ReturnType<typeof belgeBasilidanKurEylemi>>;
  try { r = await belgeBasilidanKurEylemi(belge, ham, taslakSurumu); } catch { return { tamam: false, neden: "Şablon kurulamadı." }; }
  if (!r.tamam || !r.id) return { tamam: false, neden: `Şablon kurulamadı: ${r.genel ?? (Object.values(r.hatalar ?? {}).join(" ") || "bilinmeyen neden")}` };
  return { tamam: true, taslak: r.id, uyarilar: r.uyarilar ?? [] };
}
