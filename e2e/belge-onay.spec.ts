/* NEREDEN GELDİ: K4 Onaylar › Diğer belgeler (333) — maket muhasebe.html BB5 "Maaş bordrosu gönder", onaylar.html #/diger. Gerçek tarayıcıda,
   üç genişlikte (her proje kendi dönemi): muhasebe pencereden denetçiye bordro PDF'i yükleyip imzaya gönderir → denetçi ana sayfada şeridi görür,
   Diğer belgeler'de PDF'i indirir, imzalı hâlini yükler → "İmzalandı" · muhasebe penceresinde o dönem "İmzalandı". */
import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { girisli, hazir } from "./yardimci";

const AYLAR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
/** bugünden n ay önce, "Eylül 2026" (sunucunun Türkiye takvimiyle aynı; ay başında saat farkı olmasın diye ayın 15'i) */
function oncekiAy(n: number): string {
  const s = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit" }).format(new Date());
  const d = new Date(Date.UTC(Number(s.slice(0, 4)), Number(s.slice(5, 7)) - 1 - n, 15));
  return `${AYLAR[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
const OZGUN = "%PDF-1.4\n1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n"
  + "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << >> >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n";

test("belge onayı: muhasebe bordroyu imzaya gönderir, denetçi Diğer belgeler'de imzalar", async ({ page, context }, bilgi) => {
  test.setTimeout(180_000);
  const donem = oncekiAy(1 + ["masaustu", "tablet", "telefon"].indexOf(bilgi.project.name));
  const ad = `${donem} maaş bordrosu`;

  await girisli(page, "muhasebe");
  await page.goto("/muhasebe");
  await hazir(page);
  await page.getByRole("button", { name: "Maaş bordrosu gönder" }).click();
  const p = page.getByRole("dialog", { name: "Maaş bordrosu gönder" });
  /* önce dönem: pencerenin başlangıç dönemi öteki projenin dönemi olabilir (orada bordro gönderilmiş, dosya seç tuşu yok — 2026-10-06) */
  await expect(p.getByRole("combobox", { name: "Dönem" })).toBeVisible({ timeout: 30_000 });
  await p.getByRole("combobox", { name: "Dönem" }).click();
  await p.getByRole("option", { name: donem, exact: true }).click();
  await expect(p.getByRole("combobox", { name: "Dönem" })).toContainText(donem);
  await expect(p.getByRole("button", { name: "Deneme Denetçi bordro dosyası seç" })).toBeVisible({ timeout: 30_000 });
  /* Formattan oluştur: format yokken şerit */
  await p.getByRole("button", { name: "Formattan oluştur" }).click();
  await expect(p.getByText("Firma ayarlarında bordro formatı yok").first()).toBeVisible();
  await p.getByRole("button", { name: "Elle yükle" }).click();
  const [fc] = await Promise.all([page.waitForEvent("filechooser"), p.getByRole("button", { name: "Deneme Denetçi bordro dosyası seç" }).click()]);
  await fc.setFiles({ name: "bordro.pdf", mimeType: "application/pdf", buffer: Buffer.from(OZGUN, "latin1") });
  await expect(p.getByText("bordro.pdf")).toBeVisible();
  await p.getByRole("button", { name: "İmzaya gönder (1)" }).click();
  await expect(page.getByText(new RegExp(`^1 kişinin ${donem} bordrosu imzaya gönderildi`)).first()).toBeVisible({ timeout: 30_000 });

  await context.clearCookies();
  await girisli(page, "denetci");
  await page.goto("/");
  await hazir(page);
  await expect(page.getByText(/\d+ belge imzanızı bekliyor/).first()).toBeVisible({ timeout: 30_000 });
  await page.getByRole("link", { name: "Diğer belgeler" }).first().click();
  await expect(page).toHaveURL(/\/onaylar\/diger$/, { timeout: 30_000 });
  await hazir(page);
  await expect(page.getByRole("navigation", { name: "Onaylar bölümleri" }).getByRole("link", { name: /^Diğer belgeler/ })).toHaveAttribute("aria-current", "page");
  await page.getByRole("button", { name: `${ad} onayla ve imzala` }).click();
  const w = page.getByRole("dialog", { name: "Onayla ve imzala" });
  const [indirilen] = await Promise.all([page.waitForEvent("download", { timeout: 60_000 }), w.getByRole("link", { name: "PDF'i indir" }).click()]);
  const ham = readFileSync((await indirilen.path())!);
  expect(ham.toString("latin1")).toBe(OZGUN);
  /* yanlış PDF reddedilir, pencere açık kalır */
  await w.getByLabel("İmzalı PDF'i yükle").setInputFiles({ name: "yanlis.pdf", mimeType: "application/pdf", buffer: ham });
  await expect(w.getByText("Yüklenen PDF bu belgenin gönderilen PDF'i değil ya da imza taşımıyor.")).toBeVisible({ timeout: 30_000 });
  const imzali = Buffer.concat([ham, Buffer.from("9 0 obj << /Type /Sig /Filter /Adobe.PPKLite /ByteRange [0 10 20 30] /Contents <00ff> >> endobj\ntrailer << /Root 1 0 R /Prev 0 >>\n%%EOF\n", "latin1")]);
  await w.getByLabel("İmzalı PDF'i yükle").setInputFiles({ name: "imzali.pdf", mimeType: "application/pdf", buffer: imzali });
  await expect(page.getByText(`${ad} onaylandı ve imzalandı.`).first()).toBeVisible({ timeout: 30_000 });
  await expect(w).toBeHidden();
  await expect(page.getByRole("button", { name: `${ad} onayla ve imzala` })).toHaveCount(0);

  await context.clearCookies();
  await girisli(page, "muhasebe");
  await page.goto("/muhasebe/giderler");
  await hazir(page);
  await page.getByRole("button", { name: "Maaş bordrosu gönder" }).click();
  const q = page.getByRole("dialog", { name: "Maaş bordrosu gönder" });
  await q.getByRole("combobox", { name: "Dönem" }).click();
  await q.getByRole("option", { name: donem, exact: true }).click();
  await expect(q.getByText("İmzalandı").first()).toBeVisible({ timeout: 30_000 });
});
