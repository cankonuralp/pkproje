/* NEREDEN GELDİ: 2026-10-17 — reisim imzayeri'yle (mobil imza) iki raporu imzaladı, site "Eşleşmedi" dedi: "imzayeri ile mobil imza attım, o
   şeritler imzayerinde imzalanınca geliyor … kalacak tabiki bizim kontrolümüzde değil" · "sistemimiz her hangi bir imzalı raporu kabul etmeli
   zaten bu müşterilerden çokca dönüş almamıza sabep olabilir". Araç belgeyi imzadan önce baştan yeniden yazıyor (OpenPDF), damgasını kenara
   koyuyor; bayt öneki tutmuyor. Kilit: yeniden yazılmış ama İÇERİKÇE aynı PDF kabul (src/modules/raporlar/imza-esdeger.ts), raporun görünen
   içeriğini değiştiren her şey nedeniyle reddedilir. Veritabanısız; imzalar gerçek (uydurma kişili — tests/yardimci/gercek-imza.ts). Olumsuz
   kanıt: tests/bozan/imza-esdeger.bozan.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { dogrulamaRaporlari, esdegerNedeni, imzaliTaban } from "../src/modules/raporlar/imza-esdeger.ts";
import { ekImzaIcerikleri } from "../src/modules/raporlar/imza-pdf.ts";
import { imzaciNedeni } from "../src/modules/raporlar/imza-kimlik.ts";
import { ekle } from "../src/server/imza/pdf-ek.ts";
import { ekImzaNedeni } from "../src/server/imza/yukleme.ts";
import { imzaEki } from "./yardimci/gercek-imza.ts";
import { ornekPdf, yenidenYaz, type YenidenSecenek } from "./yardimci/pdf-yaz.ts";

const KOD = "0b6c6a41-6f8e-4c55-9d1f-2b3c4d5e6f70";
const A = ornekPdf({ dogrulama: `https://deneme.probata.example/dogrula/${KOD}.0.AbCdEfGh`, metin: "DN-1026-001-ab12c" });
/** yeniden yaz + gerçek imza (artımlı) → taban ya da neden */
const tabanNedeni = (p: YenidenSecenek = {}, imzasiz: Uint8Array = A) => {
  const r = imzaliTaban(imzasiz, imzaEki(yenidenYaz(imzasiz, p), "DENEME İMZACI"));
  return "neden" in r ? r.neden : null;
};

test("yeniden yazılmış imzalı PDF: içerik aynı, damga kenarda → taban yeniden yazılmış sürüm; imza ona göre sağlam, imzalayan okunur", () => {
  const b = yenidenYaz(A), imzali = imzaEki(b, "DENEME İMZACI");
  assert.notDeepEqual(b.subarray(0, 64), A.subarray(0, 64), "bayt öneki tutmuyor");
  const r = imzaliTaban(A, imzali);
  assert.ok("taban" in r, JSON.stringify(r));
  assert.equal(r.taban.length, b.length, "taban imza programının ilk sürümü");
  assert.equal(ekImzaNedeni(r.taban, imzali), null, "kripto tabana göre");
  assert.equal(imzaciNedeni(ekImzaIcerikleri(r.taban, imzali), "Deneme İmzacı"), null, "imzalayanın adı tabana göre okunur");
  /* bugünkü yol bozulmadı: artımlı imzada taban hazırladığımız PDF'in kendisi */
  const d = imzaliTaban(A, imzaEki(A));
  assert.ok("taban" in d && d.taban === A);
});

