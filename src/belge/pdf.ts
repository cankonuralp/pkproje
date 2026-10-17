/* KESİN PDF — belge çizicinin (belge.ts) çıktısı başsız Chromium'da A4 PDF'e basılır (KOD-GECIS: HTML'den PDF'e başsız Chromium; pkproje
   §4.2 "PDF sunucuda üretilir"). Önizlemeyle aynı çizici, aynı CSS; yazı tipi (Carlito) ve fotoğraflar veri adresi olarak gömülüdür — sayfa
   hiçbir dış kaynağa gitmez (ağ istekleri ayrıca kesilir). Chromium: PROBATA_CHROMIUM verilmişse o; Vercel'de @sparticuz/chromium (sunucusuz
   ortam için paketlenmiş Chromium 153, playwright-core 1.63 ile aynı sürüm); öteki yerde Playwright'ın indirdiği Chromium (CI, geliştirme).
   Sunucu tarafı yalnız (node:fs). */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { chromium, type Browser } from "playwright-core";
import type { ReactNode } from "react";
import { aracTutanagi, type AracTutanagiVerisi } from "./arac.ts";
import { egitimFormu, type EgitimFormuVerisi } from "./egitim.ts";
import { belgeAltYazisi, raporBelgesi } from "./belge.ts";
import { imzaAlaniKoy, type EimzaYeri } from "./eimza.ts";
import { EIMZA_KUTU, EIMZA_KUTU_2, type FormatTanimi } from "../format/tanim.ts";
import { sahaFormu, type SahaFormuVerisi } from "./saha.ts";
import { faturaBelgesi, type FaturaBelgesiVerisi } from "./fatura.ts";
import { talepFormu, type TalepFormuVerisi } from "./talep.ts";
import { teklifBelgesi, type TeklifBelgesiVerisi } from "./teklif.ts";
import { zimmetFormu, type ZimmetFormuVerisi } from "./zimmet.ts";
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

/** PDF'e basılan tam HTML belgesi (betik yok): başlık + belge ağacı (rapor ya da teklif belgesi — aynı CSS); ekCss belgeye özgü sayfa ayarı */
export function sayfaHtml(baslik: string, agac: ReactNode, ekCss = ""): string {
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>${kac(baslik)}</title><style>${belgeCss()}${ekCss}</style></head>`
    + `<body>${htmlYaz(agac)}</body></html>`;
}
/* 595 (madde 26 — reisim: "aşağıyada bu rapor e imzalıdır diye şerit gelecek ona göre format yapıcıda raporlar aşağıda boşluk bırakmayı
   unutmasınlar"): raporun her sayfasının altında ŞERİT için ayrılmış bant — firma unutamaz, içerik bu banda girmez (sonraki sayfaya geçer). Bant
   sayfa kenar boşluğunun içinde: alt bilgi şablonu orada basılır (Chromium displayHeaderFooter). Bakanlık formatlarının alt boşluğu kadar. */
const RAPOR_SAYFA = "@page { margin: 10mm 8mm 20mm 8mm; }";
export const belgeHtml = (v: BelgeVerisi) => sayfaHtml(v.no, raporBelgesi(v), RAPOR_SAYFA);
/** alt bilgi şablonunun yazı tipi: belge.css'in Carlito Latin / Latin genişletilmiş 400 alt kümeleri (şablon ayrı belgede çizilir; sunucusuz
    Chromium'da sistem yazı tipi yok) */
let altYazi: string | null = null;
const altYaziTipi = () => (altYazi ??= [...belgeCss().matchAll(/@font-face \{[^}]*font-weight: 400;[^}]*\}/g)].map((m) => m[0]).join(""));
/** her sayfanın altındaki şerit: yazı · rapor no · Sayfa n / N */
export function raporAltBilgisi(v: BelgeVerisi): string {
  const a = belgeAltYazisi(v);
  return `<style>${altYaziTipi()}</style><div style="box-sizing:border-box;width:100%;padding:2mm 8mm 0;`
    + `font:7.5pt/1.3 Carlito,sans-serif;color:#000;display:flex;justify-content:space-between;gap:4mm">`
    + `<span style="border-top:0.6pt solid #000;flex:1;overflow-wrap:anywhere">`
    /* 595 (madde 14): formatın sayfa altı yazısı en çok iki satır (bant 20 mm) */
    + (a.format ? `<span style="display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden">${kac(a.format)}</span>` : "")
    + `${kac(a.metin)}</span>`
    + `<span style="white-space:nowrap">${kac(a.no)} · Sayfa <span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`;
}
/** formatın e-imza yeri — onaylanan (verilmemişse İmza hücresi; kutunun eksik ölçüsü başlangıç değerinden) */
export function eimzaYeri(t: FormatTanimi): EimzaYeri {
  const e = t.gorunum.eimza;
  if (!e || e.yer === "hucre") return { yer: "hucre" };
  if (e.yer === "gorunmez") return { yer: "gorunmez" };
  return { yer: "kutu", x: e.x ?? EIMZA_KUTU.x, y: e.y ?? EIMZA_KUTU.y, en: e.en ?? EIMZA_KUTU.en, boy: e.boy ?? EIMZA_KUTU.boy, ...(e.sayfa === "her" ? { sayfa: "her" as const } : {}) };
}
/** 2026-10-17 (İ5): onaylayanın e-imza yeri (teknik yönetici); verilmemişse null — ikinci alan yok */
export function eimzaYeri2(t: FormatTanimi): EimzaYeri | null {
  const e = t.gorunum.eimza2;
  if (!e) return null;
  if (e.yer === "hucre") return { yer: "hucre" };
  return { yer: "kutu", x: e.x ?? EIMZA_KUTU_2.x, y: e.y ?? EIMZA_KUTU_2.y, en: e.en ?? EIMZA_KUTU_2.en, boy: e.boy ?? EIMZA_KUTU_2.boy, ...(e.sayfa === "her" ? { sayfa: "her" as const } : {}) };
}

