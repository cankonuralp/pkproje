/* NEREDEN GELDİ: pkproje §4.2 ("PDF sunucuda üretilir"), KOD-GECIS (HTML'den PDF'e başsız Chromium), araştırma C ("önce Chromium ölçümü"), reisim
   2026-09-28 ("ön izle halinde PDF halini indirebilmeliyim"). Kesin PDF motoru (src/belge/pdf.ts) gerçek Chromium'la: A4 PDF, Carlito gömülü,
   belge HTML'inde betik yok, sayfa dışarıya gitmez (yazı tipi ve görsel veri adresi). CI'da Chromium testten önce kurulur (.github/workflows/ci.yml).
   Süre ölçülüp yazılır (Vercel ölçümü: src/app/api/olcum/pdf, yalnız önizleme dağıtımı). */
import assert from "node:assert/strict";
import { test } from "node:test";
import { ornekAracTutanagi, ornekBelge, ornekEgitimFormu, ornekTeklif, ornekFatura, ornekTalep, ornekZimmetFormu } from "../src/belge/ornek.ts";
import { aracTutanagiPdf, belgeCss, belgeHtml, belgePdf, egitimPdf, faturaPdf, talepPdf, teklifPdf, zimmetPdf } from "../src/belge/pdf.ts";
import { imzayaUygun } from "../src/modules/raporlar/imza-pdf.ts";

