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
  await expect(page.getByText("2 ekipman · 1 tür plana girer")).toBeVisible();
  /* 465: kendiliğinden gelen ekipman çıkarılır (tesiste kalır), geri alınır */
  const tesisteki = page.getByRole("list", { name: "Tesisteki ekipmanlar" });
  await tesisteki.getByRole("button", { name: /plandan çıkar$/ }).first().click();
  await expect(page.getByText("1 ekipman · 1 tür plana girer · 1 çıkarıldı")).toBeVisible();
  await expect(tesisteki.getByText("bu plana alınmayacak", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Çıkarılanları geri al (1)" }).click();
  await expect(page.getByText("2 ekipman · 1 tür plana girer")).toBeVisible();
  await page.getByRole("checkbox", { name: denetci }).check();
  await expect(page.getByText(`${denetci} — uyarı: İSG-KATİP SÖZLEŞME ID'si yok · EKİPNET kayıt numarası yok.`)).toBeVisible();
  await expect(page.getByText("Hava tankı: ekipte bu türe atanmış denetçi yok (Personel › Ekipman atamaları).")).toBeVisible();
  await page.getByRole("textbox", { name: denetci }).fill(isgNo);
  await expect(page.getByText(`${denetci} — uyarı: EKİPNET kayıt numarası yok.`)).toBeVisible();

  /* 432: bilgilendirme — ekibe e-posta kendiliğinden; başkası elle yazılır (biçim denetlenir) ya da listeden seçilir */
  const bilgiEposta = `bilgi-${bilgi.project.name}-${bilgi.retry}@deneme.example`;
  await expect(page.getByText("Plan açılınca ekipteki denetçilere e-posta kendiliğinden gider (1 kişi).", { exact: false })).toBeVisible();
  const epostaGirdi = page.getByRole("textbox", { name: "E-posta ekle" });
  await epostaGirdi.fill("yanlis-adres");
  await page.getByRole("button", { name: "Ekle", exact: true }).click();
  await expect(page.getByText("Geçerli bir e-posta adresi yazın.")).toBeVisible();
  await epostaGirdi.fill(bilgiEposta);
  await epostaGirdi.press("Enter");
  const liste = page.getByRole("list", { name: "Bilgilendirilecekler" });
  await expect(liste).toContainText(bilgiEposta);
  await expect(page.getByText("Geçerli bir e-posta adresi yazın.")).toHaveCount(0);

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
  /* 432: e-postalar yanıttan sonra gönderilir (sağlayıcı taklidi) — plan sayfasında alıcı başına durum */
  const epostalar = page.getByRole("region", { name: "Bilgilendirme e-postaları" });
  await expect(async () => {
    await page.reload();
    await expect(epostalar).toContainText(bilgiEposta, { timeout: 5_000 });
    await expect(epostalar).toContainText("2 / 2 gönderildi", { timeout: 5_000 });
  }).toPass({ timeout: 60_000 });

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

/* 444 (reisim 2026-10-09: "plan açılırken ekipmanlar tesise girilenler kadar otomatik geliyor el ile de girilebilmeli liste gibi"; "seçilen
   denetçinin mailleri bilgilendirme maili kısmına otomatik gelsin"): ekipmansız tesiste elle ekipman satırı (tür + kod + konum) → plan açılınca
   tesise kayıt ve plana girer; seçilen denetçinin e-postası Bilgilendirilecekler'de kendiliğinden (kaldırılmaz); bölümler aynı satırda eşit boy */
test("plan aç: elle ekipman satırı plana ve tesise girer; seçilen denetçinin e-postası bilgilendirmede; kartlar eşit boy", async ({ page }, bilgi) => {
  const kod = `HT-EL${bilgi.project.name.slice(0, 1).toUpperCase()}${bilgi.retry}`;
  await girisli(page, "yonetici");
  await page.goto("/planlar/ac");
  await hazir(page);
  await page.getByRole("combobox", { name: "Müşteri" }).click();
  await page.getByRole("option", { name: /Plan Deneme/ }).click();
  await page.getByRole("combobox", { name: "Tesis" }).click();
  await page.getByRole("option", { name: new RegExp(E2E_PLAN.tesisElle) }).click();
  await expect(page.getByText("Tesiste kayıtlı ekipman yok; elle ekleyin ya da denetçi sahada ekler")).toBeVisible();
  await page.getByRole("checkbox", { name: E2E_HESAPLAR.denetci.ad }).check();
  const liste = page.getByRole("list", { name: "Bilgilendirilecekler" });
  await expect(liste).toContainText(E2E_HESAPLAR.denetci.eposta);
  await expect(liste.getByRole("button", { name: `${E2E_HESAPLAR.denetci.eposta} kaldır` })).toHaveCount(0);
  await page.getByRole("button", { name: "Ekipman ekle (elle)" }).click();
  await page.getByRole("combobox", { name: "1. ekipman türü" }).click();
  await page.getByRole("option", { name: /Hava tankı/ }).click();
  await page.getByRole("textbox", { name: "1. ekipman kodu" }).fill(kod.toLowerCase());
  await page.getByRole("textbox", { name: "1. konum" }).fill("Kazan dairesi");
  await expect(page.getByText("1 ekipman · 1 tür plana girer (1 elle eklendi)")).toBeVisible();
  /* geniş ekranda aynı satırdaki bölümler eşit boy (444: "bi taraf uzun bi taraf kısa") */
  if (bilgi.project.name === "masaustu") {
    const boylar = await page.locator("section[id^='pa-b']").evaluateAll((l) => l.map((e) => { const r = e.getBoundingClientRect(); return [Math.round(r.top), Math.round(r.height)]; }));
    const satirlar = new Map<number, number[]>();
    for (const [ust, boy] of boylar) satirlar.set(ust, [...(satirlar.get(ust) ?? []), boy]);
    for (const l of satirlar.values()) expect(Math.max(...l) - Math.min(...l), `aynı satırdaki bölümler: ${l.join(", ")}`).toBeLessThanOrEqual(2);
  }
  await page.getByRole("button", { name: "Planı aç" }).click();
  await expect(page).toHaveURL(/\/planlar\/[0-9a-f-]{36}$/, { timeout: 30_000 });
  await expect(page.getByRole("row", { name: /Hava tankı\s+Periyodik kontrol\s+1/ })).toBeVisible();
  await expect(page.getByText(kod).first()).toBeVisible();
});

/* 372 (§9 elli üçüncü tur): yanlış açılan, raporsuz plan yönetici tarafından silinir → Planlar'a dönülür */
test("plan: raporsuz plan silinir", async ({ page }) => {
  test.setTimeout(120_000);
  await girisli(page, "yonetici");
  await page.goto("/planlar/ac");
  await expect(page.getByRole("heading", { level: 1, name: "Plan aç" })).toBeVisible({ timeout: 30_000 });
  await hazir(page);
  await page.getByRole("combobox", { name: "Müşteri" }).click();
  await page.getByRole("option", { name: /Plan Deneme/ }).click();
  await page.getByRole("combobox", { name: "Tesis" }).click();
  await page.getByRole("option", { name: new RegExp(E2E_PLAN.tesis) }).click();
  await page.getByRole("checkbox", { name: E2E_HESAPLAR.denetci.ad }).check();
  await page.getByRole("button", { name: "Planı aç" }).click();
  await expect(page).toHaveURL(/\/planlar\/[0-9a-f-]{36}$/, { timeout: 30_000 });
  const no = (await page.getByRole("navigation", { name: "Konum" }).textContent())!.match(/P-\d{4}-\d{3,6}/)![0];
  await hazir(page);
  await page.getByRole("button", { name: "Sil", exact: true }).click();
  const onay = page.locator("dialog[open]");
  await expect(onay).toContainText(`${no} kalıcı olarak silinir; ekip, ekipman satırları ve proje notları da silinir; ekipmanlar tesiste kalır. Geri alınamaz.`);
  await onay.getByRole("button", { name: "Sil" }).click();
  await expect(page).toHaveURL(/\/planlar$/, { timeout: 30_000 });
  await expect(page.getByText(`${no} silindi.`).first()).toBeVisible();
});
