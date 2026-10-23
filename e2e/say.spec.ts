/* NEREDEN GELDİ: 380 — S.A.Y saha asistanı (maket say.js BB6; reisim 2026-10-03: "her yer de gözükecek … daha yuvarlak", "sayfa değişince vs geçmiş
   silinmez"). Gerçek sunucuda, üç genişlikte, yapay zekâsı açık uydurma firmada (yerel Anthropic taklidi — gerçek hizmete istek gitmez; istekte
   kişi / müşteri bilgisi olursa taklit reddeder): sağ altta yuvarlak düğme → panel (odak soru alanında) → "Beni ne bekliyor?" kuralla → serbest
   soru yapay zekâdan → başka sayfaya geçince panel ve geçmiş kalır, yer ayracı → sayfa yenilenince de → Esc kapatır, odak düğmede → "Sohbeti
   temizle" önce sorar. Yapay zekâsı kapalı firmada düğme yok. Telefonda panel tam ekran; yana taşma yok.
   522: ataç → fotoğraf / belge eki (desteklenmeyen dosya söylenir, × çıkarır), ekli soru gider, gönderilen soruda adı görünür.
   550 (sunum 546 — reisim 2026-10-14: "S.A.Y. de herhangi bir kısıt kural vb olmasını istemiyorum … aynı claud kullanır gibi", "öneri soruları olarak
   sadece fotoğrafları oku ve gir kalsın başka bir şey olmasın", "say asistan veya chat açıldığında tüm sayfa kayıyor"): tek hazır tuş (rapor dışında
   kapalı), her soru Haiku'ya; cevap Markdown (madde listesi, kalın); yazı kutusu çok satırlı (Shift+Enter yeni satır, Enter gönderir); panel
   açılınca sayfa kıpırdamaz, Kaydet örtülmez; rapordayken "… alanına … yaz" alana yazar (işaretli), Geri al döndürür.
   555 (reisim 2026-10-14: "bu ve benzeri tüm saçma açıklamaları kaldır"): panelde açıklama yazısı yok — boş sohbet boş, alt yazı yalnız model adı,
   hazır tuş yalnız rapordayken görünür.
   557 (sunum 557 · 2. tur — reisim 2026-10-14): mesaj Gönder'e basınca HEMEN balon ve "Düşünüyor" balonu (taklit "[yavaş]" soruya 1,5 sn sonra
   cevap verir); Küçült (yalnız başlık) / Büyüt; sohbet yukarı kaydırılınca "En alta in"; rapordayken S.A.Y'ın cevabı işin SONUCUYLA ("Yaptım …",
   kilitli SGK için nedenli "Yapamadım …"), alttaki bildirim yok.
   561 (reisim 2026-10-15: "rapor teknik yönetici onayında olduğu için değiştiremiyordu ama açıkta rapor göremiyorum dedi ayrıca chati yukarıdan tutup
   aşağıya doğru küçültmeyi yapamadım"): panel üstteki tutamaktan ve başlıktan sürüklenerek kısalır, Home tam boy; yazamadığı raporda (yönetici,
   denetçinin raporunda) S.A.Y raporu bilir ("Rapor <no>") ve nedenini söyler.
   2026-10-23 S.A.Y BAŞTAN (reisim: "direk claude da haiku nasıl çalışıyor ise direk o şekilde", "hiç bir kısıtı olmasın"): cevap AKIŞLA (taklit
   her istekte denetler: konuşma olduğu gibi geri gelir, her adımda düşünme açık, bütün araçlar aynı sırayla, sayfa notu yerinde); ek konuşmada kalır
   (sonraki soruda da görülür — "[ek-hatirla]"), her dosya türü eklenir (metin dosyası da); rapora / formata yazmadan önce S.A.Y ekranın hâlini
   ekran_durumu ile alır. Eski "aracı çağırmadan yazdım" düzeltme turu kalktı (kasıtlı). */
import { expect, test } from "@playwright/test";
import { E2E_KAPI, E2E_PAROLA, E2E_YZ } from "./hesaplar";
import { bolumleriAc, girisli, hazir, panelBoyunuDene } from "./yardimci";