test("belge HTML'i: betik yok, yazı tipi gömülü (dış adres yok)", () => {
  const html = belgeHtml(ornekBelge("ZPKR02"));
  assert.equal(/<script/i.test(html), false);
  assert.ok(belgeCss().includes("data:font/woff2;base64,"));
  assert.equal(/url\("\.\//.test(belgeCss()), false, "göreli yazı tipi adresi kalmadı");
  assert.equal(/(src|href)="https?:/i.test(html), false);
});

test("kesin PDF: üç şablonda A4 PDF basılır, Carlito gömülü, süre makul", async () => {
  for (const k of ["ZPKR01", "ZPKR02", "KOMPRESOR"] as const) {
    const bas = Date.now();
    const pdf = await belgePdf(ornekBelge(k));
    const sure = Date.now() - bas, metin = Buffer.from(pdf).toString("latin1");
    console.log(`PDF ${k}: ${pdf.length} bayt, ${sure} ms`);
    assert.equal(metin.slice(0, 5), "%PDF-", k);
    assert.ok(pdf.length > 5_000, `${k}: ${pdf.length} bayt`);
    assert.ok(/\/Type\s*\/Page\b/.test(metin), `${k}: sayfa yok`);
    assert.ok(/Carlito/.test(metin), `${k}: Carlito gömülü değil`);
    assert.ok(/\/MediaBox\s*\[\s*0\s+0\s+59[45](\.\d+)?\s+841(\.\d+)?\s*\]/.test(metin), `${k}: A4 değil`);
    assert.ok(sure < 30_000, `${k}: ${sure} ms`);
  }
});

test("teklif PDF'i (325): aynı motorla A4, Carlito gömülü, tek sayfa", async () => {
  const pdf = await teklifPdf(ornekTeklif()), metin = Buffer.from(pdf).toString("latin1");
  assert.equal(metin.slice(0, 5), "%PDF-");
  assert.ok(/Carlito/.test(metin), "Carlito gömülü değil");
  assert.ok(/\/MediaBox\s*\[\s*0\s+0\s+59[45](\.\d+)?\s+841(\.\d+)?\s*\]/.test(metin), "A4 değil");
  assert.equal((metin.match(/\/Type\s*\/Page\b/g) ?? []).length, 1, "tek sayfa");
});

test("fatura özeti PDF'i (340): aynı motorla A4, Carlito gömülü, tek sayfa", async () => {
  const pdf = await faturaPdf(ornekFatura()), metin = Buffer.from(pdf).toString("latin1");
  assert.equal(metin.slice(0, 5), "%PDF-");
  assert.ok(/Carlito/.test(metin), "Carlito gömülü değil");
  assert.ok(/\/MediaBox\s*\[\s*0\s+0\s+59[45](\.\d+)?\s+841(\.\d+)?\s*\]/.test(metin), "A4 değil");
  assert.equal((metin.match(/\/Type\s*\/Page\b/g) ?? []).length, 1, "tek sayfa");
});

test("talep formu PDF'i (341): aynı motorla A4, Carlito gömülü, tek sayfa", async () => {
  const pdf = await talepPdf(ornekTalep()), metin = Buffer.from(pdf).toString("latin1");
  assert.equal(metin.slice(0, 5), "%PDF-");
  assert.ok(/Carlito/.test(metin), "Carlito gömülü değil");
  assert.equal((metin.match(/\/Type\s*\/Page\b/g) ?? []).length, 1, "tek sayfa");
});

/* 342: araç tutanağının PDF'i teslim alanın imzasına gider (Onaylar › Diğer) — belge_onay yalnız imzalanabilir biçimdeki PDF'i kabul eder
   (imza-pdf.ts imzayaUygun: nesne akışı yok, katalog ve sayfalar ayrıştırılır). Motorun çıktısı bu biçimde olmalı; öteki belgeler de aynı motor. */
test("araç teslim tutanağı PDF'i (342): A4, Carlito gömülü, tek sayfa; motorun bütün çıktıları imzalanabilir biçimde", async () => {
  const pdf = await aracTutanagiPdf(ornekAracTutanagi()), metin = Buffer.from(pdf).toString("latin1");
  assert.equal(metin.slice(0, 5), "%PDF-");
  assert.ok(/Carlito/.test(metin), "Carlito gömülü değil");
  assert.ok(/\/MediaBox\s*\[\s*0\s+0\s+59[45](\.\d+)?\s+841(\.\d+)?\s*\]/.test(metin), "A4 değil");
  assert.equal((metin.match(/\/Type\s*\/Page\b/g) ?? []).length, 1, "tek sayfa");
  assert.ok(imzayaUygun(pdf), "araç tutanağı imzalanabilir biçimde değil");
  assert.ok(imzayaUygun(await talepPdf(ornekTalep())), "talep formu imzalanabilir biçimde değil");
  /* 344: zimmet teslim formu da kişinin imzasına gider */
  const z = await zimmetPdf(ornekZimmetFormu());
  assert.ok(imzayaUygun(z) && /Carlito/.test(Buffer.from(z).toString("latin1")), "zimmet formu imzalanabilir biçimde değil");
  /* 345: eğitim katılım formu da */
  const e = await egitimPdf(ornekEgitimFormu());
  assert.ok(imzayaUygun(e) && /Carlito/.test(Buffer.from(e).toString("latin1")), "eğitim formu imzalanabilir biçimde değil");
  assert.ok(imzayaUygun(await belgePdf(ornekBelge("ZPKR02"))), "rapor imzalanabilir biçimde değil");
});

/* 595 (sunum 595 madde 25–26 — reisim: "format yapıcıda e imza yeri de seçilebilsin e imza seçilen yere işlesin aşağıyada bu rapor e imzalıdır diye
   şerit gelecek"): gerçek Chromium'la imzaya hazırlanan (kesin) rapor — İmza hücresinin işareti bağlantı olarak basılır, yerine BOŞ imza alanı
   konur (işaret kalmaz), biçim imzalanabilir; imza aracının alanı doldurması imzalı PDF denetiminden geçer. Önizlemede alan yok; şerit bandı her
   sayfada (alt kenar boşluğu 20 mm — MediaBox aynı, içerik bandın üstünde). */
test("595 kesin rapor PDF'i: İmza hücresinde boş imza alanı, işaret kalmaz, imzalanabilir; alanın doldurulması kabul; önizlemede alan yok", async () => {
  const { imzaliPdfGecerli } = await import("../src/modules/raporlar/imza-pdf.ts");
  const kesin = await belgePdf({ ...ornekBelge("ZPKR02"), kesin: true }), m = Buffer.from(kesin).toString("latin1");
  assert.ok(/\/FT\s*\/Sig/.test(m), "imza alanı yok");
  assert.equal(m.includes("probata-eimza"), false, "işaret bağlantısı kaldı");
  assert.ok(imzayaUygun(kesin), "imzalanabilir biçimde değil");
  const a = /(\d+) 0 obj\s*(<<(?:(?!endobj)[\s\S])*?\/FT \/Sig(?:(?!endobj)[\s\S])*?>>)\s*endobj/.exec(m)!;
  const kok = [...m.matchAll(/\/Root\s+(\d+\s+\d+\s+R)/g)].at(-1)![1];
  const ek = `\n${a[1]} 0 obj\n${a[2].replace(/>>\s*$/, "/V 9001 0 R >>")}\nendobj\n9001 0 obj\n<< /Type /Sig /Filter /Adobe.PPKLite /ByteRange [0 10 20 30] /Contents <00ff> >>\nendobj\n`
    + `trailer\n<< /Root ${kok} /Prev 0 >>\n%%EOF\n`;
  assert.ok(imzaliPdfGecerli(kesin, new Uint8Array(Buffer.concat([Buffer.from(kesin), Buffer.from(ek, "latin1")]))), "alanı dolduran imza reddedildi");
  const onizleme = Buffer.from(await belgePdf(ornekBelge("ZPKR02"))).toString("latin1");
  assert.equal(/\/FT\s*\/Sig/.test(onizleme), false, "önizlemede imza alanı");
});
