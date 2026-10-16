/* NEREDEN GELDİ: sunum 595 madde 25–26 (reisim 2026-10-16: "format yapıcıda e imza yeri de seçilebilsin e imza seçilen yere işlesin aşağıyada bu
   rapor e imzalıdır diye şerit gelecek ona göre format yapıcıda raporlar aşağıda boşluk bırakmayı unutmasınlar"; K7 "ikisi", K8 "tam"). Saf
   (veritabanısız, Chromium'suz — gerçek motorla tests/pdf.test.ts): belge İmza hücresine işaret koyar (yalnız imzaya hazırlanan belgede, yer
   hücreyse, bir kez); eimza.ts işaretin yerine boş imza alanı koyar (kutu son sayfada mm'den, görünmez alansız), çıktı klasik xref'li ve imzalanabilir
   biçimde; imza aracının alanı doldurması kabul, alanın yerini / adını değiştirmek ya da olmayan imzaya bağlamak RED; şerit yazısı; kurucu ve S.A.Y. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { PDFDocument, PDFString } from "pdf-lib";
import { belgeAltYazisi, raporBelgesi } from "../src/belge/belge.ts";
import { EIMZA_ALAN_ADI, EIMZA_ISARETI, imzaAlaniKoy } from "../src/belge/eimza.ts";
import { ornekBelge } from "../src/belge/ornek.ts";
import { eimzaYeri, raporAltBilgisi } from "../src/belge/pdf.ts";
import { FormatTanimi } from "../src/format/tanim.ts";
import { eimzaYaz, EIMZA_SERIT_MM } from "../src/modules/rapor-format/kurucu.ts";
import { formatHaritasi, formatIslemleri } from "../src/modules/rapor-format/say-kurucu.ts";
import { imzaliPdfGecerli, imzayaUygun } from "../src/modules/raporlar/imza-pdf.ts";

const latin1 = (b: Uint8Array) => Buffer.from(b).toString("latin1");
/** iki sayfalı PDF; ikinci sayfada işaret bağlantısı (Chromium'un bastığı gibi) ve sıradan bir bağlantı */
async function ornekPdf(): Promise<Uint8Array> {
  const d = await PDFDocument.create();
  d.addPage([595.28, 841.89]); const p2 = d.addPage([595.28, 841.89]);
  const baglanti = (uri: string, rect: number[]) => d.context.register(d.context.obj({ Type: "Annot", Subtype: "Link", Rect: rect, A: { S: "URI", URI: PDFString.of(uri) } }));
  p2.node.addAnnot(baglanti(EIMZA_ISARETI, [190, 150, 560, 190]));
  p2.node.addAnnot(baglanti("https://ornek.example/", [10, 10, 50, 20]));
  return d.save({ useObjectStreams: false });
}
/** imza aracının yaptığı gibi artımlı imza: alanı yeniden yazar (/V yeni imza sözlüğüne, /AP görünüm), yeni xref + trailer (aynı kök) */
function alaniImzala(imzasiz: Uint8Array, bozan: (govde: string) => string = (g) => g, vNo?: number): Uint8Array {
  const s = latin1(imzasiz);
  const m = /(\d+) 0 obj\s*(<<(?:(?!endobj)[\s\S])*?\/FT \/Sig(?:(?!endobj)[\s\S])*?>>)\s*endobj/.exec(s);
  assert.ok(m, "imza alanı nesnesi yok");
  const no = Number(m[1]), kok = [...s.matchAll(/\/Root\s+(\d+\s+\d+\s+R)/g)].at(-1)![1];
  const imzaNo = 9001, gorunum = 9002;
  const govde = bozan(m[2].replace(/>>\s*$/, `/V ${vNo ?? imzaNo} 0 R /AP << /N ${gorunum} 0 R >> >>`));
  const ek = `\n${no} 0 obj\n${govde}\nendobj\n${imzaNo} 0 obj\n<< /Type /Sig /Filter /Adobe.PPKLite /ByteRange [0 10 20 30] /Contents <00ff> >>\nendobj\n`
    + `${gorunum} 0 obj\n<< /Type /XObject /Subtype /Form /BBox [0 0 100 40] /Length 0 >>\nstream\n\nendstream\nendobj\ntrailer\n<< /Root ${kok} /Prev 0 >>\n%%EOF\n`;
  return new Uint8Array(Buffer.concat([Buffer.from(imzasiz), Buffer.from(ek, "latin1")]));
}

