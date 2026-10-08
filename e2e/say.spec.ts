/* NEREDEN GELDİ: 380 — S.A.Y saha asistanı (maket say.js BB6; reisim 2026-10-03: "her yer de gözükecek … daha yuvarlak", "sayfa değişince vs geçmiş
   silinmez"). Gerçek sunucuda, üç genişlikte, yapay zekâsı açık uydurma firmada (yerel Anthropic taklidi — gerçek hizmete istek gitmez; istekte
   kişi / müşteri bilgisi olursa taklit reddeder): sağ altta yuvarlak düğme → panel (odak soru alanında) → "Beni ne bekliyor?" kuralla → serbest
   soru yapay zekâdan → başka sayfaya geçince panel ve geçmiş kalır, yer ayracı → sayfa yenilenince de → Esc kapatır, odak düğmede → "Sohbeti
   temizle" önce sorar. Yapay zekâsı kapalı firmada düğme yok. Telefonda panel tam ekran; yana taşma yok. */
import { expect, test } from "@playwright/test";
import { E2E_KAPI, E2E_PAROLA, E2E_YZ } from "./hesaplar";
import { girisli, hazir } from "./yardimci";

const Y = `http://${E2E_YZ.firma.kisaAd}.localhost:${E2E_KAPI}`;
const TASMA = () => document.documentElement.scrollWidth <= window.innerWidth;

test("S.A.Y: düğme, hızlı soru, serbest soru, sayfa değişince ve yenileyince geçmiş, Esc, temizle", async ({ page }, bilgi) => {
  test.setTimeout(120_000);
  await page.goto(`${Y}/giris`);
  await hazir(page);
  await page.getByLabel("E-posta").fill(E2E_YZ.denetci.eposta);
  await page.getByLabel("Parola", { exact: true }).fill(E2E_PAROLA);
  await page.getByRole("button", { name: "Giriş yap" }).click();
  await expect(page.locator("header")).toContainText(E2E_YZ.denetci.ad);
  await hazir(page);

  const fab = page.getByRole("button", { name: "S.A.Y — saha asistanı" });
  await expect(fab).toBeVisible({ timeout: 30_000 });
  await fab.click();
  const panel = page.getByRole("dialog", { name: "S.A.Y" });
  await expect(panel).toBeVisible();
  await expect(panel.getByLabel("S.A.Y'a sor")).toBeFocused();
  /* aynı hesap öteki genişliklerde de kullanıldıysa (tek sunucu) önce temizlenir */
  const temizle = panel.getByRole("button", { name: "Sohbeti temizle" });
  if (await temizle.isVisible()) {
    await temizle.click();
    await page.getByRole("dialog", { name: "Sohbeti temizle" }).getByRole("button", { name: "Temizle" }).click();
  }
  await expect(panel.getByText("Merhaba! Sizi bekleyen işleri gösterebilir", { exact: false })).toBeVisible();
  if (bilgi.project.name === "telefon") {
    const k = await panel.boundingBox();
    expect(k && Math.round(k.width)).toBe(page.viewportSize()!.width);
  }

  /* hızlı soru: kuralla, anında */
  await panel.getByRole("button", { name: "Beni ne bekliyor?" }).click();
  const liste = panel.getByRole("list").first();
  await expect(liste).toContainText("Beni ne bekliyor?");
  await expect(liste).toContainText(/Sizi bekleyenler:|Şu an sizi bekleyen iş yok\./);

  /* serbest soru: yapay zekâdan (taklit) */
  await panel.getByLabel("S.A.Y'a sor").fill("Planımı nasıl kabul ederim?");
  await panel.getByLabel("S.A.Y'a sor").press("Enter");
  await expect(liste).toContainText("Deneme cevabı: “Planımı nasıl kabul ederim?” için menüden Planlar'ı açın.", { timeout: 30_000 });
  await expect(liste.getByRole("listitem").filter({ hasText: "Bu bir taklit cevaptır." }).first()).toBeVisible();
  await expect(panel.getByLabel("S.A.Y'a sor")).toHaveValue("");

  /* başka sayfaya geçince panel açık, geçmiş duruyor; yeni yer ayracı */
  if (bilgi.project.name !== "masaustu") await page.keyboard.press("Escape");   // panel menüyü örtebilir: kapat, menüden git, düğmeyle aç
  await page.goto(`${Y}/planlar`);
  await hazir(page);
  /* panel bu cihazda açık bırakıldıysa kendiliğinden açılır (durum gelince): önce ikisinden biri görünsün, sonra gerekirse düğme */
  await expect(panel.or(fab)).toBeVisible({ timeout: 30_000 });
  if (!(await panel.isVisible())) await fab.click();
  await expect(panel).toBeVisible();
  await expect(panel).toContainText("Deneme cevabı:");
  await panel.getByRole("button", { name: "Bu sayfada ne yapılır?" }).click();
  await expect(liste).toContainText("Planlar: size atanan planlar.");
  await expect(liste.getByRole("listitem").filter({ hasText: /^Planlar$/ })).toHaveCount(1);

  /* yenileyince de geçmiş */
  await page.reload();
  await hazir(page);
  await expect(panel.or(fab)).toBeVisible({ timeout: 30_000 });
  if (!(await panel.isVisible())) await fab.click();
  await expect(panel).toContainText("Planlar: size atanan planlar.", { timeout: 30_000 });
  expect(await page.evaluate(TASMA), "yana taşma yok").toBe(true);

  /* Esc kapatır, odak düğmede */
  await panel.getByLabel("S.A.Y'a sor").focus();
  await page.keyboard.press("Escape");
  await expect(panel).toHaveCount(0);
  await expect(fab).toBeFocused();

  /* temizle önce sorar; vazgeçince geçmiş durur, onaylanınca boş */
  await fab.click();
  await panel.getByRole("button", { name: "Sohbeti temizle" }).click();
  const onay = page.getByRole("dialog", { name: "Sohbeti temizle" });
  await onay.getByRole("button", { name: "Vazgeç" }).click();
  await expect(panel).toContainText("Deneme cevabı:");
  await panel.getByRole("button", { name: "Sohbeti temizle" }).click();
  await onay.getByRole("button", { name: "Temizle" }).click();
  await expect(page.getByText("Sohbet temizlendi.").first()).toBeVisible();
  await expect(panel.getByText("Merhaba! Sizi bekleyen işleri gösterebilir", { exact: false })).toBeVisible();
  await expect(panel).not.toContainText("Deneme cevabı:");
});