test("yeniden yazım biçimi önemsiz: numaralar, onaltılık dizgi, iki ondalık, yeniden sıkıştırma; bağlantımız ve imza alanımız atılabilir", () => {
  assert.equal(tabanNedeni(), null);
  assert.equal(tabanNedeni({ kaydir: 3000 }), null);
  assert.equal(tabanNedeni({ baglantiAt: true }), null, "doğrulama bağlantısı atıldı");
  assert.equal(tabanNedeni({ imzaAlaniKalsin: true }), null, "boş imza alanı kaldı");
  assert.equal(tabanNedeni({ onek: "q 1 0 0 1 0 0 cm\n" }), null, "birim dönüşüm");
  assert.equal(tabanNedeni({ sonek: " Q\nq\nq 1 0 0 1 550 10 cm /Xi0 Do Q\nq 1 0 0 1 0 5 cm /Xi0 Do Q\nQ\n", damga: [0, 0, 40, 40] }), null, "köşelerde karekod");
  /* e-imza yerimiz yalnız son sayfada: tek sayfalık raporda damga orada olabilir, iki sayfalıkta 1. sayfada içeriğin üstüne düşer */
  const yerde: YenidenSecenek = { sonek: " Q\nq 1 0 0 1 400 125 cm /Xi0 Do Q\n", damga: [0, 0, 150, 50] };
  assert.equal(tabanNedeni(yerde, ornekPdf({ sayfa: 1 })), null, "e-imza yerimizin içinde");
  assert.match(tabanNedeni(yerde)!, /1\. sayfada belgenin içeriğinin üstüne damga/);
  assert.equal(tabanNedeni({ sonek: " Q\nq 1 0 0 1 0 815 cm /Xi0 Do Q\n", damga: [0, 0, 595, 25] }), null, "üst kenarda");
  assert.match(tabanNedeni({ sonek: " Q\nq 1 0 0 1 0 790 cm /Xi0 Do Q\n", damga: [0, 0, 595, 30] })!, /içeriğinin üstüne damga/, "üst kenardan taşan");
  assert.equal(tabanNedeni({ onek: "", sonek: "" }), null, "damgasız yeniden yazım (boş sarma akışları)");
});

test("rapor değişmişse reddedilir: içerik, yazı tipi, resim, sayfa sayısı, boyut, bağlantı adresi", () => {
  assert.match(tabanNedeni({ icerik: (v) => Buffer.from(v.toString("latin1").replace("Uygun", "Kotuu"), "latin1") })!, /1\. sayfasının içeriği imzaya hazırlanan PDF'le aynı değil/);
  assert.match(tabanNedeni({ icerik: (v, s) => (s === 1 ? Buffer.from(v.toString("latin1").replace("sayfa 2", "sayfa 9"), "latin1") : v) })!, /2\. sayfasının içeriği/);
  assert.match(tabanNedeni({ icerik: (v, s) => (s === 1 ? Buffer.concat([v, Buffer.from("BT /F1 9 Tf (ek) Tj ET\n")]) : v) })!, /izin dışı bir çizim eklemiş \(BT\)/, "sona yazı");
  assert.match(tabanNedeni({ sozluk: (s, no) => (no === 3 ? s.replace("/Helvetica", "/Courier") : s) })!, /yazı tipi farklı \(F1\)/);
  const resimli = ornekPdf({ resim: Buffer.from("\xff\xd8 baska resim \xff\xd9", "latin1") });
  assert.equal(tabanNedeni({}, resimli), null, "kendi resmiyle aynı");
  assert.match(tabanNedeni({ sozluk: (s, no) => (no === 4 ? s.replace("/Width 2", "/Width 3") : s) })!, /resim farklı \(Im1\)/);
  assert.match(tabanNedeni({ sozluk: (s, no) => (no === 2 ? s.replace(/\/Kids \[(\d+ 0 R) [^\]]*\]/, "/Kids [$1]").replace("/Count 2", "/Count 1") : s) })!,
    /sayfa sayısı farklı \(1; imzaya hazırlanan PDF 2 sayfa\)/);
  assert.match(tabanNedeni({ sozluk: (s, no) => (no === 2 ? s.replace(/\/MediaBox \[[^\]]*\]/, "/MediaBox [0 0 612 792]") : s) })!, /boyutu farklı/);
  assert.match(tabanNedeni({ sozluk: (s, no) => (no === 12 ? s.replace(/<[0-9a-f]+>/, `<${Buffer.from("https://sahte.example/x").toString("hex")}>`) : s) })!,
    /bağlantının adresi değiştirilmiş/);
});

