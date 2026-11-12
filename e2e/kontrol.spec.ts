/* NEREDEN GELDİ: 2026-11-12 — reisim: "türkaklı ve türkaksız firmalar için 2 ayrı model oluşturup ona göre yapmalıyız", "yazılan süre ile ekipman
   başında geçirilen süre uymalı", "ara verme olmasın" (pkproje.md §11 K1, K2, K7; göç 0127–0129). Gerçek tarayıcıda, üç genişlikte:
   Yönetim'de deneme firması TÜRKAK'lı yapılır → Firma ayarları başlığında model, "Kontrol denetimleri" paneli → yönetici plan açar, denetçi kabul eder ve rapor oluşturur → saha raporunda "Kontrol süresi" kutusu: başlangıç / bitiş yazılamaz,
   "Kontrole başla" → Sürüyor → "Kontrolü bitir" → Ölçüldü → "Saati düzelt" kısa gerekçeyle kaydedilmez, gerekçeyle kaydedilir (Elle düzeltildi,
   gerekçe görünür). Test bitince model TÜRKAK'sız'a geri alınır (tek işçi, sıralı koşu — öteki testler TÜRKAK'sız firmada çalışır).
   Bu testte OLMAYAN: sapma gerekçesi penceresi (tam doldurulmuş rapor ister) — sunucu kuralı tests/raporlar.test.ts ve tests/sapma.test.ts'te. */
import { expect, test, type Browser, type Locator, type Page } from "@playwright/test";
import { E2E_FIRMA, E2E_HESAPLAR, E2E_KAPI, E2E_PAROLA, E2E_PLAN, E2E_SAHA, E2E_YONETIM } from "./hesaplar";
import { bolumleriAc, girisli, hazir } from "./yardimci";

const Y = `http://${E2E_YONETIM.alan}:${E2E_KAPI}`;
const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const BASLANGIC = "Periyodik kontrol başlangıç tarihi ve saati";
const GUN = new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", day: "2-digit", month: "2-digit", year: "numeric" });
const bugunTr = () => GUN.format(new Date());
const dunTr = () => GUN.format(new Date(Date.now() - 864e5));

