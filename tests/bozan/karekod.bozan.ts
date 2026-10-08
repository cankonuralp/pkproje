/* OLUMSUZ KANIT — tests/karekod.test.ts neyi koruyor (407). Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): karekod.ts bellekte bozulup geçici
   klasörden içe aktarılır. O zaman:
   1) art arda koyu modüller yanlış sayılırsa (çizilen dikdörtgen bir modül kısa) karekod OKUNMAZ — telefon uygulaması anahtarı alamaz;
   2) satırlar kayarsa (her ikinci satır bir aşağı) karekod okunmaz. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";
import { otpauthAdresi } from "../../src/server/yonetim/totp.ts";
import { yolOku } from "../yardimci/karekod-oku.ts";

/* qrcode paketi geçici klasörden de bulunsun: içe aktarma mutlak yola */
const qrcodeYolu = pathToFileURL(createRequire(import.meta.url).resolve("qrcode")).href;
const KAYNAK = readFileSync(resolve("src/server/yonetim/karekod.ts"), "utf8").replace('from "qrcode"', `from "${qrcodeYolu}"`);
const gecici = mkdtempSync(join(tmpdir(), "karekod-bozan-"));
let sira = 0;
type Karekod = typeof import("../../src/server/yonetim/karekod.ts");
async function bozuk(eski: string, yeni: string): Promise<Karekod> {
  assert.ok(KAYNAK.includes(eski), `bozulacak satır kaynakta yok: ${eski.slice(0, 60)}`);
  const yol = join(gecici, `k${++sira}.ts`);
  writeFileSync(yol, KAYNAK.replace(eski, () => yeni));
  return import(pathToFileURL(yol).href);
}
after(() => rmSync(gecici, { recursive: true, force: true }));
const ADRES = otpauthAdresi("JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP", "reis@probata.example");

test("1) art arda koyu modül bir eksik çizilirse karekod okunmaz", async () => {
  const K = await bozuk("      parca.push(`M${x} ${y}h${u}v1h-${u}z`);", "      parca.push(`M${x} ${y}h${u - 1}v1h-${u - 1}z`);");
  assert.equal(yolOku(K.karekod(ADRES)), null, "bozuk: karekod okundu");
});

test("2) satır bir aşağı kayarsa karekod okunmaz", async () => {
  const K = await bozuk("      parca.push(`M${x} ${y}h${u}v1h-${u}z`);", "      parca.push(`M${x} ${y + (y % 2)}h${u}v1h-${u}z`);");
  assert.equal(yolOku(K.karekod(ADRES)), null, "bozuk: karekod okundu");
});
