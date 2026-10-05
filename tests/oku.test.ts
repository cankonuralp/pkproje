/* NEREDEN GELDİ: pkproje §3.6 maket kararı ("Excel'den yükle gerçek .xlsx / .csv okur — dış kütüphane yok; Excel'in tarih sayısı çevrilir") ·
   maket teklifler.html "Excel'den yükle" (L1 2026-09-30) · 325. Okuyucu saf (veritabanısız): kendi yazıcımızın dosyası; Excel'in kaydettiği
   biçim (DEFLATE sıkıştırma, ortak dizgiler, zengin metin, tarih biçimi, kendiliğinden kapanan satır, boş sütun); CSV (; , tırnak, satır içi
   satır sonu, BOM, Türkçe Windows kodlaması); sınırlar (sıkıştırma bombası, satır, eski .xls). Olumsuz kanıt: tests/bozan/oku.bozan.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { csvOku, excelTarihi, OKU_SINIR, tabloOku, TabloHatasi } from "../src/components/disa/oku.ts";
import { xlsxBayt } from "../src/components/disa/xlsx.ts";
import { deflateZip } from "./yardimci/zip.ts";

const ANA = 'xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';

test("kendi yazıcımızın .xlsx'i geri okunur (satır içi dizgi, sayı, bağlantı metni, Türkçe, XML kaçışı)", async () => {
  const b = xlsxBayt("Ekipmanlar", [["Kod", "Ekipman türü", "Konum"], ["HT-1", "Hava tankı", "Kazan <dairesi> & arka"], ["", "Forklift", 12], [{ metin: "Rapor", url: "https://a.example/r" }]]);
  assert.deepEqual(await tabloOku("liste.xlsx", b), [["Kod", "Ekipman türü", "Konum"], ["HT-1", "Hava tankı", "Kazan <dairesi> & arka"], ["", "Forklift", "12"], ["Rapor"]]);
});

test("Excel'in kaydettiği biçim: DEFLATE, ortak dizgiler (zengin metin, fonetik hariç), ilk sayfa ilişkiden, tarih biçimi çevrilir, kendiliğinden kapanan ve atlanan satır, boş sütun", async () => {
  const z = deflateZip([
    ["xl/workbook.xml", `<workbook ${ANA}><sheets><sheet name="Liste" sheetId="3" r:id="rId7"/><sheet name="Diğer" sheetId="1" r:id="rId1"/></sheets></workbook>`],
    ["xl/_rels/workbook.xml.rels", `<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/><Relationship Id="rId7" Target="/xl/worksheets/sheet3.xml"/></Relationships>`],
    ["xl/sharedStrings.xml", `<sst ${ANA}><si><t>Kod</t></si><si><r><t>Hava </t></r><r><rPr><b/></rPr><t xml:space="preserve">tankı</t></r><rPh><t>X</t></rPh></si><si><t>Ölçüm &amp; Test_x000D_</t></si><si/></sst>`],
    ["xl/styles.xml", `<styleSheet ${ANA}><numFmts count="2"><numFmt numFmtId="164" formatCode="dd\\.mm\\.yyyy"/><numFmt numFmtId="165" formatCode="[Red]0.00&quot;m&quot;"/></numFmts>`
      + `<cellXfs count="4"><xf numFmtId="0"/><xf numFmtId="14" applyNumberFormat="1"/><xf numFmtId="164"/><xf numFmtId="165"/></cellXfs></styleSheet>`],
    ["xl/worksheets/sheet1.xml", `<worksheet ${ANA}><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>YANLIŞ SAYFA</t></is></c></row></sheetData></worksheet>`],
    ["xl/worksheets/sheet3.xml", `<worksheet ${ANA}><sheetData>`
      + `<row r="1" spans="1:4"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c></row>`
      + `<row r="2"/>`
      + `<row r="4"><c r="A4" t="s"><v>2</v></c><c r="C4" s="1"><v>45658</v></c><c r="D4" s="2"><v>45658.5</v></c><c r="E4" s="3"><v>3.5</v></c></row>`
      + `<row r="5"><c r="A5" t="b"><v>1</v></c><c r="B5" t="str"><f>A1</f><v>a&lt;b</v></c><c r="C5"/><c t="s"><v>3</v></c></row>`
      + `</sheetData></worksheet>`],
  ]);
  assert.deepEqual(await tabloOku("liste.xlsx", z), [
    ["Kod", "Hava tankı"], [], [], ["Ölçüm & Test\r", "", "2025-01-01", "2025-01-01", "3.5"], ["DOĞRU", "a<b", "", ""],
  ]);
  assert.equal(excelTarihi(45658), "2025-01-01");
  assert.equal(excelTarihi(1), "1899-12-31");
});

test("sınırlar: sıkıştırma bombası açılırken durur; eski .xls ve bozuk dosya anlaşılır iletiyle; büyük dosya ve çok satır reddedilir", async () => {
  const bomba = deflateZip([["xl/worksheets/sheet1.xml", new Uint8Array(OKU_SINIR.parca + 1024 * 1024)]]);
  assert.ok(bomba.length < 1024 * 1024, "küçük dosya");
  await assert.rejects(tabloOku("bomba.xlsx", bomba), (e) => e instanceof TabloHatasi && e.message === "Dosya çok büyük.");
  await assert.rejects(tabloOku("eski.xls", new Uint8Array([0xd0, 0xcf, 0x11, 0xe0, 1, 2])), (e) => e instanceof TabloHatasi && /\.xls desteklenmiyor/.test(e.message));
  await assert.rejects(tabloOku("bozuk.xlsx", new TextEncoder().encode("Kod;Tür")), (e) => e instanceof TabloHatasi && /\.xlsx değil/.test(e.message));
  await assert.rejects(tabloOku("yarim.xlsx", new Uint8Array([0x50, 0x4b, 3, 4, 0, 0])), (e) => e instanceof TabloHatasi);
  await assert.rejects(tabloOku("buyuk.csv", new Uint8Array(OKU_SINIR.dosya + 1)), /en çok 10 MB/);
  await assert.rejects(tabloOku("cok.csv", new TextEncoder().encode("a\n".repeat(OKU_SINIR.satir + 5))), /satır okunur/);
  const sayfa = deflateZip([["xl/worksheets/sheet1.xml", `<worksheet><sheetData><row r="${OKU_SINIR.satir + 1}"><c r="A1"><v>1</v></c></row></sheetData></worksheet>`]]);
  await assert.rejects(tabloOku("cok.xlsx", sayfa), /satır okunur/);
});

/* 2026-10-06 (324–327 incelemesi): tembel düzenli ifade kapanmayan etikette karesel tarıyordu — 200 KB'lık parça 1,4 sn, 50 MB saatler; doğrusal
   tarayıcı kapanmayan etiketi hemen "bozuk" sayar. Süre sınırı geniş (CI makinesi yavaş olabilir); karesel tarama bu boyda dakikalar sürerdi. */
