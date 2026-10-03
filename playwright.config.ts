/* Uçtan uca testler (K0, 2026-10-03; KOD-GECIS §11: maketin ölçüm denetimleri kodda kabul testi olur).
   · Testler e2e/*.spec.ts — `npm test` (node --test, tests/**) bunlara dokunmaz; `npm run test:e2e` ile koşar.
   · Sunucu: Next geliştirme sunucusu bu projenin yoluyla (scripts/next.ts: telemetri kapalı, webpack), yalnız 127.0.0.1.
   · Tarayıcı: makinede hazır Chromium varsa o (bulut VM'i: /opt/pw-browsers/chromium; ya da PROBATA_CHROMIUM), yoksa
     Playwright'ın kendi indirdiği (CI'da `npx playwright install chromium`). Dış ağa istek yok. */
import { defineConfig, devices } from "@playwright/test";
import { existsSync } from "node:fs";

const KAPI = 3100;
const hazir = process.env.PROBATA_CHROMIUM || (existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : undefined);

export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  /* CI'da düşen test GitHub'da adıyla not (annotation) olarak görünür — günlük ayrı sunucuda, not API'den okunur (2026-10-03) */
  reporter: process.env.CI ? [["list"], ["github"]] : [["list"]],
  /* sayfalar testlerden önce bir kez derlenir (e2e/hazirla.ts) */
  globalSetup: "./e2e/hazirla.ts",
  use: {
    baseURL: `http://127.0.0.1:${KAPI}`,
    launchOptions: hazir ? { executablePath: hazir } : {},
  },
  projects: [
    { name: "masaustu", use: { ...devices["Desktop Chrome"], viewport: { width: 1920, height: 1080 } } },
    { name: "tablet", use: { ...devices["Desktop Chrome"], viewport: { width: 1080, height: 1440 } } },
    { name: "telefon", use: { ...devices["Desktop Chrome"], viewport: { width: 375, height: 812 }, hasTouch: true } },
  ],
  webServer: {
    command: `node scripts/next.ts dev --hostname 127.0.0.1 --port ${KAPI}`,
    url: `http://127.0.0.1:${KAPI}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: { NEXT_TELEMETRY_DISABLED: "1" },
  },
});