const Y = `http://${E2E_YZ.firma.kisaAd}.localhost:${E2E_KAPI}`;
const TASMA = () => document.documentElement.scrollWidth <= window.innerWidth;

test("S.A.Y: düğme, hızlı soru, serbest soru, sayfa değişince ve yenileyince geçmiş, Esc, temizle", async ({ page }, bilgi) => {
  test.setTimeout(120_000);
  await page.goto(`${Y}/giris`);
  await hazir(page);
  await page.getByLabel("E-posta").fill(E2E_YZ.denetci.eposta);
  await page.getByLabel("Parola", { exact: true }).fill(E2E_PAROLA);
  await page.getByRole("button", { name: "Giriş yap" }).click();
  await expect(page.locator("header")).toContainText(E2E_YZ.denetci.ad);
  await hazir(page);

  const fab = page.getByRole("button", { name: "S.A.Y — saha asistanı" });
  await expect(fab).toBeVisible({ timeout: 30_000 });
  await fab.click();
  const panel = page.getByRole("dialog", { name: "S.A.Y" });
  await expect(panel).toBeVisible();
  await expect(panel.getByLabel("S.A.Y'a sor")).toBeFocused();
  /* aynı hesap öteki genişliklerde de kullanıldıysa (tek sunucu) önce temizlenir */
  const temizle = panel.getByRole("button", { name: "Sohbeti temizle" });
  if (await temizle.isVisible()) {
    await temizle.click();
    await page.getByRole("dialog", { name: "Sohbeti temizle" }).getByRole("button", { name: "Temizle" }).click();
  }
  /* 555: boş sohbette açıklama yok; alt yazı yalnız model adı */
  await expect(panel.getByRole("listitem")).toHaveCount(0);
  await expect(panel.getByText("Claude Haiku 5.5", { exact: true })).toBeVisible();
  for (const metin of ["Merhaba", "Her konuda", "Sohbeti yalnız siz görürsünüz", "Ekler en çok", "Bu rapordayım", "ne yazayım"]) await expect(panel).not.toContainText(metin);
  /* 550 + 555: tek hazır tuş, rapor dışında yok; eski hazır sorular yok */
  await expect(panel.getByRole("button", { name: "Fotoğrafları oku ve gir" })).toHaveCount(0);
  for (const ad of ["Beni ne bekliyor?", "Bu sayfada ne yapılır?", "Eksik alanlar neler?", "Sonuç ne olmalı?", "Maddeleri uygun işaretle"]) {
    await expect(panel.getByRole("button", { name: ad })).toHaveCount(0);
  }
  if (bilgi.project.name === "telefon") {
    const k = await panel.boundingBox();
    expect(k && Math.round(k.width)).toBe(page.viewportSize()!.width);
  }

  /* serbest soru: yapay zekâdan (taklit); 550: çok satırlı — Shift+Enter yeni satır, Enter gönderir; cevap Markdown (madde listesi) */
  const liste = panel.getByRole("list").first();
  const soru = panel.getByLabel("S.A.Y'a sor");
  await soru.fill("Planımı nasıl kabul ederim? [yavaş]");
  await soru.press("Shift+Enter");
  await expect(soru).toHaveValue("Planımı nasıl kabul ederim? [yavaş]\n");
  await soru.press("Enter");
  /* 557: mesaj hemen balon, kutu boşalır, "Düşünüyor" balonu (cevap 1,5 sn sonra) */
  await expect(liste.getByRole("listitem").filter({ hasText: "Planımı nasıl kabul ederim? [yavaş]" }).first()).toBeVisible({ timeout: 1_000 });
  await expect(soru).toHaveValue("");
  await expect(panel.locator("[data-say-bekleme]")).toContainText("Düşünüyor", { timeout: 1_000 });
  await expect(liste).toContainText("Deneme cevabı: “Planımı nasıl kabul ederim? [yavaş]” için menüden Planlar'ı açın.", { timeout: 30_000 });
  await expect(panel.locator("[data-say-bekleme]")).toHaveCount(0);
  await expect(liste.locator("ul li").filter({ hasText: "Bu bir taklit cevaptır." }).first()).toBeVisible();
  /* 557: Küçült — yalnız başlık; Büyüt — yazı kutusu geri */
  await panel.getByRole("button", { name: "Küçült" }).click();
  await expect(panel).toHaveAttribute("data-kucuk", "true");
  await expect(panel.getByLabel("S.A.Y'a sor")).toBeHidden();
  await panel.getByRole("button", { name: "Büyüt" }).click();
  await expect(panel.getByLabel("S.A.Y'a sor")).toBeVisible();
  /* 561: üstten tutup sürükleyince kısalır (tutamak ve başlık), Home tam boy */
  await panelBoyunuDene(page, panel, /^S\.A\.Y'ın boyu/, "S.A.Y");

  /* 522 ek: ataç → menü (Fotoğraf çek · Galeriden seç · Belge ekle); 2026-10-23: her dosya türü eklenir (metin dosyası da — sınır yok); eklenen
     kutunun üstünde, × çıkarır; soruyla gider (taklit eki sayar), gönderilen soruda adı görünür, kutu boşalır; ek konuşmada kalır */
  const atac = panel.getByRole("button", { name: "Ek ekle: fotoğraf ya da belge" });
  await atac.click();
  await expect(atac).toHaveAttribute("aria-expanded", "true");
  for (const ad of ["Fotoğraf çek", "Galeriden seç", "Belge ekle"]) await expect(panel.getByText(ad).first()).toBeVisible();
  await panel.getByLabel(/Belge ekle/).setInputFiles({ name: "notlar.txt", mimeType: "text/plain", buffer: Buffer.from("deneme") });
  await expect(atac).toHaveAttribute("aria-expanded", "false");
  await expect(panel.getByRole("list", { name: "Ekler" })).toContainText("notlar.txt");
  await panel.getByRole("button", { name: "notlar.txt ekini çıkar" }).click();
  await atac.click();
  await panel.getByLabel(/Belge ekle/).setInputFiles({ name: "kilavuz.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\n%%EOF") });
  await atac.click();
  await panel.getByLabel("Galeriden seç").setInputFiles({ name: "etiket.png", mimeType: "image/png",
    buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFElEQVR4nGP4z8DAwAAi/v///x8AHu8F+5BApdwAAAAASUVORK5CYII=", "base64") });
  const bekleyenEkler = panel.getByRole("list", { name: "Ekler" });
  await expect(bekleyenEkler.getByRole("listitem")).toHaveCount(2);
  await expect(bekleyenEkler).toContainText("kilavuz.pdf");
  await expect(bekleyenEkler).toContainText("etiket.png");
  await expect(bekleyenEkler.locator("img")).toHaveCount(1);
  await panel.getByRole("button", { name: "kilavuz.pdf ekini çıkar" }).click();
  await expect(bekleyenEkler.getByRole("listitem")).toHaveCount(1);
  await expect(panel.getByLabel("S.A.Y'a sor")).toBeFocused();
  await panel.getByLabel("S.A.Y'a sor").fill("Bu etikette ne yazıyor?");
  await panel.getByLabel("S.A.Y'a sor").press("Enter");
  await expect(liste).toContainText("Deneme cevabı: “Bu etikette ne yazıyor?” için menüden Planlar'ı açın.", { timeout: 30_000 });
  await expect(liste).toContainText("1 eki okudum.");
  await expect(liste.getByRole("listitem").filter({ hasText: "Bu etikette ne yazıyor?" }).first()).toContainText("etiket.png");
  await expect(panel.getByRole("list", { name: "Ekler" })).toHaveCount(1, { timeout: 5_000 });   // yalnız gönderilen sorudaki
  /* 2026-10-23: ek konuşmada kalır — sonraki soruda S.A.Y onu yine görür (taklit konuşmanın bütün eklerini sayar) */
  await panel.getByLabel("S.A.Y'a sor").fill("Az önceki etiketi hatırlıyor musun? [ek-hatirla]");
  await panel.getByLabel("S.A.Y'a sor").press("Enter");
  await expect(liste).toContainText("Konuşmada 1 ek var.", { timeout: 30_000 });
  expect(await page.evaluate(TASMA), "yana taşma yok").toBe(true);

  /* başka sayfaya geçince panel açık, geçmiş duruyor; yeni yer ayracı */
  if (bilgi.project.name !== "masaustu") await page.keyboard.press("Escape");   // panel menüyü örtebilir: kapat, menüden git, düğmeyle aç
  await page.goto(`${Y}/planlar`);
  await hazir(page);
  /* panel bu cihazda açık bırakıldıysa kendiliğinden açılır (durum gelince): önce ikisinden biri görünsün, sonra gerekirse düğme */
  await expect(panel.or(fab)).toBeVisible({ timeout: 30_000 });
  if (!(await panel.isVisible())) await fab.click();
  await expect(panel).toBeVisible();
  await expect(panel).toContainText("Deneme cevabı:");
  await panel.getByLabel("S.A.Y'a sor").fill("Bu sayfada ne yapılır?");
  await panel.getByLabel("S.A.Y'a sor").press("Enter");
  await expect(liste).toContainText("Deneme cevabı: “Bu sayfada ne yapılır?”", { timeout: 30_000 });
  await expect(liste.getByRole("listitem").filter({ hasText: /^Planlar$/ })).toHaveCount(1);

  /* yenileyince de geçmiş */
  await page.reload();
  await hazir(page);
  await expect(panel.or(fab)).toBeVisible({ timeout: 30_000 });
  if (!(await panel.isVisible())) await fab.click();
  await expect(panel).toContainText("Deneme cevabı: “Bu sayfada ne yapılır?”", { timeout: 30_000 });
  expect(await page.evaluate(TASMA), "yana taşma yok").toBe(true);

  /* Esc kapatır, odak düğmede */
  await panel.getByLabel("S.A.Y'a sor").focus();
  await page.keyboard.press("Escape");
  await expect(panel).toHaveCount(0);
  await expect(fab).toBeFocused();

  /* temizle önce sorar; vazgeçince geçmiş durur, onaylanınca boş */
  await fab.click();
  await panel.getByRole("button", { name: "Sohbeti temizle" }).click();
  const onay = page.getByRole("dialog", { name: "Sohbeti temizle" });
  await onay.getByRole("button", { name: "Vazgeç" }).click();
  await expect(panel).toContainText("Deneme cevabı:");
  await panel.getByRole("button", { name: "Sohbeti temizle" }).click();
  await onay.getByRole("button", { name: "Temizle" }).click();
  await expect(page.getByText("Sohbet temizlendi.").first()).toBeVisible();
  await expect(panel.getByRole("listitem")).toHaveCount(0);
  await expect(panel).not.toContainText("Deneme cevabı:");
});

test("S.A.Y: yapay zekâsı kapalı firmada düğme yok", async ({ page }) => {
  await girisli(page, "denetci");
  await page.goto("/");
  await hazir(page);
  await expect(page.getByRole("heading", { level: 1, name: "Ana sayfa" })).toBeVisible();
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("button", { name: "S.A.Y — saha asistanı" })).toHaveCount(0);
});

/* 550 (sunum 546): rapor ekranında S.A.Y — tek hazır tuş; panel açılınca sayfa kıpırdamaz, Kaydet panelin altında kalmaz; "<alan> alanına <değer> yaz"
   → Haiku (taklit) haritadaki yer kimliğiyle rapora_yaz → alan dolar, işaretli (yeşil); iletinin altındaki "Geri al" döndürür; serbest soru haritayı
   taşır (taklit "Raporu okudum." der) */
test("S.A.Y rapor ekranında: sayfa kıpırdamaz; söylenen alana yazar (işaretli), Geri al; harita", async ({ page }, bilgi) => {
  test.setTimeout(120_000);
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

  const fab = page.getByRole("button", { name: "S.A.Y — saha asistanı" });
  const panel = page.getByRole("dialog", { name: "S.A.Y" });
  await expect(panel.or(fab)).toBeVisible({ timeout: 30_000 });
  if (await panel.isVisible()) { await page.keyboard.press("Escape"); await expect(panel).toHaveCount(0); }
  /* 547 (K3): panel açılınca sayfa KIPIRDAMAZ — main'in genişliği ve yeri aynı */
  const once = await page.locator("main").evaluate((e) => { const r = e.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.width)]; });
  await fab.click();
  await expect(panel).toBeVisible();
  const sonra = await page.locator("main").evaluate((e) => { const r = e.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.width)]; });
  expect(sonra, "sayfa kaymadı").toEqual(once);
  /* masaüstü / tablet: Kaydet panelin altında değil (tuş kabı panelin solunda) */
  if (bilgi.project.name !== "telefon") {
    const kaydet = page.getByRole("button", { name: "Kaydet", exact: true });
    await expect(kaydet).toBeVisible();
    const ustte = await kaydet.evaluate((e) => { const r = e.getBoundingClientRect(); const u = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !!u && (u === e || e.contains(u)); });
    expect(ustte, "Kaydet panelin altında kalmadı").toBe(true);
  }
  await expect(panel).not.toContainText("Bu rapordayım");   // 555: açıklama yok
  await expect(panel.getByRole("button", { name: "Fotoğrafları oku ve gir" })).toBeEnabled();
  for (const ad of ["Maddeleri uygun işaretle", "Eksik alanlar neler?", "Sonuç ne olmalı?"]) await expect(panel.getByRole("button", { name: ad })).toHaveCount(0);

  /* 550: söylenen alana yazar — işaretli; Geri al döndürür */
  const seri = page.getByRole("textbox", { name: "Seri no", exact: true });
  const onceki = await seri.inputValue();
  await panel.getByLabel("S.A.Y'a sor").fill("Seri no alanına SN-TAKLIT yaz");
  await panel.getByLabel("S.A.Y'a sor").press("Enter");
  const liste = panel.getByRole("list").first();
  await expect(seri).toHaveValue("SN-TAKLIT", { timeout: 30_000 });
  await expect(seri).toHaveAttribute("data-say-giris", "emin");
  /* 557: S.A.Y'ın cevabı işin sonucuyla (taklit sonucu okur); "yazıyorum" ve alttaki bildirim yok */
  await expect(liste).toContainText(/Yaptım: .*Seri no\./, { timeout: 30_000 });
  await expect(liste).not.toContainText("giriş yapıyorum");
  await expect(page.getByText("S.A.Y 1 değer girdi")).toHaveCount(0);
  await panel.getByRole("button", { name: "Geri al" }).last().click();
  await expect(seri).toHaveValue(onceki);
  await expect(liste).toContainText("1 girişi geri aldım.");
  /* 557: elle girilemeyen (kilitli SGK) S.A.Y ile de girilemez — nedeniyle söyler */
  await panel.getByLabel("S.A.Y'a sor").fill("SGK DETSİS NO alanına 123 yaz");
  await panel.getByLabel("S.A.Y'a sor").press("Enter");
  await expect(liste).toContainText("Yapamadım: SGK DETSİS NO: bu formatta kilitli; elle de değiştirilemiyor", { timeout: 30_000 });
  /* 557: en alta in — sohbet yukarı kaydırılınca çıkar, basınca son iletiye */
  const govde = panel.locator("#say-govde");
  if (await govde.evaluate((g) => g.scrollHeight > g.clientHeight + 40)) {
    await govde.evaluate((g) => { g.scrollTop = 0; g.dispatchEvent(new Event("scroll")); });
    await panel.getByRole("button", { name: "En alta in" }).click();
    await expect(panel.getByRole("button", { name: "En alta in" })).toHaveCount(0);
    expect(await govde.evaluate((g) => g.scrollHeight - g.scrollTop - g.clientHeight < 40)).toBe(true);
  }

  /* serbest soru açık raporun haritasını taşır (taklit "Raporu okudum." der); yer "Rapor <no>" */
  await panel.getByLabel("S.A.Y'a sor").fill("Bu raporda neye dikkat edeyim?");
  await panel.getByLabel("S.A.Y'a sor").press("Enter");
  await expect(liste).toContainText("Raporu okudum.", { timeout: 30_000 });
  await expect(liste.getByRole("listitem").filter({ hasText: /^Rapor YZ-[0-9]{4}-[0-9]{3}/ }).first()).toBeVisible();
});

