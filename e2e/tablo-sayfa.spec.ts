/* NEREDEN GELDİ: 2026-10-16 — reisim: "herhangi bir tabloda 20 den sonrası sayfalı olacak demiştim örnek atmıştım bu sanırım yapılmamış bunu da düzelt
   herhangi bir liste tablo, ekranda çok fazla veri olunca ekran kasacağı için 20 den fazlası sayfalı olsun diğer sayfalara doğru aksın" (örnek: saha
   raporunda pano sigortaları (linye) tablosu 35+ satır tek sayfadaydı; pkproje §9 2026-10-15 (3)). Gerçek tarayıcıda, üç genişlikte, yapay zekâsı açık
   uydurma firmanın raporunda (S.A.Y testleriyle aynı rapor — hiçbir şey KAYDEDİLMEZ; tablo sayfa yenilenince eski hâline döner):
   tablo boşaltılır → 1. satır yazılır → "Son satırı kopyala" ile 25 satır: 2. sayfa açık (eklenen satırın sayfası), ekranda yalnız 21–25, satır
   numarası genel → 1. sayfa: 20 satır → "Satır ekle" → yeni satırın (26) sayfası açılır → satır silinince 2. sayfada kalınır → 23. satırın zorunlu
   Devre'si boşaltılır, 1. sayfadayken Onaya gönder → eksik: tablonun 2. sayfası açılır, 23. satırın Devre'si kırmızı → 2. sayfanın satırları
   silinince 1. sayfaya dönülür, 20 satırda sayfalayıcı yok → kontrol listesi (Gözle kontrol, 27 madde) 20'şer: 2. sayfada taşan grubun başlığı,
   21. madde "Uygun değil" → 1. sayfadayken Onaya gönder listenin 2. sayfasını açar (2026-10-16 inceleme). Kaynak kilidi tests/sayfalama.test.ts,
   sayfa hesabı tests/sayfa.test.ts. */
import { expect, test, type Locator } from "@playwright/test";
import { E2E_KAPI, E2E_PAROLA, E2E_YZ } from "./hesaplar";
import { bolumleriAc, hazir } from "./yardimci";

const Y = `http://${E2E_YZ.firma.kisaAd}.localhost:${E2E_KAPI}`;