test("imza programının ekledikleri sınırlı: damga içerikte, yazı / şekil / küçültme / saydamlık / gizleme, izin dışı açıklama ve eylem reddedilir", () => {
  assert.match(tabanNedeni({ sonek: " Q\nq\nq 1 0 0 1 200 400 cm /Xi0 Do Q\nQ\n" })!, /1\. sayfada belgenin içeriğinin üstüne damga koymuş/);
  assert.match(tabanNedeni({ sonek: " Q\nq 1 0 0 4 25 6 cm /Xi0 Do Q\n" })!, /içeriğinin üstüne damga/, "büyütülmüş damga");
  assert.match(tabanNedeni({ sonek: " Q\nBT /F1 12 Tf 100 400 Td (UYGUN DEGIL) Tj ET\n" })!, /izin dışı bir çizim eklemiş \(BT\)/);
  assert.match(tabanNedeni({ sonek: " Q\n1 1 1 rg 0 0 595 842 re f\n" })!, /izin dışı bir çizim eklemiş \(rg\)/);
  assert.match(tabanNedeni({ onek: "q 0.5 0 0 0.5 0 0 cm\n" })!, /çizimini etkileyen bir ayar/, "küçültme");
  assert.match(tabanNedeni({ onek: "q /G1 gs\n" })!, /çizimini etkileyen bir ayar/, "saydamlık");
  assert.match(tabanNedeni({ onek: "q /OC /x BDC\n" })!, /çizimini etkileyen bir ayar/, "gizleme");
  assert.match(tabanNedeni({ onek: "q (", sonek: ") Q\n" })!, /çizimine karışmış/, "çizimimiz dizginin içine alındı");
  assert.equal(tabanNedeni({ onek: "q %", sonek: "\nQ\n" }), null, "akış sonu yorumu bitirir");
  const ek = (sozluk: string, no = 9100): YenidenSecenek => ({ ekNesne: [{ no, sozluk }], ekAciklama: [`${no} 0 R`] });
  assert.match(tabanNedeni(ek("<< /Type /Annot /Subtype /FreeText /Rect [100 400 300 450] /Contents (Uygun degil) >>"))!, /izin dışı bir açıklama eklemiş \(FreeText\)/);
  assert.match(tabanNedeni(ek("<< /Type /Annot /Subtype /Widget /FT /Sig /Rect [100 400 300 450] >>"))!, /imza kutusunu belgenin içeriğinin üstüne/);
  assert.equal(tabanNedeni(ek("<< /Type /Annot /Subtype /Widget /FT /Sig /Rect [0 0 0 0] >>")), null, "görünmez imza alanı");
  assert.match(tabanNedeni(ek("<< /Subtype /Link /Rect [49 6 546 49] /A << /S /JavaScript /JS (app.alert(1)) >> >>"))!, /izin dışı bir açıklama eklemiş \(Link\)/);
  assert.match(tabanNedeni(ek("<< /Subtype /Link /Rect [100 400 300 450] /A << /S /URI /URI (https://x.example) >> >>"))!, /izin dışı bir açıklama/, "içerikte bağlantı");
  assert.match(tabanNedeni({ sozluk: (s, no) => (no === 1 ? s.replace(/>>\s*$/, "/OpenAction << /S /JavaScript /JS (x) >> >>") : s) })!, /izin dışı bir özellik eklemiş \(OpenAction\)/);
  assert.match(tabanNedeni({ sozluk: (s, no) => (no === 1 ? s.replace(/>>\s*$/, "/Names << /JavaScript << /Names [] >> >> >>") : s) })!, /\(JavaScript\)/);
  assert.match(tabanNedeni({ sozluk: (s, no) => (no === 10 ? s.replace(/>>\s*$/, "/UserUnit 2 >>") : s) })!, /\(UserUnit\)/);
});

