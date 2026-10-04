/* OLUMSUZ KANIT — format motoru hesap kilidi (tests/format-motor.test.ts) gerçekten yakalıyor mu. Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11):
   src/format/hesap.ts (içe aktarma yapmaz) bellekte bozulur, geçici klasörden içe aktarılır; bozuk sürüm kilidin denetlediği sayıyı kaybetmeli. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";

const KAYNAK = readFileSync("src/format/hesap.ts", "utf8");
const klasor = mkdtempSync(join(tmpdir(), "format-bozan-"));
after(() => rmSync(klasor, { recursive: true, force: true }));

type Modul = typeof import("../../src/format/hesap.ts");
let sira = 0;
async function bozuk(eski: string, yeni: string): Promise<Modul> {
  assert.ok(KAYNAK.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const yol = join(klasor, `hesap-${sira++}.ts`);
  writeFileSync(yol, KAYNAK.replace(eski, yeni));
  return import(pathToFileURL(yol).href);
}

test("açma eğrisi çarpanı: C = 10 × In bozulunca Zs sınırı değişir (C63'te 0,365 Ω değil)", async () => {
  const m = await bozuk("Object.freeze({ B: 5, C: 10, D: 15 })", "Object.freeze({ B: 5, C: 5, D: 15 })");
  assert.notEqual(m.noktaHesap({ egri: "C", In: 63, zx: "0,21" }).zs, 0.365);
});

test("RCD açma süresi 200 ms bozulunca 201 ms'lik test yeterli sayılır", async () => {
  const m = await bozuk("export const RCD_SURE = 200;", "export const RCD_SURE = 300;");
  assert.equal(m.rcdTestYeter(30, "21", "201"), true);
});

test("PE kesiti çizelgesi kalkınca 50 mm² fazda 16 mm² PE yetersiz sayılmaz", async () => {
  const m = await bozuk("export const peSiniri = (faz: number) => (faz <= 16 ? faz : faz <= 35 ? 16 : faz / 2);", "export const peSiniri = (_faz: number) => 0;");
  assert.ok(!m.linyeHesap({ akim: 32, faz: "50", pe: "16" }, "")!.neden.includes("PE kesiti yetersiz"));
});

test("zemin izolasyonu 50 kΩ sınırı gevşeyince 50 kΩ uygun sayılır", async () => {
  const m = await bozuk("return d > 50 ?", "return d >= 50 ?");
  assert.equal(m.ziHesap({ direnc: "50" })!.uygun, true);
});
