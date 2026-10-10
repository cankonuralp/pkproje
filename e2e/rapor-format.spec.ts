/* NEREDEN GELDİ: 308 Rapor formatının saklanması (RAPOR-FORMAT.md §4–5; maket ekipman-turleri.html Format kurucu: "Taslak · vN" / "Yayında · vN",
   Yayınla onaylı). Gerçek tarayıcıda, üç genişlikte: tür sayfasında "Rapor şablonu" boş → Şablondan başlat (ZPKR02) → önizleme sayfası (taslak,
   Bakanlık bölümleri) → Yayınla (sürüm notu) → Sürüm 1 yayında → yayındaki sürümden yeni taslak → Sürüm 2 yayında, Sürüm 1 eski · denetçi
   bölümü ve önizlemeyi görür, başlatamaz / yayınlayamaz. K4 Format kurucu (2026-10-06): taslak kurucuda açılır; geniş ekranda bölüm eklenir,
   adı yazılır → "Kaydedilmedi" (Yayınla yok) → Taslağı kaydet; Bakanlık bölümü sorarak silinir (470; burada Vazgeç); telefonda yalnız önizleme.
   450: yeni türün rapor şablonu Ek-III grubuna göre hazır, YAYINDA sürüm 1 (Bakanlık şablonundan başlatılan sürüm 2 olur).
   451 (reisim 2026-10-09: "format kurucu hiç kullanışlı değil, mantıksız zor ve karmaşık"; "formatı oluştururken nasıl gözükeceği zihnimde
   canlanmıyor bile"): kurucu RAPORUN KENDİSİ — kâğıt belgenin görünümünde; bölüm adına / sütun başlığına / maddeye basılıp yerinde yazılır, "+"
   yerinde ekler; "Belge önizlemesi" PDF'le aynı çiziciden. Görüntüler e2e-goz/ altına (deneme makinesi her koşuda yükler — gözle bakılır).
   472–474 (reisim 2026-10-10, maket kararları k1–k4): "Saha ekranı" — taslak gerçek saha ekranında (çerçeve, tablet genişliği) örnek raporla;
   kâğıtta eklenen bölüm orada; saha ekranında yerinde yazılan ad kâğıda geçer; madde cevabı "Yan yana tuşlar" olunca tuş; "Denetçi gibi dene"de
   Onaya gönder yalnız denetler. Çerçeve sayfası yalnız kendi kökenimize gömülür (frame-ancestors 'self').
   471 (maket kararı k5): sürüm sayfası — önceki sürüme göre değişenler, bu sürümle yazılan rapor, Belge ↔ Saha ekranı önizlemesi, öteki sürümler. */
import { mkdirSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { girisli, hazir } from "./yardimci";

/** gözle bakılacak görüntü (deneme makinesi e2e-goz/ klasörünü her koşuda yükler) */
async function goz(page: Page, ad: string, proje: string) {
  mkdirSync("e2e-goz", { recursive: true });
  await page.screenshot({ path: `e2e-goz/${proje}-${ad}.png`, fullPage: true });
}

async function basla(page: Page, secenek: RegExp) {
  await hazir(page);
  await page.getByRole("button", { name: "Şablondan başlat" }).click();
  const p = page.getByRole("dialog", { name: "Şablondan başlat" });
  await p.getByRole("combobox", { name: "Başlangıç" }).click();
  await p.getByRole("option", { name: secenek }).click();
  await p.getByRole("button", { name: "Başlat" }).click();
  await expect(page).toHaveURL(/\/sablon\/[0-9a-f-]{36}\/kurucu$/, { timeout: 30_000 });
  await expect(page.getByRole("heading", { level: 1, name: /^Format kurucu · / })).toBeVisible();
}

async function yayinla(page: Page, notu: string, sira: number) {
  await hazir(page);
  await page.getByRole("button", { name: "Yayınla" }).click();
  const y = page.getByRole("dialog", { name: "Rapor şablonunu yayınla" });
  await expect(y.getByRole("button", { name: "Yayınla" })).toBeEnabled();
  await y.getByLabel("Sürüm notu").fill(notu);
  await y.getByRole("button", { name: "Yayınla" }).click();
  await expect(page.getByText(`Rapor şablonu sürüm ${sira} yayınlandı.`)).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: `Rapor şablonu · Sürüm ${sira}` })).toBeVisible();
}

