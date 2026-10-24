/* NEREDEN GELDİ: 497 "Yapay zekâya anlat" — hata listesi 29 + 46 maketi (https://claude.ai/artifact/TgA7oTqRojdEe7qAfjqAfJ) onaylandı, karar K6:
   "öneri kâğıtta kesik çizgiyle görünür; Ekle / Uygula demeden yazılmaz". Gerçek tarayıcıda, yapay zekâsı açık uydurma firmada (yerel Anthropic
   taklidi — gerçek hizmete istek gitmez; istekte kişi / müşteri bilgisi olursa taklit reddeder): Format kurucu › Gelişmiş seçenekler → isteği yaz
   → "Öner" → "ekle" önerisi kâğıtta yerinde, kesik çizgiyle (henüz bölüm değil) → "Ekle" taslağa ekler (Kaydedilmedi) · "değiştir" önerisi
   kutuda → "Uygula" · örnekten yeni öneri → "Vazgeç" atar · 498 "Belgeden başlat…" (uydurma PDF) → belgeden çıkan bölüm öneri → "Ekle".
   Yapay zekâsı kapalı firmada kutu nedeni söyler: e2e/rapor-format.spec.ts.
   Telefonda kurucu yok (yalnız önizleme).
   2026-10-24: ikinci test (basılı formdan şablon) YAPAY ZEKÂSIZ — reisim: "ben şablon yükledim bu şablondan başlat dedim neden yapay zeka
   çalışıyor ?", "en baştan beri bunu istedim": test içinde pdf-lib ile üretilen UYDURMA vektör PDF tarayıcıda okunur (rapor-format/ui/pdfOku.ts). */
import { mkdirSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { PDFDocument, StandardFonts, rgb, type RGB } from "pdf-lib";
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

/* UYDURMA vektör basılı form (2026-10-24; gerçek firmanın formu değil, yalnız ASCII): başlık tablo dışında; "1. FIRMA BILGILERI" şeridi bütün
   sütunları kaplayan birleşik hücre (zeminli); etiket + boş hücre satırları; yan yana iki küçük tablo (HALAT / KANCA); No | Madde | Sonuc başlıklı
   iki maddelik liste; sonuç cümlesi; imza satırı. Zeminler dolgu; tablo çizgileri iki türlü — yan yana tablolarda çizilen yol, ötekilerde Word'ün
   PDF'indeki gibi ince dolgulu dikdörtgen. Tarayıcıdaki okuyucu bunlardan ızgarayı çıkarır. */
type FormHucresi = { r: number; c: number; cs?: number; m?: string; k?: boolean; orta?: boolean; zemin?: RGB };
async function uydurmaForm(): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  const EN = 595.28, BOY = 841.89;
  const sayfa = pdf.addPage([EN, BOY]);
  const duz = await pdf.embedFont(StandardFonts.Helvetica), kalin = await pdf.embedFont(StandardFonts.HelveticaBold);
  const siyah = rgb(0, 0, 0);
  /* koordinatlar sol üstten (y aşağı) — pdf-lib'in alt kökenine burada çevrilir */
  const yaz = (s: string, x: number, taban: number, k = false, boy = 9) => sayfa.drawText(s, { x, y: BOY - taban, size: boy, font: k ? kalin : duz, color: siyah });
  const cizgi = (x1: number, y1: number, x2: number, y2: number, yol: boolean) => (yol
    ? sayfa.drawLine({ start: { x: x1, y: BOY - y1 }, end: { x: x2, y: BOY - y2 }, thickness: 0.75, color: siyah })
    : sayfa.drawRectangle({ x: Math.min(x1, x2) - 0.25, y: BOY - Math.max(y1, y2) - 0.25, width: Math.abs(x2 - x1) + 0.5, height: Math.abs(y2 - y1) + 0.5, color: siyah }));
  const tablo = (x: number, y: number, sutun: number[], satir: number[], hucreler: FormHucresi[], yol = false) => {
    const xs = [x], ys = [y];
    for (const w of sutun) xs.push(xs[xs.length - 1] + w);
    for (const h of satir) ys.push(ys[ys.length - 1] + h);
    const sag = (h: FormHucresi) => xs[h.c + (h.cs ?? 1)];
    for (const h of hucreler) if (h.zemin) sayfa.drawRectangle({ x: xs[h.c], y: BOY - ys[h.r + 1], width: sag(h) - xs[h.c], height: ys[h.r + 1] - ys[h.r], color: h.zemin });
    for (const yy of ys) cizgi(xs[0], yy, xs[xs.length - 1], yy, yol);
    /* dikey çizgi: satırda birleşik hücrenin içinden geçmeyen her sütun sınırı */
    satir.forEach((_, r) => {
      for (let c = 0; c <= sutun.length; c++) {
        if (hucreler.some((h) => h.r === r && h.c < c && c < h.c + (h.cs ?? 1))) continue;
        cizgi(xs[c], ys[r], xs[c], ys[r + 1], yol);
      }
    });
    for (const h of hucreler) {
      if (!h.m) continue;
      const w = (h.k ? kalin : duz).widthOfTextAtSize(h.m, 9);
      yaz(h.m, h.orta ? (xs[h.c] + sag(h) - w) / 2 : xs[h.c] + 3, (ys[h.r] + ys[h.r + 1]) / 2 + 3, h.k);
    }
  };
  const baslik = "VINC MUAYENE FORMU";
  yaz(baslik, (EN - kalin.widthOfTextAtSize(baslik, 14)) / 2, 60, true, 14);
  tablo(40, 90, [150, 365], [18, 18, 18, 18], [
    { r: 0, c: 0, cs: 2, m: "1. FIRMA BILGILERI", k: true, orta: true, zemin: rgb(0.949, 0.863, 0.859) },
    { r: 1, c: 0, m: "Unvan", k: true }, { r: 1, c: 1 },
    { r: 2, c: 0, m: "Adres", k: true }, { r: 2, c: 1 },
    { r: 3, c: 0, m: "Kapasite (kg)", k: true }, { r: 3, c: 1 },
  ]);
  tablo(40, 180, [150, 100], [18, 18], [{ r: 0, c: 0, cs: 2, m: "HALAT", k: true, orta: true, zemin: rgb(0.85, 0.85, 0.85) }, { r: 1, c: 0, m: "Cap (mm)" }, { r: 1, c: 1 }], true);
  tablo(305, 180, [150, 100], [18, 18], [{ r: 0, c: 0, cs: 2, m: "KANCA", k: true, orta: true, zemin: rgb(0.85, 0.85, 0.85) }, { r: 1, c: 0, m: "Emniyet mandali" }, { r: 1, c: 1 }], true);
  tablo(40, 234, [40, 375, 100], [18, 18, 18], [
    { r: 0, c: 0, m: "No", k: true, orta: true }, { r: 0, c: 1, m: "Madde", k: true }, { r: 0, c: 2, m: "Sonuc", k: true, orta: true },
    { r: 1, c: 0, m: "1", orta: true }, { r: 1, c: 1, m: "Fren kontrolu" }, { r: 1, c: 2 },
    { r: 2, c: 0, m: "2", orta: true }, { r: 2, c: 1, m: "Halat kontrolu" }, { r: 2, c: 2 },
  ]);
  tablo(40, 306, [515], [20], [{ r: 0, c: 0, m: "Ekipman bir sonraki kontrole kadar kullanima UYGUNDUR", k: true }]);
  tablo(40, 344, [150, 365], [40], [{ r: 0, c: 0, m: "Imza", k: true }, { r: 0, c: 1 }]);
  return Buffer.from(await pdf.save());
}

