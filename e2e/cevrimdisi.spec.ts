/* NEREDEN GELDİ: 394 — KOD-GECIS K3 "çevrimdışı kuyruk ölçüldü (bağlantı kes / gönder / çakışma)", ARKA-UC §4.3–4.4, 09-D1 / D2, maket Z4
   (üst çubukta "Çevrimdışı · n bekliyor"; Kaydet ve Onaya gönder bağlantısızken cihaza, bağlantı gelince sırayla gider). Gerçek sunucuda, üç
   genişlikte, tarayıcının bağlantısı GERÇEKTEN kesilerek (genişlik başına ayrı rapor — öteki testlerin raporuna dokunmaz):
   · bağlantı kesik: üst çubukta "Çevrimdışı"; Kaydet cihaza → "1 bekliyor", başlıkta "Cihazda kayıt · gönderilmedi"; pencere işi listeler;
   · bağlantı gelince kendiliğinden gider, gösterge kalkar; sayfa yenilenince değer sunucuda;
   · ÇAKIŞMA: bağlantısızken yazılan kayıt, bu arada başka sekmede değişen raporu ezmez — "Çakışma" çıkar; "Benimkini yaz" açık seçimle gönderir;
   · 395: açılmış rapor bağlantı kesikken yenilenince açılır (servis çalışanı, cihazda şifreli); açılmamış sayfa "bu cihazda yok";
   · 396: kişinin planı önceden iner — hiç açılmamış plan sayfası bağlantı kesikken açılır, pencere "Çevrimdışı hazır: 1 plan";
   · 398: fotoğraf bağlantısızken cihaza (şifreli) — listede kendi yerinde "Gönderilmedi", üst çubukta "1 fotoğraf"; bağlantı gelince gider, raporun
     listesine düşer (Görüntüle);
   · Onaya gönder bağlantısızken: rapor salt okunur, "Gönderilmedi · bağlantı bekleniyor"; bağlantı gelince gider (eksikse alanlar işaretlenir). */
import { expect, test, type Page } from "@playwright/test";
import { E2E_KAPI, E2E_PAROLA, E2E_YZ } from "./hesaplar";
import { hazir } from "./yardimci";

const Y = `http://${E2E_YZ.firma.kisaAd}.localhost:${E2E_KAPI}`;
const TASMA = () => document.documentElement.scrollWidth <= window.innerWidth;
/* uydurma, en küçük yapısı doğru JPEG (e2e/foto-oku.spec.ts ile aynı; tarayıcı çözemez → küçültülmeden gider, sunucu türü baytlardan tanır) */
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x03, 0x01, 0xff, 0xda, 0x00, 0x02, 0x01, 0x02, 0x03, 0xff, 0xd9]);

/** servis çalışanı sayfanın kopyasını arka planda saklar (395): bağlantı kesilmeden önce saklandığı beklenir (anahtar: sayfanın yolu) */
async function saklandi(page: Page, yol: string) {
  await expect.poll(() => page.evaluate((y) => new Promise<boolean>((coz) => {
    const r = indexedDB.open("probata-cevrimdisi");
    r.onerror = () => coz(false);
    r.onsuccess = () => {
      const db = r.result;
      try {
        const q = db.transaction("sayfalar", "readonly").objectStore("sayfalar").getKey(y);
        q.onsuccess = () => { db.close(); coz(q.result !== undefined); };
        q.onerror = () => { db.close(); coz(false); };
      } catch { db.close(); coz(false); }
    };
  }), yol), { timeout: 30_000 }).toBe(true);
}

async function raporuAc(page: Page, kod: string): Promise<string> {
  await page.goto(`${Y}/giris`);
  await hazir(page);
  await page.getByLabel("E-posta").fill(E2E_YZ.denetci.eposta);
  await page.getByLabel("Parola", { exact: true }).fill(E2E_PAROLA);
  await page.getByRole("button", { name: "Giriş yap" }).click();
  await expect(page.locator("header")).toContainText(E2E_YZ.denetci.ad);
  await page.goto(`${Y}/raporlar`);
  await hazir(page);
  await page.getByRole("searchbox", { name: "Ekipman kodu" }).fill(kod);
  await page.getByRole("link", { name: /^YZ-/ }).first().click();
  await expect(page).toHaveURL(/\/raporlar\/[0-9a-f-]{36}$/, { timeout: 30_000 });
  await hazir(page);
  return page.url();
}

