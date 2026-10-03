/* NEREDEN GELDİ: K0 (2026-10-03) — ortak bileşenler tek üreticiden ve maketle eşit davranır (geliştirme vitrini /vitrin):
   · tuş: yüksekliği --tus-y (masaüstü 34, dokunmatik 44 — kalip.ts), içerik kadar geniş (kalıp 1), kapalı tuş tıklanmaz;
   · şerit: dört tür ayrı zemin, hata şeridi role=alert (ekran okuyucu hemen okur);
   · bildirim: eylemin sonucu görünür ve okunur (anayasa 2.8 — sessiz başarı yok), 4 sn sonra kaybolur;
   · onay penceresi (AA8): odak Vazgeç'te (Enter yanlışlıkla silmez), Esc = hayır, tuş = evet; telefonda alttan levha;
   · pencere: açılınca odak ilk alana, kapanınca kaybolur. */
import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/vitrin");
  await expect(page.locator("h1")).toHaveText("Vitrin");
});

test("tuş: yükseklik --tus-y, içerik kadar geniş, kapalı tuş kapalı", async ({ page }, bilgi) => {
  const beklenen = bilgi.project.name === "masaustu" ? 34 : 44;
  for (const v of ["birincil", "ikincil", "tehlike", "kapali"]) {
    const kutu = (await page.locator(`[data-v="${v}"]`).boundingBox())!;
    expect(Math.round(kutu.height), v).toBe(beklenen);
    expect(kutu.width, v).toBeLessThan(200);
  }
  await expect(page.locator('[data-v="kapali"]')).toBeDisabled();
  const renkler = await page.evaluate(() => ["birincil", "ikincil", "tehlike"].map((v) =>
    getComputedStyle(document.querySelector(`[data-v="${v}"]`)!).backgroundColor));
  expect(new Set(renkler).size).toBe(3);
});

test("şerit: dört tür ayrı zemin, hata role=alert", async ({ page }) => {
  const seritler = page.locator('section[aria-labelledby="v-serit"] > div');
  await expect(seritler).toHaveCount(4);
  const zeminler = await seritler.evaluateAll((d) => d.map((e) => getComputedStyle(e).backgroundColor));
  expect(new Set(zeminler).size).toBe(4);
  await expect(page.locator('section[aria-labelledby="v-serit"]').getByRole("alert")).toHaveText("Kaydedilemedi: bağlantı yok.");
});

test("bildirim: görünür, okunur, kaybolur", async ({ page }) => {
  const bildirim = page.locator("[data-bildirim]");
  await expect(bildirim).toHaveCSS("opacity", "0");
  await page.locator('[data-v="bildir"]').click();
  await expect(bildirim).toHaveAttribute("role", "status");
  await expect(bildirim).toContainText("Kaydedildi.");
  await expect(bildirim).toHaveCSS("opacity", "1");
  await expect(bildirim).toHaveCSS("opacity", "0", { timeout: 6000 });
});

test("onay: odak Vazgeç'te, Esc hayır, tuş evet; telefonda alttan levha", async ({ page }, bilgi) => {
  const sonuc = page.locator("[data-sonuc]");
  const pencere = page.locator("dialog[open]");
  await page.locator('[data-v="onayla"]').click();
  await expect(pencere).toBeVisible();
  await expect(pencere.locator("h2")).toHaveText("Rapor silinsin mi?");
  await expect(pencere.getByRole("button", { name: "Vazgeç" })).toBeFocused();
  if (bilgi.project.name === "telefon") {
    const kutu = (await pencere.boundingBox())!;
    const ekran = page.viewportSize()!;
    expect(Math.round(kutu.width)).toBe(ekran.width);
    expect(Math.round(kutu.y + kutu.height)).toBe(ekran.height);
  }
  await page.keyboard.press("Escape");
  await expect(pencere).toHaveCount(0);
  await expect(sonuc).toHaveText("hayır");

  await page.locator('[data-v="onayla"]').click();
  await pencere.locator("[data-onay-tamam]").click();
  await expect(pencere).toHaveCount(0);
  await expect(sonuc).toHaveText("evet");
});

test("pencere: odak ilk alanda, Kaydet kapatır ve bildirir", async ({ page }) => {
  await page.locator('[data-v="pencere"]').click();
  const pencere = page.locator("dialog[open]");
  await expect(pencere.locator("textarea")).toBeFocused();
  await pencere.getByRole("button", { name: "Kaydet" }).click();
  await expect(pencere).toHaveCount(0);
  await expect(page.locator("[data-bildirim]")).toContainText("Not eklendi.");
});
