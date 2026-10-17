/* NEREDEN GELDİ: IMZA-SERVISI.md ES1 (2026-10-17; reisim: "şimdilik bu kararları erteleyelim bizim kod açısından yapmamız gereken her ne var ise
   listele sırala ve o sıraya göre sırayla yapıp bitir"; beş katman — reisim: "eğer bu belgede varsa bizde koyucaz"). Saf çözümleyici
   src/server/imza/pdf-imzalar.ts: GERÇEK kriptografik imzalarla (tests/yardimci/gercek-imza.ts — uydurma makam / kişi / damga sunucusu) her katman
   ve her bozulma. Reisim'in gönderdiği, gerçek bir imza aracıyla imzalanmış belgede (iki nitelikli imza + KamuSM damgaları + DSS + belge damgası)
   çözümleyici B-LTA, her imza "tamam" verdi; DSS'in dolaylı dizileri o belgeden öğrenildi (dosya depoya girmedi). Olumsuz kanıt:
   tests/bozan/imza-cozum.bozan.ts. */
import assert from "node:assert/strict";
import { createHash, sign } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { damgaOzniteligi, imzaliOznitelikler, imzaliVeriKur } from "../src/server/imza/cms-yaz.ts";
import { pdfImzalariniCozumle, pdfZamani } from "../src/server/imza/pdf-imzalar.ts";
import { ekImzaNedeni } from "../src/server/imza/yukleme.ts";
import { TABAN_PDF, belgeDamgala, damgaYap, denemeKimlikleri, dssEkle, imzaEkle, imzaEki, pdfImzala, sertifikaYap } from "./yardimci/gercek-imza.ts";

const k = denemeKimlikleri("rsa");

test("tek imza (RSA, SHA-256): bütünlük, imza değeri, imzalayan, nitelikli işaret, sertifika bağı, zincir — düzey B-B", () => {
  const c = pdfImzalariniCozumle(pdfImzala(TABAN_PDF, 10, k));
  assert.equal(c.imzalar.length, 1);
  const i = c.imzalar[0];
  assert.equal(i.tur, "imza");
  assert.equal(i.altFiltre, "ETSI.CAdES.detached");
  assert.equal(i.butunluk, "tamam");
  assert.equal(i.imzaDegeri, "tamam");
  assert.equal(i.ozet, "sha256");
  assert.equal(i.imzalayan?.ad, "AYŞE DENEME");
  assert.equal(i.imzalayan?.nitelikli, true);
  assert.equal(i.imzalayan?.inkarEdilemez, true);
  assert.deepEqual(i.imzalayan?.ocsp, ["http://ocsp.ornek.test"]);
  assert.deepEqual(i.imzalayan?.crl, ["http://depo.ornek.test/nes.crl"]);
  assert.equal(i.sertifikaBagi, true);
  assert.deepEqual(i.zincir, ["AYŞE DENEME", "Deneme Sertifika Hizmet Sağlayıcısı", "Deneme Kök Sertifika Hizmet Sağlayıcısı"]);
  assert.equal(i.tamami, true);
  assert.equal(i.sozlukZamani, "2026-10-17T09:00:00.000Z", "/M imzalayanın saati, saat dilimiyle");
  assert.equal(i.anindaGecerli, true);
  assert.equal(c.duzey, "B-B");
  assert.equal(c.sonuTamami, true);
});

test("ECDSA anahtar ve SHA-384 / SHA-512 özet de doğrulanır", () => {
  const e = denemeKimlikleri("ecdsa");
  for (const ozet of ["sha256", "sha384", "sha512"] as const) {
    const i = pdfImzalariniCozumle(pdfImzala(TABAN_PDF, 10, e, { ozet })).imzalar[0];
    assert.equal(i.butunluk, "tamam", ozet);
    assert.equal(i.imzaDegeri, "tamam", ozet);
    assert.equal(i.ozet, ozet);
  }
});

