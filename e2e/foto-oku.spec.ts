/* NEREDEN GELDİ: 351 — saha raporunda fotoğraftan okuma (maket rapor.html Z3 okuyabilir / oneriKart; §8.10 "değer öneri olarak düşer, inspector
   onaylamadan kaydedilmez"). Gerçek sunucuda, üç genişlikte, ayrı uydurma firmada (test sunucusunun yerel Anthropic taklidi — gerçek hizmete istek
   gitmez): ölçüm tablosunun altında "Fotoğraftan oku" → öneri kartı (emin olunmayan satır işaretli) → "Önerileri uygula (2)" emin olunanları, satırın
   "Uygula"sı emin olunmayanı tabloya ekler → Kaydet → sayfa yenilenince satırlar raporda. 354: taklit zorunlu araç seçimini gerçek hizmet gibi
   reddeder (istek yapılandırılmış çıktıyla); pano okumasında fotoğraf rapora eklenir (§11 92 — Fotoğraflar bölümü); uygulamadan sonra odak kartta.
   484 (reisim 2026-10-10: "fotoğraf eklenince belgede gözükmeyecek … aynı şekilde ekipman bilgilerinde de olsun"): okunan fotoğraf tablonun altında
   OKUMA fotoğrafı (Fotoğraflar bölümünde değil, belgede yok); ekipman bilgilerinde "Fotoğraftan doldur" (385'in "Etiketten oku"su); tabloya
   "Excel'den yükle" (başlık satırı sütun adlarıyla) ve "Excel şablonu".
   486 (reisim 2026-10-10): tuşun adı "Fotoğraf ekle (yapay zekâ okur)" (tabloda ve alanlı bölümde aynı); tablodaki Tip listesi alanın yanında açılır,
   sayfa kaymaz ("tip seçin kısmına tıklayınca saçma sapan başa atıp"); sıra sütunu "Sıra"; "Son satırı kopyala" (No bir artar); "Sonuç neye göre
   çıkar?" tablonun kuralını yazar. 488: "Sırala" ve satırın Kopyala işareti kalktı (reisim); satırın sonucu gerekçeyle elle değiştirilir.
   2026-10-12 (reisim): fotoğraf tuşu bölüm başlığında (telefonda simge), kapalı bölümde fotoğraf seçilince bölüm açılır; Kaydet / Onaya gönder
   çubuksuz, havada — S.A.Y düğmesiyle örtüşmez. Görüntüler e2e-goz/ (foto-baslik, eylem).
   542 (reisim 2026-10-14: "oku tuşu olmayacak say asistandan gir ve fotoğrafı okuyup ilgili yerlere girişleri yap diyeceğim ve yapacak"; sunum 541
   onaylı): "Fotoğraf ekle" fotoğrafı OKUMADAN ekler; S.A.Y'a "Fotoğrafları oku ve gir" → okunmamış fotoğraflar okunur, değerler boş alanlara /
   tabloya girer (emin olunmayan sarı), dolu alan sorulur ("Dolu alanları da değiştir"), "Geri al"; öneri kartı ve "Oku" tuşu kalktı. */
import { mkdirSync } from "node:fs";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { xlsxBayt, XLSX_TURU } from "../src/components/disa/xlsx";
import { SABLONLAR } from "../src/format/sablonlar";
import { sonrakiKod } from "../src/modules/raporlar/tablo";
import { E2E_KAPI, E2E_PAROLA, E2E_YZ } from "./hesaplar";
import { bolumleriAc, hazir } from "./yardimci";

