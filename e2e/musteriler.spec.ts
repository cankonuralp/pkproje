/* NEREDEN GELDİ: K2 Müşteriler (2026-10-04) — maket musteriler.html (M2, onaylı 2026-09-26); karar 45 / 46 (tekrar eden vergi no UYARI, "Yine de
   kaydet"), 48 (pasif), 50 (il ve ilçe aramalı listeden). Gerçek tarayıcıda, üç genişlikte: müşteri ekle → sayfası açılır, eksik bilgi uyarısı ·
   tesis ekle (il aranır, ilçe il seçilince açılır) · aynı vergi no ikinci müşteride uyarı → "Yine de kaydet" · 364: kullanılmamış ikinci müşteri
   Sil → listeden kalkar; planlı müşteride Sil yok, Pasife al nedeni söyler · denetçi görür ama ekleyemez / düzenleyemez. Her proje kendi uydurma kayıtlarını açar (çakışmasın). */
import { expect, test } from "@playwright/test";
import { girisli, hazir } from "./yardimci";

test("müşteri ve tesis: ekle, uyarıyla kaydet, kullanılmamışı sil; denetçi yalnız görür", async ({ page, context }, bilgi) => {
  const ek = `${bilgi.project.name} ${bilgi.retry}`;
  const vno = String(1_000_000_000 + Math.floor(Math.random() * 8_999_999_999)).slice(0, 10);
  await girisli(page, "yonetici");
  await page.goto("/musteriler");
  await hazir(page);
  await page.getByRole("button", { name: "Müşteri ekle" }).click();
  const p = page.getByRole("dialog", { name: "Müşteri ekle" });
  await p.getByLabel("Ünvan").fill(`Deneme Ünvan ${ek} A.Ş.`);
  await p.getByLabel("Vergi no").fill(vno);
  await p.getByRole("button", { name: "Kaydet" }).click();
  await expect(page).toHaveURL(/\/musteriler\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("heading", { level: 1, name: `Deneme Ünvan ${ek} A.Ş.` })).toBeVisible();
  await expect(page.getByText("Eksik bilgi: e-posta.")).toBeVisible();
  const musteriAdres = page.url();

  /* tesis: il aramalı listeden, ilçe il seçilmeden kapalı */
  await hazir(page);
  await page.getByRole("button", { name: "Tesis ekle" }).click();
  const t = page.getByRole("dialog", { name: "Tesis ekle" });
  await expect(t.getByLabel("İlçe")).toHaveValue("Önce il seçin");
  await t.getByLabel("Tesis adı").fill("Merkez Fabrika");
  await t.getByRole("combobox", { name: "İl" }).click();
  await t.getByRole("searchbox", { name: "İl içinde ara" }).fill("koca");
  await t.getByRole("option", { name: "Kocaeli" }).click();
  await t.getByRole("combobox", { name: "İlçe" }).click();
  await t.getByRole("searchbox", { name: "İlçe içinde ara" }).fill("geb");
  await t.getByRole("option", { name: "Gebze" }).click();
  await t.getByLabel("SGK DETSİS NO").fill("123");
  await t.getByRole("button", { name: "Kaydet" }).click();
  await expect(t.getByText("SGK DETSİS NO 26 hane rakam.")).toBeVisible();
  await t.getByLabel("SGK DETSİS NO").fill("");
  await t.getByRole("button", { name: "Kaydet" }).click();
  await expect(page).toHaveURL(/\/musteriler\/tesis\/[0-9a-f-]{36}$/);
  await expect(page.getByText("Tesis:")).toContainText("Merkez Fabrika");
  await expect(page.getByText(/Eksik bilgi: SGK DETSİS NO · adres\./)).toBeVisible();

  /* aynı vergi no ikinci müşteride: kayıt durur, uyarır; "Yine de kaydet" kaydeder */
  await page.goto("/musteriler");
  await hazir(page);
  await page.getByRole("button", { name: "Müşteri ekle" }).click();
  const p2 = page.getByRole("dialog", { name: "Müşteri ekle" });
  await p2.getByLabel("Ünvan").fill(`İkinci Deneme ${ek} Ltd.`);
  await p2.getByLabel("Vergi no").fill(vno);
  await p2.getByRole("button", { name: "Kaydet" }).click();
  await expect(p2.getByText(/Bu vergi no .* müşterisinde de kayıtlı\. Aynı müşteri olabilir\./)).toBeVisible();
  await p2.getByRole("button", { name: "Yine de kaydet" }).click();
  await expect(page.getByRole("heading", { level: 1, name: `İkinci Deneme ${ek} Ltd.` })).toBeVisible();

  /* 364: hiç kullanılmamış müşteri Sil ile kesin silinir (karar 48 kullanılmış müşteri için) → listede yok */
  await hazir(page);
  await expect(page.getByRole("button", { name: "Pasife al" })).toHaveCount(0);
  await page.getByRole("button", { name: "Sil", exact: true }).click();
  const onay = page.locator("dialog[open]");
  await expect(onay).toContainText(`İkinci Deneme ${ek} Ltd. kalıcı olarak silinir; tesisleri ve hiç girilmemiş müşteri girişleri de silinir. Geri alınamaz.`);
  await onay.getByRole("button", { name: "Sil" }).click();
  await expect(page).toHaveURL(/\/musteriler$/, { timeout: 30_000 });
  await expect(page.getByText(`İkinci Deneme ${ek} Ltd. silindi.`).first()).toBeVisible();
  await hazir(page);
  await expect(page.getByRole("link", { name: `İkinci Deneme ${ek} Ltd.` })).toHaveCount(0);
  await expect(page.getByRole("link", { name: `Deneme Ünvan ${ek} A.Ş.` }).first()).toBeAttached();

  /* kullanılmış müşteri (planı var): Sil yok, Pasife al nedeni söyler (müşteri değişmez — öteki testler kullanır) */
  await page.getByRole("searchbox", { name: "Müşterilerde ara" }).fill("Deneme Plan Sanayi");
  await page.getByRole("link", { name: "Deneme Plan Sanayi A.Ş." }).first().click();
  await expect(page.getByRole("heading", { level: 1, name: "Deneme Plan Sanayi A.Ş." })).toBeVisible({ timeout: 30_000 });
  await hazir(page);
  await expect(page.getByRole("button", { name: "Sil", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Pasife al" }).click();
  const pp = page.locator("dialog[open]");
  await expect(pp).toContainText(/planda.*kullanıldı; silinemez\./);
  await pp.getByRole("button", { name: "Vazgeç" }).click();

  /* 367: hiç girilmemiş ek giriş Sil ile kesin silinir */
  const ekAd = `Ek Kişi ${ek}`;
  await page.goto(musteriAdres);
  await hazir(page);
  await page.getByRole("button", { name: "Ek giriş ekle" }).click();
  const g = page.locator("dialog[open]");
  await g.getByLabel("Ad soyad").fill(ekAd);
  await g.getByLabel("E-posta (kullanıcı adı)").fill(`ek-${bilgi.project.name}-${bilgi.retry}@deneme-musteri.example`);
  await g.getByRole("button", { name: "Girişi aç" }).click();
  await expect(page.getByText(`${ekAd} için ek giriş açıldı.`, { exact: false }).first()).toBeVisible({ timeout: 30_000 });
  await hazir(page);
  await page.getByRole("button", { name: `${ekAd} girişini sil` }).click();
  const og = page.locator("dialog[open]");
  await expect(og).toContainText(`${ekAd} kalıcı olarak silinir; kullanıcı adı yeniden kullanılabilir. Geri alınamaz.`);
  await og.getByRole("button", { name: "Sil" }).click();
  await expect(page.getByText(`${ekAd} silindi.`).first()).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("Ek giriş yok.")).toBeVisible();

  /* denetçi: görür, ekleyemez, düzenleyemez */
  await context.clearCookies();
  await girisli(page, "denetci");
  await page.goto("/musteriler");
  await hazir(page);
  await expect(page.getByRole("heading", { level: 1, name: "Müşteriler" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Müşteri ekle" })).toHaveCount(0);
  await page.goto(musteriAdres);
  await expect(page.getByRole("heading", { level: 1, name: `Deneme Ünvan ${ek} A.Ş.` })).toBeVisible();
  await expect(page.getByRole("button", { name: "Düzenle" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Tesis ekle" })).toHaveCount(0);
});
