/* İMZALI PDF DENETİMİ (317; 315–317 çapraz incelemesi, 2026-10-05) — saf, veritabanısız. İmzalı PDF = hazırlanan imzasız PDF'in KENDİSİ + artımlı
   imza eki (PAdES: özgün baytlar korunur, sonuna yeni nesneler, yeni xref ve trailer eklenir). Ekin kabulü:
   · ilk baytlar imzasız PDF'in kendisi ve ek boş değil;
   · ekte bir NESNE (yorum satırı değil) imza sözlüğü taşır: /Type /Sig + /ByteRange [ + /Contents <;
   · ek, özgün PDF'teki bir nesneyi AKIŞLA yeniden tanımlamaz (sayfa içeriği değiştirilemez) ve özgünde /Contents taşıyan bir nesneyi (sayfa)
     yeniden tanımlıyorsa /Contents başvurusu aynı kalır (imza aracı sayfaya yalnız /Annots — imza alanı — ekler; Catalog'a /AcroForm).
   Kriptografik zincir doğrulaması (sertifika, imza değeri) sonraki fazda; bu denetim görünen içeriğin imza ekiyle değiştirilmesini kapatır. */

const NESNE = /(?:^|[\s>\]])(\d+)\s+(\d+)\s+obj\b([\s\S]*?)\bendobj\b/g;
const latin1 = (b: Uint8Array) => Buffer.from(b.buffer, b.byteOffset, b.byteLength).toString("latin1");
/** yorumları atar (% … satır sonu; parantezli dize içindeki % korunur — yaklaşık, dize kaçışları sayılır) */
function yorumsuz(s: string): string {
  let o = "", dize = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (dize) { o += c; if (c === "\\") { o += s[++i] ?? ""; continue; } if (c === "(") dize++; else if (c === ")") dize--; continue; }
    if (c === "(") { dize = 1; o += c; continue; }
    if (c === "%") { while (i < s.length && s[i] !== "\n" && s[i] !== "\r") i++; o += "\n"; continue; }
    o += c;
  }
  return o;
}
function nesneler(s: string): Map<string, string> {
  const m = new Map<string, string>();
  for (const x of s.matchAll(NESNE)) m.set(x[1], x[3]);
  return m;
}
const icerikRef = (govde: string) => /\/Contents\s*(\d+\s+\d+\s+R|\[[^\]]*\])/.exec(govde)?.[1].replace(/\s+/g, " ") ?? null;

/** imzalı PDF, imzasız PDF'in artımlı imzalanmış hâli mi */
export function imzaliPdfGecerli(imzasiz: Uint8Array, imzali: Uint8Array): boolean {
  if (imzali.length <= imzasiz.length || !Buffer.from(imzali.subarray(0, imzasiz.length)).equals(Buffer.from(imzasiz))) return false;
  const ek = nesneler(yorumsuz(latin1(imzali.subarray(imzasiz.length))));
  const imzaVar = [...ek.values()].some((g) => /\/Type\s*\/Sig\b/.test(g) && /\/ByteRange\s*\[/.test(g) && /\/Contents\s*</.test(g));
  if (!imzaVar) return false;
  const ozgun = nesneler(latin1(imzasiz));
  for (const [no, govde] of ek) {
    const eski = ozgun.get(no);
    if (eski === undefined) continue;
    if (/\bstream\b/.test(govde)) return false;   // özgün nesne akışla değiştirilemez (sayfa içeriği, yazı tipi, görsel)
    const ref = icerikRef(eski);
    if (ref && !/\/Type\s*\/Sig\b/.test(eski) && icerikRef(govde) !== ref) return false;   // sayfanın içerik başvurusu aynı kalır
  }
  return true;
}
