/* NEREDEN GELDİ: 311 K3 saha raporu (maket rapor.html M8 + planlarim.html RAP_SUTUN; KOD-GECIS §5 Rapor, §9 ENGEL 2 ve 5; RAPOR-FORMAT §7). Gerçek
   tarayıcıda, üç genişlikte: yönetici Saha Tesisi'ne plan açar (denetçiyle) → denetçi kabul eder → ekipman satırında "HT-0201 için rapor oluştur"
   (planda kalınır, bildirim) → Raporlar satırında "Raporu düzenle" → saha rapor ekranı (/raporlar/<id>, başlık "HT-0201 · Hava tankı", durum
   Yeni, başlangıç bugünle dolu) → eksik raporla Onaya gönder (soru: "Rapor onaya gönderilsin mi?") durur, "Zorunlu alanlar doldurulmadı"
   penceresi format zorunlularını ve türün gerekli ölçüm cihazını sayar → tarihler, format alanları, kriterler (Hepsini uygun yap), test
   değerleri, sonuç → Kaydet → Cihaz ekle (zimmetteki, kalibrasyonu geçerli MN-01) → Onaya gönder → "Teknik yönetici onayında", Onaya
   gönder kalkar → kırıntıdan plana dönülür: plan Denetimde, Raporlar listesinde rapor no ve durum, Rapor oluştur artık yok. Tohum
   scripts/e2e-sunucu.ts (E2E_SAHA): HT'nin yayındaki formatı hazır şablon KOMPRESOR, gerekli cihaz türü Manometre. Her proje kendi planını açar
   (rapor plan × ekipman başına tek) — öteki testlere dokunmaz.
   313: gönderilmiş raporda "Kopyala" → pencere (kod + bölüm) → aynı kodla durur ("bu planda zaten var") → yeni kodla yeni ekipmanın Yeni raporu açılır
   (başlık "<kod> · Hava tankı", kaynak şeridi). Kod her koşu ve genişlikte ayrı (firmada eşsiz).
   314 Onaylar: mekanik yönetici kuyruktan raporu açar → kısa gerekçeyle geri gönderilmez → gerekçeyle geri gönderir → denetçi rapor ekranında
   "Geri gönderildi" şeridini görür, yeniden gönderir → yönetici onaylar → onay ekranında "Muayene uzmanı imzası".
   317 Son imza: denetçi İmzala → imzasız PDF'i indirir → imzalı PDF'i yükler → Tamamlandı, İmzalı PDF. */
import { readFileSync } from "node:fs";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { E2E_HESAPLAR, E2E_PLAN, E2E_SAHA } from "./hesaplar";
import { girisli, hazir } from "./yardimci";

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
/* uydurma JPEG (tests/dosya.test.ts ile aynı yapı) */
const bayt = (...p: (number[] | string)[]) => new Uint8Array(p.flatMap((x) => (typeof x === "string" ? [...Buffer.from(x, "latin1")] : x)));
const seg = (isaret: number, govde: string) => bayt([0xff, isaret, (govde.length + 2) >> 8, (govde.length + 2) & 0xff], govde);
const JPEG = bayt([0xff, 0xd8], [...seg(0xe0, "JFIF\0\x01\x01")], [...seg(0xdb, "\0" + "\x01".repeat(64))], [0xff, 0xda, 0, 2], "goruntu-verisi", [0xff, 0xd9]);
const RAPOR_NO = /[A-Z]{2,4}-\d{4}-\d{3,}-[0-9a-f]{5}/;
const BASLANGIC = "Periyodik kontrol başlangıç tarihi ve saati";
const BITIS = "Periyodik kontrol bitiş tarihi ve saati";
/** Türkiye'de bugün "GG.AA.YYYY" (plan günü ve rapor başlangıcı sunucuda Türkiye saatiyle) */
const bugunTr = () => new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date());

/** Onaya gönder → onay sorusu → Onaya gönder (maket gonder: "Rapor onaya gönderilsin mi?") */
async function onayaGonder(page: Page) {
  await page.getByRole("button", { name: "Onaya gönder" }).first().click();
  const soru = page.getByRole("dialog", { name: "Rapor onaya gönderilsin mi?" });
  await expect(soru).toBeVisible();
  await soru.getByRole("button", { name: "Onaya gönder" }).click();
}

