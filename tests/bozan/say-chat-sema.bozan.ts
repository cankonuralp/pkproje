/* OLUMSUZ KANIT — tests/say-chat-sema.test.ts (523, S.A.Y Chat ayarı ve dağılımı) neyi koruyor. Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11):
   src/modules/say-chat/sema.ts bellekte bozulur, geçici klasörden içe aktarılır (göreli içe aktarmalar ve zod mutlak yola çevrilir). O zaman:
   1) tekil alan denetimi kalkınca iki satır aynı alana yazar (sonraki öncekini sessizce ezer);
   2) kayıttan gelen (künye) alan süzgeci kalkınca denetçinin mesajı firma / tesis künyesini değiştirebilir;
   3) fazla satırlar yoruma eklenmeyince yönergeden fazla yazılan not kaybolur. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";
import { SABLONLAR } from "../../src/format/sablonlar.ts";
import { FormatTanimi } from "../../src/format/tanim.ts";

const kok = resolve("src/modules/say-chat");
const ZOD = pathToFileURL(resolve("node_modules/zod/index.js")).href;
const KAYNAK = readFileSync(join(kok, "sema.ts"), "utf8").replace('from "zod"', `from "${ZOD}"`)
  .replace(/from "(\.\.?\/[^"]+)"/g, (_, y: string) => `from "${pathToFileURL(resolve(kok, y)).href}"`);
const gecici = mkdtempSync(join(tmpdir(), "say-chat-bozan-"));
after(() => rmSync(gecici, { recursive: true, force: true }));
let sira = 0;
type Sema = typeof import("../../src/modules/say-chat/sema.ts");
async function bozuk(eski: string, yeni: string): Promise<Sema> {
  assert.ok(KAYNAK.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const yol = join(gecici, `sema-${sira++}.ts`);
  writeFileSync(yol, KAYNAK.replace(eski, () => yeni));
  return import(pathToFileURL(yol).href) as Promise<Sema>;
}
const IC = FormatTanimi.parse(SABLONLAR.ZPKR02.tanim);

test("1. tekil alan denetimi kalkınca iki satır aynı alana yazar (kilidin koruduğu açık)", async () => {
  const m = await bozuk("    if (gorulen.has(s.alan)) return", "    if (false) return");
  const r = m.tanimDenetle(IC, { satirlar: [{ ad: "A", alan: "e:marka", hazir: "" }, { ad: "B", alan: "e:marka", hazir: "" }] });
  assert.equal(r.durum, "tamam", "bozuk: aynı alan iki satırda kabul edildi");
});

test("2. künye süzgeci kalkınca kayıttan gelen alan seçilir (kilidin koruduğu açık)", async () => {
  const m = await bozuk("if (!a.ekipman && !a.kaynak && !a.formul && a.tur !== \"coklu\") l.push", "if (!a.ekipman && !a.formul && a.tur !== \"coklu\") l.push");
  const kunye = IC.bolumler.flatMap((x) => (x.blok === "bilgi" ? x.alanlar : [])).find((x) => x.kaynak)!;
  assert.ok(m.chatAlanlari(IC).some(([k]) => k === `a:${kunye.id}`), "bozuk: künye alanı seçeneklerde");
});

test("3. fazla satırlar yoruma eklenmeyince not kaybolur (kilidin koruduğu açık)", async () => {
  const m = await bozuk("  if (fazla.length) degerler.yorum = [degerler.yorum, ...fazla].filter(Boolean).join(\"\\n\");\n", "");
  const d = m.dagit({ satirlar: [{ ad: "Not", alan: "yorum", hazir: "" }], okunacak: [] }, ["birinci", "ikinci"]);
  assert.equal(d.degerler.yorum, "birinci", "bozuk: fazla satır yoruma eklenmedi");
});
