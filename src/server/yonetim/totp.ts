/* DOĞRULAMA KODU (RFC 6238 TOTP; 348 — yönetim sayfasının iki adımlı girişi, KOD-GECIS Y1). Saf: Node'un yerleşik HMAC-SHA1'i, paket yok.
   Telefondaki doğrulama uygulaması (Google Authenticator, Microsoft Authenticator …) aynı anahtardan 30 saniyede bir 6 haneli kod üretir.
   · Anahtar 20 bayt rasgele; kullanıcıya Base32 gösterilir (uygulamaya elle girilir ya da otpauth:// bağlantısıyla eklenir).
   · Saat kayması için bir önceki ve bir sonraki adım da kabul edilir (±30 sn).
   · Aynı kod (ya da daha eskisi) ikinci kez geçmez: kabul edilen adım saklanır, yalnız ondan BÜYÜK adım geçer (yeniden oynatma yok).
   · Karşılaştırma sabit sürede. */
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const ADIM_SN = 30;
const ALFABE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32Yaz(b: Uint8Array): string {
  let bit = 0, deger = 0, s = "";
  for (const x of b) {
    deger = (deger << 8) | x; bit += 8;
    while (bit >= 5) { s += ALFABE[(deger >>> (bit - 5)) & 31]; bit -= 5; }
  }
  if (bit > 0) s += ALFABE[(deger << (5 - bit)) & 31];
  return s;
}

/** Base32 → bayt; boşluk ve küçük harf kabul, geçersiz harf null */
export function base32Oku(s: string): Buffer | null {
  const t = s.replace(/[\s=]/g, "").toUpperCase();
  if (!t || !/^[A-Z2-7]+$/.test(t)) return null;
  let bit = 0, deger = 0;
  const cikti: number[] = [];
  for (const h of t) {
    deger = (deger << 5) | ALFABE.indexOf(h); bit += 5;
    if (bit >= 8) { cikti.push((deger >>> (bit - 8)) & 255); bit -= 8; }
  }
  return Buffer.from(cikti);
}

export const yeniAnahtar = (): string => base32Yaz(randomBytes(20));
export const zamanAdimi = (simdi: Date): number => Math.floor(simdi.getTime() / 1000 / ADIM_SN);

/** verilen adımın 6 haneli kodu (RFC 4226 dinamik kesme) */
export function totpKodu(anahtar: string, adim: number): string {
  const a = base32Oku(anahtar);
  if (!a || a.length < 10) throw new Error("Geçersiz doğrulama anahtarı");
  const sayac = Buffer.alloc(8);
  sayac.writeBigUInt64BE(BigInt(adim));
  const h = createHmac("sha1", a).update(sayac).digest();
  const o = h[h.length - 1] & 15;
  return String((h.readUInt32BE(o) & 0x7fffffff) % 1_000_000).padStart(6, "0");
}

/** kod doğruysa kabul edilen adım; yanlışsa, biçimsizse ya da adım `sonAdim`dan büyük değilse (yeniden oynatma) null */
export function totpDogrula(anahtar: string, kod: string, simdi: Date, sonAdim: number): number | null {
  const k = kod.replace(/\s/g, "");
  if (!/^\d{6}$/.test(k)) return null;
  const su = zamanAdimi(simdi);
  let bulunan: number | null = null;
  for (const adim of [su - 1, su, su + 1]) {
    const dogru = timingSafeEqual(Buffer.from(totpKodu(anahtar, adim)), Buffer.from(k));
    if (dogru && adim > sonAdim && bulunan === null) bulunan = adim;
  }
  return bulunan;
}

/** doğrulama uygulamasına ekleme bağlantısı (otpauth://totp/…); etiket "probata yönetim:<e-posta>" */
export function otpauthAdresi(anahtar: string, eposta: string): string {
  const etiket = encodeURIComponent(`probata yönetim:${eposta}`);
  return `otpauth://totp/${etiket}?secret=${anahtar}&issuer=${encodeURIComponent("probata yönetim")}&algorithm=SHA1&digits=6&period=${ADIM_SN}`;
}
