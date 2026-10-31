/* OLUMSUZ KANIT — tests/say-hiz.test.ts neyi koruyor (2026-10-31, L7). Kaynak diskte DEĞİŞTİRİLMEZ: okuma.ts bellekte bozulur (1 saatlik yazma 1,25 kat
   sayılırsa maliyet düşük görünür ve aylık sınır geç dolar). */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";

const klasor = mkdtempSync(join(tmpdir(), "bozan-hiz-"));
after(() => rmSync(klasor, { recursive: true, force: true }));
test("1 saatlik yazma 1,25 kat sayılınca kilit düşer", async () => {
  const dosya = "src/server/yz/okuma.ts", k = readFileSync(resolve(dosya), "utf8"), eski = "y1 * k.giris * 200";
  assert.ok(k.includes(eski));
  const yol = join(klasor, "okuma.ts"), kok = dirname(resolve(dosya));
  writeFileSync(yol, k.replace(eski, "y1 * k.giris * 125").replace(/from "(\.{1,2}\/[^"]+)"/g, (_, p: string) => `from "${pathToFileURL(resolve(kok, p)).href}"`)
    .replace(/from "zod"/g, `from "${import.meta.resolve("zod")}"`));
  const m = await import(pathToFileURL(yol).href) as typeof import("../../src/server/yz/okuma.ts");
  const taban = m.onbellekliMaliyet("haiku", { giris: 1_000_000, okunan: 0, yazilan: 0, cikis: 0 });
  assert.notEqual(m.onbellekliMaliyet("haiku", { giris: 0, okunan: 0, yazilan: 0, yazilan1s: 1_000_000, cikis: 0 }), taban * 2);
});
