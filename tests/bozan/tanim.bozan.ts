/* OLUMSUZ KANIT — tests/tanim.test.ts neyi koruyor (kaynak diskte değiştirilmez; bellekte bozulur). (1) Anahtarlar sıralanmazsa aynı içerik farklı
   karma alır (cihaz boşuna yeniden indirir). (2) Sürüm denetimi gevşeyince bozuk istemci başlığı geçer. K1 (2026-10-04). */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";

const klasor = mkdtempSync(join(tmpdir(), "tanim-bozan-"));
after(() => rmSync(klasor, { recursive: true, force: true }));
let sira = 0;
async function bozuk<T>(dosya: string, eski: string, yeni: string): Promise<T> {
  let k = readFileSync(dosya, "utf8");
  assert.ok(k.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  k = k.replace(eski, yeni).replace('from "../sema/ortak.ts"', `from "${pathToFileURL(resolve("src/sema/ortak.ts")).href}"`);
  const yol = join(klasor, `${sira++}.ts`);
  writeFileSync(yol, k);
  return import(pathToFileURL(yol).href);
}

test("anahtar sıralaması kalkınca aynı içerik farklı karma alır", async () => {
  const m = await bozuk<typeof import("../../src/tanim/tanimlar.ts")>("src/tanim/tanimlar.ts", "Object.keys(v).sort()", "Object.keys(v)");
  assert.notEqual(m.duzenliJson({ b: 1, a: 2 }), m.duzenliJson({ a: 2, b: 1 }));
});

test("sürüm denetimi gevşeyince bozuk istemci başlığı geçer", async () => {
  const m = await bozuk<typeof import("../../src/server/api-surum.ts")>("src/server/api-surum.ts", "const n = /^\\d{1,6}$/.test(baslik) ? Number(baslik) : NaN;", "const n = Number(baslik);");
  assert.equal(m.istemciEskiMi("1e3"), false, "bozuk: sayı olmayan başlık geçti");
});
