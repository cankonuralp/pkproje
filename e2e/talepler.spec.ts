/* NEREDEN GELDİ: K4 Talepler (330) — maket talepler.html, personel.html #/izinler. Gerçek tarayıcıda, üç genişlikte: denetçi masraf formu
   gönderir (tür seçilmeden reddedilir; genel masraf) → listede · izin talebi gönderir (iş günü canlı) → yönetici Personel › İzin talepleri'nde
   onaylar → denetçinin talep penceresinde "Onaylandı" ve formun PDF'i iner (341) · muhasebe masraf formunu Giderler'de görür. */
import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { tatilMi } from "../src/modules/talepler/sema";
import { girisli, hazir } from "./yardimci";

/** bugünden en az n gün sonraki ilk iş günü (hafta sonu ve resmî tatil değil — 417), GG.AA.YYYY */
function haftaIci(n: number): string {
  const d = new Date(Date.now() + n * 864e5);
  while ([0, 6].includes(d.getUTCDay()) || tatilMi(d.toISOString().slice(0, 10))) d.setUTCDate(d.getUTCDate() + 1);
  return `${String(d.getUTCDate()).padStart(2, "0")}.${String(d.getUTCMonth() + 1).padStart(2, "0")}.${d.getUTCFullYear()}`;
}

test("talepler: masraf formu ve izin talebi; yönetici izni onaylar; muhasebe masrafı görür", async ({ page, context }, bilgi) => {
  test.setTimeout(180_000);
  const proje = bilgi.project.name;
  const masraf = `Deneme köprü ${proje}`, izin = `Deneme mazeret ${proje}`;
  const gun = haftaIci(30 + ["masaustu", "tablet", "telefon"].indexOf(proje) * 3);
  await girisli(page, "denetci");
  await page.goto("/talepler");
  await hazir(page);
  await expect(page.getByRole("heading", { level: 1, name: "Talepler" })).toBeVisible();
  await expect(page.getByText("Yıllık izin hakkı")).toBeVisible();

  await page.getByRole("button", { name: "Masraf formu" }).click();
  const m = page.getByRole("dialog", { name: "Masraf formu" });
  await m.getByRole("button", { name: "Gönder" }).click();
  await expect(m.getByText("Tür seçilmeli.")).toBeVisible();
  await m.getByRole("combobox", { name: "Tür" }).click();
  await m.getByRole("option", { name: "Yol" }).click();
  await m.getByLabel("Tutar (KDV dahil)").fill("45,00");
  await m.getByLabel("Açıklama").fill(masraf);
  await m.getByRole("button", { name: "Gönder" }).click();
  await expect(page.getByText(/^G-\d{4}-\d{3} muhasebeye gönderildi: 45,00 TL \(KDV dahil\), genel masraf; onaylanınca ödenir\.$/)).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(masraf).first()).toBeVisible();

  await hazir(page);
  await page.getByRole("button", { name: "İzin talebi" }).click();
  const z = page.getByRole("dialog", { name: "İzin talebi" });
  await z.getByRole("combobox", { name: "İzin türü" }).click();
  await z.getByRole("option", { name: "Mazeret izni" }).click();
  await z.getByLabel("Başlangıç").fill(gun);
  await z.getByLabel("Bitiş").fill(gun);
  await z.getByLabel("Açıklama").fill(izin);
  await expect(z.getByText("1 iş günü")).toBeVisible();
  await z.getByRole("button", { name: "Gönder" }).click();
  const b = page.getByText(/^I-\d{4}-\d{3} gönderildi: 1 iş günü mazeret izni; yöneticinin onayında\.$/);
  await expect(b).toBeVisible({ timeout: 30_000 });
  const no = /^I-\d{4}-\d{3}/.exec((await b.textContent())!)![0];

  await context.clearCookies();
  await girisli(page, "yonetici");
  await page.goto("/personel/izinler");
  await hazir(page);
  await expect(page.getByRole("navigation", { name: "Personel bölümleri" }).getByRole("link", { name: "İzin talepleri" })).toBeVisible();
  await page.getByRole("button", { name: `${no} onayla` }).click();
  await expect(page.getByText(new RegExp(`^${no} onaylandı: Deneme Denetçi, 1 iş günü mazeret izni`))).toBeVisible({ timeout: 30_000 });

  await context.clearCookies();
  await girisli(page, "muhasebe");
  await page.goto("/muhasebe/giderler");
  await hazir(page);
  await expect(page.getByText(masraf).first()).toBeVisible();

  await context.clearCookies();
  await girisli(page, "denetci");
  await page.goto("/talepler");
  await hazir(page);
  await page.getByRole("button", { name: no }).first().click();
  const p = page.getByRole("dialog", { name: `İzin talebi · ${no}` });
  await expect(p.getByText("Onaylandı")).toBeVisible();
  await expect(p.getByText("Deneme Yönetici")).toBeVisible();
  /* 341: talebin formu PDF iner (temel format) */
  const [indirilen] = await Promise.all([page.waitForEvent("download", { timeout: 90_000 }), p.getByRole("link", { name: "PDF" }).click()]);
  expect(indirilen.suggestedFilename()).toBe(`${no}.pdf`);
  expect(readFileSync((await indirilen.path())!).subarray(0, 5).toString("latin1")).toBe("%PDF-");
});