test("imza zaman damgası: iz imza değerinin, damganın kendi imzası doğru — düzey B-T; imza anı damgadan", () => {
  const c = pdfImzalariniCozumle(pdfImzala(TABAN_PDF, 10, k, { damga: true, damgaZamani: new Date("2026-10-17T08:59:30Z") }));
  const d = c.imzalar[0].damga;
  assert.ok(d);
  assert.equal(d.iz, "tamam");
  assert.equal(d.imza, "tamam");
  assert.equal(d.zaman, "2026-10-17T08:59:30.000Z");
  assert.equal(d.tsa, "Deneme Zaman Damgası Sunucusu");
  assert.equal(c.duzey, "B-T");
});

test("DSS (iptal verisi) B-LT; ardından belge zaman damgası B-LTA — belge damgası kendi izi ve imzasıyla", () => {
  const lt = dssEkle(pdfImzala(TABAN_PDF, 10, k, { damga: true }), 11, k);
  const c1 = pdfImzalariniCozumle(lt);
  assert.deepEqual({ var: c1.dss.var, ocsp: c1.dss.ocsp, crl: c1.dss.crl }, { var: true, ocsp: 1, crl: 1 });
  assert.equal(c1.duzey, "B-LT");
  assert.equal(c1.sonuTamami, false, "DSS imzadan sonra eklendi ve damgalanmadı");
  const c2 = pdfImzalariniCozumle(belgeDamgala(lt, 20, k));
  assert.equal(c2.imzalar.length, 2);
  const bd = c2.imzalar[1];
  assert.equal(bd.tur, "belge_damgasi");
  assert.equal(bd.butunluk, "tamam");
  assert.equal(bd.imzaDegeri, "tamam");
  assert.equal(c2.duzey, "B-LTA");
  assert.equal(c2.sonuTamami, true);
});

test("iptal verisi olmayan DSS B-LT saymaz; DSS'ten ÖNCEKİ belge damgası B-LTA saymaz", () => {
  assert.equal(pdfImzalariniCozumle(dssEkle(pdfImzala(TABAN_PDF, 10, k, { damga: true }), 11, k, 0, 0)).duzey, "B-T");
  const once = belgeDamgala(pdfImzala(TABAN_PDF, 10, k, { damga: true }), 20, k);
  assert.equal(pdfImzalariniCozumle(dssEkle(once, 30, k)).duzey, "B-LT");
});

test("iki imza art arda: ilki belgenin o anki hâlini, ikincisi tamamını kapsar; ikisi de sağlam", () => {
  const ikinci = denemeKimlikleri("ecdsa", "ZEYNEP DENEME");
  const p = pdfImzala(pdfImzala(TABAN_PDF, 10, k, { damga: true }), 11, ikinci, { damga: true });
  const c = pdfImzalariniCozumle(p);
  assert.deepEqual(c.imzalar.map((i) => [i.imzalayan?.ad, i.tamami, i.butunluk, i.imzaDegeri]),
    [["AYŞE DENEME", false, "tamam", "tamam"], ["ZEYNEP DENEME", true, "tamam", "tamam"]]);
  assert.equal(c.duzey, "B-T");
});

test("imzadan sonra kapsanan bölümde tek bayt değişirse bütünlük bozuk, düzey yok", () => {
  const p = pdfImzala(TABAN_PDF, 10, k, { damga: true });
  const i = p.indexOf("/MediaBox [0 0 595 842]");
  p.write("6", i + "/MediaBox [0 0 ".length, "latin1");
  const c = pdfImzalariniCozumle(p);
  assert.equal(c.imzalar[0].butunluk, "bozuk");
  assert.equal(c.duzey, "yok");
});

