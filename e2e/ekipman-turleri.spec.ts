/* NEREDEN GELDİ: K2 Ekipman türleri (2026-10-04) — maket ekipman-turleri.html (M3, onaylı 2026-09-26; AA5 Mekanik / Elektrik sekmeleri).
   Gerçek tarayıcıda, üç genişlikte: tür ekle (hatalı periyot alanın altında söylenir) → tür sayfası · rapor formatı PDF yükle → "Sürüm 1 ·
   Kullanımda", PDF açılır (yeni sekme, oturumlu uç) · Ek-III dışı türde branş seçilir, Elektrik sekmesinde görünür · denetçi görür, ekleyemez. */
import { expect, test } from "@playwright/test";
import { girisli, hazir } from "./yardimci";

const PDF = Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n");

test("ekipman türü: ekle, rapor formatı yükle, elektrik sekmesi; denetçi yalnız görür", async ({ page, context }, bilgi) => {
  const on = { masaustu: "MS", tablet: "TB", telefon: "TL" }[bilgi.project.name] ?? "XX";
  const kod = `${on}${"ABCDEFGH"[bilgi.retry]}`;
  await girisli(page, "yonetici");
  await page.goto("/ekipman-turleri");
  await hazir(page);
  await page.getByRole("button", { name: "Tür ekle" }).click();
  const p = page.getByRole("dialog", { name: "Tür ekle" });
  await p.getByLabel("Tür adı").fill(`Deneme Vinç ${kod}`);
  await p.getByLabel("Kod").fill(kod.toLowerCase());
  await p.getByRole("combobox", { name: "Ek-III grubu" }).click();
  await p.getByRole("option", { name: /Kaldırma ve iletme/ }).click();
  await p.getByLabel("Periyot (ay)").fill("200");
  await p.getByRole("button", { name: "Kaydet" }).click();
  await expect(p.getByText("Periyot 1–120 ay.")).toBeVisible();
  await p.getByLabel("Periyot (ay)").fill("12");
  await p.getByRole("button", { name: "Kaydet" }).click();
  /* ilk açılışta geliştirme sunucusu tür sayfasını derler (yavaş makinede 5 sn aşılıyor) */
  await expect(page).toHaveURL(/\/ekipman-turleri\/[0-9a-f-]{36}$/, { timeout: 30_000 });
  await expect(page.getByRole("heading", { level: 1, name: `Deneme Vinç ${kod}` })).toBeVisible();
  await expect(page.getByText("Bu türün rapor formatı yüklenmedi.")).toBeVisible();

  await hazir(page);
  await page.getByRole("button", { name: "Rapor formatı yükle" }).click();
  const f = page.getByRole("dialog", { name: "Rapor formatı yükle" });
  await f.getByLabel("Rapor formatı (PDF)").setInputFiles({ name: "vinc-formati.pdf", mimeType: "application/pdf", buffer: PDF });
  await f.getByLabel("Sürüm notu").fill("ilk sürüm");
  await f.getByRole("button", { name: "Yükle" }).click();
  await expect(page.getByText("Rapor formatı yüklendi: sürüm 1.")).toBeVisible();
  await expect(page.getByText("Kullanımda")).toBeVisible();
  const ac = page.getByRole("link", { name: "PDF'i aç" });
  await expect(ac).toHaveAttribute("target", "_blank");
  /* oturumlu uç tarayıcının içinden istenir (test sürecinin kendi isteği firma adresini çözemez) */
  const yanit = await page.evaluate(async (h) => { const r = await fetch(h!); return [r.status, r.headers.get("content-type")]; }, await ac.getAttribute("href"));
  expect(yanit).toEqual([200, "application/pdf"]);

  /* Ek-III dışı: branş açık sekmeden gelir (Elektrik sekmesinden eklenen Elektrik'e düşer; boş branş sunucuda reddedilir — birim testi) */
  await page.goto("/ekipman-turleri?brans=e");
  await hazir(page);
  await page.getByRole("button", { name: "Tür ekle" }).click();
  const e = page.getByRole("dialog", { name: "Tür ekle" });
  await e.getByLabel("Tür adı").fill(`Deneme Elektrik ${kod}`);
  await e.getByLabel("Kod").fill(`${on}${"STUVWXYZ"[bilgi.retry]}`);
  await e.getByRole("combobox", { name: "Ek-III grubu" }).click();
  await e.getByRole("option", { name: /Diğer \(Ek-III dışı\)/ }).click();
  await expect(e.getByRole("combobox", { name: "Branş" })).toContainText("Elektrik");
  await e.getByLabel("Periyot (ay)").fill("12");
  await e.getByRole("button", { name: "Kaydet" }).click();
  await expect(page.getByRole("heading", { level: 1, name: `Deneme Elektrik ${kod}` })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("Elektrik yönetici onaylar")).toBeVisible();
  await page.goto("/ekipman-turleri?brans=e");
  await hazir(page);
  await expect(page.getByRole("link", { name: `Deneme Elektrik ${kod}` }).first()).toBeAttached();
  await expect(page.getByRole("link", { name: `Deneme Vinç ${kod}` })).toHaveCount(0);

  /* denetçi: görür, ekleyemez */
  await context.clearCookies();
  await girisli(page, "denetci");
  await page.goto("/ekipman-turleri");
  await hazir(page);
  await expect(page.getByRole("heading", { level: 1, name: "Ekipman türleri" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Tür ekle" })).toHaveCount(0);
});