const Y = `http://${E2E_YZ.firma.kisaAd}.localhost:${E2E_KAPI}`;
/** 486: gözle bakılacak görüntü (deneme makinesi e2e-goz/ klasörünü her koşuda yükler) — sayfanın görünen kısmı ya da bir bölüm */
async function goz(hedef: Page | Locator, ad: string, proje: string) {
  mkdirSync("e2e-goz", { recursive: true });
  await hedef.screenshot({ path: `e2e-goz/${proje}-${ad}.png` });
}
/* uydurma, en küçük yapısı doğru JPEG — SOI · DQT · SOS (kalanı görüntü) · EOI (içerik önemsiz: okuma yerel taklitte; tarayıcı çözemez,
   küçültme dosyayı olduğu gibi gönderir, sunucu konum bilgisini silerken parçaları okur) */
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x03, 0x01, 0xff, 0xda, 0x00, 0x02, 0x01, 0x02, 0x03, 0xff, 0xd9]);

/** 542: raporu açar (YZ firması, projenin ekipmanı), bölümler açık */
async function raporuAc(page: Page, kod: string) {
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
}
/** 542: S.A.Y paneli açılır, hızlı tuşa basılır, S.A.Y'ın cevabı beklenir; telefonda panel raporu örttüğü için sonra kapatılır */
async function sayaDe(page: Page, tus: string, bekle: RegExp) {
  const fab = page.getByRole("button", { name: "S.A.Y — saha asistanı" });
  if (await fab.isVisible()) await fab.click();
  const panel = page.locator("#say-panel");
  await panel.getByRole("button", { name: tus, exact: true }).click();
  await expect(panel.getByText(bekle).last()).toBeVisible({ timeout: 30_000 });
  return panel;
}

