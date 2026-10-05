/* KESİN PDF — belge çizicinin (belge.ts) çıktısı başsız Chromium'da A4 PDF'e basılır (KOD-GECIS: HTML'den PDF'e başsız Chromium; pkproje
   §4.2 "PDF sunucuda üretilir"). Önizlemeyle aynı çizici, aynı CSS; yazı tipi (Carlito) ve fotoğraflar veri adresi olarak gömülüdür — sayfa
   hiçbir dış kaynağa gitmez (ağ istekleri ayrıca kesilir). Chromium: PROBATA_CHROMIUM verilmişse o; Vercel'de @sparticuz/chromium (sunucusuz
   ortam için paketlenmiş Chromium 153, playwright-core 1.63 ile aynı sürüm); öteki yerde Playwright'ın indirdiği Chromium (CI, geliştirme).
   Sunucu tarafı yalnız (node:fs). */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { chromium, type Browser } from "playwright-core";
import { raporBelgesi } from "./belge.ts";
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

/** PDF'e basılan tam HTML belgesi (betik yok) */
export function belgeHtml(v: BelgeVerisi): string {
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>${kac(v.no)}</title><style>${belgeCss()}</style></head>`
    + `<body>${htmlYaz(raporBelgesi(v))}</body></html>`;
}

async function tarayici(): Promise<Browser> {
  if (process.env.PROBATA_CHROMIUM) return chromium.launch({ executablePath: process.env.PROBATA_CHROMIUM });
  if (process.env.VERCEL) {
    const s = (await import("@sparticuz/chromium")).default;
    return chromium.launch({ executablePath: await s.executablePath(), args: s.args, headless: true });
  }
  return chromium.launch();
}

/** belgenin PDF'i (A4, arka plan renkleriyle). Her çağrı kendi tarayıcısını açar ve kapatır (sunucusuz ortamda paylaşılmaz). */
export async function belgePdf(v: BelgeVerisi): Promise<Uint8Array> {
  const b = await tarayici();
  try {
    const s = await b.newPage();
    await s.route("**/*", (r) => r.abort());   // dış kaynak yok: her şey gömülü
    await s.setContent(belgeHtml(v), { waitUntil: "load" });
    await s.evaluate(() => document.fonts.ready.then(() => undefined));
    return new Uint8Array(await s.pdf({ format: "A4", printBackground: true, preferCSSPageSize: true }));
  } finally {
    await b.close();
  }
}
