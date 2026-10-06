/* NEREDEN GELDİ: 350 — 09-G5 duman testi + 06 "her teslimden sonra canlıya karşı duman testi". Saf parçalar (veritabanısız): kodun beklediği son göç
   gocler/ klasöründeki son dosyayla aynı (yeni göç eklenip unutulursa düşer); denetimlerin değerlendirilmesi (biri düşerse durum "sorun", veritabanına
   ulaşılamazsa hepsi hayır). 354 (350–351 incelemesi): göç SAYISI da beklenir — arada atlanmış göç son göçün adıyla yakalanmıyordu. Gerçek veritabanı:
   tests/saglik.test.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { gocDosyalari } from "../src/server/db/goc.ts";
import { GOC_SAYISI, SON_GOC } from "../src/server/db/son-goc.ts";
import { saglikDegerlendir } from "../src/server/saglik.ts";

test("SON_GOC = gocler/ klasöründeki son göç; GOC_SAYISI = göç dosyası sayısı", () => {
  assert.equal(SON_GOC, gocDosyalari().at(-1)?.ad);
  assert.equal(GOC_SAYISI, gocDosyalari().length);
});

test("sağlık değerlendirmesi: hepsi doğruysa tamam; tek eksik sorun; veritabanı yoksa hepsi hayır", () => {
  const iyi = { son_goc: "0051_saglik.sql", goc_sayisi: 52, kiraci_tablo: 40, rls_eksik: 0, politikasiz: 0, api_sema: false, uygulama_ayricalikli: false };
  const beklenen = { son: "0051_saglik.sql", sayi: 52 };
  assert.deepEqual(saglikDegerlendir(iyi, beklenen, "abc1234"),
    { durum: "tamam", surum: "abc1234", denetimler: { veritabani: true, goc_guncel: true, rls: true, api_kapali: true, uygulama_kisitli: true } });
  const ad = (v: Partial<typeof iyi>, b = beklenen) => saglikDegerlendir({ ...iyi, ...v }, b);
  assert.equal(ad({}, { son: "0052_yeni.sql", sayi: 53 }).denetimler.goc_guncel, false, "kod göçten önce yayınlandı");
  assert.equal(ad({ goc_sayisi: 51 }).denetimler.goc_guncel, false, "arada bir göç atlandı (son göç aynı)");
  assert.equal(ad({ rls_eksik: 1 }).denetimler.rls, false);
  assert.equal(ad({ politikasiz: 1 }).denetimler.rls, false);
  assert.equal(ad({ kiraci_tablo: 0 }).denetimler.rls, false, "hiç kiracı tablosu yok = yanlış veritabanı");
  assert.equal(ad({ api_sema: true }).denetimler.api_kapali, false);
  assert.equal(ad({ uygulama_ayricalikli: true }).denetimler.uygulama_kisitli, false);
  assert.equal(ad({ rls_eksik: 2 }).durum, "sorun");
  const yok = saglikDegerlendir(null);
  assert.equal(yok.durum, "sorun");
  assert.ok(Object.values(yok.denetimler).every((x) => x === false));
});
