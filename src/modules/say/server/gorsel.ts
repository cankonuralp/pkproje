/* S.A.Y'IN GÖRÜNTÜ ARAÇLARI (2026-10-31, kalem 3 — E3; sunum "S.A.Y'a tam yetenek", karar 2: sharp). Sunucuda, ekran kapalıyken de:
   · foto_pafta: konuşmadaki fotoğraflar numaralı küçük resimler hâlinde tek görüntüde (en çok 12; karo ≤ 480 px, görüntü ≤ 1600 × 1600) — önce
     hepsine birlikte bakıp ne olduklarını ayırmak için. Numara yazı tipi gerektirmeden (yedi bölmeli çizim) karonun köşesine basılır.
   · foto_goster: tek fotoğraf tam boy (uzun kenar ≤ 1568) ya da bölgesi (0–1 oranlarla) büyütülmüş; gri + otomatik karşıtlık; döndürme —
     küçük yazıyı (etiket, plaka) okumak için.
   Fotoğrafın baytları ekin firmanın deposundaki kopyasından (ek-yukle.ts). Sonuç araç sonucunda görüntü (base64 JPEG) + kısa yazı. */
import sharp from "sharp";
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import type { Depo } from "../../../server/dosya/depo.ts";
import { fotoKopyalari, type FotoKopyasi } from "../../../server/yz/konusma.ts";

export const PAFTA_EN_COK = 12, KARO = 480, PAFTA_SINIR = 1600, GOSTER_SINIR = 1568;
type Icerik = Record<string, unknown>[];
const iki = (n: number) => String(n).padStart(2, "0");

/* yedi bölmeli çizim (yazı tipi yok — sunucuda font bulunmayabilir): a üst, b sağ üst, c sağ alt, d alt, e sol alt, f sol üst, g orta */
const BOLME: Record<string, string> = { "0": "abcdef", "1": "bc", "2": "abged", "3": "abgcd", "4": "fgbc", "5": "afgcd", "6": "afgedc", "7": "abc", "8": "abcdefg", "9": "abcdfg", F: "aefg" };
function etiketSvg(yazi: string): Buffer {
  const w = 22, h = 38, k = 5, ara = 8, pay = 10;
  const rect = (x: number, y: number, ww: number, hh: number) => `<rect x="${x}" y="${y}" width="${ww}" height="${hh}" fill="#ffffff"/>`;
  const harf = (c: string, x0: number) => [...(BOLME[c] ?? "")].map((s) => ({
    a: rect(x0, pay, w, k), b: rect(x0 + w - k, pay, k, h / 2), c: rect(x0 + w - k, pay + h / 2, k, h / 2), d: rect(x0, pay + h - k, w, k),
    e: rect(x0, pay + h / 2, k, h / 2), f: rect(x0, pay, k, h / 2), g: rect(x0, pay + h / 2 - k / 2, w, k),
  })[s as "a"]).join("");
  const gen = pay * 2 + yazi.length * (w + ara) - ara;
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${gen}" height="${h + pay * 2}"><rect width="100%" height="100%" fill="#0f2a3d"/>`
    + [...yazi].map((c, i) => harf(c, pay + i * (w + ara))).join("") + "</svg>");
}

/** paftanın görüntüsü: karolar sütun sütun, her birinin sol üst köşesinde numara */
export async function paftaGoruntusu(fotolar: readonly { etiket: string; bayt: Uint8Array }[], sutun = 4): Promise<Buffer> {
  const n = Math.min(fotolar.length, PAFTA_EN_COK), s = Math.max(1, Math.min(sutun, n, 4)), satir = Math.ceil(n / s);
  const karo = Math.min(KARO, Math.floor(PAFTA_SINIR / Math.max(s, satir)));
  const parcalar: sharp.OverlayOptions[] = [];
  for (let i = 0; i < n; i++) {
    const x = (i % s) * karo, y = Math.floor(i / s) * karo;
    const k = await sharp(fotolar[i]!.bayt).rotate().resize(karo - 4, karo - 4, { fit: "contain", background: "#ffffff" }).jpeg().toBuffer();
    parcalar.push({ input: k, left: x + 2, top: y + 2 }, { input: etiketSvg(fotolar[i]!.etiket.replace(/[^F0-9]/g, "")), left: x + 6, top: y + 6 });
  }
  return sharp({ create: { width: s * karo, height: satir * karo, channels: 3, background: "#d0d0d0" } }).composite(parcalar).jpeg({ quality: 70 }).toBuffer();
}

export interface GosterSecenegi { bolge?: readonly [number, number, number, number]; gelistir?: "yok" | "gri_kontrast"; dondur?: 0 | 90 | 180 | 270 }
/** tek fotoğraf: (varsa) bölge kesilir, uzun kenarı ≤ 1568 olacak biçimde büyütülür / küçültülür; gri + karşıtlık; döndürme */
export async function gosterGoruntusu(bayt: Uint8Array, o: GosterSecenegi = {}): Promise<Buffer> {
  let g = sharp(await sharp(bayt).rotate().toBuffer());
  const m = await g.metadata();
  const W = m.width ?? 0, H = m.height ?? 0;
  if (o.bolge && W && H) {
    const [x0, y0, x1, y1] = o.bolge.map((x) => Math.min(1, Math.max(0, x))) as [number, number, number, number];
    const left = Math.floor(Math.min(x0, x1) * W), top = Math.floor(Math.min(y0, y1) * H);
    const width = Math.max(8, Math.min(W - left, Math.ceil(Math.abs(x1 - x0) * W))), height = Math.max(8, Math.min(H - top, Math.ceil(Math.abs(y1 - y0) * H)));
    g = sharp(await g.extract({ left: Math.min(left, W - 8), top: Math.min(top, H - 8), width, height }).toBuffer());
  }
  g = g.resize(GOSTER_SINIR, GOSTER_SINIR, { fit: "inside", withoutEnlargement: false });
  if (o.gelistir === "gri_kontrast") g = g.grayscale().normalise({ lower: 1, upper: 99 }).toColourspace("b-w");
  if (o.dondur) g = g.rotate(o.dondur);
  return g.jpeg({ quality: 82 }).toBuffer();
}

