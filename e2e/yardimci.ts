/* uçtan uca ortak adımlar: girişi gerçek formdan yapar (çerez sunucunun yazdığı) */
import { expect, type Locator, type Page } from "@playwright/test";
import { E2E_HESAPLAR, E2E_PAROLA } from "./hesaplar";

/** 489: uçtan uca yayın derlemesinde (PROBATA_E2E_YAYIN=1) oturum çerezi yayındaki adıyla — "__Host-" önekli ve Secure (src/server/kimlik/istek.ts);
    geliştirme kipinde öneksiz. Tarayıcı http://<firma>.localhost'u güvenli sayar, Secure çerez orada da yazılır. */
export const YAYIN_DERLEMESI = process.env.PROBATA_E2E_YAYIN === "1";
export const OTURUM_CEREZI = YAYIN_DERLEMESI ? "__Host-probata" : "probata-oturum";

/* 2026-10-08 (402): önceden indirme (396) yalnız e2e/cevrimdisi.spec.ts'te sınanır; öteki testlerde cihaz "az önce indirildi" sayılır — her
   denetçi testinde arka planda onlarca plan / rapor sayfası çizilip geliştirme sunucusu bellek sınırına dayanıyordu (son testler düşüyordu).
   Uygulamanın davranışı değişmez (30 dakika kuralı, src/components/cevrimdisi/Cevrimdisi.tsx). */
const ONINDIRME_YAPILDI = () => {
  try { localStorage.setItem("probata-cevrimdisi-hazir", JSON.stringify({ plan: 0, zaman: new Date().toISOString() })); } catch { /* depo yok */ }
};

export async function girisYap(page: Page, kim: keyof typeof E2E_HESAPLAR = "yonetici", parola = E2E_PAROLA) {
  await page.addInitScript(ONINDIRME_YAPILDI);
  await page.goto("/giris");
  await expect(page.getByRole("button", { name: "Giriş yap" })).toBeEnabled();
  await page.getByLabel("E-posta").fill(E2E_HESAPLAR[kim].eposta);
  await page.getByLabel("Parola", { exact: true }).fill(parola);
  await page.getByRole("button", { name: "Giriş yap" }).click();
}

export async function girisli(page: Page, kim: keyof typeof E2E_HESAPLAR = "yonetici") {
  await girisYap(page, kim);
  await expect(page.locator("header")).toContainText(E2E_HESAPLAR[kim].ad);
}

/** tam sayfa yüklemesinden sonra React bağlanana kadar bekle (bağlanmadan önceki tıklama kaybolur — src/components/hazir/Hazir.tsx) */
export async function hazir(page: Page) {
  /* 422: 30 sn — deneme sunucusu yükteyken başka alt alan adındaki giriş sayfası 15 sn'de bağlanmadı (408 ve 9cf7f54'te S.A.Y; beklenen aynı) */
  await expect(page.locator("html[data-hazir]")).toHaveCount(1, { timeout: 30_000 });
}

/** 463: rapor ekranının bölümleri kapalı açılır — hepsini aç (bu sekmede aynı rapor için hatırlanır: yenileme ve geri gelişte açık kalır) */
export async function bolumleriAc(page: Page) {
  const tus = page.getByRole("button", { name: /^Tümünü (aç|kapat)$/ });
  await expect(tus).toBeVisible({ timeout: 30_000 });
  if ((await tus.textContent())?.includes("aç")) await tus.click();
  await expect(page.getByRole("button", { name: "Tümünü kapat" })).toBeVisible();
}

/** 561 (reisim 2026-10-15: "chati yukarıdan tutup aşağıya doğru küçültmeyi yapamadım"): yan panelin (S.A.Y, S.A.Y Chat) boyu — üst kenardaki
    tutamak ve başlık aşağı sürüklenince kısalır (alt kenar yerinde), kısalmış hâl bayrakla; tutamakta Home tam boya döndürür. Sürükleme gerçek
    fare olaylarıyla (pointerdown → adım adım pointermove → pointerup). */
export async function panelBoyunuDene(page: Page, panel: Locator, tutamakAdi: RegExp, baslik: string) {
  const tam = (await panel.boundingBox())!;
  const surukle = async (x: number, y: number, dy: number) => {
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x, y + dy / 2, { steps: 4 });
    await page.mouse.move(x, y + dy, { steps: 4 });
    await page.mouse.up();
  };
  const tutamak = panel.getByRole("button", { name: tutamakAdi });
  const t = (await tutamak.boundingBox())!;
  await surukle(t.x + t.width / 2, t.y + t.height / 2, 160);
  await expect(panel).toHaveAttribute("data-boy", "");
  const kisa = (await panel.boundingBox())!;
  expect(kisa.height, "tutamaktan kısaldı").toBeLessThan(tam.height - 120);
  expect(Math.abs(kisa.y + kisa.height - (tam.y + tam.height)), "alt kenar yerinde").toBeLessThanOrEqual(2);
  /* başlıktan da (tuşları dışında) */
  const b = (await panel.getByRole("heading", { name: baslik, exact: true }).boundingBox())!;
  await surukle(b.x + b.width / 2, b.y + b.height / 2, 60);
  const dahaKisa = (await panel.boundingBox())!;
  expect(dahaKisa.height, "başlıktan kısaldı").toBeLessThan(kisa.height - 40);
  /* klavye: Home tam boy */
  await tutamak.focus();
  await page.keyboard.press("Home");
  await expect.poll(() => panel.getAttribute("data-boy")).toBeNull();
  expect(Math.abs((await panel.boundingBox())!.height - tam.height), "tam boya döndü").toBeLessThanOrEqual(2);
}