test("fotoğraf ekle okumaz; S.A.Y \"Fotoğrafları oku ve gir\" okur, satırlar tabloya girer (emin olmayan sarı); Kaydet'le kalır", async ({ page }, bilgi) => {
  await raporuAc(page, E2E_YZ.ekipman[bilgi.project.name]);
  const linye = page.locator("#b-linye");
  /* 2026-10-12 (reisim, ekran görüntüsüyle: "o tuşun orada olmasını istiyorum, ekran daralınca logo olarak kalsın"): fotoğraf tuşu bölümün BAŞLIK
     satırında (gövdede değil), telefonda yalnız simge; bölüm kapalıyken de görünür, fotoğraf seçilince bölüm açılır. 542: adı "Fotoğraf ekle" */
  const linyeFoto = linye.getByLabel("Pano sigortaları (linye): fotoğraf ekle", { exact: true });
  await expect(page.locator("#b-linye-ic").getByLabel("Pano sigortaları (linye): fotoğraf ekle", { exact: true })).toHaveCount(0);
  /* `has` içteki konumu etiketin İÇİNDE arar — bölümün kimliğiyle başlayan konum (linyeFoto) orada bulunmaz; sayfa düzeyindeki ad eşleşir */
  const fotoTus = linye.locator("label", { has: page.getByLabel("Pano sigortaları (linye): fotoğraf ekle", { exact: true }) });
  await expect(fotoTus).toHaveCount(1);
  const fotoYazi = fotoTus.getByText("Fotoğraf ekle", { exact: true });
  if (bilgi.project.name === "telefon") await expect(fotoYazi).toBeHidden(); else await expect(fotoYazi).toBeVisible();
  await expect(fotoTus).toHaveAttribute("title", "Fotoğraf ekle");
  await linye.scrollIntoViewIfNeeded();
  await goz(linye, "foto-baslik", bilgi.project.name);
  /* Kaydet / Onaya gönder havada (reisim: "say tuşu gibi havada olsun bir barın içinde durduğu görüntü şık değil"): kap saydam, tuşlar gölgeli;
     S.A.Y düğmesi tuşların üstünde — hiçbir tuşla örtüşmez */
  const eylem = page.locator('[data-alt-cubuk="her"]');
  await expect(eylem).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(eylem.getByRole("button", { name: "Onaya gönder" })).not.toHaveCSS("box-shadow", "none");
  const fab = page.getByRole("button", { name: "S.A.Y — saha asistanı" });
  await expect(fab).toBeVisible({ timeout: 30_000 });
  const f = (await fab.boundingBox())!;
  const tuslar = await eylem.getByRole("button").evaluateAll((l) => l.map((e) => { const r = e.getBoundingClientRect(); return { ad: e.textContent, sol: r.left, sag: r.right, ust: r.top, alt: r.bottom }; }));
  expect(tuslar.length).toBeGreaterThan(1);
  expect(tuslar.filter((t) => f.x < t.sag && f.x + f.width > t.sol && f.y < t.alt && f.y + f.height > t.ust)).toEqual([]);
  await goz(page, "eylem", bilgi.project.name);
  const linyeAc = linye.getByRole("button", { name: "Pano sigortaları (linye) bölümü" });
  await linyeAc.click();
  await expect(linyeAc).toHaveAttribute("aria-expanded", "false");
  await expect(fotoTus).toBeVisible();
  /* 542 (reisim 2026-10-14: "oku tuşu olmayacak say asistandan gir"): fotoğraf OKUNMADAN eklenir — öneri kartı, "Oku" tuşu, açıklama satırı yok */
  await linyeFoto.setInputFiles({ name: "pano.jpg", mimeType: "image/jpeg", buffer: JPEG });
  await expect(linyeAc).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByText("Fotoğraf eklendi.").first()).toBeVisible({ timeout: 30_000 });
  await expect(linye).toContainText("fotoğrafı.jpg", { timeout: 30_000 });
  await expect(page.locator("#b-foto")).not.toContainText("fotoğrafı.jpg");
  await expect(linye.getByRole("link", { name: "Görüntüle" })).toBeVisible();
  await expect(linye.getByRole("button", { name: "Oku", exact: true })).toHaveCount(0);
  await expect(page.getByRole("region", { name: /fotoğraftan okunan/ })).toHaveCount(0);
  await expect(linye.getByLabel("1. satır · No")).toHaveCount(0);
  /* S.A.Y okur ve girer: 3 satır; emin olunmayan (F3) sarı, ötekiler yeşil — kaydetmek kişide */
  const panel = await sayaDe(page, "Fotoğrafları oku ve gir", /1 fotoğrafı okudum/);
  await expect(panel.getByText(/Pano sigortaları \(linye\): 3 satır/).last()).toBeVisible();
  await expect(panel.getByRole("button", { name: "Geri al" }).last()).toBeVisible();
  if (bilgi.project.name === "telefon") await panel.getByRole("button", { name: "S.A.Y'ı kapat" }).click();
  await expect(linye.getByLabel("1. satır · No")).toHaveValue("F1");
  await expect(linye.getByLabel("2. satır · In (A)")).toHaveValue("20");
  await expect(linye.getByLabel("3. satır · No")).toHaveValue("F3");
  await expect(linye.getByLabel("1. satır · No")).toHaveAttribute("data-say-giris", "emin");
  await expect(linye.getByLabel("3. satır · No")).toHaveAttribute("data-say-giris", "belirsiz");
  await expect(page.getByText("Kaydedilmemiş değişiklik var")).toBeVisible();
  /* kişi değeri değiştirince işaret kalkar */
  await linye.getByLabel("3. satır · No").fill("F3A");
  await expect(linye.getByLabel("3. satır · No")).not.toHaveAttribute("data-say-giris", /.+/);
  /* aynı fotoğraf ikinci kez okunmaz */
  await sayaDe(page, "Fotoğrafları oku ve gir", /Okunacak fotoğraf yok/);
  if (bilgi.project.name === "telefon") await page.locator("#say-panel").getByRole("button", { name: "S.A.Y'ı kapat" }).click();
  /* rapora ancak Kaydet ile yazılır */
  /* 355: "kaydedildi" geçen gizli pencere metni (eksik alanlar penceresi) değil, kaydın kendi bildirimi (saha-raporu.spec gibi) */
  await page.getByRole("button", { name: "Kaydet", exact: true }).first().click();
  await expect(page.getByText("Rapor kaydedildi.").first()).toBeVisible({ timeout: 30_000 });
  await page.reload();
  await hazir(page);
  await expect(page.locator("#b-linye").getByLabel("3. satır · No")).toHaveValue("F3A");
});

