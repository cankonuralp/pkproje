/* NEREDEN GELDİ: IMZA-SERVISI.md (2026-10-17; reisim: "şimdilik bu kararları erteleyelim bizim kod açısından yapmamız gereken her ne var ise listele
   sırala ve o sıraya göre sırayla yapıp bitir"). 2026-10-17 aynı gün (reisim: "probatanın kaynak kodlarına bunları bulaştırma"): imza ÜRETİMİ
   probata-sign'a gitti; burada sınanan yalnız probata'nın OKUYUCUSU ve yükleme denetimleri — gerçek imza araçlarının ürettiği türde belgeyle
   (artımlı imza, görünmez ya da formatın alanı, xref akışı, DSS + belge damgası). Belgeyi test verisi üreticisi kurar (tests/yardimci/imza-uret/ —
   imzala, yer tutucu, artımlı ek, LTV eki; uydurma makam / kişi / damga / OCSP / iptal listesi tests/yardimci/gercek-imza.ts, gerçek kurum yok):
   · nesne okuyucu (src/server/imza/pdf-ek.ts): klasik xref'li ve xref akışlı (nesne akışlı) tabanda nesne çözümü, artımlı ekten sonra son tanım ve
     önceki bölüm (/Prev); şifreli / bozuk trailer reddedilir;
   · çözümleyici (pdf-imzalar.ts) ve yükleme denetimleri (src/modules/raporlar/imza-pdf.ts yapı + src/server/imza/yukleme.ts kriptografi): imza
     tamam, formatın boş e-imza alanının (src/belge/eimza.ts) doldurulması kabul, imzalanmamış yer tutucu "imzalı" görünmez, DSS + belge damgası
     B-LTA ve tazelemesi okunur;
   · iptal kanıtının denetimi (iptal.ts): OCSP imzası, yetkili imzacı, CertID izleri, iptal listesi.
   2026-10-17 çıkarılanlar (konusu yalnız taşınan yazıcı / ağ kodu — probata-sign'da): DSS ekinin "eksik" listesi, zaman damgası istemcisi, iptal
   kanıtının ağdan alınması. Olumsuz kanıt: tests/bozan/imza-ltv.bozan.ts. */
import assert from "node:assert/strict";
import { createHash, sign } from "node:crypto";
import { test } from "node:test";
import { PDFDocument } from "pdf-lib";
import { EIMZA_ALAN_ADI, EIMZA_ALAN_ADI_2, imzaAlaniKoy } from "../src/belge/eimza.ts";
import { imzaliPdfGecerli } from "../src/modules/raporlar/imza-pdf.ts";
import { crlDenetle, IptalHatasi, ocspCevabi } from "../src/server/imza/iptal.ts";
import { nesneOkuyucu, nesneYerleri, PdfHatasi, sonDurum } from "../src/server/imza/pdf-ek.ts";
import { pdfImzalariniCozumle } from "../src/server/imza/pdf-imzalar.ts";
import { sertifikaOku, type Sertifika } from "../src/server/imza/sertifika.ts";
import { ekImzaNedeni } from "../src/server/imza/yukleme.ts";
import { crlYap, damgaYap, denemeKimlikleri, ocspCevabiYap, ocspImzacisiYap, sertifikaYap, type Kimlik } from "./yardimci/gercek-imza.ts";
/* belge YALNIZ test verisi üreticisinden (imza üretimi probata-sign'da) */
import { imzaHazirla, imzaTamamla } from "./yardimci/imza-uret/imzala.ts";
import { belgeDamgasiEkle, ltvEkle, type LtvKaynaklari } from "./yardimci/imza-uret/ltv.ts";
import { ekle } from "./yardimci/imza-uret/pdf-ek-yaz.ts";
import { icerikYaz } from "./yardimci/imza-uret/yer-tutucu.ts";

const k = denemeKimlikleri("rsa");
const ke = denemeKimlikleri("ecdsa", "ZEYNEP DENEME");
const ZAMAN = new Date("2026-10-17T09:00:00Z");

async function taban(p: { akis?: boolean; sayfa?: number } = {}): Promise<Buffer> {
  const d = await PDFDocument.create();
  for (let i = 0; i < (p.sayfa ?? 1); i++) d.addPage([595, 842]);
  return Buffer.from(await d.save({ useObjectStreams: p.akis ?? false }));
}

