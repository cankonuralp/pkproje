/* NEREDEN GELDİ: K1 "hata sayfası" (2026-10-04). Beklenmeyen hata: tek cümle + "Yeniden dene" + "Ana sayfaya dön"; hatanın iç ayrıntısı (sorgu, yol)
   sayfada görünmez. (Geliştirmede Next'in hata katmanı ayrıca açılır; denetim sayfanın kendi içeriğinde — main.) */
import { expect, test } from "@playwright/test";

test("beklenmeyen hata: yol gösteren ekran, iç ayrıntı sızmaz", async ({ page }) => {
  await page.goto("/vitrin/hata");
  const ana = page.locator("main");
  await expect(ana.getByText("Bu sayfa açılamadı")).toBeVisible();
  await expect(ana.getByRole("button", { name: "Yeniden dene" })).toBeVisible();
  await expect(ana.getByRole("link", { name: "Ana sayfaya dön" })).toHaveAttribute("href", "/");
  await expect(ana).not.toContainText("ic-ayrinti-sizmamali");
  await expect(ana).not.toContainText("SELECT");
  /* 397: bağlantı kesilince "Bağlantı yok" (yol gösterir: Planlar; çevrimdışı çalışanlar söylenir); gelince eski ekran */
  await page.context().setOffline(true);
  await expect(ana.getByText("Bağlantı yok")).toBeVisible();
  await expect(ana.getByText("Kaydet ve Onaya gönder bağlantısız da çalışır", { exact: false })).toBeVisible();
  await expect(ana.getByRole("link", { name: "Planlar" })).toHaveAttribute("href", "/planlar");
  await page.context().setOffline(false);
  await expect(ana.getByText("Bu sayfa açılamadı")).toBeVisible();
});

/* 409: tarayıcının kendiliğinden istediği /favicon.ico 404 değil — sitenin simgesine yönlenir */
test("tarayıcı simgesi: /favicon.ico sitenin simgesine yönlenir", async ({ page }) => {
  const r = await page.request.get("/favicon.ico");
  expect(r.status()).toBe(200);
  expect(r.url()).toMatch(/\/icon\.svg$/);
  expect(r.headers()["content-type"] ?? "").toContain("svg");
});

/* 567 (06-HATA-TAKIBI): yakalanmayan hata ve reddedilen söz hata kaydı ucuna gider; aynı hata 60 sn'de bir (kısma); son 20 hata bellekte
   (window._istemciHatalari); gürültü (bağlantı kopması) gönderilmez. Yazıldığı veritabanı kilidinde (tests/hata.test.ts). */
test("tarayıcı hatası hata kaydına gider: yakalanmayan hata ve reddedilen söz; aynı hata kısılır; gürültü gitmez", async ({ page }) => {
  await page.goto("/giris");
  /* işaret (sendBeacon) isteğinin gövdesi Playwright'ta okunmaz — sayı istekten, içerik sayfanın belleğinden (window._istemciHatalari) */
  const giden: string[] = [];
  page.on("request", (r) => { if (new URL(r.url()).pathname === "/api/hata") giden.push(r.method()); });
  await page.evaluate(() => {
    setTimeout(() => { throw new Error("deneme-567 yakalanmayan"); });
    setTimeout(() => { throw new Error("deneme-567 yakalanmayan"); }, 20);
    setTimeout(() => { void Promise.reject(new Error("deneme-567 söz")); }, 40);
    setTimeout(() => { void Promise.reject(new TypeError("Failed to fetch")); }, 60);
  });
  await expect.poll(() => giden.length).toBe(2);
  await page.waitForTimeout(300);
  expect(giden.length, giden.join(" | ")).toBe(2);
  expect(giden).toEqual(["POST", "POST"]);
  const bellek = await page.evaluate(() => (window as unknown as { _istemciHatalari?: { mesaj: string }[] })._istemciHatalari?.map((h) => h.mesaj) ?? []);
  expect(bellek).toEqual(["Error: deneme-567 yakalanmayan", "Error: deneme-567 söz"]);
  await expect(page.getByRole("button", { name: "Giriş yap" })).toBeVisible();
});
