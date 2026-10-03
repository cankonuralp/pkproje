/* NEREDEN GELDİ: K0 (2026-10-03) — liste ↔ kart ve filtre satırı tek üreticiden, maketle aynı davranış (vitrin /vitrin, uydurma 23 kayıt):
   · kap ≥ 600 tablo, altı kart (kalip.ts kartEsigi; reisim 2026-09-26: kart yalnız telefonda) — tablet 1080'de de tablo;
   · sayaç dürüst (anayasa 2.8): "23 kayıt" → süzgeçte "8 / 23 kayıt"; sayfa boyu 10 (kalip.ts), odak sayfa tuşunda kalır;
   · çip + ve/veya (kalıp 8): aynı gruptan iki çip "ve" ile imkânsız, sebebi ve "veya"ya geç tuşu; süzgeç boşsa Temizle;
   · sıralama tabloda başlıktan (artan → azalan), kartta "Sıralama" seçicisinden;
   · telefonda seçiciler "Filtre" levhasında (kalıp 15); 8'den fazla seçenekte arama (kalıp 19);
   · filtre kutusu açılır kapanır, tercih hatırlanır (reisim 2026-09-27). */
import { expect, test, type Page } from "@playwright/test";

const liste = (page: Page) => page.locator('section[aria-labelledby="v-liste"]');
const sayac = (page: Page) => liste(page).locator("[data-sayac]");
const satirlar = (page: Page) => liste(page).locator("tbody tr");
/** odaktaki öğe: etiket + erişilebilir ad (gölge DOM içindeyse kökün adı) — teşhis için */
const odaktaki = (page: Page) => page.evaluate(() => {
  const e = document.activeElement;
  return e ? `${e.tagName} ${e.getAttribute("aria-label") ?? e.id ?? ""}`.trim() : "yok";
});

test.beforeEach(async ({ page }) => {
  await page.goto("/vitrin");
  await expect(sayac(page)).toHaveText("23 kayıt");
});

test("kip: masaüstü ve tablette tablo, telefonda kart", async ({ page }, bilgi) => {
  await expect(satirlar(page)).toHaveCount(10);
  const thead = liste(page).locator("thead");
  if (bilgi.project.name === "telefon") {
    await expect(thead).toBeHidden();
    const kart = await satirlar(page).first().evaluate((tr) => getComputedStyle(tr).display);
    expect(kart).toBe("grid");
    /* telefonda seçiciler (sıralama dahil) levhada, satırda değil (maket: .a-suzgec-sag telefonda gizli) */
    await expect(liste(page).locator('[data-secici="sira"]')).toBeHidden();
    await liste(page).getByRole("button", { name: "Filtre", exact: true }).click();
    await expect(page.locator("dialog[open]")).toContainText("Sıralama");
  } else {
    await expect(thead).toBeVisible();
    await expect(liste(page).locator('[data-secici="sira"]')).toBeHidden();
  }
  const genislik = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  expect(genislik[0]).toBeLessThanOrEqual(genislik[1]);
});

/* reddedilen eşik 960 tablet dikeyde (810) karta geçiyordu (kalip.ts) — dikey tablette de tablo, sıkışık */
test("tablet dikey 810: tablo (kart değil)", async ({ page }, bilgi) => {
  test.skip(bilgi.project.name !== "tablet", "yalnız tablet");
  await page.setViewportSize({ width: 810, height: 1080 });
  await expect(liste(page).locator("thead")).toBeVisible();
  const genislik = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  expect(genislik[0]).toBeLessThanOrEqual(genislik[1]);
});

test("sayfalayıcı: 10'ar, 3 sayfa, odak yeni sayfanın tuşunda", async ({ page }) => {
  const nav = liste(page).getByRole("navigation", { name: "kayıt sayfaları" });
  await expect(nav).toContainText("1–10 / 23");
  await nav.getByRole("button", { name: "Sayfa 3" }).click();
  await expect(nav).toContainText("21–23 / 23");
  await expect(satirlar(page)).toHaveCount(3);
  /* 2026-10-03: tam koşuların birinde (telefon) odak burada kayboldu, yeniden üretilemedi — düşerse odağın nerede olduğu mesajda yazar */
  await expect.poll(() => odaktaki(page), { message: "odak Sayfa 3 tuşunda değil" }).toBe("BUTTON Sayfa 3");
  await expect(nav.getByRole("button", { name: "Sonraki sayfa" })).toBeDisabled();
  /* "Önceki" ile gelinen sayfada odak o sayfanın tuşunda (yerli tıklama odağı kendiliğinden vermez) */
  await nav.getByRole("button", { name: "Önceki sayfa" }).click();
  await expect.poll(() => odaktaki(page), { message: "odak Sayfa 2 tuşunda değil" }).toBe("BUTTON Sayfa 2");
});