/** her düz xref girdisi o nesnenin başını gösterir */
function xrefSaglam(pdf: Buffer) {
  const s = pdf.toString("latin1");
  let n = 0;
  for (const [no, y] of nesneYerleri(pdf)) {
    if (y.tur !== "duz") continue;
    assert.match(s.slice(y.konum, y.konum + 30), new RegExp(`^${no}[\\x00\\t\\n\\f\\r ]+\\d+[\\x00\\t\\n\\f\\r ]+obj`), `xref: ${no} yanlış konumda`);
    n++;
  }
  assert.ok(n > 0);
}

/** artımlı imza (test verisi üreticisi): hazırlık → (kart yerine) yazılım anahtarı → tamamlama */
function imzala(pdf: Buffer, kim: ReturnType<typeof denemeKimlikleri>, p: { alan?: string; damga?: boolean; ozet?: "sha256" | "sha384" } = {}): Buffer {
  const h = imzaHazirla(pdf, { sertifikaDer: kim.kisi.der, ozet: p.ozet, alan: p.alan, zaman: ZAMAN, neden: "Deneme imzası" });
  assert.deepEqual(h.imzalanacakOzeti, createHash(h.ozet).update(h.imzalanacak).digest());
  const imza = sign(h.ozet, h.imzalanacak, kim.kisi.anahtar);
  return imzaTamamla(h, { imzaDegeri: imza, zincir: [kim.ara.der, kim.kok.der], damga: p.damga ? damgaYap([imza], kim.tsa, [kim.ara]) : undefined });
}

const alanAdlari = async (pdf: Buffer) => (await PDFDocument.load(pdf)).getForm().getFields().map((f) => f.getName()).sort();

/* uydurma iptal kaynağı: kişi OCSP, öteki sertifikalar iptal listesi (verenin anahtarıyla) */
function iptalKaynagi(kim: ReturnType<typeof denemeKimlikleri>, p: { iptal?: Kimlik[] } = {}): LtvKaynaklari["iptal"] {
  const hepsi = [kim.kok, kim.ara, kim.kisi, kim.tsa];
  const bul = (s: Sertifika) => hepsi.find((x) => x.der.equals(s.der))!;
  return async (s, v) => {
    const ks = bul(s), kv = bul(v);
    return ks === kim.kisi ? { ocsp: ocspCevabiYap(ks, kv, { durum: p.iptal?.includes(ks) ? "iptal" : "gecerli" }) } : { crl: crlYap(kv, p.iptal ?? []) };
  };
}
const damgaKaynagi = (kim: ReturnType<typeof denemeKimlikleri>): LtvKaynaklari["damga"] => async (veri) => damgaYap(veri.map((x) => Buffer.from(x)), kim.tsa, [kim.ara]);

test("nesne okuyucu: klasik xref'li ve xref akışlı (nesne akışlı) tabanda nesne çözümü; artımlı ekten sonra son tanım ve önceki bölüm (/Prev), her girdi doğru", async () => {
  for (const akis of [false, true]) {
    const t = await taban({ akis });
    const d = sonDurum(t);
    assert.equal(d.akis, akis, "taban xref türü");
    const oku = nesneOkuyucu(t);
    const kok = Number(d.kok.split(/\s+/)[0]);
    assert.match(oku(kok) ?? "", /\/Type\s*\/Catalog/);
    if (akis) assert.ok([...nesneYerleri(t).values()].some((y) => y.tur === "akis"), "katalog nesne akışında");
    const { pdf } = ekle(t, [{ no: d.boyut, govde: "<< /Deneme (ek) >>" }, { no: kok, govde: `${oku(kok)!.slice(0, -2)} /Deneme2 1 >>` }]);
    assert.ok(pdf.subarray(0, t.length).equals(t), "özgün baytlar aynı");
    assert.equal(sonDurum(pdf).akis, akis, "ek özgündeki türde");
    assert.equal(sonDurum(pdf).boyut, d.boyut + (akis ? 2 : 1));
    const yeni = nesneOkuyucu(pdf);
    assert.equal(yeni(d.boyut), "<< /Deneme (ek) >>");
    assert.match(yeni(kok) ?? "", /\/Deneme2 1/, "son tanım geçerli");
    if (akis) {
      assert.ok([...nesneYerleri(pdf).values()].some((y) => y.tur === "akis"), "önceki bölüm de okunur (/Prev)");
      const sayfalar = Number(/\/Pages\s+(\d+)/.exec(yeni(kok)!)![1]);
      assert.match(yeni(sayfalar) ?? "", /\/Type\s*\/Pages/, "nesne akışındaki eski nesne");
    }
    xrefSaglam(pdf);
    assert.equal((await PDFDocument.load(pdf)).getPageCount(), 1);
  }
});

