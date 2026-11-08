/* NEREDEN GELDİ: 2026-11-07 S.A.Y Chat yeniden — KİŞİSEL SOHBET (sunum claude.ai 2PiEskE9jDqF5kSefutRBC — reisim: "Evet, önerilerle"). Gerçek sunucuda,
   üç genişlikte, yapay zekâsı açık uydurma firmada (yerel Anthropic taklidi — scripts/e2e-sunucu.ts "[islem-chat …]"; gerçek hizmete istek gitmez):
   · düğme her sayfada (plan içinde de); açılınca S.A.Y paneli kapalı (aynı yer); telefonda panel tam ekran, yana taşma yok; boy sürüklenir (561);
   · BAĞLANTISIZ: 3 fotoğraf (altyazılı) + 1 yazı "Cihazda" görünür; bağlantı gelince SIRAYLA gider — sıra ve saat aynı kalır, "Gönderildi";
   · S.A.Y "chatten oku, plana yaz" → chat_oku (sözcükle — bu genişliğin mesajlarından itibaren) → chat_isle: mesajlarda "→ <plan no> · 0 rapor" etiketi;
     (varsayılan okumanın işlenmişleri atlaması: tests/say-chat-mesaj.test.ts); tam sayfa (/planlar/sohbet) aynı sohbeti gösterir;
   · iki asistanın düğmesi birbirinin açık / küçültülmüş panelinin altında kalmaz (2026-10-25). */
import { expect, test, type Locator, type Page } from "@playwright/test";
import { E2E_KAPI, E2E_PAROLA, E2E_YZ } from "./hesaplar";
import { hazir, panelBoyunuDene } from "./yardimci";

const Y = `http://${E2E_YZ.firma.kisaAd}.localhost:${E2E_KAPI}`;
const TASMA = () => document.documentElement.scrollWidth <= window.innerWidth;
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFElEQVR4nGP4z8DAwAAi/v///x8AHu8F+5BApdwAAAAASUVORK5CYII=", "base64");
const foto = (ad: string) => ({ name: ad, mimeType: "image/png", buffer: PNG });
const CHAT = "S.A.Y Chat — kişisel sohbet", SAY = "S.A.Y — saha asistanı";

async function giris(page: Page, h: { eposta: string; ad: string }) {
  await page.goto(`${Y}/giris`);
  await hazir(page);
  await page.getByLabel("E-posta").fill(h.eposta);
  await page.getByLabel("Parola", { exact: true }).fill(E2E_PAROLA);
  await page.getByRole("button", { name: "Giriş yap" }).click();
  await expect(page.locator("header")).toContainText(h.ad);
}
/** YZ planının adresi: planın bir raporundan (kırıntıdaki plan bağlantısı) */
async function planAdresi(page: Page) {
  await page.goto(`${Y}/raporlar`);
  await hazir(page);
  await page.getByRole("link", { name: /^YZ-/ }).first().click();
  await expect(page).toHaveURL(/\/raporlar\/[0-9a-f-]{36}$/, { timeout: 30_000 });
  const adres = await page.getByRole("navigation", { name: "Konum" }).getByRole("link").nth(1).getAttribute("href");
  expect(adres).toMatch(/^\/planlar\/[0-9a-f-]{36}$/);
  return adres!;
}
async function chatAc(page: Page) {
  const fab = page.getByRole("button", { name: CHAT });
  await expect(fab).toBeVisible({ timeout: 30_000 });
  await fab.click();
  const panel = page.getByRole("dialog", { name: "S.A.Y Chat" });
  await expect(panel).toBeVisible();
  return panel;
}
/** S.A.Y panelini açar ve bu hesabın sohbetini temizler */
async function sayAc(page: Page) {
  const p = page.getByRole("dialog", { name: "S.A.Y", exact: true });
  if (!(await p.isVisible())) await page.getByRole("button", { name: SAY }).click({ timeout: 30_000 });
  await expect(p).toBeVisible();
  const temizle = p.getByRole("button", { name: "Sohbeti temizle" });
  if (await temizle.isVisible()) {
    await temizle.click();
    await page.getByRole("dialog", { name: "Sohbeti temizle" }).getByRole("button", { name: "Temizle" }).click();
    await expect(p.getByRole("listitem")).toHaveCount(0);
  }
  return p;
}
async function sor(p: Locator, metin: string) {
  await p.getByLabel("S.A.Y'a sor").fill(metin);
  await p.getByRole("button", { name: "Gönder" }).click();
  await expect(p.getByRole("listitem").filter({ hasText: metin })).toBeVisible();
}
/** paneldeki balonlar (sırayla): yazısı ve saati */
const balonlar = (panel: Locator) => panel.locator("[data-durum]").evaluateAll((l) => l.map((b) => ({
  metin: (b.querySelector("p")?.textContent ?? "").trim(), saat: b.querySelector("time")?.getAttribute("datetime") ?? "", durum: b.getAttribute("data-durum") ?? "" })));

