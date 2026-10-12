/* NEREDEN GELDİ: reisim 2026-10-12: "görselde saha takip formu üretme işi yok ? neden ? geri gelsin." — maket planlarim.html saha formu (2026-09-26:
   "plan tamamlandıktan sonra saha formu oluştur tuşu gelsin bu tuşa istenildiği kadar basılsın"), 197 (imzalı saha formu yükle); göç 0082. Gerçek
   tarayıcıda, üç genişlikte: tohumdaki TAMAMLANMIŞ plan (genişlik başına ayrı — E2E_MUHASEBE.plan, imzalı raporlu; saha formu muhasebeye dokunmaz) →
   yönetici Tamamlama adımında "Saha formu oluştur" → listede numara (plan + SF + sıra) ve "Müşteri taraması yok" → PDF iner (%PDF, adı numarayla) →
   bir kez daha (istendiği kadar; yenisi üstte) → ilk forma imzalı tarama (PDF) yüklenir → "Müşteri imzalı tarama yüklü", "Taramayı aç" → Kaldır
   (sorulur) → "Müşteri taraması yok". Yetki, numara, tarama değişimi ve belge içeriği tests/plan-ici.test.ts + tests/saha-belgesi.test.ts. */
import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { E2E_MUHASEBE } from "./hesaplar";
import { girisli, hazir } from "./yardimci";

const PDF = Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n");

test("saha formu: tamamlanan planda oluştur (istendiği kadar), PDF indir, müşteri imzalı taramasını yükle ve kaldır", async ({ page }, bilgi) => {
  test.setTimeout(150_000);   // ilk koşuda plan sayfası ve PDF ucu soğuk derlenir
  const planNo = E2E_MUHASEBE.plan[bilgi.project.name as keyof typeof E2E_MUHASEBE.plan];
  await girisli(page, "yonetici");
  await page.goto("/planlar");
  await hazir(page);
  await page.getByRole("searchbox", { name: "Proje no" }).fill(planNo);   // Planlar listesinin süzgeci alanlı (Proje adı · Proje no)
  await page.getByRole("link", { name: planNo, exact: true }).first().click();
  await expect(page).toHaveURL(/\/planlar\/[0-9a-f-]{36}$/, { timeout: 30_000 });
  await hazir(page);

  const liste = page.getByRole("list", { name: "Saha formları" });
  const satirlar = liste.getByRole("listitem");
  const once = await satirlar.count();   // yeniden denemede önceki formlar durur (silinmez)
  const olustur = page.getByRole("button", { name: "Saha formu oluştur" }).filter({ visible: true }).first();
  await olustur.click();
  const no1 = `${planNo}-SF${once + 1}`, no2 = `${planNo}-SF${once + 2}`;
  await expect(satirlar).toHaveCount(once + 1, { timeout: 30_000 });
  const sf1 = satirlar.filter({ hasText: no1 });
  await expect(sf1).toContainText("Müşteri taraması yok");

  /* PDF: öteki belgelerle aynı motor, adı numarayla */
  const [indirme] = await Promise.all([page.waitForEvent("download", { timeout: 60_000 }), sf1.getByRole("link", { name: `${no1} PDF indir` }).click()]);
  expect(indirme.suggestedFilename()).toBe(`${no1}-saha-formu.pdf`);
  expect(readFileSync((await indirme.path())!).subarray(0, 5).toString("latin1")).toBe("%PDF-");

  /* istendiği kadar: yenisi üstte */
  await olustur.click();
  await expect(satirlar).toHaveCount(once + 2, { timeout: 30_000 });
  await expect(satirlar.first()).toContainText(no2);

  /* müşterinin ıslak imzalı + kaşeli kâğıdının taraması: yükle → aç → kaldır (sorulur) */
  await sf1.getByLabel(`${no1} imzalı taramayı yükle`).setInputFiles({ name: "sf-imzali.pdf", mimeType: "application/pdf", buffer: PDF });
  await expect(sf1).toContainText("Müşteri imzalı tarama yüklü", { timeout: 30_000 });
  await expect(sf1.getByRole("link", { name: `${no1} imzalı taramayı aç` })).toBeVisible();
  await sf1.getByRole("button", { name: `${no1} taramayı kaldır` }).click();
  await page.locator("dialog[open]").getByRole("button", { name: "Kaldır" }).click();
  await expect(sf1).toContainText("Müşteri taraması yok", { timeout: 30_000 });
  await expect(sf1.getByRole("link", { name: `${no1} imzalı taramayı aç` })).toHaveCount(0);
});