test("önceki imzayı taşıyan PDF (teknik yönetici): yeniden yazım reddedilir, üstüne ARTIMLI damga + imza kabul", () => {
  const ty = imzaEki(A, "DENEME TEKNİK");
  assert.match(tabanNedeni({}, ty)!, /önceki imzayı \(teknik yöneticinin imzası\) bozar/);
  /* artımlı damga: sayfa sözlüğü yeniden tanımlanır (çizim sarılır, damga formu eklenir), sonra imza */
  const N = 20000, s = (i: number) => 10 + i * 3;
  const sayfa = (i: number) => `<< /Type /Page /Parent 2 0 R /Contents [${N + 10 * i} 0 R ${s(i) + 1} 0 R ${N + 10 * i + 1} 0 R] /Resources << /Font << /F1 3 0 R >> `
    + `/XObject << /Im1 4 0 R /Xi0 ${N + 5} 0 R >> /ExtGState << /G1 5 0 R >> /ProcSet [/PDF /Text /ImageC] >> /Annots [${s(i) + 2} 0 R${i === 1 ? " 6 0 R" : ""}] >>`;
  const akis = (v: string, sozluk = "") => Buffer.from(`<< ${sozluk}/Length ${v.length} >>\nstream\n${v}\nendstream`, "latin1");
  const damgali = ekle(ty, [
    { no: s(0), govde: sayfa(0) }, { no: s(1), govde: sayfa(1) },
    { no: N, govde: akis("q\n") }, { no: N + 1, govde: akis(" Q\nq 1 0 0 1 25 6 cm /Xi0 Do Q\n") },
    { no: N + 10, govde: akis("q\n") }, { no: N + 11, govde: akis(" Q\nq 1 0 0 1 25 6 cm /Xi0 Do Q\n") },
    { no: N + 5, govde: akis("0 0 1 rg 0 0 497 43 re f", "/Type /XObject /Subtype /Form /BBox [0 0 497 43] ") },
  ]).pdf;
  const imzali = imzaEki(damgali, "DENEME BİR");
  const r = imzaliTaban(ty, imzali);
  assert.ok("taban" in r, JSON.stringify(r));
  assert.equal(r.taban.length, damgali.length, "taban: önceki imzalı PDF + damga eki");
  assert.equal(ekImzaNedeni(r.taban, imzali), null);
  assert.equal(imzaciNedeni(ekImzaIcerikleri(r.taban, imzali), "Deneme Bir"), null, "eklenen imza uzmanın; teknik yöneticininki sayılmaz");
});

test("imzasız / başka belge / bozuk girdi: genel neden; ağır girdi sınırlı sürede", () => {
  assert.deepEqual(imzaliTaban(A, yenidenYaz(A)), { neden: "Yüklenen PDF bu raporun imzaya hazırlanan PDF'i değil ya da imza taşımıyor." }, "imzasız yeniden yazım");
  const baska = ornekPdf({ metin: "DN-1026-002-cd34e" });
  assert.equal(tabanNedeni({}, baska), null);
  assert.deepEqual(imzaliTaban(A, imzaEki(yenidenYaz(baska))), { neden: "Yüklenen PDF bu raporun imzaya hazırlanan PDF'i değil ya da imza taşımıyor." },
    "başka raporun imzalısı: genel neden (doğrulama bağlantısı bizimki değil)");
  assert.match(tabanNedeni({ icerik: (v) => Buffer.from(v.toString("latin1").replace("Uygun", "Kotuu"), "latin1") })!, /aynı değil/, "bizim bağlantımızla: ayrıntılı neden");
  assert.equal(tabanNedeni({ baglantiAt: true, icerik: (v) => Buffer.from(v.toString("latin1").replace("Uygun", "Kotuu"), "latin1") }),
    "Yüklenen PDF bu raporun imzaya hazırlanan PDF'i değil ya da imza taşımıyor.", "bağlantısı atılmış değişik belge: genel neden");
  assert.equal(esdegerNedeni(A, new TextEncoder().encode("%PDF-1.4\nbozuk")), "İmzalı PDF okunamadı.");
  /* çok sayfalı belge: 150 sayfa sınırlı sürede */
  const buyuk = ornekPdf({ sayfa: 150 });
  const bas = performance.now();
  assert.equal(tabanNedeni({}, buyuk), null);
  assert.ok(performance.now() - bas < 8000, `${Math.round(performance.now() - bas)} ms`);
  /* çizime karışık çok belirteç: sınır aşılınca neden (çökmez) */
  const sisik = yenidenYaz(A, { sonek: ` Q\n${"q Q ".repeat(800_000)}\n` });
  assert.match(esdegerNedeni(A, sisik) ?? "", /çok büyük|karşılaştırılamadı/);
});

test("doğrulama bağlantısından rapor kimliği (toplu yüklemede eşleştirme): düz ve onaltılık dizgide", () => {
  assert.deepEqual(dogrulamaRaporlari(A), [KOD]);
  assert.deepEqual(dogrulamaRaporlari(imzaEki(yenidenYaz(A))), [KOD], "yeniden yazımda adres onaltılık dizgi");
  assert.deepEqual(dogrulamaRaporlari(ornekPdf()), []);
});
