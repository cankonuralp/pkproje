/* NEREDEN GELDİ: 350 — 09-G5 duman testi + 06 "her teslimden sonra canlıya karşı duman testi". Saf parçalar (veritabanısız): kodun beklediği son göç
   gocler/ klasöründeki son dosyayla aynı (yeni göç eklenip unutulursa düşer); denetimlerin değerlendirilmesi (biri düşerse durum "sorun", veritabanına
   ulaşılamazsa hepsi hayır). Gerçek veritabanı: tests/saglik.test.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { gocDosyalari } from "../src/server/db/goc.ts";
import { SON_GOC } from "../src/server/db/son-goc.ts";
import { saglikDegerlendir } from "../src/server/saglik.ts";

test("SON_GOC = gocler/ klasöründeki son göç", () => {
  assert.equal(SON_GOC, gocDosyalari().at(-1)?.ad);
});

test("sağlık değerlendirmesi: hepsi doğruysa tamam; tek eksik sorun; veritabanı yoksa hepsi hayır", () => {
  const iyi = { son_goc: "0051_saglik.sql", kiraci_tablo: 40, rls_eksik: 0, politikasiz: 0, api_sema: false, uygulama_ayricalikli: false };
  assert.deepEqual(saglikDegerlendir(iyi, "0051_saglik.sql", "abc1234"),
    { durum: "tamam", surum: "abc1234", denetimler: { veritabani: true, goc_guncel: true, rls: true, api_kapali: true, uygulama_kisitli: true } });
  const ad = (v: Partial<typeof iyi>, son = "0051_saglik.sql") => saglikDegerlendir({ ...iyi, ...v }, son);
  assert.equal(ad({}, "0052_yeni.sql").denetimler.goc_guncel, false, "kod göçten önce yayınlandı");
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
