/* NEREDEN GELDİ: pkproje §9 "2026-10-15 akşam — S.A.Y CLAUDE GİBİ" (reisim: "sayfada gezinme vs ne demek zaten direk database den, backendden herşeyi
   görüpte yapıyor", "bu sayfa açık değil falan demesin", "eğer yaptığı değişikliklerden sonra f5 yapılması gerekiyorsa vs claud bunu haber veriyor")
   — 2. adım a (2026-10-16). Gerçek sunucuda, üç genişlikte, yapay zekâsı açık uydurma firmada (yerel Anthropic taklidi — scripts/e2e-sunucu.ts
   "[islem-plan]" / "[islem-ara]"; gerçek hizmete istek gitmez, istekte YZ firmasının kişi / müşteri bilgisi olursa taklit reddeder):
   1. S.A.Y PLAN AÇAR: planlamacı Planlar listesindeyken "… plan aç" der → S.A.Y işlemin şemasını ister (islemler), seçenekleri okur
      (plan_ac_secenekleri), planı açar (plan_ac) — hepsi SUNUCUDA, sayfa gezilmeden; cevap planın numarasıyla; açık Planlar listesi F5'siz yeni planı
      gösterir (iş veri değiştirdi → sayfa kendiliğinden yenilendi); plan gerçekten açıldı (planın sayfası).
   2. S.A.Y MÜŞTERİ ARAR: Ana sayfadayken (Müşteriler açık değil) müşteriyi sunucu işlemiyle bulur ve söyler.
   3. (2026-10-16, 2. adım b — kalan modüller) S.A.Y SÖZLEŞME HAZIRLAR: Sözleşmeler listesindeyken seçenekleri okur (sozlesme_secenekleri), sözleşmeyi
      hazırlar (sozlesme_hazirla — numara sunucuda); cevap numarayla; açık liste F5'siz yeni sözleşmeyi gösterir.
   Kişi, firma ve yetki oturumdan (yürütücü — kilitler tests/say-islem*.test.ts). */
import { expect, test, type Locator, type Page } from "@playwright/test";
import { E2E_ISLEM, E2E_KAPI, E2E_PAROLA, E2E_YZ } from "./hesaplar";
import { hazir } from "./yardimci";

const Y = `http://${E2E_YZ.firma.kisaAd}.localhost:${E2E_KAPI}`;

async function giris(page: Page) {
  await page.goto(`${Y}/giris`);
  await hazir(page);
  await page.getByLabel("E-posta").fill(E2E_ISLEM.planlama.eposta);
  await page.getByLabel("Parola", { exact: true }).fill(E2E_PAROLA);
  await page.getByRole("button", { name: "Giriş yap" }).click();
  await expect(page.locator("header")).toContainText(E2E_ISLEM.planlama.ad);
  await hazir(page);
}
/** S.A.Y panelini açar (önceki sayfada açık kaldıysa açık gelir) ve bu hesabın sohbetini temizler (genişlikler aynı hesabı kullanır) */
async function panel(page: Page) {
  const p = page.getByRole("dialog", { name: "S.A.Y" });
  if (!(await p.isVisible())) {
    const fab = page.getByRole("button", { name: "S.A.Y — saha asistanı" });
    await expect(fab).toBeVisible({ timeout: 30_000 });
    await fab.click();
  }
  await expect(p).toBeVisible();
  const temizle = p.getByRole("button", { name: "Sohbeti temizle" });
  if (await temizle.isVisible()) {
    await temizle.click();
    await page.getByRole("dialog", { name: "Sohbeti temizle" }).getByRole("button", { name: "Temizle" }).click();
    await expect(p.getByRole("listitem")).toHaveCount(0);
  }
  return p;
}
async function sor(panelAlani: Locator, metin: string) {
  await panelAlani.getByLabel("S.A.Y'a sor").fill(metin);
  await panelAlani.getByRole("button", { name: "Gönder" }).click();
  await expect(panelAlani.getByRole("listitem").filter({ hasText: metin })).toBeVisible();
}

test("S.A.Y plan açar — sunucu işlemleriyle, sayfa gezmeden; açık Planlar listesi F5'siz yeni planı gösterir", async ({ page }) => {
  test.setTimeout(120_000);
  await giris(page);
  await page.goto(`${Y}/planlar`);
  await hazir(page);
  const p = await panel(page);
  await sor(p, `${E2E_ISLEM.tesis} için bugün plan aç [islem-plan]`);
  const cevap = p.getByRole("listitem").filter({ hasText: /Yaptım: plan açıldı — P-\d{4}-\d{3}\./ });
  await expect(cevap).toBeVisible({ timeout: 60_000 });
  const no = /P-\d{4}-\d{3}/.exec(await cevap.innerText())?.[0];
  expect(no).toBeTruthy();
  await expect(p.locator("[data-say-bekleme]")).toHaveCount(0);
  /* D: iş veri değiştirdi, ekranda kaydedilmemiş değişiklik yok → açık liste kendiliğinden yenilendi (sayfa yeniden yüklenmeden) */
  await expect(page.getByRole("link", { name: no!, exact: true })).toBeVisible({ timeout: 30_000 });
  await expect(p).not.toContainText("kaydedilmemiş değişikliğiniz var");
  /* plan gerçekten açıldı: ekip ve tesis modülün kendi sayfasında (telefonda panel tam ekran — önce kapanır) */
  await p.getByLabel("S.A.Y'a sor").focus();
  await page.keyboard.press("Escape");
  await expect(p).toHaveCount(0);
  await page.getByRole("link", { name: no!, exact: true }).click();
  await hazir(page);
  await expect(page.locator("main")).toContainText(E2E_ISLEM.tesis);
  await expect(page.locator("main")).toContainText(E2E_ISLEM.denetci.ad);
});

test("S.A.Y müşteri arar — Müşteriler sayfası açık değilken sunucu işlemiyle bulur", async ({ page }) => {
  test.setTimeout(90_000);
  await giris(page);
  await page.goto(`${Y}/`);
  await hazir(page);
  const p = await panel(page);
  await sor(p, "İşlem Deneme müşterisini bul [islem-ara]");
  await expect(p.getByRole("listitem").filter({ hasText: `Buldum: ${E2E_ISLEM.musteri} (1 tesis).` })).toBeVisible({ timeout: 60_000 });
  await expect(p).not.toContainText("sayfa açık değil");
});

test("S.A.Y sözleşme hazırlar — kalan modülün sunucu işlemleriyle; açık Sözleşmeler listesi F5'siz yeni sözleşmeyi gösterir", async ({ page }) => {
  test.setTimeout(120_000);
  await giris(page);
  await page.goto(`${Y}/sozlesmeler`);
  await hazir(page);
  const p = await panel(page);
  await sor(p, `${E2E_ISLEM.musteri} için ${E2E_ISLEM.tesis} kapsamında 12 aylık sözleşme hazırla [islem-sozlesme]`);
  const cevap = p.getByRole("listitem").filter({ hasText: /Yaptım: sözleşme hazırlandı — IS-\d{4}-\d{3}\./ });
  await expect(cevap).toBeVisible({ timeout: 60_000 });
  const no = /IS-\d{4}-\d{3}/.exec(await cevap.innerText())?.[0];
  expect(no).toBeTruthy();
  /* iş veri değiştirdi → açık Sözleşmeler listesi kendiliğinden yenilendi */
  await expect(page.locator("main").getByText(no!, { exact: true }).first()).toBeVisible({ timeout: 30_000 });
});
