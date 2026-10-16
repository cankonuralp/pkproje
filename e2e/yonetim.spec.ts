/* NEREDEN GELDİ: 348 — probata yönetim sayfası (maket yonetim.html; KOD-GECIS Y1: ayrı adres + iki adımlı giriş). Gerçek sunucuda, üç genişlikte:
   firma adresinde /yonetim yok, yönetim adresinde firma ekranı yok; ilk yönetici geçici parolayla girer, doğrulama uygulamasının anahtarını görür,
   kod + yeni parolayla kurulumu bitirir; Firmalar; Firma aç (boş form ve ayrılmış ad reddedilir, ünvandan öneri, başka firmanın kodu sunucuda
   reddedilir) → geçici parola bir kez → yeni firmanın adresine o parolayla girilir; Dondur (firma adresi kapanır) / Etkinleştir / yeni geçici
   parola; Çıkış. Kurulmuş yönetici: yanlış kod reddedilir, doğru kodla girer.
   2026-10-08 (393; reisim: "ikii aşamalı doğrulamayı şimdilik kaldır, belirlediğin mail şifre ile direk girebileyim"): iki adım bir ayar
   (göç 0075, başlangıçta KAPALI) — uçtan uca yayındaki hâli sınar: geçici parolalı ilk yönetici de kurulmuş yönetici de parolayla doğrudan
   Firmalar'a; kod ve kurulum sayfaları girişe döner. İki adımlı akış (ayar açık) gerçek PostgreSQL kilidinde (tests/yonetim.test.ts).
   2026-10-16 (FIRMA-VT FV9, K4): kendi veritabanlı firmanın sayfasında özet FİRMANIN veritabanından (yönetici merkezde yok) ve "Yapay zekâ anahtarı":
   geçersiz anahtar alanın altında reddedilir; kaydet → tanımlı, son 4; kaldır (önce sorulur) → tanımlı değil. Dondurma bu firmada uçtan uçta
   denenmez (aynı sunucudaki öteki testler firmayı kullanır) — sıra ve kapalı yön tests/yonetim-firmada.test.ts'te. */
import { expect, test, type Page } from "@playwright/test";
import { E2E_FIRMA, E2E_GONDERIM, E2E_KAPI, E2E_KENDI, E2E_KURULUM, E2E_PAROLA, E2E_YONETIM } from "./hesaplar";
import { hazir } from "./yardimci";

const Y = `http://${E2E_YONETIM.alan}:${E2E_KAPI}`;

async function parolaAdimi(page: Page, eposta: string, parola: string) {
  await page.goto(`${Y}/yonetim/giris`);
  await hazir(page);
  await page.getByLabel("E-posta").fill(eposta);
  await page.getByLabel("Parola", { exact: true }).fill(parola);
  await page.getByRole("button", { name: "Giriş yap" }).click();
}

