/* OLUMSUZ KANIT — tests/say-faz2.test.ts neyi koruyor (2026-10-26). Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): metinler bellekte bozulur.
   1. Talimattan PDF'ten şablon kuralı düşerse S.A.Y formatı yine elle çizer. 2. Panelden dosya bırakma kalkarsa sürükle-bırak çalışmaz. 3. ZIP açılmazsa
   içindeki raporlar okunmaz. 4. PDF'ten şablon yardımcısı yüklemeyi atlarsa PDF türün format PDF'i olmaz. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { saySistemi } from "../../src/server/yz/say.ts";
import { KURALLAR } from "../say-faz2.test.ts";
import { oku } from "../yardimci/denetimler.ts";

test("1. talimatta format_pdf_kur kuralı yoksa kilit düşer", () => {
  assert.equal(KURALLAR.talimat(saySistemi([], "").replace("formatı elle çizme", "formatı çiz")), false);
});
test("2. panelden dosya bırakma kalkınca kilit düşer", () => {
  assert.equal(KURALLAR.panel(oku("src/modules/say/ui/SayAsistan.tsx").replace("onDrop={", "onDropX={")), false);
});
test("3. ZIP açılmayınca kilit düşer", () => {
  assert.equal(KURALLAR.panel(oku("src/modules/say/ui/SayAsistan.tsx").replaceAll("zipAc(", "zipAcma(")), false);
});
test("4. yükleme atlanınca kilit düşer", () => {
  assert.equal(KURALLAR.sablon(oku("src/modules/ekipman-turleri/ui/pdfdenSablon.ts").replace("await formatYukleEylemi(f)", "({ tamam: true, sira: 1 })")), false);
});
