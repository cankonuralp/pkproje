/* NEREDEN GELDİ: K2 Ölçüm cihazları (2026-10-04) — maket olcum-cihazlari.html (M4 2. tur; T7 cihaz türü ekle). Gerçek tarayıcıda, üç
   genişlikte: cihaz ekle (yeni tür adıyla) → cihaz sayfası "Kalibrasyonu geçti" (kayıt yok) · kalibrasyon kaydı ekle (sertifika PDF'i) →
   "Geçerli", sertifika açılır · kalibrasyona gönder → "Depoya al" · denetçi (kendi) cihaz görmez, ekleyemez. */
import { expect, test } from "@playwright/test";
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
