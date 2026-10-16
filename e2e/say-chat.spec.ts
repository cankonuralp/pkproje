/* NEREDEN GELDİ: 524 — S.A.Y Chat (pkproje §3.10; maket 521 maket-saychat.js ekran 1–9 — reisim 2026-10-13: "onayılıyorum, yap bitir"). Gerçek
   sunucuda, üç genişlikte, yapay zekâsı açık uydurma firmanın (YZ) kabul edilmiş bugünkü planında, plan ekibindeki denetçiyle (yerel Anthropic
   taklidi — gerçek hizmete istek gitmez):
   · plan içinde S.A.Y düğmesinin yanında "S.A.Y Chat"; açılınca S.A.Y paneli kapalı (aynı yer) · Fotoğraf çek → Ekipman seçin (Plandan seç, arama)
     → mesaj → okunacak fotoğraf → etiket → Gönder: kayıt listede, gidince "Gönderildi" → Düzenle → Kaydı sil (önce sorar);
   · 542 (reisim 2026-10-14: "mesaj yazar gibi olmalı satıra yazıp alt satıra geçmem yeterli olmalı … nereye ne gireceğim ekranda gözükmeli",
     "etiket fotoğrafı koyunca uyarı ekranı gelmesin", "görüntüle tuşu ile görebiliyor olmam gerekli", "offline çalışmaya da uygun olmalı"): mesaj
     TEK yazı kutusu, solda satır adları; Enter alttaki satıra geçer (satır açmaz), son satırdan sonrası nota; etiket uyarısız eklenir, "Görüntüle"
     büyük görüntüyü açar, "Etiketten oku" boş satırlara yazar; bağlantısızken etiket eklenir ("Etiketten oku" görünmez), kayıtla gider;
   · 527 (reisim 2026-10-13: "fotoğraf işaretine tıklayınca galeriden veya pc den de fotoğraf yükleyebilmek olsun"): fotoğraf tuşu menü açar — Fotoğraf
     çek · Galeriden / bilgisayardan seç (birden çok); Esc yalnız menüyü kapatır (panel açık kalır, odak tuşta); PNG / JPEG olmayan dosya eklenmez, söylenir;
   · bağlantı kesikken Gönder: kayıt "Cihazda", bağlantı gelince gider;
   · ekip dışındaki (yönetici) plan içinde S.A.Y Chat görmez. Telefonda panel tam ekran; yana taşma yok.
   · 561 (reisim 2026-10-15: "chati yukarıdan tutup aşağıya doğru küçültmeyi yapamadım"): panel tutamaktan ve başlıktan sürüklenerek kısalır, Home
     tam boy (S.A.Y ile aynı ortak parça — components/pencere/PanelBoyu). */
import { expect, test, type Page } from "@playwright/test";
import { E2E_KAPI, E2E_PAROLA, E2E_YZ } from "./hesaplar";
import { hazir, panelBoyunuDene } from "./yardimci";

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

