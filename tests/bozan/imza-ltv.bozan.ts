/* OLUMSUZ KANIT — tests/imza-ltv.test.ts neyi koruyor (IMZA-SERVISI.md ES2 — imza motoru, 2026-10-17). Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): dosya
   bellekte bozulup geçici klasörden içe aktarılır (göreli içe aktarmalar özgün dosyalara bağlanır).
   1. Ek yazıcı nesnenin konumunu bir bayt kaydırsaydı çapraz başvuru nesnenin başını göstermezdi (okuyucular nesneyi bulamazdı).
   2. Çapraz başvuru zincirinde /Prev izlenmeseydi nesne akışındaki eski nesneler ek yazıldıktan sonra okunamazdı.
   3. OCSP cevabında CertID'nin veren izleri karşılaştırılmasaydı başka verenin aynı seri numaralı sertifikasının durumu bu sertifikanınki sayılırdı.
   4. OCSP imzacısının yetkisi (id-kp-OCSPSigning) aranmasaydı verenin herhangi bir sertifikası "geçerli" cevabı imzalayabilirdi.
   5. Zaman damgası istemcisi tek kullanımlık sayıyı karşılaştırmasaydı eski (yeniden oynatılan) cevap kabul edilirdi.
   6. Zaman damgası istemcisi damganın izini denetlemeseydi başka verinin damgası kabul edilirdi.
   7. Formatın boş e-imza alanı aranmasaydı imza o alana değil yeni görünmez alana işlenirdi (belgedeki imza yeri boş kalırdı).
   8. Belge damgasının imzayı kapsadığı aranmasaydı imzadan önce basılmış damga imzanın zamanını kanıtlıyor sayılırdı (B-T).
   9. Tazelemede önceki DSS okunmasaydı aynı sertifikalar her tazelemede yeniden yazılırdı. */
import assert from "node:assert/strict";
import { sign } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";
import { PDFDocument } from "pdf-lib";
import { EIMZA_ALAN_ADI, imzaAlaniKoy } from "../../src/belge/eimza.ts";
import { imzaHazirla, imzaTamamla } from "../../src/server/imza/imzala.ts";
import { belgeDamgasiEkle, ltvEkle, type LtvKaynaklari } from "../../src/server/imza/ltv.ts";
import { sertifikaOku, type Sertifika } from "../../src/server/imza/sertifika.ts";
import { crlYap, damgaSunucusu, damgaYap, denemeKimlikleri, ocspCevabiYap, sahteAg, sertifikaYap } from "../yardimci/gercek-imza.ts";

