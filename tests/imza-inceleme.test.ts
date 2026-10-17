/* NEREDEN GELDİ: IMZA-SERVISI.md ES1 (çözümleyici + yükleme denetimi) — 2026-10-17 BAĞIMSIZ DÜŞMANCA İNCELEME (reisim: "bizim kod açısından yapmamız gereken her ne var
   ise listele sırala ve o sıraya göre sırayla yapıp bitir"; çözümleyici kaydedilmeden önce ayrı bir incelemeden geçti, 9 bulgu doğrulandı). Her
   bulgunun kalıcı kilidi:
   1. imzalayanın kendi anahtarıyla bastığı geriye tarihli "damga" (sunucu sertifikası zaman damgası için değil / damga anında geçersiz / damga
      sertifikaya bağlı değil) sayılmaz — süresi dolmuş sertifika yüklemeden geçmez;
   2. sertifika değiştirme (imzasız sid + küme): imzalayan imzalı signingCertificate özetiyle seçilir; bağ tutmazsa imza sağlam değil;
   3. DSS yalnız son kataloğun — yorumdaki / var olmayan nesnelere başvuran DSS kanıt sayılmaz; başka sertifikanın OCSP cevabı B-LT saydırmaz;
   4. imzadan sonraki değişiklik (sayfa, içerik akışı) imza başına "değişiklik" — üstüne belge damgası basılsa da; izinli ekler "izinli";
   5. bozuk yapılar (eksik alanlı CMS, konumsuz AIA, çözülemeyen açık anahtar) fırlatmaz — "okunamadı";
   6. kapanmayan dizilerle dolu belge çözümleyiciyi yavaşlatmaz (eski metin taraması 1 MB'ta 11 sn);
   7. sertifika makamı olmayan sertifika veren sayılmaz; CMS sertifika kümesi sınırlı; SHA-1 imza / özet desteklenmiyor.
   Olumsuz kanıt: tests/bozan/imza-inceleme.bozan.ts. */
import assert from "node:assert/strict";
import { createHash, sign } from "node:crypto";
import { test } from "node:test";
import { PDFDocument, rgb } from "pdf-lib";
import { CMS_OID, algoritmaDenetle, damgaDenetle, imzaliVeriOku, ozetDenetle } from "../src/server/imza/cms.ts";
import { oid, oktet, sira, tamsayi } from "../src/server/imza/der.ts";
import { nesneOkuyucu, sonDurum } from "../src/server/imza/pdf-ek.ts";
import { pdfImzalariniCozumle } from "../src/server/imza/pdf-imzalar.ts";
import { sertifikaOku, vereniBul, zincirKur } from "../src/server/imza/sertifika.ts";
import { ekImzaNedeni } from "../src/server/imza/yukleme.ts";
import {
  TABAN_PDF, crlYap, damgaYap, denemeKimlikleri, dssEkle, imzaEkle, ocspCevabiYap, pdfImzala, sertifikaYap, uzanti, type Kimlik,
} from "./yardimci/gercek-imza.ts";
/* imza / DSS / belge damgası / artımlı ek YALNIZ test verisi üreticisinden (imza üretimi probata-sign'da; sınanan probata'nın okuyucusu) */
import { imzaliOznitelikler, imzaliVeriKur } from "./yardimci/imza-uret/cms-yaz.ts";
import { imzaHazirla, imzaTamamla } from "./yardimci/imza-uret/imzala.ts";
import { belgeDamgasiEkle, ltvEkle } from "./yardimci/imza-uret/ltv.ts";
import { ekle } from "./yardimci/imza-uret/pdf-ek-yaz.ts";

const k = denemeKimlikleri("ecdsa");
const SIMDI = new Date("2026-10-17T12:00:00Z");

