/* KESİN PDF — belge çizicinin (belge.ts) çıktısı başsız Chromium'da A4 PDF'e basılır (KOD-GECIS: HTML'den PDF'e başsız Chromium; pkproje
   §4.2 "PDF sunucuda üretilir"). Önizlemeyle aynı çizici, aynı CSS; yazı tipi (Carlito) ve fotoğraflar veri adresi olarak gömülüdür — sayfa
   hiçbir dış kaynağa gitmez (ağ istekleri ayrıca kesilir). Chromium: PROBATA_CHROMIUM verilmişse o; Vercel'de @sparticuz/chromium (sunucusuz
   ortam için paketlenmiş Chromium 153, playwright-core 1.63 ile aynı sürüm); öteki yerde Playwright'ın indirdiği Chromium (CI, geliştirme).
   Sunucu tarafı yalnız (node:fs). */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { chromium, type Browser } from "playwright-core";
import type { ReactNode } from "react";
import { raporBelgesi } from "./belge.ts";
import { faturaBelgesi, type FaturaBelgesiVerisi } from "./fatura.ts";
import { talepFormu, type TalepFormuVerisi } from "./talep.ts";
import { teklifBelgesi, type TeklifBelgesiVerisi } from "./teklif.ts";
import { htmlYaz } from "./html.ts";
import type { BelgeVerisi } from "./veri.ts";

/** belge dosyaları proje kökünden (Vercel'de next.config.ts outputFileTracingIncludes ile izlenir) */
const KOK = join(process.cwd(), "src", "belge");
let css: string | null = null;
/** belge.css; yazı tipi adresleri veri adresine çevrilmiş (PDF sayfası dışarıya gitmez) */
export function belgeCss(): string {
  css ??= readFileSync(join(KOK, "belge.css"), "utf8").replace(/url\("\.\/(carlito-5\.3\.0\/[a-z0-9-]+\.woff2)"\)/g,
    (_t, ad: string) => `url("data:font/woff2;base64,${readFileSync(join(KOK, ad)).toString("base64")}")`);
  return css;
}
const kac = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#x27;" })[c]!);

/** PDF'e basılan tam HTML belgesi (betik yok): başlık + belge ağacı (rapor ya da teklif belgesi — aynı CSS) */
export function sayfaHtml(baslik: string, agac: ReactNode): string {
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>${kac(baslik)}</title><style>${belgeCss()}</style></head>`
    + `<body>${htmlYaz(agac)}</body></html>`;
}
export const belgeHtml = (v: BelgeVerisi) => sayfaHtml(v.no, raporBelgesi(v));

async function tarayici(): Promise<Browser> {
  if (process.env.PROBATA_CHROMIUM) return chromium.launch({ executablePath: process.env.PROBATA_CHROMIUM });
  if (process.env.VERCEL) {
    const s = (await import("@sparticuz/chromium")).default;
    return chromium.launch({ executablePath: await s.executablePath(), args: s.args, headless: true });
  }
  return chromium.launch();
}

/** belgenin PDF'i (A4, arka plan renkleriyle). Her çağrı kendi tarayıcısını açar ve kapatır (sunucusuz ortamda paylaşılmaz). */
export const belgePdf = (v: BelgeVerisi) => htmlPdf(belgeHtml(v));
/** teklif belgesinin PDF'i (325) — aynı motor, aynı CSS */
export const teklifPdf = (v: TeklifBelgesiVerisi) => htmlPdf(sayfaHtml(v.no, teklifBelgesi(v)));
/** fatura özeti (340): fatura e-Fatura programında kesilir; bu belge kalemleri, KDV'yi ve tahsilatı özetler */
export const faturaPdf = (v: FaturaBelgesiVerisi) => htmlPdf(sayfaHtml(`${v.no} fatura özeti`, faturaBelgesi(v)));
/** talep formu (341): izin talep formu ya da masraf formu, temel format */
export const talepPdf = (v: TalepFormuVerisi) => htmlPdf(sayfaHtml(v.no, talepFormu(v)));

async function htmlPdf(html: string): Promise<Uint8Array> {
  const b = await tarayici();
  try {
    const s = await b.newPage();
    await s.route("**/*", (r) => r.abort());   // dış kaynak yok: her şey gömülü
    await s.setContent(html, { waitUntil: "load" });
    await s.evaluate(() => document.fonts.ready.then(() => undefined));
    return new Uint8Array(await s.pdf({ format: "A4", printBackground: true, preferCSSPageSize: true }));
  } finally {
    await b.close();
  }
}
