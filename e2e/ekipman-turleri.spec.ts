/* NEREDEN GELDİ: K2 Ekipman türleri (2026-10-04) — maket ekipman-turleri.html (M3, onaylı 2026-09-26; AA5 Mekanik / Elektrik sekmeleri).
   Gerçek tarayıcıda, üç genişlikte: tür ekle (hatalı periyot alanın altında söylenir) → tür sayfası: 450 rapor formatı Ek-III grubuna göre
   hazır, yayında (PDF istenmez) · isteğe bağlı format PDF'i yükle → "Sürüm 1 · Güncel", PDF açılır (yeni sekme, oturumlu uç) · Ek-III dışı türde branş seçilir, Elektrik sekmesinde görünür · denetçi görür, ekleyemez. */
import { expect, test } from "@playwright/test";
import { girisli, hazir } from "./yardimci";

const PDF = Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n");

test("ekipman türü: ekle, rapor formatı yükle, elektrik sekmesi; denetçi yalnız görür", async ({ page, context }, bilgi) => {
  const on = { masaustu: "MS", tablet: "TB", telefon: "TL" }[bilgi.project.name] ?? "XX";
  const kod = `${on}${"ABCDEFGH"[bilgi.retry]}`;
  await girisli(page, "yonetici");
  await page.goto("/ekipman-turleri");
  await hazir(page);
  await page.getByRole("button", { name: "Tür ekle" }).click();
  const p = page.getByRole("dialog", { name: "Tür ekle" });
  await p.getByLabel("Tür adı").fill(`Deneme Vinç ${kod}`);
  await p.getByLabel("Kod").fill(kod.toLowerCase());
  await p.getByRole("combobox", { name: "Ek-III grubu" }).click();
  await p.getByRole("option", { name: /Kaldırma ve iletme/ }).click();
  await p.getByLabel("Periyot (ay)").fill("200");
  await p.getByRole("button", { name: "Kaydet" }).click();
  await expect(p.getByText("Periyot 1–120 ay.")).toBeVisible();
  await p.getByLabel("Periyot (ay)").fill("12");
  await p.getByRole("button", { name: "Kaydet" }).click();
  /* ilk açılışta geliştirme sunucusu tür sayfasını derler (yavaş makinede 5 sn aşılıyor) */
  await expect(page).toHaveURL(/\/ekipman-turleri\/[0-9a-f-]{36}$/, { timeout: 30_000 });
  await expect(page.getByRole("heading", { level: 1, name: `Deneme Vinç ${kod}` })).toBeVisible();
  /* 450 (reisim 2026-10-09: "standart olarak pdf formatı yükleyin diyor hala yeni tür ekleyince, default olarak makette yaptıklarımız gibi
     olacak"): rapor formatı hazır ve yayında — kaldırma grubunun maddeleri; PDF istenmez (isteğe bağlı) */
  await expect(page.getByRole("link", { name: /Rapor formatı\s*Sürüm 1/ })).toBeVisible();
  await expect(page.getByText("Ek-III grubuna göre hazır format").first()).toBeVisible();
  await expect(page.getByText("PDF gerekmez", { exact: false })).toBeVisible();
  await expect(page.getByText("yüklenmedi", { exact: false })).toHaveCount(0);

  await hazir(page);
  await page.getByRole("button", { name: "Format PDF'i yükle" }).click();
  const f = page.getByRole("dialog", { name: "Format PDF'i yükle" });
  await f.getByLabel("Format PDF'i").setInputFiles({ name: "vinc-formati.pdf", mimeType: "application/pdf", buffer: PDF });
  await f.getByLabel("Sürüm notu").fill("ilk sürüm");
  await f.getByRole("button", { name: "Yükle" }).click();
  await expect(page.getByText("Format PDF'i yüklendi: sürüm 1.")).toBeVisible();
  await expect(page.getByText("Güncel", { exact: true })).toBeVisible();
  const ac = page.getByRole("link", { name: "PDF'i aç" });
  await expect(ac).toHaveAttribute("target", "_blank");
  /* oturumlu uç tarayıcının içinden istenir (test sürecinin kendi isteği firma adresini çözemez) */
  const yanit = await page.evaluate(async (h) => { const r = await fetch(h!); return [r.status, r.headers.get("content-type")]; }, await ac.getAttribute("href"));
  expect(yanit).toEqual([200, "application/pdf"]);

  /* Ek-III dışı: branş açık sekmeden gelir (Elektrik sekmesinden eklenen Elektrik'e düşer; boş branş sunucuda reddedilir — birim testi) */
  await page.goto("/ekipman-turleri?brans=e");
  await hazir(page);
  await page.getByRole("button", { name: "Tür ekle" }).click();
  const e = page.getByRole("dialog", { name: "Tür ekle" });
  await e.getByLabel("Tür adı").fill(`Deneme Elektrik ${kod}`);
  await e.getByLabel("Kod").fill(`${on}${"STUVWXYZ"[bilgi.retry]}`);
  await e.getByRole("combobox", { name: "Ek-III grubu" }).click();
  await e.getByRole("option", { name: /Diğer \(Ek-III dışı\)/ }).click();
  await expect(e.getByRole("combobox", { name: "Branş" })).toContainText("Elektrik");
  await e.getByLabel("Periyot (ay)").fill("12");
  await e.getByRole("button", { name: "Kaydet" }).click();
  await expect(page.getByRole("heading", { level: 1, name: `Deneme Elektrik ${kod}` })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("Elektrik yönetici onaylar")).toBeVisible();
  await page.goto("/ekipman-turleri?brans=e");
  await hazir(page);
  await expect(page.getByRole("link", { name: `Deneme Elektrik ${kod}` }).first()).toBeAttached();
  await expect(page.getByRole("link", { name: `Deneme Vinç ${kod}` })).toHaveCount(0);

  /* denetçi: görür, ekleyemez */
  await context.clearCookies();
  await girisli(page, "denetci");
  await page.goto("/ekipman-turleri");
  await hazir(page);
  await expect(page.getByRole("heading", { level: 1, name: "Ekipman türleri" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Tür ekle" })).toHaveCount(0);
});

/* 361 (reisim 2026-10-07 "ekipman türü … silinemiyor"): hiç kullanılmamış tür yöneticide Sil → onay (rapor formatı, PDF'ler, fiyat da) → katalog,
   tür yok; kod yeniden kullanılabilir */
test("ekipman türü: kullanılmamış tür silinir, kod serbest kalır", async ({ page }, bilgi) => {
  const on = { masaustu: "MS", tablet: "TB", telefon: "TL" }[bilgi.project.name] ?? "XX";
  const kod = `${on}${"MNOP"[bilgi.retry]}`, ad = `Deneme Silme ${kod}`;
  const ekle = async () => {
    await page.goto("/ekipman-turleri");
    await hazir(page);
    await page.getByRole("button", { name: "Tür ekle" }).click();
    const p = page.getByRole("dialog", { name: "Tür ekle" });
    await p.getByLabel("Tür adı").fill(ad);
    await p.getByLabel("Kod").fill(kod.toLowerCase());
    await p.getByRole("combobox", { name: "Ek-III grubu" }).click();
    await p.getByRole("option", { name: /Kaldırma ve iletme/ }).click();
    await p.getByLabel("Periyot (ay)").fill("12");
    await p.getByRole("button", { name: "Kaydet" }).click();
    await expect(page).toHaveURL(/\/ekipman-turleri\/[0-9a-f-]{36}$/, { timeout: 30_000 });
    await expect(page.getByRole("heading", { level: 1, name: ad })).toBeVisible();
    await hazir(page);
  };
  await girisli(page, "yonetici");
  await ekle();
  await page.getByRole("button", { name: "Sil", exact: true }).click();
  const onay = page.locator("dialog[open]");
  await expect(onay).toContainText(`${kod} · ${ad} kalıcı olarak silinir; rapor formatı, yüklenen PDF'ler ve fiyatı da silinir, kodu yeniden kullanılabilir. Geri alınamaz.`);
  await onay.getByRole("button", { name: "Sil" }).click();
  await expect(page).toHaveURL(/\/ekipman-turleri$/, { timeout: 30_000 });
  await expect(page.getByText(`${kod} · ${ad} silindi.`).first()).toBeVisible();
  await expect(page.getByRole("link", { name: ad })).toHaveCount(0);
  await ekle();
});

/* 436 (reisim 2026-10-09: "EKİPMAN TÜRLERİNDE BAKANLIK FORMATLARINI DA GÖREMEDİM"): Elektrik sekmesinde Bakanlık rapor formatları listelenir
   (tür eklenmeden de) → önizleme sayfası → "Tür olarak ekle" (ad / kod / periyot önerili) → tür + şablondan taslak → taslağın sayfası; listede
   formatı kullanan tür görünür. Mekanik sekmesinde (467) Bakanlığın mekanik formatları (kule kren, asılı erişim, LPG) ve hazır şablon (kompresör). */
test("Bakanlık rapor formatları: listede görünür, önizlenir, tür olarak eklenir (taslak hazır)", async ({ page }, bilgi) => {
  const on = { masaustu: "MS", tablet: "TB", telefon: "TL" }[bilgi.project.name] ?? "XX";
  const kod = `Y${on.slice(0, 1)}${"ABCDEFGH"[bilgi.retry]}`;
  await girisli(page, "yonetici");
  await page.goto("/ekipman-turleri?brans=e");
  await hazir(page);
  const liste = page.getByRole("region", { name: "Bakanlık rapor formatları" });
  for (const k of ["ZPKR01", "ZPKR02", "ZPKR03", "ZPKR04", "ZPKR05"]) await expect(liste.getByRole("link", { name: k })).toBeVisible();
  await liste.getByRole("link", { name: "ZPKR03" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Yıldırımdan Korunma Tesisatı Periyodik Kontrol Raporu" })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("Bakanlık formatı", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "ZPKK03 kontrol kriterleri" })).toBeVisible();
  await expect(page.getByText("Koruma borusu tesis edilmiş midir?").first()).toBeVisible();
  await page.getByRole("button", { name: "Tür olarak ekle" }).click();
  const p = page.getByRole("dialog", { name: "Tür ekle · ZPKR03" });
  await expect(p.getByLabel("Tür adı")).toHaveValue("Yıldırımdan korunma tesisatı");
  await expect(p.getByLabel("Kod")).toHaveValue("YKT");
  await p.getByLabel("Tür adı").fill(`Yıldırımdan korunma ${kod}`);
  await p.getByLabel("Kod").fill(kod);
  await p.getByRole("button", { name: "Kaydet" }).click();
  await expect(page).toHaveURL(/\/ekipman-turleri\/[0-9a-f-]{36}\/sablon\/[0-9a-f-]{36}$/, { timeout: 30_000 });
  await expect(page.getByText("Taslak", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Koruma borusu tesis edilmiş midir?").first()).toBeVisible();
  await page.goto("/ekipman-turleri?brans=e");
  await hazir(page);
  await expect(liste.getByRole("link", { name: `Yıldırımdan korunma ${kod}` })).toBeVisible();
  await page.goto("/ekipman-turleri");
  await hazir(page);
  const mekanik = page.getByRole("region", { name: "Bakanlık rapor formatları" });
  for (const k of ["ZPKR06", "ZPKR07", "ZPMR01", "ZYDR01"]) await expect(mekanik.getByRole("link", { name: k })).toBeVisible();
  await expect(mekanik.getByRole("link", { name: "Kompresör (genel)" })).toBeVisible();
});

/* 437 (reisim 2026-10-09: "HALA BAKANLIK FORMATLARI YOK DEFAULT OLARAK GELMESİ GEREKİYOR … RAPOR ŞABLONUNDA SIFIRDAN RAPOR ŞABLONU OLUŞTURMAK YOK
   … RAPOR FORMATI PDFLERİ DE STANDART OLARAK BAKANLIKTAN GELECEK"): firmada Bakanlık türleri hazır (Elektrik sekmesinde beş tür); tür sayfasında
   Bakanlığın resmî PDF'i (sürüm 1, "Bakanlık formatı") ve yayındaki rapor şablonu; şablon önizlemesinde resmî form, kriter belgesinde Bakanlık
   belgesi açılır (oturumlu uç, PDF). Sıfırdan oluştur: onay → boş taslak Format kurucuda. */
test("Bakanlık türleri hazır: resmî PDF ve yayındaki şablon; sıfırdan rapor şablonu", async ({ page }, bilgi) => {
  test.setTimeout(180_000);   // ilk açılışta kurulum + soğuk derleme
  const on = { masaustu: "MS", tablet: "TB", telefon: "TL" }[bilgi.project.name] ?? "XX";
  const kod = `Z${on.slice(0, 1)}${"ABCDEFGH"[bilgi.retry]}`;
  const pdfMi = async (href: string | null) => page.evaluate(async (h) => { const r = await fetch(h!); return [r.status, r.headers.get("content-type")]; }, href);
  await girisli(page, "yonetici");
  await page.goto("/ekipman-turleri?brans=e");
  await hazir(page);
  for (const ad of ["Alçak gerilim topraklama tesisatı", "Elektrik iç tesisatı", "Yıldırımdan korunma tesisatı", "Yangın algılama ve uyarı sistemi", "Trafo"]) {
    await expect(page.getByRole("link", { name: ad, exact: true }).first()).toBeAttached({ timeout: 30_000 });
  }
  await page.getByRole("link", { name: "Trafo", exact: true }).first().click();
  await expect(page.getByRole("heading", { level: 1, name: "Trafo" })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("Bakanlık formatı", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Güncel", { exact: true })).toBeVisible();
  expect(await pdfMi(await page.getByRole("link", { name: "PDF'i aç" }).getAttribute("href"))).toEqual([200, "application/pdf"]);
  await expect(page.getByText("Yayında", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("TS EN 50522").first()).toBeVisible();   // kontrol metodu standardı hazır listeden
  await expect(page.getByRole("listitem").filter({ hasText: "Topraklama ölçer (3 uçlu / pens)" })).toBeVisible();   // 440: ölçüm cihazı türü hazır

  await page.goto("/ekipman-turleri/sablon/ZPKR05");
  await hazir(page);
  const resmi = page.getByRole("link", { name: "Resmî form (PDF)" });
  await expect(resmi).toHaveAttribute("target", "_blank");
  expect(await pdfMi(await resmi.getAttribute("href"))).toEqual([200, "application/pdf"]);
  await page.goto("/dokumanlar/kriterler/ZPKK05");
  await hazir(page);
  expect(await pdfMi(await page.getByRole("link", { name: "Bakanlık belgesi (PDF)" }).getAttribute("href"))).toEqual([200, "application/pdf"]);

  /* sıfırdan: yeni türde onay → boş taslak kurucuda */
  await page.goto("/ekipman-turleri");
  await hazir(page);
  await page.getByRole("button", { name: "Tür ekle" }).click();
  const p = page.getByRole("dialog", { name: "Tür ekle" });
  await p.getByLabel("Tür adı").fill(`Deneme Sıfırdan ${kod}`);
  await p.getByLabel("Kod").fill(kod);
  await p.getByRole("combobox", { name: "Ek-III grubu" }).click();
  await p.getByRole("option", { name: /Kaldırma ve iletme/ }).click();
  await p.getByLabel("Periyot (ay)").fill("12");
  await p.getByRole("button", { name: "Kaydet" }).click();
  await expect(page.getByRole("heading", { level: 1, name: `Deneme Sıfırdan ${kod}` })).toBeVisible({ timeout: 30_000 });
  await hazir(page);
  await page.getByRole("button", { name: "Sıfırdan oluştur" }).click();
  const onay = page.getByRole("dialog", { name: "Sıfırdan oluştur" });
  await expect(onay).toContainText("boş bir rapor şablonu taslağı açılır");
  await onay.getByRole("button", { name: "Oluştur" }).click();
  await expect(page).toHaveURL(/\/sablon\/[0-9a-f-]{36}\/kurucu$/, { timeout: 30_000 });
  await expect(page.getByRole("heading", { level: 1, name: /^Format kurucu · / })).toBeVisible();
  /* 529: kurucunun tuşlarında "S.A.Y Chat ayarları" — kendi sayfasına */
  await expect(page.getByRole("link", { name: "S.A.Y Chat ayarları" })).toHaveAttribute("href", /^\/ekipman-turleri\/[0-9a-f-]{36}\/say-chat$/);
  /* 451: kâğıtta (geniş ekran) ya da belge önizlemesinde (telefon) — görünen ilk eşleşme */
  await expect(page.getByText("Kontrol maddeleri").filter({ visible: true }).first()).toBeVisible();
});

/* 523 — S.A.Y Chat ayarları (pkproje §3.10 m.13–16; maket 521 ekran 12): kayıt yoksa formattan hazır (ekipman bilgileri + Not; test değerleri okunacak
   başlık); aynı alan iki satırda → hata alanın altında, odak orada; düzeltilip Kaydet → sürüm 1; telefon önizlemesi satırları sırayla gösterir;
   Vazgeç taslağı bırakır; denetçi görür, değiştiremez. 529 (reisim 2026-10-13: "burda kötü durmuş … tuşa basınca ilgili sayfaya gitsin"): tür
   sayfasında kısa bölüm (satır sırası, okunacak fotoğraflar) + "Düzenle" → kendi sayfası /ekipman-turleri/<tür>/say-chat; düzenleme orada. */
test("S.A.Y Chat ayarları: formattan hazır, satır ekle, hata, kaydet, sürüm; denetçi yalnız görür", async ({ page, context }, bilgi) => {
  test.setTimeout(120_000);
  /* tür kodu 2–3 büyük harf (0013): genişlik + deneme başına ayrı */
  const on = { masaustu: "QC", tablet: "WC", telefon: "ZC" }[bilgi.project.name] ?? "XC";
  const kod = `${on}${"ABCDEFGH"[bilgi.retry]}`;
  await girisli(page, "yonetici");
  await page.goto("/ekipman-turleri");
  await hazir(page);
  await page.getByRole("button", { name: "Tür ekle" }).click();
  const p = page.getByRole("dialog", { name: "Tür ekle" });
  await p.getByLabel("Tür adı").fill(`Deneme Chat ${kod}`);
  await p.getByLabel("Kod").fill(kod.toLowerCase());
  await p.getByRole("combobox", { name: "Ek-III grubu" }).click();
  await p.getByRole("option", { name: /Kaldırma ve iletme/ }).click();
  await p.getByLabel("Periyot (ay)").fill("12");
  await p.getByRole("button", { name: "Kaydet" }).click();
  await expect(page).toHaveURL(/\/ekipman-turleri\/[0-9a-f-]{36}$/, { timeout: 30_000 });
  const adres = page.url();
  await hazir(page);

  /* tür sayfasında kısa bölüm: ne olduğu, satır sırası; Düzenle → kendi sayfası */
  const turBolum = page.getByRole("region", { name: "S.A.Y Chat ayarları" });
  await expect(turBolum).toContainText("formattan hazır");
  /* 2026-10-18 (reisim: "bu ve benzeri, yaratıcıyı hedef alan açıklamaları kaldır, çok fazla ai ürünü olduğu belli oluyor"): açıklama kısaldı */
  await expect(turBolum).toContainText("Mesaj satırları");
  await expect(turBolum).toContainText("1. Marka");
  await turBolum.getByRole("link", { name: "Düzenle" }).click();
  await expect(page).toHaveURL(/\/ekipman-turleri\/[0-9a-f-]{36}\/say-chat$/, { timeout: 30_000 });
  await hazir(page);
  await expect(page.getByRole("heading", { level: 1, name: `S.A.Y Chat ayarları · Deneme Chat ${kod}` })).toBeVisible();
  const bolum = page.locator("main");
  const ozet = page.locator("#sca-durum");
  await expect(ozet).toContainText("formattan hazır");
  const satirlar = bolum.getByRole("list", { name: "Mesaj satırları" });
  await expect(satirlar).toBeVisible();
  await expect(bolum.getByLabel("1. satır · telefonda yazan")).toHaveValue("Marka");
  const n = await satirlar.getByRole("listitem").count();
  await expect(bolum.getByLabel(`${n}. satır · telefonda yazan`)).toHaveValue("Not");
  await expect(bolum.getByRole("button", { name: "Kaydet" })).toBeDisabled();
  /* Ek-III grubunun hazır formatında fotoğraftan doldurması açık bölüm yok (525: başlıklar yalnız onlardan) */
  await expect(bolum.getByText("Okunacak fotoğraf başlığı yok.")).toBeVisible();

  /* satır ekle: alan seçilmeden Kaydet → hata; aynı alan (yorum) → hata; Not satırı silinince geçer */
  await bolum.getByRole("button", { name: "Satır ekle" }).click();
  const yeni = bolum.getByLabel(`${n + 1}. satır · telefonda yazan`);
  await expect(yeni).toBeFocused();
  await yeni.fill("Şebeke gerilimi");
  await bolum.getByLabel(`${n + 1}. satır · hazır değer`).fill("220 V");
  await bolum.getByRole("button", { name: "Kaydet" }).click();
  await expect(bolum.getByText(`${n + 1}. satırın rapordaki alanı seçilmedi.`)).toBeVisible();
  await bolum.getByRole("combobox", { name: `${n + 1}. satır · rapordaki alan` }).click();
  await page.getByRole("option", { name: "Muayene uzmanı yorumu" }).click();
  await bolum.getByRole("button", { name: "Kaydet" }).click();
  await expect(bolum.getByText(`${n + 1}. satırın alanı başka bir satırda da seçili.`)).toBeVisible();
  /* Not satırını sil → yorum artık yalnız yeni satırda */
  await bolum.getByRole("button", { name: `${n}. satırı sil` }).click();
  await expect(satirlar.getByRole("listitem")).toHaveCount(n);
  await expect(bolum.getByRole("complementary", { name: "Telefonda böyle görünür" })).toContainText("Şebeke gerilimi · 220 V");
  await expect(ozet).toContainText("kaydedilmedi");
  await bolum.getByRole("button", { name: "Kaydet" }).click();
  await expect(page.getByText("S.A.Y Chat ayarları kaydedildi (sürüm 1); yeni kayıtlarda geçerli.").first()).toBeVisible();
  await expect(ozet).toContainText("sürüm 1");
  await expect(ozet).toContainText(`${n} satır · 0 okunacak fotoğraf`);

  /* yenileyince kayıtlı; Vazgeç taslağı bırakır */
  await page.reload();
  await hazir(page);
  await expect(bolum.getByLabel(`${n}. satır · telefonda yazan`)).toHaveValue("Şebeke gerilimi");
  await bolum.getByLabel("1. satır · telefonda yazan").fill("Markası");
  await bolum.getByRole("button", { name: "Vazgeç" }).click();
  await expect(bolum.getByLabel("1. satır · telefonda yazan")).toHaveValue("Marka");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), "yana taşma yok").toBe(true);

  /* denetçi görür, değiştiremez: tür sayfasında "Görüntüle" */
  await context.clearCookies();
  await girisli(page, "denetci");
  await page.goto(adres);
  await hazir(page);
  await page.getByRole("region", { name: "S.A.Y Chat ayarları" }).getByRole("link", { name: "Görüntüle" }).click();
  await expect(page).toHaveURL(/\/say-chat$/, { timeout: 30_000 });
  await hazir(page);
  await expect(bolum.getByLabel("1. satır · telefonda yazan")).toBeDisabled();
  await expect(bolum.getByRole("button", { name: "Kaydet" })).toHaveCount(0);
  await expect(bolum.getByRole("button", { name: "Satır ekle" })).toHaveCount(0);
});
