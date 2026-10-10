/* NEREDEN GELDİ: K4 Talepler (330) — maket talepler.html, personel.html #/izinler. Gerçek tarayıcıda, üç genişlikte: denetçi masraf formu
   gönderir (tür seçilmeden reddedilir; genel masraf) → listede · izin talebi gönderir (iş günü canlı) · denetçinin talep penceresinde
   "Onaylandı" ve formun PDF'i iner (341) · muhasebe masraf formunu Giderler'de görür.
   2026-10-10 (477; reisim, Talepler–Onaylar kararları T1 · T2 · T4 · T5): KARAR ONAYLAR › TALEPLER'DE — yönetici izni düzeltmeye geri gönderir
   (gerekçe) → denetçi Talepler'de şeritten düzeltip yeniden gönderir → yönetici onaylar; muhasebe masraf formunu Onaylar'da onaylar (Onaylar'ı
   açınca Talepler'e gelir), Giderler'de form salt okunur, "Ödendi" orada; Personel › İzin talepleri'nde onay tuşu yok. */
import { readFileSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { tatilMi } from "../src/modules/talepler/sema";
import { girisli, hazir } from "./yardimci";

/** bugünden en az n gün sonraki ilk iş günü (hafta sonu ve resmî tatil değil — 417), GG.AA.YYYY */
function haftaIci(n: number): string {
  const d = new Date(Date.now() + n * 864e5);
  while ([0, 6].includes(d.getUTCDay()) || tatilMi(d.toISOString().slice(0, 10))) d.setUTCDate(d.getUTCDate() + 1);
  return `${String(d.getUTCDate()).padStart(2, "0")}.${String(d.getUTCMonth() + 1).padStart(2, "0")}.${d.getUTCFullYear()}`;
}

/** Onaylar › Talepler'de talebi açar (numara bağlantısı) */
async function talebiAc(page: Page, no: string) {
  await page.goto("/onaylar/talepler");
  await hazir(page);
  await expect(page.getByRole("navigation", { name: "Onaylar bölümleri" }).getByRole("link", { name: /^Talepler \(\d+\)$/ })).toBeVisible();
  await page.getByRole("link", { name: no, exact: true }).click();
  await expect(page.getByRole("heading", { level: 2, name: new RegExp(`· ${no}$`) })).toBeVisible({ timeout: 30_000 });
}

test("talepler: masraf formu ve izin talebi; karar Onaylar'da — düzeltmeye geri gönder, düzelt, onay; muhasebe masrafı onaylar", async ({ page, context }, bilgi) => {
  test.setTimeout(300_000);
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
  const mb = page.getByText(/^G-\d{4}-\d{3} muhasebeye gönderildi: 45,00 TL \(KDV dahil\), genel masraf; onaylanınca ödenir\.$/);
  await expect(mb).toBeVisible({ timeout: 30_000 });
  const mno = /^G-\d{4}-\d{3}/.exec((await mb.textContent())!)![0];
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

  /* yönetici: Personel › İzin talepleri'nde onay tuşu yok (T4) — Onaylar'da aç; Onaylar › Talepler'de düzeltmeye geri gönderir (T2) */
  await context.clearCookies();
  await girisli(page, "yonetici");
  await page.goto("/personel/izinler");
  await hazir(page);
  await expect(page.getByRole("navigation", { name: "Personel bölümleri" }).getByRole("link", { name: "İzin talepleri" })).toBeVisible();
  await expect(page.getByRole("button", { name: `${no} onayla` })).toHaveCount(0);
  await expect(page.getByRole("link", { name: `${no} Onaylar'da aç` })).toBeVisible();
  await talebiAc(page, no);
  await expect(page.getByText("Talep salt okunur")).toBeVisible();
  /* yeni ekran: erişilebilirlik taraması (410 ile aynı kurallar; ciddi / kritik 0) */
  const ax = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).exclude("nextjs-portal").analyze();
  expect(ax.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => `${v.id}: ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`)).toEqual([]);
  await page.getByRole("button", { name: "Düzeltmeye geri gönder" }).click();
  await page.getByLabel("Düzeltme isteği").fill("Kısa");
  await page.getByRole("button", { name: "Geri gönder" }).click();
  await expect(page.getByText("Gerekçe en az 10 karakter.")).toBeVisible();
  await page.getByLabel("Düzeltme isteği").fill("Açıklamaya izin nedenini yazın");
  await page.getByRole("button", { name: "Geri gönder" }).click();
  await expect(page.getByText(`${no} düzeltmeye geri gönderildi; Deneme Denetçi Talepler'inde görür.`)).toBeVisible({ timeout: 30_000 });

  /* denetçi: şeritte gerekçe, düzelt ve yeniden gönder */
  await context.clearCookies();
  await girisli(page, "denetci");
  await page.goto("/talepler");
  await hazir(page);
  await expect(page.getByText(`${no} düzeltmeye geri gönderildi`)).toBeVisible();
  await expect(page.getByText("“Açıklamaya izin nedenini yazın”").first()).toBeVisible();
  await page.getByRole("button", { name: `${no} düzelt ve yeniden gönder` }).click();
  const dz = page.getByRole("dialog", { name: `İzin talebini düzelt · ${no}` });
  await dz.getByLabel("Açıklama").fill(`${izin} · aile ziyareti`);
  await dz.getByRole("button", { name: "Düzelt ve yeniden gönder" }).click();
  await expect(page.getByText(`${no} düzeltildi ve yeniden gönderildi: 1 iş günü mazeret izni; yöneticinin onayında.`)).toBeVisible({ timeout: 30_000 });

  /* yönetici onaylar */
  await context.clearCookies();
  await girisli(page, "yonetici");
  await talebiAc(page, no);
  await expect(page.getByText("Önceki düzeltme isteği: “Açıklamaya izin nedenini yazın”")).toBeVisible();
  await page.getByRole("button", { name: "Onayla" }).click();
  await expect(page.getByText(new RegExp(`^${no} onaylandı: Deneme Denetçi, 1 iş günü mazeret izni`))).toBeVisible({ timeout: 30_000 });

  /* muhasebe: Onaylar'ı açınca Talepler'e gelir; masraf formunu onaylar; Giderler'de form salt okunur, Ödendi orada (T5) */
  await context.clearCookies();
  await girisli(page, "muhasebe");
  await page.goto("/onaylar");
  await expect(page).toHaveURL(/\/onaylar\/talepler$/, { timeout: 30_000 });
  await talebiAc(page, mno);
  await page.getByRole("button", { name: "Onayla" }).click();
  await expect(page.getByText(`${mno} onaylandı; ödenecek: 45,00 TL — ödeme Muhasebe › Giderler'de işaretlenir.`)).toBeVisible({ timeout: 30_000 });
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
  await expect(p.getByText("Açıklamaya izin nedenini yazın")).toBeVisible();
  /* 341: talebin formu PDF iner (temel format) */
  const [indirilen] = await Promise.all([page.waitForEvent("download", { timeout: 90_000 }), p.getByRole("link", { name: "PDF" }).click()]);
  expect(indirilen.suggestedFilename()).toBe(`${no}.pdf`);
  expect(readFileSync((await indirilen.path())!).subarray(0, 5).toString("latin1")).toBe("%PDF-");
});
