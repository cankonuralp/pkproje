/* VİTRİN KAPISI — geliştirme vitrini yalnız geliştirmede açık; yayında 404 (2026-10-04). 489 (reisim 2026-10-11, hata listesi 43 kararı — "denemeleri yayındaki gibi derlenmiş uygulamada koşmak"): uçtan uca deneme yayın derlemesinde
   koşar; YALNIZ o ortamda (PROBATA_E2E_YAYIN=1, scripts/e2e-sunucu.ts) ve YALNIZ yerel adreste (*.localhost / 127.0.0.1) de açık: e2e/bilesenler, liste, bilgi-form, hata
   vitrini ölçer. İstek adresi yerel değilse bayrak olsa da kapalı; canlıda duman testi /vitrin'in 404 olduğunu denetler (tools/duman.mjs). */
import { headers } from "next/headers";

export async function vitrinAcik(): Promise<boolean> {
  if (process.env.NODE_ENV !== "production") return true;
  if (process.env.PROBATA_E2E_YAYIN !== "1") return false;
  const alan = ((await headers()).get("host") ?? "").replace(/:\d+$/, "");
  return /(^|\.)localhost$|^127\.0\.0\.1$/.test(alan);
}