/* 454 (canlıda, araç teslim tutanağı PDF'i: "spawn ETXTBSY"): aynı sunucu örneğinde iki PDF aynı anda istenince @sparticuz/chromium ikili
   dosyayı iki kez /tmp'ye açıyor, biri yazılırken öteki çalıştırmaya kalkıyordu. Açma örnek başına BİR kez (paylaşılan söz); çalıştırma yine
   meşgul derse kısa beklemeyle bir kez daha denenir. */
let sunucusuzYol: Promise<{ yol: string; args: string[] }> | null = null;
async function sunucusuz() {
  sunucusuzYol ??= import("@sparticuz/chromium").then(async ({ default: s }) => ({ yol: await s.executablePath(), args: s.args }))
    .catch((h: unknown) => { sunucusuzYol = null; throw h; });
  return sunucusuzYol;
}
const mesgul = (h: unknown) => /ETXTBSY/.test(String((h as Error)?.message ?? h));

async function tarayici(): Promise<Browser> {
  if (process.env.PROBATA_CHROMIUM) return chromium.launch({ executablePath: process.env.PROBATA_CHROMIUM });
  if (process.env.VERCEL) {
    const { yol, args } = await sunucusuz();
    try { return await chromium.launch({ executablePath: yol, args, headless: true }); }
    catch (h) {
      if (!mesgul(h)) throw h;
      await new Promise((tamam) => setTimeout(tamam, 400));
      return chromium.launch({ executablePath: yol, args, headless: true });
    }
  }
  return chromium.launch();
}

/** belgenin PDF'i (A4, arka plan renkleriyle). Her çağrı kendi tarayıcısını açar ve kapatır (sunucusuz ortamda paylaşılmaz). Her sayfanın altında
    şerit (595 madde 26); imzaya hazırlanan (kesin) belgede formatın yerinde boş imza alanı (madde 25, eimza.ts). */
export async function belgePdf(v: BelgeVerisi): Promise<Uint8Array> {
  const pdf = await htmlPdf(belgeHtml(v), raporAltBilgisi(v));
  return v.kesin ? imzaAlaniKoy(pdf, eimzaYeri(v.tanim), eimzaYeri2(v.tanim)) : pdf;
}
/** teklif belgesinin PDF'i (325) — aynı motor, aynı CSS */
export const teklifPdf = (v: TeklifBelgesiVerisi) => htmlPdf(sayfaHtml(v.no, teklifBelgesi(v)));
/** fatura özeti (340): fatura e-Fatura programında kesilir; bu belge kalemleri, KDV'yi ve tahsilatı özetler */
export const faturaPdf = (v: FaturaBelgesiVerisi) => htmlPdf(sayfaHtml(`${v.no} fatura özeti`, faturaBelgesi(v)));
/** talep formu (341): izin talep formu ya da masraf formu, temel format */
export const talepPdf = (v: TalepFormuVerisi) => htmlPdf(sayfaHtml(v.no, talepFormu(v)));
/** araç teslim tutanağı (342): temel format; teslim alan kişiyse imzasına gider (Onaylar › Diğer) */
export const aracTutanagiPdf = (v: AracTutanagiVerisi) => htmlPdf(sayfaHtml(v.no, aracTutanagi(v)));
/** zimmet teslim formu (344): temel format; imzaya gönderilince kişinin Onaylar › Diğer'ine */
export const zimmetPdf = (v: ZimmetFormuVerisi) => htmlPdf(sayfaHtml(v.no ?? "Zimmet teslim formu", zimmetFormu(v)));
/** eğitim katılım formu (345): temel format; katılanın imzasına (Onaylar › Diğer) */
export const egitimPdf = (v: EgitimFormuVerisi) => htmlPdf(sayfaHtml(v.no, egitimFormu(v)));
/** saha formu (2026-10-12): tamamlanan planda; yapılan ekipmanlar + firma onayı imza yerleri — müşterinin ıslak imzalı taraması plana yüklenir */
export const sahaPdf = (v: SahaFormuVerisi) => htmlPdf(sayfaHtml(v.no, sahaFormu(v)));

async function htmlPdf(html: string, altBilgi?: string): Promise<Uint8Array> {
  const b = await tarayici();
  try {
    const s = await b.newPage();
    await s.route("**/*", (r) => r.abort());   // dış kaynak yok: her şey gömülü
    await s.setContent(html, { waitUntil: "load" });
    await s.evaluate(() => document.fonts.ready.then(() => undefined));
    return new Uint8Array(await s.pdf({ format: "A4", printBackground: true, preferCSSPageSize: true,
      ...(altBilgi ? { displayHeaderFooter: true, headerTemplate: "<span></span>", footerTemplate: altBilgi } : {}) }));
  } finally {
    await b.close();
  }
}
