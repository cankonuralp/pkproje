/* OLUMSUZ KANIT — tests/imza-inceleme.test.ts neyi koruyor (2026-10-17 bağımsız incelemenin bulguları). Kaynak diskte DEĞİŞTİRİLMEZ (anayasa
   13.11): dosya bellekte bozulup geçici klasörden içe aktarılır (göreli içe aktarmalar özgün dosyalara bağlanır).
   1. Damga sunucusunun zaman damgası kullanımı aranmasaydı imzalayanın kendi anahtarıyla bastığı "damga" sağlam sayılırdı.
   2. İmzalayan signingCertificate özetiyle seçilmeseydi aynı anahtarlı nitelikli sertifika imzasız sid ile gösterilirdi.
   3. Sertifika bağı tutmayan imza sağlam sayılsaydı değiştirilmiş sertifikalı imza bir düzey alırdı.
   4. Sayfa sözlüğü serbest bırakılsaydı imzadan sonra değişen sayfa "izinli" görünürdü.
   5. Akış verisi karşılaştırılmasaydı aynı sözlükle değiştirilen içerik akışı görünmezdi.
   6. DSS'teki kanıtın bu sertifikaya ait olduğu aranmasaydı başka makamın OCSP cevabı B-LT saydırırdı.
   7. Veren adayında sertifika makamı (temel kısıt) aranmasaydı son kullanıcı sertifikası zincire ara halka olurdu.
   8. SHA-1 belge imzasında da kabul edilseydi çakışmaya açık özetli imza "tamam" olurdu.
   9. Eksik alanlı CMS'te TypeError BozukDer'e çevrilmeseydi çözümleyici fırlatırdı (yükleme 500). */
import assert from "node:assert/strict";
import { createHash, sign } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";
import { PDFDocument, rgb } from "pdf-lib";
import { nesneOkuyucu, sonDurum } from "../../src/server/imza/pdf-ek.ts";
import { TABAN_PDF, damgaYap, denemeKimlikleri, dssEkle, imzaEkle, pdfImzala, sertifikaYap, type Kimlik } from "../yardimci/gercek-imza.ts";
/* imza / artımlı ek YALNIZ test verisi üreticisinden (imza üretimi probata-sign'da; bozulan probata'nın okuyucusu) */
import { imzaliOznitelikler, imzaliVeriKur } from "../yardimci/imza-uret/cms-yaz.ts";
import { imzaHazirla, imzaTamamla } from "../yardimci/imza-uret/imzala.ts";
import { ekle } from "../yardimci/imza-uret/pdf-ek-yaz.ts";

const klasor = mkdtempSync(join(tmpdir(), "imza-inceleme-bozan-"));
let sira = 0;
async function bozuk<M>(kaynak: string, eski: string, yeni: string, ...daha: [string, string][]): Promise<M> {
  const k = resolve(kaynak);
  let metin = readFileSync(k, "utf8");
  for (const [e, y] of [[eski, yeni] as [string, string], ...daha]) {
    assert.ok(metin.includes(e), `bozulacak satır kaynakta yok: ${e}`);
    metin = metin.replace(e, () => y);
  }
  const yol = join(klasor, `b-${sira++}.ts`);
  writeFileSync(yol, metin.replace(/from "(\.\.?\/[^"]+)"/g, (_, y: string) => `from "${pathToFileURL(resolve(dirname(k), y)).href}"`));
  return import(pathToFileURL(yol).href) as Promise<M>;
}
after(() => rmSync(klasor, { recursive: true, force: true }));
type C = typeof import("../../src/server/imza/cms.ts");
type P = typeof import("../../src/server/imza/pdf-imzalar.ts");
type S = typeof import("../../src/server/imza/sertifika.ts");
const CMS = "src/server/imza/cms.ts", PDF = "src/server/imza/pdf-imzalar.ts", SERT = "src/server/imza/sertifika.ts";
const k = denemeKimlikleri("ecdsa");

