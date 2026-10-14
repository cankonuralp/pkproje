/* OLUMSUZ KANIT — tests/say-markdown.test.ts (550, S.A.Y cevabı Markdown) neyi koruyor (kaynak diskte değiştirilmez; markdown.ts bellekte bozulur):
   1. Bağlantı adresi denetimi (yalnız http / https) kalkınca "javascript:" bağlantı olur — S.A.Y cevabındaki bağlantı betik çalıştırabilirdi. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";

const klasor = mkdtempSync(join(tmpdir(), "say-markdown-bozan-"));
after(() => rmSync(klasor, { recursive: true, force: true }));

test("adres denetimi kalkınca javascript: bağlantı olur", async () => {
  const k = readFileSync(resolve("src/modules/say/markdown.ts"), "utf8");
  const eski = "l.push(GUVENLI.test(b[1]) ?";
  assert.ok(k.includes(eski));
  const y = join(klasor, "m.ts");
  writeFileSync(y, k.replace(eski, "l.push(true ?"));
  const m = await import(pathToFileURL(y).href) as typeof import("../../src/modules/say/markdown.ts");
  assert.deepEqual(m.satirIci("[t](javascript:x)")[0], { t: "a", href: "javascript:x", ic: [{ t: "y", m: "t" }] }, "bozuk: javascript bağlantı");
});