test("kapanmayan etiket (kötü niyetli dosya): satır, ortak dizgi ve stil parçasında doğrusal tarama hemen 'bozuk' der; toplam açılmış boyut sınırı", async () => {
  const kapanmayan = (ad: string, n: number) => new TextEncoder().encode(`<x>${`<${ad}>`.repeat(n)}</x>`);
  for (const [parca, ad] of [["xl/worksheets/sheet1.xml", "row"], ["xl/sharedStrings.xml", "si"], ["xl/styles.xml", "cellXfs"]] as const) {
    const ek: [string, string][] = parca === "xl/worksheets/sheet1.xml" ? [] : [["xl/worksheets/sheet1.xml", `<worksheet ${ANA}><sheetData/></worksheet>`]];
    const z = deflateZip([[parca, kapanmayan(ad, 400_000)], ...ek]);
    const bas = performance.now();
    await assert.rejects(tabloOku("kotu.xlsx", z), (h: Error) => h instanceof TabloHatasi && /bozuk/.test(h.message), ad);
    assert.ok(performance.now() - bas < 5000, `${ad}: ${Math.round(performance.now() - bas)} ms`);
  }
  /* iki parça ayrı ayrı sınırın altında, birlikte üstünde */
  const yarim = new Uint8Array(Math.ceil(OKU_SINIR.parca / 2) + 1024);
  await assert.rejects(tabloOku("iki.xlsx", deflateZip([["xl/sharedStrings.xml", yarim], ["xl/worksheets/sheet1.xml", yarim]])), /çok büyük/);
});

test("CSV: ayraç ilk satırdan (; , sekme), tırnaklı alan, \"\" kaçışı, satır içi satır sonu, CRLF, BOM; UTF-8 değilse Türkçe Windows kodlaması", async () => {
  assert.deepEqual(csvOku('﻿Kod;Ekipman türü;Konum\r\n"HT;1";"Hava ""tankı""";"satır\niçi"\r\n;Forklift;\n'),
    [["Kod", "Ekipman türü", "Konum"], ["HT;1", 'Hava "tankı"', "satır\niçi"], ["", "Forklift", ""]]);
  assert.deepEqual(csvOku("a,b\n1,2"), [["a", "b"], ["1", "2"]]);
  assert.deepEqual(csvOku("a\tb\n1\t2\n"), [["a", "b"], ["1", "2"]]);
  /* "Döküm;Şişe" Windows-1254 baytlarıyla (Excel'in "CSV (virgülle ayrılmış)" kaydı) */
  const b = new Uint8Array([0x44, 0xf6, 0x6b, 0xfc, 0x6d, 0x3b, 0xde, 0x69, 0xfe, 0x65, 0x0a, 0xdd, 0xe7, 0x3b, 0xf0, 0xfd]);
  assert.deepEqual(await tabloOku("liste.csv", b), [["Döküm", "Şişe"], ["İç", "ğı"]]);
  assert.deepEqual(await tabloOku("liste.csv", new TextEncoder().encode("Kod;Tür\nHT-1;Hava tankı")), [["Kod", "Tür"], ["HT-1", "Hava tankı"]]);
});