function degistirilmis(a: Kimlik, b: Kimlik, aKumede: boolean): Buffer {
  return imzaEkle(TABAN_PDF, 10, (parcalar) => {
    const h = createHash("sha256"); for (const x of parcalar) h.update(x);
    const oz = imzaliOznitelikler({ belgeOzeti: h.digest(), sertifikaDer: a.der, ozet: "sha256" });
    return imzaliVeriKur({ imzaliOz: oz, imzaDegeri: sign("sha256", oz, a.anahtar), sertifikaDer: b.der, ekSertifikalar: [...(aKumede ? [a.der] : []), k.ara.der, k.kok.der], ozet: "sha256", anahtarTuru: "ecdsa" });
  });
}
async function imzaliTaban(): Promise<{ p: Buffer; oku: ReturnType<typeof nesneOkuyucu>; sayfaNo: number; sayfa: string }> {
  const d = await PDFDocument.create();
  d.addPage([595, 842]).drawRectangle({ x: 50, y: 700, width: 200, height: 40, color: rgb(0.2, 0.2, 0.2) });
  const t = Buffer.from(await d.save({ useObjectStreams: false }));
  const h = imzaHazirla(t, { sertifikaDer: k.kisi.der, zaman: new Date("2026-10-17T09:00:00Z") });
  const p = imzaTamamla(h, { imzaDegeri: sign(h.ozet, h.imzalanacak, k.kisi.anahtar), zincir: [k.ara.der, k.kok.der] });
  const oku = nesneOkuyucu(p);
  const kok = Number(sonDurum(p).kok.split(" ")[0]);
  const sayfaNo = Number(/\/Kids\s*\[\s*(\d+)/.exec(oku(Number(/\/Pages\s+(\d+)/.exec(oku(kok)!)![1]))!)![1]);
  return { p, oku, sayfaNo, sayfa: oku(sayfaNo)! };
}

test("1: zaman damgası kullanımı aranmayınca imzalayanın kendi damgası sağlam sayılır", async () => {
  const m = await bozuk<C>(CMS, '!tsa.bilgi.zamanDamgasi ? "sertifika zaman damgası için değil"', 'false ? ""');
  const eski = sertifikaYap({ cn: "ESKİ DENEME", veren: k.ara, tur: "ecdsa", bas: new Date("2024-01-01T00:00:00Z"), son: new Date("2025-01-01T00:00:00Z") });
  const d = m.damgaDenetle(damgaYap([Buffer.from("veri")], eski, [], new Date("2024-06-01T00:00:00Z")), [Buffer.from("veri")]);
  assert.equal(d.imza, "tamam", "bozuk: kendi damgası yakalandı");
});

test("2: signingCertificate özetiyle seçilmeyince imzasız sid nitelikli sertifikayı gösterir", async () => {
  const m = await bozuk<C>(CMS, "const c = havuz.find((x) => imzaSertifikasiTutar(s, x) === true);", "const c = null as Sertifika | null;");
  const a = sertifikaYap({ cn: "KİŞİ A NİTELİKSİZ", veren: k.ara, tur: "ecdsa", nitelikli: false });
  const b = sertifikaYap({ cn: "KİŞİ B NİTELİKLİ", veren: k.ara, ayniAnahtar: a });
  const p = degistirilmis(a, b, true);
  const s = p.toString("latin1"), i = s.indexOf("/Contents <") + 11;
  const der = Buffer.from(s.slice(i, s.indexOf(">", i)).replace(/(00)+$/, ""), "hex");
  const v = m.imzaliVeriOku(der);
  assert.equal(m.imzaciSertifikasi(v, v.imzacilar[0])?.bilgi.nitelikli, true, "bozuk: imzalanan kimlik bulundu");
});

test("3: sertifika bağı tutmayan imza sağlam sayılınca değiştirilmiş imza düzey alır", async () => {
  const m = await bozuk<P>(PDF, '(i.tur !== "imza" || i.sertifikaBagi !== false)', "true");
  const a = sertifikaYap({ cn: "KİŞİ A", veren: k.ara, tur: "ecdsa", nitelikli: false });
  const b = sertifikaYap({ cn: "KİŞİ B", veren: k.ara, ayniAnahtar: a });
  assert.equal(m.pdfImzalariniCozumle(degistirilmis(a, b, false)).duzey, "B-B", "bozuk: bağ yakalandı");
});

test("4: sayfa sözlüğü serbest bırakılınca imzadan sonra değişen sayfa izinli görünür", async () => {
  const m = await bozuk<P>(PDF, 'if (tip === "/Page") return serbestDisiAyni(eski, yeni, ["Annots"])', 'if (tip === "/Page") return true || serbestDisiAyni(eski, yeni, ["Annots"])');
  const { p, sayfaNo, sayfa } = await imzaliTaban();
  const s1 = ekle(p, [{ no: sayfaNo, govde: sayfa.replace(/\/MediaBox\s*\[[^\]]*\]/, "/MediaBox [0 0 600 842]") }]).pdf;
  assert.equal(m.pdfImzalariniCozumle(s1).imzalar[0].sonrakiEkler.durum, "izinli", "bozuk: sayfa değişikliği yakalandı");
});

