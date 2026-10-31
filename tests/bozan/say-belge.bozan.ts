/* OLUMSUZ KANIT — tests/say-belge.test.ts neyi koruyor (2026-10-31, kalem 9). Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): islem.ts bellekte bozulup geçici klasörden
   içe aktarılır. 1. Yuvanın türü denetlenmezse fotoğraf PDF yuvasına gider (ekranın işlevi reddeder ama S.A.Y nedenini bilmez). */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";
import { belgeBaglami } from "../say-belge.test.ts";

const klasor = mkdtempSync(join(tmpdir(), "bozan-say-belge-"));
after(() => rmSync(klasor, { recursive: true, force: true }));
type IslemM = typeof import("../../src/server/yz/islem.ts");
const KAYNAK = "src/server/yz/islem.ts";

test("1. yuvanın türü denetlenmeyince kilit düşer", async () => {
  const kaynak = readFileSync(resolve(KAYNAK), "utf8");
  const eski = "  if (!(turler as readonly string[]).includes(k.tur)) return";
  assert.ok(kaynak.includes(eski));
  const yol = join(klasor, "islem.ts"), kok = dirname(resolve(KAYNAK));
  writeFileSync(yol, kaynak.replace(eski, "  if (false) return").replace(/from "(\.{1,2}\/[^"]+)"/g, (_, p: string) => `from "${pathToFileURL(resolve(kok, p)).href}"`)
    .replace(/from "zod"/g, `from "${import.meta.resolve("zod")}"`));
  const m = await import(pathToFileURL(yol).href) as IslemM;
  assert.equal(typeof (await m.ekBelgesi(belgeBaglami({ ad: "fis.jpg", tur: "foto", anahtar: "k" }).b, "F01", ["pdf"])), "object", "bozuk: fotoğraf PDF yuvasına geçti");
});