const klasor = mkdtempSync(join(tmpdir(), "imza-ltv-bozan-"));
let sira = 0;
async function bozuk<M>(kaynak: string, eski: string, yeni: string): Promise<M> {
  const k = resolve(kaynak), metin = readFileSync(k, "utf8");
  assert.ok(metin.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const yol = join(klasor, `b-${sira++}.ts`);
  writeFileSync(yol, metin.replace(eski, () => yeni).replace(/from "(\.\.?\/[^"]+)"/g, (_, y: string) => `from "${pathToFileURL(resolve(dirname(k), y)).href}"`));
  return import(pathToFileURL(yol).href) as Promise<M>;
}
after(() => rmSync(klasor, { recursive: true, force: true }));
type E = typeof import("../../src/server/imza/pdf-ek.ts");
type I = typeof import("../../src/server/imza/iptal.ts");
type Z = typeof import("../../src/server/imza/zaman-damgasi.ts");
type T = typeof import("../../src/server/imza/yer-tutucu.ts");
type P = typeof import("../../src/server/imza/pdf-imzalar.ts");
type L = typeof import("../../src/server/imza/ltv.ts");
const EK = "src/server/imza/pdf-ek.ts", IPTAL = "src/server/imza/iptal.ts", DAMGA = "src/server/imza/zaman-damgasi.ts", YER = "src/server/imza/yer-tutucu.ts";
const PDF = "src/server/imza/pdf-imzalar.ts", LTV = "src/server/imza/ltv.ts";
const k = denemeKimlikleri("ecdsa");

async function taban(p: { akis?: boolean } = {}): Promise<Buffer> {
  const d = await PDFDocument.create();
  d.addPage([595, 842]);
  return Buffer.from(await d.save({ useObjectStreams: p.akis ?? false }));
}
const kok = (m: E, pdf: Buffer) => Number(m.sonDurum(pdf).kok.split(/\s+/)[0]);
const damga: LtvKaynaklari["damga"] = async (v) => damgaYap(v.map((x) => Buffer.from(x)), k.tsa, [k.ara]);
const iptal: LtvKaynaklari["iptal"] = async (s: Sertifika, v: Sertifika) => {
  const bul = (x: Sertifika) => [k.kok, k.ara, k.kisi, k.tsa].find((y) => y.der.equals(x.der))!;
  return bul(s) === k.kisi ? { ocsp: ocspCevabiYap(bul(s), bul(v)) } : { crl: crlYap(bul(v)) };
};
function imzala(pdf: Buffer, imzaHazirlaF: typeof imzaHazirla = imzaHazirla, alan?: string): Buffer {
  const h = imzaHazirlaF(pdf, { sertifikaDer: k.kisi.der, alan, zaman: new Date("2026-10-17T09:00:00Z") });
  return imzaTamamla(h, { imzaDegeri: sign("sha256", h.imzalanacak, k.kisi.anahtar), zincir: [k.ara.der, k.kok.der] });
}

test("1: ek yazıcı konumu kaydırınca xref girdisi nesnenin başını göstermez", async () => {
  const m = await bozuk<E>(EK, "konum.set(x.no, uzunluk);", "konum.set(x.no, uzunluk + 1);");
  const t = await taban();
  const d = m.sonDurum(t);
  const { pdf } = m.ekle(t, [{ no: d.boyut, govde: "<< /Deneme 1 >>" }]);
  const y = m.nesneYerleri(pdf).get(d.boyut);
  assert.ok(y?.tur === "duz");
  assert.doesNotMatch(pdf.toString("latin1").slice(y.konum, y.konum + 20), new RegExp(`^${d.boyut} 0 obj`), "bozuk: konum yine doğru");
});

test("2: /Prev izlenmeyince nesne akışındaki eski nesne ekten sonra okunamaz", async () => {
  const m = await bozuk<E>(EK, 'if (onceki && /^\\d{1,10}$/.test(onceki)) sira.push(Number(onceki));', "void onceki;");
  const t = await taban({ akis: true });
  const no = kok(m, t), katalog = m.nesneOku(t, no)!;
  const { pdf } = m.ekle(t, [{ no, govde: `${katalog.slice(0, -2)} /Deneme 1 >>` }]);
  assert.ok(![...m.nesneYerleri(pdf).values()].some((y) => y.tur === "akis"), "bozuk: eski bölüm yine okundu");
});

test("3: CertID izleri karşılaştırılmayınca başka verenin sertifikasının cevabı tutar", async () => {
  const m = await bozuk<I>(IPTAL, "      if (!izAdi) continue;\n", "      if (!izAdi || izAdi) { const r = { durum: (sp[1].tag === 0x80 ? \"gecerli\" : \"iptal\") as IptalDurumu, zaman: null, sonraki: null, imza: imzaSonuc }; return r; }\n");
  const r = m.ocspCevabi(ocspCevabiYap(k.kisi, k.ara, { idVeren: k.kok }), sertifikaOku(k.kisi.der)!, sertifikaOku(k.ara.der)!);
  assert.equal(r.durum, "gecerli", "bozuk: başka verenin CertID'si yakalandı");
});

test("4: OCSP imza yetkisi aranmayınca verenin sıradan sertifikası cevap imzalar", async () => {
  const m = await bozuk<I>(IPTAL, "aday.x.verify(veren.anahtar) && ocspImzacisi(aday)", "aday.x.verify(veren.anahtar)");
  const yetkisiz = sertifikaYap({ cn: "Yetkisiz", veren: k.ara, tur: "ecdsa" });
  const r = m.ocspCevabi(ocspCevabiYap(k.kisi, k.ara, { imzalayan: yetkisiz, ekSertifika: [yetkisiz] }), sertifikaOku(k.kisi.der)!, sertifikaOku(k.ara.der)!);
  assert.equal(r.imza, "tamam", "bozuk: yetkisiz imzacı yakalandı");
});

test("5: tek kullanımlık sayı karşılaştırılmayınca yeniden oynatılan cevap kabul edilir", async () => {
  const m = await bozuk<Z>(DAMGA, 'if (tstNonce(token) !== nonce.toString("hex").replace(/^0+(?=.)/, ""))', "if (false)");
  const UC = "http://tsa.ornek.test";
  const token = await m.damgaAl([Buffer.from("veri")], { uc: UC, getir: sahteAg({ [UC]: damgaSunucusu(k.tsa, [k.ara], { nonceBoz: true }) }).getir });
  assert.ok(token.length > 0, "bozuk: tek kullanımlık sayı yakalandı");
});

test("6: damga izi denetlenmeyince başka verinin damgası kabul edilir", async () => {
  const m = await bozuk<Z>(DAMGA, 'if (d.iz !== "tamam" || d.imza !== "tamam" || d.ozet !== "tamam")', 'if (d.imza !== "tamam" || d.ozet !== "tamam")');
  const UC = "http://tsa.ornek.test";
  const token = await m.damgaAl([Buffer.from("veri")], { uc: UC, getir: sahteAg({ [UC]: damgaSunucusu(k.tsa, [k.ara], { izBoz: true }) }).getir });
  assert.ok(token.length > 0, "bozuk: yanlış iz yakalandı");
});

test("7: boş e-imza alanı aranmayınca imza yeni görünmez alana işlenir", async () => {
  const m = await bozuk<T>(YER, "const bos = p.alan ? bosAlan(oku, katalog, p.alan) : null;", "const bos = null as { no: number; govde: string } | null; void bosAlan;");
  const t = Buffer.from(await imzaAlaniKoy(await taban(), { yer: "kutu", x: 20, y: 240, en: 60, boy: 25 }));
  const hazirla: typeof imzaHazirla = (pdf, p) => {
    const h = imzaHazirla(pdf, p);
    return { ...h, yer: m.yerTutucuEkle(pdf, { tur: "imza", alan: p.alan, zaman: p.zaman }) };
  };
  const h = hazirla(t, { sertifikaDer: k.kisi.der, alan: EIMZA_ALAN_ADI });
  const adlar = (await PDFDocument.load(h.yer.pdf)).getForm().getFields().map((f) => f.getName());
  assert.equal(adlar.length, 2, "bozuk: boş alan yine dolduruldu");
});

test("8: belge damgasının imzayı kapsadığı aranmayınca imzadan önceki damga B-T saydırır", async () => {
  const m = await bozuk<P>(PDF, "belgeDamgalari.some((d) => d.boslukBas >= i.kapsamSon)", "belgeDamgalari.length > 0");
  const once = imzala(Buffer.from(await belgeDamgasiEkle(await taban(), damga)));
  assert.equal(m.pdfImzalariniCozumle(once).duzey, "B-T", "bozuk: sıra yakalandı");
});

test("9: önceki DSS okunmayınca tazelemede aynı sertifikalar yeniden yazılır", async () => {
  const m = await bozuk<L>(LTV, "const eskiVeri = (l: string[]) => l.map", "const eskiVeri = (l: string[]) => [] as Buffer[] || l.map");
  const r = await ltvEkle(imzala(await taban()), { damga, iptal });
  const r2 = await m.ltvEkle(r.pdf, { damga, iptal });
  assert.ok(r2.sertifika > 0, "bozuk: tekrar yakalandı");
});