/* 2026-10-15 (pkproje §9 "S.A.Y CLAUDE GİBİ" — reisim: "sik sik duruyor tekrar tekrar soruyor", "yap işte yap dedim"; "aynı tabloya 50 satır ekle" 17
   satır ekleyip "kalanları da ekleyeyim mi?" diyordu): (A) İŞ DÖNGÜSÜ — taklit "[parça]" isteğinde satırları 20'şer ekler, sonucu görünce kalanını
   ekler, bitince söyler (araya soru yok); bütün işin Geri al'ı son iletinin altında. (C) tek komutla 50 satır, No sütunu son sayıdan artarak.
   2026-10-23 (S.A.Y baştan): (D) sahte "yaptım" düzeltme turu kalktı (kasıtlı) — taklit her adımda düşünmenin açık olduğunu denetler */
test("S.A.Y iş döngüsü: satırlar parça parça ve tek komutla eklenir (No artarak), Geri al", async ({ page }, bilgi) => {
  test.setTimeout(180_000);
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

  const fab = page.getByRole("button", { name: "S.A.Y — saha asistanı" });
  const panel = page.getByRole("dialog", { name: "S.A.Y" });
  await expect(panel.or(fab)).toBeVisible({ timeout: 30_000 });
  if (!(await panel.isVisible())) await fab.click();
  await expect(panel).toBeVisible();
  const liste = panel.getByRole("list").first(), son = liste.getByRole("listitem").last();
  const sor = async (metin: string) => { await panel.getByLabel("S.A.Y'a sor").fill(metin); await panel.getByLabel("S.A.Y'a sor").press("Enter"); };

  /* tablonun şimdiki satırları ve son No (başka testler kaydetmiş olabilir: "F3" → F4 …). 2026-10-16 (reisim: "herhangi bir tabloda 20 den sonrası
     sayfalı olacak … diğer sayfalara doğru aksın"; beklenti değişikliği — önceki hâli bütün satırları ekranda sayıyordu): tablo 20'şer sayfalı, ekranda
     yalnız açık sayfanın satırları; tablonun bütün satır sayısı bölgenin data-satir'inde, satır numarası genel ("33. satır · No"); eklenen satırlar
     eklemenin başladığı sayfada açılır — son satır son sayfadan okunur */
  const linye = page.locator("#b-linye");
  const tabloBolgesi = linye.getByRole("region", { name: "Pano sigortaları (linye) tablosu" });
  const satirSayisi = async () => Number(await tabloBolgesi.getAttribute("data-satir"));
  const noKutusu = (n: number) => linye.getByRole("textbox", { name: `${n}. satır · No`, exact: true });
  const noKutulari = linye.getByLabel(/^\d+\. satır · No$/);
  /** son sayfaya git (son sayfanın tuşu her zaman çizilir) ve son satırın No kutusu — telefonda S.A.Y paneli sayfayı örter: tuşa olay gönderilir */
  const sonSatir = async () => {
    const n = await satirSayisi(), sayfa = Math.ceil(n / 20);
    if (sayfa > 1) await linye.getByRole("navigation", { name: "Pano sigortaları (linye) sayfaları" }).getByRole("button", { name: `Sayfa ${sayfa}`, exact: true }).dispatchEvent("click");
    return noKutusu(n);
  };
  const once = await satirSayisi();
  const sonNo = /^(.*?)(\d+)$/.exec(once ? (await (await sonSatir()).inputValue()).trim() : "");
  const beklenen = (n: number) => (sonNo ? `${sonNo[1]}${Number(sonNo[2]) + n}` : String(n));

  /* A: 20 + 10 satır iki turda, araya soru yok; son satırın No'su kesintisiz */
  await sor("Pano sigortaları (linye) tablosuna 30 satır ekle [parça]");
  await expect(son).toContainText("Yaptım: 30 satır eklendi.", { timeout: 60_000 });
  await expect(tabloBolgesi).toHaveAttribute("data-satir", String(once + 30));
  expect(await noKutulari.count(), "ekranda en çok 20 satır").toBeLessThanOrEqual(20);
  await expect(await sonSatir()).toHaveValue(beklenen(30));
  await expect(liste).not.toContainText("ekleyeyim mi");
  await expect(panel.locator("[data-say-bekleme]")).toHaveCount(0);
  /* bütün işin (iki turun) Geri al'ı son iletinin altında */
  await panel.getByRole("button", { name: "Geri al" }).last().click();
  await expect(tabloBolgesi).toHaveAttribute("data-satir", String(once));

  /* C: tek komutla 50 satır */
  await sor("Pano sigortaları (linye) tablosuna 50 satır ekle");
  await expect(son).toContainText("Yaptım: 50 satır eklendi.", { timeout: 60_000 });
  await expect(tabloBolgesi).toHaveAttribute("data-satir", String(once + 50));
  expect(await noKutulari.count(), "ekranda en çok 20 satır").toBeLessThanOrEqual(20);
  await expect(await sonSatir()).toHaveValue(beklenen(50));
  await panel.getByRole("button", { name: "Geri al" }).last().click();
  await expect(tabloBolgesi).toHaveAttribute("data-satir", String(once));
});

