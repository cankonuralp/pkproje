/* OLUMSUZ KANIT — tests/disa.test.ts neyi koruyor (320). Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): yazıcı bellekte bozulur, geçici klasörden
   içe aktarılır.
   1. Adres şeması denetlenmeseydi Excel'deki "Rapor" köprüsü javascript: / file: gibi bir adrese bağlanabilirdi.
   2. XML kaçışı olmasaydı uygunsuzluk metnindeki "<", "&" dosyanın XML'ini bozar (Excel açamaz) ya da hücreye işaretleme sokulurdu.
   3. Ad denetimi olmasaydı ZIP'e "../" ile başlayan yol yazılır, açan klasör dışına dosya çıkarırdı (toplu indirme). */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";
import { zipAc } from "../yardimci/zip.ts";

const klasor = mkdtempSync(join(tmpdir(), "disa-bozan-"));
after(() => rmSync(klasor, { recursive: true, force: true }));
let sira = 0;
async function bozuk<M>(kaynak: string, eski: string, yeni: string): Promise<M> {
  const metin = readFileSync(kaynak, "utf8");
  assert.ok(metin.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const cevrilmis = metin.replace(eski, yeni).replace(/from "(\.{1,2}\/[^"]+)"/g, (_t, yol: string) => `from "${pathToFileURL(resolve(dirname(kaynak), yol)).href}"`);
  const hedef = join(klasor, `kopya-${sira++}.ts`);
  writeFileSync(hedef, cevrilmis);
  return import(pathToFileURL(hedef).href) as Promise<M>;
}
type Xlsx = typeof import("../../src/components/disa/xlsx.ts");
type Zip = typeof import("../../src/components/disa/zip.ts");
const XLSX = "src/components/disa/xlsx.ts", ZIP = "src/components/disa/zip.ts";
const sayfa = (b: Uint8Array) => new TextDecoder().decode(zipAc(b).get("xl/worksheets/_rels/sheet1.xml.rels") ?? new Uint8Array());

test("adres şeması denetimi kalkınca javascript: köprü olur (kilidin koruduğu açık)", async () => {
  const m = await bozuk<Xlsx>(XLSX, `return x.protocol === "https:" || x.protocol === "http:" ? x.href : null;`, "return x.href;");
  assert.match(sayfa(m.xlsxBayt("x", [["a"], [{ metin: "Rapor", url: "javascript:alert(1)" }]])), /Target="javascript:alert\(1\)"/, "javascript: köprü oldu");
});

test("XML kaçışı kalkınca uygunsuzluk metni dosyanın XML'ine işaretleme olarak girer", async () => {
  const m = await bozuk<Xlsx>(XLSX, `.replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" })[c]!)`, "");
  const s = new TextDecoder().decode(zipAc(m.xlsxBayt("x", [["a"], ["<b>kalın</b> & ötesi"]])).get("xl/worksheets/sheet1.xml"));
  assert.ok(s.includes("<b>kalın</b> & ötesi"), "ham işaretleme dosyaya girdi");
});

test("ad denetimi kalkınca ZIP'e açan klasörün dışına çıkan yol yazılır", async () => {
  const m = await bozuk<Zip>(ZIP, `adMetni.split("/").some((p) => p === ".." || p === "")`, "false");
  assert.ok(zipAc(m.zipBayt([["../disari.txt", "x"]])).has("../disari.txt"), "'../' yolu yazıldı");
});
