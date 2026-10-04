/* NEREDEN GELDİ: K1 (2026-10-04) — reisim: "site güvenliği, kaynak koddan rol değiştirme sızma veri çalma gibi şeylere dikkat et". 09-E1–E4, karar 37,
   S2 (oturum doldu / yetkisiz ekranları). Gerçek tarayıcıda, geçici veritabanında, uydurma iki firmayla (deneme · baska):
   · oturumsuz uygulama → giriş; yanlış parola tek ileti; çerez HttpOnly + SameSite=Lax; çıkışta sunucu oturumu siler (eski çerez geçmez);
   · KİRACI: deneme'nin çerezi baska'nın adresine taşınınca geçmez; kurcalanmış çerez geçmez;
   · ROL: denetçinin menüsünde Muhasebe / Firma ayarları yok, adresi elle yazınca "yetkiniz yok" (kaydın adı söylenmez);
   · KİLİT: 5 hatalı denemeden sonra doğru parola da girmez;
   · AÇIK YÖNLENDİRME: dönüş adresi başka siteye götürmez;
   · BAŞLIKLAR: nonce'lu CSP, çerçeveye gömme yok, nosniff. */
import { expect, test } from "@playwright/test";
import { E2E_FIRMA, E2E_HESAPLAR, E2E_KAPI, E2E_PAROLA } from "./hesaplar";
import { girisli, girisYap } from "./yardimci";

test("oturumsuz uygulama sayfası girişe gider; yanlış parola tek ileti; doğru parola kaldığı sayfaya; çerez HttpOnly + Lax", async ({ page, context }) => {
  await page.goto("/planlar");
  await expect(page).toHaveURL(/\/giris\?donus=%2Fplanlar$/);
  await expect(page.locator("h1")).toHaveText("Giriş");
  await expect(page.getByText(`${E2E_FIRMA.kisaAd}.localhost`)).toBeVisible();
  /* denemeler aynı sayfada (dönüş adresi korunur) */
  await page.getByLabel("E-posta").fill(E2E_HESAPLAR.yonetici.eposta);
  await page.getByLabel("Parola", { exact: true }).fill("yanlis-parola-1");
  await page.getByRole("button", { name: "Giriş yap" }).click();
  await expect(page.locator("form").getByRole("alert")).toContainText("E-posta ya da parola yanlış.");
  await page.getByLabel("E-posta").fill("olmayan@deneme.example");
  await page.getByLabel("Parola", { exact: true }).fill("yanlis-parola-1");
  await page.getByRole("button", { name: "Giriş yap" }).click();
  await expect(page.locator("form").getByRole("alert")).toContainText("E-posta ya da parola yanlış.");   // olmayan hesap için aynı ileti
  /* ileti öncekiyle aynı: istek bitene (tuş yeniden etkin) kadar bekle — React eylem bitince formu sıfırlar, erken yazılan silinir */
  await expect(page.getByRole("button", { name: "Giriş yap" })).toBeEnabled();
  /* girişten sonra kaldığı sayfaya (S2) */
  await page.getByLabel("E-posta").fill(E2E_HESAPLAR.yonetici.eposta);
  await page.getByLabel("Parola", { exact: true }).fill(E2E_PAROLA);
  await page.getByRole("button", { name: "Giriş yap" }).click();
  await expect(page).toHaveURL(/\/planlar$/);
  const cerez = (await context.cookies()).find((c) => c.name === "probata-oturum");
  expect(cerez?.httpOnly).toBe(true);
  expect(cerez?.sameSite).toBe("Lax");
  expect(cerez?.domain).toBe(`${E2E_FIRMA.kisaAd}.localhost`);   // alan adı yazılmadı: yalnız bu alt alan adına gider
  expect(await page.evaluate(() => document.cookie)).not.toContain("probata-oturum");   // betik okuyamaz
});

test("çıkış: sunucu oturumu siler; eski çerez yeniden takılsa da geçmez", async ({ page, context }) => {
  await girisli(page, "yonetici");
  const eski = (await context.cookies()).find((c) => c.name === "probata-oturum")!;
  await page.getByRole("button", { name: /kendi işlemlerim/ }).click();
  await page.getByRole("menuitem", { name: "Çıkış yap" }).click();
  await expect(page).toHaveURL(/\/giris\?neden=cikis$/);
  await expect(page.getByText("Çıkış yaptınız; oturumunuz kapatıldı.")).toBeVisible();
  await context.addCookies([eski]);
  await page.goto("/planlar");
  await expect(page).toHaveURL(/\/giris\?neden=oturum&donus=%2Fplanlar$/);
  await expect(page.getByText("Uzun süre işlem yapılmadığı için oturumunuz kapandı.")).toBeVisible();
});

test("KİRACI: bir firmanın çerezi öteki firmanın adresinde geçmez; kurcalanmış çerez geçmez", async ({ page, context }) => {
  await girisli(page, "yonetici");
  const cerez = (await context.cookies()).find((c) => c.name === "probata-oturum")!;
  await context.addCookies([{ ...cerez, domain: `${E2E_FIRMA.baskaKisaAd}.localhost` }]);
  await page.goto(`http://${E2E_FIRMA.baskaKisaAd}.localhost:${E2E_KAPI}/planlar`);
  await expect(page).toHaveURL(/\/giris\?neden=oturum&donus=%2Fplanlar$/);
  await context.clearCookies();
  await context.addCookies([{ ...cerez, value: cerez.value.slice(0, -2) + (cerez.value.endsWith("AA") ? "BB" : "AA") }]);
  await page.goto("/planlar");
  await expect(page).toHaveURL(/\/giris\?neden=oturum&donus=%2Fplanlar$/);
});

