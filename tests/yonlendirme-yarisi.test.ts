/* NEREDEN GELDİ: 486 — deneme makinesinde telefon genişliğinde "standart yükle" başarılı oldu ama sayfa standardın sayfasına geçmedi (bildirim
   "kütüphaneye eklendi", adres /dokumanlar). Neden: istemcide router.push'un hemen ardından router.refresh() — tazeleme bekleyen yönlendirmeyi
   iptal edebiliyor (377 / 381'de raporlar ve personelde görülmüştü). Hata = sınıf (anayasa 0.8): beş yerde aynı desen vardı (Dökümanlar iki,
   Onaylar › Talepler, Zimmet teslimi, Araç tutanağı); tazeleme sunucu eyleminde (next/cache refresh). Bu kilit deseni bütün ekranlarda yasaklar. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { dosyalar, oku, yonlendirmeYarislari } from "./yardimci/denetimler.ts";

test("hiçbir ekranda router.push'un hemen ardından router.refresh() yok (tazeleme sunucu eyleminde)", () => {
  const tsx = dosyalar("src", [".tsx", ".ts"]).map((ad) => ({ ad, metin: oku(ad) }));
  assert.ok(tsx.length > 100);
  assert.deepEqual(yonlendirmeYarislari(tsx), []);
});