test("rapor şablonu: şablondan başlat, önizle, yayınla; yeni sürümle eskisi düşer; denetçi yalnız görür", async ({ page, context }, bilgi) => {
  const on = { masaustu: "MS", tablet: "TB", telefon: "TL" }[bilgi.project.name] ?? "XX";
  const kod = `${on}${"KLMNOPQR"[bilgi.retry]}`;
  await girisli(page, "yonetici");
  await page.goto("/ekipman-turleri?brans=e");
  await hazir(page);
  await page.getByRole("button", { name: "Tür ekle" }).click();
  const p = page.getByRole("dialog", { name: "Tür ekle" });
  await p.getByLabel("Tür adı").fill(`Deneme Tesisat ${kod}`);
  await p.getByLabel("Kod").fill(kod);
  await p.getByRole("combobox", { name: "Ek-III grubu" }).click();
  await p.getByRole("option", { name: /Elektrik tesisatları/ }).click();
  await p.getByLabel("Periyot (ay)").fill("12");
  await p.getByRole("button", { name: "Kaydet" }).click();
  await expect(page).toHaveURL(/\/ekipman-turleri\/[0-9a-f-]{36}$/, { timeout: 30_000 });
  const turAdresi = new URL(page.url()).pathname;
  await expect(page.getByRole("heading", { level: 2, name: "Rapor şablonu" })).toBeVisible();
  /* 450: yeni türün şablonu Ek-III grubuna göre hazır, yayında (sürüm 1) */
  await expect(page.getByText("Ek-III grubuna göre hazır format").first()).toBeVisible();
  await expect(page.getByRole("link", { name: /Rapor formatı\s*Sürüm 1/ })).toBeVisible();

  /* hazır şablondan taslak → Format kurucu: kâğıt belgenin görünümünde, Bakanlık bölümleri ve maddeleri */
  await basla(page, /Elektrik iç tesisatı \(ZPKR02/);
  const kagit = page.getByRole("article", { name: "Rapor formatı · düzenlenebilir belge" });
  if (bilgi.project.name !== "telefon") {
    await expect(kagit).toBeVisible();
    await expect(kagit.getByText("1. Firma bilgileri")).toBeVisible();
    await expect(kagit.getByText("Sabit · her raporda aynı")).toBeVisible();
    await expect(kagit.getByText("Kablo şebeke tarafı").first()).toBeVisible();
    await goz(page, "kurucu-ilk", bilgi.project.name);
    /* 470 (reisim hata listesi 38: "biraz daha serbestlik"): Bakanlık bölümü işaretli ama silinir — önce sorulur (burada Vazgeç) */
    const gozle = kagit.getByRole("region", { name: /Gözle kontrol$/ });
    await expect(gozle.getByText("Bakanlık bölümü").first()).toBeVisible();
    await gozle.getByRole("button", { name: /bölümü sil$/ }).click();
    const sor = page.locator("dialog[open]");
    await expect(sor).toContainText("Bakanlık formatının zorunlu bölümü");
    await sor.getByRole("button", { name: "Vazgeç" }).click();
    await expect(kagit.getByRole("region", { name: /Gözle kontrol$/ })).toBeVisible();
    /* yerinde madde ekle (Bakanlık listesine firma maddesi eklenebilir) */
    await gozle.getByRole("button", { name: /^Madde ekle/ }).first().click();
    const madde = page.getByRole("textbox", { name: "Madde metni" });
    await expect(madde).toBeFocused();
    await madde.fill("Deneme maddesi");
    await madde.press("Enter");
    await expect(gozle.getByRole("button", { name: "Deneme maddesi", exact: true })).toBeVisible();
    /* ölçüm tablosu TABLO gibi: başlıklar sütun; "+ Sütun" yerinde yeni sütun açar, adı başlıkta yazılır */
    const linye = kagit.getByRole("region", { name: /Pano sigortaları \(linye\)$/ });
    await expect(linye.getByRole("columnheader", { name: /Devre/ })).toBeVisible();
    await linye.getByRole("button", { name: "Sütun", exact: true }).click();
    const sutun = page.getByRole("textbox", { name: "Sütun adı" });
    await expect(sutun).toBeFocused();
    await sutun.fill("Deneme sütunu");
    await sutun.press("Enter");
    await expect(linye.getByRole("columnheader", { name: /Deneme sütunu/ })).toBeVisible();
    /* bölüm ekle (sonda) → adı yerinde yazılır → kaydedilmedi (yayınlanmaz) → taslağı kaydet */
    await page.getByRole("combobox", { name: "Bölüm ekle", exact: true }).click();
    await page.getByRole("option", { name: /Not \/ yorum/ }).click();
    await expect(page.getByText("Kaydedilmedi")).toBeVisible();
    await expect(page.getByRole("button", { name: "Yayınla" })).toHaveCount(0);
    const ad = page.getByRole("textbox", { name: "Bölüm adı" });
    await expect(ad).toBeFocused();
    await ad.fill("Deneme yorumu");
    await ad.press("Enter");
    await expect(kagit.getByRole("region", { name: /Deneme yorumu$/ })).toBeVisible();
    /* 461 / 469: alt başlık ekle — sondaki bölümün altına DOĞRUDAN (tür sordurmaz), numarası N.1, adı yerinde yazılır */
    await page.getByRole("button", { name: "Alt başlık ekle (Deneme yorumu altına)" }).click();
    const altAd = page.getByRole("textbox", { name: "Bölüm adı" });
    await expect(altAd).toBeFocused();
    await altAd.fill("Deneme alt başlık");
    await altAd.press("Enter");
    await expect(kagit.getByRole("region", { name: /^\d+\.1 Deneme alt başlık$/ })).toBeVisible();
    /* firma bilgileri sabit: yalnız metot satırı yazılır, bölüm silinmez */
    const firma = kagit.locator("#kb-firma");
    await expect(firma.getByRole("button", { name: /bölümü sil$/ })).toHaveCount(0);
    /* 460: ekipman bilgileri serbest — kod ve tür sabit; Marka çıkar, "Ekipman kaydından alan" ile geri gelir; Model'in adı yerinde değişir */
    const ekip = kagit.locator("#kb-ekipman");
    await expect(ekip.getByText("Ekipman kodu")).toBeVisible();
    await ekip.getByRole("button", { name: "Marka · çıkar" }).click();
    await expect(ekip.getByRole("button", { name: "Marka", exact: true })).toHaveCount(0);
    await ekip.getByRole("combobox", { name: "Ekipman kaydından alan ekle" }).click();
    await page.getByRole("option", { name: /^Marka/ }).click();
    await expect(ekip.getByRole("button", { name: "Marka", exact: true })).toBeVisible();
    await ekip.getByRole("button", { name: "Model", exact: true }).click();
    const alanAdi = page.getByRole("textbox", { name: "Alan adı" });
    await expect(alanAdi).toBeFocused();
    await alanAdi.fill("Model / tip");
    await alanAdi.press("Enter");
    await expect(ekip.getByRole("button", { name: "Model / tip", exact: true })).toBeVisible();
    /* 459: standartlar ve cihazlar türden, kendiliğinden — ZPKR02'den başlatınca türün boş bağlantısı Bakanlık formatınkiyle doldu (440);
       ölçüm cihazları bölümü silinmez */
    await expect(firma.getByText(/TS HD 60364-6/).first()).toBeVisible();
    const cihaz = kagit.getByRole("region", { name: /Ölçüm cihazları$/ });
    await expect(cihaz.getByText("Tesisat test cihazı (çevrim empedansı / RCD)")).toBeVisible();
    await expect(cihaz.getByRole("button", { name: /bölümü sil$/ })).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), "yana taşma yok").toBe(true);
    await goz(page, "kurucu-duzen", bilgi.project.name);
    /* belge önizlemesi: kesin belgenin çizicisinden, yazılanlarla */
    await page.getByRole("button", { name: "Belge önizlemesi" }).click();
    const belge = page.getByRole("region", { name: "Belge önizlemesi" });
    await expect(belge.getByText("Deneme sütunu")).toBeVisible();
    await expect(belge.getByText("Model / tip")).toBeVisible();
    await expect(belge.getByText(/^\d+\.1 Deneme alt başlık$/)).toBeVisible();
    await expect(belge.getByText("Deneme yorumu", { exact: false }).first()).toBeVisible();
    await goz(page, "kurucu-belge", bilgi.project.name);
    /* 472–474: saha ekranı — kâğıttaki değişiklik orada; orada yazılan ad kâğıda geçer; cevap biçimi; denetçi gibi dene */
    await page.getByRole("button", { name: "Saha ekranı" }).click();
    const saha = page.frameLocator('iframe[title^="Saha ekranı"]');
    await expect(saha.getByRole("heading", { name: /Deneme yorumu/ })).toBeVisible({ timeout: 60_000 });
    await expect(saha.getByText("Deneme maddesi").first()).toBeVisible();
    await expect(page.getByLabel("Bu formatla bir rapor")).toContainText("Kontrol maddesi");
    await saha.getByRole("button", { name: "Bölüm adı değiştir: Deneme yorumu" }).click();
    const sahaAd = saha.getByRole("textbox", { name: "Bölüm adı" });
    await sahaAd.fill("Saha yorumu");
    await sahaAd.press("Enter");
    await expect(saha.getByRole("heading", { name: /Saha yorumu/ })).toBeVisible();
    await page.getByRole("button", { name: "Yan yana tuşlar" }).click();
    await expect(saha.getByRole("radiogroup", { name: "Deneme maddesi" })).toBeVisible();
    await goz(page, "kurucu-saha", bilgi.project.name);
    await page.getByRole("button", { name: "Denetçi gibi dene" }).click();
    await expect(saha.getByRole("button", { name: /^Bölüm adı değiştir/ })).toHaveCount(0);
    await saha.getByRole("button", { name: "Onaya gönder" }).click();
    const eksik = saha.getByRole("dialog", { name: "Zorunlu alanlar doldurulmadı" });
    await expect(eksik.or(saha.getByText(/Örnek rapor eksiksiz/))).toBeVisible();
    if (await eksik.isVisible()) {
      await expect(eksik).toContainText("Örnek rapor kaydedilmez.");
      await eksik.getByRole("button", { name: "Tamam" }).click();
    }
    await page.getByRole("button", { name: "Kâğıt", exact: true }).click();
    await expect(kagit.getByRole("region", { name: /Saha yorumu$/ })).toBeVisible();
    await page.getByRole("button", { name: "Taslağı kaydet" }).click();
    await expect(page.getByText("Taslak kaydedildi.").first()).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("Kaydedilmedi")).toHaveCount(0);
    await expect(kagit.getByRole("region", { name: /Saha yorumu$/ })).toBeVisible({ timeout: 30_000 });
    /* çerçeve sayfası: yalnız kendi kökenimize gömülür; öteki sayfalar hiç gömülmez (e2e/giris.spec) */
    const sahaYanit = await page.request.get(page.url().replace(/\/kurucu$/, "/saha"));
    expect(sahaYanit.status()).toBe(200);
    expect(sahaYanit.headers()["content-security-policy"]).toContain("frame-ancestors 'self'");
    expect(sahaYanit.headers()["x-frame-options"]).toBe("SAMEORIGIN");
  } else {
    await expect(page.getByText("Format kurucu masaüstünde kullanılır; burada önizleme görünür.")).toBeVisible();
    await expect(page.getByRole("region", { name: "Belge önizlemesi" }).getByText("Kablo şebeke tarafı").first()).toBeVisible();
    await goz(page, "kurucu-telefon", bilgi.project.name);
  }
  await yayinla(page, "ilk sürüm", 2);
  await expect(page.getByRole("button", { name: "Yayınla" })).toHaveCount(0);
  /* 471 (k5): sürüm sayfası — Sürüm 1'e göre değişenler (Ek-III hazır formattan ZPKR02'ye), rapor sayısı, sürüm notu, önizleme, öteki sürümler */
  const fark = page.getByRole("region", { name: "Sürüm 1 ile karşılaştırma — değişenler" });
  await expect(fark.getByRole("listitem").first()).toBeVisible();
  await expect(page.getByText("Bu sürümle yazılan rapor")).toBeVisible();
  await expect(page.getByText("Sürüm notu: ilk sürüm")).toBeVisible();
  await expect(page.getByRole("region", { name: "Belge önizlemesi" }).getByText("Kablo şebeke tarafı").first()).toBeVisible();
  await page.getByRole("button", { name: "Saha ekranı" }).click();
  await expect(page.frameLocator('iframe[title^="Saha ekranı"]').getByRole("button", { name: "Onaya gönder" })).toBeVisible({ timeout: 60_000 });
  await expect(page.getByRole("region", { name: "Öteki sürümler" })).toContainText("Sürüm 1");
  await goz(page, "surum-sayfasi", bilgi.project.name);

  /* tür sayfası: yüz ve sürüm satırı */
  await page.goto(turAdresi);
  await hazir(page);
  await expect(page.getByRole("link", { name: /Rapor formatı\s*Sürüm 2/ })).toBeVisible();
  await expect(page.getByText("ilk sürüm")).toBeVisible();

  /* yayındaki sürümden yeni taslak → Sürüm 3; Sürüm 2 eskiye düşer */
  await basla(page, /Sürüm 2 · yayında/);
  await yayinla(page, "ikinci sürüm", 3);
  await page.goto(turAdresi);
  await hazir(page);
  await expect(page.getByText("Eski", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Yayında", { exact: true })).toBeVisible();

  /* 439 (reisim: "ŞABLONU DÜZENLEME YOK SADECE ÖN İZLEME VAR DÜZENLEME DE OLMALI"): yayındaki sürümde Düzenle → o sürümden taslak → Format
     kurucu; açık taslak varken yeniden Düzenle → "Taslağa devam et" aynı taslağa götürür */
  await page.getByRole("button", { name: "Sürüm 3 · Düzenle" }).click();
  const d = page.getByRole("dialog", { name: "Sürüm 3 · düzenle" });
  await expect(d).toContainText("Yayınlanmış sürüm değişmez");
  await d.getByRole("button", { name: "Taslak aç ve düzenle" }).click();
  await expect(page).toHaveURL(/\/sablon\/[0-9a-f-]{36}\/kurucu$/, { timeout: 30_000 });
  await expect(page.getByRole("heading", { level: 1, name: /^Format kurucu · / })).toBeVisible();
  const kurucu = new URL(page.url()).pathname;
  await page.goto(turAdresi);
  await hazir(page);
  await page.getByRole("button", { name: "Sürüm 3 · Düzenle" }).click();
  await expect(d).toContainText("Açık bir taslak var");
  await expect(d.getByRole("link", { name: "Taslağa devam et" })).toHaveAttribute("href", kurucu);
  await d.getByRole("button", { name: "Vazgeç" }).click();
  await expect(d).toHaveCount(0);

  /* 370: vazgeçilen taslak yönetici tarafından silinir; yayınlanmış sürümlerde Sil yok */
  await expect(page.getByRole("button", { name: "Taslağı sil" })).toHaveCount(1);
  await page.getByRole("button", { name: "Taslağı sil" }).click();
  const onay = page.locator("dialog[open]");
  await expect(onay).toContainText("Taslak kalıcı olarak silinir; yayınlanmış sürümler etkilenmez. Geri alınamaz.");
  await onay.getByRole("button", { name: "Sil" }).click();
  await expect(page.getByText("Taslak silindi.").first()).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("button", { name: "Taslağı sil" })).toHaveCount(0);
  await expect(page.getByText("Yayında", { exact: true })).toBeVisible();

  /* denetçi: görür, başlatamaz / yayınlayamaz */
  await context.clearCookies();
  await girisli(page, "denetci");
  await page.goto(turAdresi);
  await hazir(page);
  await expect(page.getByRole("heading", { level: 2, name: "Rapor şablonu" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Şablondan başlat" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Sürüm 3 · Düzenle" })).toHaveCount(0);
  await page.getByRole("link", { name: "Önizle" }).first().click();
  await expect(page.getByRole("heading", { level: 1, name: "Rapor şablonu · Sürüm 3" })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("button", { name: "Yayınla" })).toHaveCount(0);
});