test("imza değerinde tek bit değişirse imza bozuk (bütünlük tamam kalsa da), damganın izi de tutmaz", () => {
  const p = pdfImzala(TABAN_PDF, 10, k, { damga: true });
  const once = pdfImzalariniCozumle(p).imzalar[0];
  assert.equal(once.imzaDegeri, "tamam");
  /* imza değeri OCTET STRING'i: 2048 bitlik RSA imzası 256 bayt — "0482 0100" önekinden sonra */
  const bas = p.indexOf("<", p.indexOf("/Contents")) + 1;
  const hex = p.subarray(bas, bas + 24_000).toString("latin1");
  const yer = hex.indexOf("04820100") + 8 + 20;
  const eski = hex[yer];
  p.write(eski === "0" ? "1" : "0", bas + yer, "latin1");
  const c = pdfImzalariniCozumle(p);
  assert.equal(c.imzalar[0].butunluk, "tamam");
  assert.equal(c.imzalar[0].imzaDegeri, "bozuk");
  assert.equal(c.imzalar[0].damga?.iz, "bozuk", "damga eski imza değerinin");
  assert.equal(c.duzey, "yok");
});

test("başka verinin damgası: iz bozuk (damganın kendi imzası doğru), düzey B-B'ye düşer", () => {
  const p = imzaEkle(TABAN_PDF, 10, (parcalar) => {
    const h = createHash("sha256"); for (const x of parcalar) h.update(x);
    const oz = imzaliOznitelikler({ belgeOzeti: h.digest(), sertifikaDer: k.kisi.der, ozet: "sha256" });
    const imza = sign("sha256", oz, k.kisi.anahtar);
    return imzaliVeriKur({ imzaliOz: oz, imzaDegeri: imza, sertifikaDer: k.kisi.der, ekSertifikalar: [k.ara.der, k.kok.der], ozet: "sha256", anahtarTuru: "rsa",
      imzasizOz: [damgaOzniteligi(damgaYap([Buffer.from("başka veri")], k.tsa, [k.ara]))] });
  });
  const c = pdfImzalariniCozumle(p);
  assert.equal(c.imzalar[0].imzaDegeri, "tamam");
  assert.equal(c.imzalar[0].damga?.iz, "bozuk");
  assert.equal(c.imzalar[0].damga?.imza, "tamam");
  assert.equal(c.duzey, "B-B");
});

test("sertifikanın süresi imza anında dolmuşsa anında geçerli değil; damga zamanı /M'den önce gelir", () => {
  const eski = sertifikaYap({ cn: "ESKİ DENEME", veren: k.ara, bas: new Date("2024-01-01T00:00:00Z"), son: new Date("2025-01-01T00:00:00Z") });
  const p = pdfImzala(TABAN_PDF, 10, k, { kisi: eski });
  assert.equal(pdfImzalariniCozumle(p).imzalar[0].anindaGecerli, false, "imza 2026'da, sertifika 2025'te bitti");
  /* damga sunucusunun sertifikası 2024'te geçerli (2026-10-17 inceleme: damga anında geçersiz sunucu sertifikasının damgası sayılmaz) */
  const k24 = { ...k, tsa: sertifikaYap({ cn: "Deneme Zaman Damgası Sunucusu", o: "Deneme ESHS", damga: true, veren: k.ara, tur: "ecdsa", bas: new Date("2023-01-01T00:00:00Z") }) };
  const damgali = pdfImzala(TABAN_PDF, 10, k24, { kisi: eski, damga: true, damgaZamani: new Date("2024-06-01T00:00:00Z"), m: "D:20261017120000+03'00'" });
  assert.equal(pdfImzalariniCozumle(damgali).imzalar[0].anindaGecerli, true, "damga sertifika geçerliyken");
  const sunucusuGecersiz = pdfImzalariniCozumle(pdfImzala(TABAN_PDF, 10, k, { kisi: eski, damga: true, damgaZamani: new Date("2024-06-01T00:00:00Z") })).imzalar[0];
  assert.equal(sunucusuGecersiz.damga?.imza, "bozuk", "damga sunucusunun sertifikası 2026'da başlıyor");
  assert.equal(sunucusuGecersiz.anindaGecerli, false, "geçersiz damganın zamanı kullanılmaz");
});

