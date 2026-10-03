/* NEREDEN GELDİ: K0 (2026-10-03) — seçim alanı (kalıp 19: yerli açılır liste YOK; ↑ ↓ Home End Enter Esc Tab + harfle atlama; 8'den fazla
   seçenekte arama; pencerede liste akış içinde, Esc pencereyi kapatmaz) ve tarih / saat alanı (reisim 2026-09-27: takvim, Bugün, saat ve
   dakika ayrı, yazılır ya da seçilir; yazarken uyan saatler önerilir; 2026-10-03: kutuya tıklayınca da takvim açılır, yazmak serbest). */
import { expect, test, type Page } from "@playwright/test";

const form = (page: Page) => page.locator('section[aria-labelledby="v-form"]');
const deger = (page: Page, ad: string) => form(page).locator(`[data-deger-${ad}]`).getAttribute(`data-deger-${ad}`);

test.beforeEach(async ({ page }) => {
  await page.goto("/vitrin");
  await expect(form(page)).toBeVisible();
});

test("seçim alanı: yerli liste yok; ok tuşları, Enter; geçersiz hâl söylenir", async ({ page }) => {
  await expect(page.locator("select")).toHaveCount(0);
  const brans = page.getByRole("combobox", { name: "Branş" });
  await expect(brans).toHaveAttribute("aria-invalid", "true");
  await expect(brans).toHaveAccessibleDescription("Branş seçilmeli.");
  await brans.click();
  const liste = form(page).getByRole("listbox", { name: "Branş" });
  await expect(liste).toBeVisible();
  await expect(liste.getByRole("searchbox")).toHaveCount(0);
  await expect(liste.getByRole("option", { name: "Mekanik" })).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(liste.getByRole("option", { name: "Elektrik" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(liste).toHaveCount(0);
  await expect(brans).toBeFocused();
  await expect(brans).toContainText("Elektrik");
  await expect(brans).not.toHaveAttribute("aria-invalid", "true");
  expect(await deger(page, "brans")).toBe("e");
});

test("uzun liste: arama süzer; Esc kapatır, odak alana; harfle atlama; liste alanın altında", async ({ page }) => {
  const tur = page.getByRole("combobox", { name: "Ekipman türü" });
  await tur.click();
  const liste = form(page).getByRole("listbox", { name: "Ekipman türü" });
  const ara = liste.getByRole("searchbox");
  await expect(ara).toBeFocused();
  const [alan, kutu] = [await tur.boundingBox(), await liste.boundingBox()];
  expect(kutu!.y).toBeGreaterThanOrEqual(alan!.y + alan!.height);
  await ara.fill("vin");
  await expect(liste.getByRole("option")).toHaveCount(1);
  await ara.fill("yok");
  await expect(liste).toContainText("Bu adla seçenek yok.");
  await page.keyboard.press("Escape");
  await expect(liste).toHaveCount(0);
  await expect(tur).toBeFocused();

  await tur.click();
  await page.keyboard.press("ArrowDown");
  await expect(liste.getByRole("option", { name: "Asansör" })).toBeFocused();
  await page.keyboard.press("y");
  await expect(liste.getByRole("option", { name: "Yangın tesisatı" })).toBeFocused();
  await page.keyboard.press("Home");
  await expect(liste.getByRole("option", { name: "Asansör" })).toBeFocused();
  await page.keyboard.press("End");
  await page.keyboard.press("Enter");
  expect(await deger(page, "tur")).toBe("t10");
});

test("pencerede: liste akış içinde, Esc yalnız listeyi kapatır", async ({ page }) => {
  await page.locator('[data-v="pencere"]').click();
  const pencere = page.locator("dialog[open]");
  const tur = pencere.getByRole("combobox", { name: "Not türü" });
  await tur.click();
  const liste = pencere.getByRole("listbox", { name: "Not türü" });
  await expect(liste).toHaveCSS("position", "static");
  await page.keyboard.press("Escape");
  await expect(liste).toHaveCount(0);
  await expect(pencere).toBeVisible();
  await expect(tur).toBeFocused();
});

test("tarih: kutuya tıklayınca takvim, yazınca takvim gider; ay geçişi; gün seçimi; geçersiz gün işaretlenir; Bugün", async ({ page }) => {
  const kutu = page.locator("#v-tarih");
  await kutu.click();
  const takvim = form(page).getByRole("dialog", { name: "Plan tarihi" });
  await expect(takvim).toBeVisible();
  await expect(kutu).toBeFocused();
  await kutu.fill("15.10.2026");
  expect(await deger(page, "tarih")).toBe("2026-10-15");
  await expect(takvim).toContainText("Ekim 2026");
  await expect(takvim.getByRole("button", { name: "15.10.2026" })).toHaveAttribute("aria-pressed", "true");
  await takvim.getByRole("button", { name: "Sonraki ay" }).click();
  await expect(takvim).toContainText("Kasım 2026");
  await takvim.getByRole("button", { name: "03.11.2026" }).click();
  await expect(takvim).toHaveCount(0);
  expect(await deger(page, "tarih")).toBe("2026-11-03");
  await expect(kutu).toHaveValue("03.11.2026");
  await expect(form(page).getByRole("button", { name: "Takvimden seç" }).first()).toBeFocused();

  await kutu.fill("31.02.2026");
  await expect(kutu).toHaveAttribute("aria-invalid", "true");
  expect(await deger(page, "tarih")).toBe("2026-11-03");

  await form(page).getByRole("button", { name: "Takvimden seç" }).first().click();
  await form(page).getByRole("dialog", { name: "Plan tarihi" }).getByRole("button", { name: "Bugün" }).click();
  const bugun = await page.evaluate(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; });
  expect(await deger(page, "tarih")).toBe(bugun);
});

test("saat ve dakika: yazarken uyanlar önerilir, liste açık kalır; simge tam liste", async ({ page }) => {
  const saat = form(page).getByRole("textbox", { name: "Başlangıç saati" });
  await saat.fill("1");
  const oneri = form(page).getByRole("listbox", { name: "Saat" });
  await expect(oneri.getByRole("option")).toHaveCount(10);
  await saat.fill("14");
  await expect(oneri.getByRole("option", { name: "14" })).toBeVisible();
  /* öneri listesi dakika kutusunun üstüne binmez (saat : dakika tek grup) */
  const [l, d] = [await oneri.boundingBox(), await form(page).getByRole("textbox", { name: "Başlangıç dakikası" }).boundingBox()];
  const kesisir = l!.x < d!.x + d!.width && d!.x < l!.x + l!.width && l!.y < d!.y + d!.height && d!.y < l!.y + l!.height;
  expect(kesisir).toBe(false);
  expect(await deger(page, "zaman")).toBe("2026-10-03T14:30");
  await form(page).getByRole("button", { name: "Dakika seç" }).click();
  const dk = form(page).getByRole("listbox", { name: "Dakika" });
  await expect(dk.getByRole("option")).toHaveCount(60);
  await expect(dk.getByRole("option", { name: "30" })).toBeFocused();
  await dk.getByRole("option", { name: "45" }).click();
  await expect(dk).toHaveCount(0);
  expect(await deger(page, "zaman")).toBe("2026-10-03T14:45");
  await expect(form(page).getByRole("textbox", { name: "Başlangıç dakikası" })).toBeFocused();
  await expect(form(page).locator("#v-zaman")).toHaveValue("03.10.2026");
});

test("telefonda tarih tam satır, takvim alanın genişliğinde; yatay kayma yok", async ({ page }, bilgi) => {
  test.skip(bilgi.project.name !== "telefon", "yalnız telefon");
  const tarih = form(page).locator('[data-zaman="v-zaman"] > div').first();
  await page.locator("#v-zaman").click();
  const takvim = form(page).getByRole("dialog", { name: "Başlangıç" });
  const [a, t] = [await tarih.boundingBox(), await takvim.boundingBox()];
  expect(Math.round(t!.width)).toBe(Math.round(a!.width));
  const genislik = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  expect(genislik[0]).toBeLessThanOrEqual(genislik[1]);
});