test("saha raporu ölçüm tablosu 20'şer sayfalı: eklenen satırın sayfası açılır, Onaya gönder eksik satırın sayfasını açar, silmede boş sayfa yok", async ({ page }, bilgi) => {
  test.setTimeout(240_000);
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
  await bolumleriAc(page);
  /* S.A.Y paneli açık kaldıysa kapanır (telefonda sayfayı örter) */
  const panel = page.getByRole("dialog", { name: "S.A.Y" });
  await expect(panel.or(page.getByRole("button", { name: "S.A.Y — saha asistanı" }))).toBeVisible({ timeout: 30_000 });
  if (await panel.isVisible()) { await page.keyboard.press("Escape"); await expect(panel).toHaveCount(0); }

  const linye = page.locator("#b-linye");
  const bolge = linye.getByRole("region", { name: "Pano sigortaları (linye) tablosu" });
  const nav = linye.getByRole("navigation", { name: "Pano sigortaları (linye) sayfaları" });
  const hucre = (n: number, sutun: string) => linye.getByRole("textbox", { name: `${n}. satır · ${sutun}`, exact: true });
  const ekrandaNo = linye.getByRole("textbox", { name: /^\d+\. satır · No$/ });
  const sayfaAcik = (n: number) => expect(nav.getByRole("button", { name: `Sayfa ${n}`, exact: true })).toHaveAttribute("aria-current", "page");
  const bas = async (l: Locator) => { await l.scrollIntoViewIfNeeded(); await l.click(); };

  /* tablo boşaltılır (başka testlerin kaydettiği satırlar ekranda silinir; kaydedilmez) */
  for (let n = Number(await bolge.getAttribute("data-satir")); n > 0; n--) {
    await bas(linye.getByRole("button", { name: "1. satırı kaldır", exact: true }));
    await expect(bolge).toHaveAttribute("data-satir", String(n - 1));
  }
  await expect(nav).toHaveCount(0);

  /* 1. satır: zorunlular (No, Devre, Tip, In) */
  await bas(linye.getByRole("button", { name: "Satır ekle" }));
  await hucre(1, "No").fill("F1");
  await hucre(1, "Devre").fill("Aydınlatma");
  await hucre(1, "In (A)").fill("16");
  const tip = linye.getByRole("combobox", { name: "1. satır · Tip", exact: true });
  await tip.evaluate((e) => e.scrollIntoView({ block: "center", inline: "center" }));
  await tip.click();
  await page.getByRole("listbox", { name: /1\. satır · Tip$/ }).getByRole("option", { name: "B", exact: true }).click();
  await expect(tip).toContainText("B");

  /* "Son satırı kopyala" ile 25 satır: 21. satırdan sonrası 2. sayfaya akar — eklenen satırın sayfası açık */
  for (let n = 2; n <= 25; n++) {
    await bas(linye.getByRole("button", { name: "Son satırı kopyala" }));
    await expect(bolge).toHaveAttribute("data-satir", String(n));
  }
  await sayfaAcik(2);
  await expect(ekrandaNo).toHaveCount(5);
  await expect(hucre(21, "No")).toHaveValue("F21");
  await expect(hucre(25, "No")).toHaveValue("F25");
  await expect(hucre(1, "No")).toHaveCount(0);
  await expect(nav).toContainText("21–25 / 25");

  /* 1. sayfa: 20 satır, genel numara 1–20 */
  await bas(nav.getByRole("button", { name: "Sayfa 1", exact: true }));
  await sayfaAcik(1);
  await expect(ekrandaNo).toHaveCount(20);
  await expect(hucre(20, "No")).toHaveValue("F20");
  await expect(hucre(21, "No")).toHaveCount(0);

  /* 1. sayfadayken "Satır ekle": yeni satırın (26) sayfası açılır */
  await bas(linye.getByRole("button", { name: "Satır ekle" }));
  await expect(bolge).toHaveAttribute("data-satir", "26");
  await sayfaAcik(2);
  await expect(hucre(26, "No")).toHaveValue("");
  /* satır silinince sayfa taşmaz: 2. sayfada satır kaldıkça 2. sayfa */
  await bas(linye.getByRole("button", { name: "26. satırı kaldır", exact: true }));
  await expect(bolge).toHaveAttribute("data-satir", "25");
  await sayfaAcik(2);

  /* 23. satırın zorunlu Devre'si boş; 1. sayfadayken Onaya gönder → eksik: tablonun 2. sayfası açılır, alan kırmızı (506) */
  await hucre(23, "Devre").fill("");
  await bas(nav.getByRole("button", { name: "Sayfa 1", exact: true }));
  await sayfaAcik(1);
  await page.getByRole("button", { name: "Onaya gönder" }).first().click();
  await expect(page.locator("[data-uyari]")).toContainText("Zorunlu alanlar doldurulmalıdır", { timeout: 30_000 });
  await expect(page.getByRole("dialog", { name: "Rapor onaya gönderilsin mi?" })).toHaveCount(0);
  await sayfaAcik(2);
  await expect(hucre(23, "Devre")).toHaveAttribute("aria-invalid", "true");

  /* 2. sayfanın bütün satırları silinince boş sayfada kalınmaz: 1. sayfa, 20 satırda sayfalayıcı yok */
  for (let n = 25; n >= 21; n--) await bas(linye.getByRole("button", { name: `${n}. satırı kaldır`, exact: true }));
  await expect(bolge).toHaveAttribute("data-satir", "20");
  await expect(nav).toHaveCount(0);
  await expect(ekrandaNo).toHaveCount(20);
  await expect(hucre(1, "No")).toHaveValue("F1");

  /* 2026-10-16 (inceleme): kontrol listesi de 20'şer — Gözle kontrol 27 madde (ZPKR02): 2. sayfada 21.–27. madde, sayfaya taşan grubun ("KABLO ve
     İLETKENLER") başlığı orada da; "Hepsini işaretle" bütün maddeleri yazar; 21. madde "Uygun değil" (kusur açıklaması zorunlu), 1. sayfadayken
     Onaya gönder → listenin 2. sayfası açılır */
  const gozle = page.locator("#b-gozle");
  const gNav = gozle.getByRole("navigation", { name: "Gözle kontrol sayfaları" });
  const m1 = gozle.getByRole("combobox", { name: "Kablo şebeke tarafı", exact: true });
  const m21 = gozle.getByRole("combobox", { name: "Yangın engeli, uygun kilitleme ve sıcaklık etkisine karşı koruma", exact: true });
  await expect(gNav).toContainText("1–20 / 27");
  await expect(m1).toBeVisible();
  await expect(m21).toHaveCount(0);
  await bas(gozle.getByRole("button", { name: "Hepsini işaretle" }));
  await page.getByRole("menuitem", { name: "Hepsini Uygun yap" }).click();
  await expect(gozle).toContainText("27 / 27 madde");
  await bas(gNav.getByRole("button", { name: "Sayfa 2", exact: true }));
  await expect(gNav.getByRole("button", { name: "Sayfa 2", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(m1).toHaveCount(0);
  await expect(gozle.getByRole("heading", { level: 3, name: /KABLO ve İLETKENLER/ })).toBeVisible();
  await expect(m21).toContainText("Uygun");
  await m21.evaluate((e) => e.scrollIntoView({ block: "center" }));
  await m21.click();
  await page.getByRole("option", { name: "Uygun değil", exact: true }).click();
  await expect(gozle.getByLabel("Kusur açıklaması")).toBeVisible();
  await bas(gNav.getByRole("button", { name: "Sayfa 1", exact: true }));
  await expect(gozle.getByLabel("Kusur açıklaması")).toHaveCount(0);
  await page.getByRole("button", { name: "Onaya gönder" }).first().click();
  await expect(page.getByRole("dialog", { name: "Rapor onaya gönderilsin mi?" })).toHaveCount(0);
  await expect(gNav.getByRole("button", { name: "Sayfa 2", exact: true })).toHaveAttribute("aria-current", "page", { timeout: 30_000 });
  await expect(gozle.getByLabel("Kusur açıklaması")).toBeVisible();
});
