/* UÇTAN UCA HAZIRLIK (2026-10-03, reisim: "Run failed" — 28e4689'da CI'daki uçtan uca adımı düştü, aynı commit main'de geçti; yerelde 177/177).
   Testler Next geliştirme sunucusunda koşar; sayfa ilk istekte derlenir. Yavaş CI makinesinde ilk derleme ilk testin 5 sn'lik beklemesini
   aşabiliyordu. Testlerden önce her sayfa bir kez istenir ve derlenir (bekleme yalnız burada, uzun); testlerin süreleri değişmez.
   2026-10-04 (K1): istek firma adresine (Host) gider — Node *.localhost'u çözemeyebilir, bu yüzden 127.0.0.1 + Host başlığı. Oturumsuz
   istek girişe yönlenir; giriş ve vitrin derlenir, uygulama sayfaları ilk girişte derlenir. */
import { request, type FullConfig } from "@playwright/test";
import { E2E_FIRMA, E2E_KAPI } from "./hesaplar";

const SAYFALAR = ["/giris", "/", "/planlar", "/muhasebe", "/vitrin"];

export default async function hazirla(_ayar: FullConfig) {
  const istek = await request.newContext({ baseURL: `http://127.0.0.1:${E2E_KAPI}`, extraHTTPHeaders: { Host: `${E2E_FIRMA.kisaAd}.localhost:${E2E_KAPI}` } });
  for (const yol of SAYFALAR) {
    const yanit = await istek.get(yol, { timeout: 180_000 });
    if (!yanit.ok()) throw new Error(`${yol} hazırlanamadı: ${yanit.status()}`);
  }
  await istek.dispose();
}
