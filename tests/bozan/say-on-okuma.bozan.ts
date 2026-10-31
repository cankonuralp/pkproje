/* OLUMSUZ KANIT — tests/say-on-okuma.test.ts neyi koruyor (2026-10-31, L4). Kaynak diskte DEĞİŞTİRİLMEZ: malzeme.ts bellekte bozulur. 1. Saniye okunmazsa aynı
   dakikadaki fotoğraflar eklenme sırasında kalır. 2. Zaman yakınlığı denetlenmezse 11 dakika sonraki etiket başka ekipmanın genel görünüşüne bağlanır. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";

const klasor = mkdtempSync(join(tmpdir(), "bozan-on-okuma-"));
after(() => rmSync(klasor, { recursive: true, force: true }));
let sira = 0;
type M = typeof import("../../src/modules/say/malzeme.ts");
async function bozuk(eski: string, yeni: string): Promise<M> {
  const k = readFileSync(resolve("src/modules/say/malzeme.ts"), "utf8");
  assert.ok(k.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const yol = join(klasor, `${sira++}.ts`);
  writeFileSync(yol, k.replace(eski, () => yeni));
  return import(pathToFileURL(yol).href) as Promise<M>;
}
test("1. saniye okunmayınca kilit düşer", async () => {
  const m = await bozuk("${sn !== null ? `:${iki2(sn)}` : \"\"}", "");
  assert.equal(m.cekimAdindan("WhatsApp Image 2026-10-30 at 13.39.31.jpeg"), "2026-10-30 13:39");
});
test("2. zaman yakınlığı kalkınca kilit düşer", async () => {
  const m = await bozuk("Math.abs(x - y) <= 300", "true");
  const e = (fno: number, cekim: string, sinif: "E" | "T") => ({ fno, cekim, okuma: { sinif, yazi: "", tarif: "" } });
  assert.deepEqual(m.fotoCiftleri([e(3, "2026-10-30 13:34:00", "E"), e(4, "2026-10-30 13:45:00", "T")]).ciftler, [[3, 4]]);
});
