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
   kâğıtta eklenen bölüm orada; madde cevabı "Yan yana tuşlar" olunca tuş; "Denetçi gibi dene"de
   Onaya gönder yalnız denetler. Çerçeve sayfası yalnız kendi kökenimize gömülür (frame-ancestors 'self').
   471 (maket kararı k5): sürüm sayfası — önceki sürüme göre değişenler, bu sürümle yazılan rapor, Belge ↔ Saha ekranı önizlemesi, öteki sürümler.
   483 (reisim 2026-10-10: "rapor düzenlemede sadece saha ekranı gözüksün o ekranda düzenleme yapılamasın"): saha ekranı SALT ÖNİZLEME — kalem /
   taşı / alt başlık / kip seçicisi yok; madde cevabının biçimi kâğıtta ("Kurallar, saha ekranı ve genel muayene talimatı"). */
import { mkdirSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { sikisanYazilar } from "./tarama";
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

/** 486: deneme makinesinin geliştirme sunucusu açık sayfayı baştan yükleyebiliyor (iz: "[Fast Refresh] rebuilding" → "[HMR] connected"; yayında
    yok) — gezinti o yüklemeyle kesilirse ("interrupted by another navigation") bir kez daha gidilir; başka hata aynen düşer */
async function git(page: Page, adres: string) {
  try { await page.goto(adres); } catch (h) {
    if (!/interrupted by another navigation/.test(String(h))) throw h;
    await page.waitForLoadState("load");
    await page.goto(adres);
  }
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

test("rapor şablonu: şablondan başlat, önizle, yayınla; yeni sürümle eskisi düşer; denetçi yalnız görür", async ({ page, context, browser }, bilgi) => {
  /* 2026-10-10 (475): 471–473 saha ekranı (çerçeve sayfası ilk açılışta derlenir) ve sürüm sayfası adımları eklendi — tablette toplam 120 sn'lik
     test süresi aşıldı (beklemeler ve beklentiler aynı; yalnız bu uzun akışın toplam süresi) */
  test.setTimeout(300_000);
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
    /* 2026-10-16 (595 madde 3, K2 — reisim: "firma bilgileri kısmında da [satır eklemek istedim]"): firma bilgileri artık sabit değil — "+ Satır ekle" */
    await expect(kagit.getByRole("combobox", { name: "Firma bilgileri · satır ekle" })).toBeVisible();
    await expect(kagit.getByText("Kablo şebeke tarafı").first()).toBeVisible();
    await goz(page, "kurucu-ilk", bilgi.project.name);
    /* 2026-10-23 (reisim: "format yapıcı aşırı kayık ve kullanışsız"): dar etiket sütununda (ekipman bilgileri, satırda iki bilgi) yazı harf harf
       alt alta dizilmez — öğe tuşları sığmayınca alt satıra iner */
    expect(await page.evaluate(sikisanYazilar, '[aria-label="Rapor formatı · düzenlenebilir belge"]')).toEqual([]);
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
    /* 595 (madde 7): kontrol listesine ek sütun — "+ Sütun" ile serbest yazı (sahada her maddede yazılır), adı başlıkta yazılır */
    await gozle.getByRole("combobox", { name: /sütun ekle$/ }).click();
    await page.getByRole("option", { name: /^Not/ }).click();
    const ekAdi = page.getByRole("textbox", { name: "Sütun adı" });
    await expect(ekAdi).toBeFocused();
    await ekAdi.fill("Gözlem");
    await ekAdi.press("Enter");
    await expect(gozle.getByRole("button", { name: "Gözlem", exact: true })).toBeVisible();
    /* ölçüm tablosu TABLO gibi: başlıklar sütun; "+ Sütun" yerinde yeni sütun açar, adı başlıkta yazılır */
    const linye = kagit.getByRole("region", { name: /Pano sigortaları \(linye\)$/ });
    /* 484: sahada doldurma bölümün ayarı — tabloda varsayılan "Fotoğraf · Excel"; ayarda fotoğraf kapatılınca başlıkta yalnız Excel */
    await expect(linye.getByText("Fotoğraf · Excel")).toBeVisible();
    await linye.getByRole("button", { name: "Pano sigortaları (linye) · bölüm ayarları" }).click();
    const doldur = page.getByRole("group", { name: "Pano sigortaları (linye) · sahada doldurma" });
    await doldur.getByRole("checkbox", { name: /^Fotoğraftan doldur/ }).uncheck();
    await expect(linye.getByText("Excel", { exact: true })).toBeVisible();
    await doldur.getByRole("checkbox", { name: /^Fotoğraftan doldur/ }).check();
    await expect(linye.getByText("Fotoğraf · Excel")).toBeVisible();
    await page.getByRole("button", { name: "Bölüm ayarlarını kapat" }).click();
    /* 486 ("format yapıcıda da ai için fotoğraf ekleme tuşu olsun"): sahadaki tuşlar kâğıtta GÖRÜNÜR — bölümün altında; × ile kalkar, "+ … koy" ile konur */
    const sahaTuslari = linye.getByRole("group", { name: "Pano sigortaları (linye) · sahadaki doldurma tuşları" });
    /* 2026-10-14 (542): sahada tuşun adı "Fotoğraf ekle" — fotoğraf okunmadan eklenir, S.A.Y okur ("(yapay zekâ okur)" kalktı) */
    await expect(sahaTuslari.getByText("Fotoğraf ekle", { exact: true })).toBeVisible();
    await sahaTuslari.getByRole("button", { name: "Pano sigortaları (linye) · fotoğraf tuşunu kaldır" }).click();
    await expect(linye.getByText("Excel", { exact: true })).toBeVisible();
    await sahaTuslari.getByRole("button", { name: "Pano sigortaları (linye) · fotoğraf tuşu koy (yapay zekâ okur)" }).click();
    await expect(sahaTuslari.getByText("Fotoğraf ekle", { exact: true })).toBeVisible();
    await expect(linye.getByRole("columnheader", { name: /Devre/ })).toBeVisible();
    await linye.getByRole("button", { name: "Sütun", exact: true }).click();
    const sutun = page.getByRole("textbox", { name: "Sütun adı" });
    await expect(sutun).toBeFocused();
    await sutun.fill("Deneme sütunu");
    await sutun.press("Enter");
    await expect(linye.getByRole("columnheader", { name: /Deneme sütunu/ })).toBeVisible();
    /* 495 (29 + 46 maketi: "isteyenin istediği gibi" — firmanın kendi hesabı): sütunun ayrıntılarında formül; bilinmeyen ad söylenir, adlara ve
       işaretlere basınca eklenir; kâğıtta "= formül" */
    await linye.getByRole("button", { name: "Deneme sütunu · ayrıntılar" }).click();
    const formul = page.getByRole("textbox", { name: /^Formül/ });
    await formul.fill("[Yok] + 1");
    await formul.blur();
    await expect(page.getByText("“Yok” adında kutu yok", { exact: false }).first()).toBeVisible();   // alanın altında ve "Yayından önce bakılacak"ta
    await formul.fill("");
    const formuleEkle = page.getByRole("group", { name: "Formüle ekle" });
    await formuleEkle.getByRole("button", { name: "Iz", exact: true }).click();
    await formuleEkle.getByRole("button", { name: "Formüle ekle: −" }).click();
    await formuleEkle.getByRole("button", { name: "Ib", exact: true }).click();
    await expect(formul).toHaveValue("[Iz] − [Ib]");
    await expect(linye.getByText("= [Iz] − [Ib]").first()).toBeVisible();
    /* 2026-10-16 (reisim: "hesaplama tuşuna basınca bir sürü değer çıkıyor … her birimin kendi tablosundaki değerler çıksın, diğer değerler diğer
       olarak gözüksün"): tuşlarda yalnız bu tablonun sütunları; öteki bölümlerin kutuları "Diğer kutular" açılır listesinde */
    await expect(formuleEkle.getByRole("button", { name: "Hesaplanan 3 fazlı kısa devre akımı", exact: true })).toHaveCount(0);
    await page.getByText(/^Diğer kutular \(\d+\)$/).first().click();
    await expect(page.getByRole("group", { name: "Formüle ekle: Fonksiyon testleri" }).getByRole("button", { name: "Hesaplanan 3 fazlı kısa devre akımı", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Ayrıntıları kapat" }).click();
    /* 2026-10-16 (reisim: "kurala göre otomatik uygun uygun değil diyor, ama ilgili ayar buradan yapılamıyor … format yapıcıya koyalım"): tablonun
       sonuç kuralı bölüm ayarında — Bakanlık kuralı formül olarak görünür ve değişir; kuralları kaldırılan tabloda Sonuç'u denetçi seçer */
    const zi = kagit.getByRole("region", { name: /Zemin izolasyonu$/ });
    await zi.getByRole("button", { name: "Zemin izolasyonu · bölüm ayarları" }).click();
    const ziKural = page.getByRole("group", { name: "Zemin izolasyonu · sonuç kuralı" });
    await expect(ziKural.getByText("Sonuç kuralı (1) — Bakanlık kuralı", { exact: true })).toBeVisible();
    const ziKosul = ziKural.getByRole("textbox", { name: /^1\. kural/ });
    await expect(ziKosul).toHaveValue("[Direnç] > 50");
    await ziKosul.fill("[Direnç] > 40");
    await ziKosul.blur();
    await expect(ziKural.getByText("Sonuç kuralı (1) — Bakanlık kuralı değiştirildi", { exact: true })).toBeVisible();
    await expect(ziKural.getByRole("button", { name: "Bakanlık kuralına dön" })).toBeVisible();
    await page.getByRole("button", { name: "Bölüm ayarlarını kapat" }).click();
    const pd = kagit.getByRole("region", { name: /Potansiyel dengeleme$/ });
    await pd.getByRole("button", { name: "Potansiyel dengeleme · bölüm ayarları" }).click();
    const pdKural = page.getByRole("group", { name: "Potansiyel dengeleme · sonuç kuralı" });
    await expect(pdKural.getByText("Sonuç kuralı (2) — Bakanlık kuralı", { exact: true })).toBeVisible();
    await pdKural.getByRole("button", { name: "Kuralları kaldır (sonucu denetçi seçer)" }).click();
    await expect(pdKural.getByText("Sonuç kuralı (0) — Bakanlık kuralı değiştirildi", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Bölüm ayarlarını kapat" }).click();
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
    /* 461 / 469 → 486 (hata listesi 40: "alt başlık ekleyince seçenekler çıksın"): alt başlık ekle türü sorar — ana bölümün türü en başta ("ana bölümle
       aynı"), tablo da seçilir; numarası N.1, adı yerinde yazılır */
    await page.getByRole("combobox", { name: "Alt başlık ekle (Deneme yorumu altına)" }).click();
    await expect(page.getByRole("option").first()).toContainText("ana bölümle aynı");
    await page.getByRole("option", { name: /^Ölçüm tablosu/ }).click();
    const altAd = page.getByRole("textbox", { name: "Bölüm adı" });
    await expect(altAd).toBeFocused();
    await altAd.fill("Deneme alt başlık");
    await altAd.press("Enter");
    const altBolum = kagit.getByRole("region", { name: /^\d+\.1 Deneme alt başlık$/ });
    await expect(altBolum).toBeVisible();
    await expect(altBolum.getByRole("columnheader", { name: /Yeni sütun/ })).toBeVisible();
    /* 595 (madde 5): ölçüm tablosuna hazır satır — adı yerinde yazılır (yeni raporda bu adla satır gelir) */
    await altBolum.getByRole("button", { name: "Deneme alt başlık · hazır satır ekle" }).click();
    const hazirAdi = page.getByRole("textbox", { name: "Hazır satırın adı" });
    await expect(hazirAdi).toBeFocused();
    await hazirAdi.fill("L1-N");
    await hazirAdi.press("Enter");
    await expect(altBolum.getByRole("button", { name: "L1-N", exact: true })).toBeVisible();
    /* firma bilgileri: bölüm silinmez; 595 (madde 3, K2): satır eklenir (proje no), adı yazılır, çıkarılır; SGK / İSG-KATİP çıkarılmaz, adı değişmez */
    const firma = kagit.locator("#kb-firma");
    await expect(firma.getByRole("button", { name: /bölümü sil$/ })).toHaveCount(0);
    await firma.getByRole("combobox", { name: "Firma bilgileri · satır ekle" }).click();
    await page.getByRole("option", { name: /^Proje no/ }).click();
    const firmaAdi = page.getByRole("textbox", { name: "Firma bilgisi satırının adı" });
    await expect(firmaAdi).toBeFocused();
    await firmaAdi.fill("Proje numarası");
    await firmaAdi.press("Enter");
    await expect(firma.getByRole("button", { name: "Proje numarası", exact: true })).toBeVisible();
    await firma.getByRole("button", { name: "Rapor numarası", exact: true }).click();
    await firmaAdi.fill("Rapor no");
    await firmaAdi.press("Enter");
    await expect(firma.getByRole("button", { name: "Rapor no", exact: true })).toBeVisible();
    await expect(firma.getByRole("button", { name: "SGK sicil numarası · çıkar" })).toHaveCount(0);
    await expect(firma.getByRole("button", { name: "SGK sicil numarası", exact: true })).toHaveCount(0);   // adı yazılmaz
    await firma.getByRole("button", { name: "Takip kontrol tarihi · çıkar" }).click();
    await expect(firma.getByText("Takip kontrol tarihi")).toHaveCount(0);
    /* İ6 (2026-10-17): sürükle-bırak — ilk satır tutamaktan (fare; işaretçi olayları) üçüncü satırın arkasına */
    const firmaTutamak = firma.locator('[data-surukle-liste="firma"]');
    const basliklar = () => firmaTutamak.evaluateAll((l) => l.map((x) => (x as HTMLElement).title));
    const sira0 = await basliklar();
    /* hedef satırın alt kenarına yakın (alt yarı = arkası); satır = tutamağın öğe tuşlarının kapsayıcısı */
    const hedefTutamak = (await firmaTutamak.nth(2).boundingBox())!, hedefSatir = (await firmaTutamak.nth(2).locator("xpath=../..").boundingBox())!;
    await firmaTutamak.nth(0).dragTo(firmaTutamak.nth(2), { targetPosition: { x: 4, y: hedefSatir.y + hedefSatir.height - 3 - hedefTutamak.y } });
    await expect.poll(basliklar).toEqual([sira0[1], sira0[2], sira0[0], ...sira0.slice(3)]);
    /* 492 (hata listesi 9: "sadece sgk no ve isg katip no değiştirilemez olsun ve format yapıcıda bu belirlenebilir olsun"): sahada kilit — başlangıçta
       SGK ve İSG-KATİP basılı; basınca açılır, yeniden basınca kilitlenir */
    const kilitler = firma.getByRole("group", { name: "Sahada denetçinin değiştiremediği bilgiler" });
    const sgkKilit = kilitler.getByRole("button", { name: "SGK DETSİS NO" });
    await expect(sgkKilit).toHaveAttribute("aria-pressed", "true");
    await expect(kilitler.getByRole("button", { name: "İSG-KATİP SÖZLEŞME ID" })).toHaveAttribute("aria-pressed", "true");
    await expect(kilitler.getByRole("button", { name: "Firma adı" })).toHaveAttribute("aria-pressed", "false");
    await sgkKilit.click();
    await expect(sgkKilit).toHaveAttribute("aria-pressed", "false");
    await sgkKilit.click();
    await expect(sgkKilit).toHaveAttribute("aria-pressed", "true");
    /* 460: ekipman bilgileri serbest — kod ve tür sabit; Marka çıkar, "Ekipman kaydından alan" ile geri gelir; Model'in adı yerinde değişir */
    const ekip = kagit.locator("#kb-ekipman");
    await expect(ekip.getByText("Ekipman kodu")).toBeVisible();
    /* 486 (hata listesi 38: "silinemiyor hala ekipman bilgileri tablosu"): bölümün tamamı silinir (sorulur) — kod ve tür 1. bölüme geçer; geri eklenir */
    await ekip.getByRole("button", { name: /· bölümü sil$/ }).click();
    const silSoru = page.getByRole("dialog", { name: "Ekipman bilgileri bölümü silinsin mi?" });
    await expect(silSoru).toContainText("1. Firma bilgileri");
    await silSoru.getByRole("button", { name: "Sil" }).click();
    await expect(ekip).toHaveCount(0);
    await expect(firma.getByText("Ekipman kodu")).toBeVisible();
    await kagit.getByRole("button", { name: "Ekipman bilgileri bölümünü geri ekle" }).click();
    await expect(ekip.getByText("Ekipman kodu")).toBeVisible();
    await expect(firma.getByText("Ekipman kodu")).toHaveCount(0);
    await ekip.getByRole("button", { name: "Marka · çıkar" }).click();
    await expect(ekip.getByRole("button", { name: "Marka", exact: true })).toHaveCount(0);
    /* 493 (hata listesi 29 + 46 maketi): Geri al çıkarılanı geri getirir, Yinele yeniden çıkarır; Ctrl+Z / Ctrl+Y de (yazı alanı dışında) */
    const arac = page.getByRole("toolbar", { name: "Taslak araçları" });
    await arac.getByRole("button", { name: "Geri al" }).click();
    await expect(ekip.getByRole("button", { name: "Marka", exact: true })).toBeVisible();
    await arac.getByRole("button", { name: "Yinele" }).click();
    await expect(ekip.getByRole("button", { name: "Marka", exact: true })).toHaveCount(0);
    await page.keyboard.press("Control+z");
    await expect(ekip.getByRole("button", { name: "Marka", exact: true })).toBeVisible();
    await page.keyboard.press("Control+y");
    await expect(ekip.getByRole("button", { name: "Marka", exact: true })).toHaveCount(0);
    /* 494 (hata listesi 29 + 46 maketi: "gelişmiş seçenekler tuşu olsun ve tıklayınca buraya gitsin"): kâğıt aynı, solunda parçalar — basıp yerini seç
       ("Buraya ekle"), sürükle-bırak (Sayı alanı ekipman bilgilerine); sağda seçili bölüm; Geri al taslağı eski hâline; Basit görünüme dön */
    await page.emulateMedia({ reducedMotion: "reduce" });   // 494 düzeltmesi: kâğıttaki kaydırmalar anında (bkz. sürükle-bırak)
    await arac.getByRole("button", { name: "Gelişmiş seçenekler" }).click();
    const parcalar = page.getByRole("complementary", { name: "Parçalar" });
    await expect(parcalar).toBeVisible();
    /* 497: bu firmada yapay zekâ kapalı — kutu nereden açılacağını söyler (maket) */
    await expect(page.getByRole("region", { name: "Yapay zekâya anlat" })).toContainText("Yapay zekâ firmada kapalı");
    const bolumler = kagit.locator("section.rb-bolum[id^='kb-']");
    const say = await bolumler.count();
    const listeParca = parcalar.getByRole("button", { name: /^Kontrol listesi/ });
    await listeParca.click();
    await expect(listeParca).toHaveAttribute("aria-pressed", "true");
    await kagit.getByRole("button", { name: "Buraya ekle: Kontrol listesi" }).first().click();
    await expect(bolumler).toHaveCount(say + 1);
    await expect(listeParca).toHaveAttribute("aria-pressed", "false");
    await expect(page.getByRole("complementary", { name: "Seçili bölüm" })).toContainText("Kontrol listesi");
    /* 2026-10-12 (reisim: "parça olarak kaydet yukarda kaldı her seferinde yukarı gidip seçmek mantıklı değil, takip etsin sayfayı"): kâğıdın
       sonuna inilince yan kutular ekranda — seçili bölümün tuşları (Parça olarak kaydet) ve parça kutusu; geniş ekranda ayrı sütunlar, tablette tek
       sütun (yapboz.module.css). Ardından kâğıdın başına dönülür (sonraki adımlar oradaki bölümle) */
    await page.getByRole("combobox", { name: "Bölüm ekle", exact: true }).scrollIntoViewIfNeeded();
    await expect(page.getByRole("complementary", { name: "Seçili bölüm" }).getByRole("button", { name: "Parça olarak kaydet" })).toBeInViewport();
    await expect(parcalar).toBeInViewport();
    mkdirSync("e2e-goz", { recursive: true });
    await page.screenshot({ path: `e2e-goz/${bilgi.project.name}-kurucu-izleyen.png` });   // görünen alan (yapışkan kutular tam sayfa görüntüsünde yanıltır)
    await page.evaluate(() => window.scrollTo(0, 0));
    /* 494 düzeltmesi: eklenen bölüme kaydırma bitmeden sürükleme başlarsa hedef yerinden kayıyordu (masaüstü, "element is not stable") — kaydırma
       hareketi azalt tercihine uyar (gelişmiş görünüm açılmadan önce ayarlandı); hedef görünürken sürüklenir */
    await ekip.scrollIntoViewIfNeeded();
    await expect(ekip).toBeInViewport();
    await parcalar.getByRole("button", { name: /^Sayı/ }).dragTo(ekip);
    await expect(ekip.getByRole("button", { name: "Yeni sayı", exact: true })).toBeVisible();
    await goz(page, "kurucu-gelismis", bilgi.project.name);
    await arac.getByRole("button", { name: "Geri al" }).click();
    await arac.getByRole("button", { name: "Geri al" }).click();
    await expect(bolumler).toHaveCount(say);
    await expect(ekip.getByRole("button", { name: "Yeni sayı", exact: true })).toHaveCount(0);
    /* 496 parça kitaplığı: hazır formatın bölümü kutudan (şablon başına katlanır) eklenir — Bakanlık işaretsiz kopya; seçili bölüm firmanın parçası
       olarak kaydedilir, "Firmanızın parçaları"nda çıkar; yönetici siler, formattaki kopyası kalır */
    const firmaGrubu = parcalar.getByRole("group", { name: "Firmanızın parçaları" });
    await expect(firmaGrubu).toContainText("Henüz yok");
    await parcalar.getByText("Kule kren (ZPKR06, Bakanlık)").click();
    await parcalar.getByRole("button", { name: /^Muayene kriterleri ve testler/ }).click();
    await kagit.getByRole("button", { name: "Buraya ekle: Muayene kriterleri ve testler" }).first().click();
    await expect(bolumler).toHaveCount(say + 1);
    const seciliBolum = page.getByRole("complementary", { name: "Seçili bölüm" });
    await expect(seciliBolum).toContainText("Muayene kriterleri ve testler");
    await expect(seciliBolum).not.toContainText("Bakanlık bölümü");
    await seciliBolum.getByRole("button", { name: "Parça olarak kaydet" }).click();
    await expect(page.getByText(/firmanızın parçalarına kaydedildi/).first()).toBeVisible();
    await expect(firmaGrubu.getByRole("button", { name: "Muayene kriterleri ve testler Kontrol listesi", exact: true })).toBeVisible();
    await firmaGrubu.getByRole("button", { name: "Muayene kriterleri ve testler parçasını sil" }).click();
    await page.locator("dialog[open]").getByRole("button", { name: "Sil", exact: true }).click();
    await expect(firmaGrubu).toContainText("Henüz yok");
    await expect(bolumler).toHaveCount(say + 1);
    await arac.getByRole("button", { name: "Geri al" }).click();
    await expect(bolumler).toHaveCount(say);
    await arac.getByRole("button", { name: "Basit görünüme dön" }).click();
    await expect(parcalar).toHaveCount(0);
    await ekip.getByRole("combobox", { name: "Ekipman kaydından alan ekle" }).click();
    await page.getByRole("option", { name: /^Marka/ }).click();
    await expect(ekip.getByRole("button", { name: "Marka", exact: true })).toBeVisible();
    await ekip.getByRole("button", { name: "Model", exact: true }).click();
    const alanAdi = page.getByRole("textbox", { name: "Alan adı" });
    await expect(alanAdi).toBeFocused();
    await alanAdi.fill("Model / tip");
    await alanAdi.press("Enter");
    await expect(ekip.getByRole("button", { name: "Model / tip", exact: true })).toBeVisible();
    /* 595 (sunum 595 madde 1 — reisim: "teknik yönetici için unvan diploma no gibi satırlar eklemek istedim ekleyemedim"): imza bölümünün satırları
       kâğıtta — teknik yöneticinin diploma no satırı ve serbest satır eklenir, adları yerinde yazılır; Bakanlık satırının adı da yazılır */
    const imzaBolumu = kagit.getByRole("region", { name: /Yetkili kişiler ve imzalar$/ });
    const satirAdi = page.getByRole("textbox", { name: "İmza satırının adı" });
    await imzaBolumu.getByRole("combobox", { name: /satır ekle$/ }).click();
    await page.getByRole("option", { name: /^Teknik yönetici · Diploma no/ }).click();
    await expect(satirAdi).toBeFocused();
    await satirAdi.fill("Teknik yöneticinin diploma no");
    await satirAdi.press("Enter");
    await expect(imzaBolumu.getByRole("button", { name: "Teknik yöneticinin diploma no", exact: true })).toBeVisible();
    await imzaBolumu.getByRole("combobox", { name: /satır ekle$/ }).click();
    await page.getByRole("option", { name: /^Serbest satır/ }).click();
    await expect(satirAdi).toBeFocused();
    await satirAdi.fill("Tesis yetkilisi");
    await satirAdi.press("Enter");
    await expect(imzaBolumu.getByRole("button", { name: "Tesis yetkilisi", exact: true })).toBeVisible();
    await imzaBolumu.getByRole("button", { name: "Adı soyadı", exact: true }).click();
    await satirAdi.fill("Ad soyad");
    await satirAdi.press("Enter");
    await expect(imzaBolumu.getByRole("button", { name: "Ad soyad", exact: true })).toBeVisible();
    /* 595 (madde 25 — reisim: "format yapıcıda e imza yeri de seçilebilsin"): e-imzanın yeri — kutu (ölçüler mm), görünmez, İmza hücresi (varsayılan) */
    await expect(imzaBolumu.getByText("e-imza buraya işlenir · muayene uzmanı")).toBeVisible();
    await imzaBolumu.getByRole("button", { name: "Yetkili kişiler ve imzalar · bölüm ayarları" }).click();
    const eimza = page.getByRole("group", { name: "E-imzanın yeri" });
    await eimza.getByRole("radio", { name: "Son sayfada kutu" }).check();
    const soldan = eimza.getByRole("textbox", { name: "E-imza kutusu · Soldan (mm)" });
    await expect(soldan).toHaveValue("120");
    await soldan.fill("100");
    await soldan.press("Enter");
    await expect(soldan).toHaveValue("100");
    await expect(imzaBolumu.getByText("e-imza buraya işlenir · muayene uzmanı")).toHaveCount(0);
    await eimza.getByRole("radio", { name: "Görünmez imza" }).check();
    await expect(soldan).toHaveCount(0);
    await eimza.getByRole("radio", { name: /^İmza hücresi/ }).check();
    /* İ5 (2026-10-17): ikinci e-imza yeri — onaylayan (teknik yönetici): her sayfada kutu, başlangıç ölçüsü; "Yok" kaldırır */
    const onaylayan = page.getByRole("group", { name: "Onaylayanın e-imza yeri" });
    await onaylayan.getByRole("radio", { name: "Her sayfada kutu" }).check();
    await expect(onaylayan.getByRole("textbox", { name: "Onaylayan e-imza kutusu · Soldan (mm)" })).toHaveValue("15");
    await onaylayan.getByRole("radio", { name: "Yok", exact: true }).check();
    await expect(onaylayan.getByRole("textbox", { name: /Soldan/ })).toHaveCount(0);
    /* 595 (madde 1): "+ İmza yeri" — ikinci muayene uzmanı varsayılan satırlarıyla gelir (sahada plan ekibinden seçilir) */
    await page.getByRole("group", { name: "İmza yerleri" }).getByRole("checkbox", { name: "İkinci muayene uzmanı" }).check();
    await expect(imzaBolumu.getByRole("button", { name: "İkinci muayene uzmanı", exact: true })).toBeVisible();
    await expect(imzaBolumu.getByText("sahada seçilen ikinci uzmanın kaydından").first()).toBeVisible();
    await expect(imzaBolumu.getByText("e-imza buraya işlenir · muayene uzmanı")).toBeVisible();
    await page.getByRole("button", { name: "Bölüm ayarlarını kapat" }).click();
    /* 595 (madde 4, 12): sabit başlıklar ve sözcükler yerinde yazılır — tablonun Sonuç başlığı, sonuç cümlesinin "uygundur"u */
    await linye.getByRole("button", { name: "Sonuç", exact: true }).click();
    const sonucBasligi = page.getByRole("textbox", { name: "Sonuç sütununun başlığı" });
    await sonucBasligi.fill("Değerlendirme");
    await sonucBasligi.press("Enter");
    await expect(linye.getByRole("button", { name: "Değerlendirme", exact: true })).toBeVisible();
    const sonucBolumu = kagit.getByRole("region", { name: /Sonuç ve kanaat$/ });
    await sonucBolumu.getByRole("button", { name: "uygundur", exact: true }).click();
    const uygunSozcuk = page.getByRole("textbox", { name: "Uygun sonucun sözcüğü" });
    await uygunSozcuk.fill("KULLANIMA UYGUNDUR");
    await uygunSozcuk.press("Enter");
    await expect(sonucBolumu.getByRole("button", { name: "KULLANIMA UYGUNDUR", exact: true })).toBeVisible();
    /* 595 (madde 12): üçüncü seçenek — bölüm ayarında açılır, sözcüğü kâğıtta yazılır */
    await sonucBolumu.getByRole("button", { name: /Sonuç ve kanaat · bölüm ayarları$/ }).click();
    await page.getByRole("checkbox", { name: /^Üçüncü seçenek: şartlı uygun/ }).check();
    await page.getByRole("button", { name: "Bölüm ayarlarını kapat" }).click();
    await expect(sonucBolumu.getByRole("button", { name: "şartlı uygundur", exact: true })).toBeVisible();
    /* 595 (madde 13): başlık tablosuna satır eklenir (revizyon), adı yazılır; doküman bilgisi hücresi sola taşınır */
    const basTablo = kagit.locator("table.rb-bas");
    await basTablo.getByRole("combobox", { name: "Başlık tablosu · satır ekle" }).click();
    await page.getByRole("option", { name: /^Revizyon/ }).click();
    const basAdi = page.getByRole("textbox", { name: "Başlık bilgisinin adı" });
    await expect(basAdi).toBeFocused();
    await basAdi.fill("Rev. No");
    await basAdi.press("Enter");
    await expect(basTablo.getByRole("button", { name: "Rev. No", exact: true })).toBeVisible();
    await basTablo.getByRole("button", { name: "Doküman bilgisi hücresi · sola" }).click();
    await expect(basTablo.locator("td").nth(3)).toHaveClass(/rb-dok/);
    /* 459: standartlar ve cihazlar türden, kendiliğinden — ZPKR02'den başlatınca türün boş bağlantısı Bakanlık formatınkiyle doldu (440);
       ölçüm cihazları bölümü silinmez */
    await expect(firma.getByText(/TS HD 60364-6/).first()).toBeVisible();
    const cihaz = kagit.getByRole("region", { name: /Ölçüm cihazları$/ });
    await expect(cihaz.getByText("Tesisat test cihazı (çevrim empedansı / RCD)")).toBeVisible();
    await expect(cihaz.getByRole("button", { name: /bölümü sil$/ })).toHaveCount(0);
    /* 595 (madde 2, K3 — reisim: "satır sütun ekleyemiyorum"): cihaz tablosunun sütunu cihaz kaydından eklenir, adı yazılır, sola taşınır;
       madde 10: uygunsuzluklar tablo olarak (bölüm ayarı) */
    await cihaz.getByRole("combobox", { name: /sütun ekle$/ }).click();
    await page.getByRole("option", { name: /^Marka/ }).click();
    const sutunAdi = page.getByRole("textbox", { name: "Sütun adı" });
    await expect(sutunAdi).toBeFocused();
    await sutunAdi.fill("Cihaz markası");
    await sutunAdi.press("Enter");
    await expect(cihaz.getByRole("button", { name: "Cihaz markası", exact: true })).toBeVisible();
    await cihaz.getByRole("button", { name: "Cihaz markası · sola" }).click();
    await expect(cihaz.getByRole("button", { name: "Cihaz markası · sağa" })).toBeEnabled();
    const kusurBolumu = kagit.getByRole("region", { name: /Kusur açıklamaları$/ });
    await kusurBolumu.getByRole("button", { name: "Kusur açıklamaları · bölüm ayarları" }).click();
    await page.getByRole("checkbox", { name: /^Tablo olarak/ }).check();
    await page.getByRole("button", { name: "Bölüm ayarlarını kapat" }).click();
    await expect(kusurBolumu.getByRole("button", { name: "Uygunsuzluk", exact: true })).toBeVisible();
    /* 595 (madde 16): adlı fotoğraf kutusu — adı yerinde yazılır (sahada fotoğraf o kutuya çekilir) */
    const termal = kagit.getByRole("region", { name: /Termal kamera görüntüleri$/ });
    await termal.getByRole("button", { name: "Termal kamera görüntüleri · fotoğraf kutusu ekle" }).click();
    const kutuAdi = page.getByRole("textbox", { name: "Fotoğraf kutusunun adı" });
    await expect(kutuAdi).toBeFocused();
    await kutuAdi.fill("Pano termal");
    await kutuAdi.press("Enter");
    await expect(termal.getByRole("button", { name: "Pano termal", exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), "yana taşma yok").toBe(true);
    await goz(page, "kurucu-duzen", bilgi.project.name);
    /* belge önizlemesi: kesin belgenin çizicisinden, yazılanlarla */
    await page.getByRole("button", { name: "Belge önizlemesi" }).click();
    const belge = page.getByRole("region", { name: "Belge önizlemesi" });
    await expect(belge.getByText("Deneme sütunu")).toBeVisible();
    await expect(belge.getByText("Model / tip")).toBeVisible();
    await expect(belge.getByText("Teknik yöneticinin diploma no")).toBeVisible();
    await expect(belge.getByRole("columnheader", { name: "Cihaz markası" })).toBeVisible();
    await expect(belge.getByText("Tesis yetkilisi")).toBeVisible();
    await expect(belge.getByText("Proje numarası")).toBeVisible();
    await expect(belge.getByText("Değerlendirme").first()).toBeVisible();
    await expect(belge.getByText("Takip kontrol tarihi")).toHaveCount(0);
    await expect(belge.getByText(/^\d+\.1 Deneme alt başlık$/)).toBeVisible();
    await expect(belge.getByText("Deneme yorumu", { exact: false }).first()).toBeVisible();
    await goz(page, "kurucu-belge", bilgi.project.name);
    /* 483: madde cevabının biçimi KÂĞITTA (saha ekranı salt önizleme) */
    await page.getByText("Kurallar, saha ekranı ve genel muayene talimatı").click();
    await page.getByRole("radio", { name: /^Yan yana tuşlar/ }).check();
    /* 486: taslak saha ekranından ÖNCE kaydedilir — deneme makinesinin geliştirme sunucusu saha ekranının sayfasını (bellekten atılmışsa) yeniden
       derlerken açık sayfayı baştan yüklüyor (iz: "[Fast Refresh] rebuilding" → beforeunload → "[HMR] connected"; yayında yok); kaydedilmemiş
       düzenlemeler kaybolmasın, görünüm yenilemede hatırlanır (FormatKurucu sessionStorage) */
    await page.getByRole("button", { name: "Taslağı kaydet" }).click();
    await expect(page.getByText("Taslak kaydedildi.").first()).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("Kaydedilmedi")).toHaveCount(0);
    /* 472–474 → 483: saha ekranı — kâğıttaki değişiklik orada; düzenleme tuşu yok; denetçi gibi denenir */
    await page.getByRole("button", { name: "Saha ekranı" }).click();
    const saha = page.frameLocator('iframe[title^="Saha ekranı"]');
    await expect(saha.getByRole("heading", { name: /Deneme yorumu/ })).toBeVisible({ timeout: 60_000 });
    await expect(page.getByRole("region", { name: "Kullanım" })).toContainText("Kontrol maddesi");
    await expect(saha.getByRole("button", { name: /^Bölüm adı değiştir/ })).toHaveCount(0);
    await expect(saha.getByRole("button", { name: /· yukarı$/ })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Düzenle", exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Yan yana tuşlar" })).toHaveCount(0);
    /* saha ekranında bölümler gerçek ekran gibi kapalı gelir (463) — kâğıtta maddesi eklenen Gözle kontrol açılır; madde yan yana tuşlarla. 486:
       geliştirme sunucusu çerçeveyi baştan yükleyebiliyor (iz: çerçevede "[HMR] connected") — bölüm kapalıysa yeniden açılır (açıkken kapatılmaz) */
    const gozleBolum = saha.getByRole("button", { name: "Gözle kontrol bölümü", exact: true });
    const denemeMadde = saha.getByRole("radiogroup", { name: "Deneme maddesi" });
    await expect(async () => {
      if ((await gozleBolum.getAttribute("aria-expanded")) !== "true") await gozleBolum.click();
      await expect(denemeMadde).toBeVisible({ timeout: 5_000 });
    }).toPass({ timeout: 45_000 });
    /* 595 (madde 7): kâğıtta eklenen "Gözlem" sütunu sahada her maddede yazı kutusu */
    await expect(saha.getByRole("textbox", { name: "Gözlem" }).first()).toBeVisible();
    await goz(page, "kurucu-saha", bilgi.project.name);
    await expect(page.getByRole("region", { name: "Kullanım" })).toContainText("Deneme:");
    /* 556 (reisim 2026-10-14: "görüntüdeki gibi değiştirilemez olmasın, olması gerekenin dışında bir şey olursa değiştirebilelim, dışarıdan diğer
       kutular ile aynı gözüksün"): formüllü sütun (Deneme sütunu = [Iz] − [Ib]) sahada öteki hücreler gibi yazılır — boşken formülün değeri, yazılan
       kalır, boşaltılınca yeniden formülden */
    const linyeSaha = saha.locator("#b-linye");
    await expect(async () => {
      const ac = saha.getByRole("button", { name: "Pano sigortaları (linye) bölümü", exact: true });
      if ((await ac.getAttribute("aria-expanded")) !== "true") await ac.click();
      await expect(linyeSaha.getByRole("button", { name: "Satır ekle" })).toBeVisible({ timeout: 5_000 });
    }).toPass({ timeout: 45_000 });
    await linyeSaha.getByRole("button", { name: "Satır ekle" }).click();
    await linyeSaha.getByRole("textbox", { name: "1. satır · Iz (A)", exact: true }).fill("32");
    await linyeSaha.getByRole("textbox", { name: "1. satır · Ib (A)", exact: true }).fill("16");
    const denemeHucre = linyeSaha.getByRole("textbox", { name: "1. satır · Deneme sütunu", exact: true });
    await expect(denemeHucre).toHaveValue("16");
    await expect(denemeHucre).toBeEditable();
    await denemeHucre.fill("20");
    await denemeHucre.blur();
    await expect(denemeHucre).toHaveValue("20");
    await denemeHucre.fill("");
    await denemeHucre.blur();
    await expect(denemeHucre).toHaveValue("16");
    /* 2026-10-16: kâğıtta değişen sonuç kuralı sahada — Zemin izolasyonu "[Direnç] > 40": 45 kΩ Uygun (Bakanlık kuralıyla Uygun değil olurdu);
       kuralları kaldırılan Potansiyel dengelemede Sonuç kendiliğinden çıkmaz */
    for (const [id, ad] of [["zi", "Zemin izolasyonu"], ["pd", "Potansiyel dengeleme"]] as const) {
      const b = saha.locator(`#b-${id}`);
      await expect(async () => {
        const ac = saha.getByRole("button", { name: `${ad} bölümü`, exact: true });
        if ((await ac.getAttribute("aria-expanded")) !== "true") await ac.click();
        await expect(b.getByRole("button", { name: "Satır ekle" })).toBeVisible({ timeout: 5_000 });
      }).toPass({ timeout: 45_000 });
      await b.getByRole("button", { name: "Satır ekle" }).click();
    }
    const ziSaha = saha.locator("#b-zi"), pdSaha = saha.locator("#b-pd");
    await ziSaha.getByRole("textbox", { name: "1. satır · Direnç (kΩ)", exact: true }).fill("45");
    await expect(ziSaha.locator("tbody tr").first().getByText("Uygun", { exact: true })).toBeVisible();
    await pdSaha.getByRole("textbox", { name: "1. satır · PD kesiti (mm²)", exact: true }).fill("2");
    await expect(pdSaha.locator("tbody tr").first().getByText(/^Uygun/)).toHaveCount(0);
    await pdSaha.getByText("Sonuç neye göre çıkar?").click();
    await expect(pdSaha.getByText(/Bu tabloda sonuç kuralı yok/)).toBeVisible();
    /* 2026-10-12 (reisim: "onaya gönder diyince ekrana pop-up uyarı ekranı gelmesin …"): eksikte pencere yok — üstte kısa uyarı, ilk eksiğe kayılır */
    await saha.getByRole("button", { name: "Onaya gönder" }).click();
    const eksikUyari = saha.locator("[data-uyari]").getByText(/^Zorunlu alanlar doldurulmalıdır/);
    await expect(eksikUyari.or(saha.getByText(/Örnek rapor eksiksiz/))).toBeVisible();
    await expect(saha.getByRole("dialog")).toHaveCount(0);
    if (await eksikUyari.count()) await expect(eksikUyari).toContainText("Örnek rapor kaydedilmez.");
    await page.getByRole("button", { name: "Kâğıt", exact: true }).click();
    await expect(page.getByText("Kaydedilmedi")).toHaveCount(0);
    await expect(kagit.getByRole("region", { name: /Deneme yorumu$/ })).toBeVisible({ timeout: 30_000 });
    /* çerçeve sayfası: yalnız kendi kökenimize gömülür; öteki sayfalar hiç gömülmez (e2e/giris.spec) */
    const sahaYanit = await page.request.get(page.url().replace(/\/kurucu$/, "/saha"));
    expect(sahaYanit.status()).toBe(200);
    expect(sahaYanit.headers()["content-security-policy"]).toContain("frame-ancestors 'self'");
    expect(sahaYanit.headers()["x-frame-options"]).toBe("SAMEORIGIN");
  } else {
    /* 2026-10-24 (reisim: "telefonda format düzenleyici açılmasın bu ekran masaüstü için uygundur desin"): telefonda yalnız yazı ve türe dönüş —
       kâğıt, belge önizlemesi, saha ekranı ve tuşlar yok */
    await expect(page.getByText("Bu ekran masaüstü için uygundur.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Ekipman türüne dön" })).toBeVisible();
    await expect(kagit).toBeHidden();
    await expect(page.getByRole("region", { name: "Belge önizlemesi" })).toBeHidden();
    await expect(page.getByRole("button", { name: "Yayınla" })).toBeHidden();
    await goz(page, "kurucu-telefon", bilgi.project.name);
    /* yayın masaüstünden: aynı oturumla geniş ekranlı ayrı bir tarayıcı bağlamında yayınlanır (mobil öykünmede pencereyi büyütmek düzeni
       değiştirmiyor — CI 1981f80d), akış telefonda sürüm sayfasından sürer */
    const masa = await browser.newContext({ viewport: { width: 1280, height: 900 }, storageState: await context.storageState() });
    const mp = await masa.newPage();
    await mp.goto(page.url());
    await yayinla(mp, "ilk sürüm", 2);
    const surumAdresi = mp.url();
    await masa.close();
    await page.goto(surumAdresi);
    await hazir(page);
  }
  if (bilgi.project.name !== "telefon") {
    await yayinla(page, "ilk sürüm", 2);
  }
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
  await git(page, turAdresi);
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
  /* 2026-10-18 (reisim: "bu ve benzeri, yaratıcıyı hedef alan açıklamaları kaldır, çok fazla ai ürünü olduğu belli oluyor"): açıklama kısaldı */
  await expect(d).toContainText("bir taslağa kopyalanır");
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

  /* 2026-10-12 (reisim: "ekipman türlerinde eski sürüme geri dön tuşu olsun"): eski sürümde "Bu sürüme geri dön" — Sürüm 2'nin içeriği Sürüm 4
     olarak yayınlanır, Sürüm 3 eskiye düşer, hiçbir sürüm silinmez; yayındaki sürümde tuş yok */
  await expect(page.getByRole("button", { name: "Sürüm 3 · Bu sürüme geri dön" })).toHaveCount(0);
  await page.getByRole("button", { name: "Sürüm 2 · Bu sürüme geri dön" }).click();
  const gd = page.getByRole("dialog", { name: "Sürüm 2 · geri dön" });
  await expect(gd).toContainText("yayındaki Sürüm 3 eskiye düşer");
  await expect(gd.getByLabel("Sürüm notu")).toHaveValue("Sürüm 2 geri yüklendi");
  await gd.getByRole("button", { name: "Geri dön", exact: true }).click();
  await expect(page.getByText("Sürüm 2 geri yüklendi: Sürüm 4 yayında.").first()).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("link", { name: /Rapor formatı\s*Sürüm 4/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sürüm 3 · Bu sürüme geri dön" })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Sürüm \d · Bu sürüme geri dön$/ })).toHaveCount(3);
  /* 2026-10-12 (reisim: "tuşlar yan yana olabilecekken altlı üstlü ? boşuna sayfa uzuyor"): tabloda satırın tuşları tek satırda (telefonda kart) */
  if (bilgi.project.name !== "telefon") {
    const satir = page.getByRole("row", { name: /^Sürüm 2 / });
    const [k1, k2, k3] = [await satir.getByRole("link", { name: "Önizle" }).boundingBox(), await satir.getByRole("button", { name: "Sürüm 2 · Bu sürüme geri dön" }).boundingBox(),
      await satir.getByRole("button", { name: "Sürüm 2 · Sil" }).boundingBox()];
    expect(Math.abs(k1!.y - k2!.y), "Önizle ile Geri dön yan yana").toBeLessThan(4);
    expect(Math.abs(k1!.y - k3!.y), "Önizle ile Sil yan yana").toBeLessThan(4);
  }
  /* 2026-10-12 (reisim: "eski sürümleri silmekte olsun", "silme tuşuda ekle"): hiç kullanılmamış eski sürüm silinir; yayındaki sürümde Sil yok */
  await expect(page.getByRole("button", { name: "Sürüm 4 · Sil" })).toHaveCount(0);
  await page.getByRole("button", { name: "Sürüm 1 · Sil" }).click();
  const silOnay = page.locator("dialog[open]");
  await expect(silOnay).toContainText("Sürüm 1 kalıcı olarak silinir; bu sürümle rapor yazılmadı; öteki sürümler ve raporlar etkilenmez. Geri alınamaz.");
  await silOnay.getByRole("button", { name: "Sil", exact: true }).click();
  await expect(page.getByText("Sürüm 1 silindi.").first()).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("button", { name: /^Sürüm \d · Bu sürüme geri dön$/ })).toHaveCount(2);
  await expect(page.getByRole("link", { name: /Rapor formatı\s*Sürüm 4/ })).toBeVisible();

  /* denetçi: görür, başlatamaz / yayınlayamaz */
  await context.clearCookies();
  await girisli(page, "denetci");
  await page.goto(turAdresi);
  await hazir(page);
  await expect(page.getByRole("heading", { level: 2, name: "Rapor şablonu" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Şablondan başlat" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Sürüm 4 · Düzenle" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Bu sürüme geri dön$/ })).toHaveCount(0);
  /* 2026-10-12: geri dönüşten sonra yayındaki Sürüm 4 (tablonun başında) */
  await page.getByRole("link", { name: "Önizle" }).first().click();
  await expect(page.getByRole("heading", { level: 1, name: "Rapor şablonu · Sürüm 4" })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("button", { name: "Yayınla" })).toHaveCount(0);
});
