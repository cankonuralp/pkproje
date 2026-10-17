/* OLUMSUZ KANIT — tests/imza-cozum.test.ts neyi koruyor (IMZA-SERVISI.md ES1, 2026-10-17). Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): dosya
   bellekte bozulup geçici klasörden içe aktarılır (göreli içe aktarmalar özgün dosyalara bağlanır).
   1. Belge özeti karşılaştırılmasaydı imzadan sonra değiştirilen belge sağlam görünürdü.
   2. İmza değeri doğrulanmasaydı uydurma imza sağlam görünürdü.
   3. Damganın izi karşılaştırılmasaydı başka verinin damgası bu imzanın zamanı sayılırdı.
   4. DSS'in konumu aranmasaydı DSS'ten önce basılmış belge damgası arşiv düzeyi (B-LTA) sayılırdı.
   5. Boşluğun /Contents olduğu aranmasaydı imzanın dışında bırakılan başka bir onaltılık dize (imza sarmalama) imza sayılırdı.
   6. (yükleme denetimi) Yüklemede nitelikli işaret aranmasaydı Adobe'nin kendi ürettiği gibi işaretsiz sertifikayla atılan imza kabul edilirdi.
   7. (yükleme denetimi) Yüklemede imza anı aranmasaydı süresi dolmuş sertifikayla atılan imza kabul edilirdi.
   8. (2026-10-17) Parametresiz DigestInfo kabul edilmeseydi gerçek mobil imza (imzayeri) bozuk sayılırdı.
   9. (2026-10-17) DigestInfo esnek ayrıştırılsaydı başka yapının imzası sağlam sayılırdı. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";
import { constants, createHash, privateEncrypt } from "node:crypto";
import { oid, oktet, sira as dizi } from "../../src/server/imza/der.ts";
import { TABAN_PDF, belgeDamgala, damgaYap, denemeKimlikleri, dssEkle, imzaEki, pdfImzala, sertifikaYap } from "../yardimci/gercek-imza.ts";

const klasor = mkdtempSync(join(tmpdir(), "imza-cozum-bozan-"));
let sira = 0;
async function bozuk<M>(kaynak: string, eski: string, yeni: string): Promise<M> {
  const k = resolve(kaynak), metin = readFileSync(k, "utf8");
  assert.ok(metin.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const yol = join(klasor, `b-${sira++}.ts`);
  writeFileSync(yol, metin.replace(eski, () => yeni).replace(/from "(\.\.?\/[^"]+)"/g, (_, y: string) => `from "${pathToFileURL(resolve(dirname(k), y)).href}"`));
  return import(pathToFileURL(yol).href) as Promise<M>;
}
after(() => rmSync(klasor, { recursive: true, force: true }));
type P = typeof import("../../src/server/imza/pdf-imzalar.ts");
type C = typeof import("../../src/server/imza/cms.ts");
type Y = typeof import("../../src/server/imza/yukleme.ts");
const PDF = "src/server/imza/pdf-imzalar.ts", CMS = "src/server/imza/cms.ts", YUK = "src/server/imza/yukleme.ts";
const k = denemeKimlikleri("rsa");

test("1: belge özeti karşılaştırılmayınca değiştirilmiş belge sağlam görünür", async () => {
  const m = await bozuk<P>(PDF, 'sonuc.butunluk = si.imzaliOzDer ? ozetDenetle(si, parcalar) : "desteklenmiyor";', 'sonuc.butunluk = "tamam";');
  const p = pdfImzala(TABAN_PDF, 10, k);
  p.write("6", p.indexOf("/MediaBox [0 0 595 842]") + "/MediaBox [0 0 ".length, "latin1");
  assert.equal(m.pdfImzalariniCozumle(p).imzalar[0].butunluk, "tamam", "bozuk: değişiklik yakalandı");
});

test("2: imza değeri doğrulanmayınca uydurma imza sağlam görünür", async () => {
  const m = await bozuk<P>(PDF, "sonuc.imzaDegeri = imzaDenetle(si, sert.anahtar, parcalar);", 'sonuc.imzaDegeri = "tamam";');
  const p = pdfImzala(TABAN_PDF, 10, k);
  const bas = p.indexOf("<", p.indexOf("/Contents")) + 1;
  const yer = p.subarray(bas, bas + 24_000).toString("latin1").indexOf("04820100") + 28;
  p.write(p[bas + yer] === 0x30 ? "1" : "0", bas + yer, "latin1");
  assert.equal(m.pdfImzalariniCozumle(p).imzalar[0].imzaDegeri, "tamam", "bozuk: uydurma imza yakalandı");
});

test("3: damga izi karşılaştırılmayınca başka verinin damgası tutar", async () => {
  const m = await bozuk<C>(CMS, 'iz = h.digest().equals(t.iz) ? "tamam" : "bozuk";', 'iz = "tamam";');
  const token = damgaYap([Buffer.from("başka veri")], k.tsa, [k.ara]);
  assert.equal(m.damgaDenetle(token, [Buffer.from("bu imza")]).iz, "tamam", "bozuk: yanlış iz yakalandı");
});

test("4: DSS'in konumu aranmayınca DSS'ten önceki belge damgası B-LTA sayılır", async () => {
  const m = await bozuk<P>(PDF, "dss.konum !== null && dss.konum < i.kapsamSon", "true");
  const p = dssEkle(belgeDamgala(pdfImzala(TABAN_PDF, 10, k, { damga: true }), 20, k), 30, k);
  assert.equal(m.pdfImzalariniCozumle(p).duzey, "B-LTA", "bozuk: sıra yakalandı");
});

test("5: boşluğun /Contents olduğu aranmayınca sözlük dışı dize imza sayılır", async () => {
  const m = await bozuk<P>(PDF, "    if (!/\\/Contents[\\x00\\t\\n\\f\\r ]{0,20}$/.test(s.slice(Math.max(0, a - 40), a))) continue;\n", "");
  const p = pdfImzala(TABAN_PDF, 10, k);
  p.write("/Contentz", p.indexOf("/Contents <"), "latin1");
  assert.equal(m.pdfImzalariniCozumle(p).imzalar.length, 1, "bozuk: sarmalama yakalandı");
});

test("6: yüklemede nitelikli işaret aranmayınca işaretsiz sertifikanın imzası kabul edilir", async () => {
  const m = await bozuk<Y>(YUK, "    if (!s.nitelikli) return ", "    if (false as boolean) return ");
  assert.equal(m.ekImzaNedeni(TABAN_PDF, imzaEki(TABAN_PDF, "X", { nitelikli: false })), null, "bozuk: niteliksiz imza yakalandı");
});

test("7: yüklemede imza anı aranmayınca süresi dolmuş sertifika kabul edilir", async () => {
  const m = await bozuk<Y>(YUK, "    if (gecerliMi(s, an) !== true) return ", "    if (gecerliMi(s, an) === null && false) return ");
  const eski = sertifikaYap({ cn: "ESKİ", veren: k.ara, bas: new Date("2024-01-01T00:00:00Z"), son: new Date("2025-01-01T00:00:00Z") });
  assert.equal(m.ekImzaNedeni(TABAN_PDF, imzaEki(TABAN_PDF, "ESKİ", { kisi: eski })), null, "bozuk: süresi dolmuş sertifika yakalandı");
});

/* 2026-10-17 (gerçek mobil imza): parametresiz DigestInfo kabulü kalkınca sağlam imza bozuk sayılır; kabul esnek ayrıştırmaya dönerse
   (yalnız sondaki özete bakılırsa) başka yapının imzası sağlam sayılır */
