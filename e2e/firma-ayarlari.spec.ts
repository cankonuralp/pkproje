/* NEREDEN GELDİ: K4 Firma ayarları (334) → 544 (maket 539 firma-ayarlari-yeni — reisim 2026-10-14: "tıklayınca pop-up olarak açılarak seçimler yapılabilen
   küçük paneller haline çevir", "açık kapalıyı seçince ekran komple kayıyo", "raporların ikinci kopyası değil yedek olarak görülmeli" → "maketleri falan da
   onaylıyorum"). Gerçek tarayıcıda, üç genişlikte: altı grupta 16 panel · panele basınca pencere, Kaydet'le kaydedilir, pencere kapanır, yenilemede kalır ·
   geçersiz firma kodu kaydedilmez (alanın altında), pencere açık kalır, kaydedilmemiş değişiklikle kapatınca sorulur · mesai Kapalı → Açık: alan açılıp
   kapanmaz (pencerenin boyu aynı), 660 dk'yı aşınca durum satırı uyarı olur · logo yükle / kaldır (önce sorulur) · yapay zekâ tek model · Yedek:
   günlük + aylık yedek, Ek yedek Kapalı · Google Drive · OneDrive (boy aynı) · Depolama "Nasıl …?" başlıkları · E-posta (firmanın Resend hesabı;
   geçersiz alan adı kaydedilmez; deneme e-postası) · fiyat listesi · belge türü ekle / kaldır · yana taşma yok · denetçi göremez. Firma kodu ve sabit
   giderler değiştirilmez (öteki testlerin rapor numaraları ve gelir-gider tutarları). */
import { expect, test, type Page } from "@playwright/test";
import { E2E_HESAPLAR } from "./hesaplar";
import { girisli, hazir } from "./yardimci";

const parca = (ad: string, govde: string) => Buffer.concat([Buffer.from([0, 0, govde.length >> 8, govde.length & 0xff]), Buffer.from(ad + govde, "latin1"), Buffer.from([0, 0, 0, 0])]);
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), parca("IHDR", "\0\0\0\x01\0\0\0\x01\x08\x02\0\0\0"), parca("IDAT", "veri"), parca("IEND", "")]);

/** panele basar, penceresini döner */
async function ac(page: Page, panel: string, ad: string) {
  await page.locator(`[data-panel="${panel}"]`).click();
  const d = page.getByRole("dialog", { name: ad });
  await expect(d).toBeVisible();
  return d;
}
/** kaydedilmemiş değişiklikle kapatınca sorulur: "Kapat" */
async function soruluKapat(page: Page, d: ReturnType<Page["getByRole"]>) {
  await d.getByRole("button", { name: "Vazgeç", exact: true }).click();
  await page.getByRole("dialog", { name: "Değişiklikler kaydedilmedi" }).locator("[data-onay-tamam]").click();
  await expect(d).toHaveCount(0);
}