test("1: imzalayanın kendi anahtarıyla bastığı geriye tarihli damga sayılmaz; süresi dolmuş sertifika yüklemeden geçmez", () => {
  const eski = sertifikaYap({ cn: "ESKİ DENEME", veren: k.ara, tur: "ecdsa", bas: new Date("2024-01-01T00:00:00Z"), son: new Date("2025-01-01T00:00:00Z") });
  /* "damga sunucusu" imzalayanın kendisi (zaman damgası kullanımı yok) */
  const p = pdfImzala(TABAN_PDF, 10, { ...k, tsa: eski }, { kisi: eski, damga: true, damgaZamani: new Date("2024-06-01T00:00:00Z") });
  const i = pdfImzalariniCozumle(p).imzalar[0];
  assert.equal(i.damga?.imza, "bozuk");
  assert.equal(i.anindaGecerli, false);
  assert.equal(ekImzaNedeni(TABAN_PDF, p, SIMDI), "İmzadaki zaman damgası doğrulanamadı.");
  const token = damgaYap([Buffer.from("veri")], eski, [], new Date("2024-06-01T00:00:00Z"));
  assert.equal(damgaDenetle(token, [Buffer.from("veri")]).tsaHatasi, "sertifika zaman damgası için değil");
  /* zaman damgası kullanımı olan ama damga anında süresi dolmuş sunucu */
  const bitmis = sertifikaYap({ cn: "Eski Damga Sunucusu", damga: true, veren: k.ara, tur: "ecdsa", bas: new Date("2019-01-01T00:00:00Z"), son: new Date("2020-02-01T00:00:00Z") });
  assert.equal(damgaDenetle(damgaYap([Buffer.from("veri")], bitmis, [], new Date("2024-06-01T00:00:00Z")), [Buffer.from("veri")]).tsaHatasi, "sertifika damga anında geçerli değil");
  /* damganın imzalı signingCertificate'i başka bir sertifikayı gösteriyor */
  const tst = sira(tamsayi(1), oid("2.16.792.3.0.99.9"), sira(sira(oid("2.16.840.1.101.3.4.2.1"), Buffer.from([5, 0])), oktet(createHash("sha256").update("veri").digest())),
    tamsayi(7), Buffer.from([0x18, 0x0f, ...Buffer.from("20261017090000Z")]));
  const oz = imzaliOznitelikler({ belgeOzeti: createHash("sha256").update(tst).digest(), sertifikaDer: k.ara.der, ozet: "sha256", icerikTuru: CMS_OID.tstBilgisi });
  const bagsiz = imzaliVeriKur({ imzaliOz: oz, imzaDegeri: sign("sha256", oz, k.tsa.anahtar), sertifikaDer: k.tsa.der, ozet: "sha256", anahtarTuru: "ecdsa", icerikTuru: CMS_OID.tstBilgisi, icerik: tst });
  assert.equal(damgaDenetle(bagsiz, [Buffer.from("veri")]).tsaHatasi, "damganın sertifika bağı tutmuyor");
  assert.equal(damgaDenetle(bagsiz, [Buffer.from("veri")]).imza, "bozuk");
});

/** A ile imzalanmış (signingCertificate A'yı gösterir) ama sid + küme B'ye çevrilmiş imza */
function degistirilmis(a: Kimlik, b: Kimlik, aKumede: boolean): Buffer {
  return imzaEkle(TABAN_PDF, 10, (parcalar) => {
    const h = createHash("sha256"); for (const x of parcalar) h.update(x);
    const oz = imzaliOznitelikler({ belgeOzeti: h.digest(), sertifikaDer: a.der, ozet: "sha256" });
    return imzaliVeriKur({ imzaliOz: oz, imzaDegeri: sign("sha256", oz, a.anahtar), sertifikaDer: b.der, ekSertifikalar: [...(aKumede ? [a.der] : []), k.ara.der, k.kok.der], ozet: "sha256", anahtarTuru: "ecdsa" });
  });
}

test("2: sertifika değiştirme — imzalayan imzalı signingCertificate özetiyle seçilir; özetin sertifikası yoksa bağ tutmaz, imza sağlam değil", () => {
  const a = sertifikaYap({ cn: "KİŞİ A NİTELİKSİZ", veren: k.ara, tur: "ecdsa", nitelikli: false });
  const b = sertifikaYap({ cn: "KİŞİ B NİTELİKLİ", veren: k.ara, ayniAnahtar: a });
  const ikisi = pdfImzalariniCozumle(degistirilmis(a, b, true)).imzalar[0];
  assert.deepEqual([ikisi.imzalayan?.ad, ikisi.imzalayan?.nitelikli, ikisi.sertifikaBagi], ["KİŞİ A NİTELİKSİZ", false, true], "imzalanan kimlik A");
  assert.match(ekImzaNedeni(TABAN_PDF, degistirilmis(a, b, true), SIMDI) ?? "", /nitelikli elektronik sertifikayla atılmamış/);
  const c = pdfImzalariniCozumle(degistirilmis(a, b, false));
  assert.deepEqual([c.imzalar[0].imzalayan?.ad, c.imzalar[0].sertifikaBagi], ["KİŞİ B NİTELİKLİ", false]);
  assert.equal(c.duzey, "yok", "bağı tutmayan imza sağlam sayılmaz");
  assert.match(ekImzaNedeni(TABAN_PDF, degistirilmis(a, b, false), SIMDI) ?? "", /imzaya bağlı değil/);
});

