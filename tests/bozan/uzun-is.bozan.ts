/* OLUMSUZ KANIT — uzun tuş kilidi (tests/uzun-is.test.ts; kalıp 12) gerçekten yakalıyor mu. Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11):
   uzunIs.ts bellekte bozulur, geçici klasörden içe aktarılır. K0 (2026-10-03). */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";

const KAYNAK = readFileSync("src/components/tus/uzunIs.ts", "utf8");
const klasor = mkdtempSync(join(tmpdir(), "uzun-is-bozan-"));
after(() => rmSync(klasor, { recursive: true, force: true }));

test("kilit kalkınca iş sürerken ikinci basış ikinci işi başlatır (iki PDF dersi)", async () => {
  const eski = "if (mesgul) return undefined;";
  assert.ok(KAYNAK.includes(eski));
  const yol = join(klasor, "uzunIs.ts");
  writeFileSync(yol, KAYNAK.replace(eski, ""));
  const m: typeof import("../../src/components/tus/uzunIs.ts") = await import(pathToFileURL(yol).href);
  const k = m.uzunIsKilidi();
  let kosu = 0;
  const is = () => new Promise<void>((r) => { kosu++; setTimeout(r, 10); });
  const a = k.calistir(is), b = k.calistir(is);
  await Promise.all([a, b]);
  assert.equal(kosu, 2);
});