test("S.A.Y Chat: fotoğraf, ekipman, tek kutuda mesaj, okunacak fotoğraf, etiket (uyarısız, görüntüle, etiketten oku), gönder, düzenle, sil; çevrimdışı", async ({ page }, bilgi) => {
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
  /* 561: S.A.Y ile aynı ortak boy — tutamaktan ve başlıktan sürükleyince kısalır, Home tam boy */
  await panelBoyunuDene(page, panel, /^S\.A\.Y Chat'in boyu/, "S.A.Y Chat");

  /* 1 · fotoğraf tuşu menüsü: Esc yalnız menüyü kapatır; galeriden iki fotoğraf → ekipman seçimi */
  const fotoEkle = panel.getByRole("button", { name: "Fotoğraf ekle" });
  await fotoEkle.click();
  await expect(fotoEkle).toHaveAttribute("aria-expanded", "true");
  await expect(panel.getByText("Fotoğraf çek")).toBeVisible();
  await expect(panel.getByText("Galeriden / bilgisayardan seç")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(fotoEkle).toHaveAttribute("aria-expanded", "false");
  await expect(panel).toBeVisible();
  await expect(fotoEkle).toBeFocused();
  await fotoEkle.click();
  await panel.getByLabel("Galeriden / bilgisayardan seç").setInputFiles([foto("pano-on.png"), foto("pano-yan.png")]);
  const secim = page.getByRole("dialog", { name: "Ekipman seçin" });
  await expect(secim).toBeVisible();
  await expect(secim.getByRole("tab", { name: "Plandan seç" })).toHaveAttribute("aria-selected", "true");
  await secim.getByLabel("Ara").fill(kod);
  await secim.getByRole("button", { name: new RegExp(kod) }).click();
  await expect(secim).toHaveCount(0);
  await expect(panel.getByRole("heading", { name: new RegExp(`Yeni kayıt · ${kod}`) })).toBeVisible();
  /* 542: ekipman seçilince odak mesaj kutusunda (ilk satır) — yazmaya hazır */
  await expect(panel.getByRole("textbox", { name: /^Mesaj/ })).toBeFocused();
  /* galeriden seçilen iki fotoğraf ve "+ ek" tuşu; PNG / JPEG olmayan eklenmez */
  const ekipFoto = panel.getByRole("list", { name: "Ekipman fotoğrafları" });
  await expect(ekipFoto.locator("img")).toHaveCount(2);
  await panel.getByRole("button", { name: "Ekipman fotoğrafı ekle" }).click();
  await panel.getByLabel("Galeriden / bilgisayardan seç").setInputFiles({ name: "notlar.txt", mimeType: "text/plain", buffer: Buffer.from("deneme") });
  await expect(page.getByText("notlar.txt eklenmedi: yalnız JPEG ya da PNG", { exact: false }).first()).toBeVisible();
  await expect(ekipFoto.locator("img")).toHaveCount(2);

  /* 2 · mesaj tek kutu: solda satır adları hep görünür (n. satır = n. bilgi); yazıp Enter → alttaki satır (satır açmaz); fazla satır nota */
  const mesaj = panel.getByRole("textbox", { name: /^Mesaj/ });
  const adlar = panel.locator('ol[aria-hidden="true"]');
  await expect(adlar.locator("li").first()).toBeVisible();   // ad sütunu ekran okuyucudan gizli (adlar kutunun açıklamasında)
  const ilkAd = (await adlar.locator("li").first().textContent())!.trim();
  expect(ilkAd.length).toBeGreaterThan(0);
  await mesaj.focus();
  await mesaj.evaluate((el: HTMLTextAreaElement) => el.setSelectionRange(0, 0));
  const satirSayisi = (await mesaj.inputValue()).split("\n").length;
  await page.keyboard.type("Deneme Marka");
  await page.keyboard.press("Enter");
  await page.keyboard.type("-");
  const yazilan = (await mesaj.inputValue()).split("\n");
  expect(yazilan.slice(0, 2)).toEqual(["Deneme Marka", "-"]);
  expect(yazilan.length, "Enter satır açmadı, alttaki satıra geçti").toBe(satirSayisi);
  await mesaj.fill([...yazilan, "pano kapağı kilitsiz"].join("\n"));
  await expect(adlar.getByText("+ not").first()).toBeVisible();
  /* yazarken kutunun boyu satır sayısıyla değişir, yan kayma yok */
  expect(await page.evaluate(TASMA), "yana taşma yok").toBe(true);

  /* 3 · okunacak fotoğraf (linye) */
  await panel.getByRole("button", { name: /Pano sigortaları.*: fotoğraf ekle$/ }).click();
  await panel.getByLabel("Fotoğraf çek").setInputFiles(foto("linye.png"));
  await expect(panel.getByRole("list", { name: /Pano sigortaları.* fotoğrafları$/ }).locator("img")).toHaveCount(1);

  /* 4 · etiket: UYARISIZ eklenir; Görüntüle büyük görüntü; "Etiketten oku" boş satırlara yazar (dolu ezilmez) */
  await panel.getByRole("button", { name: "Etiket fotoğrafı ekle" }).click();
  await panel.getByLabel("Fotoğraf çek").setInputFiles(foto("etiket.png"));
  await expect(page.getByRole("dialog", { name: "Etiketten okuma" })).toHaveCount(0);
  await expect(panel.getByRole("list", { name: "Etiket fotoğrafı" }).locator("img")).toHaveCount(1);
  await panel.getByRole("button", { name: "Görüntüle", exact: true }).click();
  const buyuk = page.getByRole("dialog", { name: "Etiket fotoğrafı" });
  await expect(buyuk.locator("img")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(buyuk).toHaveCount(0);
  await expect(panel).toBeVisible();
  await panel.getByRole("button", { name: "Etiketten oku" }).click();
  await expect.poll(async () => (await mesaj.inputValue()).split("\n")[1], { timeout: 30_000 }).toBe("OK-200");
  expect((await mesaj.inputValue()).split("\n")[0], "dolu satır ezilmez").toBe("Deneme Marka");
  await expect(adlar.locator("li").nth(1).locator("svg")).toHaveCount(1);   // okunan satırın yanında işaret

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
  const m2 = panel.getByRole("textbox", { name: /^Mesaj/ });
  const l2 = (await m2.inputValue()).split("\n");
  l2[0] = "Bağlantısız Marka";
  await m2.fill(l2.join("\n"));
  /* bağlantısız: etiket yine eklenir (kayıtla gider), "Etiketten oku" görünmez */
  await panel.getByRole("button", { name: "Etiket fotoğrafı kaldır", exact: true }).click();
  await panel.getByRole("button", { name: "Etiket fotoğrafı ekle" }).click();
  await panel.getByLabel("Galeriden / bilgisayardan seç").setInputFiles(foto("etiket-2.png"));
  await expect(panel.getByRole("list", { name: "Etiket fotoğrafı" }).locator("img")).toHaveCount(1);
  await expect(panel.getByRole("button", { name: "Etiketten oku" })).toHaveCount(0);
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
  await panel.getByRole("button", { name: "Fotoğraf ekle" }).focus();
  await page.keyboard.press("Escape");
  await expect(panel).toHaveCount(0);
  await expect(fab).toBeFocused();
});

/* 525: bekleyenler için rapor yaz — "Yeni ekle" kaydı (genişlik + deneme başına ayrı kod; plandaki ekipmana dokunmaz) → kod → taslak; okunacak
   fotoğraf yapay zekâyla okunur (taklit), rapor ekranında "S.A.Y Chat kaydından oluşturuldu" şeridi. 542: öneri kartı yok — okunan satırlar raporu
   açınca tabloya girer (işaretli), Kaydet'le yazılır */
test("S.A.Y Chat: bekleyenler için rapor yaz — kod, koşullar, taslak, raporda şerit ve öneri", async ({ page }, bilgi) => {
  test.setTimeout(180_000);
  const kod = `SC${({ masaustu: "M", tablet: "T", telefon: "F" } as Record<string, string>)[bilgi.project.name] ?? "X"}-${bilgi.retry}${Date.now() % 1000}`;
  await giris(page, E2E_YZ.denetci);
  const adres = await planAdresi(page);
  await page.goto(`${Y}${adres}`);
  await hazir(page);
  await page.getByRole("button", { name: "S.A.Y Chat — planın sohbeti" }).click();
  const panel = page.getByRole("dialog", { name: "S.A.Y Chat" });
  await panel.getByRole("button", { name: "Fotoğraf ekle" }).click();
  await panel.getByLabel("Fotoğraf çek").setInputFiles(foto("yeni-pano.png"));
  const secim = page.getByRole("dialog", { name: "Ekipman seçin" });
  await secim.getByRole("tab", { name: "Yeni ekle" }).click();
  await secim.getByRole("button", { name: /Elektrik panosu/ }).first().click();
  const mesaj = panel.getByRole("textbox", { name: /^Mesaj/ });
  const l = (await mesaj.inputValue()).split("\n");
  l[0] = "Rapor Marka";
  await mesaj.fill(l.join("\n"));
  await panel.getByRole("button", { name: /Pano sigortaları.*: fotoğraf ekle$/ }).click();
  await panel.getByLabel("Galeriden / bilgisayardan seç").setInputFiles(foto("linye-2.png"));
  await panel.getByRole("button", { name: "Gönder" }).click();
  const kayit = panel.getByRole("list", { name: "Kayıtlar" }).getByRole("listitem").filter({ hasText: "Rapor Marka" }).first();
  await expect(kayit).toContainText("Gönderildi", { timeout: 30_000 });

  await panel.getByRole("button", { name: /Bekleyenler için rapor yaz/ }).click();
  await expect(panel.getByRole("heading", { name: "Bekleyenler için rapor yaz" })).toBeVisible();
  await expect(panel).toContainText("İnternet var: rapor numarası sunucuda verilir");
  await expect(panel).toContainText("firmanın kotasından harcar");
  const kayitlar = panel.getByRole("list", { name: "Rapora dönüşecek kayıtlar" }).getByRole("listitem");
  /* 2026-10-16 (reisim: "herhangi bir liste tablo … 20 den fazlası sayfalı olsun"; beklenti değişikliği — önceki hâli bütün kayıtları tek ekranda
     görüyordu): liste 20'şer sayfalı — bu kişide eski kayıt birikmişse yeni kayıt sonraki sayfada olabilir: kod isteyen kayıtlar sayfa sayfa doldurulur
     (öteki genişliklerin kayıtları kişiye ait değil — ama bu kişide eski kod isteyen kayıt kaldıysa onlara da kod verilir) */
  const sayfalar = panel.getByRole("navigation", { name: "Rapora dönüşecek kayıtlar sayfaları" });
  let benimki = false;
  for (;;) {
    for (const g of await kayitlar.filter({ has: page.getByLabel(/Ekipman kodu/) }).all()) {
      const k = g.getByLabel(/Ekipman kodu/);
      if (await k.inputValue()) continue;
      await k.fill(benimki ? `${kod}${Math.floor(Math.random() * 90 + 10)}` : kod);
      benimki = true;
    }
    if (!(await sayfalar.count())) break;
    const ileri = sayfalar.getByRole("button", { name: "Sonraki sayfa" });
    if (await ileri.isDisabled()) break;
    await ileri.click();
  }
  expect(benimki, "yeni ekipmanın kayıtı rapora dönüşecekler arasında").toBe(true);
  await panel.getByRole("button", { name: /rapor taslağı oluştur/ }).click();
  const sonuc = panel.getByRole("status").filter({ hasText: "rapor taslağı oluştu" });
  await expect(sonuc).toBeVisible({ timeout: 90_000 });
  await expect(sonuc).toContainText("değer okundu");   // okunacak fotoğraf yapay zekâyla okundu (taklit)
  await sonuc.getByRole("link", { name: "Raporu aç" }).first().click();
  await expect(page).toHaveURL(/\/raporlar\/[0-9a-f-]{36}$/, { timeout: 30_000 });
  await hazir(page);
  await expect(page.getByText("S.A.Y Chat kaydından oluşturuldu.", { exact: false })).toBeVisible();
  /* 542: okunan satırlar tabloya girdi (bölüm açık, işaretli); öneri kartı yok; kaydedilmemiş değişiklik */
  await expect(page.getByRole("region", { name: /fotoğraftan okunan/ })).toHaveCount(0);
  const no1 = page.locator("#b-linye").getByLabel("1. satır · No");
  await expect(no1).toHaveValue("F1", { timeout: 30_000 });
  await expect(no1).toHaveAttribute("data-say-giris", "emin");
  await expect(page.getByText("Kaydedilmemiş değişiklik var")).toBeVisible();
});

test("S.A.Y Chat: plan ekibinde olmayan (yönetici) görmez", async ({ page }) => {
  await giris(page, E2E_YZ.yonetici);
  const adres = await planAdresi(page);
  await page.goto(`${Y}${adres}`);
  await hazir(page);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("button", { name: "S.A.Y Chat — planın sohbeti" })).toHaveCount(0);
});