/* 2026-10-23 BASILI FORMDAN ŞABLON — reisim: "ben bunu yükleyince format buna dönüşsün format düzenleyicide bundan düzenleme yapabileyim
   istiyorum", "sürüm 2 ne işe yarıyor orda o zaman yüklemem ne işe yaradı". Tür sayfasında basılı format PDF'i yüklenir ("Rapor şablonunu bu PDF'e
   göre kur" işaretli gelir) → şablon taslak olarak kurulur, Format kurucu açılır; tür sayfasında satırda "Şablonu bundan kur". 2026-10-24 (serbest
   düzen — reisim: "hangi firmanın hangi PDF formunu yüklersem yükleyeyim şablon o forma dönüşsün ve format kurucuda istediğim gibi
   düzenleyebileyim"): şablon formun ızgarası (sabit parça yok), yan yana tablolar aynı satırda; kâğıtta iki hücre seçilip birleştirilir; belge
   önizlemesi aynı ızgara. 2026-10-24 YAPAY ZEKÂSIZ (reisim: "ben şablon yükledim bu şablondan başlat dedim neden yapay zeka çalışıyor ?", "en
   baştan beri bunu istedim"): yüklenen PDF test içinde üretilen uydurma vektör form (uydurmaForm) ve TARAYICIDA kendi içeriğinden okunur —
   yapay zekâ taklidinin basılı form dalı kalktı; okuma yapay zekâya gitseydi formun yazıları kâğıtta çıkmazdı. Satırdaki "Şablonu bundan kur"
   aynı PDF'i oturumlu dosya ucundan okuyup yeniden kurar. Firma yine E2E_YZ: ayrı firma — eklenen türler öteki testlerin listelerine karışmaz
   (yapay zekâsının açık olması bu testte kullanılmaz). */
