/* NEREDEN GELDİ: 524 — S.A.Y Chat (pkproje §3.10; maket 521 maket-saychat.js ekran 1–9 — reisim 2026-10-13: "onayılıyorum, yap bitir"). Gerçek
   sunucuda, üç genişlikte, yapay zekâsı açık uydurma firmanın (YZ) kabul edilmiş bugünkü planında, plan ekibindeki denetçiyle (yerel Anthropic
   taklidi — gerçek hizmete istek gitmez):
   · plan içinde S.A.Y düğmesinin yanında "S.A.Y Chat"; açılınca S.A.Y paneli kapalı (aynı yer) · Fotoğraf çek → Ekipman seçin (Plandan seç, arama)
     → yönerge + numaralı mesaj, satırların düştüğü alanlar (fazla satır nota) → okunacak fotoğraf → etiket fotoğrafı: kota uyarısı, "Oku ve mesaja
     yaz" boş satırlara yazar ("okundu") → Gönder: kayıt listede, gidince "Gönderildi" → Düzenle → Kaydı sil (önce sorar);
   · bağlantı kesikken Gönder: kayıt "Cihazda", bağlantı gelince gider;
   · ekip dışındaki (yönetici) plan içinde S.A.Y Chat görmez. Telefonda panel tam ekran; yana taşma yok. */
import { expect, test, type Page } from "@playwright/test";
import { E2E_KAPI, E2E_PAROLA, E2E_YZ } from "./hesaplar";
import { hazir } from "./yardimci";

const Y = `http://${E2E_YZ.firma.kisaAd}.localhost:${E2E_KAPI}`;
const TASMA = () => document.documentElement.scrollWidth <= window.innerWidth;
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFElEQVR4nGP4z8DAwAAi/v///x8AHu8F+5BApdwAAAAASUVORK5CYII=", "base64");
const foto = (ad: string) => ({ name: ad, mimeType: "image/png", buffer: PNG });

async function giris(page: Page, h: { eposta: string; ad: string }) {
  await page.goto(`${Y}/giris`);
  await hazir(page);
  await page.getByLabel("E-posta").fill(h.eposta);
  await page.getByLabel("Parola", { exact: true }).fill(E2E_PAROLA);
  await page.getByRole("button", { name: "Giriş yap" }).click();
  await expect(page.locator("header")).toContainText(h.ad);
}
/** YZ planının adresi: planın bir raporundan (kırıntıdaki plan bağlantısı) */
async function planAdresi(page: Page) {
  await page.goto(`${Y}/raporlar`);
  await hazir(page);
  await page.getByRole("link", { name: /^YZ-/ }).first().click();
  await expect(page).toHaveURL(/\/raporlar\/[0-9a-f-]{36}$/, { timeout: 30_000 });
  const adres = await page.getByRole("navigation", { name: "Konum" }).getByRole("link").nth(1).getAttribute("href");
  expect(adres).toMatch(/^\/planlar\/[0-9a-f-]{36}$/);
  return adres!;
}

