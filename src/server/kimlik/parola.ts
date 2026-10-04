/* PAROLA ÖZETİ (09-E1) — Node'un yerleşik scrypt'i (bellek-zor; yerel eklenti yok → Windows Uygulama Denetimi engeli yok, KOD-GECIS §2).
   Biçim: scrypt$N$r$p$tuz(base64url)$ozet(base64url). Karşılaştırma sabit sürede (timingSafeEqual). Düz parola hiçbir yere yazılmaz.
   Parametreler OWASP önerisinin üstünde: N=2^15, r=8, p=1, 64 bayt (≈ 32 MB bellek / deneme). */
import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto";

const N = 2 ** 15, R = 8, P = 1, UZUNLUK = 64;
const BELLEK = 128 * N * R * 2;

function turet(parola: string, tuz: Buffer, n: number, r: number, p: number): Promise<Buffer> {
  const ayar: ScryptOptions = { N: n, r, p, maxmem: Math.max(BELLEK, 128 * n * r * 2) };
  return new Promise((coz, reddet) => scrypt(parola.normalize("NFC"), tuz, UZUNLUK, ayar, (h, a) => (h ? reddet(h) : coz(a))));
}

export async function parolaOzeti(parola: string): Promise<string> {
  const tuz = randomBytes(16);
  const ozet = await turet(parola, tuz, N, R, P);
  return `scrypt$${N}$${R}$${P}$${tuz.toString("base64url")}$${ozet.toString("base64url")}`;
}

/** parola özetle eşleşiyor mu (sabit sürede). Bozuk özet → false (hata yutulmaz: biçim dışı özet zaten geçersizdir) */
export async function parolaDogru(parola: string, kayit: string): Promise<boolean> {
  const p = kayit.split("$");
  if (p.length !== 6 || p[0] !== "scrypt") return false;
  const [n, r, pp] = [Number(p[1]), Number(p[2]), Number(p[3])];
  if (![n, r, pp].every(Number.isSafeInteger) || n < 2 ** 14 || n > 2 ** 20) return false;
  const beklenen = Buffer.from(p[5], "base64url");
  const ozet = await turet(parola, Buffer.from(p[4], "base64url"), n, r, pp);
  return beklenen.length === ozet.length && timingSafeEqual(beklenen, ozet);
}

/** e-posta yokken de aynı süre harcansın (hesap var mı yok mu süreden anlaşılmasın) */
let SAHTE: Promise<string> | null = null;
export async function sahteDenetim(parola: string): Promise<void> {
  SAHTE ??= parolaOzeti("sahte-parola-0");
  await parolaDogru(parola, await SAHTE);
}
