/* NEREDEN GELDİ: 351 — saha raporunda fotoğraftan okuma (maket rapor.html Z3 okuyabilir / oneriKart; §8.10 "değer öneri olarak düşer, inspector
   onaylamadan kaydedilmez"). Gerçek sunucuda, üç genişlikte, ayrı uydurma firmada (test sunucusunun yerel Anthropic taklidi — gerçek hizmete istek
   gitmez): ölçüm tablosunun altında "Fotoğraftan oku" → öneri kartı (emin olunmayan satır işaretli) → "Önerileri uygula (2)" emin olunanları, satırın
   "Uygula"sı emin olunmayanı tabloya ekler → Kaydet → sayfa yenilenince satırlar raporda. 354: taklit zorunlu araç seçimini gerçek hizmet gibi
   reddeder (istek yapılandırılmış çıktıyla); pano okumasında fotoğraf rapora eklenir (§11 92 — Fotoğraflar bölümü); uygulamadan sonra odak kartta. */
import { expect, test } from "@playwright/test";
import { E2E_KAPI, E2E_PAROLA, E2E_YZ } from "./hesaplar";
import { hazir } from "./yardimci";

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

  const linye = page.locator("#b-linye");
  await linye.getByLabel("Pano sigortaları (linye): fotoğraftan oku").setInputFiles({ name: "pano.jpg", mimeType: "image/jpeg", buffer: JPEG });
  const kart = page.getByRole("region", { name: "Pano sigortaları (linye): fotoğraftan okunan" });
  await expect(kart).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("3 satır okundu", { exact: false }).first()).toBeVisible();
  /* pano fotoğrafı rapora (Fotoğraflar bölümü); ekran yenilenir */
  await expect(page.locator("#b-foto")).toContainText("fotoğrafı.jpg", { timeout: 30_000 });
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
  await page.getByRole("button", { name: "Kaydet", exact: true }).click();
  await expect(page.getByText(/kaydedildi/i).first()).toBeVisible({ timeout: 30_000 });
  await page.reload();
  await hazir(page);
  await expect(page.locator("#b-linye").getByLabel("3. satır · No")).toHaveValue("F3");
});
