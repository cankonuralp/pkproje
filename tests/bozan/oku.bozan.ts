/* OLUMSUZ KANIT — tests/oku.test.ts neyi koruyor (325). Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): okuyucu bellekte bozulur, geçici klasörden
   içe aktarılır.
   1. Açılmış boyut sayılmasaydı küçük bir .xlsx (sıkıştırma bombası) yüzlerce MB'a açılır, sekme kilitlenirdi.
   3. Kapanmayan etiket "bozuk" sayılmasaydı kötü niyetli dosya hata vermeden geçerdi (324–327 incelemesi: doğrusal tarayıcı).
   2. Türkçe Windows kodlamasına düşülmeseydi Excel'in kaydettiği CSV'de ğ ü ş ı ö ç bozuk okunur, türler eşleşmezdi. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";
import { deflateZip } from "../yardimci/zip.ts";

const klasor = mkdtempSync(join(tmpdir(), "oku-bozan-"));
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
type Oku = typeof import("../../src/components/disa/oku.ts");
const OKU = "src/components/disa/oku.ts";

test("açılmış boyut sayılmayınca sıkıştırma bombası sonuna kadar açılır (kilidin koruduğu açık)", async () => {
  const m = await bozuk<Oku>(OKU, `if (top > sinir) { await okuyucu.cancel(); throw new TabloHatasi("Dosya çok büyük."); }`, "");
  const bomba = deflateZip([["xl/worksheets/sheet1.xml", new Uint8Array(m.OKU_SINIR.parca + 1024 * 1024)]]);
  await assert.doesNotReject(m.tabloOku("bomba.xlsx", bomba), "bomba açıldı");
});

test("Türkçe Windows kodlamasına düşülmeyince Excel'in CSV'sindeki Türkçe harfler bozuk okunur", async () => {
  const m = await bozuk<Oku>(OKU, `catch { metin = new TextDecoder("windows-1254").decode(bayt); }`, `catch { metin = new TextDecoder("utf-8").decode(bayt); }`);
  const l = await m.tabloOku("liste.csv", new Uint8Array([0x44, 0xf6, 0x6b, 0xfc, 0x6d, 0x3b, 0xde, 0x69, 0xfe, 0x65]));
  assert.notDeepEqual(l, [["Döküm", "Şişe"]], "Türkçe harfler bozuldu");
  assert.ok(l[0].join("").includes("\uFFFD"), "yerine geçen karakter");
});

test("kapanmayan etiket bozuk sayılmayınca kötü niyetli dosya hata vermeden geçer", async () => {
  const m = await bozuk<Oku>(OKU, "    const k = x.indexOf(kap, son + 1);\n    if (k < 0) throw new TabloHatasi(BOZUK);", "    const k = x.indexOf(kap, son + 1);\n    if (k < 0) return;");
  const z = deflateZip([["xl/worksheets/sheet1.xml", new TextEncoder().encode(`<x>${"<row>".repeat(1000)}</x>`)]]);
  await assert.doesNotReject(m.tabloOku("kotu.xlsx", z), "kapanmayan satır sessizce geçti");
});
