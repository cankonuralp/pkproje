/* NEREDEN GELDİ: K2 Dökümanlar (2026-10-04) — maket standartlar.html (M7). Gerçek tarayıcıda, üç genişlikte: standart yükle (PDF zorunlu,
   numara büyük harfe) → standart sayfası "Güncel" → yeni sürüm yükle → eskisi "Önceki" · muayene kriterleri belgesi açılır · diğer döküman
   yükle · denetçi görür, yükleyemez. Her proje kendi uydurma standart numarasını açar. 437: hazır Bakanlık standardı Yükle → Görüntüle. */
import { expect, test } from "@playwright/test";
import { girisli, hazir } from "./yardimci";

const PDF = { name: "standart.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n") };

test("dökümanlar: standart ve yeni sürümü, kriter belgesi, diğer döküman; denetçi yalnız görür", async ({ page, context }, bilgi) => {
  test.setTimeout(180_000);   // ilk koşuda sayfalar soğuk derlenir (434: parçalı koşuda bu sunucuda ilk kez — 1,5 dk sürdü)
  const no = `TS EN ${100 + ["masaustu", "tablet", "telefon"].indexOf(bilgi.project.name) * 10 + bilgi.retry}`;
  await girisli(page, "yonetici");
  await page.goto("/dokumanlar");
  await hazir(page);
  await page.getByRole("button", { name: "Standart yükle" }).click();
  const p = page.getByRole("dialog", { name: "Standart yükle" });
  await p.getByLabel("Standart no").fill(no.toLowerCase());
  await p.getByLabel("Sürüm").fill("2016");
  await p.getByLabel("Konu").fill("Deneme konu");
  await p.getByRole("button", { name: "Yükle" }).click();
  await expect(p.getByText("PDF dosyası eklenmeli.")).toBeVisible();
  await p.getByLabel("Dosya (PDF)").setInputFiles(PDF);
  await p.getByRole("button", { name: "Yükle" }).click();
  await expect(page).toHaveURL(/\/dokumanlar\/standart\/[0-9a-f-]{36}$/, { timeout: 30_000 });
  await expect(page.getByRole("heading", { level: 1, name: `${no}:2016` })).toBeVisible();

  await hazir(page);
  await page.getByRole("button", { name: "Yeni sürüm yükle" }).click();
  const y = page.getByRole("dialog", { name: `Yeni sürüm yükle · ${no}` });
  await y.getByLabel("Sürüm").fill("2020");
  await y.getByLabel("Dosya (PDF)").setInputFiles(PDF);
  await y.getByRole("button", { name: "Yeni sürümü yükle" }).click();
  await expect(page.getByRole("heading", { level: 1, name: `${no}:2020` })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("link", { name: `${no}:2016` })).toBeVisible();

  /* 437: Bakanlık formatlarının standartları hazır — kütüphanede yoksa "Yükle" (numara, konu dolu) → yüklenince listede "Görüntüle" (PDF) */
  const hazirNo = [["TS EN 50522", "TS EN 62423", "TS 622"], ["TS EN 61008-1", "TS EN 61009-1", "TS EN 62561"], ["TS EN 12464-1", "TS IEC 61439", "TS EN 60079-14"]]
    [Math.max(0, ["masaustu", "tablet", "telefon"].indexOf(bilgi.project.name))][bilgi.retry % 3];
  /* 440: Mekanik / Elektrik sekmeleri — yukarıda yüklenen (mekanik sekmede yüklendi) Elektrik'te yok; Bakanlık standartları Elektrik'te */
  await page.goto("/dokumanlar?brans=e");
  await hazir(page);
  await expect(page.getByRole("link", { name: /^Elektrik \(\d+\)$/ })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("link", { name: no, exact: true })).toHaveCount(0);
  await page.getByRole("searchbox", { name: "Standartlarda ara" }).fill(hazirNo);
  await expect(page.getByText("Yüklenmedi").first()).toBeVisible();
  await page.getByRole("button", { name: `${hazirNo} · Yükle` }).click();
  const h = page.getByRole("dialog", { name: `Standart yükle · ${hazirNo}` });
  await expect(h.getByLabel("Standart no")).toHaveValue(hazirNo);
  await expect(h.getByLabel("Konu")).not.toHaveValue("");
  await h.getByLabel("Sürüm").fill("2011");
  await h.getByLabel("Dosya (PDF)").setInputFiles(PDF);
  await h.getByRole("button", { name: "Yükle" }).click();
  const gor = page.getByRole("link", { name: `${hazirNo}:2011 · Görüntüle` });
  await expect(gor).toBeVisible({ timeout: 30_000 });
  await expect(gor).toHaveAttribute("href", /^\/api\/dosya\/[0-9a-f-]{36}$/);
  await expect(page).toHaveURL(/\/dokumanlar\?brans=e$/);
  await expect(page.getByRole("button", { name: `${hazirNo} · Yükle` })).toHaveCount(0);

  await page.goto("/dokumanlar/kriterler");
  await hazir(page);
  await page.getByRole("link", { name: "ZPKK01" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "ZPKK01" })).toBeVisible({ timeout: 30_000 });

  await page.goto("/dokumanlar/diger");
  await hazir(page);
  await page.getByRole("button", { name: "Döküman yükle" }).click();
  const d = page.getByRole("dialog", { name: "Döküman yükle" });
  await d.getByLabel("Döküman adı").fill(`Prosedür ${bilgi.project.name}`);
  await d.getByRole("combobox", { name: "Tür" }).click();
  await d.getByRole("option", { name: "Prosedür" }).click();
  await d.getByLabel("Dosya (PDF)").setInputFiles(PDF);
  await d.getByRole("button", { name: "Yükle" }).click();
  await expect(page.getByText(`Prosedür ${bilgi.project.name}`, { exact: true }).first()).toBeAttached({ timeout: 30_000 });

  await page.goto("/dokumanlar");
  await hazir(page);
  await expect(page.getByRole("link", { name: no, exact: true }).first()).toBeAttached();
  await expect(page.getByRole("button", { name: `${hazirNo} · Yükle` })).toHaveCount(0);

  /* denetçi: görür, yükleyemez */
  await context.clearCookies();
  await girisli(page, "denetci");
  await page.goto("/dokumanlar");
  await hazir(page);
  await expect(page.getByRole("link", { name: no }).first()).toBeAttached();
  await expect(page.getByRole("button", { name: "Standart yükle" })).toHaveCount(0);
});
