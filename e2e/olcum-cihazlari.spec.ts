/* NEREDEN GELDİ: K2 Ölçüm cihazları (2026-10-04) — maket olcum-cihazlari.html (M4 2. tur; T7 cihaz türü ekle). Gerçek tarayıcıda, üç
   genişlikte: cihaz ekle (yeni tür adıyla) → cihaz sayfası "Kalibrasyonu geçti" (kayıt yok) · kalibrasyon kaydı ekle (sertifika PDF'i) →
   "Geçerli", sertifika açılır · kalibrasyona gönder → "Depoya al" · denetçi (kendi) cihaz görmez, ekleyemez. */
import { expect, test } from "@playwright/test";
import { E2E_SAHA } from "./hesaplar";
import { girisli, hazir } from "./yardimci";

const PDF = Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n");
const iso = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return d; };
const ekran = (d: Date) => `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;

test("ölçüm cihazı: ekle, kalibrasyon kaydı, kalibrasyona gönder; denetçi ekleyemez", async ({ page, context }, bilgi) => {
  const kod = `E2E-${bilgi.project.name.slice(0, 3).toUpperCase()}${bilgi.retry}`;
  await girisli(page, "yonetici");
  await page.goto("/olcum-cihazlari");
  await hazir(page);
  await page.getByRole("button", { name: "Cihaz ekle" }).click();
  const p = page.getByRole("dialog", { name: "Cihaz ekle" });
  await p.getByLabel("Cihaz kodu").fill(kod);
  const tur = p.getByRole("combobox", { name: "Cihaz türü" });
  if (await tur.count()) { await tur.click(); await p.getByRole("option", { name: "Yeni tür…" }).click(); }
  await p.getByLabel("Yeni tür adı").fill("Deneme topraklama ölçer");
  await p.getByLabel("Seri no").fill("S-1");
  await p.getByRole("button", { name: "Kaydet" }).click();
  /* ilk açılışta geliştirme sunucusu cihaz sayfasını derler (yavaş makinede 5 sn aşılıyor) */
  await expect(page).toHaveURL(/\/olcum-cihazlari\/[0-9a-f-]{36}$/, { timeout: 30_000 });
  await expect(page.getByRole("heading", { level: 1, name: `${kod} · Deneme topraklama ölçer` })).toBeVisible();
  await expect(page.getByText("Geçerli kalibrasyon kaydı yok.")).toBeVisible();

  await hazir(page);
  await page.getByRole("button", { name: "Kalibrasyon kaydı ekle" }).click();
  const k = page.getByRole("dialog", { name: "Kalibrasyon kaydı ekle" });
  await k.getByLabel("Kalibrasyon tarihi").fill(ekran(iso(-10)));
  await k.getByLabel("Geçerlilik bitişi").fill(ekran(iso(355)));
  await k.getByLabel("Laboratuvar").fill("Deneme Kalibrasyon Lab.");
  await k.getByLabel("Sertifika no").fill("KL-E2E-1");
  await k.getByLabel("Sertifika (PDF)").setInputFiles({ name: "kl-e2e-1.pdf", mimeType: "application/pdf", buffer: PDF });
  await k.getByRole("button", { name: "Kaydet" }).click();
  await expect(page.getByText("Kalibrasyon kaydı eklendi.")).toBeVisible();
  await expect(page.getByText("Geçerli", { exact: true }).first()).toBeVisible();
  const ac = page.getByRole("link", { name: "Sertifikayı aç" });
  /* oturumlu uç tarayıcının içinden istenir (test sürecinin kendi isteği firma adresini çözemez) */
  const yanit = await page.evaluate(async (h) => { const r = await fetch(h!); return [r.status, r.headers.get("content-type")]; }, await ac.getAttribute("href"));
  expect(yanit).toEqual([200, "application/pdf"]);

  await page.getByRole("button", { name: "Kalibrasyona gönder" }).click();
  await expect(page.getByText("Cihaz kalibrasyona gönderildi.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Depoya al" })).toBeVisible();

  /* denetçi ("kendi" düzeyi): modüle girer, zimmeti gelene kadar cihaz görmez, ekleyemez */
  await context.clearCookies();
  await girisli(page, "denetci");
  await page.goto("/olcum-cihazlari");
  await hazir(page);
  await expect(page.getByRole("heading", { level: 1, name: "Ölçüm cihazları" })).toBeVisible();
  await expect(page.getByRole("link", { name: kod })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Cihaz ekle" })).toHaveCount(0);
});

/* 357 (reisim 2026-10-07: "denemek için bir kaç cihaz ekledim ama silemedim"): hiç kullanılmamış cihaz yöneticide "Sil" → onay (tehlike, "Geri
   alınamaz") → listeye döner, cihaz yok; aynı kod yeniden eklenebilir. Denetçi (kendi) cihaz sayfasına giremez. */
test("ölçüm cihazı: kullanılmamış cihaz silinir, kod serbest kalır", async ({ page }, bilgi) => {
  const kod = `SIL-${bilgi.project.name.slice(0, 3).toUpperCase()}${bilgi.retry}`;
  const ekle = async () => {
    await page.goto("/olcum-cihazlari");
    await hazir(page);
    await page.getByRole("button", { name: "Cihaz ekle" }).click();
    const p = page.getByRole("dialog", { name: "Cihaz ekle" });
    await p.getByLabel("Cihaz kodu").fill(kod);
    const tur = p.getByRole("combobox", { name: "Cihaz türü" });
    if (await tur.count()) { await tur.click(); await p.getByRole("option", { name: "Yeni tür…" }).click(); }
    await p.getByLabel("Yeni tür adı").fill("Deneme silme ölçer");
    await p.getByRole("button", { name: "Kaydet" }).click();
    await expect(page).toHaveURL(/\/olcum-cihazlari\/[0-9a-f-]{36}$/, { timeout: 30_000 });
    await hazir(page);
  };
  await girisli(page, "yonetici");
  await ekle();
  await page.getByRole("button", { name: "Sil", exact: true }).click();
  const onay = page.locator("dialog[open]");
  await expect(onay).toContainText(`${kod} kalıcı olarak silinir; kalibrasyon kayıtları ve sertifikaları da silinir, kodu yeniden kullanılabilir. Geri alınamaz.`);
  await onay.getByRole("button", { name: "Sil" }).click();
  await expect(page).toHaveURL(/\/olcum-cihazlari$/, { timeout: 30_000 });
  await expect(page.getByText(`${kod} silindi.`).first()).toBeVisible();
  await expect(page.getByRole("link", { name: kod })).toHaveCount(0);
  await ekle();
  await expect(page.getByRole("heading", { level: 1, name: `${kod} · Deneme silme ölçer` })).toBeVisible();
});

/* 358 (§9 elli üçüncü tur: kullanılmış kayıt silinmez, pasife alınır): denetçinin zimmetindeki, raporda kullanılan MN-01'de "Sil" yok, "Pasife al"
   var; pencere nedeni söyler (kullanıldı; silinemez) ve zimmetteki cihazı pasife almaz (önce depoya teslim). Cihaz değişmez (öteki testler kullanır). */
test("ölçüm cihazı: kullanılmış cihazda Sil yok, Pasife al zimmetteyken reddedilir", async ({ page }) => {
  await girisli(page, "yonetici");
  await page.goto("/olcum-cihazlari");
  await hazir(page);
  await page.getByRole("link", { name: E2E_SAHA.cihaz, exact: true }).click();
  await expect(page.getByRole("heading", { level: 1, name: new RegExp(`^${E2E_SAHA.cihaz} · `) })).toBeVisible({ timeout: 30_000 });
  await hazir(page);
  await expect(page.getByRole("button", { name: "Sil", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Pasife al" }).click();
  const p = page.locator("dialog[open]");
  await expect(p).toContainText(/kullanıldı; silinemez\./);
  await expect(p).toContainText("Etkinleştir ile geri gelir.");
  await p.getByRole("button", { name: "Pasife al" }).click();
  await expect(p).toContainText(`${E2E_SAHA.cihaz} bir kişinin zimmetinde; önce Zimmetler'den depoya teslim alın.`);
  await p.getByRole("button", { name: "Vazgeç" }).click();
  await expect(page.getByText("Pasif", { exact: true })).toHaveCount(0);
});
