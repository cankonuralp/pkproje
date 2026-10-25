/* NEREDEN GELDİ: 2026-10-25 belge formatları — reisim: "ama sadece zimmet ve bilgilendirme formu değil herhangi bir form ekleme mekaniği bu şekilde
   çalışmalı aynı araca bağlamalıyız zaten araç yapılı sadece bağlama işi yapılacak". Rapor şablonunun aracı (basılı PDF → şablon → kâğıtta düzenle
   → belge o formattan) programın ürettiği belgelere bağlandı. Gerçek tarayıcıda, YZ firmasında (ayrı firma — öteki testlerin zimmet formuna
   karışmaz): Firma ayarları › Belge formatları → zimmet teslim formu satırında "PDF'ten kur" (test içinde pdf-lib ile üretilen UYDURMA vektör form;
   tarayıcıda kendi içeriğinden okunur) → Belge kurucu açılır, kâğıtta formun yazısı · kâğıtta bir hücre belgeden gelen bilgiye bağlanır (kayıt
   hücresinin seçenekleri belgenin katalogundan) → Taslağı kaydet → Belge önizlemesi formun ızgarası → Yayınla → listede "Firmanın formatı ·
   Sürüm n" → Temel formata dön → "Temel format". Telefonda kurucu yok: Boş başla → yalnız "Bu ekran masaüstü için uygundur." ve dönüş. */
import { expect, test, type Page } from "@playwright/test";
import { PDFDocument, StandardFonts, rgb, type RGB } from "pdf-lib";
import { BELGE_KATALOGU } from "../src/belge/katalog";
import { E2E_KAPI, E2E_PAROLA, E2E_YZ } from "./hesaplar";
import { hazir } from "./yardimci";

const Y = `http://${E2E_YZ.firma.kisaAd}.localhost:${E2E_KAPI}`;
const AD = BELGE_KATALOGU.zimmet.ad;
const KURUCU = /\/firma-ayarlari\/belgeler\/[0-9a-f-]{36}\/kurucu$/;

async function giris(page: Page) {
  await page.goto(`${Y}/giris`);
  await hazir(page);
  await page.getByLabel("E-posta").fill(E2E_YZ.yonetici.eposta);
  await page.getByLabel("Parola", { exact: true }).fill(E2E_PAROLA);
  await page.getByRole("button", { name: "Giriş yap" }).click();
  await expect(page.locator("header")).toContainText(E2E_YZ.yonetici.ad);
}

/* UYDURMA vektör zimmet formu (gerçek firmanın formu değil, yalnız ASCII): başlık tablo dışında; "1. FIRMA BILGILERI" şeridi iki sütunu kaplayan
   zeminli hücre, etiket + boş hücre satırları; No | Malzeme | Adet başlıklı iki satırlık liste; teslim eden / teslim alan imza satırı. Çizgiler yol. */
