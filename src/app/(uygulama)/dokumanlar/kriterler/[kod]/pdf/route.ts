/* KONTROL KRİTERLERİ · BAKANLIĞIN RESMÎ BELGESİ (437; reisim 2026-10-09: "ÖRNEK PDFLERİ ATMIŞTIM SANA ONLARDA DEFAULT OLARAK GELSİN") — ZPKK… PDF'i
   Bakanlığın yayımladığı hâliyle (src/server/bakanlik.ts), tarayıcıda açılır. Oturum yoksa 403; Dökümanlar'ı göremeyene ve listede olmayan koda 404. */
import { kriterBelgesi } from "../../../../../../tanim/kriterler";
import { modulBul } from "../../../../../../modules/moduller";
import { bakanlikBelgesiMi, bakanlikPdfYaniti } from "../../../../../../server/bakanlik";
import { istekOturumu, modulGorur } from "../../../../../../server/kimlik/istek";
import type { ModulAnahtari } from "../../../../../../server/yetki/tanim";

export const runtime = "nodejs";
const MODUL = modulBul("dokumanlar")!;
const DUZ = { "Cache-Control": "no-store", "Content-Type": "text/plain; charset=utf-8" };

export async function GET(_istek: Request, { params }: { params: Promise<{ kod: string }> }) {
  const o = await istekOturumu();
  if (!o) return new Response("Oturum gerekli", { status: 403, headers: DUZ });
  const { kod } = await params;
  if (!modulGorur(o, MODUL.no as ModulAnahtari) || !kriterBelgesi(kod) || !bakanlikBelgesiMi(kod)) return new Response("Bulunamadı", { status: 404, headers: DUZ });
  return bakanlikPdfYaniti(kod);
}