/** Yönetim'de deneme firmasının çalışma modelini istenen hâle getirir (hazırlık yöneticisiyle; iki adım kapalı — parolayla doğrudan panel) */
async function modelYap(browser: Browser, model: "TÜRKAK'lı" | "TÜRKAK'sız") {
  const baglam = await browser.newContext();
  const y = await baglam.newPage();
  try {
    await y.goto(`${Y}/yonetim/giris`);
    await hazir(y);
    await y.getByLabel("E-posta").fill(E2E_YONETIM.hazirla);
    await y.getByLabel("Parola", { exact: true }).fill(E2E_PAROLA);
    await y.getByRole("button", { name: "Giriş yap" }).click();
    await expect(y).toHaveURL(/\/yonetim$/, { timeout: 30_000 });
    await hazir(y);
    await y.getByRole("link", { name: E2E_FIRMA.ad, exact: true }).click();
    await expect(y).toHaveURL(new RegExp(`/yonetim/f/${UUID}$`), { timeout: 30_000 });
    await hazir(y);
    const kutu = y.locator("details").filter({ has: y.getByRole("heading", { level: 3, name: "Çalışma modeli" }) });
    if ((await kutu.getAttribute("open")) === null) await kutu.locator("summary").click();
    const cm = y.getByRole("region", { name: "Çalışma modeli" });
    const secenek = cm.getByRole("radio", { name: new RegExp(`^${model}`) });
    await expect(secenek).toBeVisible({ timeout: 30_000 });
    if (!(await secenek.isChecked())) {
      await secenek.check();
      await cm.getByRole("button", { name: "Kaydet" }).click();
      await y.locator("dialog[open]").getByRole("button", { name: "Değiştir" }).click();
      await expect(cm.getByRole("button", { name: "Kaydet" })).toBeDisabled({ timeout: 30_000 });
      await expect(secenek).toBeChecked();
    }
  } finally { await baglam.close(); }
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

/** penceredeki tarih + saat alanı (TarihAlani: tarih kutusu, saat ve dakika ayrı kutular) — alanın kimliğiyle (KontrolKutusu: r-kd-bas / r-kd-bit).
    2026-11-12 (CI 446f6ddf): etiketle süzme pencere köküne bağlı konumlayıcıyla çalışmadı (alanın içinde pencere aranıyordu) */
async function zamanYaz(kap: Locator, id: string, gun: string, saat: string, dakika: string) {
  const alan = kap.locator(`[data-zaman="${id}"]`);
  await alan.locator("input:not([data-parca])").fill(gun);
  await alan.locator('input[data-parca="saat"]').fill(saat);
  const dk = alan.locator('input[data-parca="dakika"]');
  await dk.fill(dakika);
  await dk.press("Escape");
}

/* test düşse de öteki testler TÜRKAK'sız firmada koşsun */
test.afterAll(async ({ browser }) => { await modelYap(browser, "TÜRKAK'sız"); });

test("kontrol saati (TÜRKAK'lı): model Yönetim'den; saha raporunda saat yazılmaz — başlat, bitir, gerekçeyle düzelt", async ({ page, context, browser }) => {
  test.setTimeout(600_000);
  await modelYap(browser, "TÜRKAK'lı");

  /* firma yöneticisi: Firma ayarları başlığında model; "Kontrol denetimleri" paneli yalnız TÜRKAK'lıda */
  await girisli(page, "yonetici");
  await page.goto("/firma-ayarlari");
  await hazir(page);
  await expect(page.getByText("TÜRKAK'lı", { exact: true })).toBeVisible();
  await expect(page.locator('button[data-panel="kontrol"]')).toContainText("Tesisler arası süre denetlenmiyor");

  const adres = await planAc(page);

  /* denetçi: planı kabul eder, rapor oluşturur, saha rapor ekranını açar */
  await context.clearCookies();
  await girisli(page, "denetci");
  await page.goto(adres);
  await hazir(page);
  await page.getByRole("checkbox", { name: "Tarafsızlık beyanını okudum, kabul ediyorum" }).check();
  await page.getByRole("button", { name: "Kabul et" }).click();
  await expect(page.getByText("Plan kabul edildi.")).toBeVisible();
  await page.getByRole("button", { name: `${E2E_SAHA.ekipman} için rapor oluştur` }).click();
  await expect(page.getByText(/^Rapor oluşturuldu: /).first()).toBeVisible({ timeout: 30_000 });
  await page.getByRole("region", { name: "Raporlar", exact: true }).getByRole("link", { name: "Raporu düzenle" }).click();
  await expect(page).toHaveURL(new RegExp(`/raporlar/${UUID}$`), { timeout: 30_000 });
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(`${E2E_SAHA.ekipman} · ${E2E_SAHA.tur}`, { timeout: 30_000 });
  await bolumleriAc(page);

  /* kontrol başlamadı: başlangıç yazılamaz, boş */
  const kk = page.getByRole("group", { name: "Kontrol süresi" });
  await expect(kk).toContainText("Başlamadı");
  const bas = page.getByLabel(BASLANGIC);
  await expect(bas).toHaveAttribute("readonly", "");
  await expect(bas).toHaveValue("-");

  /* başlat → sürüyor, başlangıç bugünün saatiyle yazılı; bitir → ölçüldü */
  await kk.getByRole("button", { name: "Kontrole başla" }).click();
  await expect(kk).toContainText("Sürüyor", { timeout: 30_000 });
  await expect(bas).toHaveValue(new RegExp(`^${bugunTr().replace(/\./g, "\\.")} \\d{2}:\\d{2}$`), { timeout: 30_000 });
  /* 0131 (K4): bitiş BAĞLANTISIZKEN — cihaz saatiyle kuyruğa ("Gönderilecek"; saat düzeltilemez), bağlantı gelince sunucuya gider. Cihaz saati
     çıkıştan önce ölçüldüyse "Cihaz saati", ölçülmediyse "Saat tutmadı" (deneme ortamında ikisi de olabilir) */
  await context.setOffline(true);
  await kk.getByRole("button", { name: "Kontrolü bitir" }).click();
  await expect(kk).toContainText("Gönderilecek", { timeout: 30_000 });
  await expect(kk).toContainText("Ölçüldü");
  await expect(kk.getByRole("button", { name: "Saati düzelt" })).toHaveCount(0);
  await context.setOffline(false);
  await expect(page.getByText("cihazda bekleyen kontrol saati gönderildi", { exact: false }).first()).toBeVisible({ timeout: 60_000 });
  await expect(kk).not.toContainText("Gönderilecek", { timeout: 30_000 });
  await expect(kk).toContainText(/Cihaz saati|Saat tutmadı/);
  await expect(kk).toContainText("Ölçüldü", { timeout: 30_000 });
  await expect(kk.getByRole("button", { name: "Kontrole başla" })).toHaveCount(0);

  /* saati düzelt: kısa gerekçeyle kaydedilmez; gerekçeyle kaydedilir — ölçülen kayıtta kalır, gerekçe görünür */
  await kk.getByRole("button", { name: "Saati düzelt" }).click();
  const pen = page.getByRole("dialog", { name: "Saati düzelt" });
  await expect(pen).toBeVisible();
  await zamanYaz(pen, "r-kd-bas", dunTr(), "09", "00");
  await zamanYaz(pen, "r-kd-bit", dunTr(), "09", "40");
  await pen.getByLabel("Gerekçe").fill("kısa");
  await pen.getByRole("button", { name: "Kaydet" }).click();
  await expect(pen.getByText("Gerekçe en az 10 karakter olmalı.")).toBeVisible({ timeout: 30_000 });
  await pen.getByLabel("Gerekçe").fill("Tuşa geç basıldı, saat düzeltildi");
  await pen.getByRole("button", { name: "Kaydet" }).click();
  await expect(kk).toContainText("Elle düzeltildi", { timeout: 30_000 });
  await expect(kk).toContainText("Tuşa geç basıldı, saat düzeltildi");
  await expect(kk).toContainText("40 dk");
  await expect(bas).toHaveValue(`${dunTr()} 09:00`);

  /* T7 zaman çizelgesi: rapor ekranındaki bağlantıdan — ölçülen başlangıç ve bitiş, gerekçeli düzeltme (kaynağı Elle) */
  await page.getByRole("link", { name: "Zaman çizelgesi" }).click();
  await expect(page).toHaveURL(new RegExp(`/raporlar/${UUID}/cizelge$`), { timeout: 30_000 });
  const tablo = page.getByRole("table", { name: "Raporun zaman çizelgesi" });
  await expect(tablo.getByRole("row").filter({ hasText: "Rapor açıldı" })).toHaveCount(1, { timeout: 30_000 });
  await expect(tablo.getByRole("row").filter({ hasText: "Kontrol başladı" })).toHaveCount(1);
  await expect(tablo.getByRole("row").filter({ hasText: "Kontrol bitti" })).toHaveCount(1);
  await expect(tablo.getByRole("row").filter({ hasText: "Kontrol saati gerekçeyle düzeltildi" })).toContainText("Elle");
  await expect(page.getByRole("button", { name: "Excel'e aktar" })).toBeVisible();

  /* T7 günlük çizelge: Raporlar listesindeki bağlantıdan (TÜRKAK'lı firmada) → önceki gün: düzeltilen kontrol 09:00 – 09:40, elle yazıldığı işaretli */
  await page.goto("/raporlar");
  await page.getByRole("link", { name: "Günlük çizelge" }).click();
  await expect(page).toHaveURL(/\/raporlar\/gunluk$/, { timeout: 30_000 });
  await page.getByRole("link", { name: "Önceki gün" }).click();
  await expect(page).toHaveURL(/\/raporlar\/gunluk\?gun=\d{4}-\d{2}-\d{2}$/, { timeout: 30_000 });
  const satir = page.getByRole("table", { name: "Günlük çizelge" }).getByRole("row").filter({ hasText: E2E_SAHA.ekipman });
  await expect(satir).toHaveCount(1, { timeout: 30_000 });
  await expect(satir).toContainText("09:00");
  await expect(satir).toContainText("09:40");
  await expect(satir).toContainText("40 dk");
  await expect(satir).toContainText("Saat elle yazıldı");
});
