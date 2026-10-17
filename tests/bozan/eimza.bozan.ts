/* OLUMSUZ KANIT — tests/eimza.test.ts neyi koruyor (sunum 595 madde 25: e-imzanın yeri, imzaya hazırlanan PDF'te boş imza alanı). Kaynak diskte
   DEĞİŞTİRİLMEZ (anayasa 13.11): dosya bellekte bozulup geçici klasörden içe aktarılır (göreli yol asıl dosyaya, paket adı bu dosyanın çözdüğü yere).
   1. İmzalı PDF denetiminde boş imza alanının yalnız değer / görünüm alabileceği kuralı olmasaydı imzalayan, alanın yerini sayfanın tamamına
      genişletip (görünümüyle raporun üstünü örterek) imzalı PDF olarak yükleyebilirdi.
   2. İşaret bağlantısı kaldırılmasaydı imzaya hazırlanan PDF'te tıklanır, anlamsız bir bağlantı kalırdı (ve iki kez çalışan motor iki alan koyardı).
   3. İşaret yalnız imzaya hazırlanan belgeye konmasaydı önizleme PDF'inde de bağlantı olurdu.
   4. (2026-10-17, İ5) Her sayfadaki görünüm parçasına değer yazılabilseydi imzalayan ayrı bir imzayı parçaya bağlayabilirdi.
   5. (2026-10-17, İ5) Onaylayanın yeri yok sayılsaydı ikinci boş imza alanı konmazdı. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { PDFDocument, PDFString } from "pdf-lib";
import { EIMZA_ISARETI, imzaAlaniKoy } from "../../src/belge/eimza.ts";
import { ornekBelge } from "../../src/belge/ornek.ts";

const klasor = mkdtempSync(join(tmpdir(), "eimza-bozan-"));
let sira = 0;
async function bozuk<M>(kaynak: string, eski: string, yeni: string): Promise<M> {
  const k = resolve(kaynak), metin = readFileSync(k, "utf8");
  assert.ok(metin.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const yol = join(klasor, `b-${sira++}.ts`);
  writeFileSync(yol, metin.replace(eski, () => yeni).replace(/from "(\.\.?\/[^"]+)"/g, (_, y: string) => `from "${pathToFileURL(resolve(dirname(k), y)).href}"`)
    .replace(/from "((?!node:|file:)[a-z@][^"]*)"/g, (_, y: string) => `from "${import.meta.resolve(y)}"`));
  return import(pathToFileURL(yol).href) as Promise<M>;
}
after(() => rmSync(klasor, { recursive: true, force: true }));
const latin1 = (b: Uint8Array) => Buffer.from(b).toString("latin1");
async function ornekPdf(): Promise<Uint8Array> {
  const d = await PDFDocument.create();
  const p = d.addPage([595.28, 841.89]);
  p.node.addAnnot(d.context.register(d.context.obj({ Type: "Annot", Subtype: "Link", Rect: [190, 150, 560, 190], A: { S: "URI", URI: PDFString.of(EIMZA_ISARETI) } })));
  return d.save({ useObjectStreams: false });
}

test("1: boş imza alanının değişmez anahtarları denetlenmeyince alanı sayfanın tamamına genişleten imzalı PDF kabul edilir", async () => {
  const m = await bozuk<typeof import("../../src/modules/raporlar/imza-pdf.ts")>("src/modules/raporlar/imza-pdf.ts",
    "          if (kanonik(x.deger, IMZA_ALANI_SERBEST) !== kanonik(eski.deger, IMZA_ALANI_SERBEST)) return false;\n", "");
  const imzasiz = await imzaAlaniKoy(await ornekPdf(), { yer: "hucre" }), s = latin1(imzasiz);
  const a = /(\d+) 0 obj\s*(<<(?:(?!endobj)[\s\S])*?\/FT \/Sig(?:(?!endobj)[\s\S])*?>>)\s*endobj/.exec(s)!;
  const kok = [...s.matchAll(/\/Root\s+(\d+\s+\d+\s+R)/g)].at(-1)![1];
  const genis = a[2].replace(/\/Rect \[[^\]]*\]/, "/Rect [ 0 0 595 842 ]").replace(/>>\s*$/, "/V 9001 0 R >>");
  const ek = `\n${a[1]} 0 obj\n${genis}\nendobj\n9001 0 obj\n<< /Type /Sig /ByteRange [0 1 2 3] /Contents <00> >>\nendobj\ntrailer\n<< /Root ${kok} /Prev 0 >>\n%%EOF\n`;
  assert.equal(m.imzaliPdfGecerli(imzasiz, new Uint8Array(Buffer.concat([Buffer.from(imzasiz), Buffer.from(ek, "latin1")]))), true, "bozuk: yeri değişen alan kabul edildi");
});

test("2: işaret bağlantısı kaldırılmayınca imzaya hazırlanan PDF'te bağlantı kalır", async () => {
  const m = await bozuk<typeof import("../../src/belge/eimza.ts")>("src/belge/eimza.ts", "      annots.remove(j);\n", "");
  const pdf = await m.imzaAlaniKoy(await ornekPdf(), { yer: "hucre" });
  assert.ok(latin1(pdf).includes(EIMZA_ISARETI) || (await PDFDocument.load(pdf)).getPages()[0].node.Annots()!.size() > 1, "bozuk: işaret kaldı");
});

test("3: işaret yalnız imzaya hazırlanan belgeye konmayınca önizlemede de bağlantı olur", async () => {
  const m = await bozuk<typeof import("../../src/belge/belge.ts")>("src/belge/belge.ts", "    if (!v.kesin || isaretKondu", "    if (isaretKondu");
  assert.ok(renderToStaticMarkup(m.raporBelgesi(ornekBelge("KOMPRESOR")) as never).includes(`href="${EIMZA_ISARETI}"`), "bozuk: önizlemede işaret");
});

/* 2026-10-17 (İ5): iki e-imza yeri ve her sayfadaki parçalar */
function nesneleriYaz(imzasiz: Uint8Array, yazilacak: { no: number; govde: (eski: string) => string }[]): Uint8Array {
  const s = latin1(imzasiz), kok = [...s.matchAll(/\/Root\s+(\d+\s+\d+\s+R)/g)].at(-1)![1];
  const govdeOf = (no: number) => new RegExp(`(?:^|\\n)${no} 0 obj\\s*(<<(?:(?!endobj)[\\s\\S])*?>>)\\s*endobj`).exec(s)![1];
  const ek = yazilacak.map((x) => `\n${x.no} 0 obj\n${x.govde(govdeOf(x.no))}\nendobj\n`).join("")
    + `9001 0 obj\n<< /Type /Sig /Filter /Adobe.PPKLite /ByteRange [0 10 20 30] /Contents <00ff> >>\nendobj\ntrailer\n<< /Root ${kok} /Prev 0 >>\n%%EOF\n`;
  return new Uint8Array(Buffer.concat([Buffer.from(imzasiz), Buffer.from(ek, "latin1")]));
}
const nesneNo = (s: string, desen: RegExp) => [...s.matchAll(/(\d+) 0 obj\s*(<<(?:(?!endobj)[\s\S])*?>>)\s*endobj/g)].filter((m) => desen.test(m[2])).map((m) => Number(m[1]));

