/* RAPOR DOĞRULAMA KODU (595 K8 — reisim, sunum 595: "Kanun cümlesi + rapor no + sayfa + doğrulama karekodu"): imzaya hazırlanan PDF'in her
   sayfasının altındaki şeritte karekod → firmanın adresinde /dogrula/<kod>. Kod = rapor kimliği · revizyon · HMAC (ana sır anahtarından, firmaya
   ve revizyona bağlı): tahmin edilemez, başka firmanın adresinde ya da başka revizyonla geçmez; veritabanına yazılmaz (anahtar değişirse eski
   karekodlar "bulunamadı" der). Saf — anahtar dışarıdan da verilir (testler). */
import { createHmac, timingSafeEqual } from "node:crypto";
import { anaAnahtar } from "./ayar/sir.ts";

const MAC_UZUNLUK = 22;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const mac = (anahtar: Buffer, firmaId: string, raporId: string, revizyon: number) =>
  createHmac("sha256", anahtar).update(`probata-dogrulama:${firmaId}:${raporId}:${revizyon}`).digest("base64url").slice(0, MAC_UZUNLUK);

export function dogrulamaKodu(firmaId: string, raporId: string, revizyon: number, anahtar: Buffer = anaAnahtar()): string {
  return `${raporId}.${revizyon}.${mac(anahtar, firmaId, raporId, revizyon)}`;
}

/** kod geçerliyse rapor kimliği ve revizyonu; değilse null (biçim ya da imza tutmuyor — neden söylenmez) */
export function dogrulamaCoz(kod: string, firmaId: string, anahtar: Buffer = anaAnahtar()): { raporId: string; revizyon: number } | null {
  const p = kod.split(".");
  if (p.length !== 3 || !UUID.test(p[0]) || !/^\d{1,3}$/.test(p[1]) || p[2].length !== MAC_UZUNLUK) return null;
  const revizyon = Number(p[1]);
  const beklenen = Buffer.from(mac(anahtar, firmaId, p[0], revizyon)), gelen = Buffer.from(p[2]);
  return gelen.length === beklenen.length && timingSafeEqual(gelen, beklenen) ? { raporId: p[0], revizyon } : null;
}

/** firmanın adresi (kiraci/istek.ts firmaAdresi) + kod */
export const dogrulamaAdresi = (firmaAdresi: string, kod: string) => `${firmaAdresi}/dogrula/${kod}`;