test("nitelikli işareti olmayan sertifika nitelikli sayılmaz", () => {
  const n = sertifikaYap({ cn: "NİTELİKSİZ DENEME", veren: k.ara, nitelikli: false });
  assert.equal(pdfImzalariniCozumle(pdfImzala(TABAN_PDF, 10, k, { kisi: n })).imzalar[0].imzalayan?.nitelikli, false);
});

test("imza sarmalama: kapsam boşluğu /Contents değilse imza sayılmaz; DER'den sonra sıfır olmayan dolgu okunamaz", () => {
  const p = pdfImzala(TABAN_PDF, 10, k);
  /* boşluğun önündeki "/Contents" adını bozmak: boşluk artık sözlüğün içeriği değil */
  const i = p.indexOf("/Contents <");
  const bozuk = Buffer.from(p); bozuk.write("/Contentz", i, "latin1");
  assert.equal(pdfImzalariniCozumle(bozuk).imzalar.length, 0);
  /* dolguya veri: DER'in hemen ardındaki ilk sıfır */
  const bas = p.indexOf("<", i) + 1, son = p.indexOf(">", bas);
  const hex = p.subarray(bas, son).toString("latin1");
  const dolguBas = hex.search(/0{64}$/);
  const dolgulu = Buffer.from(p); dolgulu.write("ab", bas + dolguBas + 32, "latin1");
  const c = pdfImzalariniCozumle(dolgulu);
  assert.equal(c.imzalar.length, 1);
  assert.equal(c.imzalar[0].butunluk, "okunamadi");
  assert.equal(c.duzey, "yok");
});

test("imzadan sonra imzasız ek varsa sonu tamamı değil", () => {
  const p = Buffer.concat([pdfImzala(TABAN_PDF, 10, k), Buffer.from("4 0 obj\n<< /Ek true >>\nendobj\n%%EOF\n", "latin1")]);
  const c = pdfImzalariniCozumle(p);
  assert.equal(c.imzalar[0].butunluk, "tamam");
  assert.equal(c.sonuTamami, false);
});

test("bozuk / düşmanca girdi: fırlatmaz, imza bulunmaz ya da okunamadı", () => {
  const girdiler = [
    Buffer.alloc(0), Buffer.from("%PDF-1.7"), Buffer.from("x".repeat(100)),
    Buffer.from("%PDF /ByteRange [0 10 5 3] /Contents <00>"),
    Buffer.from("%PDF /ByteRange [0 9999999999 9999999999 9999999999] /Contents <00>"),
    Buffer.from(`%PDF ${"/ByteRange [0 ".repeat(5000)}`),
    Buffer.concat([Buffer.from("%PDF-1.7\n1 0 obj << /Type /Sig /ByteRange [0 30 40 1] /Contents <"), Buffer.from("zz"), Buffer.from("> >> endobj\n")]),
  ];
  for (const g of girdiler) {
    const c = pdfImzalariniCozumle(g);
    assert.equal(c.duzey, "yok");
    for (const i of c.imzalar) assert.notEqual(i.imzaDegeri, "tamam");
  }
  /* geçerli kapsamda çöp CMS */
  const cop = imzaEkle(TABAN_PDF, 10, () => Buffer.from("3082ffff".repeat(50), "hex"));
  const c = pdfImzalariniCozumle(cop);
  assert.equal(c.imzalar.length, 1);
  assert.equal(c.imzalar[0].butunluk, "okunamadi");
});

test("PDF tarih biçimi: saat dilimi ve eksik alanlar", () => {
  assert.equal(pdfZamani("D:20261017120000+03'00'"), "2026-10-17T09:00:00.000Z");
  assert.equal(pdfZamani("D:20261017120000Z"), "2026-10-17T12:00:00.000Z");
  assert.equal(pdfZamani("D:2026"), "2026-01-01T00:00:00.000Z");
  assert.equal(pdfZamani("2026"), null);
});

