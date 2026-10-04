/* NEREDEN GELDİ: 309 Plan aç (maket plan-ac.html M6 2. tur; L6 kapsam seçimi yok, G1, L2 İSG-KATİP uyarı, L4 atama uyarısı). Gerçek tarayıcıda, üç
   genişlikte: yönetici Planlar'dan Plan aç → boş gönderim engeli (müşteri, tesis) → tohumlanan müşteri + tesis → denetçi seç → canlı uyarılar (İSG-KATİP
   yok, EKİPNET yok, türe atanmış denetçi yok) ve ekipman özeti → İSG-KATİP SÖZLEŞME ID el ile → Planı aç → plan sayfası (proje no, künye, ID) ·
   denetçi Plan aç'ı görmez, /planlar/ac yetkisiz, içinde olduğu planı görür · muhasebe Planlar'ı göremez. */
import { expect, test } from "@playwright/test";
import { E2E_HESAPLAR, E2E_PLAN } from "./hesaplar";
import { girisli, hazir } from "./yardimci";

test("plan aç: engel, canlı uyarılar, proje no ve künye; denetçi yalnız kendi planını görür, muhasebe göremez", async ({ page, context }, bilgi) => {
  const isgNo = `E2E-${bilgi.project.name.slice(0, 3).toUpperCase()}-${bilgi.retry}`;
  const denetci = E2E_HESAPLAR.denetci.ad;
  await girisli(page, "yonetici");
  await page.goto("/planlar");
  await hazir(page);
  await page.getByRole("link", { name: "Plan aç" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Plan aç" })).toBeVisible({ timeout: 30_000 });
  await hazir(page);

  /* boş gönderim: plan açılmaz, müşteri ve tesis eksik yazar */
  await page.getByRole("button", { name: "Planı aç" }).click();
  await expect(page.getByText(/Plan açılmadı: \d+ eksik düzeltilmeli\./)).toBeVisible();
  await expect(page.getByText("Müşteri seçilmeli.")).toBeVisible();
  await expect(page.getByText("Tesis seçilmeli.")).toBeVisible();

  /* müşteri + tesis → denetçi listesi ve ekipman özeti */
  await page.getByRole("combobox", { name: "Müşteri" }).click();
  await page.getByRole("option", { name: /Plan Deneme/ }).click();
  await page.getByRole("combobox", { name: "Tesis" }).click();
  await page.getByRole("option", { name: new RegExp(E2E_PLAN.tesis) }).click();
  await expect(page.getByText("Bu tesiste İSG-KATİP SÖZLEŞME ID'si yok.")).toBeVisible();
  await expect(page.getByText("2 ekipman · 1 tür · hepsi plana girer")).toBeVisible();
  await page.getByRole("checkbox", { name: denetci }).check();
  await expect(page.getByText(`${denetci} — uyarı: İSG-KATİP SÖZLEŞME ID'si yok · EKİPNET kayıt numarası yok.`)).toBeVisible();
  await expect(page.getByText("Hava tankı: ekipte bu türe atanmış denetçi yok (Personel › Ekipman atamaları).")).toBeVisible();
  await page.getByRole("textbox", { name: denetci }).fill(isgNo);
  await expect(page.getByText(`${denetci} — uyarı: EKİPNET kayıt numarası yok.`)).toBeVisible();

  /* aç → plan sayfası: sunucunun verdiği proje no, künye kayıttan, ID planda */
  await page.getByRole("button", { name: "Planı aç" }).click();
  await expect(page).toHaveURL(/\/planlar\/[0-9a-f-]{36}$/, { timeout: 30_000 });
  /* 310: başlıkta firma adı (L7), proje no kırıntıda ve plan bilgisinde; ekipman teklif içeriğinde */
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(E2E_PLAN.musteri);
  await expect(page.getByRole("navigation", { name: "Konum" })).toContainText(/P-\d{4}-\d{3,6}/);
  const planAdresi = new URL(page.url()).pathname;
  await expect(page.getByText("Kabul bekliyor", { exact: true })).toBeVisible();
  await expect(page.getByText("Deneme Cad. No 1, Gebze / Kocaeli")).toBeVisible();
  await expect(page.getByText(isgNo)).toBeVisible();
  await expect(page.getByRole("row", { name: /Hava tankı\s+Periyodik kontrol\s+2/ })).toBeVisible();

  /* denetçi: Plan aç yok, form yetkisiz, içinde olduğu planı görür */
  await context.clearCookies();
  await girisli(page, "denetci");
  await page.goto("/planlar");
  await hazir(page);
  await expect(page.getByRole("heading", { level: 1, name: "Planlar" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Plan aç" })).toHaveCount(0);
  await page.goto("/planlar/ac");
  await expect(page.getByText("Bu sayfayı görme yetkiniz yok")).toBeVisible();
  await page.goto(planAdresi);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(E2E_PLAN.musteri);
  await expect(page.getByRole("link", { name: "Yeni plan aç" })).toHaveCount(0);

  /* muhasebe: Planlar'ı göremez */
  await context.clearCookies();
  await girisli(page, "muhasebe");
  await page.goto(planAdresi);
  await expect(page.getByText("Bu sayfayı görme yetkiniz yok")).toBeVisible();
});
