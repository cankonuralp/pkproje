/* OLUMSUZ KANIT — tests/imza-kimlik.test.ts neyi koruyor (2026-10-17, teknik yönetici imzası). Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): dosya
   bellekte bozulup geçici klasörden içe aktarılır.
   1. İmzalayanın sertifikası SignerInfo'nun veren + seri numarasıyla bulunmasaydı (ilk sertifika alınsaydı) zincirdeki başka bir sertifikanın adı
      imzalayan sayılırdı.
   2. Ad karşılaştırmasında sözcüklerin HEPSİ aranmasaydı (biri yeterse) aynı adlı başka bir kişinin imzası kabul edilirdi. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";
import { sahteImzaIcerigi } from "../yardimci/sahte-imza.ts";

const KAYNAK = "src/modules/raporlar/imza-kimlik.ts";
const klasor = mkdtempSync(join(tmpdir(), "imza-kimlik-bozan-"));
after(() => rmSync(klasor, { recursive: true, force: true }));
type Modul = typeof import("../../src/modules/raporlar/imza-kimlik.ts");
let sira = 0;
async function bozuk(eski: string, yeni: string): Promise<Modul> {
  const metin = readFileSync(KAYNAK, "utf8");
  assert.ok(metin.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const hedef = join(klasor, `imza-kimlik-${sira++}.ts`);
  writeFileSync(hedef, metin.replace(eski, yeni));
  return (await import(pathToFileURL(hedef).href)) as Modul;
}

test("SignerInfo eşleşmesi kalkınca zincirdeki başka sertifikanın adı imzalayan sayılır", async () => {
  const m = await bozuk("        sert = sertler.find((x) => x.serialNumber.toUpperCase().replace(/^0+(?=.)/, \"\") === h);", "        sert = sertler[0];");
  assert.equal(m.imzalayanAdi(sahteImzaIcerigi("AYŞE ÇELİK", ["Ara Sertifika"])), "Ara Sertifika", "bozuk: ilk sertifikanın adı döndü");
});

test("sözcüklerin hepsi aranmayınca aynı adlı başka kişinin imzası uyuşur", async () => {
  const m = await bozuk("  return kisa.every((x) => {", "  return kisa.some((x) => {");
  assert.equal(m.adUyuyor("AYŞE ÇELİK", "Ayşe Kaya"), true, "bozuk: başka kişi uyuştu");
});
