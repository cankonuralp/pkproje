/* BULUT YEDEK İSTEMCİSİ — hizmeti seçer (Google Drive / OneDrive); ortak türler ve kurallar bulut-ortak.ts başlığında. */
import { googleHizmeti } from "./bulut-google.ts";
import { onedriveHizmeti } from "./bulut-onedrive.ts";
import type { BulutAyari, BulutHizmeti } from "./bulut-ortak.ts";

export * from "./bulut-ortak.ts";

export function bulutHizmeti(a: BulutAyari, s: { bekle?: (ms: number) => Promise<void> } = {}): BulutHizmeti {
  const bekle = s.bekle ?? ((ms: number) => new Promise<void>((coz) => setTimeout(coz, ms)));
  return a.saglayici === "gdrive" ? googleHizmeti(a, bekle) : onedriveHizmeti(a, bekle);
}

