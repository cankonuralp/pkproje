/* NEREDEN GELDİ: 308 Rapor formatının saklanması (RAPOR-FORMAT.md §4–5; maket ekipman-turleri.html Format kurucu: "Taslak · vN" / "Yayında · vN",
   Yayınla onaylı). Gerçek tarayıcıda, üç genişlikte: tür sayfasında "Rapor şablonu" boş → Şablondan başlat (ZPKR02) → önizleme sayfası (taslak,
   Bakanlık bölümleri) → Yayınla (sürüm notu) → Sürüm 1 yayında → yayındaki sürümden yeni taslak → Sürüm 2 yayında, Sürüm 1 eski · denetçi
   bölümü ve önizlemeyi görür, başlatamaz / yayınlayamaz. K4 Format kurucu (2026-10-06): taslak kurucuda açılır; geniş ekranda bölüm eklenir,
   adı yazılır → "Kaydedilmedi" (Yayınla yok) → Taslağı kaydet; Bakanlık bölümü silinemez; telefonda yalnız önizleme. */
import { expect, test, type Page } from "@playwright/test";
import { girisli, hazir } from "./yardimci";

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
  await expect(page.getByText("Rapor şablonu yayınlanmadı.")).toBeVisible();

  /* hazır şablondan taslak → önizleme: Bakanlık bölümleri ve maddeleri */
  await basla(page, /Elektrik iç tesisatı \(ZPKR02/);
  await expect(page.getByRole("heading", { level: 3, name: "5 · Gözle kontrol" })).toBeVisible();
  await expect(page.getByText("Kablo şebeke tarafı")).toBeVisible();
  await expect(page.getByRole("heading", { level: 3, name: "1 · Firma bilgileri" })).toBeVisible();
  if (bilgi.project.name !== "telefon") {
    /* Format kurucu: bölüm ekle, adını yaz → kaydedilmedi (yayınlanmaz) → taslağı kaydet; Bakanlık bölümü silinemez */
    await page.getByRole("combobox", { name: "Bölüm ekle" }).click();
    await page.getByRole("option", { name: "Not / yorum" }).click();
    await expect(page.getByText("Kaydedilmedi")).toBeVisible();
    await expect(page.getByRole("button", { name: "Yayınla" })).toHaveCount(0);
    await page.getByLabel("Bölüm adı").fill("Deneme yorumu");
    await page.getByRole("button", { name: "Taslağı kaydet" }).click();
    await expect(page.getByText("Taslak kaydedildi.").first()).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("Kaydedilmedi")).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 3, name: /· Deneme yorumu$/ })).toBeVisible({ timeout: 30_000 });
    await page.getByRole("navigation", { name: "Bölümler" }).getByRole("button", { name: /^5 · Gözle kontrol/ }).click();
    await expect(page.getByText("Bakanlık alanı · silinemez")).toBeVisible();
    await expect(page.getByRole("button", { name: "Bölümü sil" })).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), "yana taşma yok").toBe(true);
  } else await expect(page.getByText("Format kurucu masaüstünde kullanılır; burada önizleme görünür.")).toBeVisible();
  await yayinla(page, "ilk sürüm", 1);
  await expect(page.getByRole("button", { name: "Yayınla" })).toHaveCount(0);

  /* tür sayfası: yüz ve sürüm satırı */
  await page.goto(turAdresi);
  await hazir(page);
  await expect(page.getByRole("link", { name: /Rapor şablonu\s*Sürüm 1/ })).toBeVisible();
  await expect(page.getByText("ilk sürüm")).toBeVisible();

  /* yayındaki sürümden yeni taslak → Sürüm 2; Sürüm 1 eskiye düşer */
  await basla(page, /Sürüm 1 · yayında/);
  await yayinla(page, "ikinci sürüm", 2);
  await page.goto(turAdresi);
  await hazir(page);
  await expect(page.getByText("Eski", { exact: true })).toBeVisible();
  await expect(page.getByText("Yayında", { exact: true })).toBeVisible();

  /* denetçi: görür, başlatamaz / yayınlayamaz */
  await context.clearCookies();
  await girisli(page, "denetci");
  await page.goto(turAdresi);
  await hazir(page);
  await expect(page.getByRole("heading", { level: 2, name: "Rapor şablonu" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Şablondan başlat" })).toHaveCount(0);
  await page.getByRole("link", { name: "Önizle" }).first().click();
  await expect(page.getByRole("heading", { level: 1, name: "Rapor şablonu · Sürüm 2" })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("button", { name: "Yayınla" })).toHaveCount(0);
});
