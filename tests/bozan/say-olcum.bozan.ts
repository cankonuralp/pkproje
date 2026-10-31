/* OLUMSUZ KANIT — tests/say-olcum.test.ts neyi koruyor (2026-10-31, L8). Kaynak diskte DEĞİŞTİRİLMEZ: olcum.ts bellekte bozulur — düşünce ayıklanmazsa
   modelin iç düşüncesi Ar-Ge kaydına girer. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";

const klasor = mkdtempSync(join(tmpdir(), "bozan-olcum-"));
after(() => rmSync(klasor, { recursive: true, force: true }));
test("düşünce ayıklanmayınca kilit düşer", async () => {
  const k = readFileSync(resolve("src/server/yz/olcum.ts"), "utf8"), eski = `if (x.type === "text" && typeof x.text === "string") b.push({ type: "text", text: x.text });`;
  assert.ok(k.includes(eski));
  const yol = join(klasor, "olcum.ts");
  writeFileSync(yol, k.replace(eski, `if (x.type === "text" && typeof x.text === "string") b.push({ type: "text", text: x.text }); else if (x.type === "thinking") b.push(x);`)
    .replace(/import type [^\n]*\n/, ""));
  const m = await import(pathToFileURL(yol).href) as typeof import("../../src/server/yz/olcum.ts");
  assert.match(JSON.stringify(m.argeIcerigi([{ rol: "assistant", icerik: [{ type: "thinking", thinking: "iç düşünce" }] }])), /iç düşünce/);
});
