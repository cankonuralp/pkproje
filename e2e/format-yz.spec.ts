/* NEREDEN GELDİ: 497 "Yapay zekâya anlat" — hata listesi 29 + 46 maketi (https://claude.ai/artifact/TgA7oTqRojdEe7qAfjqAfJ) onaylandı, karar K6:
   "öneri kâğıtta kesik çizgiyle görünür; Ekle / Uygula demeden yazılmaz". Gerçek tarayıcıda, yapay zekâsı açık uydurma firmada (yerel Anthropic
   taklidi — gerçek hizmete istek gitmez; istekte kişi / müşteri bilgisi olursa taklit reddeder): Format kurucu › Gelişmiş seçenekler → isteği yaz
   → "Öner" → "ekle" önerisi kâğıtta yerinde, kesik çizgiyle (henüz bölüm değil) → "Ekle" taslağa ekler (Kaydedilmedi) · "değiştir" önerisi
   kutuda → "Uygula" · örnekten yeni öneri → "Vazgeç" atar · 498 "Belgeden başlat…" (uydurma PDF) → belgeden çıkan bölüm öneri → "Ekle".
   Yapay zekâsı kapalı firmada kutu nedeni söyler: e2e/rapor-format.spec.ts.
   Telefonda kurucu yok (yalnız önizleme). */
import { mkdirSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { E2E_KAPI, E2E_PAROLA, E2E_YZ } from "./hesaplar";
import { hazir } from "./yardimci";

const Y = `http://${E2E_YZ.firma.kisaAd}.localhost:${E2E_KAPI}`;
async function goz(page: Page, ad: string, proje: string) {
  mkdirSync("e2e-goz", { recursive: true });
  await page.screenshot({ path: `e2e-goz/${proje}-${ad}.png`, fullPage: true });
}

test("yapay zekâya anlat: öneri kâğıtta kesik çizgiyle; Ekle ve Uygula taslağa, Vazgeç atar", async ({ page }, bilgi) => {
  test.skip(bilgi.project.name === "telefon", "format kurucu masaüstü / tablet işi (telefonda yalnız önizleme)");
  test.setTimeout(180_000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  const kod = `Z${{ masaustu: "M", tablet: "T" }[bilgi.project.name] ?? "X"}${"ABCDEFGH"[bilgi.retry]}`;
  await page.goto(`${Y}/giris`);
  await hazir(page);
  await page.getByLabel("E-posta").fill(E2E_YZ.yonetici.eposta);
  await page.getByLabel("Parola", { exact: true }).fill(E2E_PAROLA);
  await page.getByRole("button", { name: "Giriş yap" }).click();
  await expect(page.locator("header")).toContainText(E2E_YZ.yonetici.ad);
  /* yeni tür → hazır format yayında → ZPKR02'den taslak → Format kurucu */
  await page.goto(`${Y}/ekipman-turleri?brans=e`);
  await hazir(page);
  await page.getByRole("button", { name: "Tür ekle" }).click();
  const p = page.getByRole("dialog", { name: "Tür ekle" });
  await p.getByLabel("Tür adı").fill(`Deneme Zincirli ${kod}`);
  await p.getByLabel("Kod").fill(kod);
  await p.getByRole("combobox", { name: "Ek-III grubu" }).click();
  await p.getByRole("option", { name: /Elektrik tesisatları/ }).click();
  await p.getByLabel("Periyot (ay)").fill("12");
  await p.getByRole("button", { name: "Kaydet" }).click();
  await expect(page).toHaveURL(/\/ekipman-turleri\/[0-9a-f-]{36}$/, { timeout: 30_000 });
  await hazir(page);
  await page.getByRole("button", { name: "Şablondan başlat" }).click();
  const s = page.getByRole("dialog", { name: "Şablondan başlat" });
  await s.getByRole("combobox", { name: "Başlangıç" }).click();
  await s.getByRole("option", { name: /Elektrik iç tesisatı \(ZPKR02/ }).click();
  await s.getByRole("button", { name: "Başlat" }).click();
  await expect(page).toHaveURL(/\/sablon\/[0-9a-f-]{36}\/kurucu$/, { timeout: 30_000 });
  const kagit = page.getByRole("article", { name: "Rapor formatı · düzenlenebilir belge" });
  await expect(kagit).toBeVisible();
  const arac = page.getByRole("toolbar", { name: "Taslak araçları" });
  await arac.getByRole("button", { name: "Gelişmiş seçenekler" }).click();

  /* istek → öneri kâğıtta kesik çizgiyle (henüz bölüm değil) */
  const yz = page.getByRole("region", { name: "Yapay zekâya anlat" });
  await yz.getByRole("textbox", { name: "Yapay zekâya anlatın" }).fill("Zincir uzaması için ölçüm tablosu ekle, sınır %3");
  await yz.getByRole("button", { name: "Öner" }).click();
  const oneri = kagit.getByRole("region", { name: "Yapay zekâ önerisi: Zincir uzaması" });
  await expect(oneri).toBeVisible({ timeout: 30_000 });
  await expect(yz.getByRole("status")).toContainText("kâğıtta kesik çizgiyle");
  await expect(oneri.getByText("= ([Ölçülen boy] − [İlk boy]) / [İlk boy] × 100")).toBeVisible();
  const bolum = kagit.getByRole("region", { name: /^\d+ Zincir uzaması$/ });
  await expect(bolum).toHaveCount(0);
  await expect(page.getByText("Kaydedilmedi")).toHaveCount(0);
  await oneri.scrollIntoViewIfNeeded();
  await goz(page, "kurucu-yz-oneri", bilgi.project.name);
  await oneri.getByRole("button", { name: "Ekle", exact: true }).click();
  await expect(bolum).toBeVisible();
  await expect(oneri).toHaveCount(0);
  await expect(page.getByText("Kaydedilmedi")).toBeVisible();
  await expect(bolum.getByText("= ([Ölçülen boy] − [İlk boy]) / [İlk boy] × 100").first()).toBeVisible();

  /* değiştir önerisi kutuda → Uygula */
  const degisiklik = yz.getByRole("group", { name: /^Değişiklik önerisi: / });
  await expect(degisiklik).toBeVisible();
  await degisiklik.getByRole("button", { name: "Uygula" }).click();
  await expect(degisiklik).toHaveCount(0);
  await expect(page.getByText(/değişti \(taslak\)/).first()).toBeVisible();

  /* örnekten yeni öneri → Vazgeç atar (taslak değişmez) */
  const say = await kagit.locator("section.rb-bolum[id^='kb-']").count();
  await yz.getByRole("button", { name: "Lastik ve tekerlek kontrol maddeleri ekle" }).click();
  const ikinci = kagit.getByRole("region", { name: "Yapay zekâ önerisi: Zincir uzaması" });
  await expect(ikinci).toBeVisible({ timeout: 30_000 });
  await ikinci.getByRole("button", { name: "Vazgeç" }).click();
  await expect(ikinci).toHaveCount(0);
  await expect(kagit.locator("section.rb-bolum[id^='kb-']")).toHaveCount(say);
  /* taslak kaydedilir: eklenen bölüm sunucuda */
  await page.getByRole("button", { name: "Taslağı kaydet" }).click();
  await expect(page.getByText("Taslak kaydedildi.").first()).toBeVisible({ timeout: 30_000 });
  await expect(kagit.getByRole("region", { name: /^\d+ Zincir uzaması$/ })).toBeVisible();

  /* 498 belgeden başlat: firmanın PDF formatı (uydurma) → belgeden çıkan bölüm kâğıtta öneri → Ekle */
  await yz.getByLabel("Format belgesi (PDF, Word, fotoğraf)").setInputFiles({ name: "format.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4 %%EOF") });
  const belgeden = kagit.getByRole("region", { name: "Yapay zekâ önerisi: Mast ve kaldırma sistemi" });
  await expect(belgeden).toBeVisible({ timeout: 30_000 });
  await expect(yz.getByRole("status")).toContainText("Belgeden 1 bölüm çıkarıldı");
  await expect(belgeden.getByText("Mast kanallarında çatlak yok")).toBeVisible();
  await belgeden.getByRole("button", { name: "Ekle", exact: true }).click();
  await expect(kagit.getByRole("region", { name: /^\d+ Mast ve kaldırma sistemi$/ })).toBeVisible();
  await expect(page.getByText("Kaydedilmedi")).toBeVisible();
});