test("yönetim: ayrı adres; ilk kurulum; firma aç → geçici parolayla yeni firmaya giriş; dondur / etkinleştir / yeni parola; çıkış", async ({ page, browser }, bilgi) => {
  /* proje (genişlik) başına kendi yöneticisi ve firması — üç genişlik tek sunucuda da koşabilir */
  const P = E2E_YONETIM.proje(bilgi.project.name), F = P.firma;
  const firmaAdresi = `http://${F.alt}.localhost:${E2E_KAPI}`;
  /* firma adresinde yönetim yok; yönetim adresinde firma ekranı ve API yok — önceden yükleme başlığıyla da (347–348 incelemesi) */
  expect((await page.goto("/yonetim"))?.status()).toBe(404);
  expect((await page.goto(`${Y}/planlar`))?.status()).toBe(404);
  expect((await page.goto(`${Y}/api/surum`))?.status()).toBe(404);
  await page.setExtraHTTPHeaders({ "next-router-prefetch": "1" });
  expect((await page.goto(`${Y}/api/surum`))?.status()).toBe(404);
  await page.setExtraHTTPHeaders({});
  await page.goto(`${Y}/`);
  await expect(page).toHaveURL(/\/yonetim\/giris$/);

  /* 393: iki adım kapalı — giriş sayfası iki adım demez; kod ve kurulum sayfaları girişe döner */
  await expect(page.getByText("Bu sayfa yalnız probata ekibine açık.")).toBeVisible();
  for (const y of ["kod", "kurulum"]) {
    await page.goto(`${Y}/yonetim/giris/${y}`);
    await expect(page).toHaveURL(/\/yonetim\/giris$/);
  }
  /* ilk yönetici: geçici parolayla doğrudan Firmalar (kurulum yok) */
  await parolaAdimi(page, P.ilk, "yanlis-parola-2026");
  await expect(page.getByText("E-posta ya da parola yanlış.", { exact: false })).toBeVisible();
  await expect(page.getByLabel("Parola", { exact: true })).toBeFocused();   // 2026-10-08: hata dönünce odak alana (e-posta dolu → parola)
  await expect(page.getByLabel("Parola", { exact: true })).toHaveAttribute("aria-invalid", "true");
  await parolaAdimi(page, P.ilk, E2E_YONETIM.geciciParola);
  await expect(page).toHaveURL(/\/yonetim$/);
  await hazir(page);
  await expect(page.getByRole("heading", { level: 1, name: "Firmalar" })).toBeVisible();
  await expect(page.locator("header")).toContainText("Yönetim");
  await expect(page.getByText("Bu sayfa yalnız probata ekibine açık")).toBeVisible();
  await expect(page.getByRole("link", { name: E2E_FIRMA.ad }).first()).toBeVisible();

  /* firma aç: boş form → alan hataları; ünvandan öneri; ayrılmış ad; başka firmanın kodu sunucuda reddedilir */
  await page.getByRole("link", { name: "Firma aç" }).first().click();
  await expect(page.getByRole("heading", { level: 1, name: "Firma aç" })).toBeVisible();
  /* 2026-10-16 (FIRMA-VT FV10, K1 — kasıtlı): firmanın Supabase hesabını bağlama akışı (2026-10-12, sunum D1) kalktı; yerine veritabanı seçimi —
     "Kendi Supabase projesi" (panel açar ve kurar; uçtan uca sunucusunda Yönetim API taklidi tanımlı → varsayılan, kurulum adımları listede) ya da
     "Ortak proje". Bu test ortak projeyle açar (kendi proje: aşağıdaki FV10 testi). */
  await expect(page.getByRole("radio", { name: /^Kendi Supabase projesi/ })).toBeChecked();
  await expect(page.getByRole("list", { name: "Kendi proje nasıl kurulur" }).getByRole("listitem")).toHaveCount(6);
  await page.getByRole("radio", { name: /^Ortak proje/ }).check();
  await expect(page.getByRole("list", { name: "Kendi proje nasıl kurulur" })).toHaveCount(0);
  await expect(page.getByLabel("Yapay zekâ anahtarı (isteğe bağlı)")).toHaveCount(0);
  await page.getByRole("button", { name: "Firmayı aç" }).click();
  await expect(page.getByText("Ticari ünvan yazılmalı.")).toBeVisible();
  await expect(page.getByLabel("Ticari ünvan")).toBeFocused();
  await page.getByLabel("Ticari ünvan").fill(F.unvan);
  await expect(page.getByLabel("Alt alan adı")).toHaveValue("yeni");
  await expect(page.getByLabel("Kısa kod (rapor no öneki)")).toHaveValue("YM");
  await page.getByLabel("Alt alan adı").fill("www");
  await page.getByLabel("Ad soyad").fill(F.yon);
  await page.getByLabel("E-posta (giriş adı)").fill(F.eposta);
  await page.getByRole("button", { name: "Firmayı aç" }).click();
  await expect(page.getByText("“www” bize ayrılmış; başka bir ad seçin.")).toBeVisible();
  await page.getByLabel("Alt alan adı").fill(F.alt);
  await expect(page.getByText(`Adres: ${F.alt}.localhost`)).toBeVisible();
  await page.getByLabel("Kısa kod (rapor no öneki)").fill(E2E_FIRMA.raporKodu);
  await page.getByRole("button", { name: "Firmayı aç" }).click();
  await page.locator("dialog[open]").getByRole("button", { name: "Firmayı aç" }).click();
  await expect(page.getByText(`${E2E_FIRMA.raporKodu} başka bir firmada.`)).toBeVisible();
  await expect(page.getByLabel("Kısa kod (rapor no öneki)")).toBeFocused();
  await page.getByLabel("Kısa kod (rapor no öneki)").fill(F.kod);
  await page.getByRole("button", { name: "Firmayı aç" }).click();
  await expect(page.locator("dialog[open]")).toContainText(`${F.alt}.localhost hemen çalışır`);
  await page.locator("dialog[open]").getByRole("button", { name: "Firmayı aç" }).click();
  await expect(page.getByRole("heading", { level: 1, name: F.unvan })).toBeVisible();
  await expect(page.getByText("Geçici parola yalnız şimdi görünür", { exact: false })).toBeVisible();
  const parola = (await page.locator("#ya-parola").innerText()).trim();
  expect(parola).toMatch(/^[A-Za-z2-9]{5}-[A-Za-z2-9]{5}-[A-Za-z2-9]{5}$/);

  /* yeni firmanın adresine geçici parolayla girilir → parola değiştir ekranı */
  const kisi = await (await browser.newContext()).newPage();
  await kisi.goto(`${firmaAdresi}/giris`);
  await hazir(kisi);
  await kisi.getByLabel("E-posta").fill(F.eposta);
  await kisi.getByLabel("Parola", { exact: true }).fill(parola);
  await kisi.getByRole("button", { name: "Giriş yap" }).click();
  await expect(kisi).toHaveURL(/\/giris\/parola$/);

  /* firma sayfası: dondur → firma adresi kapanır; etkinleştir; yeni geçici parola */
  await page.getByRole("link", { name: "Firma sayfası" }).click();
  await expect(page.getByRole("heading", { level: 1, name: F.unvan })).toBeVisible();
  await expect(page.getByText("Etkin", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Dondur" }).click();
  await page.locator("dialog[open]").getByRole("button", { name: "Dondur" }).click();
  await expect(page.getByText("Dondurulmuş: firmanın kullanıcıları ve müşterileri giriş yapamaz", { exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: "Yöneticiye yeni geçici parola" })).toBeDisabled();
  await kisi.goto(`${firmaAdresi}/giris`);
  await expect(kisi.getByText("Bu adreste kayıtlı bir firma yok.", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Etkinleştir" }).click();
  await expect(page.getByText(`Firma etkinleştirildi: ${F.alt}.localhost`)).toBeVisible({ timeout: 30_000 });   // 434: geliştirme sunucusunda eylem 15 sn'yi aştı (bbb50b9 masaüstü)
  await expect(page.getByRole("button", { name: "Dondur" })).toBeVisible();   // 377: yeni sayfa eylem yanıtıyla gelir (CI 8dc6d06 tablette kalmıştı)
  await page.getByRole("button", { name: "Yöneticiye yeni geçici parola" }).click();
  await page.locator("dialog[open]").getByRole("button", { name: "Oluştur" }).click();
  await expect(page.locator("#yf-parola")).toBeVisible();
  const yeni = (await page.locator("#yf-parola").innerText()).trim();
  expect(yeni).not.toBe(parola);
  await kisi.goto(`${firmaAdresi}/giris`);
  await hazir(kisi);
  await kisi.getByLabel("E-posta").fill(F.eposta);
  await kisi.getByLabel("Parola", { exact: true }).fill(yeni);
  await kisi.getByRole("button", { name: "Giriş yap" }).click();
  await expect(kisi).toHaveURL(/\/giris\/parola$/);
  await kisi.context().close();

  /* listede yeni firma; çıkış */
  await page.getByRole("link", { name: "Firmalar" }).first().click();
  await expect(page.getByRole("link", { name: F.unvan }).first()).toBeVisible();
  await page.getByRole("button", { name: /· kendi işlemlerim/ }).click();
  await page.getByRole("menuitem", { name: "Çıkış yap" }).click();
  await expect(page).toHaveURL(/\/yonetim\/giris\?neden=cikis$/);
  await expect(page.getByText("Çıkış yaptınız; oturumunuz kapatıldı.")).toBeVisible();
  await page.goto(`${Y}/yonetim`);
  await expect(page).toHaveURL(/\/yonetim\/giris/);
});

test("yönetim: kurulmuş yönetici — iki adım kapalıyken parolayla doğrudan girer (393)", async ({ page }, bilgi) => {
  await parolaAdimi(page, E2E_YONETIM.proje(bilgi.project.name).etkin, E2E_PAROLA);
  await expect(page).toHaveURL(/\/yonetim$/);
  await hazir(page);
  await expect(page.getByRole("heading", { level: 1, name: "Firmalar" })).toBeVisible();
});

/* FIRMA-VT FV10 (2026-10-16; K1 — reisim: "supabase ve resend bağlantılarını firma açarken biz buradan panelden yapalım daha sonra müşteri
   uğraşmasın"): Firma aç → "Kendi Supabase projesi" (yapay zekâ anahtarı isteğe bağlı) → firma sayfasında kurulum adım adım ilerler (Yönetim API'sinin
   yerel taklidi: proje arkada açılır; göçler API'yle, uygulama rolü, havuzcu, Storage, deneme, firma + ilk yönetici) → bitince sayfa yenilenir: firma
   etkin, veritabanı "kendi Supabase projesi", kurulumda girilen yapay zekâ anahtarı tanımlı (…wxyz), yönetici firmanın veritabanından → "Yöneticiye
   yeni geçici parola" → yeni firmanın adresinde o parolayla giriş (parola değiştir ekranı). Hata, kesilip sürdürme, sır: tests/firma-kurulum.test.ts. */
test("yönetim: kendi Supabase projesi — Firma aç → kurulum adım adım → tamam → geçici parolayla yeni firmaya giriş (FV10)", async ({ page, browser }, bilgi) => {
  test.setTimeout(360_000);
  const F = E2E_KURULUM.firma(bilgi.project.name);
  await parolaAdimi(page, E2E_YONETIM.proje(bilgi.project.name).etkin, E2E_PAROLA);
  await expect(page).toHaveURL(/\/yonetim$/);
  await hazir(page);
  await page.getByRole("link", { name: "Firma aç" }).first().click();
  await expect(page.getByRole("heading", { level: 1, name: "Firma aç" })).toBeVisible();
  await page.getByLabel("Ticari ünvan").fill(F.unvan);
  await page.getByLabel("Alt alan adı").fill(F.alt);
  await page.getByLabel("Kısa kod (rapor no öneki)").fill(F.kod);
  await page.getByLabel("Ad soyad").fill(F.yon);
  await page.getByLabel("E-posta (giriş adı)").fill(F.eposta);
  await expect(page.getByRole("radio", { name: /^Kendi Supabase projesi/ })).toBeChecked();
  await page.getByLabel("Yapay zekâ anahtarı (isteğe bağlı)").fill(E2E_KURULUM.yz);
  await page.getByRole("button", { name: "Firmayı aç" }).click();
  await expect(page.locator("dialog[open]")).toContainText(`${F.alt}.localhost için firmanın Supabase projesi açılıp kurulur`);
  await page.locator("dialog[open]").getByRole("button", { name: "Firmayı aç" }).click();
  /* firma sayfası: kurulum bölümü — 12 adım; sayfa açıkken ilerler */
  await expect(page).toHaveURL(/\/yonetim\/f\/[0-9a-f-]{36}$/, { timeout: 30_000 });
  await expect(page.getByRole("heading", { level: 1, name: F.unvan })).toBeVisible();
  await expect(page.getByRole("region", { name: "Kurulum" }).getByRole("list", { name: "Kurulum adımları" }).getByRole("listitem")).toHaveCount(12);
  /* bitince sayfa sunucudan yenilenir: kurulum bölümü yok, firma etkin, geçici parola tuşu açık */
  await expect(page.getByRole("button", { name: "Yöneticiye yeni geçici parola" })).toBeEnabled({ timeout: 300_000 });
  await expect(page.getByRole("region", { name: "Kurulum" })).toHaveCount(0);
  await expect(page.getByText("Etkin", { exact: true })).toBeVisible();
  await expect(page.getByText("Firmanın kendi Supabase projesi (Frankfurt)")).toBeVisible();
  await expect(page.getByText(F.eposta, { exact: false }).first()).toBeVisible();
  await expect(page.getByRole("region", { name: "Yapay zekâ anahtarı" }).getByText("…wxyz")).toBeVisible();
  await page.getByRole("button", { name: "Yöneticiye yeni geçici parola" }).click();
  await page.locator("dialog[open]").getByRole("button", { name: "Oluştur" }).click();
  await expect(page.locator("#yf-parola")).toBeVisible({ timeout: 30_000 });
  const parola = (await page.locator("#yf-parola").innerText()).trim();
  expect(parola).toMatch(/^[A-Za-z2-9]{5}-[A-Za-z2-9]{5}-[A-Za-z2-9]{5}$/);
  const kisi = await (await browser.newContext()).newPage();
  await kisi.goto(`http://${F.alt}.localhost:${E2E_KAPI}/giris`);
  await hazir(kisi);
  await kisi.getByLabel("E-posta").fill(F.eposta);
  await kisi.getByLabel("Parola", { exact: true }).fill(parola);
  await kisi.getByRole("button", { name: "Giriş yap" }).click();
  await expect(kisi).toHaveURL(/\/giris\/parola$/);
  await kisi.context().close();
});

/* FIRMA-VT FV11 (2026-10-16; K2 — reisim: "resend için tek seçenek var ve o da firmaların kendi mail adresleri ile mail atılması"): firma sayfasında
   "E-posta gönderimi" — geçersiz alan adı alanın altında reddedilir; alan adı eklenir (Resend Yönetim API taklidi), DNS kayıtları tabloda, "Doğrulanmadı";
   "Doğrula" → "Doğrulandı" (gönderme anahtarı firma tarafına kilitli yazılır — sır ve kayıt: tests/eposta-gonderim.test.ts). */
test("yönetim: e-posta gönderimi — alan adı ekle, DNS kayıtları, Doğrula → doğrulandı (FV11, K2)", async ({ page }, bilgi) => {
  test.setTimeout(180_000);
  const F = E2E_GONDERIM.firma(bilgi.project.name);
  await parolaAdimi(page, E2E_YONETIM.proje(bilgi.project.name).etkin, E2E_PAROLA);
  await expect(page).toHaveURL(/\/yonetim$/);
  await hazir(page);
  await page.getByRole("link", { name: "Firma aç" }).first().click();
  await expect(page.getByRole("heading", { level: 1, name: "Firma aç" })).toBeVisible();
  await page.getByLabel("Ticari ünvan").fill(F.unvan);
  await page.getByLabel("Alt alan adı").fill(F.alt);
  await page.getByLabel("Kısa kod (rapor no öneki)").fill(F.kod);
  await page.getByLabel("Ad soyad").fill(F.yon);
  await page.getByLabel("E-posta (giriş adı)").fill(F.eposta);
  await page.getByRole("radio", { name: /^Ortak proje/ }).check();
  await page.getByRole("button", { name: "Firmayı aç" }).click();
  await page.locator("dialog[open]").getByRole("button", { name: "Firmayı aç" }).click();
  await expect(page.getByRole("heading", { level: 1, name: F.unvan })).toBeVisible({ timeout: 30_000 });
  await page.getByRole("link", { name: "Firma sayfası" }).click();
  await expect(page.getByRole("heading", { level: 1, name: F.unvan })).toBeVisible();
  const ep = page.getByRole("region", { name: "E-posta gönderimi" });
  await ep.getByLabel("Gönderen alan adı").fill("kötü alan");
  await ep.getByRole("button", { name: "Alan adını ekle" }).click();
  await expect(ep.getByText("Alan adı okunamadı (ör. firmaniz.com.tr).")).toBeVisible({ timeout: 30_000 });
  await ep.getByLabel("Gönderen alan adı").fill(F.alan);
  await ep.getByRole("button", { name: "Alan adını ekle" }).click();
  await expect(page.getByText("Alan adı eklendi: DNS kayıtlarını alan adı yönetimine girip “Doğrula”ya basın.").first()).toBeVisible({ timeout: 30_000 });
  await expect(ep.getByText("Doğrulanmadı", { exact: true })).toBeVisible();
  await expect(ep.getByText(`bilgi@${F.alan}`)).toBeVisible();
  /* üç DNS kaydı, her birinin kopyala tuşu (telefonda liste kart görünümünde — tablo satırı sayılmaz) */
  await expect(ep.getByText("resend._domainkey")).toBeVisible();
  await expect(ep.getByText("feedback-smtp.eu-west-1.amazonses.com")).toBeVisible();
  await expect(ep.getByRole("button", { name: /değerini kopyala$/ })).toHaveCount(3);
  await ep.getByRole("button", { name: "Doğrula" }).click();
  await expect(page.getByText("Alan adı doğrulandı; firmanın e-postaları artık gönderilir.").first()).toBeVisible({ timeout: 30_000 });
  await expect(ep.getByText("Doğrulandı", { exact: true })).toBeVisible();
});

test("yönetim: kendi veritabanlı firma — özet firmanın veritabanından; yapay zekâ anahtarı kaydet / kaldır (FV9, K4)", async ({ page }, bilgi) => {
  test.setTimeout(120_000);
  await parolaAdimi(page, E2E_YONETIM.proje(bilgi.project.name).etkin, E2E_PAROLA);
  await expect(page).toHaveURL(/\/yonetim$/);
  await hazir(page);
  await page.getByRole("link", { name: E2E_KENDI.firma.ad }).first().click();
  await expect(page.getByRole("heading", { level: 1, name: E2E_KENDI.firma.ad })).toBeVisible();
  /* yönetici merkezde değil, firmanın veritabanında — sayfada görünüyorsa özet oradan geldi */
  await expect(page.getByText(E2E_KENDI.yonetici.eposta, { exact: false })).toBeVisible();
  const yz = page.getByRole("region", { name: "Yapay zekâ anahtarı" });   // Bolum: kimlik başlıkta, bölge başlıkla adlanır
  await expect(yz.getByText("Tanımlı değil")).toBeVisible();
  await yz.getByLabel("Anthropic API anahtarı").fill("anahtar-degil");
  await yz.getByRole("button", { name: "Anahtarı kaydet" }).click();
  await expect(yz.getByText("Geçerli bir Anthropic API anahtarı değil", { exact: false })).toBeVisible({ timeout: 30_000 });
  await yz.getByLabel("Anthropic API anahtarı").fill("sk-ant-uydurmaAnahtarDegil0123456789wxyz");
  await yz.getByRole("button", { name: "Anahtarı kaydet" }).click();
  await expect(page.getByText("Yapay zekâ anahtarı kaydedildi (…wxyz).").first()).toBeVisible({ timeout: 30_000 });
  /* "Tanımlı" ve son 4 aynı bilgi kutusunda (yazı "Tanımlı…wxyz") — son 4 görünür, "Tanımlı değil" yok */
  await expect(yz.getByText("…wxyz")).toBeVisible();
  await expect(yz.getByText("Tanımlı değil")).toHaveCount(0);
  await expect(yz.getByLabel("Yeni anahtar")).toHaveValue("");
  await yz.getByRole("button", { name: "Kaldır" }).click();
  await page.locator("dialog[open]").getByRole("button", { name: "Kaldır" }).click();
  await expect(page.getByText("Yapay zekâ anahtarı kaldırıldı.").first()).toBeVisible({ timeout: 30_000 });
  await expect(yz.getByText("Tanımlı değil")).toBeVisible();
});