test("belge: İmza hücresine işaret yalnız imzaya hazırlanan belgede, yer hücreyse ve bir kez; adres eimza.ts'tekiyle aynı", () => {
  const v = ornekBelge("KOMPRESOR");
  const say = (h: string) => (h.match(/<a class="rb-eimza" href="probata-eimza:uzman">/g) ?? []).length;
  assert.equal(say(renderToStaticMarkup(raporBelgesi({ ...v, kesin: true }) as never)), 1);
  assert.equal(say(renderToStaticMarkup(raporBelgesi(v) as never)), 0, "önizlemede yok");
  for (const eimza of [{ yer: "kutu" as const, x: 10, y: 10, en: 50, boy: 20 }, { yer: "gorunmez" as const }]) {
    const tanim = { ...v.tanim, gorunum: { ...v.tanim.gorunum, eimza } };
    assert.equal(say(renderToStaticMarkup(raporBelgesi({ ...v, tanim, kesin: true }) as never)), 0, eimza.yer);
  }
  assert.ok(readFileSync("src/belge/belge.ts", "utf8").includes(`const EIMZA_ISARETI = "${EIMZA_ISARETI}";`), "iki dosyada aynı işaret");
});

test("imza alanı: işaretin yerinde (aynı sayfa, içte), işaret kalkar, öteki bağlantı kalır; kutu son sayfada mm'den; görünmezde alan yok; biçim imzalanabilir", async () => {
  const ham = await ornekPdf();
  const h = await imzaAlaniKoy(ham, { yer: "hucre" });
  let d = await PDFDocument.load(h);
  const annot = (i: number) => (d.getPages()[i].node.Annots()?.asArray() ?? []).map((r) => d.context.lookup(r)!.toString());
  const a2 = annot(1);
  assert.ok(a2.some((x) => /\/FT \/Sig/.test(x) && /\/Rect \[ 191 151 559 189 \]/.test(x) && x.includes(EIMZA_ALAN_ADI)), a2.join("\n"));
  assert.ok(!a2.some((x) => x.includes(EIMZA_ISARETI)), "işaret kalktı");
  assert.equal(latin1(h).includes(EIMZA_ISARETI), false, "işaret metni dosyada da yok");
  assert.ok(a2.some((x) => x.includes("ornek.example")), "öteki bağlantı kalır");
  assert.equal(d.catalog.getAcroForm()?.getAllFields().length, 1);
  assert.equal(/\/ObjStm/.test(latin1(h)), false);
  assert.ok(imzayaUygun(h), "imzalanabilir biçim");
  const k = await imzaAlaniKoy(ham, { yer: "kutu", x: 120, y: 240, en: 80, boy: 25 });
  d = await PDFDocument.load(k);
  const mm = 72 / 25.4, r = (n: number) => Math.round(n * 100) / 100;
  const beklenen = `/Rect [ ${r(120 * mm)} ${r(841.89 - (240 + 25) * mm)} ${r(200 * mm)} ${r(841.89 - 240 * mm)} ]`;
  assert.ok(annot(1).some((x) => x.includes(beklenen)), `${beklenen}\n${annot(1).join("\n")}`);
  assert.ok(!annot(0).some((x) => /\/FT \/Sig/.test(x)), "ilk sayfada değil");
  const g = await imzaAlaniKoy(ham, { yer: "gorunmez" });
  assert.equal(/\/FT \/Sig/.test(latin1(g)), false);
  d = await PDFDocument.load(g);
  assert.ok(!annot(1).some((x) => x.includes(EIMZA_ISARETI)), "görünmezde de işaret kalkar");
  /* hücre seçili ama işaret yok (İmza satırı çıkarılmış) → alan yok */
  assert.equal(/\/FT \/Sig/.test(latin1(await imzaAlaniKoy(await PDFDocument.create().then(async (x) => { x.addPage(); return x.save({ useObjectStreams: false }); }), { yer: "hucre" }))), false);
});

