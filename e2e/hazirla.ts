/* UÇTAN UCA HAZIRLIK (2026-10-03, reisim: "Run failed" — 28e4689'da CI'daki uçtan uca adımı düştü, aynı commit main'de geçti; yerelde 177/177).
   Testler Next geliştirme sunucusunda koşar; sayfa ilk istekte derlenir. Yavaş CI makinesinde ilk derleme ilk testin 5 sn'lik beklemesini
   aşabiliyordu. Testlerden önce her sayfa bir kez istenir ve derlenir (bekleme yalnız burada, uzun); testlerin süreleri değişmez. */
import { request, type FullConfig } from "@playwright/test";

const SAYFALAR = ["/", "/planlar", "/vitrin"];

export default async function hazirla(ayar: FullConfig) {
  const kok = ayar.projects[0].use.baseURL!;
  const istek = await request.newContext({ baseURL: kok });
  for (const yol of SAYFALAR) {
    const yanit = await istek.get(yol, { timeout: 180_000 });
    if (!yanit.ok()) throw new Error(`${yol} hazırlanamadı: ${yanit.status()}`);
  }
  await istek.dispose();
}
