/* HAZIR ŞABLON · BAKANLIĞIN RESMÎ FORMU (437; reisim 2026-10-09: "RAPOR FORMATI PDFLERİ DE STANDART OLARAK BAKANLIKTAN GELECEK") — Bakanlık
   formatlı şablonun resmî rapor formu (ZPKR… PDF'i, src/server/bakanlik.ts), tarayıcıda açılır. Oturum yoksa 403; Ekipman türleri'ni göremeyene,
   kitaplıkta olmayan ya da Bakanlık formatı olmayan şablona 404. */
import { modulBul } from "../../../../../../modules/moduller";
import { sablonBul } from "../../../../../../modules/rapor-format/sema";
import { bakanlikBelgesiMi, bakanlikPdfYaniti } from "../../../../../../server/bakanlik";
import { istekOturumu, modulGorur } from "../../../../../../server/kimlik/istek";
import type { ModulAnahtari } from "../../../../../../server/yetki/tanim";

export const runtime = "nodejs";
const MODUL = modulBul("ekipman-turleri")!;
const DUZ = { "Cache-Control": "no-store", "Content-Type": "text/plain; charset=utf-8" };

export async function GET(_istek: Request, { params }: { params: Promise<{ anahtar: string }> }) {
  const o = await istekOturumu();
  if (!o) return new Response("Oturum gerekli", { status: 403, headers: DUZ });
  const s = sablonBul((await params).anahtar);
  const kod = s?.bakanlik ? s.tanim.gorunum.formKodu : "";
  if (!modulGorur(o, MODUL.no as ModulAnahtari) || !bakanlikBelgesiMi(kod)) return new Response("Bulunamadı", { status: 404, headers: DUZ });
  return bakanlikPdfYaniti(kod);
}