test("çevrimdışı: bağlantı kes → Kaydet cihaza → bağlantı gelince gider; çakışma ezmez, 'Benimkini yaz'; Onaya gönder bekler", async ({ page, browser }, bilgi) => {
  test.setTimeout(180_000);
  const adres = await raporuAc(page, E2E_YZ.cevrimdisi[bilgi.project.name]);
  const marka = page.getByLabel("Marka", { exact: true });
  const cip = page.getByRole("button", { name: /^Çevrimdışı/ });

  /* 1) bağlantı kesik: Kaydet cihaza */
  await page.context().setOffline(true);
  await expect(cip).toBeVisible();
  await marka.fill("Çevrimdışı Marka");
  await page.getByRole("button", { name: "Kaydet", exact: true }).click();
  await expect(page.getByText("Cihaza kaydedildi; bağlantı gelince gönderilecek.").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Çevrimdışı, 1 işlem gönderilmeyi bekliyor; ayrıntı" })).toBeVisible();
  await expect(page.getByText("Cihazda kayıt · gönderilmedi")).toBeVisible();
  expect(await page.evaluate(TASMA), "çevrimdışı şeridiyle yana taşma yok").toBe(true);
  await cip.click();
  const pencere = page.getByRole("dialog", { name: "Çevrimdışı" });
  await expect(pencere.getByText("İnternet yok.", { exact: false })).toBeVisible();
  await expect(pencere.getByText(/^Rapor kaydı · YZ-/)).toBeVisible();
  await expect(pencere.getByText("Gönderilmeyi bekliyor")).toBeVisible();
  await pencere.getByRole("button", { name: "Kapat" }).last().click();

  /* 2) bağlantı gelince kendiliğinden gider */
  await page.context().setOffline(false);
  await expect(page.getByText("cihazda bekleyen kayıt gönderildi", { exact: false }).first()).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("button", { name: /Çevrimdışı|bekleyen işlem/ })).toHaveCount(0);
  await page.goto(adres);
  await hazir(page);
  await expect(marka).toHaveValue("Çevrimdışı Marka");

  /* 3) çakışma: bağlantısızken yazılan, bu arada başka sekmede değişen raporu ezmez */
  await page.context().setOffline(true);
  await marka.fill("Cihazdaki Marka");
  await page.getByRole("button", { name: "Kaydet", exact: true }).click();
  await expect(page.getByText("Cihaza kaydedildi; bağlantı gelince gönderilecek.").first()).toBeVisible();
  const ikinci = await (await browser.newContext({ viewport: page.viewportSize() })).newPage();
  await raporuAc(ikinci, E2E_YZ.cevrimdisi[bilgi.project.name]);
  await ikinci.getByLabel("Marka", { exact: true }).fill("Sunucudaki Marka");
  await ikinci.getByRole("button", { name: "Kaydet", exact: true }).click();
  await expect(ikinci.getByText("Rapor kaydedildi.").first()).toBeVisible({ timeout: 30_000 });
  await ikinci.context().close();
  await page.context().setOffline(false);
  const bekleyen = page.getByRole("button", { name: /bekleyen işlem/ });
  await expect(bekleyen).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("cihazda bekleyen iş gönderilemedi", { exact: false })).toBeVisible();
  await bekleyen.click();
  const p2 = page.getByRole("dialog", { name: "Bekleyen işlemler" });
  await expect(p2.getByText("Çakışma")).toBeVisible();
  await expect(p2.getByText("başka yerde değiştirildi", { exact: false })).toBeVisible();
  await p2.getByRole("button", { name: "Benimkini yaz" }).click();
  await expect(page.getByText("cihazda bekleyen kayıt gönderildi", { exact: false }).first()).toBeVisible({ timeout: 30_000 });
  await page.goto(adres);
  await hazir(page);
  await expect(marka).toHaveValue("Cihazdaki Marka");

  /* 4) sayfa bağlantısız açılır (395): servis çalışanı devredeyken açılan rapor bu cihazda (şifreli) saklanır → bağlantı kesikken yenilenince
     açılır, değerler yerinde; hiç açılmamış sayfa "bu cihazda yok" der */
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.goto(adres);
  await hazir(page);
  await saklandi(page, new URL(adres).pathname);
  await page.context().setOffline(true);
  await page.reload();
  await hazir(page);
  await expect(marka).toHaveValue("Cihazdaki Marka");
  await expect(cip).toBeVisible();
  await page.goto(`${Y}/raporlar/00000000-0000-4000-8000-000000000000`);
  await expect(page.getByRole("heading", { name: "Bu sayfa bu cihazda yok" })).toBeVisible();
  await page.goto(adres);
  await hazir(page);
  await page.context().setOffline(false);

  /* 5) önceden indirme (396): kişinin planı bağlantı varken cihaza iner — HİÇ AÇILMAMIŞ plan sayfası bağlantı kesikken açılır; pencere
     "Çevrimdışı hazır: 1 plan" der */
  const planAdresi = await page.getByRole("navigation", { name: "Konum" }).getByRole("link").nth(1).getAttribute("href");
  expect(planAdresi).toMatch(/^\/planlar\/[0-9a-f-]{36}$/);
  await expect(page.locator("html[data-cevrimdisi-hazir]")).toHaveCount(1, { timeout: 60_000 });
  await saklandi(page, planAdresi!);
  await page.context().setOffline(true);
  await page.goto(`${Y}${planAdresi}`);
  await hazir(page);
  await expect(page.getByRole("heading", { name: "Bu sayfa bu cihazda yok" })).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await cip.click();
  await expect(page.getByRole("dialog", { name: "Çevrimdışı" }).getByText("Çevrimdışı hazır:", { exact: false })).toContainText("1 plan");
  await page.getByRole("dialog", { name: "Çevrimdışı" }).getByRole("button", { name: "Kapat" }).last().click();
  await page.goto(adres);
  await hazir(page);
  await page.context().setOffline(false);

  /* 6) fotoğraf bağlantısızken (398): cihaza kaydedilir, kendi yerinde "Gönderilmedi"; bağlantı gelince gider ve raporun listesine düşer */
  await page.context().setOffline(true);
  await page.getByLabel("Fotoğraf ekle", { exact: true }).first().setInputFiles({ name: "saha.jpg", mimeType: "image/jpeg", buffer: JPEG });
  await expect(page.getByText("Fotoğraf cihaza kaydedildi; bağlantı gelince gönderilecek.").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Çevrimdışı, 1 fotoğraf gönderilmeyi bekliyor; ayrıntı" })).toBeVisible();
  await expect(page.getByText("Cihazda 1 fotoğraf · gönderilmedi")).toBeVisible();
  const fotoSatiri = page.getByRole("listitem").filter({ hasText: "saha.jpg" });
  await expect(fotoSatiri.getByText("Gönderilmedi", { exact: true })).toBeVisible();
  await expect(fotoSatiri.getByRole("button", { name: "saha.jpg kaldır" })).toBeVisible();
  expect(await page.evaluate(TASMA), "bekleyen fotoğraf satırıyla yana taşma yok").toBe(true);
  await page.context().setOffline(false);
  await expect(page.getByText("cihazda bekleyen fotoğraf gönderildi", { exact: false }).first()).toBeVisible({ timeout: 30_000 });
  await expect(fotoSatiri.getByRole("link", { name: "Görüntüle" })).toBeVisible({ timeout: 30_000 });
  await expect(fotoSatiri.getByText("Gönderilmedi", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Çevrimdışı|bekleyen işlem/ })).toHaveCount(0);

  /* 7) Onaya gönder bağlantısızken: rapor salt okunur, bağlantı gelince gider (eksikse alanlar işaretlenir) */
  await page.context().setOffline(true);
  await page.getByRole("button", { name: "Onaya gönder" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Onaya gönder" }).click();
  await expect(page.getByText("Cihaza kaydedildi: bağlantı gelince onaya gider.").first()).toBeVisible();
  await expect(page.getByText("Gönderilmedi · bağlantı bekleniyor")).toBeVisible();
  await expect(page.getByText("Onaya gönderim bu cihazda bekliyor", { exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: "Kaydet", exact: true })).toHaveCount(0);
  await page.context().setOffline(false);
  await expect(page.getByText("onaya gönderim gitti", { exact: false }).first().or(page.getByRole("dialog", { name: "Zorunlu alanlar doldurulmadı" })))
    .toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("Gönderilmedi · bağlantı bekleniyor")).toHaveCount(0);
});