test("imzalı PDF: aracın boş alanı doldurması kabul; alanın yeri / adı değişirse, değer olmayan ya da özgün nesneye bağlanırsa RED", async () => {
  const imzasiz = await imzaAlaniKoy(await ornekPdf(), { yer: "hucre" });
  assert.equal(imzaliPdfGecerli(imzasiz, alaniImzala(imzasiz)), true);
  assert.equal(imzaliPdfGecerli(imzasiz, alaniImzala(imzasiz, (g) => g.replace(/\/Rect \[[^\]]*\]/, "/Rect [ 0 0 595 842 ]"))), false, "yer değişti");
  assert.equal(imzaliPdfGecerli(imzasiz, alaniImzala(imzasiz, (g) => g.replace(/\/T \([^)]*\)/, "/T (baska)"))), false, "ad değişti");
  assert.equal(imzaliPdfGecerli(imzasiz, alaniImzala(imzasiz, (g) => g.replace("/FT /Sig", "/FT /Tx"))), false, "tür değişti");
  assert.equal(imzaliPdfGecerli(imzasiz, alaniImzala(imzasiz, (g) => g, 1)), false, "değer özgün nesneye");
  assert.equal(imzaliPdfGecerli(imzasiz, alaniImzala(imzasiz, (g) => g, 9999)), false, "değer olmayan nesneye");
});

test("şerit: imzaya hazırlanan belgede e-imza cümlesi, imzalı kopyada / önizlemede ne olduğu; numara kaçışlı, sayfa no, gömülü yazı tipi", () => {
  const v = ornekBelge("ZPKR02");
  assert.match(belgeAltYazisi({ ...v, kesin: true }).metin, /^Bu rapor 5070 sayılı Elektronik İmza Kanunu'na uygun güvenli elektronik imza ile imzalanmıştır\.$/);
  assert.match(belgeAltYazisi({ ...v, imza: { zaman: "2026-10-05T10:00:00.000Z", yontem: "e-imzalı PDF" } }).metin, /basılı kopyası/);
  assert.match(belgeAltYazisi(v).metin, /^İmzasız önizleme/);
  assert.equal(belgeAltYazisi({ ...v, revizyon: 2 }).no, `${v.no}-R2`);
  const a = raporAltBilgisi({ ...v, no: "<b>&", kesin: true });
  assert.ok(a.includes("&lt;b&gt;&amp;") && !a.includes("<b>&"), "kaçış");
  assert.ok(a.includes('<span class="pageNumber"></span> / <span class="totalPages"></span>'));
  assert.ok(/@font-face \{[^}]*data:font\/woff2;base64,/.test(a), "yazı tipi gömülü (sunucusuz Chromium'da sistem yazı tipi yok)");
  assert.equal(/url\("\.\//.test(a), false);
});

test("kurucu ve S.A.Y: e-imzanın yeri — hücre varsayılan (görünümde yok), kutu sınır içinde (şerit bandına girmez), görünmez; PDF yeri", () => {
  const t = FormatTanimi.parse(ornekBelge("KOMPRESOR").tanim);
  assert.deepEqual(eimzaYeri(t), { yer: "hucre" });
  const k = eimzaYaz(t, { yer: "kutu", x: 500, y: 500, en: 5, boy: 500 });
  assert.deepEqual(k.gorunum.eimza, { yer: "kutu", x: 190, y: 297 - EIMZA_SERIT_MM - 100, en: 20, boy: 100 });
  assert.ok(FormatTanimi.safeParse(k).success);
  assert.deepEqual(eimzaYeri(k), { yer: "kutu", x: 190, y: 177, en: 20, boy: 100 });
  assert.equal("eimza" in eimzaYaz(k, { yer: "hucre" }).gorunum, false);
  assert.deepEqual(eimzaYeri(eimzaYaz(k, { yer: "gorunmez" })), { yer: "gorunmez" });
  const r = formatIslemleri(t, [{ islem: "eimza_yeri", yer: "kutu", x: "100", y: 200, en: 60, boy: 20 }, { islem: "eimza_yeri", yer: "yan" }]);
  assert.deepEqual([r.yapilan.length, r.gecersiz.length], [1, 1]);
  assert.deepEqual(r.t.gorunum.eimza, { yer: "kutu", x: 100, y: 200, en: 60, boy: 20 });
  assert.match(formatHaritasi(r.t), /^E-imzanın yeri: son sayfada kutu \(soldan 100 mm, üstten 200 mm, 60 × 20 mm\)$/m);
});