test("ROL: denetçi Muhasebe ve Firma ayarlarını menüde görmez; adresi elle yazınca yetkisiz ekranı", async ({ page }) => {
  await girisli(page, "denetci");
  const menu = page.locator("aside nav");
  /* dar bantta menü çekmecede (gizli) — rol sorgusu gizliyi görmez, adresle sayılır */
  await expect(menu.locator('a[href="/planlar"]')).toHaveCount(1);
  await expect(menu.locator('a[href="/muhasebe"]')).toHaveCount(0);
  await expect(menu.locator('a[href="/firma-ayarlari"]')).toHaveCount(0);
  await expect(page.locator("header")).toContainText("Denetçi");
  for (const yol of ["/muhasebe", "/firma-ayarlari"]) {
    await page.goto(yol);
    await expect(page.getByText("Bu sayfayı görme yetkiniz yok")).toBeVisible();
    await expect(page.locator("h1")).toHaveCount(0);   // modülün başlığı / içeriği çizilmez
  }
});

test("KİLİT: 5 hatalı denemeden sonra doğru parola da girmez", async ({ page }) => {
  /* ayrı IP gibi davran: öteki testlerin girişini kilitlemesin (IP kilidi firmaya ve IP'ye bağlı) */
  await page.setExtraHTTPHeaders({ "X-Forwarded-For": `10.77.${test.info().workerIndex}.${test.info().repeatEachIndex + 1}` });
  for (let i = 1; i <= 5; i++) await girisYap(page, "kilit", `yanlis-parola-${i}`);
  await expect(page.locator("form").getByRole("alert")).toContainText("giriş 15 dakika kilitlendi");
  await girisYap(page, "kilit");
  await expect(page.locator("form").getByRole("alert")).toContainText("giriş 15 dakika kilitlendi");
  await expect(page).toHaveURL(/\/giris/);
});

test("AÇIK YÖNLENDİRME: dönüş adresi başka siteye götürmez", async ({ page }) => {
  for (const donus of ["//kotu.example/x", "https://kotu.example", "/\\kotu.example"]) {
    await page.goto(`/giris?donus=${encodeURIComponent(donus)}`);
    await expect(page.locator('input[name="donus"]')).toHaveCount(0);
  }
  await page.goto("/giris?donus=%2Fplanlar");
  await expect(page.locator('input[name="donus"]')).toHaveValue("/planlar");
  await page.getByLabel("E-posta").fill(E2E_HESAPLAR.yonetici.eposta);
  await page.getByLabel("Parola", { exact: true }).fill(E2E_PAROLA);
  await page.getByRole("button", { name: "Giriş yap" }).click();
  await expect(page).toHaveURL(new RegExp(`^http://${E2E_FIRMA.kisaAd}\\.localhost:${E2E_KAPI}/planlar$`));
});

test("BAŞLIKLAR: nonce'lu CSP, çerçeveye gömme yok, nosniff; satır içi betik nonce taşır", async ({ page }) => {
  const yanit = await page.goto("/giris");
  const h = yanit!.headers();
  expect(h["content-security-policy"]).toMatch(/script-src 'self' 'nonce-[A-Za-z0-9+/=]+' 'strict-dynamic'/);
  expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(h["content-security-policy"]).toContain("object-src 'none'");
  expect(h["x-frame-options"]).toBe("DENY");
  expect(h["x-content-type-options"]).toBe("nosniff");
  const nonce = /'nonce-([^']+)'/.exec(h["content-security-policy"])![1];
  expect(await page.locator("head script").first().getAttribute("nonce")).not.toBeNull();
  expect(nonce.length).toBeGreaterThan(20);
  /* XSS'in tipik biçimi: sayfaya sızan HTML'deki satır içi olay işleyicisi. CSP'de 'unsafe-inline' yok → çalışmaz, ihlal bildirilir.
     (Güvenilir betiğin oluşturduğu betik 'strict-dynamic' gereği çalışır; o saldırı biçimi değildir.) */
  const sonuc = await page.evaluate(() => new Promise<{ sizdi: boolean; ihlal: boolean }>((coz) => {
    const w = window as unknown as { sizdi?: boolean };
    let ihlal = false;
    document.addEventListener("securitypolicyviolation", () => { ihlal = true; });
    document.body.insertAdjacentHTML("beforeend", '<img src="/yok.png" onerror="window.sizdi = true" alt="">');
    setTimeout(() => coz({ sizdi: !!w.sizdi, ihlal }), 500);
  }));
  expect(sonuc).toEqual({ sizdi: false, ihlal: true });
});

test("hesaplar: yanlış firmanın adresinde aynı e-posta ve parola o firmanın hesabıyla girer (hesaplar firmaya ait)", async ({ page }) => {
  await page.goto(`http://${E2E_FIRMA.baskaKisaAd}.localhost:${E2E_KAPI}/giris`);
  await page.getByLabel("E-posta").fill(E2E_HESAPLAR.denetci.eposta);
  await page.getByLabel("Parola", { exact: true }).fill("yanlis-parola-9");
  await page.getByRole("button", { name: "Giriş yap" }).click();
  await expect(page.locator("form").getByRole("alert")).toContainText("E-posta ya da parola yanlış.");
});