test("basılı formdan şablon: PDF yüklenince şablon forma göre kurulur, kurucu ve belge formun görünümünde", async ({ page }, bilgi) => {
  test.skip(bilgi.project.name === "telefon", "format kurucu masaüstü / tablet işi (telefonda yalnız önizleme)");
  test.setTimeout(180_000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  const kod = `B${{ masaustu: "M", tablet: "T" }[bilgi.project.name] ?? "X"}${"ABCDEFGH"[bilgi.retry]}`;
  const form = await uydurmaForm();
  await page.goto(`${Y}/giris`);
  await hazir(page);
  await page.getByLabel("E-posta").fill(E2E_YZ.yonetici.eposta);
  await page.getByLabel("Parola", { exact: true }).fill(E2E_PAROLA);
  await page.getByRole("button", { name: "Giriş yap" }).click();
  await expect(page.locator("header")).toContainText(E2E_YZ.yonetici.ad);
  await page.goto(`${Y}/ekipman-turleri?brans=e`);
  await hazir(page);
  await page.getByRole("button", { name: "Tür ekle" }).click();
  const p = page.getByRole("dialog", { name: "Tür ekle" });
  await p.getByLabel("Tür adı").fill(`Deneme Vinç ${kod}`);
  await p.getByLabel("Kod").fill(kod);
  await p.getByRole("combobox", { name: "Ek-III grubu" }).click();
  await p.getByRole("option", { name: /Elektrik tesisatları/ }).click();
  await p.getByLabel("Periyot (ay)").fill("12");
  await p.getByRole("button", { name: "Kaydet" }).click();
  await expect(page).toHaveURL(/\/ekipman-turleri\/[0-9a-f-]{36}$/, { timeout: 30_000 });
  const turAdresi = new URL(page.url()).pathname;
  await hazir(page);

  /* yükle: şablonu kur işaretli gelir → PDF tarayıcıda okunur → kurucu açılır */
  await page.getByRole("button", { name: /^(Format PDF'i yükle|Yeni PDF yükle)$/ }).click();
  const y = page.getByRole("dialog", { name: /^(Format PDF'i yükle|Yeni PDF yükle)$/ });
  await y.getByLabel("Format PDF'i").setInputFiles({ name: "vinc-formu.pdf", mimeType: "application/pdf", buffer: form });
  await expect(y.getByLabel("Rapor şablonunu bu PDF'e göre kur")).toBeChecked();
  await y.getByRole("button", { name: "Yükle" }).click();
  await expect(page).toHaveURL(/\/sablon\/[0-9a-f-]{36}\/kurucu$/, { timeout: 60_000 });
  const kagit = page.getByRole("article", { name: "Rapor formatı · düzenlenebilir belge" });
  /* serbest düzen: sabit parça yok — formun ızgarası; şerit bütün sütunları kaplayan hücre */
  await expect(kagit).toHaveClass(/rb-serbest/);
  await expect(kagit.locator("table.rb-bas")).toHaveCount(0);
  await expect(kagit.getByRole("cell", { name: "1. FIRMA BILGILERI", exact: true })).toBeVisible();
  /* yan yana iki tablo: ayrı bölümler, aynı satırda */
  const bolumu = (yazi: string) => kagit.locator("section[id^='kb-']").filter({ has: page.getByRole("cell", { name: yazi, exact: true }) });
  await expect(bolumu("HALAT")).toHaveCount(1);
  await expect(bolumu("KANCA")).toHaveCount(1);
  const halat = await bolumu("HALAT").boundingBox(), kanca = await bolumu("KANCA").boundingBox();
  expect(halat && kanca && Math.abs(halat.y - kanca.y) < 4 && kanca.x >= halat.x + halat.width - 4).toBeTruthy();
  /* kâğıtta hücre seçimi ve birleştirme: liste başlığının ilk iki hücresi */
  const liste = bolumu("Madde");
  await liste.getByRole("cell", { name: "No", exact: true }).click();
  await liste.getByRole("cell", { name: "Madde", exact: true }).click({ modifiers: ["Shift"] });
  const secim = page.getByRole("group", { name: / · seçili hücreler$/ });
  await expect(secim).toBeVisible();
  await secim.getByRole("button", { name: "Birleştir" }).click();
  await expect(liste.locator("td[colspan='2']")).toHaveText("No");
  /* belge görünümü kurucuda: sabit bölüm yok */
  await page.getByText("Belge görünümü", { exact: true }).click();
  await expect(page.getByRole("radio", { name: "Yok — belge yalnız benim bölümlerimden" })).toBeChecked();
  await goz(page, "basili-kurucu", bilgi.project.name);
  /* belge önizlemesi: formun ızgarası, yan yana tablolar */
  await page.getByRole("button", { name: "Belge önizlemesi" }).click();
  const belge = page.getByRole("region", { name: "Belge önizlemesi" });
  await expect(belge.locator("article.rb-sayfa.rb-serbest")).toBeVisible();
  await expect(belge.locator(".rb-yan").first()).toBeVisible();
  await expect(belge.getByRole("cell", { name: "1. FIRMA BILGILERI", exact: true })).toBeVisible();
  await goz(page, "basili-belge", bilgi.project.name);
  /* tür sayfası: satırdaki "Şablonu bundan kur" yüklenen PDF'i dosya ucundan okur, taslağı yeniden kurar */
  await page.goto(`${Y}${turAdresi}`);
  await hazir(page);
  await page.getByRole("button", { name: "Şablonu bundan kur" }).first().click();
  await page.getByRole("dialog", { name: /^Şablonu sürüm \d+'den kur$/ }).getByRole("button", { name: "Kur", exact: true }).click();
  await expect(page).toHaveURL(/\/sablon\/[0-9a-f-]{36}\/kurucu$/, { timeout: 60_000 });
  await expect(kagit).toHaveClass(/rb-serbest/);
  await expect(kagit.getByRole("cell", { name: "1. FIRMA BILGILERI", exact: true })).toBeVisible();
});