async function planAc(page: Page) {
  await page.goto("/planlar/ac");
  await hazir(page);
  await page.getByRole("combobox", { name: "Müşteri" }).click();
  await page.getByRole("option", { name: /Plan Deneme/ }).click();
  await page.getByRole("combobox", { name: "Tesis" }).click();
  await page.getByRole("option", { name: new RegExp(E2E_PLAN.tesisSaha) }).click();
  await page.getByRole("checkbox", { name: E2E_HESAPLAR.denetci.ad }).check();
  await page.getByRole("button", { name: "Planı aç" }).click();
  await expect(page).toHaveURL(/\/planlar\/[0-9a-f-]{36}$/, { timeout: 30_000 });
  return new URL(page.url()).pathname;
}

/** yazı ya da sayı kutusu (etiketi format tanımındaki alan / değer adı; "zorunlu" eki ve birim olabilir) */
const girdi = (kap: Page | Locator, ad: string) => kap.getByRole("textbox", { name: ad }).or(kap.getByRole("spinbutton", { name: ad }));

/** tarih + saat alanı (TarihAlani, src/components/secim): tarih kutusu, saat ve dakika ayrı kutular */
const zamanAlani = (page: Page, ad: string) => page.locator("[data-zaman]").filter({ has: page.getByLabel(ad) });
async function zamanYaz(page: Page, ad: string, gun: string, saat: string, dakika: string) {
  const kap = zamanAlani(page, ad);
  await kap.locator("input:not([data-parca])").fill(gun);
  await kap.locator('input[data-parca="saat"]').fill(saat);
  const dk = kap.locator('input[data-parca="dakika"]');
  await dk.fill(dakika);
  await dk.press("Escape");   // dakika öneri listesi kapanır (alttaki alanların üstüne binmesin)
}