type FormHucresi = { r: number; c: number; cs?: number; m?: string; k?: boolean; orta?: boolean; zemin?: RGB };
async function uydurmaForm(): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  const EN = 595.28, BOY = 841.89;
  const sayfa = pdf.addPage([EN, BOY]);
  const duz = await pdf.embedFont(StandardFonts.Helvetica), kalin = await pdf.embedFont(StandardFonts.HelveticaBold);
  const siyah = rgb(0, 0, 0);
  /* koordinatlar sol üstten (y aşağı) — pdf-lib'in alt kökenine burada çevrilir */
  const yaz = (s: string, x: number, taban: number, k = false, boy = 9) => sayfa.drawText(s, { x, y: BOY - taban, size: boy, font: k ? kalin : duz, color: siyah });
  const cizgi = (x1: number, y1: number, x2: number, y2: number) => sayfa.drawLine({ start: { x: x1, y: BOY - y1 }, end: { x: x2, y: BOY - y2 }, thickness: 0.75, color: siyah });
  const tablo = (x: number, y: number, sutun: number[], satir: number[], hucreler: FormHucresi[]) => {
    const xs = [x], ys = [y];
    for (const w of sutun) xs.push(xs[xs.length - 1] + w);
    for (const h of satir) ys.push(ys[ys.length - 1] + h);
    const sag = (h: FormHucresi) => xs[h.c + (h.cs ?? 1)];
    for (const h of hucreler) if (h.zemin) sayfa.drawRectangle({ x: xs[h.c], y: BOY - ys[h.r + 1], width: sag(h) - xs[h.c], height: ys[h.r + 1] - ys[h.r], color: h.zemin });
    for (const yy of ys) cizgi(xs[0], yy, xs[xs.length - 1], yy);
    /* dikey çizgi: satırda birleşik hücrenin içinden geçmeyen her sütun sınırı */
    satir.forEach((_, r) => {
      for (let c = 0; c <= sutun.length; c++) {
        if (hucreler.some((h) => h.r === r && h.c < c && c < h.c + (h.cs ?? 1))) continue;
        cizgi(xs[c], ys[r], xs[c], ys[r + 1]);
      }
    });
    for (const h of hucreler) {
      if (!h.m) continue;
      const w = (h.k ? kalin : duz).widthOfTextAtSize(h.m, 9);
      yaz(h.m, h.orta ? (xs[h.c] + sag(h) - w) / 2 : xs[h.c] + 3, (ys[h.r] + ys[h.r + 1]) / 2 + 3, h.k);
    }
  };
  const baslik = "ZIMMET TESLIM FORMU";
  yaz(baslik, (EN - kalin.widthOfTextAtSize(baslik, 14)) / 2, 60, true, 14);
  tablo(40, 90, [150, 365], [18, 18, 18], [
    { r: 0, c: 0, cs: 2, m: "1. FIRMA BILGILERI", k: true, orta: true, zemin: rgb(0.949, 0.863, 0.859) },
    { r: 1, c: 0, m: "Unvan", k: true }, { r: 1, c: 1 },
    { r: 2, c: 0, m: "Teslim tarihi", k: true }, { r: 2, c: 1 },
  ]);
  tablo(40, 162, [40, 375, 100], [18, 18, 18], [
    { r: 0, c: 0, m: "No", k: true, orta: true }, { r: 0, c: 1, m: "Malzeme", k: true }, { r: 0, c: 2, m: "Adet", k: true, orta: true },
    { r: 1, c: 0, m: "1", orta: true }, { r: 1, c: 1 }, { r: 1, c: 2 },
    { r: 2, c: 0, m: "2", orta: true }, { r: 2, c: 1 }, { r: 2, c: 2 },
  ]);
  tablo(40, 234, [257.5, 257.5], [18, 40], [
    { r: 0, c: 0, m: "Teslim eden", k: true, orta: true }, { r: 0, c: 1, m: "Teslim alan", k: true, orta: true }, { r: 1, c: 0 }, { r: 1, c: 1 },
  ]);
  return Buffer.from(await pdf.save());
}

