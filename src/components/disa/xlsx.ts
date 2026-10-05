/* EXCEL (.xlsx) YAZICI (tek üretici; maket maket-ortak.js xlsxYaz'ın karşılığı — 2026-10-01 Ö3, reisim: "excel de link olmalı, linke tıklayınca
   ilgili rapor açılmalı. "rapor" yazsın"). Saf: tarayıcıda (müşteri panelinin zaten aldığı veriden) ve sunucuda aynı. İlk satır başlık (kalın,
   dondurulmuş). Hücre: metin · sayı · boş · { metin, url } bağlantı.
   Güvenlik: metin hücreleri satır içi dizgi (inlineStr) — Excel formül olarak HESAPLAMAZ ("=..." ile başlayan veri de düz metin kalır); XML'de
   geçersiz denetim karakterleri atılır; bağlantı yalnız http(s) adresi (javascript:, file: vb. düz metin yazılır) ve gerçek köprü (formül değil). */
import { zipBayt } from "./zip.ts";

export type XlsxHucre = string | number | null | undefined | { metin: string; url: string };

const DENETIM = /[\u0000-\u0008\u000b\u000c\u000e-\u001f￾￿]/g;
export const xmlKacis = (v: string) => v.replace(DENETIM, "").replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" })[c]!);
const sutunAdi = (i: number) => { let s = ""; i++; while (i) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; };
/** köprü yalnız http(s) */
export const guvenliUrl = (u: string) => { try { const x = new URL(u); return x.protocol === "https:" || x.protocol === "http:" ? x.href : null; } catch { return null; } };
/** sayfa adı: en çok 31 karakter, Excel'in yasakladığı karakterler yok */
const sayfaAdi = (s: string) => s.replace(/[[\]:*?/\\]/g, " ").replace(DENETIM, "").trim().slice(0, 31) || "Sayfa1";

export function xlsxBayt(sayfa: string, satirlar: readonly (readonly XlsxHucre[])[]): Uint8Array {
  const kopruler: { ref: string; url: string }[] = [];
  const genislik: number[] = [];
  const govde = satirlar.map((satir, ri) => `<row r="${ri + 1}">${satir.map((h, ci) => {
    const ref = `${sutunAdi(ci)}${ri + 1}`;
    const metin = h === null || h === undefined ? "" : typeof h === "object" ? h.metin : String(h);
    genislik[ci] = Math.max(genislik[ci] ?? 8, Math.min(60, metin.length + 2));
    if (h && typeof h === "object") {
      const url = guvenliUrl(h.url);
      if (url) {
        kopruler.push({ ref, url });
        return `<c r="${ref}" t="inlineStr" s="2"><is><t>${xmlKacis(h.metin || url)}</t></is></c>`;
      }
    }
    if (typeof h === "number" && Number.isFinite(h)) return `<c r="${ref}"><v>${h}</v></c>`;
    return `<c r="${ref}" t="inlineStr"${ri === 0 ? ' s="1"' : ""}><is><t xml:space="preserve">${xmlKacis(metin)}</t></is></c>`;
  }).join("")}</row>`).join("");
  const sutunlar = genislik.length ? `<cols>${genislik.map((g, i) => `<col min="${i + 1}" max="${i + 1}" width="${g}" customWidth="1"/>`).join("")}</cols>` : "";
  const dondur = satirlar.length > 1 ? '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>' : "";
  const koprulerXml = kopruler.length ? `<hyperlinks>${kopruler.map((k, i) => `<hyperlink ref="${k.ref}" r:id="rIdK${i + 1}"/>`).join("")}</hyperlinks>` : "";
  const XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
  const ILISKI = "http://schemas.openxmlformats.org/package/2006/relationships";
  const BELGE = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
  const ANA = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
  return zipBayt([
    ["[Content_Types].xml", `${XML}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`],
    ["_rels/.rels", `${XML}<Relationships xmlns="${ILISKI}"><Relationship Id="rId1" Type="${BELGE}/officeDocument" Target="xl/workbook.xml"/></Relationships>`],
    ["xl/workbook.xml", `${XML}<workbook xmlns="${ANA}" xmlns:r="${BELGE}"><sheets><sheet name="${xmlKacis(sayfaAdi(sayfa))}" sheetId="1" r:id="rId1"/></sheets></workbook>`],
    ["xl/_rels/workbook.xml.rels", `${XML}<Relationships xmlns="${ILISKI}"><Relationship Id="rId1" Type="${BELGE}/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="${BELGE}/styles" Target="styles.xml"/></Relationships>`],
    ["xl/styles.xml", `${XML}<styleSheet xmlns="${ANA}"><fonts count="3"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font><font><u/><sz val="11"/><color rgb="FF0563C1"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`],
    ["xl/worksheets/sheet1.xml", `${XML}<worksheet xmlns="${ANA}" xmlns:r="${BELGE}">${dondur}${sutunlar}<sheetData>${govde}</sheetData>${koprulerXml}</worksheet>`],
    ...(kopruler.length ? [["xl/worksheets/_rels/sheet1.xml.rels", `${XML}<Relationships xmlns="${ILISKI}">${kopruler.map((k, i) =>
      `<Relationship Id="rIdK${i + 1}" Type="${BELGE}/hyperlink" Target="${xmlKacis(k.url)}" TargetMode="External"/>`).join("")}</Relationships>`] as const] : []),
  ]);
}

export const XLSX_TURU = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
