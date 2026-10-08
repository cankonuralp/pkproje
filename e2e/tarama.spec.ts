/* NEREDEN GELDİ: 420 — reisim 2026-10-08: "mobilde bazı hatalara denk geldim ve örneğin chrome da iken yan bar da en aşağıya kaydırıpta firma
   ayarları kısmına tıklayamadım bu ve benzeri her türlü front back hatalarını toplu kontrol et reisim tüm siteyi kusursuz bitir". Firma yöneticisi
   (bütün modülleri görür) siteyi Ana sayfadan ve menüdeki her modülden başlayarak bağlantı izleyip gezer; üç genişlikte (proje), her sayfada
   e2e/tarama.ts'in denetimleri. Müşteri paneli aynı taramayla e2e/saha-raporu.spec.ts'te (müşteri orada giriş yapar). */
import { expect, test } from "@playwright/test";
import { MODULLER } from "../src/modules/moduller";
import { bulguMetni, siteyiTara } from "./tarama";
import { girisli } from "./yardimci";

test("site taraması: her sayfa açılır, sunucu / konsol hatası yok, yana taşmaz, her öğe basılabilir, erişilebilir; çekmece tam", async ({ page }) => {
  test.setTimeout(25 * 60_000);
  await girisli(page, "yonetici");
  const { bulgular, gezilen, kalan } = await siteyiTara(page, ["/", ...MODULLER.map((m) => "/" + m.yol)]);
  console.log(`site taraması: ${gezilen.length} sayfa gezildi${kalan.length ? `, süre / sayı sınırında ${kalan.length} sayfa kaldı: ${kalan.join(", ")}` : ""}`);
  expect(gezilen.length, "tarama boş geçti").toBeGreaterThan(20);
  expect(bulgular, `site taraması ${bulgular.length} bulgu:\n${bulguMetni(bulgular)}`).toEqual([]);
  expect(kalan, "gezilemeyen sayfa kaldı (sınır)").toEqual([]);
});