test("S.A.Y Chat: bağlantısız 3 fotoğraf + 1 yazı sırası ve saati korunur; chatten oku → işlendi etiketi", async ({ page, context }, bilgi) => {
  test.setTimeout(180_000);
  const isaret = `kazan${bilgi.project.name}${Date.now() % 100_000}`;
  await giris(page, E2E_YZ.denetci);
  const plan = await planAdresi(page);
  await page.goto(`${Y}${plan}`);
  await hazir(page);
  const panel = await chatAc(page);
  await expect(page.getByRole("dialog", { name: "S.A.Y", exact: true })).toHaveCount(0);
  if (bilgi.project.name === "telefon") expect(Math.round((await panel.boundingBox())!.width)).toBe(page.viewportSize()!.width);
  await panelBoyunuDene(page, panel, /^S\.A\.Y Chat'in boyu/, "S.A.Y Chat");

  /* bağlantısız: 3 fotoğraf (her biri altyazılı) + 1 yazı */
  await context.setOffline(true);
  await panel.getByRole("button", { name: "Fotoğraf ekle" }).click();
  await panel.getByLabel("Galeriden / bilgisayardan seç").setInputFiles([foto("a.png"), foto("b.png"), foto("c.png")]);
  await expect(panel.getByRole("list", { name: "Gönderilecek fotoğraflar" }).getByRole("listitem")).toHaveCount(3, { timeout: 30_000 });
  await panel.getByLabel("Fotoğraf 1 altyazısı").fill(isaret);
  await panel.getByLabel("Fotoğraf 2 altyazısı").fill("ikinci açı");
  await panel.getByLabel("Fotoğraf 3 altyazısı").fill("etiket");
  await panel.getByLabel("Mesaj", { exact: true }).fill("basınç 8 bar");
  await panel.getByRole("button", { name: "Gönder" }).click();
  const benim = async () => {
    const l = await balonlar(panel), i = l.findIndex((x) => x.metin === isaret);
    return i < 0 ? [] : l.slice(i, i + 4);
  };
  await expect.poll(async () => (await benim()).map((x) => `${x.metin}|${x.durum}`)).toEqual(
    [`${isaret}|cihazda`, "ikinci açı|cihazda", "etiket|cihazda", "basınç 8 bar|cihazda"]);
  const saatler = (await benim()).map((x) => x.saat);
  expect(new Set(saatler).size, "aynı anda gönderildi: aynı cihaz saati").toBe(1);
  expect(await page.evaluate(TASMA), "yana taşma yok").toBe(true);

  /* bağlantı gelince sırayla gider; sıra ve saat aynı */
  await context.setOffline(false);
  await expect.poll(async () => (await benim()).map((x) => `${x.metin}|${x.durum}`), { timeout: 60_000 }).toEqual(
    [`${isaret}|gonderildi`, "ikinci açı|gonderildi", "etiket|gonderildi", "basınç 8 bar|gonderildi"]);
  expect((await benim()).map((x) => x.saat)).toEqual(saatler);

  /* S.A.Y: chatten oku → plana işle (Planlar listesinde — plan sayfasının notu tesisin adını taşır, taklit kişisel / müşteri bilgisi sayar) */
  await panel.getByRole("button", { name: "S.A.Y Chat'i kapat" }).click();
  await page.goto(`${Y}/planlar`);
  await hazir(page);
  const say = await sayAc(page);
  const planId = plan.split("/").at(-1)!;
  try {
    await sor(say, `Chatten oku, planına yaz [islem-chat ${planId} ${isaret}]`);
    const cevap = say.getByRole("listitem").filter({ hasText: "Yaptım:" }).last();
    await expect(cevap).toContainText(/4 mesaj P-\d{4}-\d{3} planına işlendi\./, { timeout: 90_000 });
    await expect(cevap).toContainText(/Okunan 4 mesaj, 3 fotoğraf, sıra: F\d{2} F\d{2} F\d{2}/);
    /* varsayılan okumanın işlenmişleri atlaması gerçek veritabanında sınanır (tests/say-chat-mesaj.test.ts — chat_isle) */
  } finally {
    /* hesabın S.A.Y konuşması temiz bırakılır (aynı denetçiyle koşan S.A.Y testleri kendi konuşmasıyla başlar) — test düşse de */
    await sayAc(page).catch(() => undefined);
  }
  await say.getByLabel("S.A.Y'a sor").focus();
  await page.keyboard.press("Escape");

  /* etiket: panelde ve tam sayfada */
  const p2 = await chatAc(page);
  await expect(p2.getByTitle(/^İşlendi: P-\d{4}-\d{3}$/)).toHaveCount(4, { timeout: 30_000 });
  await page.goto(`${Y}/planlar/sohbet`);
  await hazir(page);
  await expect(page.getByRole("heading", { level: 1, name: "S.A.Y Chat" })).toBeVisible();
  await expect(page.getByRole("main").getByText(isaret, { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: CHAT }), "tam sayfada düğme yok").toHaveCount(0);
});

/* 2026-10-25 (reisim: "say chat neden gözükmüyor", "bu sefer de say chat say asistanı kapatıyor reisim küçülünce"): iki asistanın düğmesi de sağ altta;
   birinin paneli açık ya da küçültülmüşken öteki düğme panelin altında kalıyordu (components/pencere/fabKonumu.ts). Düğme görünür, panelle çakışmaz,
   tıklanan nokta düğmenin kendisidir — iki yönde. */
async function ustteDene(page: Page, dugme: Locator, panel: Locator, secici: string) {
  await expect(dugme).toBeVisible();
  await expect.poll(async () => {
    const [a, b] = [await dugme.boundingBox(), await panel.boundingBox()];
    if (!a || !b) return "kutu yok";
    const cakisir = a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
    const ust = await page.evaluate(([x, y, k]) => !!document.elementFromPoint(x as number, y as number)?.closest(k as string), [a.x + a.width / 2, a.y + a.height / 2, secici]);
    return cakisir ? "çakışıyor" : ust ? "tamam" : "örtülü";
  }).toBe("tamam");
}
async function planAc(page: Page) {
  await giris(page, E2E_YZ.denetci);
  const adres = await planAdresi(page);
  await page.goto(`${Y}${adres}`);
  await hazir(page);
}

test("S.A.Y Chat düğmesi S.A.Y asistanın açık / küçültülmüş panelinin altında kalmaz", async ({ page }) => {
  await planAc(page);
  const fab = page.getByRole("button", { name: CHAT });
  await expect(fab).toBeVisible({ timeout: 30_000 });
  await page.getByRole("button", { name: SAY }).click();
  const asistan = page.getByRole("dialog", { name: "S.A.Y", exact: true });
  await expect(asistan).toBeVisible();
  /* telefonda açık panel ekranı kaplar — yalnız küçültülmüş hâli denenir */
  if (page.viewportSize()!.width >= 768) await ustteDene(page, fab, asistan, "[data-saychat-fab]");
  await asistan.getByRole("button", { name: "Küçült" }).click();
  await ustteDene(page, fab, asistan, "[data-saychat-fab]");
});

test("S.A.Y asistan düğmesi S.A.Y Chat'in açık / küçültülmüş panelinin altında kalmaz", async ({ page }) => {
  await planAc(page);
  await page.getByRole("button", { name: CHAT }).click({ timeout: 30_000 });
  const chat = page.getByRole("dialog", { name: "S.A.Y Chat" });
  await expect(chat).toBeVisible();
  const fab = page.getByRole("button", { name: SAY });
  if (page.viewportSize()!.width >= 768) await ustteDene(page, fab, chat, "[data-say-fab]");
  await chat.getByRole("button", { name: "Küçült" }).click();
  await ustteDene(page, fab, chat, "[data-say-fab]");
});
