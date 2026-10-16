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
  await expect(page.locator("[data-panel]")).toHaveCount(16);
  /* eski bölüm adları yok (raporların ikinci kopyası → Yedek'te Ek yedek; Supabase → Depolama) */
  await expect(page.getByText("Raporların ikinci kopyası")).toHaveCount(0);

  /* Firma bilgileri: pencerede yazılır, Kaydet → kaydedilir, pencere kapanır, yenilemede kalır */
  let firma = await ac(page, "firma", "Firma bilgileri");
  await firma.getByLabel("Adres").fill(adres);
  await firma.getByRole("button", { name: "Kaydet", exact: true }).click();
  await expect(page.getByText(/^Firma bilgileri kaydedildi/).first()).toBeVisible({ timeout: 30_000 });
  await expect(firma).toHaveCount(0);
  await page.reload();
  await hazir(page);
  firma = await ac(page, "firma", "Firma bilgileri");
  await expect(firma.getByLabel("Adres")).toHaveValue(adres);

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

  /* yapay zekâ: tek model Claude Haiku 5.5; açılınca yurt dışı satırı; kapatınca sorulur */
  const yz = await ac(page, "yz", "Yapay zekâ");
  await yz.getByRole("radio", { name: "Açık" }).click();
  await expect(yz.getByText(/Anthropic'e \(ABD\) gider|Anahtar girilmedi/)).toBeVisible();
  await expect(yz.getByRole("combobox", { name: "Model" })).toHaveCount(0);
  await expect(yz.getByText("Claude Haiku 5.5", { exact: true })).toBeVisible();
  await expect(yz.getByText(/^1 milyon token: giriş \$0,10, çıkış \$0,50/)).toBeVisible();
  await soruluKapat(page, yz);

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
  await depo.getByText("Veritabanınız nasıl kurulur?").click();
  await expect(depo.getByText(/Bağlantı bilgileri Firma ayarlarında kilitli/)).toBeVisible();
  await depo.getByText("Raporlar ne kadar durur?").click();
  /* 515: 7 gün raporların ömrü değil (geri sarma yedeği) */
  await expect(depo.getByText(/raporlar 7 gün sonra silinmez/)).toBeVisible();
  await depo.getByRole("button", { name: "Kapat", exact: true }).last().click();
  await expect(depo).toHaveCount(0);

  /* 536: firmanın Resend hesabı bağlı (tohum: uydurma anahtar, alan adı deneme.example) — anahtar yalnız son 4 · geçersiz alan adı kaydedilmez · deneme
     e-postası tuşa basanın adresine, kendi adresinden (yerel sağlayıcı taklidi Kimden'i denetler) */
  await expect(page.locator('[data-panel="eposta"]')).toContainText("Bağlı · deneme.example");
  const posta = await ac(page, "eposta", "E-posta");
  await expect(posta.getByText("…0001 kayıtlı")).toBeVisible();
  await expect(posta.getByText(/Otomatik e-postalar Rapor e-postasından: bilgi@deneme\.example/)).toBeVisible();
  await expect(posta.getByText(/alan adında değil/)).toHaveCount(0);
  await posta.getByText("Çalışanların e-postası nereden gider?").click();
  await expect(posta.getByText(E2E_HESAPLAR.muhasebe.eposta).first()).toBeVisible();
  await expect(posta.getByText("Kendi adresinden", { exact: true }).first()).toBeVisible();
  await posta.getByLabel("Gönderen alan adı").fill("kötü alan");
  await posta.getByRole("button", { name: "Kaydet", exact: true }).click();
  await expect(posta.getByText("Alan adı okunamadı (ör. firmaniz.com.tr). Kaydedilmedi.")).toBeVisible({ timeout: 30_000 });
  await posta.getByRole("button", { name: "Deneme e-postası gönder" }).click();
  await expect(page.getByText(`Deneme e-postası gönderildi: ${E2E_HESAPLAR.yonetici.eposta} — kendi adresinizden. Kutunuza bakın.`).first()).toBeVisible({ timeout: 30_000 });
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