test("firma ayarları: paneller ve pencere; kaydet, geçersiz değer, kayma yok, logo, yedek, e-posta; denetçi göremez", async ({ page, context }, bilgi) => {
  test.setTimeout(180_000);
  const adres = `Deneme Cad. No ${["masaustu", "tablet", "telefon"].indexOf(bilgi.project.name) + 1}`;
  await girisli(page, "yonetici");
  await page.goto("/firma-ayarlari");
  await hazir(page);
  await expect(page.getByRole("heading", { level: 1, name: "Firma ayarları" })).toBeVisible();
  for (const g of ["Firma", "Çalışma", "Fiyat ve gider", "Veri ve yedek", "Bağlantılar", "Araçlar"]) await expect(page.getByRole("heading", { level: 2, name: g, exact: true })).toBeVisible();
  await expect(page.locator("[data-panel]")).toHaveCount(15);   // 2026-10-25 (göç 0106): Yapay zekâ paneli Yönetim'e taşındı (16 → 15)
  /* eski bölüm adları yok (raporların ikinci kopyası → Yedek'te Ek yedek; Supabase → Depolama) */
  await expect(page.getByText("Raporların ikinci kopyası")).toHaveCount(0);

  /* Firma bilgileri: pencerede yazılır, Kaydet → kaydedilir, pencere kapanır, yenilemede kalır */
  let firma = await ac(page, "firma", "Firma bilgileri");
  await firma.getByLabel("Adres").fill(adres);
  /* 595 (madde 14): telefon — sayfa altı yazısının {tel}'i; harf reddedilir */
  await firma.getByLabel("Telefon").fill("ara");
  await firma.getByRole("button", { name: "Kaydet", exact: true }).click();
  await expect(firma.getByText("Telefon yalnız rakam, boşluk, + ( ) - içerir.")).toBeVisible();
  await firma.getByLabel("Telefon").fill("0212 000 00 00");
  await firma.getByRole("button", { name: "Kaydet", exact: true }).click();
  await expect(page.getByText(/^Firma bilgileri kaydedildi/).first()).toBeVisible({ timeout: 30_000 });
  await expect(firma).toHaveCount(0);
  await page.reload();
  await hazir(page);
  firma = await ac(page, "firma", "Firma bilgileri");
  await expect(firma.getByLabel("Adres")).toHaveValue(adres);
  await expect(firma.getByLabel("Telefon")).toHaveValue("0212 000 00 00");

  /* logo: yükle (PNG), görünür; kaldır önce sorulur */
  const [fc] = await Promise.all([page.waitForEvent("filechooser"), firma.getByRole("button", { name: "Logo yükle" }).click()]);
  await fc.setFiles({ name: "logo.png", mimeType: "image/png", buffer: PNG });
  await expect(page.getByText("Firma logosu kaydedildi.").first()).toBeVisible({ timeout: 30_000 });
  await expect(firma.getByRole("link", { name: /Firma logosu: logo\.png/ })).toBeVisible();
  await firma.getByRole("button", { name: "Firma logosu kaldır" }).click();
  await page.getByRole("dialog", { name: "Firma logosu kaldırılsın mı?" }).getByRole("button", { name: "Kaldır" }).click();
  await expect(page.getByText("Firma logosu kaldırıldı.").first()).toBeVisible({ timeout: 30_000 });
  await firma.getByRole("button", { name: "Vazgeç", exact: true }).click();   // değişiklik yok: sorulmadan kapanır
  await expect(firma).toHaveCount(0);
  await expect(page.locator('[data-panel="firma"]')).toBeFocused();

  /* geçersiz firma kodu: kaydedilmez, nedeni alanın altında, pencere açık; kapatınca sorulur */
  const kod = await ac(page, "kod", "Rapor numarası");
  await kod.getByLabel("Firma kodu").fill("K1");
  await kod.getByRole("button", { name: "Kaydet", exact: true }).click();
  await expect(kod.getByText("2 harf olmalı (A–Z; ör. KM). Kaydedilmedi.")).toBeVisible({ timeout: 30_000 });
  await soruluKapat(page, kod);
  await expect(page.locator('[data-panel="kod"]')).toContainText("DM-AAYY-SIRA");

  /* mesai: Kapalı → Açık — alanlar yerinde (açılıp kapanmaz), pencerenin boyu aynı; 660'ı aşınca durum satırı uyarı */
  const mesai = await ac(page, "mesai", "Mesai takibi");
  await expect(mesai.getByLabel("Günlük mesai (dk)")).toBeDisabled();
  const once = (await mesai.boundingBox())!.height;
  await mesai.getByRole("radio", { name: "Açık" }).click();
  await expect(mesai.getByLabel("Günlük mesai (dk)")).toBeEnabled();
  await mesai.getByLabel("Günlük mesai (dk)").fill("300");
  await expect(mesai.getByText(/Günlük toplam 780 dk: kanunda en çok 660/)).toBeVisible();
  expect(Math.abs((await mesai.boundingBox())!.height - once), "kayma yok").toBeLessThan(2);
  await soruluKapat(page, mesai);
  await expect(page.locator('[data-panel="mesai"]')).toContainText("Kapalı");

  /* 2026-10-17 (göç 0102): İmza yöntemi penceresinde "Teknik yönetici raporu imzalasın" (başlangıçta kapalı); işaretlenince kaydedilmemiş sayılır,
     Vazgeç → sorulur, ayar değişmez (kayıt ve akış tests/onaylar.test.ts'te) */
  const imza = await ac(page, "imza", "İmza yöntemi");
  const teknik = imza.getByRole("checkbox", { name: /Teknik yönetici raporu imzalasın/ });
  await expect(teknik).not.toBeChecked();
  await teknik.check();
  await soruluKapat(page, imza);
  await expect(page.locator('[data-panel="imza"]')).not.toContainText("önce teknik yönetici imzalar");

  /* 2026-10-25 (göç 0106; reisim: "Yapay zekâ ayarları Firma ayarlarından kalksın"): yapay zekâ paneli yok — Bağlantılar'da yalnız E-posta */
  await expect(page.locator('[data-panel="yz"]')).toHaveCount(0);
  await expect(page.locator('[data-panel="eposta"]')).toHaveCount(1);

  /* Yedek (reisim: "yedek olarak görülmeli"): günlük + aylık yedek kendiliğinden; Ek yedek Kapalı → Google Drive: alanlar açılır, boy aynı */
  const yedek = await ac(page, "yedek", "Yedek");
  await expect(yedek.getByText("Günlük yedek", { exact: true })).toBeVisible();
  await expect(yedek.getByText("Aylık arşiv yedeği", { exact: true })).toBeVisible();
  await expect(yedek.getByRole("radio", { name: "Kapalı" })).toHaveAttribute("aria-checked", "true");
  await expect(yedek.getByLabel("Ana klasör")).toBeDisabled();
  const yOnce = (await yedek.boundingBox())!.height;
  await yedek.getByRole("radio", { name: "Google Drive" }).click();
  await expect(yedek.getByLabel("Ana klasör")).toBeEnabled();
  await expect(yedek.getByText(/Türkiye dışında saklayabilir/)).toBeVisible();
  expect(Math.abs((await yedek.boundingBox())!.height - yOnce), "kayma yok").toBeLessThan(2);
  await soruluKapat(page, yedek);

  /* Depolama: yalnız bilgi; uzun anlatım "Nasıl …?" başlıklarının altında */
  const depo = await ac(page, "depolama", "Depolama");
  await expect(depo.getByRole("combobox")).toHaveCount(0);
  /* 2026-10-16 (FIRMA-VT FV10, K1 / K3): "Kendi hesabınızı nasıl bağlarsınız?" kalktı — proje panelden kurulur, bağlantı kilitli */
  await expect(depo.getByText("probata ortak projesi (Supabase, Frankfurt)")).toBeVisible();
  /* 2026-10-18 (reisim: "bu ve benzeri, yaratıcıyı hedef alan açıklamaları kaldır, çok fazla ai ürünü olduğu belli oluyor"): kurulum anlatımı ve paket bilgisi firmaya gösterilmez */
  await expect(depo.getByText("Veritabanınız nasıl kurulur?")).toHaveCount(0);
  await expect(depo.getByText(/Supabase Pro/)).toHaveCount(0);
  await depo.getByRole("button", { name: "Kapat", exact: true }).last().click();
  await expect(depo).toHaveCount(0);

  /* 536 → 2026-10-16 (FIRMA-VT FV11, K2 + K3 — kasıtlı): gönderim Yönetim'den, burada KİLİTLİ (tohum: deneme.example doğrulandı, uydurma gönderme anahtarı)
     — alan adı ve genel adres yalnız gösterilir, anahtar hiç (eski "…0001 kayıtlı" ve "Gönderen alan adı" alanı kalktı); gizli kopya değişir; deneme
     e-postası tuşa basanın adresine, kendi adresinden (yerel sağlayıcı taklidi Kimden'i ve anahtarı denetler) */
  await expect(page.locator('[data-panel="eposta"]')).toContainText("Bağlı · deneme.example");
  const posta = await ac(page, "eposta", "E-posta");
  await expect(posta.getByText("deneme.example", { exact: true })).toBeVisible();
  await expect(posta.getByText("Doğrulandı", { exact: true })).toBeVisible();
  await expect(posta.getByText(/kayıtlı$/)).toHaveCount(0);
  await expect(posta.getByLabel("Gönderen alan adı")).toHaveCount(0);
  /* 2026-10-18 (reisim: "bu ve benzeri, yaratıcıyı hedef alan açıklamaları kaldır, çok fazla ai ürünü olduğu belli oluyor"): açıklama kısaldı */
  await expect(posta.getByText(/Gönderimi probata yönetimi kurar/)).toHaveCount(0);
  await expect(posta.getByText("E-posta gönderimi nasıl kurulur?")).toHaveCount(0);
  await expect(posta.getByText(/Otomatik e-postalar bilgi@deneme\.example adresinden/)).toBeVisible();
  await posta.getByText("Çalışanların e-postası nereden gider?").click();
  await expect(posta.getByText(E2E_HESAPLAR.muhasebe.eposta).first()).toBeVisible();
  await expect(posta.getByText("Kendi adresinden", { exact: true }).first()).toBeVisible();
  await posta.getByRole("button", { name: "Deneme e-postası gönder" }).click();
  await expect(page.getByText(`Deneme e-postası gönderildi: ${E2E_HESAPLAR.yonetici.eposta} — kendi adresinizden. Kutunuza bakın.`).first()).toBeVisible({ timeout: 30_000 });
  /* gizli kopya firmada (K3): değiştirilir; kaydedilmeden kapatınca sorulur (2026-10-16: eskiden alan adı alanı kirletiyordu — o alan kalktı) */
  await posta.getByRole("radio", { name: "Açık" }).click();
  await soruluKapat(page, posta);

  /* 335: fiyat listesi (tohumdaki Hava tankı 900,00 — değiştirilmez: muhasebe testi bu fiyatla); belge türü ekle → listede → kaldır */
  const fiyat = await ac(page, "fiyat", "Fiyat listesi");
  await expect(fiyat.getByLabel("Hava tankı (TL)")).toHaveValue("900,00");
  await fiyat.getByRole("button", { name: "Vazgeç", exact: true }).click();
  await expect(fiyat).toHaveCount(0);
  const mb = await ac(page, "mbelge", "Müşteriye açık personel belgeleri");
  const tur = `Deneme Tür ${bilgi.project.name}`;
  await mb.getByRole("button", { name: "Belge türü ekle" }).click();
  await mb.getByLabel("Yeni belge türü").fill("Diploma");
  await mb.getByRole("button", { name: "Türü ekle" }).click();
  await expect(mb.getByText("Bu adla bir belge türü zaten var.")).toBeVisible({ timeout: 30_000 });
  await mb.getByLabel("Yeni belge türü").fill(tur);
  await mb.getByRole("button", { name: "Türü ekle" }).click();
  await expect(page.getByText(new RegExp(`^${tur} eklendi`)).first()).toBeVisible({ timeout: 30_000 });
  await expect(mb.getByRole("checkbox", { name: new RegExp(tur) })).toBeVisible();
  await mb.getByRole("button", { name: `${tur} türünü kaldır` }).click();
  await page.getByRole("dialog", { name: "Belge türünü kaldır" }).getByRole("button", { name: "Kaldır" }).click();
  await expect(page.getByText(`${tur} kaldırıldı.`).first()).toBeVisible({ timeout: 30_000 });
  await mb.getByRole("button", { name: "Vazgeç", exact: true }).click();
  await expect(mb).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), "yana taşma yok").toBe(true);

  await context.clearCookies();
  await girisli(page, "denetci");
  await page.goto("/firma-ayarlari");
  await expect(page.getByText("Bu sayfayı görme yetkiniz yok")).toBeVisible({ timeout: 30_000 });
});
