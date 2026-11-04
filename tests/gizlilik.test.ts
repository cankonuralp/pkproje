/* NEREDEN GELDİ: 2026-11-04 — firmanın kendi yedeği (Google Drive / OneDrive) için Google'ın izin ekranı ve Microsoft'un uygulama kaydı herkese açık bir
   gizlilik sayfası ister (reisim: "senin işlerini yap bitir sonra bana benim işlerimi tarif et"). SAF. Kilitlenenler: metin dar izinleri (drive.file,
   Files.ReadWrite.AppFolder) ve Google'ın "Limited Use" cümlesini taşır; depoda e-posta adresi yok (adres ortamdan); sayfa oturumsuz ve metnin
   tamamını gösterir; giriş ekranında bağlantı var; iletişim adresi biçimsizse gösterilmez. Olumsuz kanıt: tests/bozan/gizlilik.bozan.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { iletisimAdresi } from "../src/tanim/gizlilik.ts";
import { gizlilikEksikleri, oku } from "./yardimci/denetimler.ts";

export const gizlilikKaynaklari = () => ({ metin: oku("src/tanim/gizlilik.ts"), sayfa: oku("src/app/(acik)/gizlilik/page.tsx"), giris: oku("src/app/(acik)/giris/GirisFormu.tsx") });

test("gizlilik: dar izinler + Limited Use; depoda adres yok; sayfa oturumsuz ve tam; giriş ekranında bağlantı", () => {
  assert.deepEqual(gizlilikEksikleri(gizlilikKaynaklari()), []);
});

test("iletişim adresi ortamdan; boş ya da biçimsizse gösterilmez", () => {
  assert.equal(iletisimAdresi({}), null);
  assert.equal(iletisimAdresi({ PROBATA_ILETISIM_EPOSTA: "  destek@deneme.example " }), "destek@deneme.example");
  for (const x of ["destek", "a b@deneme.example", "<x>@deneme.example", "x@y"]) assert.equal(iletisimAdresi({ PROBATA_ILETISIM_EPOSTA: x }), null, x);
});
