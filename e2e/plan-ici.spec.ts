/* NEREDEN GELDİ: 310 Planlar listesi + plan içi (maket planlarim.html 4.–5. tur; pkproje §3.4). Gerçek tarayıcıda, üç genişlikte: yönetici plan açar
   → listede görür → denetçi listesinde yalnız kendi planı → plan içinde Kabul et beyan okunmadan kapalı, okununca kabul (telefonda tuş altta yapışkan
   çubukta) → Ekipman ekle: kod yazarken denetlenir (bu planda var / kullanılabilir), yeni ekipman "Yeni" rozetiyle listede → pasife al / etkinleştir →
   proje notu → yönetici künyeyi düzenler (ayrı tohum tesisinde: eklenen ekipman planlar.spec'in sayısını bozmaz) → denetçinin ekranı Güncelle'ye kadar eski künyeyle, Güncelle'yle yenisi. */
import { expect, test, type Page } from "@playwright/test";
import { E2E_HESAPLAR, E2E_PLAN } from "./hesaplar";
import { girisli, hazir } from "./yardimci";

async function planAc(page: Page) {
  await page.goto("/planlar/ac");
  await hazir(page);
  await page.getByRole("combobox", { name: "Müşteri" }).click();
  await page.getByRole("option", { name: /Plan Deneme/ }).click();
  await page.getByRole("combobox", { name: "Tesis" }).click();
  await page.getByRole("option", { name: new RegExp(E2E_PLAN.tesisIci) }).click();
  await page.getByRole("checkbox", { name: E2E_HESAPLAR.denetci.ad }).check();
  await page.getByRole("button", { name: "Planı aç" }).click();
  await expect(page).toHaveURL(/\/planlar\/[0-9a-f-]{36}$/, { timeout: 30_000 });
  return new URL(page.url()).pathname;
}

test("plan içi: liste, kabul (beyan), ekipman ekle / pasif, proje notu, künye düzenle → denetçi Güncelle", async ({ page, context }, bilgi) => {
  const kod = `E2E-${bilgi.project.name.slice(0, 3).toUpperCase()}-${bilgi.retry}`;
  const unvan = `${E2E_PLAN.musteri} (${bilgi.project.name})`;
  await girisli(page, "yonetici");
  const adres = await planAc(page);
  const no = (await page.getByRole("navigation", { name: "Konum" }).textContent())!.match(/P-\d{4}-\d{3,6}/)![0];

  /* liste: yönetici görür */
  await page.goto("/planlar");
  await hazir(page);
  await expect(page.getByRole("link", { name: no, exact: true })).toBeVisible();

  /* denetçi: listesinde planı, plan içinde Kabul (beyan okunmadan kapalı) */
  await context.clearCookies();
  await girisli(page, "denetci");
  await page.goto("/planlar");
  await hazir(page);
  await page.getByRole("link", { name: no, exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`${adres}$`), { timeout: 30_000 });
  await hazir(page);
  await expect(page.getByRole("heading", { level: 2, name: "Kabul" })).toBeVisible();
  await expect(page.getByText("Tarafsızlık ve çıkar çatışması beyanı")).toBeVisible();
  const kabul = page.getByRole("button", { name: "Kabul et" });
  await expect(kabul).toBeDisabled();
  await page.getByRole("checkbox", { name: "Tarafsızlık beyanını okudum, kabul ediyorum" }).check();
  await kabul.click();
  await expect(page.getByText("Plan kabul edildi.")).toBeVisible();
  await expect(page.getByText("Kabul edildi", { exact: true })).toBeVisible();
  await expect(page.getByText("Tarafsızlık beyanı onaylandı · beyanı gör")).toBeVisible();
  await expect(page.getByText("İlk rapor oluşturulunca denetim başlar.")).toBeVisible();

  /* Ekipman ekle: kod yazarken denetlenir */
  await page.getByRole("button", { name: "Ekipman ekle" }).click();
  const p = page.getByRole("dialog", { name: "Ekipman ekle" });
  await p.getByLabel("Ekipman kodu").fill("ht-0101");
  await expect(p.getByText("HT-0101 bu planda zaten var: Hava tankı. Aynı kod iki ekipmana verilemez.")).toBeVisible();
  await expect(p.getByRole("button", { name: "Kaydet ve plana ekle" })).toBeDisabled();
  await p.getByLabel("Ekipman kodu").fill(kod.toLowerCase());
  await expect(p.getByText("Kod kullanılabilir; bu firmada başka ekipmanda yok.")).toBeVisible();
  await p.getByRole("combobox", { name: "Ekipman türü" }).click();
  await p.getByRole("option", { name: /Hava tankı/ }).click();
  await p.getByLabel("Konum / tanım").fill("Kazan dairesi");
  await p.getByRole("button", { name: "Kaydet ve plana ekle" }).click();
  await expect(page.getByText(`${kod} eklendi.`)).toBeVisible();
  await expect(p).toHaveCount(0);
  await expect(page.getByText(kod, { exact: true })).toBeVisible();
  await expect(page.getByText("Yeni", { exact: true })).toBeVisible();

  /* pasife al / etkinleştir */
  await page.getByRole("button", { name: `${kod} pasife al` }).click();
  await expect(page.getByText(`${kod} pasife alındı; rapor açılamaz. Etkinleştir ile geri alınır.`)).toBeVisible();
  await page.getByRole("button", { name: "Etkinleştir" }).click();
  await expect(page.getByText(`${kod} yeniden etkin.`)).toBeVisible();

  /* proje notu */
  await page.getByLabel("Proje notu").fill("Giriş kartı bekçide");
  await page.getByRole("button", { name: "Notu ekle" }).click();
  await expect(page.getByText("Not eklendi.")).toBeVisible();
  await expect(page.getByText("Giriş kartı bekçide")).toBeVisible();

  /* yönetici künyeyi düzenler */
  await context.clearCookies();
  await girisli(page, "yonetici");
  await page.goto(adres);
  await hazir(page);
  await page.getByRole("button", { name: "Düzenle" }).click();
  await page.getByLabel("Firma adı").fill(unvan);
  await page.getByRole("button", { name: "Kaydet" }).click();
  await expect(page.getByText("Plan bilgileri kaydedildi.", { exact: false })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(unvan);

  /* 360: yönetici, hiç kullanılmamış (raporsuz) ekipmanı siler — onay "bütün planlardan çıkar, kodu yeniden kullanılabilir. Geri alınamaz." */
  await page.getByRole("button", { name: `${kod} sil` }).click();
  const onay = page.locator("dialog[open]");
  await expect(onay).toContainText(`${kod} kalıcı olarak silinir; bütün planlardan çıkar, kodu yeniden kullanılabilir. Geri alınamaz.`);
  await onay.getByRole("button", { name: "Sil" }).click();
  await expect(page.getByText(`${kod} silindi.`).first()).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(kod, { exact: true })).toHaveCount(0);

  /* denetçi: eski künye + şerit → Güncelle */
  await context.clearCookies();
  await girisli(page, "denetci");
  await page.goto(adres);
  await hazir(page);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(E2E_PLAN.musteri);
  await expect(page.getByText("Planlamacı plan bilgilerini değiştirdi:")).toBeVisible();
  await page.getByRole("button", { name: "Güncelle" }).click();
  await expect(page.getByText("Plan bilgileri güncellendi.")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(unvan);
});
