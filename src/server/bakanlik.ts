/* BAKANLIĞIN RESMÎ BELGELERİ (437; reisim 2026-10-09: "RAPOR FORMATI PDFLERİ DE STANDART OLARAK BAKANLIKTAN GELECEK ŞEKİLDE … ÖRNEK PDFLERİ
   ATMIŞTIM SANA ONLARDA DEFAULT OLARAK GELSİN") — ZPKR (periyodik kontrol rapor formatı) ve ZPKK (periyodik kontrol kriterleri) PDF'leri Bakanlığın
   yayımladığı hâliyle src/tanim/bakanlik/<kod>.pdf (kamuya açık mevzuat belgesi; firma verisi değil, site içinde değişmez). Yalnız sunucuda okunur;
   okuyan uçlar next.config.ts izine ekli (yayında dosya pakette olsun). Kod listede değilse dosya yolu kurulmaz. */
import { readFile } from "node:fs/promises";
import { join } from "node:path";

/* 467: mekanik — ZPKR06 / ZPKK06 kule kren, ZPKR07 / ZPKK07 asılı erişim donanımı, ZPMR01 / ZPMK01 ve ZYDR01 / ZYDK01 LPG tankı (2026-10-09'da
   Bakanlık sitesinden indirildi; yazar üst verisi silindi, içerik aynı) */
export const BAKANLIK_BELGELERI = ["ZPKR01", "ZPKR02", "ZPKR03", "ZPKR04", "ZPKR05", "ZPKK01", "ZPKK02", "ZPKK03", "ZPKK04", "ZPKK05",
  "ZPKR06", "ZPKK06", "ZPKR07", "ZPKK07", "ZPMR01", "ZPMK01", "ZYDR01", "ZYDK01"] as const;
export type BakanlikBelgesi = (typeof BAKANLIK_BELGELERI)[number];
export const bakanlikBelgesiMi = (k: string): k is BakanlikBelgesi => (BAKANLIK_BELGELERI as readonly string[]).includes(k);

/** belgenin baytları (PDF) */
export async function bakanlikPdf(kod: BakanlikBelgesi): Promise<Uint8Array> {
  if (!bakanlikBelgesiMi(kod)) throw new Error("Bakanlık belgesi değil");
  return new Uint8Array(await readFile(join(process.cwd(), "src", "tanim", "bakanlik", `${kod}.pdf`)));
}

/** tarayıcıda açılan PDF yanıtı (Görüntüle; indirme değil). Önbellek yalnız tarayıcıda — belge kamuya açık ama uç oturum ister. */
export async function bakanlikPdfYaniti(kod: BakanlikBelgesi): Promise<Response> {
  const pdf = await bakanlikPdf(kod);
  return new Response(Buffer.from(pdf), { status: 200, headers: {
    "Content-Type": "application/pdf", "Content-Length": String(pdf.length), "Cache-Control": "private, max-age=3600", "X-Content-Type-Options": "nosniff",
    "Content-Disposition": `inline; filename="${kod}.pdf"`,
  } });
}
