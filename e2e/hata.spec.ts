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