test("4 (İ5): her sayfadaki görünüm parçasına değer yazılabilseydi imzalayan ayrı bir imzayı parçaya bağlayabilirdi", async () => {
  const m = await bozuk<typeof import("../../src/modules/raporlar/imza-pdf.ts")>("src/modules/raporlar/imza-pdf.ts",
    'const IMZA_GORUNUMU_SERBEST = new Set(["AP", "MK", "DA", "F"]);', 'const IMZA_GORUNUMU_SERBEST = new Set(["V", "AP", "MK", "DA", "F"]);');
  const d = await PDFDocument.create(); d.addPage([595.28, 841.89]); d.addPage([595.28, 841.89]);
  const h = await imzaAlaniKoy(await d.save({ useObjectStreams: false }), { yer: "kutu", x: 120, y: 240, en: 80, boy: 25, sayfa: "her" });
  const s = latin1(h);
  const [ebeveyn] = nesneNo(s, /\/FT \/Sig[\s\S]*\/Kids/), [cocuk] = nesneNo(s, /^(?=[\s\S]*\/Subtype \/Widget)(?=[\s\S]*\/Parent \d+ 0 R)/);
  const deger = (g: string) => g.replace(/>>\s*$/, "/V 9001 0 R >>");
  assert.equal(m.imzaliPdfGecerli(h, nesneleriYaz(h, [{ no: ebeveyn, govde: deger }, { no: cocuk, govde: deger }])), true, "bozuk: reddetti");
});

test("5 (İ5): onaylayanın yeri yok sayılsaydı ikinci boş imza alanı konmazdı", async () => {
  const m = await bozuk<typeof import("../../src/belge/eimza.ts")>("src/belge/eimza.ts", "  koy(yeri2, EIMZA_ISARETI_2, EIMZA_ALAN_ADI_2);\n", "");
  const d = await PDFDocument.create(); d.addPage([595.28, 841.89]);
  const h = await m.imzaAlaniKoy(await d.save({ useObjectStreams: false }), { yer: "kutu", x: 120, y: 240, en: 80, boy: 25 }, { yer: "kutu", x: 15, y: 240, en: 80, boy: 25 });
  assert.equal((await PDFDocument.load(h)).catalog.getAcroForm()?.getAllFields().length, 1, "bozuk: iki alan kondu");
});