test("5: akış verisi karşılaştırılmayınca aynı sözlükle değişen içerik görünmez", async () => {
  const m = await bozuk<P>(PDF, "duz(eski) === duz(yeni) && (once.ham(no)?.equals(son.ham(no) ?? Buffer.alloc(0)) ?? son.ham(no) === null)", "duz(eski) === duz(yeni)");
  const { p, oku, sayfa } = await imzaliTaban();
  const icerikNo = Number(/\/Contents\s*\[?\s*(\d+)/.exec(sayfa)![1]);
  const eskiVeri = oku.ham(icerikNo)!;
  const yeniVeri = Buffer.from(eskiVeri.toString("latin1").replace(/\d/, (x) => String((Number(x) + 1) % 10)), "latin1");
  const s2 = ekle(p, [{ no: icerikNo, govde: Buffer.concat([Buffer.from(`${oku(icerikNo)}\nstream\n`, "latin1"), yeniVeri, Buffer.from("\nendstream", "latin1")]) }]).pdf;
  assert.equal(m.pdfImzalariniCozumle(s2).imzalar[0].sonrakiEkler.durum, "izinli", "bozuk: içerik değişikliği yakalandı");
});

test("6: kanıtın bu sertifikaya ait olduğu aranmayınca başka makamın OCSP cevabı B-LT saydırır", async () => {
  const m = await bozuk<P>(PDF, 'try { const r = ocspCevabi(der, s, veren); if (r.imza === "tamam" && r.durum !== "bilinmiyor") return r.durum; } catch { /* sıradaki */ }',
    'return "gecerli";');
  const p = dssEkle(pdfImzala(TABAN_PDF, 10, k, { damga: true }), 11, denemeKimlikleri("ecdsa", "BAŞKA DENEME"));
  assert.equal(m.pdfImzalariniCozumle(p).duzey, "B-LT", "bozuk: başkasının kanıtı yakalandı");
});

test("7: sertifika makamı aranmayınca son kullanıcı sertifikası ara halka olur", async () => {
  const m = await bozuk<S>(SERT, "if (v === s || v.der.equals(s.der) || !v.bilgi.ca) continue;", "if (v === s || v.der.equals(s.der)) continue;");
  const x = m.sertifikaOku(sertifikaYap({ cn: "AYŞE DENEME", veren: k.tsa, tur: "ecdsa" }).der)!;
  const havuz = [k.tsa, k.ara, k.kok].map((c) => m.sertifikaOku(c.der)!);
  assert.equal(m.zincirKur(x, havuz).length, 4, "bozuk: makam olmayan veren yakalandı");
});

test("8: SHA-1 belge imzasında da kabul edilince çakışmaya açık imza tamam olur", async () => {
  const m = await bozuk<C>(CMS, '(!sha1Izinli && a.tur !== "pss" && !guvenliOzet(ozet))', "false");
  const r = denemeKimlikleri("rsa").kisi, veri = Buffer.from("deneme");
  assert.equal(m.algoritmaDenetle("1.2.840.113549.1.1.5", null, null, r.acik, veri, sign("sha1", veri, r.anahtar), false), "tamam", "bozuk: SHA-1 yakalandı");
});

test("9: TypeError BozukDer'e çevrilmeyince eksik alanlı CMS çözümleyiciyi düşürür", async () => {
  /* iki katlı savunma (alan denetimi + TypeError dönüşümü): ikisi birden kalkınca SignerInfo'su yalnız sürümden ibaret CMS TypeError fırlatır */
  const m = await bozuk<C>(CMS, "    if (!sid) throw new BozukDer();\n", "",
    ["  try { return imzaliVeriCoz(der); } catch (e) { if (e instanceof TypeError) throw new BozukDer(); throw e; }", "  return imzaliVeriCoz(der);"]);
  const yalnizSurum = Buffer.from("302806092a864886f70d010702a01b30190201013100300b06092a864886f70d01070131053003020101", "hex");
  assert.throws(() => m.imzaliVeriOku(yalnizSurum), TypeError, "bozuk: eksik alan yine BozukDer oldu");
});
