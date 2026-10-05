/* NEREDEN GELDİ: maket musteri.html "Uygunsuzları indir" / "Excel indir" (2026-09-27: açık uygunsuzluklar gerçek .xlsx, kayıtlardan; Ö3 2026-10-01
   reisim: "excel de link olmalı, linke tıklayınca ilgili rapor açılmalı. "rapor" yazsın") · 320. Dışa aktarma yazıcıları saf (veritabanısız):
   ZIP yapısı (yerel başlık, merkez dizin, CRC — Node'un zlib.crc32'siyle karşılaştırılır), .xlsx parçaları, gerçek köprü (formül değil), XML
   kaçışı, formül enjeksiyonu (veri "=" ile başlasa da satır içi metin), tehlikeli adres şemaları. Olumsuz kanıt: tests/bozan/disa.bozan.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { zipBayt } from "../src/components/disa/zip.ts";
import { guvenliUrl, xlsxBayt, xmlKacis } from "../src/components/disa/xlsx.ts";
import { kusurParcala } from "../src/modules/musteri-paneli/ui/kusur.ts";
import { zipAc } from "./yardimci/zip.ts";

const metin = (b: Uint8Array | undefined) => new TextDecoder().decode(b);

test("ZIP: yapı ve CRC doğru; Türkçe ad UTF-8; zararlı ad (mutlak, .., ters bölü, yinelenen) reddedilir", () => {
  const z = zipAc(zipBayt([["Merkez Tesis/rapor-ığüşöç.pdf", new Uint8Array([1, 2, 3])], ["boş.txt", ""], ["a.txt", "merhaba"]]));
  assert.deepEqual([...z.keys()], ["Merkez Tesis/rapor-ığüşöç.pdf", "boş.txt", "a.txt"]);
  assert.equal(metin(z.get("a.txt")), "merhaba");
  for (const ad of ["/etc/x", "../x", "a/../b", "a\\b", "", "a//b"]) assert.throws(() => zipBayt([[ad, "x"]]), /geçersiz dosya adı/, ad);
  assert.throws(() => zipBayt([["a", "1"], ["a", "2"]]), /geçersiz dosya adı/, "yinelenen");
});

test("xlsx: parçalar, başlık kalın, köprü GERÇEK bağlantı (formül değil) ve yalnız http(s); veri satır içi metin — '=' ile başlayan formül olmaz; XML kaçışı ve denetim karakteri", () => {
  const z = zipAc(xlsxBayt("Uygunsuzluklar", [
    ["Rapor", "Açıklama", "Sayı"],
    [{ metin: "Rapor", url: "https://deneme.probata.com.tr/portal/r/abc" }, `=HYPERLINK("http://kotu.example","tıkla")`, 3],
    [{ metin: "Rapor", url: "javascript:alert(1)" }, `<b>&"x"</b>\u0001son`, null],
  ]));
  for (const p of ["[Content_Types].xml", "_rels/.rels", "xl/workbook.xml", "xl/_rels/workbook.xml.rels", "xl/styles.xml", "xl/worksheets/sheet1.xml", "xl/worksheets/_rels/sheet1.xml.rels"]) {
    assert.ok(z.has(p), p);
  }
  const s = metin(z.get("xl/worksheets/sheet1.xml")), rel = metin(z.get("xl/worksheets/_rels/sheet1.xml.rels"));
  assert.ok(!s.includes("<f>"), "formül yok");
  assert.match(s, /<c r="A1" t="inlineStr" s="1">/, "başlık kalın");
  assert.match(s, /<hyperlinks><hyperlink ref="A2" r:id="rIdK1"\/><\/hyperlinks>/, "yalnız https köprü");
  assert.match(rel, /Target="https:\/\/deneme\.probata\.com\.tr\/portal\/r\/abc" TargetMode="External"/);
  assert.ok(!rel.includes("javascript"), "javascript: köprü olmaz");
  assert.match(s, /<c r="A3" t="inlineStr"><is><t xml:space="preserve">Rapor<\/t><\/is><\/c>/, "tehlikeli adres düz metin");
  assert.match(s, /<c r="B2" t="inlineStr"><is><t xml:space="preserve">=HYPERLINK\(&quot;http:\/\/kotu\.example&quot;,&quot;tıkla&quot;\)<\/t>/, "'=' verisi metin");
  assert.match(s, /<t xml:space="preserve">&lt;b&gt;&amp;&quot;x&quot;&lt;\/b&gt;son<\/t>/, "kaçış + denetim karakteri atıldı");
  assert.match(s, /<c r="C2"><v>3<\/v><\/c>/, "sayı sayı olarak");
  assert.match(metin(z.get("xl/workbook.xml")), /<sheet name="Uygunsuzluklar"/);
  assert.match(metin(z.get("[Content_Types].xml")), /spreadsheetml\.worksheet\+xml/);
  /* köprüsüz dosyada ilişki parçası yok */
  assert.ok(!zipAc(xlsxBayt("x", [["a"]])).has("xl/worksheets/_rels/sheet1.xml.rels"));
  /* sayfa adı: Excel'in yasakladığı karakterler ve 31 sınırı */
  assert.match(metin(zipAc(xlsxBayt("a/b:c*d?[e]\\".padEnd(50, "x"), [["a"]])).get("xl/workbook.xml")), /<sheet name="a b c d  e  x{19}"/);
});

test("yardımcılar: güvenli adres yalnız http(s); XML kaçışı; kusur metni kriter + açıklama", () => {
  assert.equal(guvenliUrl("https://a.example/x?y=1"), "https://a.example/x?y=1");
  for (const u of ["javascript:alert(1)", "file:///etc/passwd", "data:text/html,x", "vbscript:x", "nota url", ""]) assert.equal(guvenliUrl(u), null, u);
  assert.equal(xmlKacis(`a<b>&"c"\u0000\u001f`), "a&lt;b&gt;&amp;&quot;c&quot;");
  assert.deepEqual(kusurParcala("Emniyet ventili: Mühür kırık"), { kriter: "Emniyet ventili", aciklama: "Mühür kırık" });
  assert.deepEqual(kusurParcala("Yalıtım direnci: 0,4 MΩ (sınır ≥ 1 MΩ)"), { kriter: "Yalıtım direnci", aciklama: "0,4 MΩ (sınır ≥ 1 MΩ)" });
  assert.deepEqual(kusurParcala("Topraklama yok"), { kriter: "Topraklama yok", aciklama: "" });
});
