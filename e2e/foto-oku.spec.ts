/* NEREDEN GELDİ: 351 — saha raporunda fotoğraftan okuma (maket rapor.html Z3 okuyabilir / oneriKart; §8.10 "değer öneri olarak düşer, inspector
   onaylamadan kaydedilmez"). Gerçek sunucuda, üç genişlikte, ayrı uydurma firmada (test sunucusunun yerel Anthropic taklidi — gerçek hizmete istek
   gitmez): ölçüm tablosunun altında "Fotoğraftan oku" → öneri kartı (emin olunmayan satır işaretli) → "Önerileri uygula (2)" emin olunanları, satırın
   "Uygula"sı emin olunmayanı tabloya ekler → Kaydet → sayfa yenilenince satırlar raporda. 354: taklit zorunlu araç seçimini gerçek hizmet gibi
   reddeder (istek yapılandırılmış çıktıyla); pano okumasında fotoğraf rapora eklenir (§11 92 — Fotoğraflar bölümü); uygulamadan sonra odak kartta.
   484 (reisim 2026-10-10: "fotoğraf eklenince belgede gözükmeyecek … aynı şekilde ekipman bilgilerinde de olsun"): okunan fotoğraf tablonun altında
   OKUMA fotoğrafı (Fotoğraflar bölümünde değil, belgede yok); ekipman bilgilerinde "Fotoğraftan doldur" (385'in "Etiketten oku"su); tabloya
   "Excel'den yükle" (başlık satırı sütun adlarıyla) ve "Excel şablonu". */
import { expect, test } from "@playwright/test";
import { xlsxBayt, XLSX_TURU } from "../src/components/disa/xlsx";
import { SABLONLAR } from "../src/format/sablonlar";
import { E2E_KAPI, E2E_PAROLA, E2E_YZ } from "./hesaplar";
import { bolumleriAc, hazir } from "./yardimci";

const Y = `http://${E2E_YZ.firma.kisaAd}.localhost:${E2E_KAPI}`;
/* uydurma, en küçük yapısı doğru JPEG — SOI · DQT · SOS (kalanı görüntü) · EOI (içerik önemsiz: okuma yerel taklitte; tarayıcı çözemez,
   küçültme dosyayı olduğu gibi gönderir, sunucu konum bilgisini silerken parçaları okur) */
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x03, 0x01, 0xff, 0xda, 0x00, 0x02, 0x01, 0x02, 0x03, 0xff, 0xd9]);

test("fotoğraftan okuma: öneri kartı; emin olunanlar toplu, emin olunmayan tek tek; tabloya eklenir ve kaydedilir", async ({ page }, bilgi) => {
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
  await bolumleriAc(page);   // 463: bölümler kapalı açılır

  const linye = page.locator("#b-linye");
  await linye.getByLabel("Pano sigortaları (linye): fotoğraftan oku").setInputFiles({ name: "pano.jpg", mimeType: "image/jpeg", buffer: JPEG });
  const kart = page.getByRole("region", { name: "Pano sigortaları (linye): fotoğraftan okunan" });
  await expect(kart).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("3 satır okundu", { exact: false }).first()).toBeVisible();
  /* 484: okunan fotoğraf tablonun altında okuma fotoğrafı (belgede görünmez); Fotoğraflar bölümünde değil */
  await expect(linye.getByText("belgede görünmez", { exact: false })).toBeVisible({ timeout: 30_000 });
  await expect(linye).toContainText("fotoğrafı.jpg");
  await expect(page.locator("#b-foto")).not.toContainText("fotoğrafı.jpg");
  await expect(kart.getByText("Emin değil")).toBeVisible();
  await expect(kart.getByText(/No: F1 · Devre: Aydınlatma/)).toBeVisible();
  /* emin olunanlar toplu */
  await kart.getByRole("button", { name: "Önerileri uygula (2)" }).click();
  await expect(linye.getByLabel("1. satır · No")).toHaveValue("F1");
  await expect(linye.getByLabel("2. satır · No")).toHaveValue("F2");
  await expect(linye.getByLabel("2. satır · In (A)")).toHaveValue("20");
  await expect(page.getByText("2 satır tabloya yazıldı", { exact: false }).first()).toBeVisible();
  /* kart açık kaldı: odak kalan satırın Uygula'sında (klavyeyle sürdürülebilir) */
  await expect(kart.getByRole("button", { name: "Uygula", exact: true })).toBeFocused();
  /* emin olunmayan tek tek */
  await kart.getByRole("button", { name: "Uygula", exact: true }).click();
  await expect(linye.getByLabel("3. satır · No")).toHaveValue("F3");
  await expect(kart).toHaveCount(0);
  /* rapora ancak Kaydet ile yazılır */
  /* 355: "kaydedildi" geçen gizli pencere metni (eksik alanlar penceresi) değil, kaydın kendi bildirimi (saha-raporu.spec gibi) */
  await page.getByRole("button", { name: "Kaydet", exact: true }).first().click();
  await expect(page.getByText("Rapor kaydedildi.").first()).toBeVisible({ timeout: 30_000 });
  await page.reload();
  await hazir(page);
  await expect(page.locator("#b-linye").getByLabel("3. satır · No")).toHaveValue("F3");
});