test("3: DSS yalnız son kataloğun — yorumdaki ya da var olmayan nesneye başvuran DSS kanıt değil; başka sertifikanın OCSP cevabı B-LT saydırmaz", () => {
  const p = pdfImzala(TABAN_PDF, 10, k, { damga: true });
  const yorum = Buffer.concat([p, Buffer.from("% /DSS << /OCSPs [999 0 R] /CRLs [998 0 R] >>\n", "latin1")]);
  const c1 = pdfImzalariniCozumle(yorum);
  assert.deepEqual([c1.dss.var, c1.duzey], [false, "B-T"]);
  const yok = Buffer.concat([p, Buffer.from("1 0 obj\n<< /Type /Catalog /Pages 2 0 R /DSS << /OCSPs [999 0 R] /CRLs [998 0 R] >> >>\nendobj\n%%EOF\n", "latin1")]);
  const c2 = pdfImzalariniCozumle(yok);
  assert.deepEqual([c2.dss.var, c2.dss.ocsp, c2.dss.crl, c2.duzey], [true, 0, 0, "B-T"]);
  /* başka makamın kişisi için cevap ve liste: bu imzalayanı kapsamaz */
  const baska = denemeKimlikleri("ecdsa", "BAŞKA DENEME");
  const c3 = pdfImzalariniCozumle(dssEkle(p, 11, baska));
  assert.deepEqual([c3.dss.ocsp, c3.dss.crl, c3.imzalar[0].iptal, c3.duzey], [1, 1, null, "B-T"]);
  const c4 = pdfImzalariniCozumle(dssEkle(p, 11, k));
  assert.deepEqual([c4.imzalar[0].iptal, c4.duzey], ["gecerli", "B-LT"]);
  /* iptal edilmiş sertifika: kanıt var, durum iptal */
  const liste = crlYap(k.ara, [k.kisi]);
  const c5 = pdfImzalariniCozumle(Buffer.concat([p, Buffer.from(`11 0 obj\n<< /CRLs [12 0 R] >>\nendobj\n12 0 obj\n<< /Length ${liste.length} >>\nstream\n`, "latin1"),
    liste, Buffer.from("\nendstream\nendobj\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R /DSS 11 0 R >>\nendobj\n%%EOF\n", "latin1")]));
  assert.equal(c5.imzalar[0].iptal, "iptal");
});

async function icerikliTaban(): Promise<Buffer> {
  const d = await PDFDocument.create();
  d.addPage([595, 842]).drawRectangle({ x: 50, y: 700, width: 200, height: 40, color: rgb(0.2, 0.2, 0.2) });
  return Buffer.from(await d.save({ useObjectStreams: false }));
}
function imzala(pdf: Buffer, kim = k): Buffer {
  const h = imzaHazirla(pdf, { sertifikaDer: kim.kisi.der, zaman: new Date("2026-10-17T09:00:00Z") });
  const imza = sign(h.ozet, h.imzalanacak, kim.kisi.anahtar);
  return imzaTamamla(h, { imzaDegeri: imza, zincir: [kim.ara.der, kim.kok.der], damga: damgaYap([imza], kim.tsa, [kim.ara]) });
}
const damga = async (v: readonly Uint8Array[]) => damgaYap(v.map((x) => Buffer.from(x)), k.tsa, [k.ara]);
const iptal = async () => ({ ocsp: ocspCevabiYap(k.kisi, k.ara) });