test("S.A.Y: yapay zekâsı kapalı firmada düğme yok", async ({ page }) => {
  await girisli(page, "denetci");
  await page.goto("/");
  await hazir(page);
  await expect(page.getByRole("heading", { level: 1, name: "Ana sayfa" })).toBeVisible();
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("button", { name: "S.A.Y — saha asistanı" })).toHaveCount(0);
});

/* 382: rapor ekranında S.A.Y raporu okur — "Eksik alanlar neler?" bölüm başına sayar, "Git" alana götürür; "Sonuç ne olmalı?" öneri kartı, "Uygula"
   sonucu forma yazar (kaydedilmemiş değişiklik — Kaydet'le yazılır); kart "Rapora uygulandı" der */
test("S.A.Y rapor ekranında: eksik alanlar + Git, sonuç önerisi + Uygula", async ({ page }, bilgi) => {
  test.setTimeout(120_000);
  const kod = E2E_YZ.ekipman[bilgi.project.name];
  await page.goto(`${Y}/giris`);
  await hazir(page);
  await page.getByLabel("E-posta").fill(E2E_YZ.denetci.eposta);
  await page.getByLabel("Parola", { exact: true }).fill(E2E_PAROLA);
  await page.getByRole("button", { name: "Giriş yap" }).click();
  await expect(page.locator("header")).toContainText(E2E_YZ.denetci.ad);
  await page.goto(`${Y}/raporlar`);
  await hazir(page);
  await page.getByRole("searchbox", { name: "Ekipman kodu" }).fill(kod);
  await page.getByRole("link", { name: /^YZ-/ }).first().click();
  await expect(page).toHaveURL(/\/raporlar\/[0-9a-f-]{36}$/, { timeout: 30_000 });
  await hazir(page);

  const fab = page.getByRole("button", { name: "S.A.Y — saha asistanı" });
  const panel = page.getByRole("dialog", { name: "S.A.Y" });
  await expect(panel.or(fab)).toBeVisible({ timeout: 30_000 });
  if (!(await panel.isVisible())) await fab.click();
  await expect(panel.getByText("Bu raporu okudum · öneri verir, rapora siz uygularsınız")).toBeVisible();
  await expect(panel.getByRole("button", { name: "Beni ne bekliyor?" })).toHaveCount(0);

  await panel.getByRole("button", { name: "Eksik alanlar neler?" }).click();
  const liste = panel.getByRole("list").first();
  await expect(liste).toContainText(/\d+ zorunlu alan boş:/);
  /* yer ayracı "Rapor <rapor no>" (başlıkta ekipman kodu var, rapor no değil — numara biçimi firma kodu + yıl ay + sıra) */
  await expect(liste.getByRole("listitem").filter({ hasText: /^Rapor YZ-[0-9]{4}-[0-9]{3}/ }).first()).toBeVisible();
  const git = liste.getByRole("button", { name: "Git" }).first();
  await git.click();
  if (bilgi.project.name === "telefon") await expect(panel).toHaveCount(0);   // telefonda panel kapanır, alan görünsün
  await expect.poll(() => page.evaluate(() => !!document.activeElement && document.activeElement !== document.body && !document.activeElement.closest("#say-panel"))).toBe(true);
  if (!(await panel.isVisible())) await fab.click();

  await panel.getByRole("button", { name: "Sonuç ne olmalı?" }).click();
  const uygula = panel.getByRole("button", { name: "Uygula" }).last();
  await expect(uygula).toBeVisible();
  await uygula.click();
  await expect(panel.getByText("Rapora uygulandı").last()).toBeVisible();
  await expect(page.getByText("Öneri rapora uygulandı:", { exact: false }).first()).toBeVisible();
  await expect(page.getByLabel("Sonuç ve kanaat")).toHaveText(/Uygun/);

  /* 384: serbest soru açık raporun özetini taşır (taklit "Raporu okudum." der); yer "Rapor <no>" */
  await panel.getByLabel("S.A.Y'a sor").fill("Bu raporda neye dikkat edeyim?");
  await panel.getByLabel("S.A.Y'a sor").press("Enter");
  await expect(liste).toContainText("Raporu okudum.", { timeout: 30_000 });
});