/* 385 → 484: ekipman bilgileri fotoğraftan (etiket plakası) — "Fotoğraftan doldur" → "…: fotoğraftan okunan" kartı; emin olunanlar toplu, "Emin değil"
   olan (imal yılı) tek tek alana yazılır; yazılanlar Kaydet'e kadar kaydedilmemiş değişiklik */
test("ekipman bilgileri fotoğraftan: öneri kartı; emin olunanlar toplu, emin olunmayan tek tek alana yazılır", async ({ page }, bilgi) => {
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
  await bolumleriAc(page);   // 463: bölümler kapalı açılır

  const ekip = page.locator("#b-sabit-ekipman");
  await ekip.getByLabel(/: fotoğraftan doldur$/).setInputFiles({ name: "etiket.jpg", mimeType: "image/jpeg", buffer: JPEG });
  const kart = page.getByRole("region", { name: /: fotoğraftan okunan$/ });
  await expect(kart).toBeVisible({ timeout: 30_000 });
  await expect(kart).toBeFocused();
  await expect(kart.getByText("Emin değil")).toBeVisible();
  await kart.getByRole("button", { name: "Önerileri uygula (3)" }).click();
  await expect(page.getByLabel("Marka", { exact: true })).toHaveValue("Deneme Marka");
  await expect(page.getByLabel("Model", { exact: true })).toHaveValue("DM-100");
  await expect(page.getByLabel("Seri no", { exact: true })).toHaveValue("SN-0001");
  await expect(page.getByLabel("İmal yılı", { exact: true })).toHaveValue("");
  await kart.getByRole("button", { name: "Uygula" }).click();
  await expect(page.getByLabel("İmal yılı", { exact: true })).toHaveValue("2019");
  await expect(kart).toHaveCount(0);
  await expect(ekip.getByLabel(/: fotoğraftan doldur$/)).toBeFocused();
  await expect(ekip.getByText("belgede görünmez", { exact: false })).toBeVisible({ timeout: 30_000 });
});

/* 484: ölçüm tablosuna Excel'den yükle — başlık satırı sütun adlarıyla eşlenir, satırlar tabloya yazılır; Excel şablonu iner */
test("ölçüm tablosu Excel'den: başlıklar sütunlara eşlenir, satırlar tabloya; şablon iner", async ({ page }, bilgi) => {
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
  const tanim = SABLONLAR.ZPKR02.tanim.bolumler.find((b) => b.id === "linye");
  if (!tanim || tanim.blok !== "olcum") throw new Error("ZPKR02 linye tablosu yok");
  const ad = (id: string) => tanim.sutunlar.find((s) => s.id === id)!.ad;
  const xl = Buffer.from(xlsxBayt("Sigortalar", [[ad("no"), ad("devre"), "Bilinmeyen"], ["X1", "Priz hattı", "-"], ["X2", "Kombi", "-"]]));
  const linye = page.locator("#b-linye");
  await linye.getByLabel("Pano sigortaları (linye): Excel'den yükle").setInputFiles({ name: "sigorta.xlsx", mimeType: XLSX_TURU, buffer: xl });
  await expect(page.getByText(/^2 satır Excel'den tabloya yazıldı; kaydetmeyi unutmayın\. Eşleşmeyen sütun: Bilinmeyen\./).first()).toBeVisible({ timeout: 30_000 });
  await expect.poll(() => linye.locator("input").evaluateAll((l) => l.map((i) => (i as HTMLInputElement).value))).toEqual(expect.arrayContaining(["X1", "X2", "Kombi"]));
  const [indirilen] = await Promise.all([page.waitForEvent("download", { timeout: 30_000 }), linye.getByRole("button", { name: "Pano sigortaları (linye): Excel şablonu" }).click()]);
  expect(indirilen.suggestedFilename()).toMatch(/sablonu\.xlsx$/);
});