/* Temizle masaüstünde satırın sağında, telefonda levhada */
async function temizle(page: Page, proje: string) {
  if (proje !== "telefon") return liste(page).getByRole("button", { name: "Temizle", exact: true }).click();
  await liste(page).getByRole("button", { name: "Filtre", exact: true }).click();
  const levha = page.locator("dialog[open]");
  await levha.getByRole("button", { name: "Temizle", exact: true }).click();
  await levha.getByRole("button", { name: "Sonuçları göster" }).click();
}

test("çip: sayaç dürüst, ve ile aynı grup imkânsız → veya'ya geç; arama boşsa Temizle", async ({ page }, bilgi) => {
  const cip = (ad: string) => liste(page).locator(`[data-cip="${ad}"]`);
  await expect(cip("denetimde")).toContainText("8");
  await cip("denetimde").click();
  await expect(sayac(page)).toHaveText("8 / 23 kayıt");
  await expect(liste(page).locator("summary")).toContainText("1 filtre uygulandı");
  await cip("tamam").click();
  await expect(sayac(page)).toHaveText("15 / 23 kayıt");
  await liste(page).locator('[data-kip="ve"]').click();
  await expect(liste(page)).toContainText("Bir kayıt aynı anda iki durumda olamaz");
  await liste(page).getByRole("button", { name: "“veya”ya geç" }).click();
  await expect(sayac(page)).toHaveText("15 / 23 kayıt");

  await temizle(page, bilgi.project.name);
  await expect(sayac(page)).toHaveText("23 kayıt");
  await liste(page).getByRole("searchbox").fill("bulunmayan");
  await expect(liste(page)).toContainText("Filtreye uyan kayıt yok");
  await liste(page).getByRole("button", { name: "Süzgeci temizle" }).click();
  await expect(sayac(page)).toHaveText("23 kayıt");
  await expect(liste(page).getByRole("searchbox")).toHaveValue("");
});

test("sıralama: tabloda başlık (artan → azalan), kartta seçici", async ({ page }, bilgi) => {
  const ilk = () => satirlar(page).first().locator('td[data-alan="no"]');
  if (bilgi.project.name === "telefon") {
    await liste(page).getByRole("button", { name: "Filtre", exact: true }).click();
    const levha = page.locator("dialog[open]");
    await levha.getByRole("button", { name: "Proje no: büyükten küçüğe" }).click();
    await levha.getByRole("button", { name: "Sonuçları göster" }).click();
    await expect(ilk()).toHaveText("P-1026-23");
    return;
  }
  const bas = liste(page).locator('[data-sirala="no"]');
  await bas.click();
  await expect(liste(page).locator('th[aria-sort="ascending"]')).toContainText("Proje no");
  await expect(ilk()).toHaveText("P-1026-01");
  await bas.click();
  await expect(ilk()).toHaveText("P-1026-23");
  await expect(liste(page).locator('[data-sirala="no"]')).toBeFocused();
});

test("seçiciler: masaüstünde açılır liste, telefonda Filtre levhası; uzun listede arama", async ({ page }, bilgi) => {
  if (bilgi.project.name === "telefon") {
    await expect(liste(page).locator('[data-secici="il"]')).toBeHidden();
    await liste(page).getByRole("button", { name: "Filtre", exact: true }).click();
    const levha = page.locator("dialog[open]");
    await expect(levha.locator("h2")).toHaveText("Filtre");
    await levha.getByRole("button", { name: "Manisa" }).click();
    await expect(levha.getByRole("searchbox", { name: "Müşteri içinde ara" })).toBeVisible();
    await levha.getByRole("button", { name: "Sonuçları göster" }).click();
    await expect(sayac(page)).toHaveText("8 / 23 kayıt");
    await expect(liste(page).getByRole("button", { name: /^Filtre/ })).toContainText("1");
    return;
  }
  const il = liste(page).locator('[data-secici="il"]');
  await il.locator("button").first().click();
  await expect(il.getByRole("listbox")).toBeVisible();
  await il.getByRole("option", { name: "Manisa" }).click();
  await expect(il.getByRole("listbox")).toBeHidden();
  await expect(il.locator("button").first()).toContainText("Manisa");
  await expect(sayac(page)).toHaveText("8 / 23 kayıt");
  const mus = liste(page).locator('[data-secici="musteri"]');
  await mus.locator("button").first().click();
  const ara = mus.getByRole("searchbox");
  await expect(ara).toBeFocused();
  await ara.fill("gıda");
  await expect(mus.getByRole("option")).toHaveCount(1);
  await page.keyboard.press("Escape");
  await expect(mus.getByRole("listbox")).toBeHidden();
});

test("filtre kutusu kapanır ve tercih hatırlanır", async ({ page }) => {
  const kutu = liste(page).locator("details");
  await liste(page).locator("summary").click();
  await expect(kutu).not.toHaveAttribute("open");
  await page.reload();
  await expect(sayac(page)).toHaveText("23 kayıt");
  await expect(liste(page).locator("details")).not.toHaveAttribute("open");
});