test("belge formatı: PDF'ten kurulur, kâğıtta belgenin bilgisine bağlanır, yayınlanır, temel formata dönülür", async ({ page }, bilgi) => {
  test.skip(bilgi.project.name === "telefon", "belge kurucu masaüstü / tablet işi (telefonda yalnız kapı yazısı — aşağıdaki test)");
  test.setTimeout(180_000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  const form = await uydurmaForm();
  const BELGE_NO = BELGE_KATALOGU.zimmet.alanlar.find((x) => x.anahtar === "belge_no")?.ad ?? "";
  expect(BELGE_NO).not.toBe("");
  await giris(page);

  /* Firma ayarları › Belge formatları */
  await page.goto(`${Y}/firma-ayarlari`);
  await hazir(page);
  await page.getByRole("link", { name: /^Belge formatları/ }).click();
  await expect(page).toHaveURL(/\/firma-ayarlari\/belgeler$/, { timeout: 30_000 });
  await hazir(page);
  await expect(page.getByRole("heading", { name: "Belge formatları", level: 1 })).toBeVisible();
  const satir = page.getByRole("row").filter({ hasText: AD });
  /* yeniden denemede önceki denemenin yayını kaldırılır (başlangıç temel format) */
  const temel = page.getByRole("button", { name: `${AD} · Temel formata dön` });
  if (await temel.isVisible()) {
    await temel.click();
    await page.getByRole("dialog", { name: `${AD} · temel formata dön` }).getByRole("button", { name: "Temel formata dön" }).click();
  }
  await expect(satir).toContainText("Temel format");
  await expect(satir).not.toContainText("Firmanın formatı");
  const taslakVar = (await satir.getByText(/Taslak var/).count()) > 0;

  /* PDF'ten kur: dosya seçilir → tarayıcıda okunur → şablon taslak olarak kurulur → Belge kurucu */
  const [secici] = await Promise.all([page.waitForEvent("filechooser"), page.getByRole("button", { name: `${AD} · PDF'ten kur` }).click()]);
  await secici.setFiles({ name: "zimmet-formu.pdf", mimeType: "application/pdf", buffer: form });
  if (taslakVar) await page.getByRole("dialog", { name: `${AD} · PDF'ten kur` }).getByRole("button", { name: "Kur", exact: true }).click();
  await expect(page).toHaveURL(KURUCU, { timeout: 60_000 });
  await hazir(page);
  await expect(page.getByRole("heading", { name: `Belge formatı · ${AD}`, level: 1 })).toBeVisible();
  const kagit = page.getByRole("article", { name: "Belge formatı · düzenlenebilir belge" });
  await expect(kagit).toHaveClass(/rb-serbest/);
  await expect(kagit.getByRole("cell", { name: "1. FIRMA BILGILERI", exact: true })).toBeVisible();
  await expect(kagit.getByRole("cell", { name: "Malzeme", exact: true })).toBeVisible();

  /* kâğıtta: "Unvan"ın yanındaki hücre belgenin bilgisine bağlanır — seçenekler belgenin katalogundan */
  const deger = kagit.getByRole("row").filter({ has: page.getByRole("cell", { name: "Unvan", exact: true }) }).getByRole("cell").nth(1);
  await deger.click();
  const secim = page.getByRole("group", { name: / · seçili hücreler$/ });
  await expect(secim).toBeVisible();
  await secim.getByRole("radio", { name: "Kayıttan gelir" }).click();
  await secim.getByRole("combobox", { name: "Belgeden gelen bilgi" }).click();
  await page.getByRole("option", { name: BELGE_NO, exact: true }).click();
  await expect(deger).toContainText(BELGE_NO);
  await expect(page.getByText("Kaydedilmedi")).toBeVisible();
  await page.getByRole("button", { name: "Taslağı kaydet" }).click();
  await expect(page.getByText("Taslak kaydedildi.").first()).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("Kaydedilmedi")).toHaveCount(0);
  await expect(deger).toContainText(BELGE_NO);

  /* belge önizlemesi: formun ızgarası, belgenin çizicisiyle */
  await page.getByRole("button", { name: "Belge önizlemesi" }).click();
  const onizleme = page.getByRole("region", { name: "Belge önizlemesi" });
  await expect(onizleme).toBeVisible();
  await expect(onizleme).toContainText("1. FIRMA BILGILERI");
  await expect(onizleme).toContainText("Malzeme");

  /* yayınla → listeye dönülür: firmanın formatı */
  await page.getByRole("button", { name: "Yayınla", exact: true }).click();
  const yayin = page.getByRole("dialog", { name: "Belge formatını yayınla" });
  await yayin.getByLabel("Sürüm notu").fill("Uydurma zimmet formu");
  await yayin.getByRole("button", { name: "Yayınla", exact: true }).click();
  await expect(page).toHaveURL(/\/firma-ayarlari\/belgeler$/, { timeout: 30_000 });
  await hazir(page);
  await expect(satir).toContainText(/Firmanın formatı · Sürüm \d+/);
  await expect(satir).not.toContainText("Taslak var");

  /* temel formata dön */
  await page.getByRole("button", { name: `${AD} · Temel formata dön` }).click();
  await page.getByRole("dialog", { name: `${AD} · temel formata dön` }).getByRole("button", { name: "Temel formata dön" }).click();
  await expect(page.getByText(`${AD} temel formata döndü.`).first()).toBeVisible({ timeout: 30_000 });
  await expect(satir).toContainText("Temel format");
  await expect(satir).not.toContainText("Firmanın formatı");
});

test("belge formatı telefonda: kurucu açılmaz, yalnız kapı yazısı ve dönüş", async ({ page }, bilgi) => {
  test.skip(bilgi.project.name !== "telefon", "telefon genişliği");
  test.setTimeout(120_000);
  await giris(page);
  await page.goto(`${Y}/firma-ayarlari/belgeler`);
  await hazir(page);
  await page.getByRole("button", { name: `${AD} · Boş başla` }).click();
  await page.getByRole("dialog", { name: `${AD} · boş başla` }).getByRole("button", { name: "Başla", exact: true }).click();
  await expect(page).toHaveURL(KURUCU, { timeout: 30_000 });
  await hazir(page);
  await expect(page.getByText("Bu ekran masaüstü için uygundur.")).toBeVisible();
  await expect(page.getByRole("article", { name: "Belge formatı · düzenlenebilir belge" })).toBeHidden();
  await page.getByRole("link", { name: "Belge formatlarına dön" }).click();
  await expect(page).toHaveURL(/\/firma-ayarlari\/belgeler$/, { timeout: 30_000 });
});
