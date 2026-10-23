/* WORD (.docx) BELGESİNİN METNİ — saf, yalnız sunucu (498 "Belgeden başlat"; maket: "firmanın PDF / Word / fotoğraf formatından taslak"). Yapay zekâ
   Word'ü doğrudan okumaz; belgenin METNİ (paragraflar, tablo satırları "|" ile) gider. Belge saklanmaz.
   · .docx bir ZIP: merkez dizinden "word/document.xml" bulunur (başka ZIP — xlsx vb. — kabul edilmez), açılır (node:zlib, ek paket yok).
   · ZIP bombasına karşı: bildirilen açık boy ve açarken üst sınır (ACIK_SINIR); ZIP64, şifreli girdi, bilinmeyen sıkıştırma reddedilir.
   · XML'den yalnız metin: <w:t> içerikleri, paragraf / satır sonu, sekme, tablo hücresi; varlıklar çözülür; en çok METIN_SINIRI karakter. */
import { inflateRawSync } from "node:zlib";

const ACIK_SINIR = 8 << 20;
export const METIN_SINIRI = 40_000;

const u16 = (b: Uint8Array, i: number) => b[i] | (b[i + 1] << 8);
const u32 = (b: Uint8Array, i: number) => (b[i] | (b[i + 1] << 8) | (b[i + 2] << 16) | (b[i + 3] << 24)) >>> 0;

/** ZIP'ten tek girdinin açılmış baytları; yoksa / bozuksa / sınırı aşıyorsa null */
function zipGirdisi(b: Uint8Array, ad: string): Uint8Array | null {
  if (b.length < 22 || u32(b, 0) !== 0x04034b50) return null;
  let eocd = -1;
  for (let i = b.length - 22; i >= Math.max(0, b.length - 65_557); i--) if (u32(b, i) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) return null;
  const sayi = u16(b, eocd + 10), cd = u32(b, eocd + 16);
  if (sayi === 0xffff || cd === 0xffffffff || cd >= b.length) return null;
  let p = cd;
  for (let n = 0; n < sayi && p + 46 <= b.length; n++) {
    if (u32(b, p) !== 0x02014b50) return null;
    const bayrak = u16(b, p + 8), yontem = u16(b, p + 10), kapali = u32(b, p + 20), acik = u32(b, p + 24);
    const adBoy = u16(b, p + 28), ek = u16(b, p + 30), yorum = u16(b, p + 32), yerel = u32(b, p + 42);
    const girdi = Buffer.from(b.subarray(p + 46, p + 46 + adBoy)).toString("utf8");
    p += 46 + adBoy + ek + yorum;
    if (girdi !== ad) continue;
    if (bayrak & 1 || acik > ACIK_SINIR || kapali === 0xffffffff || yerel + 30 > b.length || u32(b, yerel) !== 0x04034b50) return null;
    const bas = yerel + 30 + u16(b, yerel + 26) + u16(b, yerel + 28);
    if (bas + kapali > b.length) return null;
    const veri = b.subarray(bas, bas + kapali);
    if (yontem === 0) return veri.length <= ACIK_SINIR ? veri : null;
    if (yontem !== 8) return null;
    try { return inflateRawSync(veri, { maxOutputLength: ACIK_SINIR }); } catch { return null; }
  }
  return null;
}

const VARLIK: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: "\"", apos: "'" };
const coz = (s: string) => s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (t, v: string) => {
  if (v[0] === "#") { const n = v[1] === "x" || v[1] === "X" ? Number.parseInt(v.slice(2), 16) : Number(v.slice(1)); return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : ""; }
  return VARLIK[v.toLowerCase()] ?? t;
});

/** .docx'in metni; Word belgesi değilse ya da okunamazsa null. sinir: en çok karakter (2026-10-23: S.A.Y'ın eki sınırsız — Infinity) */
export function wordMetni(b: Uint8Array, sinir = METIN_SINIRI): string | null {
  const x = zipGirdisi(b, "word/document.xml");
  if (!x) return null;
  const xml = Buffer.from(x).toString("utf8");
  if (!xml.includes("<w:document")) return null;
  /* yalnız metin parçaları ve yapı işaretleri sırayla: <w:t> içeriği · sekme · satır sonu · paragraf sonu (hücre içinde boşluk) · hücre ayırıcı ·
     satır sonu */
  let metin = "", hucre = 0;
  for (const m of xml.matchAll(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>|<w:tab\/>|<w:br[^>]*\/>|<w:tc(?:\s[^>]*)?>|<\/w:p>|<\/w:tc>|<\/w:tr>/g)) {
    const t = m[0];
    if (m[1] !== undefined) metin += m[1];
    else if (t === "<w:tab/>") metin += "\t";
    else if (t.startsWith("<w:tc")) hucre++;
    else if (t === "</w:tc>") { hucre = Math.max(0, hucre - 1); metin += " | "; }
    else if (t === "</w:p>" && hucre) metin += " ";
    else metin += "\n";
    if (metin.length > sinir * 2) break;
  }
  const temiz = coz(metin)
    .replace(/[\u0002-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .split("\n").map((s) => s.replace(/[ \t]+/g, " ").replace(/^\s*\|\s*|\s*\|\s*$/g, "").trim()).filter(Boolean).join("\n");
  return temiz.slice(0, sinir);
}