test("saha raporu: rapor oluştur, eksikle gönderilmez, doldur + cihaz ekle, onaya gönder; planda durumuyla listelenir", async ({ page, context }) => {
  test.setTimeout(300_000);   // ilk koşuda saha rapor ekranı soğuk derlenebilir; akış onaya kadar uzun
  await girisli(page, "yonetici");
  const adres = await planAc(page);
  const planNo = (await page.getByRole("navigation", { name: "Konum" }).textContent())!.match(/P-\d{4}-\d{3,6}/)![0];

  /* denetçi: planı kabul eder → ekipman satırında Rapor oluştur → saha rapor ekranı */
  await context.clearCookies();
  await girisli(page, "denetci");
  await page.goto(adres);
  await hazir(page);
  await page.getByRole("checkbox", { name: "Tarafsızlık beyanını okudum, kabul ediyorum" }).check();
  await page.getByRole("button", { name: "Kabul et" }).click();
  await expect(page.getByText("Plan kabul edildi.")).toBeVisible();
  await expect(page.getByRole("region", { name: "Raporlar", exact: true })).toContainText("Bu planda rapor yok.");
  await page.getByRole("button", { name: `${E2E_SAHA.ekipman} için rapor oluştur` }).click();
  await expect(page.getByText(/^Rapor oluşturuldu: /).first()).toBeVisible({ timeout: 30_000 });
  await page.getByRole("region", { name: "Raporlar", exact: true }).getByRole("link", { name: "Raporu düzenle" }).click();
  await expect(page).toHaveURL(new RegExp(`/raporlar/${UUID}$`), { timeout: 30_000 });
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(`${E2E_SAHA.ekipman} · ${E2E_SAHA.tur}`, { timeout: 30_000 });
  await expect(page.getByText("Yeni", { exact: true }).filter({ visible: true }).first()).toBeVisible();
  const raporAdresi = new URL(page.url()).pathname;
  const raporNo = (await page.getByText(RAPOR_NO).first().textContent())!.match(RAPOR_NO)![0];
  const gun = bugunTr();
  await expect(zamanAlani(page, BASLANGIC).locator("input:not([data-parca])")).toHaveValue(gun);   // başlangıç rapor açılınca yazılır

  /* eksik rapor: Onaya gönder durur; format zorunluları ve türün gerekli ölçüm cihazı sayılır (ENGEL 5, ENGEL 2) — rapor yine kaydedilir */
  await onayaGonder(page);
  const eksik = page.getByRole("dialog", { name: "Zorunlu alanlar doldurulmadı" });
  await expect(eksik).toBeVisible({ timeout: 30_000 });
  await expect(eksik).toContainText("Hidrostatik deney basıncı");
  await expect(eksik).toContainText(`${E2E_SAHA.cihazTuru}: ölçüm cihazı eklenmedi`);
  await eksik.getByRole("button", { name: "Kapat" }).first().click();
  await expect(eksik).toHaveCount(0);
  await expect(page).toHaveURL(new RegExp(`${raporAdresi}$`));

  /* doldur: kontrol tarihleri, format alanları (KOMPRESOR: Marka / model, İmal yılı, Çalışma basıncı), kriterler, test değerleri, sonuç */
  await zamanYaz(page, BASLANGIC, gun, "00", "10");   // gece yarısına yakın: bitiş ileri saate düşmesin, başlangıçtan önce olmasın
  await zamanYaz(page, BITIS, gun, "00", "40");
  await girdi(page, "Marka / model").first().fill("Deneme K1");
  const imal = girdi(page, "İmal yılı");
  await expect(imal.first()).toBeVisible();
  for (const x of await imal.all()) await x.fill("2015");   // sabit Ekipman bilgileri ile format alanı ayrı çizilirse ikisi de
  await girdi(page, "Çalışma basıncı").first().fill("10");
  await page.getByRole("button", { name: "Hepsini işaretle" }).or(page.getByRole("combobox", { name: "Hepsini işaretle" })).first().click();
  await page.getByText(/^Hepsini uygun yap$/i).click();
  await expect(page.getByRole("combobox", { name: "Tahliye düzeni" })).toContainText("Uygun");
  await expect(page.getByRole("combobox", { name: "Etiket plakası ve izlenebilirlik" })).toContainText("Uygun");
  await girdi(page, "Hidrostatik deney basıncı").first().fill("17");
  await girdi(page, "Emniyet ventili açma basıncı").first().fill("10");
  await page.getByRole("combobox", { name: "Sonuç ve kanaat" }).click();
  await page.getByRole("option", { name: /^Uygun(?!\s*değil)/ }).click();
  await expect(page.getByRole("combobox", { name: "Sonuç ve kanaat" })).toContainText("Uygun");
  await page.getByRole("button", { name: "Kaydet", exact: true }).first().click();
  await expect(page.getByText("Rapor kaydedildi.").first()).toBeVisible({ timeout: 30_000 });

  /* fotoğraf (312): şablonda en az 1; uydurma JPEG (tarayıcı çözemez → küçültülmeden gider, sunucu baytlardan JPEG der) */
  /* Kaydet'ten sonra sayfa yeni sürümle yenilenene kadar girdi kapalı (eski sürümle yüklenmesin); setInputFiles kapalı girdiyi beklemez */
  await expect(page.getByLabel("Fotoğraf ekle", { exact: true })).toBeEnabled({ timeout: 30_000 });
  await page.getByLabel("Fotoğraf ekle", { exact: true }).setInputFiles({ name: "on.jpg", mimeType: "image/jpeg", buffer: Buffer.from(JPEG) });
  await expect(page.getByText("on.jpg eklendi.").first()).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("link", { name: "Görüntüle" }).first()).toHaveAttribute("href", /^\/api\/dosya\/[0-9a-f-]{36}$/);

  /* ölçüm cihazı: zimmetteki, kalibrasyonu geçerli cihaz */
  await page.getByRole("button", { name: "Cihaz ekle" }).first().click();
  const cihaz = page.getByRole("dialog", { name: "Cihaz ekle" });
  await cihaz.getByLabel(`${E2E_SAHA.cihaz} · ${E2E_SAHA.marka} ${E2E_SAHA.model}`).check();
  await cihaz.getByRole("button", { name: "Ekle", exact: true }).click();
  await expect(page.getByText(`${E2E_SAHA.cihaz} eklendi.`).first()).toBeVisible({ timeout: 30_000 });
  await expect(cihaz).toHaveCount(0);

  /* 315 Ön izle: kaydedilmiş rapor belge olarak (kesin PDF'le aynı çizici) — değerler, cihaz, fotoğraf; Rapora dön */
  await page.getByRole("link", { name: "Ön izle" }).click();
  await expect(page).toHaveURL(new RegExp(`${raporAdresi}/onizle$`), { timeout: 30_000 });
  const belge = page.getByRole("article", { name: `${raporNo} rapor belgesi` });
  await expect(belge).toBeVisible({ timeout: 30_000 });
  await expect(belge).toContainText("Hidrostatik deney basıncı");
  await expect(belge).toContainText(E2E_SAHA.cihaz);
  await expect(belge.getByRole("img", { name: "on.jpg" })).toBeVisible();
  /* 316 PDF indir: imzasız, kesin PDF motoruyla (başsız Chromium) */
  const [indirme] = await Promise.all([page.waitForEvent("download", { timeout: 60_000 }), page.getByRole("link", { name: "PDF indir" }).click()]);
  expect(indirme.suggestedFilename()).toBe(`${raporNo}-imzasiz.pdf`);
  expect(readFileSync((await indirme.path())!).subarray(0, 5).toString("latin1")).toBe("%PDF-");
  await page.getByRole("link", { name: "Rapora dön" }).click();
  await expect(page).toHaveURL(new RegExp(`${raporAdresi}$`), { timeout: 30_000 });
  await hazir(page);

  /* onaya gönder: durum Teknik yönetici onayında, rapor artık düzenlenmez */
  await onayaGonder(page);
  await expect(page.getByText(/^Onaya gönderildi: /).first()).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("Teknik yönetici onayında", { exact: true }).filter({ visible: true }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Onaya gönder" })).toHaveCount(0);

  /* kırıntıdan plana: plan Denetimde, Raporlar listesinde rapor no + durum; kendi raporu gönderildi → "Raporu aç"; ekipmanda Rapor oluştur yok */
  await page.getByRole("navigation", { name: "Konum" }).getByRole("link", { name: planNo }).click();
  await expect(page).toHaveURL(new RegExp(`${adres}$`), { timeout: 30_000 });
  await hazir(page);
  await expect(page.getByText("Denetimde", { exact: true }).filter({ visible: true }).first()).toBeVisible();
  /* liste telefonda kart, masaüstünde tablo: satır yerine bölümün içeriğine bakılır (planda tek rapor var) */
  const raporlar = page.getByRole("region", { name: "Raporlar", exact: true });
  await expect(raporlar).toContainText(E2E_SAHA.ekipman);
  await expect(raporlar).toContainText(RAPOR_NO);
  await expect(raporlar).toContainText("Teknik yönetici onayında");
  await expect(raporlar.getByRole("link", { name: "Raporu aç" })).toHaveAttribute("href", raporAdresi);
  await expect(page.getByRole("button", { name: `${E2E_SAHA.ekipman} için rapor oluştur` })).toHaveCount(0);

  /* 313 Kopyala (gönderilmiş rapor): yeni ekipmanın kodu + bölümü → yeni ekipmanın Yeni raporu; plandaki kod verilmez */
  await page.goto(raporAdresi);
  await hazir(page);
  await page.getByRole("button", { name: "Kopyala", exact: true }).click();
  const kopya = page.getByRole("dialog", { name: "Kopyala · yeni ekipman" });
  await expect(kopya).toBeVisible();
  const kodKutusu = kopya.getByRole("textbox", { name: /^Ekipman kodu/ });
  await kodKutusu.fill(E2E_SAHA.ekipman);
  await kopya.getByRole("button", { name: "Kopyala", exact: true }).click();
  await expect(kopya).toContainText(`${E2E_SAHA.ekipman} bu planda zaten var`, { timeout: 30_000 });
  const kod = `K${test.info().project.name.slice(0, 3).toUpperCase()}${Date.now() % 100000}`;
  await kodKutusu.fill(kod);
  await kopya.getByRole("textbox", { name: "Ekipman bölümü (kullanım yeri)" }).fill("Arka bahçe");
  await kopya.getByRole("button", { name: "Kopyala", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(`${kod} · ${E2E_SAHA.tur}`, { timeout: 30_000 });
  await expect(page).toHaveURL(new RegExp(`/raporlar/${UUID}$`));
  expect(new URL(page.url()).pathname).not.toBe(raporAdresi);
  await expect(page.getByText(/raporundan kopyalandı; test değerleri, fotoğraflar ve sonuç bu ekipman için girilir\./)).toBeVisible();
  await expect(page.getByText("Yeni", { exact: true }).filter({ visible: true }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Onaya gönder" }).first()).toBeVisible();

  /* 314 Onaylar: mekanik yönetici kuyruktan açar, gerekçeyle geri gönderir */
  const onayEkrani = async () => {
    await page.goto("/onaylar");
    await hazir(page);
    await page.getByRole("link", { name: raporNo }).first().click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(raporNo, { timeout: 30_000 });
  };
  await context.clearCookies();
  await girisli(page, "mekanik");
  await onayEkrani();
  await expect(page.getByRole("region", { name: "Gözden geçirme" })).toContainText("ölçüm cihazı");
  await expect(page.getByRole("article", { name: `${raporNo} rapor belgesi` })).toBeVisible();   // 315: onay ekranında önizleme
  await page.getByRole("button", { name: "Geri gönder" }).click();
  const geri = page.getByRole("dialog", { name: `Geri gönder · ${raporNo}` });
  await geri.getByRole("textbox", { name: /^Gerekçe/ }).fill("kısa");
  await geri.getByRole("button", { name: "Geri gönder" }).click();
  await expect(geri).toContainText("en az 10 karakter", { timeout: 30_000 });
  await geri.getByRole("textbox", { name: /^Gerekçe/ }).fill("Test değerleri yeniden yazılmalı");
  await geri.getByRole("button", { name: "Geri gönder" }).click();
  await expect(page.getByText(`${raporNo} geri gönderildi; `, { exact: false }).first()).toBeVisible({ timeout: 30_000 });

  /* denetçi: rapor Yeni, üstünde gerekçe; yeniden gönderir */
  await context.clearCookies();
  await girisli(page, "denetci");
  await page.goto(raporAdresi);
  await hazir(page);
  await expect(page.getByText(/Geri gönderildi · Deneme Mekanik · .*Test değerleri yeniden yazılmalı/)).toBeVisible({ timeout: 30_000 });
  await onayaGonder(page);
  await expect(page.getByText(/^Onaya gönderildi: /).first()).toBeVisible({ timeout: 30_000 });

  /* yönetici onaylar → rapor Muayene uzmanı imzasında, Onayı geri al görünür */
  await context.clearCookies();
  await girisli(page, "mekanik");
  await onayEkrani();
  await page.getByRole("button", { name: "Onayla", exact: true }).click();
  await expect(page.getByText(`${raporNo} onaylandı; muayene uzmanı imzasında`, { exact: false }).first()).toBeVisible({ timeout: 30_000 });
  await page.goto(`/onaylar/${raporAdresi.split("/").pop()}`);
  await hazir(page);
  await expect(page.getByText("Muayene uzmanı imzası", { exact: true }).filter({ visible: true }).first()).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("button", { name: "Onayı geri al" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Onayla", exact: true })).toHaveCount(0);

  /* 317 son imza: denetçi İmzala → imzasız PDF'i indir → imzalı PDF'i yükle (imzasız baytlar + artımlı imza sözlüğü; gerçek e-imza aracının
     yaptığı gibi özgün baytlar korunur) → Tamamlandı, İmzalı PDF */
  await context.clearCookies();
  await girisli(page, "denetci");
  await page.goto(raporAdresi);
  await hazir(page);
  await page.getByRole("button", { name: "İmzala", exact: true }).click();
  await expect(page.getByText("İmzasız PDF hazır; indirip imzalayın, imzalı PDF'i yükleyin.").first()).toBeVisible({ timeout: 60_000 });
  const [imzasiz] = await Promise.all([page.waitForEvent("download", { timeout: 60_000 }), page.getByRole("link", { name: "İmzasız PDF'i indir" }).click()]);
  const ham = readFileSync((await imzasiz.path())!);
  expect(ham.subarray(0, 5).toString("latin1")).toBe("%PDF-");
  const imzali = Buffer.concat([ham, Buffer.from("\n2 0 obj << /Type /Sig /Filter /Adobe.PPKLite /ByteRange [0 10 20 30] /Contents <00ff> >> endobj\n%%EOF\n", "latin1")]);
  await page.getByLabel("İmzalı PDF'i yükle").setInputFiles({ name: "imzali.pdf", mimeType: "application/pdf", buffer: imzali });
  await expect(page.getByText(`${raporNo} imzalandı, tamamlandı ve müşteriye açıldı.`).first()).toBeVisible({ timeout: 60_000 });
  await expect(page.getByRole("link", { name: "İmzalı PDF" })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("Tamamlandı", { exact: true }).filter({ visible: true }).first()).toBeVisible();
});