/* 552–553 (reisim 2026-10-14: "elektrikte hesaplamalarda olsun … format yapıcıda formül kısmı olsun mesela (RCa=480/RCd) … konuşarak ilgili formatı
   yapabiliyo olalım"): format yapıcıda S.A.Y'a "<tablo> tablosuna <ad> sütunu ekle, formül …" → Haiku (taklit) haritadaki bölüm kimliğiyle
   formati_duzenle → sütun taslakta, formül köşeli parantezli; iletinin altındaki Geri al çıkarır; sayı sütununun "formül" tuşu formül alanını açar,
   "Iz / 2" yazılınca "= [Iz] ÷ 2". Yalnız masaüstünde (aynı türün taslağı — genişlikler aynı anda koşar). Kaydedilmez. */
test("S.A.Y format yapıcıda: konuşarak sütun + formül ekler, Geri al; formül tuşu ve yazıldığı gibi formül", async ({ page }, bilgi) => {
  test.skip(bilgi.project.name !== "masaustu", "aynı türün taslağı — yalnız masaüstü");
  test.setTimeout(150_000);
  await page.goto(`${Y}/giris`);
  await hazir(page);
  await page.getByLabel("E-posta").fill(E2E_YZ.yonetici.eposta);
  await page.getByLabel("Parola", { exact: true }).fill(E2E_PAROLA);
  await page.getByRole("button", { name: "Giriş yap" }).click();
  await expect(page.locator("header")).toContainText(E2E_YZ.yonetici.ad);
  await page.goto(`${Y}/ekipman-turleri?brans=e`);
  await hazir(page);
  await page.getByRole("link", { name: /Elektrik panosu/ }).first().click();
  await expect(page).toHaveURL(/\/ekipman-turleri\/[0-9a-f-]{36}$/, { timeout: 30_000 });
  await hazir(page);
  await page.getByRole("button", { name: /^Sürüm \d+ · Düzenle$/ }).first().click();
  const p = page.getByRole("dialog", { name: /^Sürüm \d+ · düzenle$/ });
  const devam = p.getByRole("link", { name: "Taslağa devam et" });
  if (await devam.count()) await devam.click(); else await p.getByRole("button", { name: "Taslak aç ve düzenle" }).click();
  await expect(page).toHaveURL(/\/sablon\/[0-9a-f-]{36}\/kurucu$/, { timeout: 30_000 });
  await hazir(page);

  const fab = page.getByRole("button", { name: "S.A.Y — saha asistanı" });
  const panel = page.getByRole("dialog", { name: "S.A.Y" });
  await expect(panel.or(fab)).toBeVisible({ timeout: 30_000 });
  if (!(await panel.isVisible())) await fab.click();
  await expect(panel).not.toContainText("Format yapıcıdayım");   // 555: açıklama yok
  await expect(panel.getByRole("button", { name: "Fotoğrafları oku ve gir" })).toHaveCount(0);
  await panel.getByLabel("S.A.Y'a sor").fill("Pano sigortaları (linye) tablosuna Deneme sütunu ekle, formül Ib × 2");
  await panel.getByLabel("S.A.Y'a sor").press("Enter");
  /* 557: cevap işin sonucuyla ("Yaptım: …"); alttaki bildirim yok */
  await expect(panel.getByRole("list").first()).toContainText("Yaptım:", { timeout: 30_000 });
  await expect(page.getByText("Format taslağında:", { exact: false })).toHaveCount(0);
  await expect(page.getByText("= [Ib] × 2").first()).toBeVisible();
  await panel.getByRole("button", { name: "Geri al" }).last().click();
  await expect(page.getByText("= [Ib] × 2")).toHaveCount(0);
  await expect(page.getByText("S.A.Y'ın değişikliği geri alındı (taslak).").first()).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(panel).toHaveCount(0);

  /* 552: sayı sütununda formül tuşu — formül alanına odak; yazıldığı gibi ("Iz / 2") → köşeli parantezli */
  await page.getByRole("button", { name: "Ib · formül" }).first().click();
  const formul = page.getByRole("textbox", { name: /^Formül/ });
  await expect(formul).toBeFocused();
  await formul.fill("Iz / 2");
  await formul.press("Tab");
  await expect(page.getByText("= [Iz] ÷ 2").first()).toBeVisible();
});

