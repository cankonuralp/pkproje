/* NEREDEN GELDİ: reisim 2026-10-17 — "rapor isimleri sadece rapor kodlarından oluşuyor bu şekilde klasörde anlaması zor, rapor isimlerinde rapor
   numarasından sonra - ekipman kodu- sonra da ekipmanın adı "kompresör hava tankı" veeya "yangın dolapları" ne ise artık o yazmalı". Saf: raporun PDF
   dosya adı (hazırlanan / imzalı PDF, önizleme indirmesi, toplu imza ZIP'i, müşteri panelinin ZIP'i aynı işlevden). Olumsuz kanıt:
   tests/bozan/rapor-dosya-adi.bozan.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { raporDosyaAdi } from "../src/modules/raporlar/sema.ts";

test("rapor no - ekipman kodu - tür adı; ek (imzalı, imzasız) sonda; Türkçe harf ve boşluk korunur", () => {
  assert.equal(raporDosyaAdi("DM-1026-003-cf59e", "HT-1", "Kompresör hava tankı"), "DM-1026-003-cf59e-HT-1-Kompresör hava tankı.pdf");
  assert.equal(raporDosyaAdi("DM-1026-006-63287-R1", "YD-04", "Yangın dolapları", "imzali"), "DM-1026-006-63287-R1-YD-04-Yangın dolapları-imzali.pdf");
  assert.equal(raporDosyaAdi("DM-1026-003-cf59e", null, undefined), "DM-1026-003-cf59e.pdf", "kod ve tür yoksa yalnız numara");
});

test("Windows'un ve ZIP'in sorun çıkardığı karakterler boşluk olur (klasör yolu oluşmaz); uzunluk sınırlı; boş numara 'rapor'", () => {
  const ad = raporDosyaAdi("DM-1026-003-cf59e", "A/B\\C", 'Tank: "basınçlı" <kap>* | ? ..');
  assert.equal(ad, "DM-1026-003-cf59e-A B C-Tank basınçlı kap.pdf");
  assert.ok(!/[\\/:*?"<>|]/.test(ad));
  assert.ok(raporDosyaAdi("X".repeat(300), "K".repeat(300), "T".repeat(300), "imzali").length <= 200, "dosya kaydı en çok 200 karakter");
  assert.equal(raporDosyaAdi("", "HT-1", "Tank"), "rapor-HT-1-Tank.pdf");
});
