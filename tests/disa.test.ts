/* NEREDEN GELDİ: maket musteri.html "Uygunsuzları indir" / "Excel indir" (2026-09-27: açık uygunsuzluklar gerçek .xlsx, kayıtlardan; Ö3 2026-10-01
   reisim: "excel de link olmalı, linke tıklayınca ilgili rapor açılmalı. "rapor" yazsın") · 320. Dışa aktarma yazıcıları saf (veritabanısız):
   ZIP yapısı (yerel başlık, merkez dizin, CRC — Node'un zlib.crc32'siyle karşılaştırılır), .xlsx parçaları, gerçek köprü (formül değil), XML
   kaçışı, formül enjeksiyonu (veri "=" ile başlasa da satır içi metin), tehlikeli adres şemaları. Olumsuz kanıt: tests/bozan/disa.bozan.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { zipBayt } from "../src/components/disa/zip.ts";
import { guvenliUrl, xlsxBayt, xmlKacis } from "../src/components/disa/xlsx.ts";
import { adParcasi, klasorAdi } from "../src/modules/musteri-paneli/ui/ad.ts";
import { kusurParcala } from "../src/modules/musteri-paneli/ui/kusur.ts";
import { raporZipi, ZIP_BAYT_SINIR, ZIP_SINIR, ZipSiniri, type ZipRaporu } from "../src/modules/musteri-paneli/ui/zipla.ts";
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
  /* kriter kayıtta ayrıysa (0036) ondan bölünür — kriterin kendisinde ": " olabilir (kilitli Bakanlık maddesi) */
  const kr = "Kablo renk kodları Nötr: Mavi Toprak: Sarı/ Yeşil";
  assert.deepEqual(kusurParcala(`${kr}: renkler karışık`, kr), { kriter: kr, aciklama: "renkler karışık" });
  assert.deepEqual(kusurParcala(kr, kr), { kriter: kr, aciklama: "" });
  assert.deepEqual(kusurParcala("A: b", "X"), { kriter: "A", aciklama: "b" }, "kriter metnin başı değilse eski ayrıştırma");
});

test("toplu indirme sınırları (320–323 incelemesi): en çok 300 rapor ve 500 MB; listedeki boyut indirmeden ÖNCE denetlenir (hiç dosya inmez), boyut bilinmiyorsa inerken sayılır ve aşan anda durur; aşım ayrı hata türü; sınır içinde tesis klasörlü ZIP", async () => {
  const alici = (bayt: number) => { const alinan: string[] = []; return { alinan, al: async (d: string) => { alinan.push(d); return new Uint8Array(bayt).fill(65); } }; };
  const r = (i: number, boyut: number, tesis = "Merkez"): ZipRaporu => ({ dosya: `d${i}`, no: `DA-0126-000${i}`, tesis, boyut });
  const sinirMi = (e: unknown, ileti: RegExp) => e instanceof ZipSiniri && ileti.test(e.message);
  const x1 = alici(1);
  await assert.rejects(raporZipi(Array.from({ length: ZIP_SINIR + 1 }, (_, i) => r(i, 1)), () => {}, x1.al), (e) => sinirMi(e, /En çok 300 rapor/));
  assert.equal(x1.alinan.length, 0);
  const x2 = alici(1);
  await assert.rejects(raporZipi([r(1, ZIP_BAYT_SINIR), r(2, 1)], () => {}, x2.al), (e) => sinirMi(e, /en çok 500 MB birlikte indirilir/));
  assert.equal(x2.alinan.length, 0, "listedeki boyut aşıyorsa hiçbir dosya inmez");
  const x3 = alici(6);
  await assert.rejects(raporZipi([r(1, 0), r(2, 0), r(3, 0)], () => {}, x3.al, 10), (e) => sinirMi(e, /Süzgeçle daraltın/));
  assert.deepEqual(x3.alinan, ["d1", "d2"], "boyut bilinmiyorsa inerken sayılır; aşan anda durur (üçüncü inmez)");
  const x4 = alici(3), ilerleme: number[] = [];
  const z = zipAc(new Uint8Array(Buffer.concat(await raporZipi([r(1, 3), r(2, 3, "Depo"), r(1, 3)], (i) => ilerleme.push(i), x4.al, 10))));
  assert.deepEqual([...z.keys()].sort(), ["Depo/DA-0126-0002.pdf", "Merkez/DA-0126-0001 (2).pdf", "Merkez/DA-0126-0001.pdf"]);
  assert.equal(metin(z.get("Depo/DA-0126-0002.pdf")), "AAA");
  assert.deepEqual(ilerleme, [0, 1, 2, 3]);
});

test("toplu indirme adları (321): tesis klasörü ve dosya adı yol olamaz (/ ters bölü .. sürücü), denetim ve Windows'un yasak karakterleri boşluk, boşsa 'Tesis'", () => {
  assert.equal(klasorAdi('Merkez/Depo\\Arka:Bölüm*?"<>|'), "Merkez Depo Arka Bölüm");
  assert.equal(klasorAdi("..\u0000\u001f.."), "Tesis");
  assert.equal(klasorAdi("  . Soğuk Hava Deposu .  "), "Soğuk Hava Deposu");
  assert.equal(klasorAdi("C:"), "C");
  assert.equal(klasorAdi("a".repeat(120)).length, 80);
  assert.equal(adParcasi("DENEME İKİ Iğdır"), "deneme-iki-ığdır");
  /* ZIP yazıcısı da yolu reddeder: klasorAdi çıktısı her zaman kabul edilir */
  for (const x of ["../x", "/abs", "a/../b", "\\\\sunucu\\pay"]) assert.doesNotThrow(() => zipBayt([[`${klasorAdi(x)}/${klasorAdi("DA-0126-0001")}.pdf`, "x"]]), x);
});
