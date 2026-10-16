/* NEREDEN GELDİ: FIRMA-VT.md FV3 (sunum 579; reisim 2026-10-15: "supabase ve resend bağlantılarını firma açarken biz buradan panelden yapalım") —
   yeni firmaların verisi KENDİ veritabanında. Uçtan uca sunucusunda (scripts/e2e-sunucu.ts) "kendivt" firması aynı kümede AYRI veritabanında; merkezde
   yalnız kaydı, şifreli bağlantısı ve kurulumu var — bir de aynı firma kimliğiyle TUZAK müşteri. Gerçek tarayıcıda, yayın derlemesinde, üç genişlikte:
   · adres → merkezdeki kayıt → firmanın veritabanı: giriş sayfası firmayı bulur, firmanın KENDİ veritabanındaki hesapla girilir (merkezde hesabı yok);
   · okuma kendi veritabanından: tohum müşteri görünür, merkezdeki tuzak görünmez;
   · yazma kendi veritabanına: yeni müşteri kaydedilir, sayfası ve listede görünür (merkeze gitseydi veritabanı reddederdi — vt_firma_dogrula);
   · ortak veritabanındaki firma (deneme) bu kaydı ne listede görür ne adresiyle açar;
   · FV5 (2026-10-16): dosya firmanın KENDİ Storage'ında — logo yüklenir; içerik uçtan aynen iner (fetch: içerik kendi kökenimizden akar); sayfa
     olarak açılınca firmanın Storage'ının imzalı adresi gelir (yerel Storage taklidi; ortak firmaların deposu veritabanı, imzalı adres vermez) ve o
     adres aynı içeriği verir; kaldırılır.
   Her proje kendi uydurma kaydını açar (çakışmasın). Veritabanına doğrudan sorgu yok — yalnız ekrandan. */
import { expect, test, type Page } from "@playwright/test";
import { E2E_KAPI, E2E_KENDI, E2E_PAROLA } from "./hesaplar";
import { girisli, hazir } from "./yardimci";

const parca = (ad: string, govde: string) => Buffer.concat([Buffer.from([0, 0, govde.length >> 8, govde.length & 0xff]), Buffer.from(ad + govde, "latin1"), Buffer.from([0, 0, 0, 0])]);
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), parca("IHDR", "\0\0\0\x01\0\0\0\x01\x08\x02\0\0\0"), parca("IDAT", "veri"), parca("IEND", "")]);

/** FV5: firma bilgileri penceresinde logo yükler, dosyanın adresini döner (/api/dosya/<id>) */
async function logoYukle(page: Page): Promise<string> {
  await page.locator('[data-panel="firma"]').click();
  const d = page.getByRole("dialog", { name: "Firma bilgileri" });
  await expect(d).toBeVisible();
  /* önceki denemeden kalan logo varsa önce kaldırılır (yeniden deneme) */
  if (await d.getByRole("button", { name: "Firma logosu kaldır" }).count()) {
    await d.getByRole("button", { name: "Firma logosu kaldır" }).click();
    await page.getByRole("dialog", { name: "Firma logosu kaldırılsın mı?" }).getByRole("button", { name: "Kaldır" }).click();
    await expect(page.getByText("Firma logosu kaldırıldı.").first()).toBeVisible({ timeout: 30_000 });
  }
  const [fc] = await Promise.all([page.waitForEvent("filechooser"), d.getByRole("button", { name: "Logo yükle" }).click()]);
  await fc.setFiles({ name: "logo.png", mimeType: "image/png", buffer: PNG });
  await expect(page.getByText("Firma logosu kaydedildi.").first()).toBeVisible({ timeout: 30_000 });
  const bag = d.getByRole("link", { name: /Firma logosu: logo\.png/ });
  await expect(bag).toBeVisible();
  const href = await bag.getAttribute("href");
  expect(href).toMatch(/^\/api\/dosya\/[0-9a-f-]{36}/);
  return href!;
}