test("4: imzadan sonraki değişiklik imza başına 'degisiklik' (üstüne belge damgası basılsa da); imza / damga / DSS / alan doldurma 'izinli'", async () => {
  const t = await icerikliTaban();
  const p = imzala(t);
  const oku = nesneOkuyucu(p);
  const kok = Number(sonDurum(p).kok.split(" ")[0]);
  const sayfaNo = Number(/\/Kids\s*\[\s*(\d+)/.exec(oku(Number(/\/Pages\s+(\d+)/.exec(oku(kok)!)![1]))!)![1]);
  const sayfa = oku(sayfaNo)!;
  /* sayfa sözlüğü değişti (MediaBox) */
  const s1 = ekle(p, [{ no: sayfaNo, govde: sayfa.replace(/\/MediaBox\s*\[[^\]]*\]/, "/MediaBox [0 0 600 842]") }]).pdf;
  const c1 = pdfImzalariniCozumle(s1);
  assert.deepEqual(c1.imzalar[0].sonrakiEkler, { durum: "degisiklik", nesneler: [sayfaNo] });
  assert.equal(c1.degisiklikYok, false);
  assert.equal(c1.imzalar[0].butunluk, "tamam", "imza kendi sürümü için yine sağlam");
  assert.match(ekImzaNedeni(t, s1, SIMDI) ?? "", /imzalandıktan sonra değiştirilmiş/);
  /* içerik akışı aynı sözlükle başka veri (çizim) */
  const icerikNo = Number(/\/Contents\s*\[?\s*(\d+)/.exec(sayfa)![1]);
  const eskiVeri = oku.ham(icerikNo)!;
  const yeniVeri = Buffer.from(eskiVeri.toString("latin1").replace(/\d/, (x) => String((Number(x) + 1) % 10)), "latin1");
  assert.equal(yeniVeri.length, eskiVeri.length);
  const s2 = ekle(p, [{ no: icerikNo, govde: Buffer.concat([Buffer.from(`${oku(icerikNo)}\nstream\n`, "latin1"), yeniVeri, Buffer.from("\nendstream", "latin1")]) }]).pdf;
  assert.deepEqual(pdfImzalariniCozumle(s2).imzalar[0].sonrakiEkler, { durum: "degisiklik", nesneler: [icerikNo] });
  /* değişiklikten sonra başka bir sunucunun belge damgası: imzanın değişikliği yine görünür */
  const s3 = await belgeDamgasiEkle(s1, damga);
  const c3 = pdfImzalariniCozumle(s3);
  assert.equal(c3.imzalar[0].sonrakiEkler.durum, "degisiklik");
  assert.equal(c3.degisiklikYok, false);
  /* izinli: DSS + belge damgası, ikinci imza, belge bilgisi güncellemesi */
  const lta = await ltvEkle(p, { damga, iptal });
  const c4 = pdfImzalariniCozumle(lta.pdf);
  assert.deepEqual(c4.imzalar.map((i) => i.sonrakiEkler.durum), ["izinli", "yok"]);
  assert.equal(c4.degisiklikYok, true);
  const ikinci = imzala(lta.pdf, denemeKimlikleri("ecdsa", "ZEYNEP DENEME"));
  assert.deepEqual(pdfImzalariniCozumle(ikinci).imzalar.map((i) => i.sonrakiEkler.durum), ["izinli", "izinli", "yok"]);
  const bilgiNo = Number(sonDurum(p).bilgi!.split(" ")[0]);
  const bilgili = ekle(p, [{ no: bilgiNo, govde: "<< /Producer (deneme) /ModDate (D:20261017120000Z) >>" }]).pdf;
  assert.equal(pdfImzalariniCozumle(bilgili).imzalar[0].sonrakiEkler.durum, "izinli");
});

test("5: bozuk yapılar fırlatmaz — eksik alanlı CMS, konumsuz AIA, çözülemeyen açık anahtar: 'okunamadı', yükleme nedenle reddedilir", () => {
  const yalnizSurum = Buffer.from("302806092a864886f70d010702a01b30190201013100300b06092a864886f70d01070131053003020101", "hex");
  const bosIcerik = Buffer.from("302a06092a864886f70d010702a01d301b0201013100300d06092a864886f70d010701a00031053003020101", "hex");
  for (const der of [yalnizSurum, bosIcerik]) {
    for (const tur of ["Sig", "DocTimeStamp"] as const) {
      const p = imzaEkle(TABAN_PDF, 10, () => der, { tur });
      const i = pdfImzalariniCozumle(p).imzalar[0];
      assert.deepEqual([i.butunluk, i.imzaDegeri], ["okunamadi", "okunamadi"]);
      assert.equal(typeof ekImzaNedeni(TABAN_PDF, p, SIMDI), "string");
    }
  }
  /* AIA'da konumsuz erişim tanımı: sertifika okunur, adres yok */
  const aia = sertifikaYap({ cn: "AIA DENEME", veren: k.ara, tur: "ecdsa", ekUzanti: [uzanti("1.3.6.1.5.5.7.1.1", false, sira(sira(oid("1.3.6.1.5.5.7.48.1"))))] });
  assert.deepEqual(sertifikaOku(aia.der)?.bilgi.caVeren, []);
  assert.equal(pdfImzala(TABAN_PDF, 10, k, { kisi: aia }).length > 0, true);
  assert.equal(pdfImzalariniCozumle(pdfImzala(TABAN_PDF, 10, k, { kisi: aia })).imzalar[0].imzaDegeri, "tamam");
  /* imzalayan sertifikasındaki EC noktasında tek onaltılık hane değişti: sertifika okunmaz, çözümleyici fırlatmaz */
  const p = pdfImzala(TABAN_PDF, 10, k);
  const nokta = k.kisi.acik.export({ type: "spki", format: "der" }).subarray(-32).toString("hex");
  const s = p.toString("latin1"), yer = s.indexOf(nokta);
  assert.ok(yer > 0);
  const bozuk = Buffer.from(p);
  bozuk.write(s[yer + 10] === "0" ? "1" : "0", yer + 10, "latin1");
  const i = pdfImzalariniCozumle(bozuk).imzalar[0];
  assert.equal(i.imzalayan, null);
  assert.notEqual(i.imzaDegeri, "tamam");
  assert.equal(typeof ekImzaNedeni(TABAN_PDF, bozuk, SIMDI), "string");
});

test("6: kapanmayan dizilerle dolu 1 MB belge çözümleyiciyi yavaşlatmaz (eski metin taraması 11 sn)", () => {
  const govde = "1 0 obj\n<< /Type /Catalog /DSS 50 0 R >>\nendobj\n50 0 obj\n<< /OCSPs 97 0 R /CRLs 97 0 R /Certs 97 0 R >>\nendobj\n" + " 97 0 obj [x".repeat(90_000);
  const pdf = Buffer.from(`%PDF-1.7\n${govde}\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n`, "latin1");
  assert.ok(pdf.length > 1_000_000);
  const bas = performance.now();
  const c = pdfImzalariniCozumle(pdf);
  const sure = performance.now() - bas;
  assert.equal(c.imzalar.length, 0);
  assert.ok(sure < 2000, `çözümleme ${Math.round(sure)} ms`);
});

test("7: sertifika makamı olmayan sertifika veren sayılmaz; CMS sertifika kümesi sınırlı; SHA-1 imza ve özet desteklenmiyor", () => {
  const tsaninKi = sertifikaYap({ cn: "AYŞE DENEME", veren: k.tsa, tur: "ecdsa" });
  const s = sertifikaOku(tsaninKi.der)!, havuz = [k.tsa, k.ara, k.kok].map((x) => sertifikaOku(x.der)!);
  assert.equal(vereniBul(s, havuz), null);
  assert.equal(zincirKur(s, havuz).length, 1);
  assert.equal(zincirKur(sertifikaOku(k.kisi.der)!, havuz).length, 3);
  /* 40 sertifikalı küme: ilk 32'si okunur */
  const fazla = Array.from({ length: 40 }, (_, n) => sertifikaYap({ cn: `Kalabalık ${n}`, veren: k.ara, tur: "ecdsa" }).der);
  const oz = imzaliOznitelikler({ belgeOzeti: createHash("sha256").update("x").digest(), sertifikaDer: k.kisi.der, ozet: "sha256" });
  const cms = imzaliVeriKur({ imzaliOz: oz, imzaDegeri: sign("sha256", oz, k.kisi.anahtar), sertifikaDer: k.kisi.der, ekSertifikalar: fazla, ozet: "sha256", anahtarTuru: "ecdsa" });
  assert.equal(imzaliVeriOku(cms).sertifikalar.length, 32);
  /* SHA-1: belge imzası ve özeti desteklenmiyor (makamın OCSP / liste imzasında kabul) */
  const veri = Buffer.from("deneme"), r = denemeKimlikleri("rsa").kisi;
  const imza = sign("sha1", veri, r.anahtar);
  assert.equal(algoritmaDenetle("1.2.840.113549.1.1.5", null, null, r.acik, veri, imza, false), "desteklenmiyor");
  assert.equal(algoritmaDenetle("1.2.840.113549.1.1.5", null, null, r.acik, veri, imza), "tamam");
  const si = imzaliVeriOku(cms).imzacilar[0];
  assert.equal(ozetDenetle({ ...si, ozetOid: "1.3.14.3.2.26" }, [veri]), "desteklenmiyor");
  /* SHA-1 izli zaman damgası */
  const tst = sira(tamsayi(1), oid("2.16.792.3.0.99.9"), sira(sira(oid("1.3.14.3.2.26"), Buffer.from([5, 0])), oktet(createHash("sha1").update(veri).digest())),
    tamsayi(8), Buffer.from([0x18, 0x0f, ...Buffer.from("20261017090000Z")]));
  const toz = imzaliOznitelikler({ belgeOzeti: createHash("sha256").update(tst).digest(), sertifikaDer: k.tsa.der, ozet: "sha256", icerikTuru: CMS_OID.tstBilgisi });
  const token = imzaliVeriKur({ imzaliOz: toz, imzaDegeri: sign("sha256", toz, k.tsa.anahtar), sertifikaDer: k.tsa.der, ozet: "sha256", anahtarTuru: "ecdsa", icerikTuru: CMS_OID.tstBilgisi, icerik: tst });
  assert.equal(damgaDenetle(token, [veri]).iz, "desteklenmiyor");
});
