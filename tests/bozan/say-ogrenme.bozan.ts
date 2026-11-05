/* OLUMSUZ KANIT — tests/say-ogrenme-saf.test.ts neyi koruyor (2026-11-05, göç 0121). Kaynak diskte DEĞİŞTİRİLMEZ: ogrenme.ts bellekte bozulur —
   (1) örnek seçimi önceki örnekleri atarsa öğrenilen silinir (K3); (2) gizleme adları atlarsa örnek başka işin adını taşır. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";

const klasor = mkdtempSync(join(tmpdir(), "bozan-ogrenme-"));
after(() => rmSync(klasor, { recursive: true, force: true }));
const kaynak = readFileSync(resolve("src/server/yz/ogrenme.ts"), "utf8");
async function bozuk(eski: string, yeni: string, ad: string): Promise<typeof import("../../src/server/yz/ogrenme.ts")> {
  assert.ok(kaynak.includes(eski), "bozulacak yer bulunmalı");
  const yol = join(klasor, `${ad}.ts`);
  writeFileSync(yol, kaynak.replace(eski, yeni).replace(/import type [^\n]*\n/, ""));
  return import(pathToFileURL(yol).href);
}

test("önceki örnekler atılınca öğrenilen silinir — kilit düşer", async () => {
  const m = await bozuk("for (const o of [...onceki, ...yeni]) hepsi.set(o.id, o);", "for (const o of yeni) hepsi.set(o.id, o);", "k3");
  const eski = [{ id: "e1", tur: "t", soru: "x", adimlar: "a", istek: 1, maliyet: 1, zaman: "", rapor: 0 }];
  assert.deepEqual(m.ornekSec(eski, [], []).map((x) => x.id), [], "bozuk: eski örnek düştü (gerçek kod ['e1'] verir)");
});

test("ad gizlenmeyince örnek adı taşır — kilit düşer", async () => {
  const m = await bozuk('out += s.slice(bas, k) + "<ad>"; bas = k + kucuk.length;', "out += s.slice(bas, k + kucuk.length); bas = k + kucuk.length;", "ad");
  assert.match(m.maskele("Ahmet Yılmaz söyledi", ["Ahmet Yılmaz"]), /Ahmet Yılmaz/);
});