test("son durum: şifreli, startxref'siz, kök göstermeyen PDF reddedilir (imzasız belgeye uzun süreli doğrulama eki de kurulmaz)", async () => {
  const t = await taban();
  const sifreli = Buffer.from(t.toString("latin1").replace(/trailer\s*<</, "trailer\n<< /Encrypt 99 0 R "), "latin1");
  assert.throws(() => sonDurum(sifreli), PdfHatasi);
  assert.throws(() => sonDurum(Buffer.from("%PDF-1.7\n1 0 obj\n<<>>\nendobj\n", "latin1")), PdfHatasi);
  assert.throws(() => sonDurum(Buffer.from(t.toString("latin1").replace(/\/Root \d+ \d+ R/, "/Root (x)"), "latin1")), PdfHatasi);
  await assert.rejects(ltvEkle(t, { damga: damgaKaynagi(k), iptal: iptalKaynagi(k) }), PdfHatasi);
});

test("artımlı imza (RSA ve ECDSA, SHA-256 / SHA-384), görünmez alan ilk sayfada: çözümleyici tamam, B-T; yapı + kriptografi yükleme denetimleri geçer", async () => {
  for (const [kim, ozet] of [[k, "sha256"], [ke, "sha384"]] as const) {
    const t = await taban({ sayfa: 2 });
    const p = imzala(t, kim, { damga: true, ozet });
    assert.ok(p.subarray(0, t.length).equals(t), "özgün baytlar aynı");
    const c = pdfImzalariniCozumle(p);
    assert.equal(c.imzalar.length, 1);
    const i = c.imzalar[0];
    assert.deepEqual([i.butunluk, i.imzaDegeri, i.tamami, i.sertifikaBagi, i.anindaGecerli, i.ozet], ["tamam", "tamam", true, true, true, ozet]);
    assert.equal(i.imzalayan?.ad, kim === k ? "AYŞE DENEME" : "ZEYNEP DENEME");
    assert.equal(i.zincir.length, 3);
    assert.deepEqual([i.damga?.iz, i.damga?.imza], ["tamam", "tamam"]);
    assert.equal(c.duzey, "B-T");
    assert.equal(imzaliPdfGecerli(t, p), true, "yapı denetimi (beyaz liste)");
    assert.equal(ekImzaNedeni(t, p), null, "kriptografik yükleme denetimi");
    xrefSaglam(p);
    const doc = await PDFDocument.load(p);
    assert.equal(doc.getPageCount(), 2);
    assert.deepEqual(await alanAdlari(p), ["Imza"]);
    const annots = doc.getPage(0).node.Annots();
    assert.equal(annots?.size(), 1, "görünmez alan ilk sayfanın açıklaması");
  }
});

test("xref akışlı (nesne akışlı) tabanda imza: ek xref akışıyla, çözümleyici tamam", async () => {
  const t = await taban({ akis: true });
  const p = imzala(t, ke);
  assert.equal(sonDurum(p).akis, true);
  const i = pdfImzalariniCozumle(p).imzalar[0];
  assert.deepEqual([i.butunluk, i.imzaDegeri, i.tamami], ["tamam", "tamam", true]);
  xrefSaglam(p);
  assert.deepEqual(await alanAdlari(p), ["Imza"]);
});