/* 561: yazamadığı rapor — firma yöneticisi denetçinin raporunu açar (salt okunur): S.A.Y raporu bilir (yer "Rapor <no>"), yazması istenince
   nedenini söyler (taklit bağlamdaki nedeni okur; yazma aracı istekte varsa taklit reddeder) */
test("S.A.Y yazamadığı raporda: raporu bilir, nedenini söyler", async ({ page }, bilgi) => {
  test.setTimeout(120_000);
  const kod = E2E_YZ.ekipman[bilgi.project.name];
  await page.goto(`${Y}/giris`);
  await hazir(page);
  await page.getByLabel("E-posta").fill(E2E_YZ.yonetici.eposta);
  await page.getByLabel("Parola", { exact: true }).fill(E2E_PAROLA);
  await page.getByRole("button", { name: "Giriş yap" }).click();
  await expect(page.locator("header")).toContainText(E2E_YZ.yonetici.ad);
  await page.goto(`${Y}/raporlar`);
  await hazir(page);
  await page.getByRole("searchbox", { name: "Ekipman kodu" }).fill(kod);
  await page.getByRole("link", { name: /^YZ-/ }).first().click();
  await expect(page).toHaveURL(/\/raporlar\/[0-9a-f-]{36}$/, { timeout: 30_000 });
  await hazir(page);
  await expect(page.getByRole("button", { name: "Kaydet", exact: true })).toHaveCount(0);   // salt okunur

  const fab = page.getByRole("button", { name: "S.A.Y — saha asistanı" });
  const panel = page.getByRole("dialog", { name: "S.A.Y" });
  await expect(panel.or(fab)).toBeVisible({ timeout: 30_000 });
  if (!(await panel.isVisible())) await fab.click();
  await expect(panel).toBeVisible();
  await expect(panel.getByRole("button", { name: "Fotoğrafları oku ve gir" })).toHaveCount(0);
  await panel.getByLabel("S.A.Y'a sor").fill("Seri no alanına SN-YAZILMAZ yaz");
  await panel.getByLabel("S.A.Y'a sor").press("Enter");
  const liste = panel.getByRole("list").first();
  await expect(liste).toContainText(/Yapamadım: YZ-\S+ — raporu yazan muayene uzmanı değiştirir/, { timeout: 30_000 });
  await expect(liste.getByRole("listitem").filter({ hasText: /^Rapor YZ-[0-9]{4}-[0-9]{3}/ }).first()).toBeVisible();
});