test("S.A.Y Chat: fotoğraf, ekipman, numaralı mesaj, okunacak fotoğraf, etiketten okuma, gönder, düzenle, sil; çevrimdışı cihazda", async ({ page }, bilgi) => {
  test.setTimeout(150_000);
  const kod = E2E_YZ.sayChat[bilgi.project.name];
  await giris(page, E2E_YZ.denetci);
  const adres = await planAdresi(page);
  await page.goto(`${Y}${adres}`);
  await hazir(page);

  const fab = page.getByRole("button", { name: "S.A.Y Chat — planın sohbeti" });
  await expect(fab).toBeVisible({ timeout: 30_000 });
  await fab.click();
  const panel = page.getByRole("dialog", { name: "S.A.Y Chat" });
  await expect(panel).toBeVisible();
  await expect(page.getByRole("dialog", { name: "S.A.Y", exact: true })).toHaveCount(0);
  if (bilgi.project.name === "telefon") expect(Math.round((await panel.boundingBox())!.width)).toBe(page.viewportSize()!.width);
  await expect(panel).toContainText("Bu sohbeti yalnız siz görürsünüz");

  /* 1 · fotoğraf → ekipman seçimi */
  await panel.getByLabel("Fotoğraf çek").setInputFiles(foto("pano-on.png"));
  const secim = page.getByRole("dialog", { name: "Ekipman seçin" });
  await expect(secim).toBeVisible();
  await expect(secim.getByRole("tab", { name: "Plandan seç" })).toHaveAttribute("aria-selected", "true");
  await secim.getByLabel("Ara").fill(kod);
  await secim.getByRole("button", { name: new RegExp(kod) }).click();
  await expect(secim).toHaveCount(0);
  await expect(panel.getByRole("heading", { name: new RegExp(`Yeni kayıt · ${kod}`) })).toBeVisible();

  /* 2 · numaralı mesaj: 1. satır marka, 2. "-", fazla satır nota */
  const s1 = panel.getByRole("textbox", { name: /^1\. satır/ });
  await s1.fill("Deneme Marka");
  await panel.getByRole("textbox", { name: /^2\. satır/ }).fill("-");
  const dagilim = panel.getByRole("list", { name: "Satırların düştüğü alanlar" });
  await expect(dagilim.getByRole("listitem").first()).toContainText("✓");
  await expect(dagilim.getByRole("listitem").nth(1)).toContainText("boş");
  const son = panel.getByRole("textbox", { name: /nota eklenir/ });
  await son.fill("pano kapağı kilitsiz");
  await expect(dagilim).toContainText("fazla satır → nota eklenir");

  /* 3 · okunacak fotoğraf (linye) */
  const linye = panel.locator("li", { has: page.getByText("Pano sigortaları", { exact: false }) }).first();
  await linye.getByLabel("Fotoğraf çek").setInputFiles(foto("linye.png"));
  await expect(linye).toContainText("1 fotoğraf");

  /* 4 · etiketten okuma: kota uyarısı, boş satırlara yazar */
  await panel.getByLabel("Etiket fotoğrafı").setInputFiles(foto("etiket.png"));
  const et = page.getByRole("dialog", { name: "Etiketten okuma" });
  await expect(et).toContainText("firmanın kotasından harcar");
  await et.getByRole("button", { name: "Oku ve mesaja yaz" }).click();
  await expect(et).toHaveCount(0, { timeout: 30_000 });
  await expect(s1).toHaveValue("Deneme Marka", { timeout: 10_000 });   // dolu satır ezilmez
  await expect(panel.getByRole("textbox", { name: /^2\. satır/ })).toHaveValue("OK-200");
  await expect(panel.getByText("okundu", { exact: true })).toBeVisible();

  /* 5 · Gönder → listede, gidince Gönderildi */
  await panel.getByRole("button", { name: "Gönder" }).click();
  const kayit = panel.getByRole("list", { name: "Kayıtlar" }).getByRole("listitem").filter({ hasText: kod }).first();
  await expect(kayit).toBeVisible();
  await expect(kayit).toContainText("Gönderildi", { timeout: 30_000 });
  await expect(kayit).toContainText("Deneme Marka");
  await expect(kayit).toContainText("pano kapağı kilitsiz");
  expect(await page.evaluate(TASMA), "yana taşma yok").toBe(true);

  /* 6 · bağlantı kesikken düzenle + kaydet: Cihazda, bağlantı gelince gider */
  await kayit.getByRole("button", { name: /düzenle/ }).click();
  await expect(panel.getByRole("heading", { name: /Kaydı düzenle/ })).toBeVisible();
  await page.context().setOffline(true);
  await panel.getByRole("textbox", { name: /^1\. satır/ }).fill("Bağlantısız Marka");
  await panel.getByRole("button", { name: "Kaydet" }).click();
  await expect(panel).toContainText("Çevrimdışı");
  await expect(kayit).toContainText("Cihazda");
  await expect(kayit).toContainText("Bağlantısız Marka");
  await page.context().setOffline(false);
  await expect(kayit).toContainText("Gönderildi", { timeout: 60_000 });
  await expect(kayit).toContainText("Bağlantısız Marka");

  /* 7 · sil (önce sorar) */
  await kayit.getByRole("button", { name: /düzenle/ }).click();
  await panel.getByRole("button", { name: "Kaydı sil" }).click();
  await page.getByRole("dialog", { name: "Kaydı sil" }).getByRole("button", { name: "Sil" }).click();
  await expect(panel.getByRole("list", { name: "Kayıtlar" }).getByRole("listitem").filter({ hasText: kod })).toHaveCount(0, { timeout: 30_000 });

  /* Esc kapatır, odak düğmede */
  await panel.getByLabel("Fotoğraf çek").focus();
  await page.keyboard.press("Escape");
  await expect(panel).toHaveCount(0);
  await expect(fab).toBeFocused();
});

