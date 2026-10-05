/* OLUMSUZ KANIT — tests/performans-hesap.test.ts ve tests/performans.test.ts neyi koruyor (329). Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11):
   saf hesap bellekte bozulur, geçici klasörden içe aktarılır.
   1. Kazanç görünürlüğü olmasaydı denetçi ("kendi") kendi sayfasında kazancı görürdü (maket 148).
   2. Branş süzgeci olmasaydı mekanik yöneticisi elektrik raporlarını görürdü.
   3. "Kendi" süzgeci olmasaydı denetçi başkasının raporunu görürdü. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";

const klasor = mkdtempSync(join(tmpdir(), "performans-bozan-"));
after(() => rmSync(klasor, { recursive: true, force: true }));
let sira = 0;
type Hesap = typeof import("../../src/modules/performans/hesap.ts");
async function bozuk(eski: string, yeni: string): Promise<Hesap> {
  const metin = readFileSync("src/modules/performans/hesap.ts", "utf8");
  assert.ok(metin.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const hedef = join(klasor, `hesap-${sira++}.ts`);
  writeFileSync(hedef, metin.replace(eski, () => yeni));
  return import(pathToFileURL(hedef).href) as Promise<Hesap>;
}

test("kazanç görünürlüğü kalkınca denetçi kendi sayfasında kazancı görür (kilidin koruduğu açık)", async () => {
  const m = await bozuk(`export const kazancGorunur = (g: Gorunurluk) => g.kapsam !== "kendi";`, "export const kazancGorunur = (_g: Gorunurluk) => true;");
  assert.equal(m.kazancGorunur({ kapsam: "kendi", personelId: "k1" }), true, "denetçiye kazanç açıldı");
});

test("branş süzgeci kalkınca mekanik yöneticisi elektrik raporunu görür", async () => {
  const m = await bozuk("(g.kapsam === \"brans\" ? !!r.brans && g.branslar.includes(r.brans) :", "(g.kapsam === \"brans\" ? true :");
  assert.equal(m.raporGorunur({ kapsam: "brans", branslar: ["m"] }, { personelId: "k2", brans: "e" }), true, "branş dışı rapor göründü");
});

test("'kendi' süzgeci kalkınca denetçi başkasının raporunu görür", async () => {
  const m = await bozuk(": !!g.personelId && r.personelId === g.personelId);", ": true);");
  assert.equal(m.raporGorunur({ kapsam: "kendi", personelId: "k1" }, { personelId: "k2", brans: "m" }), true, "başkasının raporu göründü");
});
