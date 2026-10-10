/* Uçtan uca testler (K0, 2026-10-03; KOD-GECIS §11: maketin ölçüm denetimleri kodda kabul testi olur).
   · Testler e2e/*.spec.ts — `npm test` (node --test, tests/**) bunlara dokunmaz; `npm run test:e2e` ile koşar.
   · Sunucu: Next geliştirme sunucusu bu projenin yoluyla (scripts/next.ts: telemetri kapalı, webpack), yalnız 127.0.0.1.
   · Tarayıcı: makinede hazır Chromium varsa o (bulut VM'i: /opt/pw-browsers/chromium; ya da PROBATA_CHROMIUM), yoksa
     Playwright'ın kendi indirdiği (CI'da `npx playwright install chromium`). Dış ağa istek yok. */
import { defineConfig, devices } from "@playwright/test";
import { existsSync } from "node:fs";

import { E2E_FIRMA, E2E_KAPI as KAPI } from "./e2e/hesaplar";

/* K1 (2026-10-04): uygulama kiracı ister → testler firma alt alan adında (Chromium *.localhost'u kendisi 127.0.0.1'e çözer). Sunucu geçici
   veritabanıyla açılır (scripts/e2e-sunucu.ts: uydurma iki firma + rol başına hesap). */
const hazir = process.env.PROBATA_CHROMIUM || (existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : undefined);

export default defineConfig({
  testDir: "e2e",
  /* 468: deneme makinesinde site taraması (en ağır test) kendi işinde — parçalar onu dışarıda bırakır, tarama işi yalnız onu koşar; yerelde hepsi */
  ...(process.env.PROBATA_E2E_TARAMA === "haric" ? { testIgnore: ["**/tarama.spec.ts"] } : process.env.PROBATA_E2E_TARAMA === "yalniz" ? { testMatch: ["**/tarama.spec.ts"] } : {}),
  fullyParallel: false,
  workers: 1,
  retries: 0,
  /* CI'da düşen test GitHub'da adıyla not (annotation) olarak görünür — günlük ayrı sunucuda, not API'den okunur (2026-10-03) */
  reporter: process.env.CI ? [["list"], ["github"]] : [["list"]],
  /* sayfalar testlerden önce bir kez derlenir (e2e/hazirla.ts) */
  globalSetup: "./e2e/hazirla.ts",
  /* 2026-10-05: geliştirme sunucusu sunucu eylemini ilk çağrıda derler; CI'da 5 sn'lik varsayılan bekleme bazen yetmiyordu (rapor formatı yükleme
     bildirimi, giriş sonrası kabuk). Beklenen şey aynı, yalnız bekleme süresi geliştirme sunucusunun gecikmesine göre */
  /* 411 görsel karşılaştırma (e2e/gorsel.spec.ts): kayıtlı görüntüler e2e/goruntu/<genişlik>/; hareket kapalı, kenar yumuşatma farkına
     küçük pay (piksellerin %0,5'i) — düzen kayması bundan çok büyüktür */
  expect: { timeout: 15_000, toHaveScreenshot: { animations: "disabled", caret: "hide", maxDiffPixelRatio: 0.005 } },
  snapshotPathTemplate: "{testDir}/goruntu/{projectName}/{arg}{ext}",
  /* 2026-10-06 (CI 696fa0e, f7dc15f): genişlik başına ayrı sunucuda masaüstü ve tablet geçti, telefon 6–8 testte 30 sn'lik test süresini aştı —
     telefonda aynı akış daha çok adım atar (menüyü aç, kaydır; belge onayı telefonda 44 sn, tablette 14 sn) ve geliştirme sunucusu yavaştır.
     Beklentiler ve her adımın beklemesi aynı; yalnız bir testin toplam süresi (Playwright varsayılanı 30 sn) */
  timeout: 120_000,
  use: {
    baseURL: `http://${E2E_FIRMA.kisaAd}.localhost:${KAPI}`,
    /* 2026-10-08 (405): tarayıcının servis çalışanı (cihazda sayfa saklama, public/sw.js) yalnız e2e/cevrimdisi.spec.ts'te açık — öteki testlerde
       saha rolündeki her oturum sayfaların geliştirme kipindeki büyük dosyalarını yeniden indiriyordu; geliştirme sunucusu bellek sınırında
       yeniden başlayıp son testleri düşürüyordu. Uygulama davranışı değişmez (kayıt denemesi reddedilir, uygulama yakalar). */
    serviceWorkers: "block",
    /* 423: düşen testin izi (ağ, konsol, ekran adımları) sonuç dosyasında — anlık hatanın sebebi görülsün */
    trace: "retain-on-failure",
    launchOptions: hazir ? { executablePath: hazir } : {},
  },
  projects: [
    { name: "masaustu", use: { ...devices["Desktop Chrome"], viewport: { width: 1920, height: 1080 } } },
    { name: "tablet", use: { ...devices["Desktop Chrome"], viewport: { width: 1080, height: 1440 } } },
    { name: "telefon", use: { ...devices["Desktop Chrome"], viewport: { width: 375, height: 812 }, hasTouch: true } },
  ],
  webServer: {
    command: "node scripts/e2e-sunucu.ts",
    url: `http://127.0.0.1:${KAPI}/giris`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: { NEXT_TELEMETRY_DISABLED: "1" },
  },
});
