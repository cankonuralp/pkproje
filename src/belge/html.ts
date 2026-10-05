/* BELGE AĞACI → HTML METNİ (kesin PDF için). Next'in sunucu katmanında react-dom/server yok ("not supported in React Server Components");
   belge çizicinin (belge.ts) ürettiği ağaç yalnız düz etiketler, Fragment, metin ve birkaç öznitelikten oluşur — onu React'le BİREBİR aynı
   biçimde yazar (tests/belge.test.ts: renderToStaticMarkup ile eşitlik kilidi). Kaçış: metin ve öznitelik değerinde & < > " ' kaçar; etiket ve
   öznitelik adı yalnız güvenli kalıptan (bilinmeyen bileşen ya da ad → hata, sessizce basılmaz). Olay özniteliği (on…) ve ham HTML
   (dangerouslySetInnerHTML) reddedilir. */
import { Fragment, isValidElement, type ReactNode } from "react";

const KACIS: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#x27;" };
const kac = (s: string) => s.replace(/[&<>"']/g, (c) => KACIS[c]);
const BOS = new Set(["img", "col", "br", "hr", "meta"]);
const AD: Record<string, string> = { className: "class", htmlFor: "for" };   // React'in yazdığı gibi (colSpan olduğu gibi kalır; HTML büyük-küçük harf ayırmaz)
const ETIKET = /^[a-z][a-z0-9]*$/, OZNITELIK = /^[a-zA-Z][a-zA-Z0-9-]*$/;
const stilYaz = (o: Record<string, string | number>) =>
  Object.entries(o).map(([k, v]) => `${k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}:${v}`).join(";");

export function htmlYaz(n: ReactNode): string {
  if (n === null || n === undefined || typeof n === "boolean") return "";
  if (typeof n === "string" || typeof n === "number") return kac(String(n));
  if (Array.isArray(n)) return n.map(htmlYaz).join("");
  if (!isValidElement(n)) throw new Error("Belge ağacında beklenmeyen düğüm.");
  const { children, ...ozellik } = n.props as Record<string, unknown> & { children?: ReactNode };
  if (n.type === Fragment) return htmlYaz(children);
  if (typeof n.type !== "string" || !ETIKET.test(n.type)) throw new Error("Belge ağacında yalnız düz etiket olur.");
  let oz = "";
  for (const [k, v] of Object.entries(ozellik)) {
    if (v === null || v === undefined || v === false) continue;
    const ad = AD[k] ?? k;
    if (!OZNITELIK.test(ad) || /^on/i.test(ad) || k === "dangerouslySetInnerHTML") throw new Error(`Belge ağacında izin verilmeyen öznitelik: ${k}`);
    oz += ` ${ad}="${kac(k === "style" ? stilYaz(v as Record<string, string | number>) : String(v))}"`;
  }
  return BOS.has(n.type) ? `<${n.type}${oz}/>` : `<${n.type}${oz}>${htmlYaz(children)}</${n.type}>`;
}
