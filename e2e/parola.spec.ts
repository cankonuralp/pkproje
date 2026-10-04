/* NEREDEN GELDİ: karar 34 ("yönetici geçici parola verir, daha sonra kullanıcı parolasını değiştirebilir"), karar 37 (en az 10 karakter, harf +
   rakam), maket giris.html #/gecici (K1 2026-10-04). Geçici parolayla giren "Parolayı değiştir"e gelir; zayıf / eşleşmeyen / aynı parola reddedilir;
   yeni parola kaydedilince ESKİ oturumlar düşer (başka cihaz), bu cihaz yeni oturumla devam eder, eski parola artık girmez. */
import { expect, test } from "@playwright/test";
import { E2E_PAROLA } from "./hesaplar";

const YENI = "yeni-parola-2027";

test("geçici parolayla ilk giriş: parola değiştir ekranı, denetimler, eski oturum düşer, yeni parola geçerli", async ({ page, browser }, bilgi) => {
  const eposta = `ilk-${bilgi.project.name}@deneme.example`;
  const gir = async (p: typeof page, parola: string) => {
    await p.goto("/giris?donus=%2Fplanlar");
    await expect(p.getByRole("button", { name: "Giriş yap" })).toBeEnabled();
    await p.getByLabel("E-posta").fill(eposta);
    await p.getByLabel("Parola", { exact: true }).fill(parola);
    await p.getByRole("button", { name: "Giriş yap" }).click();
  };
  /* ikinci cihaz: aynı hesapla önceden açılmış oturum */
  const baskaCihaz = await (await browser.newContext()).newPage();
  await gir(baskaCihaz, E2E_PAROLA);
  await expect(baskaCihaz).toHaveURL(/\/giris\/parola\?donus=%2Fplanlar$/);

  await gir(page, E2E_PAROLA);
  await expect(page).toHaveURL(/\/giris\/parola\?donus=%2Fplanlar$/);
  await expect(page.locator("h1")).toHaveText("Parolayı değiştir");
  await expect(page.getByText(`Geçici parolayla giriş yapıldı: ${eposta}.`)).toBeVisible();
  const kaydet = page.getByRole("button", { name: "Kaydet ve devam et" });
  for (const [p1, p2, ileti] of [["kisa1", "kisa1", "En az 10 karakter; harf ve rakam içermeli."], ["yalnizharfler", "yalnizharfler", "En az 10 karakter; harf ve rakam içermeli."],
    [YENI, "baska-parola-1", "İki parola aynı değil."], [E2E_PAROLA, E2E_PAROLA, "Yeni parola geçici parolayla aynı olamaz."]] as const) {
    await expect(kaydet).toBeEnabled();
    await page.getByLabel("Yeni parola", { exact: true }).fill(p1);
    await page.getByLabel("Yeni parola (tekrar)").fill(p2);
    await kaydet.click();
    await expect(page.getByText(ileti)).toBeVisible();
  }
  await expect(kaydet).toBeEnabled();
  await page.getByLabel("Yeni parola", { exact: true }).fill(YENI);
  await page.getByLabel("Yeni parola (tekrar)").fill(YENI);
  await kaydet.click();
  await expect(page).toHaveURL(/\/planlar$/);
  await expect(page.locator("h1")).toHaveText("Planlar");

  /* öteki cihazın oturumu düştü */
  await baskaCihaz.goto("/planlar");
  await expect(baskaCihaz).toHaveURL(/\/giris\?neden=oturum/);
  /* eski parola artık girmez, yeni parola girer ve artık parola ekranına uğramaz */
  await gir(baskaCihaz, E2E_PAROLA);
  await expect(baskaCihaz.locator("form").getByRole("alert")).toContainText("E-posta ya da parola yanlış.");
  await expect(baskaCihaz.getByRole("button", { name: "Giriş yap" })).toBeEnabled();
  await gir(baskaCihaz, YENI);
  await expect(baskaCihaz).toHaveURL(/\/planlar$/);
  await baskaCihaz.context().close();
});

test("'Şimdi değil' ile geçilir; parola ekranı oturumsuz açılmaz, durumu etkin olan hesaba görünmez", async ({ page }) => {
  await page.goto("/giris/parola");
  await expect(page).toHaveURL(/\/giris$/);
  await page.goto("/giris");
  await expect(page.getByRole("button", { name: "Giriş yap" })).toBeEnabled();
  await page.getByLabel("E-posta").fill("yonetici@deneme.example");
  await page.getByLabel("Parola", { exact: true }).fill(E2E_PAROLA);
  await page.getByRole("button", { name: "Giriş yap" }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/giris/parola");
  await expect(page).toHaveURL(/\/$/);
});