test("formatın boş e-imza alanına imza (tek parça, her sayfada parçalı, iki yer art arda): yeni alan yok, yapı + kriptografi denetimi geçer", async () => {
  const kutu = { yer: "kutu" as const, x: 20, y: 240, en: 60, boy: 25 };
  for (const yeri of [kutu, { ...kutu, sayfa: "her" as const }]) {
    const t = Buffer.from(await imzaAlaniKoy(await taban({ sayfa: 2 }), yeri));
    const p = imzala(t, k, { alan: EIMZA_ALAN_ADI });
    assert.deepEqual(await alanAdlari(p), [EIMZA_ALAN_ADI], "yalnız formatın alanı");
    assert.equal(imzaliPdfGecerli(t, p), true);
    assert.equal(ekImzaNedeni(t, p), null);
    const oku = nesneOkuyucu(p);
    const alan = [...nesneYerleri(p).keys()].map((n) => oku(n) ?? "").find((g) => g.includes(`(${EIMZA_ALAN_ADI})`))!;
    assert.match(alan, /\/V\s+\d+\s+0\s+R/, "alanın değeri imza");
    xrefSaglam(p);
  }
  /* onaylanan + onaylayan: iki ayrı alan, iki imza art arda */
  const t = Buffer.from(await imzaAlaniKoy(await taban(), kutu, { ...kutu, y: 200 }));
  const p1 = imzala(t, k, { alan: EIMZA_ALAN_ADI });
  const p2 = imzala(p1, ke, { alan: EIMZA_ALAN_ADI_2, damga: true });
  assert.deepEqual(await alanAdlari(p2), [EIMZA_ALAN_ADI, EIMZA_ALAN_ADI_2].sort());
  const c = pdfImzalariniCozumle(p2);
  assert.equal(c.imzalar.length, 2);
  assert.ok(c.imzalar.every((i) => i.butunluk === "tamam" && i.imzaDegeri === "tamam"));
  assert.deepEqual(c.imzalar.map((i) => i.imzalayan?.ad), ["AYŞE DENEME", "ZEYNEP DENEME"]);
  assert.equal(imzaliPdfGecerli(t, p1), true);
  assert.equal(imzaliPdfGecerli(t, p2), true);
  /* adı verilen alan yoksa görünmez yeni alan */
  assert.deepEqual(await alanAdlari(imzala(t, k, { alan: "Olmayan alan" })), [EIMZA_ALAN_ADI, EIMZA_ALAN_ADI_2, "Imza"].sort());
});

test("imzalanmamış yer tutucu imzalı görünmez (çözümleyici imza saymaz ya da okunamadı der); test verisinin kapsamı tam /Contents, sığmayan imza ve okunmayan sertifika durur", async () => {
  const t = await taban();
  const h = imzaHazirla(t, { sertifikaDer: k.kisi.der, zaman: ZAMAN });
  const s = h.yer.pdf.toString("latin1");
  assert.equal(s[h.yer.icerikBas - 1], "<");
  assert.equal(s[h.yer.icerikBas + h.yer.icerikUzunluk], ">");
  assert.equal(h.yer.parcalar[0].length + h.yer.icerikUzunluk + 2 + h.yer.parcalar[1].length, h.yer.pdf.length);
  assert.throws(() => icerikYaz(h.yer, Buffer.alloc(h.yer.icerikUzunluk / 2 + 1, 1)), PdfHatasi);
  assert.throws(() => imzaHazirla(t, { sertifikaDer: Buffer.from("sertifika değil") }), /okunamadı/);
  /* imzalanmamış yer tutucu: çözümleyici imza saymaz ya da okunamadı der — imzasız belge "imzalı" görünmez */
  const c = pdfImzalariniCozumle(h.yer.pdf);
  assert.ok(c.imzalar.every((i) => i.imzaDegeri !== "tamam"));
  assert.equal(c.duzey, "yok");
});

