/* PROBATA SIGN ADRESLERİ (2026-11-07, gömülü imza; sign bağlantı rehberi §4 "Sitenizin güvenlik başlığı … frame-src <imza sayfaları kökü>"). SAF ve
   ağsız — ara katman (src/proxy.ts, CSP) da okur, düğüm modülü içe aktarılmaz. sign'ın kökü ayardan (PROBATA_SIGN_UC; yalnız yerel / test taklidi
   değiştirir), firmaların imza sayfaları kökün alt alan adında (https://<kısa ad>.sign.probata.com.tr): adres SABİT YAZILMAZ, kökten türetilir.
   · signKokenleri: CSP frame-src'ye girecek kökenler (kök + firma alt alanları).
   · signSayfasiMi: sign'dan gelen bağlantı (gömülü / yeni sekme / toplu) gerçekten sign'ın sayfası mı — başka adres çerçeveye ve sekmeye açılmaz.
   Kilit tests/sign-gomulu.test.ts. */

export const SIGN_VARSAYILAN = "https://sign.probata.com.tr";
/** sign'ın kökü (sondaki / atılır) */
export const signKoku = (): string => (process.env.PROBATA_SIGN_UC || SIGN_VARSAYILAN).replace(/\/+$/, "");

/** CSP frame-src kökenleri: https kökte kök + bütün firma alt alanları; yerel taklitte (http) yalnız kökün kendisi */
export function signKokenleri(kok: string = signKoku()): string[] {
  let k: URL;
  try { k = new URL(kok); } catch { return []; }
  if (k.protocol === "http:") return /^(127\.0\.0\.1|localhost)$/.test(k.hostname) ? [k.origin] : [];
  return k.protocol === "https:" && /^[a-z0-9.-]+$/.test(k.host) ? [k.origin, `https://*.${k.host}`] : [];
}

/** adres sign'ın sayfası mı: https, kök ya da kökün alt alanı, kullanıcı adı / parola / port yok (yerel taklitte kökün kendisi) */
export function signSayfasiMi(adres: unknown, kok: string = signKoku()): adres is string {
  if (typeof adres !== "string" || adres.length > 4000) return false;
  let a: URL, k: URL;
  try { a = new URL(adres); k = new URL(kok); } catch { return false; }
  if (a.username || a.password) return false;
  if (k.protocol === "http:") return /^(127\.0\.0\.1|localhost)$/.test(k.hostname) && a.origin === k.origin;
  return a.protocol === "https:" && k.protocol === "https:" && !a.port && /^[a-z0-9.-]+$/.test(a.host)
    && (a.host === k.host || a.host.endsWith(`.${k.host}`));
}
