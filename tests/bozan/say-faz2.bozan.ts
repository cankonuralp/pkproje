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

/* 2026-11-01 (reisim: "herhangi bir kodda -0 dan başlamasın") — planlar/sema.ts bellekte bozulur (göreli içe aktarmalar mutlak yola) */
test("5. kodun sıfır sayı bölümü denetimi kalkınca TRF-0 geçer (kilidin koruduğu açık)", async () => {
  const { mkdtempSync, readFileSync, rmSync, writeFileSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join, resolve } = await import("node:path");
  const { pathToFileURL } = await import("node:url");
  const yol = resolve("src/modules/planlar/sema.ts");
  const k = readFileSync(yol, "utf8").replace(/from "(\.\.?\/[^"]+)"/g, (_, y: string) => `from "${pathToFileURL(resolve(resolve(yol, ".."), y)).href}"`);
  const eski = "  if (/(^|-)0+(-|$)/.test(kod)) return { tur: \"hata\", metin: \"Kodun sayı bölümü 0 olamaz; numaralar 1'den başlar (TRF-0001).\" };\n";
  assert.ok(k.includes(eski), "bozulacak satır kaynakta yok");
  const klasor = mkdtempSync(join(tmpdir(), "bozan-kod-sifir-")), dosya = join(klasor, "sema.ts");
  writeFileSync(dosya, k.replace(eski, ""));
  try {
    const m = await import(pathToFileURL(dosya).href) as typeof import("../../src/modules/planlar/sema.ts");
    assert.equal(m.kodBicimi("TRF-0"), null, "bozuk: TRF-0 kabul edildi");
  } finally { rmSync(klasor, { recursive: true, force: true }); }
});
