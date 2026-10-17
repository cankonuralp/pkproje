/* OLUMSUZ KANIT — tests/imza-ltv.test.ts neyi koruyor (IMZA-SERVISI.md, 2026-10-17: probata'nın okuyucusu artımlı / LTV ekli belgede). Kaynak diskte
   DEĞİŞTİRİLMEZ (anayasa 13.11): dosya bellekte bozulup geçici klasörden içe aktarılır (göreli içe aktarmalar özgün dosyalara bağlanır). Belge test
   verisi üreticisinden (tests/yardimci/imza-uret/ — imza üretimi probata-sign'da); bozulan YALNIZ probata kodu.
   1. Çapraz başvuru zincirinde /Prev izlenmeseydi nesne akışındaki eski nesneler ek yazıldıktan sonra okunamazdı.
   2. OCSP cevabında CertID'nin veren izleri karşılaştırılmasaydı başka verenin aynı seri numaralı sertifikasının durumu bu sertifikanınki sayılırdı.
   3. OCSP imzacısının yetkisi (id-kp-OCSPSigning) aranmasaydı verenin herhangi bir sertifikası "geçerli" cevabı imzalayabilirdi.
   4. Belge damgasının imzayı kapsadığı aranmasaydı imzadan önce basılmış damga imzanın zamanını kanıtlıyor sayılırdı (B-T).
   2026-10-17 çıkarılanlar (bozulan kod yalnız taşınan yazıcı / ağ kodu — probata-sign'da): ek yazıcının konumu, zaman damgası istemcisinin tek
   kullanımlık sayısı ve izi, yer tutucunun boş e-imza alanını bulması, tazelemede önceki DSS'in okunması. */
import assert from "node:assert/strict";
import { sign } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";
import { PDFDocument } from "pdf-lib";
import { sertifikaOku } from "../../src/server/imza/sertifika.ts";
import { damgaYap, denemeKimlikleri, ocspCevabiYap, sertifikaYap } from "../yardimci/gercek-imza.ts";
import { imzaHazirla, imzaTamamla } from "../yardimci/imza-uret/imzala.ts";
import { belgeDamgasiEkle, type LtvKaynaklari } from "../yardimci/imza-uret/ltv.ts";
import { ekle } from "../yardimci/imza-uret/pdf-ek-yaz.ts";

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
type P = typeof import("../../src/server/imza/pdf-imzalar.ts");
const EK = "src/server/imza/pdf-ek.ts", IPTAL = "src/server/imza/iptal.ts", PDF = "src/server/imza/pdf-imzalar.ts";
const k = denemeKimlikleri("ecdsa");

async function taban(p: { akis?: boolean } = {}): Promise<Buffer> {
  const d = await PDFDocument.create();
  d.addPage([595, 842]);
  return Buffer.from(await d.save({ useObjectStreams: p.akis ?? false }));
}
const kok = (m: E, pdf: Buffer) => Number(m.sonDurum(pdf).kok.split(/\s+/)[0]);
const damga: LtvKaynaklari["damga"] = async (v) => damgaYap(v.map((x) => Buffer.from(x)), k.tsa, [k.ara]);
function imzala(pdf: Buffer): Buffer {
  const h = imzaHazirla(pdf, { sertifikaDer: k.kisi.der, zaman: new Date("2026-10-17T09:00:00Z") });
  return imzaTamamla(h, { imzaDegeri: sign("sha256", h.imzalanacak, k.kisi.anahtar), zincir: [k.ara.der, k.kok.der] });
}

test("1: /Prev izlenmeyince nesne akışındaki eski nesne ekten sonra okunamaz", async () => {
  const m = await bozuk<E>(EK, 'if (onceki && /^\\d{1,10}$/.test(onceki)) sira.push(Number(onceki));', "void onceki;");
  const t = await taban({ akis: true });
  const no = kok(m, t), katalog = m.nesneOku(t, no)!;
  const { pdf } = ekle(t, [{ no, govde: `${katalog.slice(0, -2)} /Deneme 1 >>` }]);
  assert.ok(![...m.nesneYerleri(pdf).values()].some((y) => y.tur === "akis"), "bozuk: eski bölüm yine okundu");
});

test("2: CertID izleri karşılaştırılmayınca başka verenin sertifikasının cevabı tutar", async () => {
  const m = await bozuk<I>(IPTAL, "      if (!izAdi) continue;\n", "      if (!izAdi || izAdi) { const r = { durum: (sp[1].tag === 0x80 ? \"gecerli\" : \"iptal\") as IptalDurumu, zaman: null, sonraki: null, imza: imzaSonuc }; return r; }\n");
  const r = m.ocspCevabi(ocspCevabiYap(k.kisi, k.ara, { idVeren: k.kok }), sertifikaOku(k.kisi.der)!, sertifikaOku(k.ara.der)!);
  assert.equal(r.durum, "gecerli", "bozuk: başka verenin CertID'si yakalandı");
});

test("3: OCSP imza yetkisi aranmayınca verenin sıradan sertifikası cevap imzalar", async () => {
  const m = await bozuk<I>(IPTAL, "aday.x.verify(veren.anahtar) && ocspImzacisi(aday)", "aday.x.verify(veren.anahtar)");
  const yetkisiz = sertifikaYap({ cn: "Yetkisiz", veren: k.ara, tur: "ecdsa" });
  const r = m.ocspCevabi(ocspCevabiYap(k.kisi, k.ara, { imzalayan: yetkisiz, ekSertifika: [yetkisiz] }), sertifikaOku(k.kisi.der)!, sertifikaOku(k.ara.der)!);
  assert.equal(r.imza, "tamam", "bozuk: yetkisiz imzacı yakalandı");
});

test("4: belge damgasının imzayı kapsadığı aranmayınca imzadan önceki damga B-T saydırır", async () => {
  const m = await bozuk<P>(PDF, "belgeDamgalari.some((d) => d.boslukBas >= i.kapsamSon)", "belgeDamgalari.length > 0");
  const once = imzala(Buffer.from(await belgeDamgasiEkle(await taban(), damga)));
  assert.equal(m.pdfImzalariniCozumle(once).duzey, "B-T", "bozuk: sıra yakalandı");
});