/* 542 (sunum 541 K1 · K2): ekipman bilgileri (etiket plakası) — S.A.Y boş alanlara girer, emin olmadığı (imal yılı) sarı; dolu alanın üstüne yazmaz,
   "Dolu alanları da değiştir" yazar; "Geri al" girdiklerini geri alır */
test("ekipman bilgileri: S.A.Y boş alanlara girer, dolu alanı sorar, Geri al", async ({ page }, bilgi) => {
  await raporuAc(page, E2E_YZ.ekipman[bilgi.project.name]);
  const ekip = page.locator("#b-sabit-ekipman");
  await page.getByLabel("Marka", { exact: true }).fill("Elle Marka");
  await page.getByLabel("Model", { exact: true }).fill("");
  await page.getByLabel("Seri no", { exact: true }).fill("");
  await page.getByLabel("İmal yılı", { exact: true }).fill("");
  await ekip.getByLabel(/: fotoğraf ekle$/).setInputFiles({ name: "etiket.jpg", mimeType: "image/jpeg", buffer: JPEG });
  await expect(ekip).toContainText("fotoğrafı.jpg", { timeout: 30_000 });
  const panel = await sayaDe(page, "Fotoğrafları oku ve gir", /1 fotoğrafı okudum/);
  await expect(panel.getByText(/Dolu olduğu için değiştirmediğim: Marka/).last()).toBeVisible();
  const kapat = async () => { if (bilgi.project.name === "telefon") await panel.getByRole("button", { name: "S.A.Y'ı kapat" }).click(); };
  await kapat();
  await expect(page.getByLabel("Marka", { exact: true })).toHaveValue("Elle Marka");
  await expect(page.getByLabel("Model", { exact: true })).toHaveValue("DM-100");
  await expect(page.getByLabel("Seri no", { exact: true })).toHaveValue("SN-0001");
  await expect(page.getByLabel("İmal yılı", { exact: true })).toHaveValue("2019");
  await expect(page.getByLabel("İmal yılı", { exact: true })).toHaveAttribute("data-say-giris", "belirsiz");
  await expect(ekip.locator('[data-say-not="emin değil"]')).toHaveCount(1);   // "emin değil" yazısı kutunun ::after'ında
  /* dolu alan: "Dolu alanları da değiştir" */
  if (bilgi.project.name === "telefon") await page.getByRole("button", { name: "S.A.Y — saha asistanı" }).click();
  await panel.getByRole("button", { name: "Dolu alanları da değiştir" }).last().click();
  await expect(panel.getByText(/1 dolu alanı okunan değerle değiştirdim/).last()).toBeVisible({ timeout: 30_000 });
  await kapat();
  await expect(page.getByLabel("Marka", { exact: true })).toHaveValue("Deneme Marka");
  /* ilk işin Geri al'ı: girdiği üç alan boşalır (değiştirdiği Marka ayrı işin) */
  if (bilgi.project.name === "telefon") await page.getByRole("button", { name: "S.A.Y — saha asistanı" }).click();
  await panel.getByRole("button", { name: "Geri al" }).first().click();
  await expect(panel.getByText(/3 girişi geri aldım/).last()).toBeVisible({ timeout: 30_000 });
  await kapat();
  await expect(page.getByLabel("Model", { exact: true })).toHaveValue("");
  await expect(page.getByLabel("İmal yılı", { exact: true })).toHaveValue("");
  await expect(page.getByLabel("Marka", { exact: true })).toHaveValue("Deneme Marka");
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

  /* 486: sıra sütunu "Sıra" — formatın kendi "No" sütunu var ("No | No" olmasın) */
  await expect(linye.getByRole("columnheader", { name: "Sıra", exact: true })).toBeVisible();
  /* 486 (reisim: "tip seçin kısmına tıklayınca saçma sapan başa atıp"): tablodaki seçim listesi alanın hemen altında / üstünde açılır, sayfa kaymaz */
  const tip = linye.getByRole("combobox", { name: /· Tip$/ }).last();
  /* alan ekranın ve tablonun ortasına: tıklamadan önce test aracı kendisi kaydırmasın (alttaki sabit tuş çubuğu ya da tablonun yapışık sütunu
     alanı örtünce tıklama kaydırıp yeniden dener — 1515d85 telefon izi; ölçülen kayma uygulamanın değil aracın olurdu) */
  await tip.evaluate((e) => e.scrollIntoView({ block: "center", inline: "center" }));
  const y0 = await page.evaluate(() => scrollY);
  await tip.click();
  const tipListe = page.getByRole("listbox", { name: /· Tip$/ });
  await expect(tipListe).toBeVisible();
  expect(await page.evaluate(() => scrollY), "sayfa kaymadı").toBe(y0);
  await goz(page, "tablo-tip-listesi", bilgi.project.name);
  const a = (await tip.boundingBox())!, l = (await tipListe.boundingBox())!;
  expect(l.y >= a.y + a.height - 1 || l.y + l.height <= a.y + 1, `liste alanın altında ya da üstünde (alan ${a.y}, liste ${l.y})`).toBe(true);
  expect(Math.min(Math.abs(l.y - (a.y + a.height)), Math.abs(a.y - (l.y + l.height))) < 20, "liste alana bitişik").toBe(true);
  expect(l.x < a.x + a.width && l.x + l.width > a.x, "liste alanın hizasında").toBe(true);
  await tipListe.getByRole("option", { name: "C", exact: true }).click();
  await expect(tip).toContainText("C");
  /* 486: son satırı kopyala — değerler gelir, No bir artar */
  const nolar = () => linye.getByRole("textbox", { name: /· No$/ }).evaluateAll((x) => x.map((i) => (i as HTMLInputElement).value));
  const once = await nolar();
  const sonDevre = await linye.getByRole("textbox", { name: /· Devre$/ }).last().inputValue();
  await linye.getByRole("button", { name: "Son satırı kopyala" }).click();
  await expect(linye.getByRole("textbox", { name: /· No$/ })).toHaveCount(once.length + 1);
  await expect(linye.getByRole("textbox", { name: /· No$/ }).last()).toHaveValue(sonrakiKod(once.at(-1)!));
  await expect(linye.getByRole("textbox", { name: /· Devre$/ }).last()).toHaveValue(sonDevre);
  await expect(linye.getByRole("button", { name: /satırı kopyala \(altına\)$/ })).toHaveCount(0);
  await expect(linye.getByRole("button", { name: /^Sırala/ })).toHaveCount(0);
  /* 488 (hata listesi 54): son satırın sonucu gerekçeyle elle "Uygun değil" — hücrede "elle · kural: …"; gerekçe kutusu */
  const son = (await nolar()).length;
  await linye.getByRole("button", { name: `${son}. satır: sonucu elle değiştir` }).click();
  await linye.getByRole("combobox", { name: `${son}. satır · elle sonuç` }).click();
  await page.getByRole("option", { name: "Uygun değil", exact: true }).click();
  await linye.getByLabel(`${son}. satır · elle sonucun gerekçesi`).fill("Deneme gerekçesi: yeniden ölçülecek");
  await expect(linye.getByText(/^elle · kural: /).last()).toBeVisible();
  /* 486: "Sonuç neye göre çıkar?" tablonun kuralını yazar (RCD testi dahil) */
  await linye.getByText("Sonuç neye göre çıkar?").click();
  await expect(linye).toContainText("Ib ≤ In ≤ Iz");
  await expect(linye).toContainText("TΔ ≤ 200 ms");
  await goz(linye, "tablo-tuslar", bilgi.project.name);
});
