/* YÖNETİM ADRESİ (348; KOD-GECIS Y1 "ayrı adres") — yönetim sayfası YALNIZ bu adreste açılır (yayında ör. yonetim.probata.com.tr; deneme yayınında
   Vercel'e eklenen ayrı ad; yerelde yonetim.localhost). Adres ortamdan: PROBATA_YONETIM_ALAN (tam ad, kapısız). Tanımlı değilse yönetim sayfası
   HİÇBİR adreste açılmaz. Saf (ara katman da kullanır): veritabanına gitmez. Firma adresi bu ad olamaz (ayrılmış — src/modules/yonetim/sema.ts). */

export const yonetimAlani = (ortam: string | undefined = process.env.PROBATA_YONETIM_ALAN): string | null => {
  const a = (ortam ?? "").trim().replace(/[A-Z]/g, (h) => h.toLowerCase());
  return /^[a-z0-9]([a-z0-9.-]{0,251}[a-z0-9])?$/.test(a) ? a : null;
};

/** Host başlığı yönetim adresi mi (kapı yok sayılır; yalnız A–Z küçültülür — dile bağlı katlama yok, anayasa 5.5) */
export function yonetimAdresiMi(host: string | null | undefined, alan: string | null = yonetimAlani()): boolean {
  if (!alan || !host) return false;
  return host.replace(/:\d+$/, "").replace(/[A-Z]/g, (h) => h.toLowerCase()) === alan;
}