/* 525: bekleyenler için rapor yaz — "Yeni ekle" kaydı (genişlik + deneme başına ayrı kod; plandaki ekipmana dokunmaz) → kod → taslak; okunacak
   fotoğraf yapay zekâyla okunur (taklit), rapor ekranında "S.A.Y Chat kaydından oluşturuldu" şeridi ve tablonun öneri kartı */
test("S.A.Y Chat: bekleyenler için rapor yaz — kod, koşullar, taslak, raporda şerit ve öneri", async ({ page }, bilgi) => {
  test.setTimeout(180_000);
  const kod = `SC${({ masaustu: "M", tablet: "T", telefon: "F" } as Record<string, string>)[bilgi.project.name] ?? "X"}-${bilgi.retry}${Date.now() % 1000}`;
  await giris(page, E2E_YZ.denetci);
  const adres = await planAdresi(page);
  await page.goto(`${Y}${adres}`);
  await hazir(page);
  await page.getByRole("button", { name: "S.A.Y Chat — planın sohbeti" }).click();
  const panel = page.getByRole("dialog", { name: "S.A.Y Chat" });
  await panel.getByLabel("Fotoğraf çek").setInputFiles(foto("yeni-pano.png"));
  const secim = page.getByRole("dialog", { name: "Ekipman seçin" });
  await secim.getByRole("tab", { name: "Yeni ekle" }).click();
  await secim.getByRole("button", { name: /Elektrik panosu/ }).first().click();
  await panel.getByRole("textbox", { name: /^1\. satır/ }).fill("Rapor Marka");
  const linye = panel.locator("li", { has: page.getByText("Pano sigortaları", { exact: false }) }).first();
  await linye.getByLabel("Fotoğraf çek").setInputFiles(foto("linye-2.png"));
  await panel.getByRole("button", { name: "Gönder" }).click();
  const kayit = panel.getByRole("list", { name: "Kayıtlar" }).getByRole("listitem").filter({ hasText: "Rapor Marka" }).first();
  await expect(kayit).toContainText("Gönderildi", { timeout: 30_000 });

  await panel.getByRole("button", { name: /Bekleyenler için rapor yaz/ }).click();
  await expect(panel.getByRole("heading", { name: "Bekleyenler için rapor yaz" })).toBeVisible();
  await expect(panel).toContainText("İnternet var: rapor numarası sunucuda verilir");
  await expect(panel).toContainText("firmanın kotasından harcar");
  const kayitlar = panel.getByRole("list", { name: "Rapora dönüşecek kayıtlar" }).getByRole("listitem");
  const benim = kayitlar.filter({ hasText: "Plana yeni ekipman olarak eklenecek" }).first();
  await benim.getByLabel(/Ekipman kodu/).fill(kod);
  /* öteki genişliklerin kayıtları kişiye ait değil — ama bu kişide eski kod isteyen kayıt kaldıysa onlara da kod verilir */
  for (const g of await kayitlar.filter({ has: page.getByLabel(/Ekipman kodu/) }).all()) {
    const k = g.getByLabel(/Ekipman kodu/);
    if (!(await k.inputValue())) await k.fill(`${kod}${Math.floor(Math.random() * 90 + 10)}`);
  }
  await panel.getByRole("button", { name: /rapor taslağı oluştur/ }).click();
  const sonuc = panel.getByRole("status").filter({ hasText: "rapor taslağı oluştu" });
  await expect(sonuc).toBeVisible({ timeout: 90_000 });
  await expect(sonuc).toContainText("değer öneri");   // okunacak fotoğraf yapay zekâyla okundu (taklit), öneri raporda bekliyor
  await sonuc.getByRole("link", { name: "Raporu aç" }).first().click();
  await expect(page).toHaveURL(/\/raporlar\/[0-9a-f-]{36}$/, { timeout: 30_000 });
  await hazir(page);
  await expect(page.getByText("S.A.Y Chat kaydından oluşturuldu.", { exact: false })).toBeVisible();
  /* önerisi bekleyen bölüm açık gelir, kartı görünür */
  await expect(page.getByRole("region", { name: /fotoğraftan okunan/ }).first()).toBeVisible();
});

test("S.A.Y Chat: plan ekibinde olmayan (yönetici) görmez", async ({ page }) => {
  await giris(page, E2E_YZ.yonetici);
  const adres = await planAdresi(page);
  await page.goto(`${Y}${adres}`);
  await hazir(page);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("button", { name: "S.A.Y Chat — planın sohbeti" })).toHaveCount(0);
});