test("uzun süreli doğrulama eki: DSS (sertifikalar + OCSP + iptal listesi) + belge zaman damgası → B-LTA okunur; yükleme denetimleri geçer; tazelenmiş belge de", async () => {
  const t = await taban();
  const p = imzala(t, k, { damga: true });
  const r = await ltvEkle(p, { damga: damgaKaynagi(k), iptal: iptalKaynagi(k) });
  assert.deepEqual(r.eksik, []);
  assert.deepEqual([r.sertifika, r.ocsp, r.crl], [4, 1, 2], "kişi + ara + kök + damga sunucusu; kişiye OCSP; ara ve damga sunucusuna liste");
  assert.ok(r.pdf.subarray(0, p.length).equals(p), "imzalı baytlar aynı");
  const c = pdfImzalariniCozumle(r.pdf);
  assert.equal(c.duzey, "B-LTA");
  assert.deepEqual([c.dss.ocsp, c.dss.crl, c.dss.sertifika], [1, 2, 4]);
  assert.deepEqual(c.imzalar.map((i) => i.tur), ["imza", "belge_damgasi"]);
  assert.ok(c.imzalar.every((i) => i.butunluk === "tamam" && i.imzaDegeri === "tamam"));
  assert.equal(c.sonuTamami, true);
  assert.equal(imzaliPdfGecerli(t, r.pdf), true, "uzun süreli doğrulama eki yapı denetiminden geçer");
  assert.equal(ekImzaNedeni(t, r.pdf), null);
  xrefSaglam(r.pdf);
  assert.equal((await PDFDocument.load(r.pdf)).getPageCount(), 1);
  /* DSS'teki OCSP cevabı ve liste gerçekten bu sertifikaların */
  const oku = nesneOkuyucu(r.pdf);
  const dssNo = Number(/\/DSS\s+(\d+)/.exec(oku(Number(sonDurum(r.pdf).kok.split(" ")[0]))!)![1]);
  const ocspNo = Number(/\/OCSPs\s*\[\s*(\d+)/.exec(oku(dssNo)!)![1]);
  const sk = sertifikaOku(k.kisi.der)!, sv = sertifikaOku(k.ara.der)!;
  assert.deepEqual([ocspCevabi(oku.akis(ocspNo)!, sk, sv).durum, ocspCevabi(oku.akis(ocspNo)!, sk, sv).imza], ["gecerli", "tamam"]);

  /* tazeleme: yeni DSS önceki kanıtları korur, aynı sertifikayı yeniden yazmaz; yeni belge damgası öncekini de kapsar */
  const r2 = await ltvEkle(r.pdf, { damga: damgaKaynagi(k), iptal: iptalKaynagi(k) });
  assert.equal(r2.sertifika, 0, "sertifikalar zaten DSS'te");
  const c2 = pdfImzalariniCozumle(r2.pdf);
  assert.equal(c2.duzey, "B-LTA");
  assert.deepEqual(c2.imzalar.map((i) => i.tur), ["imza", "belge_damgasi", "belge_damgasi"]);
  assert.ok(c2.imzalar.every((i) => i.butunluk === "tamam" && i.imzaDegeri === "tamam"));
  assert.equal(c2.dss.sertifika, 4);
  assert.equal(c2.dss.ocsp, 1 + r2.ocsp);
  assert.equal(c2.dss.crl, 2 + r2.crl);
  assert.equal(imzaliPdfGecerli(t, r2.pdf), true);
  xrefSaglam(r2.pdf);
});

/* 2026-10-18 (probata-sign incelemesinin uyarısı: "aynı bulgu probata'daki imzalı PDF denetiminde de var"): belgedeki doğrulanmış iptal kanıtı
   "iptal" dediği hâlde yükleme kabul ediliyordu */
test("iptal edilmiş sertifika: DSS'teki doğrulanmış OCSP cevabı 'iptal' diyorsa yükleme reddedilir; 'geçerli' diyorsa geçer", async () => {
  const t = await taban();
  const p = imzala(t, k, { damga: true });
  const iptalli = await ltvEkle(p, { damga: damgaKaynagi(k), iptal: iptalKaynagi(k, { iptal: [k.kisi] }) });
  assert.equal(pdfImzalariniCozumle(iptalli.pdf).imzalar[0].iptal, "iptal");
  assert.equal(ekImzaNedeni(t, iptalli.pdf), "PDF'teki imzanın sertifikası iptal edilmiş (belgedeki iptal kanıtına göre).");
  const gecerli = await ltvEkle(p, { damga: damgaKaynagi(k), iptal: iptalKaynagi(k) });
  assert.equal(pdfImzalariniCozumle(gecerli.pdf).imzalar[0].iptal, "gecerli");
  assert.equal(ekImzaNedeni(t, gecerli.pdf), null);
});

test("imza damgası olmayan imza: belge damgası imzayı kapsadığı için B-T sayılır, DSS + damga B-LTA; damgasız B-B; imzadan önceki belge damgası sayılmaz", async () => {
  const p = imzala(await taban(), ke);
  assert.equal(pdfImzalariniCozumle(p).duzey, "B-B");
  const r = await ltvEkle(p, { damga: damgaKaynagi(ke), iptal: iptalKaynagi(ke) });
  assert.deepEqual([r.ocsp, r.crl], [1, 1], "damga sunucusu sertifikası belgede henüz yok");
  assert.equal(pdfImzalariniCozumle(r.pdf).duzey, "B-LTA");
  /* imzadan ÖNCE basılmış belge damgası imzanın zamanını kanıtlamaz */
  const once = imzala(Buffer.from(await belgeDamgasiEkle(await taban(), damgaKaynagi(ke))), ke);
  const c = pdfImzalariniCozumle(once);
  assert.deepEqual(c.imzalar.map((i) => i.tur), ["belge_damgasi", "imza"]);
  assert.equal(c.duzey, "B-B");
});

test("iptal kanıtının denetimi: OCSP imzası (veren ya da yetkili OCSP imzacısı) ve CertID izleri denetlenir; iptal listesi", () => {
  const sk = sertifikaOku(k.kisi.der)!, sv = sertifikaOku(k.ara.der)!;
  const ocsp = (b: Buffer) => { const r = ocspCevabi(b, sk, sv); return `${r.durum}/${r.imza}`; };
  assert.equal(ocsp(ocspCevabiYap(k.kisi, k.ara)), "gecerli/tamam");
  assert.equal(ocsp(ocspCevabiYap(k.kisi, k.ara, { durum: "iptal" })), "iptal/tamam");
  assert.equal(ocsp(ocspCevabiYap(k.kisi, k.ara, { durum: "bilinmiyor" })), "bilinmiyor/tamam");
  const yetkili = ocspImzacisiYap(k.ara);
  assert.equal(ocsp(ocspCevabiYap(k.kisi, k.ara, { imzalayan: yetkili, ekSertifika: [yetkili] })), "gecerli/tamam", "verence yetkilendirilmiş imzacı");
  const yetkisiz = sertifikaYap({ cn: "Yetkisiz", veren: k.ara, tur: "ecdsa" });
  assert.equal(ocsp(ocspCevabiYap(k.kisi, k.ara, { imzalayan: yetkisiz, ekSertifika: [yetkisiz] })), "gecerli/bozuk", "OCSP imza yetkisi yok");
  const baskaMakam = ocspImzacisiYap(denemeKimlikleri("ecdsa").ara);
  assert.equal(ocsp(ocspCevabiYap(k.kisi, k.ara, { imzalayan: baskaMakam, ekSertifika: [baskaMakam] })), "gecerli/bozuk", "başka makamın imzacısı");
  assert.equal(ocsp(ocspCevabiYap(k.kisi, k.ara, { idVeren: k.kok })), "bilinmiyor/tamam", "CertID başka verenin (seri aynı olsa da)");
  const bozuk = ocspCevabiYap(k.kisi, k.ara);
  bozuk[bozuk.length - 5] ^= 1;
  assert.equal(ocsp(bozuk), "gecerli/bozuk");
  assert.throws(() => ocspCevabi(ocspCevabiYap(k.kisi, k.ara, { basariKodu: 1 }), sk, sv), IptalHatasi);
  assert.throws(() => ocspCevabi(Buffer.from("cevap değil"), sk, sv), IptalHatasi);

  const crl = (b: Buffer) => { const r = crlDenetle(b, sk, sv); return `${r.durum}/${r.imza}`; };
  assert.equal(crl(crlYap(k.ara)), "gecerli/tamam");
  assert.equal(crl(crlYap(k.ara, [k.tsa, k.kisi])), "iptal/tamam");
  assert.equal(crl(crlYap(k.ara, [], undefined, k.kok)), "gecerli/bozuk", "listeyi veren imzalamamış");
  assert.equal(crl(crlYap(k.kok)), "bilinmiyor/bozuk", "başka verenin listesi");
  assert.throws(() => crlDenetle(Buffer.from("liste değil"), sk, sv), IptalHatasi);
});
