/* OLUMSUZ KANIT — tests/etiket-okuma.test.ts (385) neyi koruyor. Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): etiket.ts bellekte bozulup geçici
   klasörden içe aktarılır (göreli içe aktarmalar mutlak yola çevrilir). İmal yılı denetimi kalkınca yapay zekânın yanlış okuduğu ya da uydurduğu yıl
   ("2099", "19x1") öneriye girer — denetçi "Önerileri uygula" deyince geçersiz yıl rapora yazılır, Kaydet'te reddedilir ya da (sınırda) yanlış kalır. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";

const KOK = resolve("src/server/yz");
const KAYNAK = readFileSync(join(KOK, "etiket.ts"), "utf8").replace(/from "(\.\.?\/[^"]+)"/g, (_, y) => `from "${pathToFileURL(resolve(KOK, y)).href}"`);
const SATIR = "    if (tanim[0] === \"imal\" && (!/^(19|20)\\d{2}$/.test(deger) || Number(deger) > yil)) continue;\n";
const gecici = mkdtempSync(join(tmpdir(), "etiket-okuma-bozan-"));
after(() => rmSync(gecici, { recursive: true, force: true }));

test("imal yılı denetimi kalkınca gelecek ve bozuk yıl öneriye girer (kilidin koruduğu açık)", async () => {
  assert.ok(KAYNAK.includes(SATIR), "bozulacak satır kaynakta yok");
  const yol = join(gecici, "etiket-bozuk.ts");
  writeFileSync(yol, KAYNAK.replace(SATIR, () => ""));
  const m = await import(pathToFileURL(yol).href) as typeof import("../../src/server/yz/etiket.ts");
  const cevap = (deger: string) => ({ content: [{ type: "text", text: JSON.stringify({ alanlar: [{ alan: "imal", deger, guven: "yuksek" }], not: null }) }] });
  const bugun = new Date("2026-10-08T09:00:00Z");
  assert.deepEqual(m.etiketYanitiCoz(cevap("2099"), bugun).okunan.map((x) => x.deger), ["2099"], "bozuk: gelecek yıl öneride");
  assert.deepEqual(m.etiketYanitiCoz(cevap("19x1"), bugun).okunan.map((x) => x.deger), ["19x1"], "bozuk: bozuk yıl öneride");
});