test("ES1 yükleme denetimi: sağlam nitelikli imza geçer; değişmiş belge, bozuk imza, niteliksiz ya da süresi dolmuş sertifika, imzasız ek reddedilir", () => {
  assert.equal(ekImzaNedeni(TABAN_PDF, imzaEki(TABAN_PDF)), null);
  assert.equal(ekImzaNedeni(TABAN_PDF, imzaEki(TABAN_PDF, "AYŞE DENEME", { damga: true })), null, "damgalı imza");
  const degismis = Buffer.from(imzaEki(TABAN_PDF));
  degismis.write("7", degismis.lastIndexOf("(D:2026") + 6, "latin1");
  assert.equal(ekImzaNedeni(TABAN_PDF, degismis), "PDF imzalandıktan sonra değiştirilmiş; imza bu belgeyi doğrulamıyor.");
  assert.match(ekImzaNedeni(TABAN_PDF, imzaEki(TABAN_PDF, "X", { nitelikli: false })) ?? "", /nitelikli elektronik sertifikayla atılmamış/);
  const eski = sertifikaYap({ cn: "ESKİ DENEME", veren: k.ara, bas: new Date("2024-01-01T00:00:00Z"), son: new Date("2025-01-01T00:00:00Z") });
  assert.match(ekImzaNedeni(TABAN_PDF, imzaEki(TABAN_PDF, "ESKİ DENEME", { kisi: eski })) ?? "", /imza anında geçerli değil/);
  assert.match(ekImzaNedeni(TABAN_PDF, Buffer.concat([TABAN_PDF, Buffer.from("9 0 obj << /Type /Sig /ByteRange [0 1 2 3] /Contents <00ff> >> endobj\n")])) ?? "",
    /doğrulanabilir bir e-imza bulunamadı/, "sahte imza sözlüğü");
  /* önceki (önekteki) imza sayılmaz: yalnız eklenen */
  const once = Buffer.from(imzaEki(TABAN_PDF));
  assert.match(ekImzaNedeni(once, Buffer.concat([once, Buffer.from("\n% ek\n")])) ?? "", /bulunamadı/);
});

test("ES1 kaynak kilidi: imzalı PDF'i yapıca denetleyen her yükleme (imzaliPdfGecerli) kriptografik denetimi de (ekImzaNedeni) çağırır", () => {
  const dosyalar: string[] = [];
  const gez = (d: string) => { for (const e of readdirSync(d, { withFileTypes: true })) { const y = join(d, e.name); if (e.isDirectory()) gez(y); else if (/\.tsx?$/.test(e.name)) dosyalar.push(y); } };
  gez("src");
  /* 2026-10-17 (yeniden yazılmış imzalı PDF — imza-esdeger.ts): yüklemeler yapı denetimini imzaliTaban üzerinden yapar (önek ya da içerikçe eşdeğer
     taban; içinde imzaliPdfGecerli). Kilit aynı: her yapı denetimi (imzaliPdfGecerli ya da imzaliTaban) çağrısına bir kriptografik denetim. */
  const DENETIM = /imzaliPdfGecerli\(|imzaliTaban\(/g;
  const yukleyen = dosyalar.filter((f) => !/[\\/]imza-(?:pdf|esdeger)\.ts$/.test(f) && /imzaliPdfGecerli\(|imzaliTaban\(/.test(readFileSync(f, "utf8")));
  assert.ok(yukleyen.length >= 2, `yükleme yolları bulunamadı: ${yukleyen.join(", ")}`);
  for (const f of yukleyen) {
    const m = readFileSync(f, "utf8");
    assert.equal((m.match(DENETIM) ?? []).length, (m.match(/ekImzaNedeni\(/g) ?? []).length, `${f}: her yapı denetiminin ardından kriptografik denetim`);
  }
});
