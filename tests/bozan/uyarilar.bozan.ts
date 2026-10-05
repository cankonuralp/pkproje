/* OLUMSUZ KANIT — tests/uyarilar.test.ts neyi koruyor (331). Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): görünürlük kuralı bellekte bozulur,
   geçici klasörden içe aktarılır.
   1. "Kendi" süzgeci olmasaydı denetçi başkasındaki cihazın ve başkasının eğitiminin uyarısını görürdü. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";

const klasor = mkdtempSync(join(tmpdir(), "uyarilar-bozan-"));
after(() => rmSync(klasor, { recursive: true, force: true }));
type Sema = typeof import("../../src/modules/uyarilar/sema.ts");

test("'kendi' süzgeci kalkınca denetçi başkasının uyarısını görür (kilidin koruduğu açık)", async () => {
  const eski = "ben === null || (!!kisiId && kisiId === ben)";
  const metin = readFileSync("src/modules/uyarilar/sema.ts", "utf8");
  assert.ok(metin.includes(eski), "bozulacak satır kaynakta yok");
  const hedef = join(klasor, "sema.ts");
  writeFileSync(hedef, metin.replace(eski, () => "true"));
  const m = (await import(pathToFileURL(hedef).href)) as Sema;
  assert.equal(m.uyariGorunur("ben", "baskasi"), true, "başkasının uyarısı göründü");
  assert.equal(m.uyariGorunur("ben", null), true, "depodaki cihazın uyarısı göründü");
});