test("kendi veritabanlı firma: giriş, kayıt yazma; veri kendi veritabanından (merkezdeki tuzak görünmez); dosya kendi Storage'ında; ortak firma görmez", async ({ page }, bilgi) => {
  test.setTimeout(120_000);
  const ek = `${bilgi.project.name} ${bilgi.retry}`;
  const adres = `http://${E2E_KENDI.firma.kisaAd}.localhost:${E2E_KAPI}`;
  const unvan = `Kendi VT Kayıt ${ek} A.Ş.`;

  /* giriş: adres firmayı bulur; hesap firmanın kendi veritabanında */
  await page.goto(`${adres}/giris`);
  await hazir(page);
  await expect(page.getByText(`${E2E_KENDI.firma.kisaAd}.localhost`)).toBeVisible();
  await expect(page.getByText("Bu adreste kayıtlı bir firma yok.", { exact: false })).toHaveCount(0);
  await page.getByLabel("E-posta").fill(E2E_KENDI.yonetici.eposta);
  await page.getByLabel("Parola", { exact: true }).fill(E2E_PAROLA);
  await page.getByRole("button", { name: "Giriş yap" }).click();
  await expect(page.locator("header")).toContainText(E2E_KENDI.yonetici.ad, { timeout: 30_000 });

  /* okuma kendi veritabanından: tohum müşteri var, merkezdeki tuzak (aynı firma kimliğiyle) yok */
  await page.goto(`${adres}/musteriler`);
  await hazir(page);
  await expect(page.getByRole("link", { name: E2E_KENDI.musteri }).first()).toBeVisible();
  await expect(page.getByText(E2E_KENDI.tuzak)).toHaveCount(0);

  /* yazma kendi veritabanına */
  await page.getByRole("button", { name: "Müşteri ekle" }).click();
  const p = page.getByRole("dialog", { name: "Müşteri ekle" });
  await p.getByLabel("Ünvan").fill(unvan);
  await p.getByRole("button", { name: "Kaydet" }).click();
  await expect(page).toHaveURL(/\/musteriler\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("heading", { level: 1, name: unvan })).toBeVisible();
  const kayitYolu = new URL(page.url()).pathname;
  await page.goto(`${adres}/musteriler`);
  await hazir(page);
  await page.getByRole("searchbox", { name: "Müşterilerde ara" }).fill(unvan);
  await expect(page.getByRole("link", { name: unvan }).first()).toBeVisible();
  await expect(page.getByText(E2E_KENDI.tuzak)).toHaveCount(0);

  /* FV5: dosya firmanın kendi Storage'ında — yükle, uçtan aynen iner; sayfa olarak açılınca firmanın Storage'ının imzalı adresi (ortak firmaların
     veritabanı deposu imzalı adres vermez — yönlendirme yanlışsa ya dosya inmez ya imzalı adres gelmez) */
  await page.goto(`${adres}/firma-ayarlari`);
  await hazir(page);
  const href = await logoYukle(page);
  const ic = await page.request.get(`${adres}${href}`);
  expect(ic.status()).toBe(200);
  expect(Buffer.from(await ic.body()).equals(PNG), "uçtan inen içerik yüklenenle aynı").toBe(true);
  await page.goto(`${adres}${href}`);
  const imzali = await page.locator("img").getAttribute("src");
  expect(imzali).toMatch(/^http:\/\/127\.0\.0\.1:\d+\/storage\/v1\/object\/sign\/probata\/firma\/[0-9a-f-]{36}\//);
  const st = await page.request.get(imzali!);
  expect(st.status()).toBe(200);
  expect(Buffer.from(await st.body()).equals(PNG), "firmanın Storage'ındaki içerik yüklenenle aynı").toBe(true);
  await page.goto(`${adres}/firma-ayarlari`);
  await hazir(page);
  await page.locator('[data-panel="firma"]').click();
  const fp = page.getByRole("dialog", { name: "Firma bilgileri" });
  await fp.getByRole("button", { name: "Firma logosu kaldır" }).click();
  await page.getByRole("dialog", { name: "Firma logosu kaldırılsın mı?" }).getByRole("button", { name: "Kaldır" }).click();
  await expect(page.getByText("Firma logosu kaldırıldı.").first()).toBeVisible({ timeout: 30_000 });

  /* ortak veritabanındaki firma bu kaydı görmez, adresiyle de açamaz */
  await girisli(page, "yonetici");
  await page.goto(kayitYolu);
  await expect(page.getByText("Sayfa bulunamadı")).toBeVisible();
  await page.goto("/musteriler");
  await hazir(page);
  await page.getByRole("searchbox", { name: "Müşterilerde ara" }).fill("Kendi VT");
  await expect(page.getByRole("link", { name: unvan })).toHaveCount(0);
  await expect(page.getByRole("link", { name: E2E_KENDI.musteri })).toHaveCount(0);
});