const veri8 = Buffer.from("imzalı öznitelikler (deneme)"), oz8 = createHash("sha256").update(veri8).digest();
const imza8 = (govde: Buffer) => privateEncrypt({ key: k.kisi.anahtar, padding: constants.RSA_PKCS1_PADDING }, govde);
test("8: parametresiz DigestInfo kabulü kalkınca gerçek mobil imza bozuk sayılır", async () => {
  const m = await bozuk<C>(CMS, " || rsaParametresiz(ozet, veri, anahtar, imza) ?", " ?");
  assert.equal(m.algoritmaDenetle("1.2.840.113549.1.1.1", null, "2.16.840.1.101.3.4.2.1", k.kisi.acik, veri8, imza8(dizi(dizi(oid("2.16.840.1.101.3.4.2.1")), oktet(oz8))), false),
    "bozuk", "bozuk: parametresiz imza kabul edildi");
});
test("9: DigestInfo esnek ayrıştırılınca (yalnız sondaki özet) başka yapının imzası sağlam sayılır", async () => {
  const m = await bozuk<C>(CMS, "  return acilan.equals(sira(sira(oid(o)), oktet(createHash(ozet).update(veri).digest())));",
    "  const h = createHash(ozet).update(veri).digest(); return acilan.subarray(acilan.length - h.length).equals(h);");
  assert.equal(m.algoritmaDenetle("1.2.840.113549.1.1.1", null, "2.16.840.1.101.3.4.2.1", k.kisi.acik, veri8, imza8(Buffer.concat([Buffer.from("çöp yapı"), oz8])), false),
    "tamam", "bozuk: başka yapı yakalandı");
});