const gorunt = (b: Buffer) => ({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: b.toString("base64") } });
const yazi = (t: string) => ({ type: "text", text: t });
const FOTO_NO = /^F?(\d{1,4})$/i;

/** foto_pafta aracı: { fotolar?: ["F01", …], sutun?, sayfa? } — fotolar verilmezse konuşmadaki bütün fotoğraflar 12'li paftalara bölünür */
export async function fotoPaftaAraci(db: Sorgulayici, depo: Depo, girdi: unknown): Promise<string | Icerik> {
  const g = (girdi ?? {}) as { fotolar?: unknown; sutun?: unknown; sayfa?: unknown };
  const hepsi = await fotoKopyalari(db);
  if (!hepsi.length) return "Bu konuşmada fotoğraf yok.";
  const istenen = Array.isArray(g.fotolar) && g.fotolar.length
    ? g.fotolar.map((x) => FOTO_NO.exec(String(x).trim())?.[1]).filter((x): x is string => !!x).map(Number) : null;
  const secili = istenen ? hepsi.filter((f) => istenen.includes(f.fno)) : hepsi;
  if (!secili.length) return `İstenen fotoğraflar bu konuşmada yok; fotoğraflar F01–F${iki(hepsi.at(-1)!.fno)}.`;
  const sayfaSayisi = Math.ceil(secili.length / PAFTA_EN_COK), sayfa = Math.min(Math.max(1, Number(g.sayfa) || 1), sayfaSayisi);
  const bu = secili.slice((sayfa - 1) * PAFTA_EN_COK, sayfa * PAFTA_EN_COK);
  const okunan: { etiket: string; bayt: Uint8Array }[] = [], eksik: string[] = [];
  for (const f of bu) {
    const b = await kopyaOku(db, depo, f);
    if (b) okunan.push({ etiket: `F${iki(f.fno)}`, bayt: b }); else eksik.push(`F${iki(f.fno)}`);
  }
  if (!okunan.length) return `Bu fotoğrafların kopyası yok (${eksik.join(", ")}); ekte görülen hâline bak.`;
  const p = await paftaGoruntusu(okunan, Number(g.sutun) || 4);
  return [gorunt(p), yazi(`Pafta ${sayfa}/${sayfaSayisi}: ${okunan.map((x) => x.etiket).join(", ")}${eksik.length ? ` · kopyası yok: ${eksik.join(", ")}` : ""}`
    + `${sayfa < sayfaSayisi ? ` · sonraki: sayfa ${sayfa + 1}` : ""}. Numara karonun sol üst köşesinde.`)];
}

/** foto_goster aracı: { foto: "F05", bolge?: [x0, y0, x1, y1], gelistir?: "yok" | "gri_kontrast", dondur?: 0 | 90 | 180 | 270 } */
export async function fotoGosterAraci(db: Sorgulayici, depo: Depo, girdi: unknown): Promise<string | Icerik> {
  const g = (girdi ?? {}) as { foto?: unknown; bolge?: unknown; gelistir?: unknown; dondur?: unknown };
  const no = Number(FOTO_NO.exec(String(g.foto ?? "").trim())?.[1]);
  const f = (await fotoKopyalari(db)).find((x) => x.fno === no);
  if (!f) return `F${iki(no || 0)} bu konuşmada yok.`;
  const b = await kopyaOku(db, depo, f);
  if (!b) return `F${iki(no)} fotoğrafının kopyası yok; ekte görülen hâline bak.`;
  const bolge = Array.isArray(g.bolge) && g.bolge.length === 4 && g.bolge.every((x) => typeof x === "number" && Number.isFinite(x))
    ? g.bolge as [number, number, number, number] : undefined;
  const dondur = [0, 90, 180, 270].includes(Number(g.dondur)) ? Number(g.dondur) as 0 | 90 | 180 | 270 : 0;
  const r = await gosterGoruntusu(b, { bolge, gelistir: g.gelistir === "gri_kontrast" ? "gri_kontrast" : "yok", dondur });
  return [gorunt(r), yazi(`F${iki(no)} · ${f.ad}${bolge ? ` · bölge ${bolge.map((x) => x.toFixed(2)).join(", ")}` : ""}${g.gelistir === "gri_kontrast" ? " · gri + karşıtlık" : ""}${dondur ? ` · ${dondur}°` : ""}`)];
}

async function kopyaOku(db: Sorgulayici, depo: Depo, f: FotoKopyasi): Promise<Uint8Array | null> {
  if (!f.anahtar) return null;
  try { return await depo.oku(f.anahtar, db); } catch { return null; }
}
