/* OLUMSUZ KANIT — tests/imza-esdeger.test.ts neyi koruyor (2026-10-17, yeniden yazılmış imzalı PDF). Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): dosya
   bellekte bozulup geçici klasörden içe aktarılır (göreli içe aktarmalar mutlak adrese çevrilir).
   1. İmza programının eklediği çizimde işlem beyaz listesi olmasaydı sayfaya "UYGUN DEĞİL" yazılabilirdi.
   2. Bizim çizimimiz başlarken grafik durumu denetlenmeseydi rapor küçültülebilir / saydamlaştırılabilirdi.
   3. Damganın yeri denetlenmeseydi raporun ortasına damga basılabilirdi.
   4. Belirteç sınırı denetlenmeseydi bizim çizimimiz bir dizginin içine alınıp gizlenebilirdi.
   5. Kaynaklar içerikçe karşılaştırılmasaydı yazı tipi / resim değiştirilebilirdi.
   6. Yeni açıklamalar sınırlanmasaydı rapora not (FreeText) eklenebilirdi.
   7. Önceki imzayı taşıyan PDF'in yeniden yazımı reddedilmeseydi teknik yöneticinin imzası bozuk bir belge kabul edilirdi.
   8. Katalog korunmasaydı belge açılınca çalışan eylem eklenebilirdi. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";
import { imzaEki } from "../yardimci/gercek-imza.ts";
import { ornekPdf, yenidenYaz, type YenidenSecenek } from "../yardimci/pdf-yaz.ts";

const KAYNAK = "src/modules/raporlar/imza-esdeger.ts";
const klasor = mkdtempSync(join(tmpdir(), "imza-esdeger-bozan-"));
after(() => rmSync(klasor, { recursive: true, force: true }));
type Modul = typeof import("../../src/modules/raporlar/imza-esdeger.ts");
let sira = 0;
async function bozuk(eski: string, yeni: string): Promise<Modul> {
  const metin = readFileSync(KAYNAK, "utf8").replace(/from "(\.\.?\/[^"]+)"/g, (_, y: string) => `from "${pathToFileURL(resolve(dirname(KAYNAK), y)).href}"`);
  assert.ok(metin.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const hedef = join(klasor, `imza-esdeger-${sira++}.ts`);
  writeFileSync(hedef, metin.replace(eski, yeni));
  return (await import(pathToFileURL(hedef).href)) as Modul;
}
const A = ornekPdf();
const kabul = (m: Modul, p: YenidenSecenek, imzasiz: Uint8Array = A) => "taban" in m.imzaliTaban(imzasiz, imzaEki(yenidenYaz(imzasiz, p)));

test("eklenen çizimde işlem beyaz listesi kalkınca sayfaya yazı eklenir", async () => {
  const m = await bozuk("if (eklenen && !DAMGA_ISLEMLERI.has(op)) return", "if (false) return");
  assert.equal(kabul(m, { sonek: " Q\nBT /F1 12 Tf 100 400 Td (UYGUN DEGIL) Tj ET\n" }), true, "bozuk: yazı eklenmiş belge kabul");
});

test("grafik durumu denetimi kalkınca rapor küçültülür", async () => {
  const m = await bozuk("birimMi(d.m) && !d.gs && mc === 0 ? null :", "true ? null :");
  assert.equal(kabul(m, { onek: "q 0.5 0 0 0.5 0 0 cm\n" }), true, "bozuk: küçültülmüş rapor kabul");
});

test("damganın yeri denetlenmeyince raporun ortasına damga basılır", async () => {
  const m = await bozuk("else if (!c.every(damgaKenarda))", "else if (false)");
  assert.equal(kabul(m, { sonek: " Q\nq\nq 1 0 0 1 200 400 cm /Xi0 Do Q\nQ\n" }), true, "bozuk: ortadaki damga kabul");
});

test("belirteç sınırı denetlenmeyince çizimimiz dizginin içine alınıp gizlenir", async () => {
  const m = await bozuk("if ((t.bas < bas && t.son > bas) || (t.bas < son && t.son > son)) return", "if (false) return");
  assert.equal(kabul(m, { onek: "q (", sonek: ") Q\n" }), true, "bozuk: gizlenmiş rapor kabul");
});

test("kaynaklar içerikçe karşılaştırılmayınca yazı tipi değiştirilir", async () => {
  const m = await bozuk("if (!gB.has(ad) || !esit(g, x, gB.get(ad)))", "if (!gB.has(ad))");
  assert.equal(kabul(m, { sozluk: (s, no) => (no === 3 ? s.replace("/Helvetica", "/Courier") : s) }), true, "bozuk: başka yazı tipi kabul");
});

test("yeni açıklamalar sınırlanmayınca rapora not eklenir", async () => {
  const m = await bozuk("return `İmza programı ${no}. sayfaya izin dışı bir açıklama eklemiş", "continue; `");
  assert.equal(kabul(m, { ekNesne: [{ no: 9100, sozluk: "<< /Type /Annot /Subtype /FreeText /Rect [100 400 300 450] /Contents (Uygun degil) >>" }], ekAciklama: ["9100 0 R"] }),
    true, "bozuk: not eklenmiş belge kabul");
});

test("önceki imza denetimi kalkınca imzası bozulmuş belge kabul edilir", async () => {
  const m = await bozuk("if (!onek && IMZA_SOZLUGU.test(latin1(imzasiz))) return", "if (false) return");
  const ty = imzaEki(A, "DENEME TEKNİK");
  assert.equal(kabul(m, {}, ty), true, "bozuk: teknik yöneticinin imzası bozulmuş yeniden yazım kabul");
});

test("katalog korunmayınca belge açılınca çalışan eylem eklenir", async () => {
  const m = await bozuk("for (const k of KATALOG_KORUNAN) if", "for (const k of [] as string[]) if");
  assert.equal(kabul(m, { sozluk: (s, no) => (no === 1 ? s.replace(/>>\s*$/, "/OpenAction << /S /JavaScript /JS (x) >> >>") : s) }), true, "bozuk: eylemli belge kabul");
});
