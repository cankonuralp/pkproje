/* CİHAZDA KULLANILAN YER — saf hesap (2026-11-12; reisim: "sahada veri fotoğraf yazı vs kaybolmamalı kesinlikle"). Tarayıcı bu siteye sınırlı yer
   ayırır; dolarsa bağlantısızken yazılan iş cihaza yazılamaz. Gösterge sahaya çıkmadan söyler: kalan yer DAR_BAYT'ın altına inerse ya da
   kullanım DAR_YUZDE'yi geçerse "dar". Ekran: Cevrimdisi.tsx. */
export const DAR_BAYT = 100 * 1024 * 1024;
export const DAR_YUZDE = 80;

export interface YerDurumu { yuzde: number; kalan: number; dar: boolean }
export function yerDurumu(kullanilan: number, kota: number): YerDurumu | null {
  if (!Number.isFinite(kullanilan) || !Number.isFinite(kota) || kota <= 0 || kullanilan < 0) return null;
  const kalan = Math.max(0, kota - kullanilan), yuzde = Math.min(100, Math.round((kullanilan / kota) * 100));
  return { yuzde, kalan, dar: kalan < DAR_BAYT || yuzde >= DAR_YUZDE };
}

/** "38 MB", "1,2 GB" (1 MB'ın altı "1 MB'tan az") */
export function boyutYaz(bayt: number): string {
  const mb = bayt / (1024 * 1024);
  if (mb < 1) return "1 MB'tan az";
  if (mb < 1024) return `${Math.round(mb)} MB`;
  return `${(mb / 1024).toFixed(1).replace(".", ",")} GB`;
}
